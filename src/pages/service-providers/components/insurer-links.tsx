import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MiniBadge } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import type { ServiceProvider } from "@/features/service-providers/types"
import { useInsurersDirectory } from "@/features/insurers/use-insurers"
import type { Insurer } from "@/features/insurers/types"
import {
  useCurrentExtraction,
  useExtractionHistory,
  useExtractionsOverview,
} from "@/features/rule-extraction/use-rule-extraction"
import {
  EXTRACT_REVIEW_LABEL,
  EXTRACT_REVIEW_TONE,
  EXTRACT_STATUS_TONE,
  type ExtractionSummary,
} from "@/features/rule-extraction/types"
import { BackLink, DetailRow, spInitials } from "./shared"
import { SpContracts } from "./contracts"

/*
 * Provider ⇆ insurer workspace (Insurers tab on the provider record), LIVE:
 * the card list = the insurer directory (`/platform/insurance-companies`)
 * crossed with the provider's extraction overview
 * (`…/{code}/rule-extraction`). Contract upload / rules / review are fully
 * wired; what the API does NOT yet expose (directory-sync link status, plan
 * coverage, schemes, policyholder counts, primary flag, and the summary-strip
 * counts) is shown as pending rather than fabricated — see the pending-backend
 * notes in the gap report. The per-row extraction badge/rule-count IS live (a
 * direct read of that insurer's own record); only the aggregate KPI strip lacks
 * an endpoint and is deliberately not derived client-side.
 */

/** Per-insurer extraction state, or undefined when no contract yet. The
    overview also lists superseded/failed attempts, so prefer the row the
    backend marks `current` and fall back to the newest anything. */
const forInsurer = (
  overview: ExtractionSummary[] | undefined,
  accountId: string
) =>
  overview?.find((x) => x.insurerAccountId === accountId && x.current) ??
  overview?.find((x) => x.insurerAccountId === accountId)

/* ------------------------------------------------------------------ list */

