"use client"

import { Loader2, Send, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { OUTREACH_STAGES, resolveAngle } from "@/lib/outreach/templates"
import type { OutreachContact } from "@/types"

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function OutreachComposer({ contact }: { contact: OutreachContact }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [stageId, setStageId] = useState(OUTREACH_STAGES[0].id)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [to, setTo] = useState(contact.contact_email ?? "")
  const [busy, setBusy] = useState<"draft" | "send" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const angle = resolveAngle(contact)

  async function draft() {
    setBusy("draft")
    setError(null)
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
    if (!to.trim()) {
      setError("Add a recipient address first.")
      return
    }
    setBusy("send")
    setError(null)
    try {
      const response = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, to, subject, body }),
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
    }
  }

  if (!open) {
    return (
      <Button size="xs" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="size-3" />
        Compose
      </Button>
    )
  }

  return (
    <div className="flex w-full min-w-72 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Email {contact.company_name}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close composer"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <select
          value={stageId}
          onChange={(event) => setStageId(event.target.value)}
          className={`${fieldClass} h-8 py-0`}
        >
          {OUTREACH_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        <Button size="xs" onClick={draft} disabled={busy !== null}>
          {busy === "draft" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          Draft
        </Button>
      </div>

      {/* The angle is derived from the tier, so the sender can see what the
          email will lead with before spending a generation on it. */}
      <p className="text-[11px] text-muted-foreground">
        Angle: {angle.name} · asks for{" "}
        {contact.integration_request ?? angle.defaultAsk}
      </p>

      <input
        type="email"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        placeholder="recipient@example.com"
        className={`${fieldClass} h-8 py-0`}
      />

      {(subject || body) && (
        <>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
            className={`${fieldClass} h-8 py-0`}
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={9}
            className={`${fieldClass} font-mono text-xs`}
          />
          <p className="text-[11px] text-muted-foreground">
            Drafted by Claude. Read it before sending — edits here are what goes out.
          </p>
          <Button size="xs" onClick={send} disabled={busy !== null || sent}>
            {busy === "send" ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
            {sent ? "Sent" : "Send"}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
