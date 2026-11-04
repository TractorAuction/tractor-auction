"use client"

import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send, Sparkles } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Badge } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { STATUS_META } from "@/lib/outreach/pipeline"
import { findStage } from "@/lib/outreach/templates"
import { cn } from "@/lib/utils"
import type { OutreachContact } from "@/types"

type ItemState =
  | { phase: "idle" }
  | { phase: "drafting" }
  | { phase: "draft_error"; error: string }
  | { phase: "drafted" }
  | { phase: "sending" }
  | { phase: "sent" }
  | { phase: "send_error"; error: string }

type Draft = { to: string; subject: string; body: string; approved: boolean }

const DRAFT_CONCURRENCY = 3
// Resend's default limit is 2 requests a second; stay well under it.
const SEND_GAP_MS = 700

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Select → draft all → review each → confirm once → send one by one.
 *
 * Sends go through /api/outreach/send one at a time, the same endpoint the
 * single composer uses, so the admin check, the 30-day duplicate-address guard
 * and the status update all still apply per email.
 */
export function OutreachBatch({
  stageId,
  contacts,
}: {
  stageId: string
  contacts: OutreachContact[]
}) {
  const stage = findStage(stageId)

  // Two rows can share one inbox (Ritchie Bros. and IronPlanet). Only the
  // first row for an address is offered; the rest are shown but locked.
  // The first row's email names the others and advances them too.
  const { sharedWith, covers } = useMemo(() => {
    const firstByEmail = new Map<string, OutreachContact>()
    const shared = new Map<string, string>()
    const covered = new Map<string, OutreachContact[]>()
    for (const contact of contacts) {
      const key = contact.contact_email!.trim().toLowerCase()
      const first = firstByEmail.get(key)
      if (first) {
        shared.set(contact.id, first.company_name)
        covered.set(first.id, [...(covered.get(first.id) ?? []), contact])
      } else {
        firstByEmail.set(key, contact)
      }
    }
    return { sharedWith: shared, covers: covered }
  }, [contacts])

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(contacts.filter((c) => !sharedWith.has(c.id)).map((c) => c.id))
  )
  const [states, setStates] = useState<Record<string, ItemState>>({})
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [step, setStep] = useState<"select" | "review" | "confirm" | "sending" | "done">("select")

  const setState = (id: string, state: ItemState) =>
    setStates((current) => ({ ...current, [id]: state }))
  const patchDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }))

  const chosen = contacts.filter((contact) => selected.has(contact.id))
  const drafted = chosen.filter((contact) => drafts[contact.id])
  const approved = drafted.filter(
    (contact) => drafts[contact.id].approved && states[contact.id]?.phase !== "sent"
  )
  const draftingCount = chosen.filter((c) => states[c.id]?.phase === "drafting").length
  const sentCount = chosen.filter((c) => states[c.id]?.phase === "sent").length
  const failedSends = chosen.filter((c) => states[c.id]?.phase === "send_error")

  async function draftOne(contact: OutreachContact) {
    setState(contact.id, { phase: "drafting" })
    try {
      const response = await fetch("/api/outreach/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          stageId,
          alsoCovers: (covers.get(contact.id) ?? []).map((other) => other.company_name),
        }),
      })
      const payload = await response.json()
      if (payload.error) throw new Error(payload.error)
      setDrafts((current) => ({
        ...current,
        [contact.id]: {
          to: contact.contact_email ?? "",
          subject: payload.data.subject,
          body: payload.data.body,
          approved: true,
        },
      }))
      setState(contact.id, { phase: "drafted" })
    } catch (cause) {
      setState(contact.id, {
        phase: "draft_error",
        error: cause instanceof Error ? cause.message : "Failed to draft",
      })
    }
  }

  async function draftAll() {
    setStep("review")
    const queue = chosen.filter((contact) => !drafts[contact.id])
    const workers = Array.from({ length: Math.min(DRAFT_CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) await draftOne(queue.shift()!)
    })
    await Promise.all(workers)
  }

  async function sendApproved() {
    setStep("sending")
    for (const contact of approved) {
      const draft = drafts[contact.id]
      setState(contact.id, { phase: "sending" })
      try {
        const response = await fetch("/api/outreach/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId: contact.id,
            to: draft.to.trim(),
            subject: draft.subject,
            body: draft.body,
            alsoContactIds: (covers.get(contact.id) ?? []).map((other) => other.id),
          }),
        })
        const payload = await response.json()
        if (payload.error) throw new Error(payload.error)
        setState(contact.id, { phase: "sent" })
      } catch (cause) {
        setState(contact.id, {
          phase: "send_error",
          error: cause instanceof Error ? cause.message : "Failed to send",
        })
      }
      await sleep(SEND_GAP_MS)
    }
    setStep("done")
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No companies need a &ldquo;{stage?.name}&rdquo; email right now.
        <span className="text-xs">
          {stageId === "first_contact"
            ? "Companies show up here once they have a contact email and haven't been emailed."
            : stageId === "follow_up"
              ? "Companies show up here when their follow-up date arrives."
              : "Companies show up here when their status moves to this stage."}
        </span>
        <Link href="/admin/outreach" className="text-primary hover:underline">
          Back to Outreach
        </Link>
      </div>
    )
  }

  /* ---------- Step 1: choose companies ---------- */
  if (step === "select") {
    const selectable = contacts.filter((c) => !sharedWith.has(c.id))
    const allOn = selectable.every((c) => selected.has(c.id))
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Step 1 of 3.</span> Choose who gets a &ldquo;
            {stage?.name}&rdquo; email. {stage?.description}
          </p>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() =>
              setSelected(allOn ? new Set() : new Set(selectable.map((c) => c.id)))
            }
          >
            {allOn ? "Select none" : "Select all"}
          </button>
        </div>

        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
          {contacts.map((contact) => {
            const shared = sharedWith.get(contact.id)
            return (
              <li key={contact.id}>
                <label
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    shared ? "opacity-60" : "cursor-pointer hover:bg-muted/30"
                  )}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    disabled={Boolean(shared)}
                    checked={selected.has(contact.id)}
                    onChange={(event) => {
                      const next = new Set(selected)
                      if (event.target.checked) next.add(contact.id)
                      else next.delete(contact.id)
                      setSelected(next)
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                      {contact.company_name}
                      {contact.tier && <span className="text-xs text-muted-foreground">Tier {contact.tier}</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {contact.contact_email}
                      {shared && ` · same address as ${shared}, so one email covers both`}
                      {covers.has(contact.id) &&
                        ` · also covers ${covers.get(contact.id)!.map((o) => o.company_name).join(", ")}`}
                    </span>
                  </div>
                  <Badge tone={STATUS_META[contact.status].tone}>
                    {STATUS_META[contact.status].label}
                  </Badge>
                </label>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-3">
          <Button onClick={draftAll} disabled={selected.size === 0}>
            <Sparkles />
            Write {selected.size} draft{selected.size === 1 ? "" : "s"}
          </Button>
          <span className="text-xs text-muted-foreground">Nothing is sent at this step.</span>
        </div>
      </div>
    )
  }

  /* ---------- Steps 2–3: review, confirm, send ---------- */
  const locked = step === "sending" || step === "done"

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-lg border border-border bg-background/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground">
          {step === "done" ? (
            <>
              <span className="font-semibold">Done.</span> {sentCount} sent
              {failedSends.length > 0 && `, ${failedSends.length} failed (see below)`}.
            </>
          ) : step === "sending" ? (
            <>
              <span className="font-semibold">Sending…</span> {sentCount} of {approved.length + sentCount} sent. Keep
              this page open.
            </>
          ) : draftingCount > 0 ? (
            <>
              <span className="font-semibold">Step 2 of 3.</span> Writing drafts… {drafted.length} of{" "}
              {chosen.length} ready.
            </>
          ) : (
            <>
              <span className="font-semibold">Step 2 of 3.</span> Read each draft, edit anything that&apos;s
              off, and untick any you don&apos;t want to send. {approved.length} approved.
            </>
          )}
        </p>
        {step === "review" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("select")} disabled={draftingCount > 0}>
              Change selection
            </Button>
            <Button
              size="sm"
              onClick={() => setStep("confirm")}
              disabled={draftingCount > 0 || approved.length === 0}
            >
              <Send />
              Send {approved.length} email{approved.length === 1 ? "" : "s"}…
            </Button>
          </div>
        )}
        {step === "done" && (
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/outreach" />}>
            Back to Outreach
          </Button>
        )}
      </div>

      {/* The one approval */}
      {step === "confirm" && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-foreground">
            Step 3 of 3. Send {approved.length} email{approved.length === 1 ? "" : "s"}? This can&apos;t be undone.
          </p>
          <ul className="flex flex-col gap-0.5 text-sm text-foreground">
            {approved.map((contact) => (
              <li key={contact.id}>
                {contact.company_name}
                {covers.has(contact.id) &&
                  ` + ${covers.get(contact.id)!.map((o) => o.company_name).join(", ")}`}{" "}
                <span className="text-muted-foreground">→ {drafts[contact.id].to.trim()}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("review")}>
              Back to drafts
            </Button>
            <Button size="sm" onClick={sendApproved}>
              <Send />
              Yes, send {approved.length}
            </Button>
          </div>
        </div>
      )}

      {/* Draft cards */}
      <ol className="flex flex-col gap-3">
        {chosen.map((contact) => {
          const state = states[contact.id] ?? { phase: "idle" }
          const draft = drafts[contact.id]
          const sent = state.phase === "sent"

          return (
            <li
              key={contact.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border bg-background p-3 sm:p-4",
                sent ? "border-primary/40 bg-primary/5" : draft && !draft.approved ? "border-border opacity-60" : "border-border"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  {contact.company_name}
                  {covers.has(contact.id) && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      + {covers.get(contact.id)!.map((o) => o.company_name).join(", ")}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  {state.phase === "drafting" && (
                    <><Loader2 className="size-3.5 animate-spin" /> Writing…</>
                  )}
                  {state.phase === "sending" && (
                    <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                  )}
                  {sent && (
                    <span className="flex items-center gap-1 font-medium text-primary">
                      <CheckCircle2 className="size-3.5" /> Sent · marked contacted
                    </span>
                  )}
                  {draft && !sent && !locked && step !== "confirm" && (
                    <label className="flex cursor-pointer items-center gap-1.5 font-medium text-foreground">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={draft.approved}
                        onChange={(event) => patchDraft(contact.id, { approved: event.target.checked })}
                      />
                      Send this one
                    </label>
                  )}
                </span>
              </div>

              {state.phase === "draft_error" && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {state.error}
                  <Button size="xs" variant="outline" onClick={() => draftOne(contact)}>
                    <RotateCcw /> Try again
                  </Button>
                </div>
              )}
              {state.phase === "send_error" && (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  Not sent: {state.error}
                </p>
              )}

              {draft && (
                <fieldset disabled={locked || step === "confirm" || sent} className="flex flex-col gap-2">
                  <input
                    value={draft.to}
                    onChange={(event) => patchDraft(contact.id, { to: event.target.value })}
                    aria-label={`Recipient for ${contact.company_name}`}
                    className={cn(fieldClass, "h-9 py-0 text-xs text-muted-foreground")}
                  />
                  <input
                    value={draft.subject}
                    onChange={(event) => patchDraft(contact.id, { subject: event.target.value })}
                    aria-label={`Subject for ${contact.company_name}`}
                    className={cn(fieldClass, "h-9 py-0 font-medium")}
                  />
                  <textarea
                    value={draft.body}
                    onChange={(event) => patchDraft(contact.id, { body: event.target.value })}
                    aria-label={`Email body for ${contact.company_name}`}
                    rows={10}
                    className={cn(fieldClass, "leading-relaxed")}
                  />
                  {step === "review" && (
                    <div>
                      <Button size="xs" variant="ghost" onClick={() => draftOne(contact)}>
                        <RotateCcw /> Rewrite this draft
                      </Button>
                    </div>
                  )}
                </fieldset>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
