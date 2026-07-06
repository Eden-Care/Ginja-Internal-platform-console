import * as React from "react"
import { EyeIcon, InfoIcon, Loader2Icon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { type EmailTemplate, type EmailVersion } from "@/lib/console-data"
import { detectPlaceholders, emailOk, isGlobalPh } from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { Note } from "@/components/console/note"
import { useSendTestEmail } from "@/features/email-templates/use-email-templates"
import type { EmailTemplateDetail } from "@/features/email-templates/types"

/**
 * Centered "Send test email" modal — configure recipient + placeholder values,
 * then a sending → sent flow. Mirrors the hi-fi `SendTestDrawer`, but as a
 * centered Dialog per the design spec.
 */
export function SendTestModal({
  open,
  tpl,
  cur,
  detail,
  initialSent,
  onClose,
}: {
  open: boolean
  tpl: EmailTemplate
  cur: EmailVersion
  /** Real template detail (merge fields + subject) — drives the test render. */
  detail?: EmailTemplateDetail
  initialSent?: boolean
  onClose: () => void
}) {
  // Placeholders are detected from the real template content (subject + body)
  // — the API's merge-fields list is unreliable. Globals are auto-injected, so
  // they're excluded (the user only fills template-specific placeholders).
  const subjectSrc = detail?.subject || cur.subject
  const phSource = detail
    ? [detail.subject, detail.htmlContent, detail.plainTextContent].join(" ")
    : cur.subject + " " + cur.body
  const placeholders = detectPlaceholders(phSource).filter(
    (p) => !isGlobalPh(p)
  )
  const [email, setEmail] = React.useState(
    initialSent ? "amara.okeke@ginja.ai" : ""
  )
  const [vals, setVals] = React.useState<Record<string, string>>({})
  const [sent, setSent] = React.useState(!!initialSent)
  const sendMut = useSendTestEmail()

  const valid = emailOk(email)
  // Preview substitutes the manually-entered value, or the raw token if blank.
  const previewSubject = subjectSrc.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    (vals[k] ?? "").trim() ? vals[k] : `{{${k}}}`
  )

  // Every placeholder must be filled manually before the test can be sent.
  const sentValue = (p: string) => (vals[p] ?? "").trim()
  const missingValues = placeholders.filter((p) => !sentValue(p))
  const canSend = valid && missingValues.length === 0

  const send = () => {
    if (tpl.templateId == null) {
      toast.error("This template has no id yet — save it first.")
      return
    }
    const data = Object.fromEntries(placeholders.map((p) => [p, sentValue(p)]))
    sendMut.mutate(
      {
        template_id: tpl.templateId,
        to_email: email.trim(),
        data,
        template_code: detail?.functionalCode,
      },
      {
        onSuccess: () => {
          setSent(true)
          toast.success(`Test email queued to ${email.trim()}.`)
        },
        onError: (e) =>
          toast.error("Couldn't send the test", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[86vh] w-[520px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden p-0 [&_svg]:[stroke-width:1.75]"
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
                <HiIcon name="checkCircle" />
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
              <Button
                variant="ghost"
                className={hifiBtn}
                onClick={() => setSent(false)}
              >
                Send another
              </Button>
              <Button className={hifiBtn} onClick={onClose}>
                Done
              </Button>
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
                <div className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Placeholder values · {placeholders.length}
                </div>
                {placeholders.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    This template has no placeholders.
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-[11.5px] text-muted-foreground">
                      Enter a value for each placeholder — required to send the
                      test.
                    </p>
                    <div className="grid grid-cols-1 gap-[7px]">
                      {placeholders.map((p) => (
                        <PhRow key={p} k={p}>
                          <Input
                            className="h-[34px]"
                            value={vals[p] || ""}
                            aria-invalid={!(vals[p] ?? "").trim()}
                            onChange={(e) =>
                              setVals((v) => ({ ...v, [p]: e.target.value }))
                            }
                            placeholder="Enter a value"
                          />
                        </PhRow>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-[12px] border bg-muted/30">
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
              <Button variant="ghost" className={hifiBtn} onClick={onClose}>
                Cancel
              </Button>
              <Button
                className={hifiBtn}
                disabled={!canSend || sendMut.isPending}
                onClick={send}
              >
                {sendMut.isPending ? (
                  <Loader2Icon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <SendIcon data-icon="inline-start" />
                )}
                {sendMut.isPending ? "Sending…" : "Send test"}
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
