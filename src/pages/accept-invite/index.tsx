import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  CircleCheckBigIcon,
  EyeIcon,
  EyeOffIcon,
  LinkIcon,
  LoaderCircleIcon,
  MinusIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { Field } from "@/components/console/form-atoms"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useBrand } from "@/contexts/brand-context"
import { useAcceptInvite } from "@/features/auth/use-accept-invite"
import { pwScore, PW_LABEL } from "@/pages/my-account/shared"
import { cn } from "@/lib/utils"

const FEATURES = [
  "Onboard & manage insurer tenant accounts",
  "Entitlements, billing & configuration libraries",
  "Role-driven, fully auditable platform access",
]

/** Minimum accepted score before we let the form submit. Backend enforces
   8–100 chars and rejects weak passwords; this keeps the user out of a 400. */
const MIN_SCORE = 3

function validatePassword(v: string) {
  if (!v) return "Choose a password to activate your account."
  if (v.length < 8) return "Use at least 8 characters."
  if (pwScore(v) < MIN_SCORE)
    return "That password is too weak — mix cases, add a number or symbol."
  return ""
}

function validateConfirm(pw: string, confirm: string) {
  if (!confirm) return "Re-enter your password to confirm."
  if (pw !== confirm) return "Passwords don’t match."
  return ""
}

/** Small ghost theme toggle, mirrors the one in the app shell header + login. */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