export function SpInsurerList({
  provider,
  onOpen,
}: {
  provider: ServiceProvider
  onOpen: (insurer: Insurer) => void
}) {
  const dirQ = useInsurersDirectory({ status: "ACTIVE" })
  const ovQ = useExtractionsOverview(provider.displayId)

  const insurers = dirQ.data?.companies ?? []
  const overview = ovQ.data

  // The four summary counts below are NOT derived on the client. Crossing the
  // insurer directory with the extraction overview (with-contracts), and
  // summing / status-counting the overview rows (rules-extracted, in-progress),
  // is a cross-API aggregation the frontend shouldn't own — so the strip shows
  // "pending" until the backend exposes a dedicated insurers-overview endpoint
  // (e.g. GET …/{code}/insurers/overview → { insurers, with_contracts,
  // rules_extracted, in_progress }). `forInsurer` is still used per-row below,
  // where it's a direct read of a single insurer's own extraction record.
  const statCards: [string, string][] = [
    ["Insurers", "shield"],
    ["With contracts", "fileText"],
    ["Rules extracted", "sliders"],
    ["In progress", "clock"],
  ]

  if (dirQ.isLoading || ovQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* directory bar */}
      <div className="flex items-center gap-[11px] rounded-[11px] border bg-muted/40 px-[13px] py-[11px]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary [&>svg]:size-[15px]">
          <HiIcon name="refresh" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold">
            Insurers from the platform directory
          </div>
          <div className="mt-px text-[11px] text-muted-foreground">
            The platform directory of active insurers — upload a contract per
            insurer for {provider.name}.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={hifiBtn}
          onClick={() => {
            void dirQ.refetch()
            void ovQ.refetch()
            toast("Refreshing insurers & extractions…")
          }}
        >
          <HiIcon name="refresh" />
          Refresh
        </Button>
      </div>

      {/* stats — pending a dedicated backend overview endpoint (see note above);
          the counts are intentionally not computed on the client. */}
      <div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {statCards.map(([l, ic]) => (
            <div
              key={l}
              className="flex items-center gap-2 rounded-[10px] border px-[11px] py-[9px] text-muted-foreground [&>svg]:size-3.5 [&>svg]:shrink-0"
            >
              <HiIcon name={ic} />
              <div>
                <div className="text-[16px] leading-none font-bold text-muted-foreground/40 tabular-nums">
                  —
                </div>
                <div className="mt-0.5 text-[10.5px]">{l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <MiniBadge tone="neutral">Pending backend</MiniBadge>
          <span>Summary counts need a dedicated overview endpoint.</span>
        </div>
      </div>

      {dirQ.isError || ovQ.isError ? (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            Couldn’t load the insurer directory.{" "}
            <button
              className="font-semibold text-primary underline underline-offset-2"
              onClick={() => {
                void dirQ.refetch()
                void ovQ.refetch()
              }}
            >
              Try again
            </button>
            .
          </p>
        </div>
      ) : insurers.length === 0 ? (
        <div className="mt-[18px] flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-12 text-center">
          <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
            <HiIcon name="shield" />
          </span>
          <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:text-foreground">
            <b>No active insurers in the directory yet.</b>
            <br />
            Onboard insurers first — contracts are uploaded per provider ⇆
            insurer pair.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {insurers.map((ins) => {
            const x = forInsurer(overview, ins.accountId)
            return (
              <button
                key={ins.accountId}
                type="button"
                onClick={() => onOpen(ins)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-xl border bg-card p-[13px] text-left transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-xs"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[13px] font-bold text-primary">
                  {spInitials(ins.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold">
                      {ins.name}
                    </span>
                    {x ? (
                      <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>
                        {x.status === "COMPLETED"
                          ? "Contract extracted"
                          : x.status}
                      </MiniBadge>
                    ) : (
                      <MiniBadge tone="neutral">No contract</MiniBadge>
                    )}
                    {x?.status === "COMPLETED" &&
                    x.reviewStatus !== "UNASSIGNED" ? (
                      <MiniBadge tone={EXTRACT_REVIEW_TONE[x.reviewStatus]}>
                        {EXTRACT_REVIEW_LABEL[x.reviewStatus]}
                      </MiniBadge>
                    ) : null}
                  </div>
                  <div className="mt-[3px] text-[11.5px] text-muted-foreground">
                    {ins.companyTypeLabel} · {ins.country}
                    {x ? ` · ${x.contractFilename}` : ""}
                    {x?.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
                  </div>
                  {x?.status === "FAILED" ? (
                    <div className="mt-1.5 inline-flex items-center gap-[5px] text-[11px] text-warning-subtle-foreground [&>svg]:size-[11px]">
                      <HiIcon name="alert" />
                      Last extraction failed — re-upload the contract.
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-start gap-4 pl-1.5">
                  <div className="text-center">
                    <b className="block text-[15px] font-bold tabular-nums">
                      {x ? x.ruleCount : 0}
                    </b>
                    <span className="text-[10px] text-muted-foreground">
                      rules
                    </span>
                  </div>
                  <HiIcon
                    name="chevronRight"
                    className="size-4 self-center text-muted-foreground"
                  />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- workspace */

type WsSub = "overview" | "contracts" | "members" | "rules"

const SUBS: { k: WsSub; l: string; icon: string; ready?: boolean }[] = [
  { k: "overview", l: "Overview", icon: "shield", ready: true },
  { k: "contracts", l: "Contracts", icon: "fileText", ready: true },
  { k: "members", l: "Policyholders", icon: "users" },
  { k: "rules", l: "Claim rules", icon: "sliders" },
]

export function SpInsurerWorkspace({
  provider,
  insurer,
  readonly,
  onBack,
}: {
  provider: ServiceProvider
  insurer: Insurer
  readonly: boolean
  onBack: () => void
}) {
  const [sub, setSub] = React.useState<WsSub>("overview")
  const currentQ = useCurrentExtraction(provider.displayId, insurer.accountId)
  const historyQ = useExtractionHistory(provider.displayId, insurer.accountId)
  const x = currentQ.data

  const soon: Record<string, [string, string]> = {
    members: [
      "The policyholder / member register for this insurer at this provider — scheme, benefit balance, eligibility and claim history.",
      "users",
    ],
    rules: [
      `Insurer-specific claim validation & clean-up rules applied when this provider submits claims to ${insurer.name}.`,
      "sliders",
    ],
  }

  const overviewRows: [string, React.ReactNode][] = [
    ["Insurer ID", <span className="mono">{insurer.accountId}</span>],
    ["Type", insurer.companyTypeLabel],
    ["Country", insurer.country],
    ["City", insurer.city || "—"],
    ["Regulator", insurer.regulator || "—"],
    [
      "Insurer status",
      <MiniBadge tone={insurer.status === "Active" ? "success" : "neutral"}>
        {insurer.status}
      </MiniBadge>,
    ],
    [
      "Contract extraction",
      x ? (
        <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>{x.status}</MiniBadge>
      ) : (
        <span className="text-muted-foreground">No contract uploaded yet</span>
      ),
    ],
    ...(x
      ? ([
          [
            "Rule review",
            <span className="inline-flex items-center gap-2">
              <MiniBadge tone={EXTRACT_REVIEW_TONE[x.reviewStatus]}>
                {EXTRACT_REVIEW_LABEL[x.reviewStatus]}
              </MiniBadge>
              {x.assigneeName ? (
                <span className="text-[12px] text-muted-foreground">
                  {x.assigneeName}
                  {x.assignedBy ? ` · assigned by ${x.assignedBy}` : ""}
                </span>
              ) : null}
            </span>,
          ],
          ["Contract file", x.contractFilename],
          ["Uploaded", `${x.created} · by ${x.createdBy}`],
          [
            "Completed",
            x.completed !== "—" ? (
              x.completed
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
          ],
          [
            "Model",
            x.model ? (
              <span className="mono">{x.model}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
          ],
          ["Rules extracted", String(x.rules.length)],
        ] as [string, React.ReactNode][])
      : []),
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <BackLink label="All insurers" onClick={onBack} />

      {/* workspace head */}
      <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-[13px]">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-[15px] font-bold text-primary">
          {spInitials(insurer.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[9px]">
            <h3 className="m-0 text-[16px] font-bold">{insurer.name}</h3>
            {x ? (
              <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>
                {x.status === "COMPLETED" ? "Contract extracted" : x.status}
              </MiniBadge>
            ) : (
              <MiniBadge tone="neutral">No contract</MiniBadge>
            )}
          </div>
          <div className="mt-[3px] text-[12px] text-muted-foreground">
            {insurer.companyTypeLabel} · {insurer.country} · working with{" "}
            {provider.name}
          </div>
        </div>
      </div>

      {/* workspace sub-tabs */}
      <div className="flex gap-1 border-b">
        {SUBS.map((s) => (
          <button
            key={s.k}
            type="button"
            onClick={() => setSub(s.k)}
            className={cn(
              "-mb-px inline-flex cursor-pointer items-center gap-1.5 border-b-2 px-[11px] py-2 text-[12px] font-semibold [&>svg]:size-[13px]",
              sub === s.k
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <HiIcon name={s.icon} />
            {s.l}
            {s.k === "contracts" && historyQ.data?.length ? (
              <span className="ml-[5px] rounded-full bg-muted px-1.5 py-px text-[9.5px] font-semibold text-muted-foreground">
                {historyQ.data.length}
              </span>
            ) : null}
            {!s.ready ? (
              <span className="ml-1 size-[5px] rounded-full bg-warning" />
            ) : null}
          </button>
        ))}
      </div>

      {sub === "overview" ? (
        currentQ.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : (
          <div>
            {overviewRows.map(([k, v]) => (
              <DetailRow key={k} k={k} v={v} />
            ))}
          </div>
        )
      ) : null}

      {sub === "contracts" ? (
        <SpContracts
          provider={provider}
          insurer={insurer}
          readonly={readonly}
        />
      ) : null}

      {sub === "members" || sub === "rules"
        ? (() => {
            const [txt, ic] = soon[sub]
            const s = SUBS.find((y) => y.k === sub)!
            return (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/25 px-5 py-[34px] text-center">
                <span className="grid size-[54px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[26px]">
                  <HiIcon name={ic} />
                </span>
                <div className="text-[14px] font-bold">{s.l}</div>
                <p className="m-0 max-w-[42ch] text-[12.5px] leading-[1.55] text-muted-foreground">
                  {txt}
                </p>
                <MiniBadge tone="neutral" className="mt-1">
                  Coming soon
                </MiniBadge>
              </div>
            )
          })()
        : null}
    </div>
  )
}
