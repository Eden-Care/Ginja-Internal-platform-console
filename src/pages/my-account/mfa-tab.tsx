import * as React from "react"
import {
  CheckIcon,
  CheckCircle2Icon,
  CopyIcon,
  DownloadIcon,
  InfoIcon,
  KeyRoundIcon,
  MailIcon,
  PlusIcon,
  ShieldIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Note } from "@/components/console/note"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
import { useAccess } from "@/contexts/access-context"
import { FakeQR } from "./shared"

const BACKUP_CODES = [
  "7HK2-9QFD",
  "3M8X-LT4P",
  "PW6R-2NJ9",
  "B4VC-81KQ",
  "XZ9F-3RD2",
  "T5HN-7QM8",
  "92LP-WK4C",
  "RJ6D-5XT1",
  "F8QZ-2HMB",
  "4KNP-9CTV",
]

/** Methods enabled by the administrator (both available; MFA optional). */
const METHODS = ["totp", "email"]
const MANDATORY = false

function MethodRow({
  on,
  icon,
  title,
  recommended,
  sub,
  action,
}: {
  on: boolean
  icon: React.ReactNode
  title: string
  recommended?: boolean
  sub: string
  action: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[11px] border bg-card p-[13px]",
        on && "border-success/40 bg-success-subtle/35"
      )}
    >
      <span
        className={cn(
          "grid size-[38px] shrink-0 place-items-center rounded-[10px] [&>svg]:size-[17px]",
          on
            ? "bg-success/[.16] text-success"
            : "bg-primary/12 text-primary"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          {title}
          {recommended && (
            <span className="rounded-[5px] bg-primary/12 px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.03em] text-primary uppercase">
              Recommended
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</div>
      </div>
      {action}
    </div>
  )
}

export function MfaTab() {
  const { role } = useAccess()
  const hasTotp = METHODS.includes("totp")
  const hasEmail = METHODS.includes("email")

  const [totp, setTotp] = React.useState(hasTotp)
  const [emailOtp, setEmailOtp] = React.useState(hasEmail && !hasTotp)
  const [setup, setSetup] = React.useState<"totp" | null>(null)
  const [codeVal, setCodeVal] = React.useState("")
  const [disable, setDisable] = React.useState<"totp" | "email" | null>(null)
  const [codes, setCodes] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const enabledCount = (totp ? 1 : 0) + (emailOtp ? 1 : 0)
  const isLast = (m: "totp" | "email") =>
    MANDATORY &&
    enabledCount === 1 &&
    ((m === "totp" && totp) || (m === "email" && emailOtp))

  const confirmDisable = () => {
    if (disable === "totp") setTotp(false)
    else setEmailOtp(false)
    toast(
      `${disable === "totp" ? "Authenticator app" : "Email passcode"} disabled.`
    )
    setDisable(null)
  }

  const initials = (role.label || "XX")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <Panel>
        <PanelHead
          icon={<KeyRoundIcon />}
          title="Multi-factor authentication"
          action={
            enabledCount > 0 ? (
              <MiniBadge tone="success">Protected</MiniBadge>
            ) : (
              <MiniBadge tone={MANDATORY ? "error" : "warning"}>
                {MANDATORY ? "Action required" : "Not set up"}
              </MiniBadge>
            )
          }
        />
        <PanelBody className="flex flex-col gap-3">
          <Note
            tone={MANDATORY && enabledCount === 0 ? "warn" : "info"}
            icon={MANDATORY ? <ShieldIcon /> : <InfoIcon />}
          >
            {MANDATORY ? (
              <>
                <b>MFA is required by your administrator.</b>{" "}
                {METHODS.length > 1
                  ? "Enable at least one of the methods below — you may enable both."
                  : "Enable the method below to continue using the console."}
              </>
            ) : (
              <>
                Your administrator has enabled{" "}
                {METHODS.length > 1 ? (
                  <>
                    <b>Authenticator app</b> and{" "}
                    <b>Email one-time passcode</b>
                  </>
                ) : hasTotp ? (
                  <b>Authenticator app</b>
                ) : (
                  <b>Email one-time passcode</b>
                )}
                . Enabling MFA is optional but recommended.
              </>
            )}
          </Note>

          {hasTotp && (
            <MethodRow
              on={totp}
              icon={<SmartphoneIcon />}
              title="Authenticator app (TOTP)"
              recommended={METHODS.length > 1}
              sub={
                totp
                  ? "Enabled · Google Authenticator"
                  : "Use Google Authenticator, Authy or 1Password."
              }
              action={
                totp ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLast("totp")}
                    title={
                      isLast("totp")
                        ? "MFA is required — enable another method before disabling this one."
                        : undefined
                    }
                    onClick={() => setDisable("totp")}
                  >
                    <XIcon data-icon="inline-start" />
                    Disable
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSetup("totp")
                      setCodeVal("")
                    }}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Set up
                  </Button>
                )
              }
            />
          )}

          {hasEmail && (
            <MethodRow
              on={emailOtp}
              icon={<MailIcon />}
              title="Email one-time passcode"
              sub={
                emailOtp
                  ? "Enabled · codes sent to your work email"
                  : "A 6-digit code is emailed to you at each sign-in."
              }
              action={
                emailOtp ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLast("email")}
                    title={
                      isLast("email")
                        ? "MFA is required — enable another method before disabling this one."
                        : undefined
                    }
                    onClick={() => setDisable("email")}
                  >
                    <XIcon data-icon="inline-start" />
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailOtp(true)
                      toast("Email passcode enabled.")
                    }}
                  >
                    <CheckIcon data-icon="inline-start" />
                    Enable
                  </Button>
                )
              }
            />
          )}

          {MANDATORY && enabledCount === 1 && (
            <p className="m-0 text-[11.5px] text-muted-foreground [&>svg]:inline [&>svg]:size-[11px] [&>svg]:-translate-y-px">
              <InfoIcon /> MFA is required, so your last active method can't be
              disabled until another is enabled.
            </p>
          )}

          {enabledCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-[11px] border border-dashed border-input px-[13px] py-[11px]">
              <KeyRoundIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="flex-1">
                <b className="text-[12.5px] font-semibold">Backup codes</b>
                <div className="text-[11.5px] text-muted-foreground">
                  10 single-use codes to sign in if you lose your device.
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCodes(true)}>
                <KeyRoundIcon data-icon="inline-start" />
                View codes
              </Button>
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* TOTP setup */}
      <Dialog open={setup === "totp"} onOpenChange={(o) => !o && setSetup(null)}>
        <DialogContent showCloseButton={false} className="max-w-[440px] gap-3 p-5">
          <span className="grid size-[42px] place-items-center rounded-[11px] bg-primary/12 text-primary [&>svg]:size-5">
            <SmartphoneIcon />
          </span>
          <DialogTitle className="font-heading text-base font-bold">
            Set up authenticator app
          </DialogTitle>
          <div className="text-[13px] leading-[1.55] text-foreground">
            <p className="mb-2.5">
              Scan this QR code with your authenticator app, then enter the
              6-digit code it shows.
            </p>
            <div className="mx-auto mt-1 mb-2.5 grid w-fit place-items-center rounded-xl border bg-white p-3.5">
              <FakeQR seed={role.label || "ginja"} />
            </div>
            <div className="mb-1 text-center text-[11.5px] text-muted-foreground">
              Or enter manually:{" "}
              <code className="mono rounded-[5px] bg-muted px-1.5 py-0.5 text-[11.5px] font-semibold text-foreground">
                GINJA-{initials}4F-92KD-71QZ
              </code>
            </div>
            <div className="mt-3 mb-1.5 text-left">
              <label className="mb-1.5 block text-[11.5px] font-semibold">
                Verification code
              </label>
              <input
                className="mono h-11 w-full rounded-[9px] border border-input bg-background px-3.5 text-center text-xl tracking-[0.4em] text-foreground outline-none focus:border-primary focus:ring-3 focus:ring-ring/[.16]"
                maxLength={6}
                value={codeVal}
                onChange={(e) => setCodeVal(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mt-2 mb-0 gap-2 border-0 bg-transparent p-0">
            <Button variant="ghost" onClick={() => setSetup(null)}>
              Cancel
            </Button>
            <Button
              disabled={codeVal.length !== 6}
              onClick={() => {
                setTotp(true)
                setSetup(null)
                toast("Authenticator app enabled.")
              }}
            >
              <CheckIcon data-icon="inline-start" />
              Verify &amp; enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* disable confirm */}
      <Dialog open={!!disable} onOpenChange={(o) => !o && setDisable(null)}>
        <DialogContent showCloseButton={false} className="max-w-[420px] gap-3 p-5">
          <span className="grid size-[42px] place-items-center rounded-[11px] bg-warning-subtle text-warning-subtle-foreground [&>svg]:size-5">
            <TriangleAlertIcon />
          </span>
          <DialogTitle className="font-heading text-base font-bold">
            Disable {disable === "totp" ? "authenticator app" : "email passcode"}?
          </DialogTitle>
          <div className="text-[13px] leading-[1.55] text-foreground">
            <p>
              You'll no longer be asked for{" "}
              {disable === "totp"
                ? "a code from your authenticator app"
                : "an emailed passcode"}{" "}
              when signing in.
              {enabledCount === 1 && !MANDATORY
                ? " Your account will no longer be protected by MFA."
                : enabledCount > 1
                  ? " Your other method stays active."
                  : ""}
            </p>
          </div>
          <DialogFooter className="mx-0 mt-2 mb-0 gap-2 border-0 bg-transparent p-0">
            <Button variant="ghost" onClick={() => setDisable(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisable}>
              <XIcon data-icon="inline-start" />
              Disable method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* backup codes */}
      <Dialog open={codes} onOpenChange={(o) => !o && setCodes(false)}>
        <DialogContent showCloseButton={false} className="max-w-[460px] gap-3 p-5">
          <span className="grid size-[42px] place-items-center rounded-[11px] bg-primary/12 text-primary [&>svg]:size-5">
            <KeyRoundIcon />
          </span>
          <DialogTitle className="font-heading text-base font-bold">
            Backup codes
          </DialogTitle>
          <div className="text-[13px] leading-[1.55] text-foreground">
            <Note tone="warn" icon={<TriangleAlertIcon />} className="mb-3">
              Store these somewhere safe. Each code works <b>once</b>, and they
              won't be shown in full again. Regenerating invalidates the old set.
            </Note>
            <div className="grid grid-cols-2 gap-2">
              {BACKUP_CODES.map((c, i) => (
                <code
                  key={c}
                  className="mono flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-2 text-[13px] font-semibold tracking-[0.04em] text-foreground"
                >
                  <span className="mono min-w-[14px] text-[10px] font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  {c}
                </code>
              ))}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              <li className="flex items-start gap-[7px] text-[11.5px] leading-[1.45] text-muted-foreground [&>svg]:mt-px [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-success">
                <CheckCircle2Icon />
                Use a code in place of your authenticator/email when you can't
                access it.
              </li>
              <li className="flex items-start gap-[7px] text-[11.5px] leading-[1.45] text-muted-foreground [&>svg]:mt-px [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-success">
                <CheckCircle2Icon />
                Keep them offline — a password manager or printed copy.
              </li>
            </ul>
          </div>
          <DialogFooter className="mx-0 mt-2 mb-0 gap-2 border-0 bg-transparent p-0">
            <Button variant="ghost" onClick={() => setCodes(false)}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCopied(true)
                toast("Backup codes copied to clipboard.")
                window.setTimeout(() => setCopied(false), 1800)
              }}
            >
              {copied ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <CopyIcon data-icon="inline-start" />
              )}
              {copied ? "Copied" : "Copy all"}
            </Button>
            <Button onClick={() => toast("Downloaded ginja-backup-codes.txt")}>
              <DownloadIcon data-icon="inline-start" />
              Download .txt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
