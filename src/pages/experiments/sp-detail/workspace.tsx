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
  currentExtraction,
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
  EXTRACT_TONE,
  REVIEW_LABEL,
  REVIEW_TONE,
} from "./shared"

/**
 * EXPERIMENT — provider⇆insurer workspace as a SINGLE PAGE (no sub-tabs).
 * Contracts are the primary content (main column); the insurer's reference
 * metadata sits in a right rail; Policyholders / Claim rules are slim inline
 * sections. Drilling into one contract still routes to its own results page.
 */
export function ExpWorkspacePage() {
  const { code, insurerId } = useParams<{ code: string; insurerId: string }>()
  const provider = getProvider(code)
  const insurer = getInsurer(insurerId)

  if (!provider || !insurer)
    return <Navigate to={`${EXP_ROOT}/${code ?? ""}`} replace />

  const recBase = `${EXP_ROOT}/${encodeURIComponent(provider.code)}`
  const base = `${recBase}/insurers/${encodeURIComponent(insurer.accountId)}`
  const x = currentExtraction(provider.code, insurer.accountId)
  const history = getExtractions(provider.code, insurer.accountId)

  return (
    <div className="flex flex-col gap-4">
      <ExperimentBanner />
      <ExpCrumbs
        items={[
          { label: "Service providers", href: EXP_ROOT },
          { label: provider.name, href: recBase },
          { label: "Insurers", href: `${recBase}/insurers` },
          { label: insurer.name },
        ]}
      />

      {/* identity header */}
      <div className="flex items-start gap-3">
        <Avatar name={insurer.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">
              {insurer.name}
            </h1>
            {x ? (
              <MiniBadge tone={EXTRACT_TONE[x.status]}>
                {x.status === "COMPLETED" ? "Contract extracted" : x.status}
              </MiniBadge>
            ) : (
              <MiniBadge tone="neutral">No contract</MiniBadge>
            )}
            {x && x.reviewStatus !== "UNASSIGNED" ? (
              <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
                {REVIEW_LABEL[x.reviewStatus]}
              </MiniBadge>
            ) : null}
          </div>
          <div className="mt-[5px] text-[12.5px] text-muted-foreground">
            {insurer.companyTypeLabel} · {insurer.country} · working with{" "}
            {provider.name}
          </div>
        </div>
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

      {/* single-page body: primary content + reference rail */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <ContractsSection history={history} base={base} insurer={insurer} />

          <Section icon="users" title="Policyholders">
            <SoonRow
              body={`The policyholder / member register for ${insurer.name} at ${provider.name} — scheme, benefit balance, eligibility and claim history.`}
            />
          </Section>

          <Section icon="sliders" title="Claim rules">
            <SoonRow
              body={`Insurer-specific claim validation & clean-up rules applied when ${provider.name} submits claims to ${insurer.name}.`}
            />
          </Section>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel>
            <PanelHead icon={<HiIcon name="shield" />} title="About this insurer" />
            <PanelBody className="py-1">
              <DetailRow k="Insurer ID" v={<span className="mono">{insurer.accountId}</span>} />
              <DetailRow k="Type" v={insurer.companyTypeLabel} />
              <DetailRow k="Country" v={insurer.country} />
              <DetailRow k="City" v={insurer.city} />
              <DetailRow k="Regulator" v={insurer.regulator} />
              <DetailRow
                k="Insurer status"
                v={
                  <MiniBadge tone={insurer.status === "Active" ? "success" : "neutral"}>
                    {insurer.status}
                  </MiniBadge>
                }
              />
            </PanelBody>
          </Panel>

          {x ? <ReviewCard x={x} base={base} /> : null}
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- sections */

function Section({
  icon,
  title,
  count,
  action,
  children,
}: {
  icon: string
  title: string
  count?: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold">
          <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-primary [&>svg]:size-[14px]">
            <HiIcon name={icon} />
          </span>
          {title}
          {typeof count === "number" ? (
            <span className="rounded-full bg-muted px-1.5 py-px text-[10.5px] font-semibold text-muted-foreground">
              {count}
            </span>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function SoonRow({ body }: { body: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/25 px-4 py-3.5">
      <p className="m-0 flex-1 text-[12px] leading-[1.5] text-muted-foreground">
        {body}
      </p>
      <MiniBadge tone="neutral">Coming soon</MiniBadge>
    </div>
  )
}

function ContractsSection({
  history,
  base,
  insurer,
}: {
  history: ExpExtraction[]
  base: string
  insurer: ExpInsurer
}) {
  return (
    <Section
      icon="fileText"
      title="Contracts"
      count={history.length || undefined}
      action={
        history.length ? (
          <Button
            variant="outline"
            size="sm"
            className={hifiBtn}
            onClick={() => toast("Upload contract — would open the upload drawer.")}
          >
            <HiIcon name="upload" />
            Upload
          </Button>
        ) : undefined
      }
    >
      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center">
          <span className="grid size-[46px] place-items-center rounded-[13px] border bg-card text-muted-foreground [&>svg]:size-[20px]">
            <HiIcon name="fileText" />
          </span>
          <p className="max-w-[42ch] text-[12.5px] leading-[1.55] text-muted-foreground">
            No contract uploaded for {insurer.name} yet. Upload one to extract its
            claim rules.
          </p>
          <Button
            className={hifiBtn}
            onClick={() => toast("Upload contract — would open the upload drawer.")}
          >
            <HiIcon name="upload" />
            Upload contract
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((x) => (
            <Link
              key={x.jobId}
              to={`${base}/contracts/${encodeURIComponent(x.jobId)}`}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-[13px] transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-xs",
                !x.current && "opacity-90"
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary [&>svg]:size-[18px]">
                <HiIcon name="fileText" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold">
                    {x.contractFilename}
                  </span>
                  {x.current ? (
                    <MiniBadge tone="success">Current</MiniBadge>
                  ) : (
                    <MiniBadge tone="neutral">Superseded</MiniBadge>
                  )}
                  <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
                    {REVIEW_LABEL[x.reviewStatus]}
                  </MiniBadge>
                </div>
                <div className="mt-[3px] text-[11.5px] text-muted-foreground">
                  {x.jobId} · extracted {x.completed} · {x.rules.length} rules · by{" "}
                  {x.createdBy}
                  {x.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 pl-1.5">
                <div className="text-center">
                  <b className="block text-[15px] font-bold tabular-nums">
                    {x.rules.length}
                  </b>
                  <span className="text-[10px] text-muted-foreground">rules</span>
                </div>
                <HiIcon name="chevronRight" className="size-4 self-center text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Section>
  )
}

/** Right-rail card summarising the current extraction's review state, with a
    shortcut into its full results page. */
function ReviewCard({ x, base }: { x: ExpExtraction; base: string }) {
  const approved = x.rules.filter((r) => r.status === "APPROVED").length
  const pending = x.rules.filter((r) => r.status === "PENDING").length

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="sliders" />} title="Current extraction" />
      <PanelBody className="py-1">
        <DetailRow
          k="Rule review"
          v={
            <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
              {REVIEW_LABEL[x.reviewStatus]}
            </MiniBadge>
          }
        />
        {x.assigneeName ? <DetailRow k="Reviewer" v={x.assigneeName} /> : null}
        <DetailRow k="Approved" v={`${approved} / ${x.rules.length}`} />
        <DetailRow k="Pending" v={String(pending)} />
        <DetailRow k="Completed" v={x.completed} />
        <DetailRow k="Model" v={<span className="mono">{x.model}</span>} />
      </PanelBody>
      <div className="border-t px-4 py-2.5">
        <Link
          to={`${base}/contracts/${encodeURIComponent(x.jobId)}`}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline [&>svg]:size-3.5"
        >
          Review extracted rules
          <HiIcon name="arrowRight" />
        </Link>
      </div>
    </Panel>
  )
}