/** Password strength bar + label, shown under the new-password field. */
function StrengthMeter({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full transition-[width]",
            score <= 1 && "bg-destructive",
            score === 2 && "bg-warning",
            score >= 3 && "bg-success"
          )}
          style={{ width: `${(score / 4) * 100}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">
        {PW_LABEL[score]}
      </span>
    </div>
  )
}

/** Shared brand panel (left column) — mirrors the login screen. */
function BrandPanel() {
  const { brand } = useBrand()
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div className="relative flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-white/95 shadow-sm">
          <img
            src={brand.logoUrl}
            alt=""
            className="size-7 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">{brand.brandName}</div>
          <div className="text-xs text-primary-foreground/70">
            {brand.tagline}
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <h2 className="text-3xl font-semibold tracking-tight">
          You’ve been invited to the console.
        </h2>
        <p className="mt-3 text-sm text-primary-foreground/80">
          Set a password to activate your account. You’ll then sign in with your
          work email to help run the platform.
        </p>
        <ul className="mt-8 flex flex-col gap-3.5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/15">
                <CheckIcon className="size-3.5" />
              </span>
              <span className="text-primary-foreground/90">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} {brand.brandName}. Internal use only.
      </div>
    </div>
  )
}

/** Public page reached from the invitation email
   (`/accept-invite?token=<invite_token>`). Sets the invited member's password
   and activates them, then routes to /login to sign in. */
export function AcceptInvitePage() {
  const navigate = useNavigate()
  const { brand } = useBrand()
  const [params] = useSearchParams()
  const token = (params.get("token") ?? "").trim()
  const acceptInvite = useAcceptInvite()

  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [showPw, setShowPw] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [errors, setErrors] = React.useState({ password: "", confirm: "" })

  const score = pwScore(password)

  const policy = [
    { ok: password.length >= 8, label: "At least 8 characters" },
    {
      ok: /[A-Z]/.test(password) && /[a-z]/.test(password),
      label: "Upper & lower case letters",
    },
    { ok: /\d/.test(password), label: "A number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: "A symbol (recommended)" },
  ]

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = {
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    }
    setErrors(next)
    if (next.password || next.confirm) return

    acceptInvite.mutate(
      { token, password },
      {
        onSuccess: () => {
          setDone(true)
          toast.success("Invitation accepted", {
            description: "Your account is active — you can now sign in.",
          })
        },
        onError: (err) => {
          toast.error("Couldn’t accept the invitation", {
            description:
              err.message ||
              "The link may have expired or already been used. Ask your admin to resend it.",
          })
        },
      }
    )
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <BrandPanel />

      {/* Right column */}
      <div className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          {/* Brand mark for small screens, where the panel is hidden */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-9 place-items-center rounded-lg border bg-card shadow-xs">
              <img
                src={brand.logoUrl}
                alt=""
                className="size-6 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{brand.brandName}</div>
              <div className="text-xs text-muted-foreground">
                {brand.tagline}
              </div>
            </div>
          </div>

          {!token ? (
            /* ── Missing / malformed link ─────────────────────────────── */
            <div className="flex flex-col gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-destructive/[.12] text-destructive [&>svg]:size-5">
                <LinkIcon />
              </span>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  This invitation link is invalid
                </h1>
                <p className="text-sm text-muted-foreground">
                  The link is missing its invitation token. Open the most recent
                  link from your invitation email, or ask your platform admin to
                  resend the invite.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-1 h-9 w-full"
                onClick={() => navigate("/login")}
              >
                Go to sign in
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          ) : done ? (
            /* ── Success ──────────────────────────────────────────────── */
            <div className="flex flex-col gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-success/[.14] text-success [&>svg]:size-5">
                <CircleCheckBigIcon />
              </span>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  You’re all set
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your account is active. Sign in with your work email and the
                  password you just created.
                </p>
              </div>
              <Button
                className="mt-1 h-9 w-full"
                onClick={() => navigate("/login")}
              >
                Continue to sign in
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          ) : (
            /* ── Set-password form ────────────────────────────────────── */
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Activate your account
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a password to finish setting up your console access.
                </p>
              </div>

              <form
                onSubmit={onSubmit}
                noValidate
                className="mt-7 flex flex-col gap-4"
              >
                <Field
                  label="New password"
                  hint={errors.password}
                  hintTone="error"
                >
                  <InputGroup aria-invalid={!!errors.password}>
                    <InputGroupInput
                      id="password"
                      name="new-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={password}
                      aria-invalid={!!errors.password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password)
                          setErrors((p) => ({
                            ...p,
                            password: validatePassword(e.target.value),
                          }))
                      }}
                      onBlur={(e) =>
                        setErrors((p) => ({
                          ...p,
                          password: validatePassword(e.target.value),
                        }))
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        size="icon-xs"
                        aria-pressed={showPw}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        onClick={() => setShowPw((v) => !v)}
                      >
                        {showPw ? <EyeOffIcon /> : <EyeIcon />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {password && !errors.password ? (
                    <StrengthMeter score={score} />
                  ) : null}
                </Field>

                <Field
                  label="Confirm password"
                  hint={errors.confirm}
                  hintTone="error"
                >
                  <InputGroup aria-invalid={!!errors.confirm}>
                    <InputGroupInput
                      id="confirm"
                      name="confirm-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirm}
                      aria-invalid={!!errors.confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value)
                        if (errors.confirm)
                          setErrors((p) => ({
                            ...p,
                            confirm: validateConfirm(password, e.target.value),
                          }))
                      }}
                      onBlur={(e) =>
                        setErrors((p) => ({
                          ...p,
                          confirm: validateConfirm(password, e.target.value),
                        }))
                      }
                    />
                  </InputGroup>
                </Field>

                {/* Password policy checklist */}
                <div className="rounded-[11px] border bg-muted/30 p-3.5">
                  <div className="mb-2.5 flex items-center gap-[7px] text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase [&>svg]:size-3.5">
                    <ShieldIcon />
                    Password policy
                  </div>
                  <ul className="flex flex-col gap-2">
                    {policy.map((p) => (
                      <li
                        key={p.label}
                        className={cn(
                          "flex items-center gap-2 text-xs text-muted-foreground [&>svg]:size-3 [&>svg]:shrink-0",
                          p.ok && "text-success"
                        )}
                      >
                        {p.ok ? <CheckIcon /> : <MinusIcon />}
                        {p.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={acceptInvite.isPending}
                  className="mt-1 h-9 w-full"
                >
                  {acceptInvite.isPending ? (
                    <>
                      <LoaderCircleIcon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      Activating…
                    </>
                  ) : (
                    <>
                      Activate account
                      <ArrowRightIcon data-icon="inline-end" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-7 text-center text-xs text-muted-foreground">
                Already activated?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcceptInvitePage
