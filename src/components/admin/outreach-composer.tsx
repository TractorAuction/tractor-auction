"use client"

import { CheckCircle2, Loader2, Send, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { suggestedEmailStage } from "@/lib/outreach/pipeline"
import { OUTREACH_STAGES, findStage, resolveAngle } from "@/lib/outreach/templates"
import { cn } from "@/lib/utils"
import type { OutreachContact } from "@/types"

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * Draft → review → confirm → send. Rendered open; the row decides when to
 * show it. Sending takes two clicks on purpose: an outreach email can't be
 * unsent, and the second click shows exactly where it is going.
 */
export function OutreachComposer({
  contact,
  onClose,
}: {
  contact: OutreachContact
  onClose: () => void
}) {
  const router = useRouter()
  const [stageId, setStageId] = useState(suggestedEmailStage(contact.status))
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [to, setTo] = useState(contact.contact_email ?? "")
  const [busy, setBusy] = useState<"draft" | "send" | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const angle = resolveAngle(contact)
  const stage = findStage(stageId)
  const hasDraft = Boolean(subject || body)

  async function draft() {
    setBusy("draft")
    setError(null)
    setConfirming(false)
    try {
      const response = await fetch("/api/outreach/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, stageId }),
      })
      const payload = await response.json()
      if (payload.error) throw new Error(payload.error)
      setSubject(payload.data.subject)
      setBody(payload.data.body)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to draft email")
    } finally {
      setBusy(null)
    }
  }

  async function send() {
    setBusy("send")
    setError(null)
    try {
      const response = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, to: to.trim(), subject, body }),
      })
      const payload = await response.json()
      if (payload.error) throw new Error(payload.error)
      setSent(true)
      // The row's status and follow-up date changed server side.
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to send email")
    } finally {
      setBusy(null)
      setConfirming(false)
    }
  }

  function requestSend() {
    if (!to.trim()) {
      setError("Add a recipient address first.")
      return
    }
    if (!subject.trim() || !body.trim()) {
      setError("The subject and body can't be empty.")
      return
    }
    setError(null)
    setConfirming(true)
  }

  if (sent) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-foreground">Sent to {to}</p>
            <p className="text-xs text-muted-foreground">
              Marked as contacted. A follow-up reminder is set for 7 days from now.
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          Email {contact.company_name}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close email composer"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Step 1: what kind of email */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">1. Choose the email type</span>
        <div className="flex flex-wrap gap-1.5">
          {OUTREACH_STAGES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setStageId(option.id)}
              aria-pressed={option.id === stageId}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors pointer-coarse:min-h-11",
                option.id === stageId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {stage?.description} Leads with: {angle.name.toLowerCase()} · asks for{" "}
          {contact.integration_request ?? angle.defaultAsk}.
        </p>
      </div>

      {/* Step 2: who it goes to */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">2. Send to</span>
        <input
          type="email"
          value={to}
          onChange={(event) => {
            setTo(event.target.value)
            setConfirming(false)
          }}
          placeholder="name@company.com"
          className={`${fieldClass} h-9 py-0`}
        />
      </label>

      {/* Step 3: draft and review */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          3. Write the email with AI, then read and edit it
        </span>
        <div>
          <Button size="sm" variant={hasDraft ? "outline" : "default"} onClick={draft} disabled={busy !== null}>
            {busy === "draft" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy === "draft" ? "Writing…" : hasDraft ? "Rewrite draft" : "Write draft"}
          </Button>
        </div>

        {hasDraft && (
          <>
            <input
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value)
                setConfirming(false)
              }}
              placeholder="Subject"
              aria-label="Subject"
              className={`${fieldClass} h-9 py-0 font-medium`}
            />
            <textarea
              value={body}
              onChange={(event) => {
                setBody(event.target.value)
                setConfirming(false)
              }}
              rows={12}
              aria-label="Email body"
              className={`${fieldClass} leading-relaxed`}
            />
            <p className="text-xs text-muted-foreground">
              What&apos;s in these boxes is exactly what gets sent. Check names, claims and the ask.
            </p>
          </>
        )}
      </div>

      {/* Step 4: send, with a confirmation step */}
      {hasDraft &&
        (confirming ? (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              Send this email to <span className="font-semibold">{to.trim()}</span>? It can&apos;t be
              undone.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={busy !== null}>
                Cancel
              </Button>
              <Button size="sm" onClick={send} disabled={busy !== null}>
                {busy === "send" ? <Loader2 className="animate-spin" /> : <Send />}
                {busy === "send" ? "Sending…" : "Yes, send it"}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button size="sm" onClick={requestSend} disabled={busy !== null}>
              <Send />
              Send email…
            </Button>
          </div>
        ))}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
