import * as React from "react"
import {
  CheckCircle2Icon,
  EyeIcon,
  InfoIcon,
  Loader2Icon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { type EmailTemplate, type EmailVersion } from "@/lib/console-data"
import { aiSampleFor, detectPlaceholders, emailOk } from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"

/**
 * Centered "Send test email" modal — configure recipient + placeholder values,
 * then a sending → sent flow. Mirrors the hi-fi `SendTestDrawer`, but as a
 * centered Dialog per the design spec.
 */
export function SendTestModal({
  open,
  tpl,
  cur,
  initialSent,
  onClose,
}: {
  open: boolean
  tpl: EmailTemplate
  cur: EmailVersion
  initialSent?: boolean
  onClose: () => void
}) {
  const placeholders = detectPlaceholders(cur.subject + " " + cur.body)
  const [email, setEmail] = React.useState(
    initialSent ? "amara.okeke@ginja.ai" : ""
  )
  const [sampleMode, setSampleMode] = React.useState<"ai" | "configure">("ai")
  const [vals, setVals] = React.useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(!!initialSent)

  const valid = emailOk(email)
  const resolve = (p: string) =>
    sampleMode === "ai"
      ? aiSampleFor(p)
      : vals[p] != null && vals[p] !== ""
        ? vals[p]
        : aiSampleFor(p)
  const previewSubject = cur.subject.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    resolve(k)
  )

  const goAi = () => {
    setSampleMode("ai")
    setAiLoading(true)
    window.setTimeout(() => setAiLoading(false), 1100)
  }
  const aiFill = () => {
    setAiLoading(true)
    window.setTimeout(() => {
      const n: Record<string, string> = {}
      placeholders.forEach((p) => (n[p] = aiSampleFor(p)))
      setVals(n)
      setSampleMode("configure")
      setAiLoading(false)
    }, 1100)
  }
  const send = () => {
    setSending(true)
    window.setTimeout(() => {
      setSending(false)
      setSent(true)
      toast(`Test email sent to ${email.trim()}.`)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[86vh] w-[520px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex shrink-0 items-center gap-[11px] border-b px-[18px] py-4">
          <span className="grid size-[38px] place-items-center rounded-[10px] bg-primary/[0.12] text-primary [&>svg]:size-[17px]">
            <SendIcon />
          </span>
          <div>
            <DialogTitle className="font-heading text-[15px] font-bold">
              Send test email
            </DialogTitle>
            <div className="text-[12px] text-muted-foreground">
              {tpl.name} · {cur.v}
            </div>
          </div>
        </div>

        {sent ? (
          <>
            <div className="flex flex-col items-center gap-0.5 overflow-y-auto p-[18px] text-center">
              <span className="grid size-16 place-items-center rounded-[18px] bg-success-subtle text-success-subtle-foreground [&>svg]:size-[30px]">
                <CheckCircle2Icon />
              </span>
              <h3 className="mt-3.5 mb-1 text-[17px] font-semibold">
                Test email sent
              </h3>
              <p className="max-w-[40ch] text-[13px] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                A test of <b>{tpl.name}</b> ({cur.v}) was sent to{" "}
                <b>{email.trim()}</b> with the sample values below. It may take
                a minute to arrive.
              </p>
              <Note
                tone="info"
                icon={<InfoIcon />}
                className="mt-[18px] text-left"
              >
                Test sends are logged to the template's audit trail and never
                reach real tenants.
              </Note>
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t px-[18px] py-3">
              <span className="flex-1" />
              <Button variant="ghost" onClick={() => setSent(false)}>
                Send another
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 overflow-y-auto p-[18px]">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
                  Send to<span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  aria-invalid={!!email && !valid}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ginja.ai"
                />
                {email && !valid ? (
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive">
                    Enter a valid email address.
                  </span>
                ) : (
                  <span className="text-[11.5px] text-muted-foreground">
                    A test is sent to this address only — tenants are never
                    contacted.
                  </span>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Placeholder values · {placeholders.length}
                  </div>
                  <Seg
                    value={sampleMode}
                    options={[
                      { v: "configure", l: "Configure" },
                      { v: "ai", l: "AI sample" },
                    ]}
                    onChange={(v) => {
                      if (v === "ai") goAi()
                      else setSampleMode("configure")
                    }}
                  />
                </div>
                {aiLoading ? (
                  <div className="flex items-center gap-2.5 px-3.5 py-[22px] text-[13px] font-medium text-muted-foreground">
                    <Loader2Icon className="size-[18px] animate-spin text-primary" />
                    <span>Generating sample data with AI…</span>
                  </div>
                ) : sampleMode === "ai" ? (
                  <>
                    <p className="mb-2 text-[11.5px] text-muted-foreground">
                      AI-generated values are used for the test. Switch to
                      Configure to set your own.
                    </p>
                    <div className="grid grid-cols-1 gap-[7px]">
                      {placeholders.map((p) => (
                        <PhRow key={p} k={p}>
                          <span className="text-[12px] text-muted-foreground">
                            {aiSampleFor(p)}
                          </span>
                        </PhRow>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <p className="flex-1 text-[11.5px] text-muted-foreground">
                        Set the values used in this test send.
                      </p>
                      <Button variant="outline" size="sm" onClick={aiFill}>
                        <SparklesIcon data-icon="inline-start" />
                        Auto-fill with AI
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-[7px]">
                      {placeholders.map((p) => (
                        <PhRow key={p} k={p}>
                          <Input
                            className="h-[34px]"
                            value={vals[p] || ""}
                            onChange={(e) =>
                              setVals((v) => ({ ...v, [p]: e.target.value }))
                            }
                            placeholder={aiSampleFor(p)}
                          />
                        </PhRow>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-xl border bg-muted/30">
                <div className="flex items-center gap-3 border-b px-[18px] py-2.5 text-muted-foreground [&>svg]:size-[14px]">
                  <EyeIcon />
                  <h3 className="text-sm font-semibold text-foreground">
                    Subject preview
                  </h3>
                </div>
                <div className="px-[18px] py-2.5 text-[13px] font-semibold">
                  {previewSubject}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t px-[18px] py-3">
              <span className="flex-1 text-[11.5px] text-muted-foreground">
                Sends one email now.
              </span>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!valid || sending} onClick={send}>
                {sending ? (
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <SendIcon data-icon="inline-start" />
                )}
                {sending ? "Sending…" : "Send test"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PhRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <code className="min-w-[120px] shrink-0 rounded-md bg-primary/[0.08] px-2 py-1 font-mono text-[11.5px] font-semibold whitespace-nowrap text-primary">
        {`{{${k}}}`}
      </code>
      <div className={cn("min-w-0 flex-1")}>{children}</div>
    </div>
  )
}
