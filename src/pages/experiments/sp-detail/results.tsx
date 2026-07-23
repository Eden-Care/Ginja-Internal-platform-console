import { Navigate, useParams, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
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
import {
  getExtraction,
  getInsurer,
  getProvider,
  type ExpRule,
} from "./mock"
import {
  DetailRow,
  EXP_ROOT,
  ExperimentBanner,
  ExpCrumbs,
  REVIEW_LABEL,
  REVIEW_TONE,
  RULE_TONE,
  SEV_TONE,
} from "./shared"

const COV_LABEL: Record<string, string> = {
  EXTRACTED: "Extracted",
  MISSING_FLAGGED: "Missing — flagged",
  RECORDED_ABSENT: "Recorded absent",
}
const COV_TONE: Record<string, "success" | "warning" | "neutral"> = {
  EXTRACTED: "success",
  MISSING_FLAGGED: "warning",
  RECORDED_ABSENT: "neutral",
}

function Conf({ v }: { v: number }) {
  const tone = v >= 90 ? "bg-success" : v >= 75 ? "bg-warning" : "bg-muted-foreground"
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${v}%` }} />
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{v}%</span>
    </span>
  )
}

/** Route element for `.../insurers/:insurerId/contracts/:jobId`. */
export function ExpExtractionResults() {
  const { code, insurerId, jobId } = useParams<{
    code: string
    insurerId: string
    jobId: string
  }>()
  const [params, setParams] = useSearchParams()

  const provider = getProvider(code)
  const insurer = getInsurer(insurerId)
  const x = getExtraction(jobId)

  if (!provider || !insurer || !x)
    return <Navigate to={`${EXP_ROOT}/${code ?? ""}`} replace />

  const recBase = `${EXP_ROOT}/${encodeURIComponent(provider.code)}`
  const wsBase = `${recBase}/insurers/${encodeURIComponent(insurer.accountId)}`

  const panel = params.get("panel") === "summary" ? "summary" : "rules"
  const setPanel = (p: "rules" | "summary") =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (p === "summary") n.set("panel", "summary")
        else n.delete("panel")
        return n
      },
      { replace: true }
    )

  const openRuleId = params.get("rule")
  const openRule = x.rules.find((r) => r.ruleId === openRuleId) ?? null
  const setRule = (id: string | null) =>
    setParams((prev) => {
      const n = new URLSearchParams(prev)
      if (id) n.set("rule", id)
      else n.delete("rule")
      return n
    })

  const approved = x.rules.filter((r) => r.status === "APPROVED").length
  const pending = x.rules.filter((r) => r.status === "PENDING").length
  const total = x.rules.length

  // group rules by category, preserving first-seen order
  const groups = x.rules.reduce<Record<string, ExpRule[]>>((acc, r) => {
    ;(acc[r.category] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-4">
      <ExperimentBanner />
      <ExpCrumbs
        items={[
          { label: "Service providers", href: EXP_ROOT },
          { label: provider.name, href: recBase },
          { label: "Insurers", href: `${recBase}/insurers` },
          { label: insurer.name, href: wsBase },
          { label: "Contracts", href: `${wsBase}/contracts` },
          { label: x.contractFilename },
        ]}
      />

      {/* contract head */}
      <div className="flex items-start gap-3 rounded-xl border bg-card p-[15px]">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-[22px]">
          <HiIcon name="fileText" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-[17px] font-bold">{x.contractFilename}</h2>
            <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
              {REVIEW_LABEL[x.reviewStatus]}
            </MiniBadge>
            {!x.current ? <MiniBadge tone="neutral">Superseded</MiniBadge> : null}
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {x.jobId} · extracted {x.completed} · {total} rules · uploaded by{" "}
            {x.createdBy}
            {x.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
          </div>
        </div>
        <Button
          variant="outline"
          className={hifiBtn}
          onClick={() => toast("Assign reviewer — would open the reviewer picker.")}
        >
          <HiIcon name="userCheck" />
          {x.assigneeName ? "Reassign" : "Assign reviewer"}
        </Button>
      </div>

      {/* approval progress */}
      <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
        <div className="flex h-6 flex-1 overflow-hidden rounded-full bg-muted">
          {approved > 0 ? (
            <span
              className="grid place-items-center bg-success text-[10px] font-semibold text-white"
              style={{ width: `${(approved / total) * 100}%` }}
            >
              {approved} approved
            </span>
          ) : null}
          {pending > 0 ? (
            <span
              className="grid place-items-center bg-warning text-[10px] font-semibold text-white"
              style={{ width: `${(pending / total) * 100}%` }}
            >
              {pending} pending
            </span>
          ) : null}
        </div>
      </div>

      {/* results sub-tabs — a facet toggle of ONE extraction, still URL-backed
          via ?panel= so refresh keeps the panel. */}
      <div className="flex gap-0.5 border-b">
        {(
          [
            ["rules", "Extracted rules", total],
            ["summary", "Summary & coverage", undefined],
          ] as const
        ).map(([k, label, count]) => (
          <button
            key={k}
            type="button"
            onClick={() => setPanel(k)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium",
              panel === k
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {typeof count === "number" ? (
              <span className="mono rounded-full bg-muted px-1.5 py-px text-[11px] font-semibold">
                {count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {panel === "rules" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] text-muted-foreground">
              Missing a rule the extractor didn’t catch? Add it manually.
            </p>
            <Button
              variant="outline"
              className={hifiBtn}
              onClick={() => toast("Add rule — would open the add-rule dialog.")}
            >
              <HiIcon name="plus" />
              Add rule
            </Button>
          </div>

          {Object.entries(groups).map(([cat, rules]) => (
            <div key={cat} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                <HiIcon name="send" className="size-[13px]" />
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
                  className="flex w-full items-start gap-3 rounded-xl border-l-[3px] border border-l-primary/50 bg-card p-[13px] text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[10.5px] font-semibold">
                        {r.ruleId}
                      </span>
                      <MiniBadge tone={SEV_TONE[r.severity]}>{r.severity}</MiniBadge>
                      <span className="text-[12px] font-semibold">{r.title}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-foreground">
                      {r.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_svg]:size-[12px]">
                      <span>
                        <HiIcon name="gitBranch" />
                        {r.service}
                      </span>
                      <span>
                        <HiIcon name="bookOpen" />
                        {r.clause}
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
          ))}
        </div>
      ) : (
        <Panel>
          <PanelHead icon={<HiIcon name="shield" />} title="Coverage" />
          <PanelBody>
            <div className="flex flex-col gap-0.5">
              {x.coverage.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between border-b py-2.5 text-[13px] last:border-b-0"
                >
                  <span>{c.name}</span>
                  <MiniBadge tone={COV_TONE[c.status]}>{COV_LABEL[c.status]}</MiniBadge>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>
      )}

      {/* Rule inspector — a drawer, addressable via ?rule= so a specific rule is
          shareable and survives a refresh. */}
      <RuleDrawer rule={openRule} onClose={() => setRule(null)} />
    </div>
  )
}

function RuleDrawer({
  rule,
  onClose,
}: {
  rule: ExpRule | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!rule} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[460px]">
        {rule ? (
          <>
            <SheetHeader className="border-b">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[11px] font-semibold">
                  {rule.ruleId}
                </span>
                <MiniBadge tone={SEV_TONE[rule.severity]}>{rule.severity}</MiniBadge>
                <MiniBadge tone={RULE_TONE[rule.status]}>{rule.status}</MiniBadge>
              </div>
              <SheetTitle className="mt-1 text-[16px]">{rule.title}</SheetTitle>
              <SheetDescription className="text-[12px]">
                {rule.category}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-[13px] leading-[1.55] text-foreground">
                {rule.description}
              </p>
              <div className="mt-3">
                <DetailRow k="Service" v={rule.service} />
                <DetailRow k="Type" v={rule.type} />
                <DetailRow k="Clause" v={rule.clause} />
                <DetailRow k="Check ref" v={<span className="mono">{rule.checkRef}</span>} />
                <DetailRow k="Confidence" v={<Conf v={rule.confidence} />} />
              </div>
            </div>

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
              <Button
                variant="outline"
                className={hifiBtn}
                onClick={() => toast(`Editing ${rule.ruleId}…`)}
              >
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
              <Button
                variant="outline"
                className={hifiBtn}
                onClick={() => {
                  toast(`${rule.ruleId} archived.`)
                  onClose()
                }}
              >
                <HiIcon name="archive" />
                Archive
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
