/** Formatting + small pure helpers for the Platform Console. */
import {
  PAYERS,
  PWD_POLICY_DAYS,
  RESERVED,
  SAMPLE,
  SUBDOMAIN_TAKEN,
  WIZ_STEPS,
  pwdOf,
  type OnboardingForm,
  type Payer,
  type WizStepKey,
} from "@/lib/console-data"

export const fmtUSD = (n: number) => "$" + n.toLocaleString("en-US")
export const fmtNum = (n: number) => n.toLocaleString("en-US")

/** First two letters of a name, uppercased (avatar fallback). */
export function initials2(name: string) {
  return (name || "").slice(0, 2).toUpperCase()
}

export const emailOk = (v: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim())

/** Find existing tenants with a similar legal name in the same country. */
export function findDuplicates(legal: string, country: string): Payer[] {
  const q = (legal || "").trim().toLowerCase()
  if (q.length < 2) return []
  const first = q.split(/\s+/)[0]
  return PAYERS.filter(
    (p) =>
      p.country === country &&
      (p.name.toLowerCase().startsWith(first) ||
        p.name.toLowerCase().includes(q.slice(0, 4)))
  )
}

export type WizStatus = "complete" | "progress" | "todo"

/** Per-section completion derived from the form, so the rail reflects real state. */
export function sectionStatuses(
  form: OnboardingForm
): Record<WizStepKey, WizStatus> {
  const c0 = form.contacts[0] || ({} as OnboardingForm["contacts"][number])
  const primaryFull =
    !!form.legal.trim() &&
    !!form.trading.trim() &&
    !!form.tax.trim() &&
    !!(c0.name || "").trim() &&
    emailOk(c0.email) &&
    !!(form.address || "").trim()
  const primaryAny =
    !!form.legal.trim() ||
    !!form.trading.trim() ||
    !!form.tax.trim() ||
    !!(c0.name || "").trim()

  const s: Record<WizStepKey, WizStatus> = {
    primary: primaryFull ? "complete" : primaryAny ? "progress" : "todo",
    secondary: form.secondaries.every(
      (x) => x.name.trim() && x.subdomain.trim()
    )
      ? "complete"
      : "progress",
    modules: Object.keys(form.modules).length ? "complete" : "todo",
    billing: form.model && form.freq ? "complete" : "todo",
    documents: "progress", // demo: 3 of 4 required docs uploaded
    review: "todo",
  }
  s.review = WIZ_STEPS.filter((step) => step.k !== "review").every(
    (step) => s[step.k] === "complete"
  )
    ? "complete"
    : "todo"
  return s
}

export const isSubTaken = (sub: string) => SUBDOMAIN_TAKEN.includes(sub)
export const isSubReserved = (sub: string) => RESERVED.includes(sub)

/** Replace {{var}} tokens with SAMPLE values; unknown tokens stay literal. */
export const renderTpl = (t: string) =>
  (t || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k) =>
    k in SAMPLE ? SAMPLE[k] : m
  )

export type PwdState = "ok" | "soon" | "expired" | "pending"

/** Password health bucket from a user's rotation record. */
export function pwdState(id: string): PwdState {
  const p = pwdOf(id)
  if (p.pending) return "pending"
  if (p.daysLeft < 0) return "expired"
  if (p.daysLeft <= 14) return "soon"
  return "ok"
}

/** The date a user's password expires under the rotation policy (null if pending). */
export function pwdExpiryDate(id: string): string | null {
  const p = pwdOf(id)
  if (p.pending) return null
  const d = new Date("2026-06-18")
  d.setDate(d.getDate() + p.daysLeft)
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export { PWD_POLICY_DAYS }
