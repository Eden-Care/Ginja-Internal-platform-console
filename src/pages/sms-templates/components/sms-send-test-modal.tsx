import * as React from "react"
import { InfoIcon, Loader2Icon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { aiSampleFor, globalPhValue, isGlobalPh } from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { Note } from "@/components/console/note"
import type { SmsTemplate } from "@/features/sms-templates/types"
import { smsSegments } from "@/features/sms-templates/segments"
import { SmsBubble } from "./sms-bubble"

const phoneOk = (p: string) => /^\+\d{9,15}$/.test(p.replace(/\s/g, ""))

/** Centered "Send test SMS" modal — recipient + live preview, mock send.
   Mirrors the hi-fi `SmsTestModal`. */
export function SmsSendTestModal({
  open,
  tpl,
  message,
  onClose,
}: {
  open: boolean
  tpl: SmsTemplate
  message: string
  onClose: () => void
}) {
  const [phone, setPhone] = React.useState("")
  const [sending, setSending] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  const preview = message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    isGlobalPh(k) ? globalPhValue(k) : aiSampleFor(k)
  )
  const seg = smsSegments(preview)
  const valid = phoneOk(phone)

  const send = () => {
    setSending(true)
    window.setTimeout(() => {
      setSending(false)
      setSent(true)
      toast(`Test SMS sent to ${phone.trim()}.`)
    }, 1100)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSent(false)
          setPhone("")
          onClose()
        }
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[86vh] w-[480px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden p-0 [&_svg]:[stroke-width:1.75]"
      >
        <div className="flex shrink-0 items-center gap-[11px] border-b px-[18px] py-4">
          <span className="grid size-[38px] place-items-center rounded-[10px] bg-primary/[0.12] text-primary [&>svg]:size-[17px]">
            <SendIcon />
          </span>
          <div>
            <DialogTitle className="font-heading text-[15px] font-bold">
              Send test SMS
            </DialogTitle>
            <div className="text-[12px] text-muted-foreground">{tpl.name}</div>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-0.5 p-[18px] text-center">
            <span className="grid size-16 place-items-center rounded-[18px] bg-success-subtle text-success-subtle-foreground [&>svg]:size-[30px]">
              <HiIcon name="checkCircle" />
            </span>
            <h3 className="mt-3.5 mb-1 text-[17px] font-semibold">
              Test SMS sent
            </h3>
            <p className="max-w-[40ch] text-[13px] text-muted-foreground">
              A test of <b>{tpl.name}</b> was sent to <b>{phone.trim()}</b>.
              Standard carrier rates may apply.
            </p>
            <Note
              tone="info"
              icon={<InfoIcon />}
              className="mt-[18px] text-left"
            >
              Test sends are logged to the template's audit trail and never
              reach real members.
            </Note>
            <div className="mt-4 flex items-center gap-2 self-stretch">
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
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 overflow-y-auto p-[18px]">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
                  Send to<span className="text-destructive">*</span>
                </label>
                <Input
                  value={phone}
                  aria-invalid={!!phone && !valid}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254712345678"
                />
                <span
                  className={
                    phone && !valid
                      ? "text-[11.5px] font-medium text-destructive"
                      : "text-[11.5px] text-muted-foreground"
                  }
                >
                  {phone && !valid
                    ? "Enter a valid number in international format."
                    : "A test is sent to this number only — members are never contacted."}
                </span>
              </div>

              <div>
                <div className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Preview · {seg.charCount} chars · {seg.segmentCount}{" "}
                  {seg.segmentCount === 1 ? "segment" : "segments"}
                </div>
                <SmsBubble>{preview || "—"}</SmsBubble>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t px-[18px] py-3">
              <span className="flex-1 text-[11.5px] text-muted-foreground">
                Sends one SMS now.
              </span>
              <Button variant="ghost" className={hifiBtn} onClick={onClose}>
                Cancel
              </Button>
              <Button
                className={hifiBtn}
                disabled={!valid || sending}
                onClick={send}
              >
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
