import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { HiIcon } from "@/components/hifi/icon"
import { AuthShell, authInput, authLabel } from "./auth-shell"

/**
 * Forgot-password screen (mirrors the hi-fi `ForgotScreen`). Two states:
 * request (email → Send reset link) and the link-sent confirmation, toggled by
 * local `sent`. UI-only — no email is actually sent.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [sent, setSent] = React.useState(false)

  return (
    <AuthShell>
      <button
        type="button"
        onClick={() => navigate("/auth/login")}
        className="mb-5 inline-flex items-center gap-[5px] text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground [&>svg]:size-[14px]"
      >
        <HiIcon name="chevronLeft" />
        Back to sign in
      </button>

      {!sent ? (
        <>
          <div className="mb-[22px]">
            <h2 className="mb-1.5 text-[23px] font-bold tracking-[-0.01em]">
              Reset your password
            </h2>
            <p className="text-[13.5px] text-muted-foreground">
              Enter your work email and we&apos;ll send a secure link to reset
              it.
            </p>
          </div>
          <div className="grid gap-[15px]">
            <div className="flex flex-col gap-1.5">
              <label className={authLabel}>Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ginja.ai"
                className={authInput}
              />
            </div>
            <Button
              className="w-full justify-center"
              onClick={() => setSent(true)}
            >
              <HiIcon name="mail" />
              Send reset link
            </Button>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            The link expires in 30 minutes and can be used once.
          </p>
        </>
      ) : (
        <>
          <div className="mb-[22px] text-center">
            <span className="mx-auto mb-4 grid size-[60px] place-items-center rounded-[16px] bg-success-subtle text-success-subtle-foreground [&>svg]:size-[26px]">
              <HiIcon name="mail" />
            </span>
            <h2 className="mb-2 text-[22px] font-bold">Check your email</h2>
            <p className="text-[13px] leading-[1.55] text-muted-foreground">
              If <b>{email || "your email"}</b> matches an account, a reset link
              is on its way. It expires in 30 minutes.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => toast("Reset link resent.")}
          >
            <HiIcon name="refresh" />
            Resend link
          </Button>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Didn&apos;t get it? Check spam, or{" "}
            <a className="font-semibold text-primary hover:underline" href="#">
              contact IT support
            </a>
            .
          </p>
        </>
      )}
    </AuthShell>
  )
}
