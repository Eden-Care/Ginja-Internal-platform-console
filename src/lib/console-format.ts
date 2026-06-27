/** Formatting + small pure helpers for the Platform Console. */
import {
  GLOBAL_PLACEHOLDERS,
  PAYERS,
  PWD_POLICY_DAYS,
  REQUIRED_DOC_CATEGORIES,
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

/** A template/version status string from the API → display label + badge tone.
   Shows the real value (PUBLISHED / ARCHIVED / DRAFT / SUPERSEDED / …). */
export function versionStatusBadge(status?: string | null): {
  label: string
  tone: "success" | "warning" | "neutral"
} {
  const up = (status ?? "").trim().toUpperCase()
  const label = up
    ? up.charAt(0) + up.slice(1).toLowerCase().replace(/_/g, " ")
    : "—"
  if (up === "PUBLISHED") return { label, tone: "success" }
  if (up === "DISABLED" || up === "DEACTIVATED")
    return { label, tone: "warning" }
  return { label, tone: "neutral" }
}

/** ISO timestamp → "20 Jun 2026" (blank for missing/invalid). */
export const fmtDate = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
}

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
    !!form.country.trim() && // required by POST /platform/payers — gate the create on it
    !!(c0.name || "").trim() &&
    emailOk(c0.email) &&
    !!(form.address || "").trim() &&
    !!form.subdomain.trim()
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
    billing:
      form.pricingStructureId && form.model && form.freq ? "complete" : "todo",
    documents: REQUIRED_DOC_CATEGORIES.every((cat) =>
      form.documents.some((d) => d.category === cat)
    )
      ? "complete"
      : form.documents.length
        ? "progress"
        : "todo",
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

/* -------------------------------------------------- email editor helpers -- */

/** Distinct {{placeholder}} keys found in a string (e.g. subject + html). */
export function detectPlaceholders(src: string): string[] {
  return [
    ...new Set(
      (src.match(/\{\{\s*(\w+)\s*\}\}/g) || []).map((m) =>
        m.replace(/[{}\s]/g, "")
      )
    ),
  ]
}

/** Derive a SCREAMING_SNAKE template code from a human template name. */
export const templateCode = (name: string) =>
  (name || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")

/** True when a placeholder key is an active global placeholder. */
export const isGlobalPh = (p: string) =>
  GLOBAL_PLACEHOLDERS.some((g) => g.key === p && g.active)

/** The configured value for an active global placeholder (or empty string). */
export const globalPhValue = (p: string) =>
  GLOBAL_PLACEHOLDERS.find((g) => g.key === p && g.active)?.value ?? ""

/** Heuristic "AI"-generated sample value from a placeholder name. */
export function aiSampleFor(p: string): string {
  if (SAMPLE[p] != null) return SAMPLE[p]
  const k = p.toLowerCase()
  if (/org|company|tenant|insurer|scheme/.test(k) && /name/.test(k))
    return "Jubilee Health Insurance"
  if (/name/.test(k)) return "Faith Wanjiru"
  if (/email/.test(k)) return "faith.wanjiru@jubilee.co.ke"
  if (/link|url/.test(k)) return "https://jubilee.ginja.ai/setup/8f2a"
  if (/amount|premium|due|balance/.test(k)) return "KES 18,500.00"
  if (/date/.test(k)) return "22 Jun 2026"
  if (/hours?/.test(k)) return "72"
  if (/minutes?/.test(k)) return "30"
  if (/period/.test(k)) return "June 2026"
  if (/reason/.test(k)) return "Pending review"
  if (/module/.test(k)) return "Claims, Members, Finance"
  if (/subdomain/.test(k)) return "jubilee"
  if (/phone|msisdn|mobile/.test(k)) return "+254712345678"
  if (/id|no|number|ref|code/.test(k)) return "REF-204821"
  return "Sample value"
}

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
