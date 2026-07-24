import { Navigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  getExtraction,
  getInsurer,
  getProvider,
  type ExpExtraction,
} from "./mock"
import {
  Avatar,
  EXP_ROOT,
  ExperimentBanner,
  ExpCrumbs,
  pct,
  REVIEW_LABEL,
  REVIEW_TONE,
} from "./shared"
import { ExtractionBody, ReviewMeter } from "./rules-view"

/**
 * EXPERIMENT — a single contract's extraction as a RULE-REVIEW COCKPIT on a
 * 70/30 split. Reached by opening a contract from the insurer hub's Contracts
 * tab (`.../insurers/:insurerId/contracts/:jobId`). The current contract is
 * reviewable (the rail's actions are live); superseded contracts open
 * read-only. Data-complete against the real extraction payload: flags banner,
 * contract metadata summary, rule attributes, the full coverage matrix, review
 * due-date and the publish workflow.
 */
export function ExpContractPage() {
  const { code, insurerId, jobId } = useParams<{
    code: string
    insurerId: string
    jobId: string
  }>()

  const provider = getProvider(code)
  const insurer = getInsurer(insurerId)
  const x = getExtraction(jobId)

  if (!provider || !insurer || !x)
    return <Navigate to={`${EXP_ROOT}/${code ?? ""}`} replace />

  const recBase = `${EXP_ROOT}/${encodeURIComponent(provider.code)}`
  const insBase = `${recBase}/insurers/${encodeURIComponent(insurer.accountId)}`
  const readOnly = !x.current

  return (
    <div className="flex flex-col gap-5">
      <ExperimentBanner />
      <ExpCrumbs
        items={[
          { label: "Service providers", href: EXP_ROOT },
          { label: provider.name, href: recBase },
          { label: insurer.name, href: insBase },
          { label: x.contractFilename },
        ]}
      />

      {/* contract head */}
      <div className="flex items-start gap-3.5">
        <Avatar name={insurer.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[18px] font-bold">{x.contractFilename}</h1>
            {x.current ? (
              <MiniBadge tone="success">Current</MiniBadge>
            ) : (
              <MiniBadge tone="neutral">Superseded</MiniBadge>
            )}
            {x.published ? <MiniBadge tone="success">Published</MiniBadge> : null}
            <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
              {REVIEW_LABEL[x.reviewStatus]}
            </MiniBadge>
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">
            {insurer.name} · <span className="mono">{x.contractCode}</span> ·
            extracted {x.completedAt} · <span className="mono">{x.model}</span>
            {x.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={hifiBtn}
          onClick={() => toast(`Downloading ${x.contractFilename}…`)}
        >
          <HiIcon name="download" />
          Contract
        </Button>
      </div>

      {readOnly ? (
        <Note tone="info" icon={<HiIcon name="history" />}>
          <b>Superseded contract</b> — a newer upload replaced this one. Its
          rules are shown read-only.
        </Note>
      ) : null}

      {/* 70/30 cockpit — rules left, review rail right */}
      <div className="grid gap-5 lg:grid-cols-10">
        <div className="flex flex-col gap-4 lg:col-span-7">
          {x.flags.length ? <FlagsBanner flags={x.flags} /> : null}
          <ExtractionBody extraction={x} readOnly={readOnly} />
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
          <ReviewRail x={x} readOnly={readOnly} />
          <BreakdownCard x={x} />
        </aside>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- flags */

function FlagsBanner({ flags }: { flags: string[] }) {
  return (
    <Note tone="warn" icon={<HiIcon name="flag" />}>
      <b>
        {flags.length} extraction flag{flags.length === 1 ? "" : "s"} — resolve
        before publishing.
      </b>
      <ul className="mt-1 flex flex-col gap-0.5">
        {flags.map((f) => (
          <li key={f} className="text-[12px] leading-[1.45]">
            {f}
          </li>
        ))}
      </ul>
    </Note>
  )
}

/* ----------------------------------------------------------- review rail */

function ReviewRail({
  x,
  readOnly = false,
}: {
  x: ExpExtraction
  readOnly?: boolean
}) {
  const pending = x.rules.filter((r) => r.status === "PENDING").length
  const approved = x.rules.filter((r) => r.status === "APPROVED").length
  const discarded = x.rules.filter(
    (r) => r.status === "DISCARDED" || r.status === "ARCHIVED"
  ).length
  const reviewDone = x.reviewStatus === "COMPLETED"

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="sliders" />}
        title="Review"
        action={
          <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
            {REVIEW_LABEL[x.reviewStatus]}
          </MiniBadge>
        }
      />
      <PanelBody className="flex flex-col gap-3.5 p-4">
        {x.reviewDueAt && !reviewDone && !readOnly ? (
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground [&>svg]:size-3.5">
            <HiIcon name="clock" />
            Due {x.reviewDueAt}
          </div>
        ) : null}

        <ReviewMeter rules={x.rules} />

        <div className="grid grid-cols-3 gap-2">
          <Stat n={approved} label="Approved" tone="text-success" />
          <Stat n={pending} label="Pending" tone="text-warning" />
          <Stat n={discarded} label="Discarded" tone="text-muted-foreground" />
        </div>

        {x.assigneeName ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-2 text-[11.5px]">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-bold text-primary">
              {x.assigneeName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">
                {x.assigneeName}
              </div>
              <div className="truncate text-muted-foreground">
                {x.assignedByName ? `assigned by ${x.assignedByName}` : "reviewer"}
              </div>
            </div>
          </div>
        ) : null}

        {readOnly ? (
          <div className="flex flex-col gap-1.5 border-t pt-3 text-[11.5px] text-muted-foreground">
            {x.published ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-success-subtle-foreground [&>svg]:size-3.5">
                <HiIcon name="checkCheck" />
                Published {x.publishedAt ?? ""}
              </span>
            ) : null}
            {x.reviewCompletedAt ? (
              <span>Review completed {x.reviewCompletedAt}</span>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {x.published ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-success-subtle px-3 py-2 text-[12px] font-medium text-success-subtle-foreground [&>svg]:size-4">
                <HiIcon name="checkCheck" />
                Published {x.publishedAt ? `· ${x.publishedAt}` : ""}
              </div>
            ) : reviewDone ? (
              <Button
                className={cn(hifiBtn, "w-full")}
                onClick={() => toast("Rules book published.")}
              >
                <HiIcon name="send" />
                Publish rules book
              </Button>
            ) : (
              <>
                <Button
                  className={cn(hifiBtn, "w-full")}
                  disabled={pending > 0}
                  onClick={() => toast("Review completed.")}
                >
                  <HiIcon name="checkCheck" />
                  Complete review
                </Button>
                {pending > 0 ? (
                  <p className="text-center text-[10.5px] text-muted-foreground">
                    {pending} rule{pending === 1 ? "" : "s"} still pending
                  </p>
                ) : null}
              </>
            )}
            <Button
              variant="outline"
              className={cn(hifiBtn, "w-full")}
              onClick={() =>
                toast("Assign / reassign reviewer — would open the picker.")
              }
            >
              <HiIcon name="userCheck" />
              Reassign reviewer
            </Button>
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-lg border px-2 py-2 text-center">
      <div className={cn("text-[18px] leading-none font-bold tabular-nums", tone)}>
        {n}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

/* ------------------------------------------------------------- breakdown */

const SEV_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const
const SEV_BAR: Record<string, string> = {
  CRITICAL: "bg-destructive",
  HIGH: "bg-warning",
  MEDIUM: "bg-info",
  LOW: "bg-muted-foreground/40",
}

function BreakdownCard({ x }: { x: ExpExtraction }) {
  const total = x.rules.length || 1
  const avgConf = pct(
    x.rules.reduce((s, r) => s + r.confidence, 0) / (x.rules.length || 1)
  )

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="gauge" />} title="Breakdown" />
      <PanelBody className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          {SEV_ORDER.map((sev) => {
            const n = x.rules.filter((r) => r.severity === sev).length
            if (!n) return null
            return (
              <div key={sev} className="flex items-center gap-2 text-[11.5px]">
                <span className="w-16 shrink-0 text-muted-foreground capitalize">
                  {sev.toLowerCase()}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn("block h-full rounded-full", SEV_BAR[sev])}
                    style={{ width: `${(n / total) * 100}%` }}
                  />
                </span>
                <span className="w-4 shrink-0 text-right font-medium tabular-nums">
                  {n}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t pt-2.5 text-[12px]">
          <span className="text-muted-foreground">Avg. confidence</span>
          <span className="font-semibold tabular-nums">{avgConf}%</span>
        </div>
      </PanelBody>
    </Panel>
  )
}
