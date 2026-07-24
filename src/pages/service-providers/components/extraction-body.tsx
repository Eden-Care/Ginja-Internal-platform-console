import { useSearchParams } from "react-router-dom"

import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
import { TabBar } from "@/components/console/tab-bar"
import { HiIcon } from "@/components/hifi/icon"
import {
  COV_LABEL,
  COV_TONE,
  CRIT_TONE,
  type CoverageCheck,
  type Extraction,
  type ExtractionMetadata,
} from "@/features/rule-extraction/types"
import { DetailRow } from "./shared"
import { RulesReview, type RuleOps } from "./rules-review"

/**
 * The extraction body — a URL-backed facet tab (v4's "Extracted rules /
 * Summary & coverage") over ONE extraction. `?panel=coverage` survives a
 * refresh. Both the cockpit (current) and the read-only historical view render
 * this; the contract bar / flags / review rail live outside it.
 */
export function ExtractionBody({
  extraction,
  ops,
  onAddRule,
}: {
  extraction: Extraction
  ops?: RuleOps
  onAddRule?: () => void
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
          {
            k: "rules",
            label: "Extracted rules",
            icon: <HiIcon name="sliders" />,
            count: extraction.rules.length,
          },
          {
            k: "coverage",
            label: "Summary & coverage",
            icon: <HiIcon name="fileCheck" />,
          },
        ]}
      />
      {panel === "rules" ? (
        <RulesReview extraction={extraction} ops={ops} onAddRule={onAddRule} />
      ) : (
        <div className="flex flex-col gap-4">
          {extraction.metadata ? (
            <ContractSummaryPanel meta={extraction.metadata} />
          ) : null}
          <CoveragePanel coverage={extraction.coverage} />
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------- contract summary panel */

function ContractSummaryPanel({ meta }: { meta: ExtractionMetadata }) {
  const rows: [string, string][] = [
    ["Document type", meta.documentType],
    ["Payer", meta.payerName],
    ["Healthcare provider", meta.healthcareProvider],
    ["Effective date", meta.effectiveDate],
    ["Duration", meta.durationTerm],
    ["Signed date", meta.signedDate],
    ["Supersedes", meta.supersedes],
  ]

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="fileCheck" />} title="Contract summary" />
      <PanelBody className="p-4">
        <div className="grid gap-x-10 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <DetailRow key={k} k={k} v={v || "—"} />
          ))}
        </div>
        {meta.servicesCovered && meta.servicesCovered !== "—" ? (
          <div className="mt-3">
            <div className="text-[11px] text-muted-foreground">
              Services covered
            </div>
            <p className="mt-1 text-[12.5px] leading-[1.55]">
              {meta.servicesCovered}
            </p>
          </div>
        ) : null}
        {meta.missingFields.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">
              Not found in contract:
            </span>
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

const STATUS_RANK: Record<string, number> = {
  MISSING_FLAGGED: 0,
  RECORDED_ABSENT: 1,
  EXTRACTED: 2,
  SKIPPED: 3,
}

/** The full coverage matrix — check × criticality × status × rule-count × note,
    flagged/absent surfaced first. */
function CoveragePanel({ coverage }: { coverage: CoverageCheck[] }) {
  if (!coverage.length) return null
  const rows = [...coverage].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
  )
  const flagged = coverage.filter((c) => c.status === "MISSING_FLAGGED").length
  const extracted = coverage.filter((c) => c.status === "EXTRACTED").length

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="shield" />}
        title="Extraction coverage"
        action={
          <span className="text-[11.5px] text-muted-foreground">
            {extracted}/{coverage.length} extracted
            {flagged ? ` · ${flagged} flagged` : ""}
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
              <tr
                key={c.checkId}
                className="border-b last:border-b-0 [&>td]:px-4 [&>td]:py-2 [&>td]:align-top"
              >
                <td className="mono whitespace-nowrap font-semibold">
                  {c.checkId}
                </td>
                <td className="whitespace-nowrap text-muted-foreground">
                  {c.category}
                </td>
                <td>
                  <MiniBadge tone={CRIT_TONE[c.criticality] ?? "neutral"}>
                    {c.criticality}
                  </MiniBadge>
                </td>
                <td>
                  <MiniBadge tone={COV_TONE[c.status]}>
                    {COV_LABEL[c.status]}
                  </MiniBadge>
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
