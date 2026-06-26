import * as React from "react"
import {
  CheckIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MinusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/console/note"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { pwScore, PW_LABEL } from "./shared"

/** The signed-in user's password rotation status (mock — no backend yet). */
const PW_STATE = {
  status: "ok" as "ok" | "expiring" | "expired",
  daysLeft: 64,
  lastChanged: "12 May 2026",
  expires: "10 Aug 2026",
}

/** Last 5 passwords — policy forbids reuse. */
const RECENT = [
  "Nairobi2025!",
  "Mombasa2024#",
  "Safari2024!",
  "Amboseli23$",
  "Lamu2023!!",
]

const BANNER_STYLE = {
  ok: "bg-primary/[.05] border-primary/25",
  expiring: "bg-warning-subtle/50 border-warning/40",
  expired: "bg-destructive/[.07] border-destructive/35",
}
const BANNER_IC = {
  ok: "bg-primary/[.14] text-primary",
  expiring: "bg-warning/20 text-warning-subtle-foreground",
  expired: "bg-destructive/[.14] text-destructive",
}

/** Masked credential input with an eye toggle. */
function PwField({
  label,
  value,
  onChange,
  show,
  onToggle,
  error,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  error?: string | false
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          aria-invalid={!!error}
          className="pr-9"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 right-1.5 grid -translate-y-1/2 place-items-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-[15px]"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive [&>svg]:size-3 [&>svg]:shrink-0">
          <TriangleAlertIcon />
          {error}
        </span>
      ) : (
        hint
      )}
    </div>
  )
}

export function PasswordTab() {
  const ps = PW_STATE
  const [cur, setCur] = React.useState("")
  const [nw, setNw] = React.useState("")
  const [cf, setCf] = React.useState("")
  const [show, setShow] = React.useState(false)
  const [tried, setTried] = React.useState(false)
  const score = pwScore(nw)

  const errs: Record<string, string> = {}
  if (tried) {
    if (!cur) errs.cur = "Enter your current password."
    if (!nw) errs.nw = "Enter a new password."
    else if (score < 3) errs.nw = "New password doesn't meet the password policy."
    else if (RECENT.includes(nw))
      errs.nw =
        "You've used this password before. Choose one you haven't used in your last 5 passwords."
    if (cf && nw !== cf) errs.cf = "Passwords don't match."
    else if (!cf) errs.cf = "Re-enter the new password."
  }
  const errCount = Object.keys(errs).length
  const pe = (k: string) => (tried ? errs[k] : undefined)
  const pwOk = !!cur && score >= 3 && nw === cf && !RECENT.includes(nw)

  const banner =
    ps.status === "expired"
      ? {
          icon: <TriangleAlertIcon />,
          title: "Your password has expired",
          msg: `It expired on ${ps.expires} under the 90-day rotation policy. You must set a new password to continue using the console.`,
        }
      : ps.status === "expiring"
        ? {
            icon: <ClockIcon />,
            title: `Your password expires in ${ps.daysLeft} ${ps.daysLeft === 1 ? "day" : "days"}`,
            msg: `Under the 90-day rotation policy it expires on ${ps.expires}. Change it now to avoid being locked out.`,
          }
        : {
            icon: <ShieldCheckIcon />,
            title: "Your password is up to date",
            msg: `Last changed ${ps.lastChanged}. Under the 90-day rotation policy it expires on ${ps.expires} (in ${ps.daysLeft} days).`,
          }

  const meterPct = Math.max(
    4,
    Math.min(100, Math.round((ps.daysLeft / 90) * 100))
  )

  const policy = [
    { ok: nw.length >= 12, label: "Be at least 12 characters" },
    {
      ok: /[A-Z]/.test(nw) && /[a-z]/.test(nw),
      label: "Upper & lower case letters",
    },
    { ok: /\d/.test(nw), label: "A number" },
    { ok: /[^A-Za-z0-9]/.test(nw), label: "A special character" },
  ]

  const submit = () => {
    setTried(true)
    if (pwOk) {
      setCur("")
      setNw("")
      setCf("")
      setTried(false)
      toast("Password updated. Other sessions were signed out.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* status banner */}
      <div
        className={cn(
          "flex items-start gap-[13px] rounded-xl border px-4 py-[15px]",
          BANNER_STYLE[ps.status]
        )}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[11px] [&>svg]:size-5",
            BANNER_IC[ps.status]
          )}
        >
          {banner.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{banner.title}</div>
          <div className="mt-[3px] text-[12.5px] leading-normal text-muted-foreground">
            {banner.msg}
          </div>
          {ps.status !== "expired" && (
            <div className="mt-2.5 max-w-[380px]">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    ps.status === "expiring" ? "bg-warning" : "bg-primary"
                  )}
                  style={{ width: `${meterPct}%` }}
                />
              </div>
              <span className="mt-[5px] inline-block text-[11px] text-muted-foreground">
                {ps.daysLeft} of 90 days remaining
              </span>
            </div>
          )}
        </div>
      </div>

      {/* change password */}
      <Panel>
        <PanelHead
          icon={<LockIcon />}
          title={ps.status === "expired" ? "Set a new password" : "Change password"}
        />
        <PanelBody>
          <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[1fr_280px]">
            <div className="flex flex-col gap-[13px]">
              {tried && errCount > 0 && (
                <Note tone="err" icon={<TriangleAlertIcon />}>
                  <b>
                    {errCount} {errCount === 1 ? "issue" : "issues"} to fix.
                  </b>{" "}
                  Review the highlighted fields below.
                </Note>
              )}
              <PwField
                label="Current password"
                value={cur}
                onChange={setCur}
                show={show}
                onToggle={() => setShow((s) => !s)}
                error={pe("cur")}
              />
              <PwField
                label="New password"
                value={nw}
                onChange={setNw}
                show={show}
                onToggle={() => setShow((s) => !s)}
                error={pe("nw")}
                hint={
                  nw ? (
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
                  ) : undefined
                }
              />
              <PwField
                label="Confirm new password"
                value={cf}
                onChange={setCf}
                show={show}
                onToggle={() => setShow((s) => !s)}
                error={pe("cf")}
              />
              <div>
                <Button onClick={submit}>
                  <CheckIcon data-icon="inline-start" />
                  {ps.status === "expired" ? "Set password" : "Update password"}
                </Button>
              </div>
            </div>

            <div className="self-start rounded-[11px] border bg-muted/30 p-3.5">
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
                <li className="mt-1.5 flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground [&>svg]:size-3 [&>svg]:shrink-0">
                  <ClockIcon />
                  Rotates every 90 days · no reuse of last 5
                </li>
              </ul>
            </div>
          </div>
        </PanelBody>
      </Panel>
    </div>
  )
}
