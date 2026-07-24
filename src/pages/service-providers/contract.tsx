import * as React from "react"
import { Navigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { useServiceProvider } from "@/features/service-providers/use-service-providers"
import { useActiveInsurers } from "@/features/insurers/use-insurers"
import {
  useAddManualRule,
  useAssignReviewer,
  useExtractionJob,
  usePublishRulesBook,
  useReviewRule,
  useSetReviewStatus,
  useUpdateRule,
} from "@/features/rule-extraction/use-rule-extraction"
import { fetchContractUrl } from "@/features/rule-extraction/api"
import {
  EXTRACT_REVIEW_LABEL,
  EXTRACT_REVIEW_TONE,
  type Extraction,
} from "@/features/rule-extraction/types"
import { SpAvatar } from "./components/shared"
import { AddRuleDialog, MemberPicker } from "./components/contracts"
import { ExtractionBody } from "./components/extraction-body"
import type { RuleOps } from "./components/rules-review"
import { pct, ReviewMeter } from "./components/cockpit-shared"

const SP_ROOT = "/service-providers"

/**
 * Route component for
 * `/service-providers/:code/insurers/:insurerId/contracts/:jobId` — a single
 * contract's extraction as a RULE-REVIEW COCKPIT on a 70/30 split (matches the
 * experiment prototype). The **current** contract is reviewable (rail actions +
 * per-rule approve/edit/discard/archive + add-manual + publish, write-gated);
 * **superseded** contracts open read-only. Bound to `…/rule-extraction/jobs/{jobId}`
 * (poll-while-live); the review/publish mutations act on the pair's current
 * extraction, so they're only offered for the current contract.
 */
export function ServiceProviderContractPage() {
  const { code, insurerId, jobId } = useParams<{
    code: string
    insurerId: string
    jobId: string
  }>()
  const { isReadonly } = useAccess()
  const readonlyRole = isReadonly("providers")

  const providerQ = useServiceProvider(code ?? "")
  const provider = providerQ.data
  const dirQ = useActiveInsurers()
  const insurer = dirQ.data?.find((i) => i.accountId === insurerId) ?? null

  const apiCode = provider?.displayId ?? ""
  const jobQ = useExtractionJob(apiCode, jobId ?? null)
  const x = jobQ.data ?? null

  const reviewMut = useReviewRule()
  const updateMut = useUpdateRule()
  const addMut = useAddManualRule()
  const assignMut = useAssignReviewer()
  const statusMut = useSetReviewStatus()
  const publishMut = usePublishRulesBook()

  const [addOpen, setAddOpen] = React.useState(false)

  if (!code || !insurerId || !jobId) return <Navigate to={SP_ROOT} replace />

  const recBase = `${SP_ROOT}/${encodeURIComponent(code)}`
  const insBase = `${recBase}/insurers/${encodeURIComponent(insurerId)}`
  const insurerName = insurer?.name ?? x?.insurerName ?? insurerId

  // Write actions act on the pair's CURRENT extraction; only offer them for the
  // current contract (superseded = read-only) and when the role can write.
  const canWrite = !!x && x.current && !readonlyRole
  const refetchJob = () => void jobQ.refetch()

  const ops: RuleOps | undefined =
    !canWrite || !x || x.status !== "COMPLETED"
      ? undefined
      : {
          busy: reviewMut.isPending || updateMut.isPending,
          onReview: (ruleId, action, comment) =>
            reviewMut.mutate(
              { code: apiCode, insurerAccountId: insurerId, ruleId, action, comment },
              {
                onSuccess: () => {
                  toast(
                    action === "APPROVE"
                      ? "Rule approved."
                      : action === "DISCARD"
                        ? "Rule discarded."
                        : "Rule archived."
                  )
                  refetchJob()
                },
                onError: (e) =>
                  toast.error("Review failed", {
                    description: e instanceof Error ? e.message : undefined,
                  }),
              }
            ),
          onEdit: (ruleId, description, comment) =>
            updateMut.mutate(
              { code: apiCode, insurerAccountId: insurerId, ruleId, patch: { description, comment } },
              {
                onSuccess: () => {
                  toast("Rule updated.")
                  refetchJob()
                },
                onError: (e) =>
                  toast.error("Update failed", {
                    description: e instanceof Error ? e.message : undefined,
                  }),
              }
            ),
        }

  const crumbs = [
    { label: "Service providers", href: SP_ROOT },
    { label: provider?.name ?? "…", href: recBase },
    { label: insurerName, href: insBase },
    { label: x?.contractFilename ?? "Contract" },
  ]

  const downloadContract = async () => {
    try {
      const url = await fetchContractUrl(apiCode, insurerId)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error("Couldn’t fetch the contract", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={crumbs} />

      {providerQ.isLoading || jobQ.isLoading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : jobQ.isError || !x ? (
        <Note tone="err" icon={<HiIcon name="alert" />}>
          Couldn’t load this extraction.{" "}
          <button className="font-semibold underline underline-offset-2" onClick={refetchJob}>
            Try again
          </button>
          .
        </Note>
      ) : (
        <>
          {/* contract head */}
          <div className="flex items-start gap-3.5">
            <SpAvatar name={insurerName} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[18px] font-bold">{x.contractFilename}</h1>
                <MiniBadge tone={x.current ? "success" : "neutral"}>
                  {x.current ? "Current" : "Superseded"}
                </MiniBadge>
                {x.published ? <MiniBadge tone="success">Published</MiniBadge> : null}
                <MiniBadge tone={EXTRACT_REVIEW_TONE[x.reviewStatus]}>
                  {EXTRACT_REVIEW_LABEL[x.reviewStatus]}
                </MiniBadge>
              </div>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {insurerName} ·{" "}
                <span className="mono">{x.contractCode || x.jobId.slice(0, 8)}</span> ·
                extracted {x.completed}
                {x.model ? (
                  <>
                    {" "}
                    · <span className="mono">{x.model}</span>
                  </>
                ) : null}
                {x.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
              </div>
            </div>
            {x.current ? (
              <Button variant="ghost" size="sm" className={hifiBtn} onClick={downloadContract}>
                <HiIcon name="download" />
                Contract
              </Button>
            ) : null}
          </div>

          {!x.current ? (
            <Note tone="info" icon={<HiIcon name="history" />}>
              <b>Superseded contract</b> — a newer upload replaced this one. Its rules
              are shown read-only.
            </Note>
          ) : null}

          {x.status === "COMPLETED" ? (
            <div className="grid gap-5 lg:grid-cols-10">
              <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
                {x.flags.length ? <FlagsBanner flags={x.flags} /> : null}
                {x.warnings.length ? (
                  <Note tone="info" icon={<HiIcon name="info" />}>
                    {x.warnings.join(" ")}
                  </Note>
                ) : null}
                <ExtractionBody
                  extraction={x}
                  ops={ops}
                  onAddRule={canWrite ? () => setAddOpen(true) : undefined}
                />
              </div>
              <aside className="flex flex-col gap-4 lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
                <ReviewRail
                  x={x}
                  readOnly={!canWrite}
                  assignBusy={assignMut.isPending}
                  statusBusy={statusMut.isPending}
                  publishBusy={publishMut.isPending}
                  onAssign={(memberId) =>
                    assignMut.mutate(
                      { code: apiCode, insurerAccountId: insurerId, memberId },
                      {
                        onSuccess: (r) => {
                          toast(`Review assigned to ${r.assigneeName}.`)
                          refetchJob()
                        },
                        onError: (e) =>
                          toast.error("Couldn’t assign reviewer", {
                            description: e instanceof Error ? e.message : undefined,
                          }),
                      }
                    )
                  }
                  onStatus={(status) =>
                    statusMut.mutate(
                      { code: apiCode, insurerAccountId: insurerId, status },
                      {
                        onSuccess: () => {
                          toast(status === "IN_REVIEW" ? "Review started." : "Review marked complete.")
                          refetchJob()
                        },
                        onError: (e) =>
                          toast.error("Couldn’t update review status", {
                            description: e instanceof Error ? e.message : undefined,
                          }),
                      }
                    )
                  }
                  onPublish={() =>
                    publishMut.mutate(
                      { code: apiCode, insurerAccountId: insurerId },
                      {
                        onSuccess: () => {
                          toast("Rules book published.")
                          refetchJob()
                        },
                        onError: (e) =>
                          toast.error("Couldn’t publish", {
                            description: e instanceof Error ? e.message : undefined,
                          }),
                      }
                    )
                  }
                />
                <BreakdownCard x={x} />
              </aside>
            </div>
          ) : x.status === "FAILED" ? (
            <Note tone="err" icon={<HiIcon name="alert" />}>
              <b>Extraction failed.</b>{" "}
              {x.error || "The document could not be processed."} Re-upload a clearer
              copy from the insurer page.
            </Note>
          ) : (
            <RunningPanel x={x} />
          )}

          {canWrite && addOpen ? (
            <AddRuleDialog
              open
              insurerName={insurerName}
              busy={addMut.isPending}
              onOpenChange={setAddOpen}
              onSubmit={(body) =>
                addMut.mutate(
                  { code: apiCode, insurerAccountId: insurerId, body },
                  {
                    onSuccess: () => {
                      toast("Manual rule added.")
                      setAddOpen(false)
                      refetchJob()
                    },
                    onError: (e) =>
                      toast.error("Couldn’t add rule", {
                        description: e instanceof Error ? e.message : undefined,
                      }),
                  }
                )
              }
            />
          ) : null}
        </>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- flags */

function FlagsBanner({ flags }: { flags: string[] }) {
  return (
    <Note tone="warn" icon={<HiIcon name="flag" />}>
      <b>
        {flags.length} extraction flag{flags.length === 1 ? "" : "s"} — resolve before
        publishing.
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
  readOnly,
  assignBusy,
  statusBusy,
  publishBusy,
  onAssign,
  onStatus,
  onPublish,
}: {
  x: Extraction
  readOnly: boolean
  assignBusy: boolean
  statusBusy: boolean
  publishBusy: boolean
  onAssign: (memberId: number) => void
  onStatus: (status: "IN_REVIEW" | "COMPLETED") => void
  onPublish: () => void
}) {
  const pending = x.ruleCounts.PENDING ?? 0
  const approved = x.ruleCounts.APPROVED ?? 0
  const discarded = (x.ruleCounts.DISCARDED ?? 0) + (x.ruleCounts.ARCHIVED ?? 0)
  const rs = x.reviewStatus
  const busy = assignBusy || statusBusy || publishBusy

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="sliders" />}
        title="Review"
        action={<MiniBadge tone={EXTRACT_REVIEW_TONE[rs]}>{EXTRACT_REVIEW_LABEL[rs]}</MiniBadge>}
      />
      <PanelBody className="flex flex-col gap-3.5 p-4">
        {x.reviewDueAt && rs !== "COMPLETED" && !readOnly ? (
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
              {x.assigneeName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-foreground">{x.assigneeName}</div>
              <div className="truncate text-muted-foreground">
                {x.assignedBy ? `assigned by ${x.assignedBy}` : "reviewer"}
              </div>
            </div>
          </div>
        ) : null}

        {readOnly ? (
          (x.published && x.publishedAt !== "—") || x.reviewCompleted !== "—" ? (
            <div className="flex flex-col gap-1.5 border-t pt-3 text-[11.5px] text-muted-foreground">
              {x.published ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-success-subtle-foreground [&>svg]:size-3.5">
                  <HiIcon name="checkCheck" />
                  Published {x.publishedAt !== "—" ? x.publishedAt : ""}
                </span>
              ) : null}
              {x.reviewCompleted !== "—" ? (
                <span>Review completed {x.reviewCompleted}</span>
              ) : null}
            </div>
          ) : null
        ) : (
          <div className="flex flex-col gap-2">
            {x.published ? (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-success-subtle px-3 py-2 text-[12px] font-medium text-success-subtle-foreground [&>svg]:size-4">
                <HiIcon name="checkCheck" />
                Published{x.publishedAt !== "—" ? ` · ${x.publishedAt}` : ""}
              </div>
            ) : rs === "COMPLETED" ? (
              <Button className={cn(hifiBtn, "w-full")} disabled={busy || pending > 0} onClick={onPublish}>
                <HiIcon name="send" />
                Publish rules book
              </Button>
            ) : rs === "IN_REVIEW" ? (
              <>
                <Button
                  className={cn(hifiBtn, "w-full")}
                  disabled={busy || pending > 0}
                  onClick={() => onStatus("COMPLETED")}
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
            ) : rs === "ASSIGNED" ? (
              <Button className={cn(hifiBtn, "w-full")} disabled={busy} onClick={() => onStatus("IN_REVIEW")}>
                <HiIcon name="eye" />
                Start review
              </Button>
            ) : null}

            <MemberPicker
              label={x.assigneeName ? "Reassign reviewer" : "Assign reviewer"}
              emphasis={rs === "UNASSIGNED"}
              busy={busy}
              onPick={onAssign}
            />
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="rounded-lg border px-2 py-2 text-center">
      <div className={cn("text-[18px] leading-none font-bold tabular-nums", tone)}>{n}</div>
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

function BreakdownCard({ x }: { x: Extraction }) {
  const total = x.rules.length || 1
  const withConf = x.rules.filter((r) => r.confidence != null)
  const avgConf =
    withConf.length > 0
      ? pct(withConf.reduce((s, r) => s + (r.confidence ?? 0), 0) / withConf.length)
      : null

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
                <span className="w-4 shrink-0 text-right font-medium tabular-nums">{n}</span>
              </div>
            )
          })}
        </div>
        {avgConf != null ? (
          <div className="flex items-center justify-between border-t pt-2.5 text-[12px]">
            <span className="text-muted-foreground">Avg. confidence</span>
            <span className="font-semibold tabular-nums">{avgConf}%</span>
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  )
}

/* --------------------------------------------------------- running panel */

function RunningPanel({ x }: { x: Extraction }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-12 text-center">
      <span className="mb-1 grid size-14 place-items-center rounded-[16px] bg-primary/12 text-primary [&>svg]:size-[26px]">
        <HiIcon name="clock" className="animate-[spin_2.4s_linear_infinite]" />
      </span>
      <div className="text-[15px] font-bold">
        {x.status === "RUNNING" ? "Extraction running" : "Extraction queued"}
      </div>
      <p className="max-w-[46ch] text-[12.5px] leading-[1.55] text-muted-foreground">
        The contract <span className="font-medium">{x.contractFilename}</span> is being
        analysed in the background. This refreshes automatically — you can leave and come
        back.
      </p>
      <span className="mono mt-1 text-[11px] text-muted-foreground">{x.jobId}</span>
    </div>
  )
}
