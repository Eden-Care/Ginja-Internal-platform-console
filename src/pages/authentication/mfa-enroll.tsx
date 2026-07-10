import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { HiIcon } from "@/components/hifi/icon"
import { AuthShell } from "./auth-shell"
import { AuthQR } from "./auth-qr"

const SECRET = "GINJA-AO4F-92KD-71QZ"
const SEED = "amara.okeke@ginja.ai"

/**
 * Mandatory post-login MFA enrolment (mirrors the hi-fi `MfaEnrollScreen`).
 * `choose` lists the enabled methods; picking the authenticator advances to the
 * `totp` QR-setup step. UI-only — "Verify & enable" navigates onward.
 */
export function MfaEnrollPage({
  methods = ["totp", "email"],
}: {
  methods?: ("totp" | "email")[]
}) {
  const navigate = useNavigate()
  const [step, setStep] = React.useState<"choose" | "totp">("choose")
  const [code, setCode] = React.useState("")
  const hasTotp = methods.includes("totp")
  const hasEmail = methods.includes("email")
  const only = methods.length === 1

  return (
    <AuthShell wide>
      {/* steps indicator */}
      <div className="mb-[22px] flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
        <span className="mono grid size-[22px] shrink-0 place-items-center rounded-full bg-success text-[11px] font-bold text-white [&>svg]:size-3">
          <HiIcon name="check" />
        </span>
        <span className="h-0.5 w-[30px] rounded-[2px] bg-success" />
        <span className="mono grid size-[22px] shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
          2
        </span>
        <span className="font-semibold text-foreground">
          Secure your account
        </span>
      </div>

      {step === "choose" ? (
        <>
          <div className="mb-[22px]">
            <h2 className="mb-1.5 text-[23px] font-bold tracking-[-0.01em]">
              Set up multi-factor authentication
            </h2>
            <p className="text-[13.5px] text-muted-foreground">
              Your administrator requires MFA on every Platform Console account.
            </p>
          </div>

          <div className="mb-5 flex gap-[11px] rounded-[11px] border border-primary/20 bg-primary/[0.06] p-3.5 text-[12.5px] leading-[1.55] text-foreground [&>svg]:mt-px [&>svg]:size-[15px] [&>svg]:shrink-0 [&>svg]:text-primary">
            <HiIcon name="shield" />
            <div>
              <b className="font-bold">Why is this required?</b> This console
              manages live tenant data, billing and configuration for insurers.
              A second factor protects those systems if your password is ever
              compromised. You can&apos;t skip this step.
            </div>
          </div>

          <div className="grid gap-[11px]">
            {hasTotp ? (
              <div className="flex items-center gap-[13px] rounded-xl border bg-card p-[15px]">
                <span className="grid size-[42px] shrink-0 place-items-center rounded-[11px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                  <HiIcon name="smartphone" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                    Authenticator app
                    {!only ? (
                      <span className="rounded-[5px] bg-success-subtle px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.03em] text-success-subtle-foreground uppercase">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-[3px] text-[12px] leading-[1.5] text-muted-foreground">
                    Use Google Authenticator, Authy or 1Password to generate
                    codes — works offline.
                  </div>
                </div>
                <Button size="sm" onClick={() => setStep("totp")}>
                  <HiIcon name="arrowRight" />
                  Set up
                </Button>
              </div>
            ) : null}

            {hasEmail ? (
              <div className="flex items-center gap-[13px] rounded-xl border bg-card p-[15px]">
                <span className="grid size-[42px] shrink-0 place-items-center rounded-[11px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                  <HiIcon name="mail" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">
                    Email one-time passcode
                  </div>
                  <div className="mt-[3px] text-[12px] leading-[1.5] text-muted-foreground">
                    We&apos;ll email a 6-digit code to your work address each
                    time you sign in.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={hasTotp ? "outline" : "default"}
                  onClick={() => toast("Email one-time passcode enabled.")}
                >
                  {hasTotp ? null : <HiIcon name="arrowRight" />}
                  {hasTotp ? "Use email" : "Set up"}
                </Button>
              </div>
            ) : null}
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {only
              ? "Your administrator enabled this method for the platform."
              : "Enable at least one method to continue. You can add the other later from My Account."}
          </p>
        </>
      ) : (
        <>
          <div className="mb-[22px]">
            <h2 className="mb-1.5 text-[23px] font-bold tracking-[-0.01em]">
              Set up authenticator app
            </h2>
            <p className="text-[13.5px] text-muted-foreground">
              Scan the QR code with your authenticator app, then enter the
              6-digit code it shows.
            </p>
          </div>

          <div className="flex flex-col items-center gap-[18px] py-1 text-center">
            <div className="rounded-[16px] border bg-white p-[14px] shadow-xs">
              <AuthQR seed={SEED} size={168} />
            </div>

            <div className="flex w-full max-w-[340px] flex-col items-center gap-[7px]">
              <span className="text-[12px] font-medium text-muted-foreground">
                Can&apos;t scan? Enter this key manually
              </span>
              <div className="flex items-center gap-2 rounded-[9px] border bg-muted py-2 pr-[10px] pl-[14px]">
                <code className="mono text-[14px] font-semibold tracking-[0.06em] text-foreground">
                  {SECRET}
                </code>
                <button
                  type="button"
                  title="Copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(SECRET)
                    toast("Setup key copied.")
                  }}
                  className="grid place-items-center rounded-[6px] p-[5px] text-muted-foreground transition-colors hover:bg-card hover:text-primary [&>svg]:size-[14px]"
                >
                  <HiIcon name="copy" />
                </button>
              </div>
            </div>

            <div className="flex w-full max-w-[340px] flex-col items-center gap-2 border-t pt-1">
              <label className="text-[12px] font-medium text-muted-foreground">
                Enter the 6-digit code
              </label>
              <input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                className="mono block w-[200px] rounded-[10px] border border-input bg-background p-3 text-center text-[22px] font-bold tracking-[0.34em] text-foreground outline-none [text-indent:0.34em] focus:border-primary focus:ring-[3px] focus:ring-ring/[0.16]"
              />
            </div>
          </div>

          <div className="mt-[22px] flex justify-end gap-2.5 border-t pt-[18px]">
            <Button variant="ghost" onClick={() => setStep("choose")}>
              Back
            </Button>
            <Button
              disabled={code.length !== 6}
              onClick={() => {
                toast.success("Multi-factor authentication enabled.")
                navigate("/")
              }}
            >
              <HiIcon name="check" />
              Verify &amp; enable
            </Button>
          </div>
        </>
      )}
    </AuthShell>
  )
}
