import * as React from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  getExtractions,
  getInsurer,
  getProvider,
  type ExpExtraction,
  type ExpInsurer,
} from "./mock"
import {
  Avatar,
  DetailRow,
  EXP_ROOT,
  ExperimentBanner,
  ExpCrumbs,
  REVIEW_LABEL,
  REVIEW_TONE,
} from "./shared"

/**
 * EXPERIMENT — the INSURER DETAIL page: the hub that sits between the provider
 * record and a contract's extracted rules. NO tabs — Overview + Contracts are
 * combined onto one page: the operational content (contracts + upload) fills the
 * left ~70%, the insurer profile sits in the right ~30%. Opening a contract
 * routes to its rule-review cockpit (`.../contracts/:jobId`).
 */
export function ExpInsurerPage() {
  const { code, insurerId } = useParams<{ code: string; insurerId: string }>()

  const provider = getProvider(code)
  const insurer = getInsurer(insurerId)

  if (!provider || !insurer)
    return <Navigate to={`${EXP_ROOT}/${code ?? ""}`} replace />

  const recBase = `${EXP_ROOT}/${encodeURIComponent(provider.code)}`
  const insBase = `${recBase}/insurers/${encodeURIComponent(insurer.accountId)}`
  const extractions = getExtractions(provider.code, insurer.accountId)

  const metaParts = [
    insurer.companyTypeLabel,
    insurer.country,
    insurer.city,
    `${insurer.regulator} regulated`,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <ExperimentBanner />
      <ExpCrumbs
        items={[
          { label: "Service providers", href: EXP_ROOT },
          { label: provider.name, href: recBase },
          { label: insurer.name },
        ]}
      />

      {/* header */}
      <div className="flex items-start gap-3.5">
        <Avatar name={insurer.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">
              {insurer.name}
            </h1>
            <MiniBadge tone={insurer.status === "Active" ? "success" : "neutral"}>
              {insurer.status}
            </MiniBadge>
          </div>
          <div className="mt-[5px] text-[12.5px] text-muted-foreground">
            <span className="mono">{insurer.accountId}</span>
            {" · "}
            {metaParts.join(" · ")}
            {" · "}working with {provider.name}
          </div>
        </div>
      </div>

      {/* combined body — contracts (left) · insurer profile (right) */}
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <ContractsPanel
            extractions={extractions}
            insurerName={insurer.name}
            insBase={insBase}
          />
        </div>
        <aside className="lg:col-span-3 lg:self-start">
          <InsurerProfilePanel insurer={insurer} providerName={provider.name} />
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- contracts */

function ContractsPanel({
  extractions,
  insurerName,
  insBase,
}: {
  extractions: ExpExtraction[]
  insurerName: string
  insBase: string
}) {
  const hasContracts = extractions.length > 0

  return (
    <Panel className="flex flex-col lg:min-h-[560px]">
      <PanelHead
        icon={<HiIcon name="fileText" />}
        title="Contracts"
        action={
          hasContracts ? (
            <Button
              size="sm"
              className={hifiBtn}
              onClick={() =>
                toast("Upload contract — would open the upload drawer.")
              }
            >
              <HiIcon name="upload" />
              Upload contract
            </Button>
          ) : undefined
        }
      />
      <PanelBody className="flex flex-1 flex-col p-4">
        {!hasContracts ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-10 text-center">
            <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
              <HiIcon name="fileText" />
            </span>
            <div className="text-[13.5px] font-bold">No contracts yet</div>
            <p className="max-w-[42ch] text-[12.5px] leading-[1.55] text-muted-foreground">
              Upload the signed contract with {insurerName} to extract and review
              its claim rules.
            </p>
            <Button
              className={hifiBtn}
              onClick={() =>
                toast("Upload contract — would open the upload drawer.")
              }
            >
              <HiIcon name="upload" />
              Upload contract
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-muted-foreground">
              Rules are extracted automatically from each signed contract — open
              a contract to review its rules.
            </p>
            <div className="flex flex-col gap-2.5">
              {extractions.map((c) => (
                <Link
                  key={c.jobId}
                  to={`${insBase}/contracts/${encodeURIComponent(c.jobId)}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
                    !c.current && "opacity-90"
                  )}
                >
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary [&>svg]:size-[18px]">
                    <HiIcon name="fileText" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="truncate text-[13px] font-semibold">
                        {c.contractFilename}
                      </b>
                      {c.current ? (
                        <MiniBadge tone="success">Current</MiniBadge>
                      ) : (
                        <MiniBadge tone="neutral">Superseded</MiniBadge>
                      )}
                      {c.published ? (
                        <MiniBadge tone="success">Published</MiniBadge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                      <span className="mono">{c.contractCode}</span> · extracted{" "}
                      {c.completedAt} · uploaded by {c.createdByName}
                    </div>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground sm:inline">
                    {c.rules.length} rules
                  </span>
                  <MiniBadge tone={REVIEW_TONE[c.reviewStatus]}>
                    {REVIEW_LABEL[c.reviewStatus]}
                  </MiniBadge>
                  <HiIcon
                    name="chevronRight"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              ))}
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  )
}

/* --------------------------------------------------------- insurer profile */

function InsurerProfilePanel({
  insurer,
  providerName,
}: {
  insurer: ExpInsurer
  providerName: string
}) {
  const rows: [string, React.ReactNode][] = [
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
    ["Relationship", `Working with ${providerName}`],
  ]

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="shield" />} title="Insurer profile" />
      <PanelBody>
        <div className="grid">
          {rows.map(([k, v]) => (
            <DetailRow key={k} k={k} v={v} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}
