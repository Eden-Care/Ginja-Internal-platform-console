import { cn } from "@/lib/utils"
import type { BadgeTone } from "@/components/console/tagpill"
import type {
  ExtractedRule,
  RuleReviewStatus,
} from "@/features/rule-extraction/types"

/**
 * Shared primitives for the provider ⇆ insurer rule-review cockpit (the migrated
 * SP detail workspace). Bound to the real `Extraction`/`ExtractedRule` client
 * types; the tone maps mirror the experiment prototype's design intent (which
 * differs slightly from the older `features/rule-extraction` maps used by the
 * legacy `/rule-review` screen — kept separate on purpose so that page is
 * untouched).
 */

/** Rule severity → badge tone (design intent: CRITICAL/HIGH/MEDIUM/LOW). */
export const SEV_TONE: Record<string, BadgeTone> = {
  CRITICAL: "error",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
}

/** Per-rule review status → badge tone. */
export const RULE_TONE: Record<RuleReviewStatus, BadgeTone> = {
  APPROVED: "success",
  PENDING: "warning",
  DISCARDED: "neutral",
  ARCHIVED: "info",
}

/** "SUBMISSION_DEADLINE" → "Submission deadline". */
export const humanizeType = (t: string) =>
  t
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())

/** confidence 0..1 → integer percent (null-safe). */
export const pct = (v: number | null) =>
  v == null ? null : Math.round(v * 100)

/* -------------------------------------------------------- confidence bar */

/** `v` is 0..1 (matches the API); renders nothing when confidence is absent. */
export function Conf({ v }: { v: number | null }) {
  const p = pct(v)
  if (p == null) return null
  const tone = p >= 90 ? "bg-success" : p >= 75 ? "bg-warning" : "bg-muted-foreground"
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${p}%` }} />
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{p}%</span>
    </span>
  )
}

/* --------------------------------------------------------- review meter */

/** Segmented approved / pending / discarded bar + a "N of M reviewed" caption. */
export function ReviewMeter({ rules }: { rules: ExtractedRule[] }) {
  const total = rules.length || 1
  const approved = rules.filter((r) => r.reviewStatus === "APPROVED").length
  const pending = rules.filter((r) => r.reviewStatus === "PENDING").length
  const discarded = rules.filter(
    (r) => r.reviewStatus === "DISCARDED" || r.reviewStatus === "ARCHIVED"
  ).length
  const reviewed = approved + discarded

  const seg = (n: number, cls: string) =>
    n > 0 ? <span className={cls} style={{ width: `${(n / total) * 100}%` }} /> : null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {seg(approved, "bg-success")}
        {seg(pending, "bg-warning")}
        {seg(discarded, "bg-muted-foreground/50")}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {reviewed} of {rules.length} reviewed
        </span>
        <Legend cls="bg-success" label={`${approved} approved`} />
        <Legend cls="bg-warning" label={`${pending} pending`} />
        {discarded ? (
          <Legend cls="bg-muted-foreground/50" label={`${discarded} discarded`} />
        ) : null}
      </div>
    </div>
  )
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", cls)} />
      {label}
    </span>
  )
}
