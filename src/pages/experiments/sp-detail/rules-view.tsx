import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MiniBadge } from "@/components/console/tagpill"
import { Seg } from "@/components/console/form-atoms"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { TabBar } from "@/components/console/tab-bar"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import type { ExpContractMeta, ExpCoverage, ExpExtraction, ExpRule } from "./mock"
import {
  COV_LABEL,
  COV_TONE,
  CRIT_TONE,
  DetailRow,
  humanizeType,
  pct,
  RULE_TONE,
  SEV_TONE,
} from "./shared"

/* -------------------------------------------------------- confidence bar */

/** `v` is 0..1 (matches the API). */
export function Conf({ v }: { v: number }) {
  const p = pct(v)
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
export function ReviewMeter({ rules }: { rules: ExpRule[] }) {
  const total = rules.length || 1
  const approved = rules.filter((r) => r.status === "APPROVED").length
  const pending = rules.filter((r) => r.status === "PENDING").length
  const discarded = rules.filter(
    (r) => r.status === "DISCARDED" || r.status === "ARCHIVED"
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

/* ------------------------------------------------------------- rules list */

const FILTERS = ["All", "Pending", "Approved", { v: "Discarded", l: "Other" }]

/**
 * The rule-review surface: search + status filter + add, rules grouped by
 * category, and the rule inspector drawer (addressable via `?rule=`). Surfaces
 * the API's rule attributes (rule_logic on the card; source_quote + all fields
 * in the drawer). `readOnly` hides write affordances (superseded contracts).
 */
export function RulesReview({
  extraction,
  readOnly = false,
}: {
  extraction: ExpExtraction
  readOnly?: boolean
}) {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("All")

  const openRuleId = params.get("rule")
  const openRule = extraction.rules.find((r) => r.ruleId === openRuleId) ?? null
  const setRule = (id: string | null) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      if (id) n.set("rule", id)
      else n.delete("rule")
      return n
    })

  const filtered = extraction.rules.filter((r) => {
    if (status === "Pending" && r.status !== "PENDING") return false
    if (status === "Approved" && r.status !== "APPROVED") return false
    if (status === "Discarded" && r.status !== "DISCARDED" && r.status !== "ARCHIVED")
      return false
    if (q.trim()) {
      const hay =
        `${r.ruleId} ${humanizeType(r.ruleType)} ${r.description} ${r.checkRef} ${r.sourceQuote}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })

  const groups = filtered.reduce<Record<string, ExpRule[]>>((acc, r) => {
    ;(acc[r.category] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-[34px] min-w-[180px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
          <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rules, clauses, quotes…"
            aria-label="Search rules"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Seg value={status} onChange={setStatus} options={FILTERS} />
        {!readOnly ? (
          <Button
            variant="outline"
            className={hifiBtn}
            onClick={() => toast("Add rule — would open the add-rule dialog.")}
          >
            <HiIcon name="plus" />
            Add rule
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center text-[13px] text-muted-foreground">
          No rules match this filter.
        </div>
      ) : (
        Object.entries(groups).map(([cat, rules]) => (
          <div key={cat} className="flex flex-col gap-2">
            <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              {cat}
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px]">
                {rules.length}
              </span>
            </div>
            {rules.map((r) => (
              <button
                key={r.ruleId}
                type="button"
                onClick={() => setRule(r.ruleId)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border border-l-[3px] bg-card p-[13px] text-left transition-colors hover:bg-muted/40",
                  r.severity === "CRITICAL" ? "border-l-destructive/60" : "border-l-primary/40"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[10.5px] font-semibold">
                      {r.ruleId}
                    </span>
                    <MiniBadge tone={SEV_TONE[r.severity]}>{r.severity}</MiniBadge>
                    <span className="text-[12px] font-semibold">{humanizeType(r.ruleType)}</span>
                    {r.manual ? <MiniBadge tone="info">Manual</MiniBadge> : null}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-foreground">
                    {r.description}
                  </p>
                  <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground [&>svg]:size-[12px]">
                    <HiIcon name="braces" />
                    <span className="mono truncate">{r.ruleLogic}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_svg]:size-[12px]">
                    <span>
                      <HiIcon name="gitBranch" />
                      {r.serviceCategory}
                    </span>
                    <span>
                      <HiIcon name="bookOpen" />
                      {r.source}
                    </span>
                    <span className="mono">{r.checkRef}</span>
                    <Conf v={r.confidence} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <MiniBadge tone={RULE_TONE[r.status]}>{r.status}</MiniBadge>
                  <HiIcon name="chevronRight" className="size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ))
      )}

      <RuleDrawer rule={openRule} readOnly={readOnly} onClose={() => setRule(null)} />
    </div>
  )
}

/* --------------------------------------------------------------- drawer */

function RuleDrawer({
  rule,
  readOnly,
  onClose,
}: {
  rule: ExpRule | null
  readOnly: boolean
  onClose: () => void
}) {
  return (
    <Sheet open={!!rule} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[500px]">
        {rule ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[11px] font-semibold">
                  {rule.ruleId}
                </span>
                <MiniBadge tone={SEV_TONE[rule.severity]}>{rule.severity}</MiniBadge>
                <MiniBadge tone={RULE_TONE[rule.status]}>{rule.status}</MiniBadge>
                {rule.manual ? <MiniBadge tone="info">Manual</MiniBadge> : null}
              </div>
              <SheetTitle className="mt-1 text-[16px]">{humanizeType(rule.ruleType)}</SheetTitle>
              <SheetDescription className="text-[12px]">
                {rule.category} · {rule.schemeCategory}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-[13px] leading-[1.55] text-foreground">{rule.description}</p>

              {/* the machine check */}
              <div className="mt-3">
                <div className="mb-1 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                  Rule logic
                </div>
                <div className="mono rounded-lg border bg-muted/50 px-3 py-2 text-[12px] leading-[1.5]">
                  {rule.ruleLogic}
                </div>
              </div>

              {/* the verbatim clause backing it */}
              <div className="mt-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase [&>svg]:size-3">
                  <HiIcon name="quote" />
                  From the contract · {rule.source}
                </div>
                <blockquote className="border-l-2 border-primary/40 bg-muted/30 px-3 py-2 text-[12px] leading-[1.55] text-foreground/90 italic">
                  “{rule.sourceQuote}”
                </blockquote>
              </div>

              <div className="mt-3">
                <DetailRow k="Payer" v={rule.payer} />
                <DetailRow k="Scheme" v={rule.schemeCategory} />
                <DetailRow k="Service" v={rule.serviceCategory} />
                <DetailRow k="Check field" v={<span className="mono">{rule.checkField}</span>} />
                <DetailRow k="Unit of application" v={rule.unitOfApplication} />
                <DetailRow k="Check ref" v={<span className="mono">{rule.checkRef}</span>} />
                <DetailRow k="Confidence" v={<Conf v={rule.confidence} />} />
                {rule.reviewedByName ? (
                  <DetailRow
                    k="Reviewed"
                    v={`${rule.reviewedByName}${rule.reviewedAt ? ` · ${rule.reviewedAt}` : ""}`}
                  />
                ) : null}
              </div>

              {rule.reviewComment ? (
                <div className="mt-3 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-[12px]">
                  <span className="font-semibold">Reviewer note: </span>
                  {rule.reviewComment}
                </div>
              ) : null}
            </div>

            {!readOnly ? (
              <SheetFooter className="flex-row flex-wrap gap-2 border-t">
                <Button
                  className={cn(hifiBtn, "flex-1")}
                  onClick={() => {
                    toast(`${rule.ruleId} approved.`)
                    onClose()
                  }}
                >
                  <HiIcon name="check" />
                  Approve
                </Button>
                <Button variant="outline" className={hifiBtn} onClick={() => toast(`Editing ${rule.ruleId}…`)}>
                  <HiIcon name="pencil" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className={hifiBtn}
                  onClick={() => {
                    toast(`${rule.ruleId} discarded.`)
                    onClose()
                  }}
                >
                  <HiIcon name="ban" />
                  Discard
                </Button>
              </SheetFooter>
            ) : (
              <SheetFooter className="border-t">
                <p className="text-[11.5px] text-muted-foreground">
                  This contract is superseded — its rules are read-only.
                </p>
              </SheetFooter>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/* ---------------------------------------------------- extraction body (tabs) */

/**
 * The contract's extraction body — a URL-backed facet tab (v4's
 * "Extracted rules / Summary & coverage") over ONE extraction. `?panel=coverage`
 * survives refresh. Both the cockpit (current) and the read-only superseded
 * view render this; the contract bar / flags / rail live outside it.
 */
export function ExtractionBody({
  extraction,
  readOnly = false,
}: {
  extraction: ExpExtraction
  readOnly?: boolean
}) {
  const [params, setParams] = useSearchParams()
  const panel = params.get("panel") === "coverage" ? "coverage" : "rules"
  const setPanel = (p: "rules" | "coverage") =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (p === "coverage") n.set("panel", "coverage")
        else n.delete("panel")
        return n
      },
      { replace: true }
    )

  return (
    <div className="flex flex-col gap-4">
      <TabBar
        value={panel}
        onChange={(k) => setPanel(k as "rules" | "coverage")}
        tabs={[
          { k: "rules", label: "Extracted rules", icon: <HiIcon name="sliders" />, count: extraction.rules.length },
          { k: "coverage", label: "Summary & coverage", icon: <HiIcon name="fileCheck" /> },
        ]}
      />
      {panel === "rules" ? (
        <RulesReview extraction={extraction} readOnly={readOnly} />
      ) : (
        <div className="flex flex-col gap-4">
          <ContractSummaryPanel meta={extraction.metadata} />
          <CoveragePanel coverage={extraction.coverage} />
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------- contract summary panel */

function ContractSummaryPanel({ meta }: { meta: ExpContractMeta }) {
  const rows: [string, string][] = [
    ["Document type", meta.documentType],
    ["Payer", meta.payerName],
    ["Effective date", meta.effectiveDate || "—"],
    ["Duration", meta.durationTerm || "—"],
    ["Signed date", meta.signedDate || "—"],
    ["Supersedes", meta.supersedes || "—"],
  ]

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="fileCheck" />} title="Contract summary" />
      <PanelBody className="p-4">
        <div className="grid gap-x-10 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <DetailRow key={k} k={k} v={v} />
          ))}
        </div>
        <div className="mt-3">
          <div className="text-[11px] text-muted-foreground">Services covered</div>
          <p className="mt-1 text-[12.5px] leading-[1.55]">{meta.servicesCovered}</p>
        </div>
        {meta.missingFields.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Not found in contract:</span>
            {meta.missingFields.map((f) => (
              <span
                key={f}
                className="mono rounded-[5px] bg-warning-subtle px-1.5 py-px text-[10.5px] text-warning-subtle-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  )
}

/* ---------------------------------------------------------- coverage panel */

/** The full coverage matrix — check × criticality × status × rule-count × note,
    flagged/absent surfaced first. Always open (it owns the coverage tab). */
function CoveragePanel({ coverage }: { coverage: ExpCoverage[] }) {
  const rows = [...coverage].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])
  const flagged = coverage.filter((c) => c.status === "MISSING_FLAGGED").length
  const extracted = coverage.filter((c) => c.status === "EXTRACTED").length

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="shield" />}
        title="Extraction coverage"
        action={
          <span className="text-[11.5px] text-muted-foreground">
            {extracted}/{coverage.length} extracted{flagged ? ` · ${flagged} flagged` : ""}
          </span>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-[10.5px] tracking-[0.04em] text-muted-foreground uppercase [&>th]:px-4 [&>th]:py-2 [&>th]:font-semibold">
              <th>Check</th>
              <th>Category</th>
              <th>Criticality</th>
              <th>Status</th>
              <th className="text-right">Rules</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.checkId} className="border-b last:border-b-0 [&>td]:px-4 [&>td]:py-2 [&>td]:align-top">
                <td className="mono whitespace-nowrap font-semibold">{c.checkId}</td>
                <td className="whitespace-nowrap text-muted-foreground">{c.category}</td>
                <td>
                  <MiniBadge tone={CRIT_TONE[c.criticality]}>{c.criticality}</MiniBadge>
                </td>
                <td>
                  <MiniBadge tone={COV_TONE[c.status]}>{COV_LABEL[c.status]}</MiniBadge>
                </td>
                <td className="text-right tabular-nums">{c.ruleCount}</td>
                <td className="min-w-[220px] text-muted-foreground">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

const STATUS_RANK: Record<string, number> = {
  MISSING_FLAGGED: 0,
  RECORDED_ABSENT: 1,
  EXTRACTED: 2,
  SKIPPED: 3,
}
