import * as React from "react"
import { useSearchParams } from "react-router-dom"
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
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import type { RuleReviewAction } from "@/features/rule-extraction/api"
import type {
  Extraction,
  ExtractedRule,
} from "@/features/rule-extraction/types"
import { DetailRow } from "./shared"
import { Conf, humanizeType, RULE_TONE, SEV_TONE } from "./cockpit-shared"

/** Write handlers threaded from the cockpit into the drawer. `undefined` on a
    read-only (superseded / no-access) view. */
export type RuleOps = {
  busy: boolean
  onReview: (ruleId: string, action: RuleReviewAction, comment?: string) => void
  onEdit: (ruleId: string, description: string, comment: string) => void
}

const FILTERS = ["All", "Pending", "Approved", { v: "Discarded", l: "Other" }]

/**
 * The rule-review surface: search + status filter + (optional) add, rules
 * grouped by category, and the rule inspector drawer addressable via `?rule=`.
 * Surfaces the rule attributes (rule_logic on the card; source_quote + all
 * fields in the drawer). `ops` is omitted for read-only views.
 */
export function RulesReview({
  extraction,
  ops,
  onAddRule,
}: {
  extraction: Extraction
  ops?: RuleOps
  onAddRule?: () => void
}) {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState("All")

  const openRuleId = params.get("rule")
  const openRule = extraction.rules.find((r) => r.ruleId === openRuleId) ?? null
  const setRule = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set("rule", id)
        else n.delete("rule")
        return n
      },
      { replace: true }
    )

  const filtered = extraction.rules.filter((r) => {
    const st = r.reviewStatus
    if (status === "Pending" && st !== "PENDING") return false
    if (status === "Approved" && st !== "APPROVED") return false
    if (status === "Discarded" && st !== "DISCARDED" && st !== "ARCHIVED")
      return false
    if (q.trim()) {
      const hay =
        `${r.ruleId} ${humanizeType(r.type)} ${r.description} ${r.checkRef} ${r.quote}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })

  const groups = filtered.reduce<Record<string, ExtractedRule[]>>((acc, r) => {
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
        {onAddRule ? (
          <Button variant="outline" className={hifiBtn} onClick={onAddRule}>
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
                  r.severity === "CRITICAL"
                    ? "border-l-destructive/60"
                    : "border-l-primary/40"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[10.5px] font-semibold">
                      {r.ruleId}
                    </span>
                    <MiniBadge tone={SEV_TONE[r.severity] ?? "neutral"}>
                      {r.severity}
                    </MiniBadge>
                    <span className="text-[12px] font-semibold">
                      {humanizeType(r.type)}
                    </span>
                    {r.manual ? <MiniBadge tone="info">Manual</MiniBadge> : null}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.5] text-foreground">
                    {r.description}
                  </p>
                  {r.logic && r.logic !== "—" ? (
                    <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground [&>svg]:size-[12px]">
                      <HiIcon name="braces" />
                      <span className="mono truncate">{r.logic}</span>
                    </div>
                  ) : null}
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
                  <MiniBadge tone={RULE_TONE[r.reviewStatus]}>
                    {r.reviewStatus}
                  </MiniBadge>
                  <HiIcon
                    name="chevronRight"
                    className="size-4 text-muted-foreground"
                  />
                </div>
              </button>
            ))}
          </div>
        ))
      )}

      <RuleDrawer rule={openRule} ops={ops} onClose={() => setRule(null)} />
    </div>
  )
}

/* --------------------------------------------------------------- drawer */

type DrawerMode = "discard" | "archive" | "edit" | null

function RuleDrawer({
  rule,
  ops,
  onClose,
}: {
  rule: ExtractedRule | null
  ops?: RuleOps
  onClose: () => void
}) {
  return (
    <Sheet open={!!rule} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[500px]">
        {rule ? (
          <DrawerBody key={rule.ruleId} rule={rule} ops={ops} onClose={onClose} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DrawerBody({
  rule,
  ops,
  onClose,
}: {
  rule: ExtractedRule
  ops?: RuleOps
  onClose: () => void
}) {
  // Remount per rule (keyed below) so the action form always starts clean.
  const [mode, setMode] = React.useState<DrawerMode>(null)
  const [desc, setDesc] = React.useState(rule.description)
  const [text, setText] = React.useState("")
  const st = rule.reviewStatus
  const canReview = !!ops && st === "PENDING"

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[11px] font-semibold">
            {rule.ruleId}
          </span>
          <MiniBadge tone={SEV_TONE[rule.severity] ?? "neutral"}>
            {rule.severity}
          </MiniBadge>
          <MiniBadge tone={RULE_TONE[st]}>{st}</MiniBadge>
          {rule.manual ? <MiniBadge tone="info">Manual</MiniBadge> : null}
        </div>
        <SheetTitle className="mt-1 text-[16px]">
          {humanizeType(rule.type)}
        </SheetTitle>
        <SheetDescription className="text-[12px]">
          {rule.category} · {rule.schemeCategory}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[13px] leading-[1.55] text-foreground">
          {rule.description}
        </p>

        {rule.logic && rule.logic !== "—" ? (
          <div className="mt-3">
            <div className="mb-1 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
              Rule logic
            </div>
            <div className="mono rounded-lg border bg-muted/50 px-3 py-2 text-[12px] leading-[1.5]">
              {rule.logic}
            </div>
          </div>
        ) : null}

        {rule.quote ? (
          <div className="mt-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase [&>svg]:size-3">
              <HiIcon name="quote" />
              From the contract · {rule.source}
            </div>
            <blockquote className="border-l-2 border-primary/40 bg-muted/30 px-3 py-2 text-[12px] leading-[1.55] text-foreground/90 italic">
              “{rule.quote}”
            </blockquote>
          </div>
        ) : null}

        <div className="mt-3">
          <DetailRow k="Payer" v={rule.payer} />
          <DetailRow k="Scheme" v={rule.schemeCategory} />
          <DetailRow k="Service" v={rule.serviceCategory} />
          <DetailRow k="Check field" v={<span className="mono">{rule.checkField}</span>} />
          <DetailRow k="Unit of application" v={rule.unit} />
          <DetailRow k="Check ref" v={<span className="mono">{rule.checkRef}</span>} />
          <DetailRow k="Confidence" v={<Conf v={rule.confidence} />} />
          {rule.reviewedBy ? (
            <DetailRow
              k="Reviewed"
              v={`${rule.reviewedBy}${rule.reviewedAt ? ` · ${rule.reviewedAt}` : ""}`}
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

      {ops && !mode ? (
        <SheetFooter className="flex-row flex-wrap gap-2 border-t">
          {canReview ? (
            <Button
              className={cn(hifiBtn, "flex-1")}
              disabled={ops.busy}
              onClick={() => {
                ops.onReview(rule.ruleId, "APPROVE")
                onClose()
              }}
            >
              <HiIcon name="check" />
              Approve
            </Button>
          ) : null}
          <Button
            variant="outline"
            className={hifiBtn}
            disabled={ops.busy}
            onClick={() => {
              setDesc(rule.description)
              setText("")
              setMode("edit")
            }}
          >
            <HiIcon name="pencil" />
            Edit
          </Button>
          {canReview ? (
            <>
              <Button
                variant="outline"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => {
                  setText("")
                  setMode("discard")
                }}
              >
                <HiIcon name="ban" />
                Discard
              </Button>
              <Button
                variant="ghost"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => {
                  setText("")
                  setMode("archive")
                }}
              >
                <HiIcon name="archive" />
                Archive
              </Button>
            </>
          ) : null}
        </SheetFooter>
      ) : null}

      {ops && mode ? (
        <SheetFooter className="flex-col gap-2 border-t">
          {mode === "edit" ? (
            <div className="w-full">
              <label className="mb-[5px] block text-[11.5px] font-semibold">
                Rule description
              </label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="mb-2 w-full resize-y rounded-lg border border-input bg-background px-[11px] py-2 text-[13px] focus:border-primary focus:ring-[3px] focus:ring-ring/16 focus:outline-none"
              />
            </div>
          ) : null}
          <div className="w-full">
            <label className="mb-[5px] block text-[11.5px] font-semibold">
              {mode === "discard"
                ? "Reason for discarding"
                : mode === "archive"
                  ? "Reason for archiving"
                  : "What changed and why"}
              <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === "discard"
                  ? "Why is this rule being discarded?"
                  : mode === "archive"
                    ? "Why is this rule being archived?"
                    : "Recorded as the review comment."
              }
              className="w-full resize-y rounded-lg border border-input bg-background px-[11px] py-2 text-[13px] focus:border-primary focus:ring-[3px] focus:ring-ring/16 focus:outline-none"
            />
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="ghost"
              className={hifiBtn}
              onClick={() => setMode(null)}
            >
              Cancel
            </Button>
            <Button
              variant={mode === "discard" ? "destructive" : "default"}
              className={hifiBtn}
              disabled={
                ops.busy ||
                text.trim().length < 3 ||
                (mode === "edit" && desc.trim().length < 3)
              }
              onClick={() => {
                if (mode === "edit") ops.onEdit(rule.ruleId, desc, text)
                else
                  ops.onReview(
                    rule.ruleId,
                    mode === "discard" ? "DISCARD" : "ARCHIVE",
                    text
                  )
                setMode(null)
                onClose()
              }}
            >
              <HiIcon
                name={
                  mode === "discard" ? "ban" : mode === "archive" ? "archive" : "check"
                }
              />
              {mode === "discard"
                ? "Discard rule"
                : mode === "archive"
                  ? "Archive rule"
                  : "Save edit"}
            </Button>
          </div>
        </SheetFooter>
      ) : null}

      {!ops ? (
        <SheetFooter className="border-t">
          <p className="text-[11.5px] text-muted-foreground">
            This contract is superseded — its rules are read-only.
          </p>
        </SheetFooter>
      ) : null}
    </>
  )
}
