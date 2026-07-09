import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Note } from "@/components/console/note"
import { HiIcon } from "@/components/hifi/icon"
import { useAuth } from "@/contexts/auth-context"
import { useLogin } from "@/features/auth/use-login"
import { emailOk } from "@/lib/console-format"
import { AuthShell, authInput, authLabel } from "./auth-shell"

/* Field validators — same rules as the old login page. */
function validateEmail(v: string) {
  if (!v.trim()) return "Enter your work email to continue."
  if (!emailOk(v)) return "That email doesn’t look right. Check for typos."
  return ""
}
function validatePassword(v: string) {
  if (!v) return "Enter your password to continue."
  return ""
}

/** Invalid-credentials message, worded + emphasised like the hi-fi `login-err`. */
const CREDENTIALS_ERROR = (
  <span>
    <b>Incorrect email or password.</b> Please try again.
  </span>
)

/**
 * Sign-in screen (mirrors the hi-fi `LoginScreen`) — the app's active login
 * (the old `src/pages/login` is kept as backup). Authenticates via the real
 * login API + `applySession`, then lands on the bounced-from page. Errors show
 * as a red note above the form + red field borders (matches the hi-fi).
 */
export function AuthLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, applySession } = useAuth()
  const login = useLogin()

  const [email, setEmail] = React.useState("")
  const [pw, setPw] = React.useState("")
  const [show, setShow] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [errors, setErrors] = React.useState({ email: false, password: false })
  const [notice, setNotice] = React.useState<React.ReactNode>(null)

  // Where to land after sign-in (the bounced-from page, else home).
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/"

  React.useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  const clearError = () => {
    if (notice) setNotice(null)
    if (errors.email || errors.password)
      setErrors({ email: false, password: false })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const eMsg = validateEmail(email)
    const pMsg = validatePassword(pw)
    if (eMsg || pMsg) {
      setErrors({ email: !!eMsg, password: !!pMsg })
      setNotice(eMsg || pMsg)
      return
    }
    setErrors({ email: false, password: false })
    setNotice(null)

    login.mutate(
      { email: email.trim(), password: pw },
      {
        onSuccess: (session) => {
          applySession(session, remember)
          toast.success("Signed in", {
            description: `Welcome back — ${session.email}`,
          })
          navigate(from, { replace: true })
        },
        onError: (e2) => {
          setErrors({ email: true, password: true })
          setNotice(CREDENTIALS_ERROR)
          toast.error("Sign-in failed", {
            description: e2 instanceof Error ? e2.message : undefined,
          })
        },
      }
    )
  }

  return (
    <AuthShell>
      <div className="mb-[22px]">
        <h2 className="mb-1.5 text-[23px] font-bold tracking-[-0.01em]">
          Sign in
        </h2>
        <p className="text-[13.5px] text-muted-foreground">
          Use your Ginja staff account to continue.
        </p>
      </div>

      {notice ? (
        <Note tone="err" icon={<HiIcon name="alert" />} className="mb-4">
          {notice}
        </Note>
      ) : null}

      <form className="grid gap-[15px]" onSubmit={onSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label className={authLabel}>Work email</label>
          <input
            type="email"
            inputMode="email"
            value={email}
            aria-invalid={errors.email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError()
            }}
            placeholder="you@ginja.ai"
            autoComplete="username"
            className={cn(authInput, errors.email && "border-destructive")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={authLabel}>Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              aria-invalid={errors.password}
              onChange={(e) => {
                setPw(e.target.value)
                clearError()
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn(
                authInput,
                "pr-10",
                errors.password && "border-destructive"
              )}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-[6px] grid -translate-y-1/2 place-items-center rounded-[6px] p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&>svg]:size-[15px]"
            >
              <HiIcon name={show ? "eyeOff" : "eye"} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-[15px] accent-[hsl(var(--primary))]"
            />
            <span>Keep me signed in</span>
          </label>
          <button
            type="button"
            onClick={() => navigate("/auth/forgot-password")}
            className="text-[12.5px] font-semibold text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          className="w-full justify-center"
          disabled={login.isPending}
        >
          <HiIcon name="arrowRight" />
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative mt-5 mb-4 text-center before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-border before:content-['']">
        <span className="relative bg-card px-3 text-[11.5px] tracking-[0.06em] text-muted-foreground uppercase">
          or
        </span>
      </div>

      <Button
        variant="outline"
        className="w-full justify-center"
        onClick={() => toast.info("Google Workspace SSO isn’t configured yet.")}
      >
        <HiIcon name="globe" />
        Continue with Google Workspace
      </Button>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Trouble signing in? Contact{" "}
        <a className="font-semibold text-primary hover:underline" href="#">
          IT support
        </a>
        .
      </p>
    </AuthShell>
  )
}
