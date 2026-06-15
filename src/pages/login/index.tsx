import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { Field } from "@/components/console/form-atoms"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBrand } from "@/contexts/brand-context"
import { emailOk } from "@/lib/console-format"

const FEATURES = [
  "Onboard & manage insurer tenant accounts",
  "Entitlements, billing & configuration libraries",
  "Role-driven, fully auditable platform access",
]

function validateEmail(v: string) {
  if (!v.trim()) return "Enter your work email to continue."
  if (!emailOk(v)) return "That email doesn’t look right. Check for typos."
  return ""
}

function validatePassword(v: string) {
  if (!v) return "Enter your password to continue."
  return ""
}

/** Small ghost theme toggle, mirrors the one in the app shell header. */
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

/** Split-screen sign-in: brand panel on the left, credential form on the right. */
export function LoginPage() {
  const navigate = useNavigate()
  const { brand } = useBrand()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPw, setShowPw] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [errors, setErrors] = React.useState({ email: "", password: "" })
  const [submitting, setSubmitting] = React.useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    }
    setErrors(next)
    if (next.email || next.password) return

    setSubmitting(true)
    // No backend — simulate the round-trip, then enter the console.
    window.setTimeout(() => {
      toast.success("Signed in", {
        description: `Welcome back — ${email.trim()}`,
      })
      navigate("/")
    }, 850)
  }

  const adminHelp = () =>
    toast.info("Need access?", {
      description: "Account access is managed by your platform admin.",
    })

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
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
            The control plane for your insurer tenants.
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Onboard payers, manage entitlements and keep every tenant
            configuration auditable — from one calm, role-driven console.
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

      {/* Credential form */}
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

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Sign in to your console
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-4">
            <Field label="Work email" hint={errors.email} hintTone="error">
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                aria-invalid={!!errors.email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email)
                    setErrors((p) => ({ ...p, email: validateEmail(e.target.value) }))
                }}
                onBlur={(e) =>
                  setErrors((p) => ({ ...p, email: validateEmail(e.target.value) }))
                }
              />
            </Field>

            <Field
              label={
                <span className="flex w-full items-center justify-between">
                  <span>Password</span>
                  <button
                    type="button"
                    onClick={adminHelp}
                    className="text-[11.5px] font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </span>
              }
              hint={errors.password}
              hintTone="error"
            >
              <InputGroup aria-invalid={!!errors.password}>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
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
            </Field>

            <Label className="gap-2 text-[13px] font-normal text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              Keep me signed in
            </Label>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 h-9 w-full"
            >
              {submitting ? (
                <>
                  <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRightIcon data-icon="inline-end" />
                </>
              )}
            </Button>

            <div className="my-1 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              OR
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 w-full"
              onClick={() =>
                toast.info("Single sign-on", {
                  description: "SSO isn’t configured for this workspace yet.",
                })
              }
            >
              <ShieldCheckIcon data-icon="inline-start" />
              Continue with SSO
            </Button>
          </form>

          <p className="mt-7 text-center text-xs text-muted-foreground">
            Need access?{" "}
            <button
              type="button"
              onClick={adminHelp}
              className="font-medium text-primary hover:underline"
            >
              Contact your platform admin
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
