import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { TabBar } from "@/components/console/tab-bar"
import { ConsoleSelect, Field, FormGrid } from "@/components/console/form-atoms"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import type { ServiceProvider } from "@/features/service-providers/types"
import type { Insurer } from "@/features/insurers/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useMembers } from "@/features/access/use-members"
import {
  useAddManualRule,
  useAssignReviewer,
  useCurrentExtraction,
  useExtractionHistory,
  useExtractionJob,
  useReviewRule,
  useSetReviewStatus,
  useStartExtraction,
  useUpdateRule,
} from "@/features/rule-extraction/use-rule-extraction"
import type {
  AddManualRuleInput,
  RuleReviewAction,
} from "@/features/rule-extraction/api"
import {
  COV_TONE,
  EXTRACT_REVIEW_LABEL,
  EXTRACT_REVIEW_TONE,
  EXTRACT_STATUS_TONE,
  RULE_CAT_ICON,
  RULE_REVIEW_TONE,
  SEV_TONE,
  type Extraction,
  type ExtractedRule,
  type RuleReviewStatus,
} from "@/features/rule-extraction/types"
import { BackLink, DetailRow, spInitials } from "./shared"

/*
 * Contracts & rule extraction (Claim Clean-up) — LIVE against
 * `/platform/service-providers/{code}/rule-extraction/{insurerAccountId}`:
 * upload (contract only; checks come from the platform catalogue) →
 * queued job (polled) → extracted rules →
 * review (approve / discard / archive), in-place edits, and the
 * extraction-level review workflow (assign reviewer → start → complete).
 * Superseded history rows open read-only via `…/jobs/{jobId}`.
 */

/** Review handlers threaded from the results view into each rule card. */
type ReviewOps = {
  busy: boolean
  onReview: (ruleId: string, action: RuleReviewAction, comment?: string) => void
  onEdit: (ruleId: string, description: string, comment: string) => void
}

const RULE_STATUS_BORDER: Record<RuleReviewStatus, string> = {
  APPROVED: "border-l-success",
  DISCARDED: "border-l-destructive",
  ARCHIVED: "border-l-muted-foreground",
  PENDING: "border-l-warning",
}

/* ---------- confidence meter ---------- */
function Conf({ v }: { v: number }) {
  const pct = Math.round(v * 100)
  const tone =
    v >= 0.9
      ? "text-success [&_i]:bg-success"
      : v >= 0.75
        ? "text-warning-subtle-foreground [&_i]:bg-warning"
        : "text-destructive [&_i]:bg-destructive"
  return (
    <span
      title={`Model confidence ${pct}%`}
      className={cn(
        "mono inline-flex items-center gap-[5px] text-[10.5px] font-semibold",
        tone
      )}
    >
      <span className="h-[5px] w-[42px] overflow-hidden rounded-full bg-muted">
        <i className="block h-full rounded-full" style={{ width: pct + "%" }} />
      </span>
      {pct}%
    </span>
  )
}

/* ---------- one rule card (view + review actions) ---------- */
function RuleCard({ r, ops }: { r: ExtractedRule; ops?: ReviewOps }) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"discard" | "archive" | "edit" | null>(
    null
  )
  const [text, setText] = React.useState("")
  const [desc, setDesc] = React.useState(r.description)
  const st = r.reviewStatus

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-l-[3px] bg-card shadow-xs",
        RULE_STATUS_BORDER[st]
      )}
    >
      <div
        className="flex cursor-pointer gap-3 px-[15px] py-[13px] hover:bg-muted/35"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <code className="mono rounded-[5px] bg-muted px-[7px] py-0.5 text-[11.5px] font-bold">
              {r.ruleId}
            </code>
            <MiniBadge tone={SEV_TONE[r.severity] ?? "neutral"}>
              {r.severity}
            </MiniBadge>
            <span className="text-[11px] text-muted-foreground capitalize">
              {r.type.replace(/_/g, " ").toLowerCase()}
            </span>
            {r.manual ? <MiniBadge tone="info">Manual</MiniBadge> : null}
            <span className="flex-1" />
            <MiniBadge tone={RULE_REVIEW_TONE[st]}>{st}</MiniBadge>
          </div>
          <div className="mt-[7px] text-[13px] leading-normal">
            {r.description}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 [&>svg]:size-[11px]">
              <HiIcon name="gitBranch" />
              {r.serviceCategory}
            </span>
            <span className="inline-flex items-center gap-1 [&>svg]:size-[11px]">
              <HiIcon name="bookOpen" />
              {r.source}
            </span>
            <span className="mono">{r.checkRef}</span>
            {r.confidence != null ? <Conf v={r.confidence} /> : null}
          </div>
        </div>
        <HiIcon
          name={open ? "chevronDown" : "chevronRight"}
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
      </div>

      {open ? (
        <div className="grid gap-[11px] border-t px-[15px] pt-1 pb-[15px]">
          <div className="mt-[11px]">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Rule logic
            </span>
            <code className="mono mt-1 block rounded-lg bg-muted/60 px-[11px] py-2 text-[12px]">
              {r.logic}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Check field
              </span>
              <span className="mono text-[12.5px]">{r.checkField}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Unit of application
              </span>
              <span className="text-[12.5px]">{r.unit}</span>
            </div>
          </div>
          {r.quote ? (
            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-[12.5px] leading-[1.55] italic [&>svg]:mr-[5px] [&>svg]:inline [&>svg]:size-[13px] [&>svg]:-translate-y-px [&>svg]:text-muted-foreground">
              <HiIcon name="quote" />“{r.quote}”
              <span className="text-muted-foreground not-italic">
                {" "}
                — {r.source}
              </span>
            </div>
          ) : null}

          {st !== "PENDING" && r.reviewedBy ? (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-[11px] py-2 text-[12px] [&>svg]:size-3 [&>svg]:shrink-0",
                st === "APPROVED"
                  ? "bg-success-subtle text-success-subtle-foreground"
                  : st === "DISCARDED"
                    ? "bg-destructive/9 text-destructive"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <HiIcon
                name={
                  st === "APPROVED"
                    ? "check"
                    : st === "DISCARDED"
                      ? "x"
                      : "archive"
                }
              />
              <span>
                <b className="font-semibold capitalize">{st.toLowerCase()}</b>
                {r.reviewComment ? <>: {r.reviewComment}</> : null}{" "}
                <span className="font-normal text-muted-foreground">
                  · {r.reviewedBy} · {r.reviewedAt}
                </span>
              </span>
            </div>
          ) : null}
          {st === "PENDING" && r.reviewComment ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-[11px] py-2 text-[12px] text-primary [&>svg]:size-3 [&>svg]:shrink-0">
              <HiIcon name="pencil" />
              <span>
                <b className="font-semibold">Edited:</b> {r.reviewComment}
              </span>
            </div>
          ) : null}

          {ops && st === "PENDING" && !mode ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => ops.onReview(r.ruleId, "APPROVE")}
              >
                <HiIcon name="check" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => {
                  setMode("edit")
                  setDesc(r.description)
                  setText("")
                }}
              >
                <HiIcon name="pencil" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => {
                  setMode("discard")
                  setText("")
                }}
              >
                <HiIcon name="x" />
                Discard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={hifiBtn}
                disabled={ops.busy}
                onClick={() => {
                  setMode("archive")
                  setText("")
                }}
              >
                <HiIcon name="archive" />
                Archive
              </Button>
            </div>
          ) : null}

          {ops && mode ? (
            <div>
              {mode === "edit" ? (
                <>
                  <label className="mb-[5px] block text-[11.5px] font-semibold">
                    Rule description
                  </label>
                  <textarea
                    rows={2}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="mb-2 w-full resize-y rounded-lg border border-input bg-background px-[11px] py-2 text-[13px] focus:border-primary focus:ring-[3px] focus:ring-ring/16 focus:outline-none"
                  />
                </>
              ) : null}
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
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={hifiBtn}
                  onClick={() => setMode(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant={mode === "discard" ? "destructive" : "default"}
                  size="sm"
                  className={hifiBtn}
                  disabled={
                    ops.busy ||
                    text.trim().length < 3 ||
                    (mode === "edit" && desc.trim().length < 3)
                  }
                  onClick={() => {
                    if (mode === "edit") ops.onEdit(r.ruleId, desc, text)
                    else
                      ops.onReview(
                        r.ruleId,
                        mode === "discard" ? "DISCARD" : "ARCHIVE",
                        text
                      )
                    setMode(null)
                  }}
                >
                  <HiIcon
                    name={
                      mode === "discard"
                        ? "x"
                        : mode === "archive"
                          ? "archive"
                          : "check"
                    }
                  />
                  {mode === "discard"
                    ? "Discard rule"
                    : mode === "archive"
                      ? "Archive rule"
                      : "Save edit"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ---------- grouped rules list ---------- */
const CAT_ORDER = Object.keys(RULE_CAT_ICON)

function RulesByCategory({
  rules,
  ops,
}: {
  rules: ExtractedRule[]
  ops?: ReviewOps
}) {
  const cats = [...new Set(rules.map((r) => r.category))].sort((a, b) => {
    const ia = CAT_ORDER.indexOf(a)
    const ib = CAT_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b)
  })
  return (
    <div className="flex flex-col gap-[18px]">
      {cats.map((cat) => {
        const rs = rules.filter((r) => r.category === cat)
        return (
          <div key={cat}>
            <div className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              <span className="grid size-6 place-items-center rounded-[7px] bg-primary/10 text-primary [&>svg]:size-3.5">
                <HiIcon name={RULE_CAT_ICON[cat] ?? "sliders"} />
              </span>
              {cat}
              <span className="mono rounded-full bg-muted px-1.5 py-px text-[10px] font-bold tracking-normal">
                {rs.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {rs.map((r) => (
                <RuleCard key={r.ruleId} r={r} ops={ops} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- coverage + metadata summary ---------- */
const CS_TONE: Record<string, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  primary: "bg-primary/12 text-primary",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive/12 text-destructive",
  neutral: "bg-muted text-muted-foreground",
}

function ExtractionSummary({ x }: { x: Extraction }) {
  const cov = x.coverage
  const ex = cov.filter((c) => c.status === "EXTRACTED").length
  const fl = cov.filter((c) => c.status === "MISSING_FLAGGED").length
  const ab = cov.filter((c) => c.status === "RECORDED_ABSENT").length
  const m = x.metadata
  const scheme = x.rules.find((r) => r.schemeCategory !== "—")?.schemeCategory
  const stats: [string, number, string, string][] = [
    ["Rules extracted", x.rules.length, "checkCircle", "success"],
    ["Checks covered", ex, "shieldCheck", "primary"],
    ["Flagged gaps", fl, "alert", fl ? "error" : "neutral"],
    ["Recorded absent", ab, "minus", "neutral"],
  ]
  const covGrid =
    "grid grid-cols-[90px_minmax(0,1fr)_110px_150px_60px] items-center gap-3"

  return (
    <div className="flex flex-col gap-3.5">
      <Panel>
        <PanelHead
          icon={<HiIcon name="fileText" />}
          title="Contract metadata"
          action={
            x.model ? (
              <span className="mono text-[11.5px] text-muted-foreground">
                {x.model}
              </span>
            ) : undefined
          }
        />
        <PanelBody>
          <div className="grid gap-x-10 sm:grid-cols-2">
            {(
              [
                ["Document type", m?.documentType ?? "—"],
                ["Payer / administrator", m?.payerName ?? "—"],
                ["Healthcare provider", m?.healthcareProvider ?? "—"],
                ["Scheme category", scheme ?? "—"],
                ["Duration", m?.durationTerm ?? "—"],
                ["Services covered", m?.servicesCovered ?? "—"],
              ] as [string, string][]
            ).map(([k, v]) => (
              <DetailRow key={k} k={k} v={v} />
            ))}
          </div>
          {m && m.missingFields.length > 0 ? (
            <Note
              tone="warn"
              icon={<HiIcon name="alert" />}
              className="mt-3 text-[12px]"
            >
              <b>{m.missingFields.length} fields not found in document:</b>{" "}
              {m.missingFields.join(", ").replace(/_/g, " ")}.
            </Note>
          ) : null}
        </PanelBody>
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([l, n, ic, tone]) => (
          <div
            key={l}
            className="flex items-center gap-[11px] rounded-xl border bg-card px-[15px] py-[13px] shadow-xs"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[9px] [&>svg]:size-[15px]",
                CS_TONE[tone]
              )}
            >
              <HiIcon name={ic} />
            </span>
            <div>
              <div className="text-[20px] leading-none font-bold tabular-nums">
                {n}
              </div>
              <div className="mt-[3px] text-[11.5px] text-muted-foreground">
                {l}
              </div>
            </div>
          </div>
        ))}
      </div>

      {x.flags.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-[9px] bg-warning-subtle px-3 py-2.5 text-[12.5px] text-warning-subtle-foreground">
          <div className="flex items-center gap-[7px] font-semibold [&>svg]:size-[15px]">
            <HiIcon name="alert" />
            {x.flags.length} flag{x.flags.length !== 1 ? "s" : ""} requiring
            follow-up
          </div>
          <ul className="m-0 list-disc pl-[30px] text-[12px] leading-[1.6]">
            {x.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {x.warnings.length > 0 ? (
        <div className="flex items-start gap-2.5 rounded-[9px] bg-muted px-3 py-2.5 text-[12px] text-muted-foreground [&>svg]:mt-px [&>svg]:size-3.5 [&>svg]:shrink-0">
          <HiIcon name="info" />
          <span>{x.warnings.join(" ")}</span>
        </div>
      ) : null}

      {cov.length > 0 ? (
        <Panel>
          <PanelHead
            icon={<HiIcon name="shieldCheck" />}
            title="Coverage checks"
          />
          <div
            className={cn(
              covGrid,
              "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            )}
          >
            <span>Check</span>
            <span>Category</span>
            <span>Criticality</span>
            <span>Result</span>
            <span>Rules</span>
          </div>
          {cov.map((c) => (
            <div
              key={c.checkId}
              title={c.note || undefined}
              className={cn(covGrid, "border-b px-4 py-2.5 last:border-b-0")}
            >
              <div className="mono text-[11.5px]">{c.checkId}</div>
              <div className="text-[12.5px]">{c.category}</div>
              <div className="text-[11.5px] text-muted-foreground">
                {c.criticality}
              </div>
              <div>
                <MiniBadge tone={COV_TONE[c.status]}>
                  {c.status.replace(/_/g, " ").toLowerCase()}
                </MiniBadge>
              </div>
              <div className="text-[12.5px]">{c.ruleCount || "—"}</div>
            </div>
          ))}
        </Panel>
      ) : null}
    </div>
  )
}

/* ================= CONTRACTS (inside insurer workspace) ================= */

type CtrView = "list" | "upload" | "status" | "results"

export function SpContracts({
  provider,
  insurer,
  readonly,
}: {
  provider: ServiceProvider
  insurer: Insurer
  readonly: boolean
}) {
  const code = provider.displayId
  const ins = insurer.accountId
  const [view, setView] = React.useState<CtrView>("list")
  const [openJobId, setOpenJobId] = React.useState<string | null>(null)

  const currentQ = useCurrentExtraction(code, ins)
  const historyQ = useExtractionHistory(code, ins)
  const startMut = useStartExtraction()

  const current = currentQ.data
  const history = historyQ.data ?? []

  if (openJobId)
    return (
      <SupersededJob
        provider={provider}
        insurer={insurer}
        jobId={openJobId}
        onBack={() => setOpenJobId(null)}
      />
    )

  if (view === "upload")
    return (
      <ContractUpload
        insurer={insurer}
        busy={startMut.isPending}
        onBack={() => setView("list")}
        onSubmit={(contract) =>
          startMut.mutate(
            { code, insurerAccountId: ins, contract },
            {
              onSuccess: () => {
                toast("Contract accepted — extraction job queued.")
                setView("status")
              },
              onError: (e) =>
                toast.error("Couldn’t start extraction", {
                  description: e instanceof Error ? e.message : undefined,
                }),
            }
          )
        }
      />
    )

  if (view === "status" && current)
    return (
      <ExtractionStatusView
        x={current}
        onBack={() => setView("list")}
        onReupload={() => setView("upload")}
      />
    )

  if (view === "results" && current && current.status === "COMPLETED")
    return (
      <ContractResults
        provider={provider}
        insurer={insurer}
        x={current}
        readonly={readonly}
        onBack={() => setView("list")}
      />
    )

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold">
            Contracts &amp; extracted rules
          </div>
          <div className="text-[12px] text-muted-foreground">
            Upload the signed contract for {insurer.name}. Rules are extracted
            automatically, then reviewed.
          </div>
        </div>
        {!readonly ? (
          <Button className={hifiBtn} onClick={() => setView("upload")}>
            <HiIcon name="upload" />
            Upload contract
          </Button>
        ) : null}
      </div>

      {historyQ.isLoading || currentQ.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : history.length === 0 ? (
        <div className="mt-[18px] flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-12 text-center">
          <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
            <HiIcon name="fileText" />
          </span>
          <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:text-foreground">
            <b>No contracts yet.</b>
            <br />
            Upload the signed contract with {insurer.name} to extract its claim
            rules.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((c) => {
            const live = c.status === "QUEUED" || c.status === "RUNNING"
            // The row's own `current` flag can lag right after a start, so
            // the fetched current extraction decides which row is "live";
            // every other row opens read-only via the jobs endpoint.
            const isCurrent = current?.jobId === c.jobId
            return (
              <div
                key={c.jobId}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isCurrent)
                    setView(c.status === "COMPLETED" ? "results" : "status")
                  else setOpenJobId(c.jobId)
                }}
                title={
                  !isCurrent ? "Superseded extraction — read-only" : undefined
                }
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-[15px] py-[13px] shadow-xs hover:border-primary/40",
                  !isCurrent && "opacity-80"
                )}
              >
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary [&>svg]:size-[18px]">
                  <HiIcon name="fileText" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="truncate text-[13px] font-semibold">
                      {c.contractFilename}
                    </b>
                    <span className="mono shrink-0 text-[11px] text-muted-foreground">
                      {c.jobId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    uploaded {c.created} by {c.createdBy}
                    {c.model ? ` · ${c.model}` : ""}
                  </div>
                </div>
                {c.status === "COMPLETED" ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                    {c.ruleCount} rules
                  </span>
                ) : null}
                {c.status === "COMPLETED" && c.reviewStatus !== "UNASSIGNED" ? (
                  <MiniBadge tone={EXTRACT_REVIEW_TONE[c.reviewStatus]}>
                    {EXTRACT_REVIEW_LABEL[c.reviewStatus]}
                  </MiniBadge>
                ) : null}
                <MiniBadge tone={EXTRACT_STATUS_TONE[c.status]}>
                  {c.status}
                </MiniBadge>
                {live ? (
                  <HiIcon
                    name="clock"
                    className="size-4 animate-[spin_2.4s_linear_infinite] text-warning"
                  />
                ) : null}
                <HiIcon
                  name="chevronRight"
                  className="size-4 text-muted-foreground"
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- upload (signed contract; checks come from the platform
   Rules Extraction Checks catalogue server-side) ---------- */
function FileSlot({
  label,
  hint,
  accept,
  file,
  onFile,
}: {
  label: string
  hint: string
  accept: string
  file: File | null
  onFile: (f: File | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold">{label}</label>
      {!file ? (
        <label className="block cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-input p-[18px] text-center transition-colors hover:border-primary hover:bg-primary/3">
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <HiIcon
            name="upload2"
            className="mx-auto mb-1.5 size-[22px] text-muted-foreground"
          />
          <b className="block text-[13px] font-semibold">
            Drop the file here or click to browse
          </b>
          <span className="text-[12px] text-muted-foreground">{hint}</span>
        </label>
      ) : (
        <div className="flex items-center gap-[11px] rounded-[11px] border border-primary/40 bg-primary/4 px-[13px] py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/14 text-primary [&>svg]:size-[18px]">
            <HiIcon name="fileText" />
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-[13px] font-semibold">
              {file.name}
            </b>
            <div className="text-[11.5px] text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · ready to submit
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-[15px]"
          >
            <HiIcon name="trash" />
          </button>
        </div>
      )}
    </div>
  )
}

function ContractUpload({
  insurer,
  busy,
  onBack,
  onSubmit,
}: {
  insurer: Insurer
  busy: boolean
  onBack: () => void
  onSubmit: (contract: File) => void
}) {
  const [contract, setContract] = React.useState<File | null>(null)
  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <BackLink label="Contracts" onClick={onBack} />
      <div>
        <div className="text-[15px] font-bold">Upload contract</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">
          For <b className="font-semibold text-foreground">{insurer.name}</b>.
          The document is sent for automated rule extraction — this runs in the
          background.
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-semibold">Insurer</label>
        <div className="flex items-center gap-2.5 rounded-[9px] border bg-muted/40 px-3 py-[9px] text-[13px] font-semibold">
          <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-primary/10 text-[10px] font-bold text-primary">
            {spInitials(insurer.name)}
          </span>
          {insurer.name}
          <MiniBadge tone="success" className="ml-auto">
            Selected
          </MiniBadge>
        </div>
      </div>

      <FileSlot
        label="Signed contract"
        hint="PDF, JPG/PNG or DOCX up to 25 MB"
        accept=".pdf,.png,.jpg,.jpeg,.docx"
        file={contract}
        onFile={setContract}
      />

      <Note tone="info" icon={<HiIcon name="info" />}>
        Extraction is asynchronous. You'll get a job ID and can track status;
        results appear here once <b>Completed</b>. Scanned images work but
        text-based PDFs extract most accurately. The provider must be{" "}
        <b>Active</b> to start an extraction.
      </Note>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" className={hifiBtn} onClick={onBack}>
          Cancel
        </Button>
        <Button
          className={hifiBtn}
          disabled={!contract || busy}
          onClick={() => contract && onSubmit(contract)}
        >
          <HiIcon name="send" />
          {busy ? "Submitting…" : "Submit for extraction"}
        </Button>
      </div>
    </div>
  )
}

/* ---------- extraction status (live, polled) ---------- */
function ExtractionStatusView({
  x,
  onBack,
  onReupload,
}: {
  x: Extraction
  onBack: () => void
  /** Omitted for superseded jobs — a newer extraction already exists. */
  onReupload?: () => void
}) {
  const failed = x.status === "FAILED"
  const done = x.status === "COMPLETED"
  return (
    <div className="flex max-w-[640px] flex-col gap-4">
      <BackLink label="Contracts" onClick={onBack} />
      <div className="flex flex-col items-center gap-1 rounded-[14px] border bg-card p-5 text-center">
        <span
          className={cn(
            "mb-1.5 grid size-16 place-items-center rounded-[18px] [&>svg]:size-[30px]",
            failed
              ? "bg-destructive/12 text-destructive"
              : done
                ? "bg-success-subtle text-success-subtle-foreground"
                : "bg-primary/12 text-primary"
          )}
        >
          <HiIcon
            name={failed ? "alert" : done ? "checkCircle" : "clock"}
            className={
              failed || done ? "" : "animate-[spin_2.4s_linear_infinite]"
            }
          />
        </span>
        <h2 className="m-0 text-[18px] font-bold">
          {failed
            ? "Extraction failed"
            : done
              ? "Extraction complete"
              : x.status === "RUNNING"
                ? "Extraction running"
                : "Extraction queued"}
        </h2>
        <p className="m-0 max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground">
          {failed
            ? x.error ||
              "The document could not be processed. Re-upload a clearer copy or a text-based PDF."
            : done
              ? `${x.rules.length} rules extracted — open the contract to review them.`
              : "The contract has been accepted and is being analysed in the background. This view refreshes automatically — you can also leave this page."}
        </p>
        <div className="mt-4 w-full max-w-[460px] overflow-hidden rounded-[11px] border">
          {(
            [
              ["Job ID", <code className="mono text-[12px]">{x.jobId}</code>],
              [
                "Status",
                <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>
                  {x.status}
                </MiniBadge>,
              ],
              [
                "Contract",
                <span className="text-[12px]">{x.contractFilename}</span>,
              ],
              // Legacy two-file jobs only — new jobs validate against the
              // platform checks catalogue, not an uploaded workbook.
              ...(x.checksFilename
                ? [
                    [
                      "Checks",
                      <span className="text-[12px]">{x.checksFilename}</span>,
                    ] as [string, React.ReactNode],
                  ]
                : []),
            ] as [string, React.ReactNode][]
          ).map(([k, v]) => (
            <div
              key={k}
              className="flex items-center gap-2.5 border-t px-[13px] py-2.5 text-left text-[12.5px] first:border-t-0"
            >
              <span className="w-[92px] shrink-0 text-[11.5px] text-muted-foreground">
                {k}
              </span>
              {v}
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-2.5">
          <Button variant="outline" className={hifiBtn} onClick={onBack}>
            <HiIcon name="chevronLeft" />
            Back to contracts
          </Button>
          {failed && onReupload ? (
            <Button className={hifiBtn} onClick={onReupload}>
              <HiIcon name="upload" />
              Re-upload
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ---------- completed results ---------- */
const RPB_SEG: Record<RuleReviewStatus, string> = {
  APPROVED: "bg-success text-white",
  PENDING: "bg-warning text-warning-subtle-foreground",
  DISCARDED: "bg-destructive text-white",
  ARCHIVED: "bg-muted-foreground text-white",
}
const RPB_ORDER: RuleReviewStatus[] = [
  "APPROVED",
  "PENDING",
  "DISCARDED",
  "ARCHIVED",
]

function RuleProgressBar({
  tally,
  className,
}: {
  tally: Partial<Record<RuleReviewStatus, number>>
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-[26px] gap-[3px] overflow-hidden rounded-lg",
        className
      )}
    >
      {RPB_ORDER.map((s) =>
        tally[s] ? (
          <span
            key={s}
            style={{ flex: tally[s] }}
            className={cn(
              "flex min-w-0 items-center justify-center px-1.5 text-[10.5px] font-semibold whitespace-nowrap capitalize",
              RPB_SEG[s]
            )}
          >
            {tally[s]} {s.toLowerCase()}
          </span>
        ) : null
      )}
    </div>
  )
}

/* ---------- add a manual rule (staff-authored; created APPROVED) ---------- */

const MANUAL_CATEGORIES = Object.keys(RULE_CAT_ICON)
const MANUAL_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

/** Empty form → the field set the API accepts (description required). */
type AddRuleForm = {
  description: string
  rule_category: string
  severity: string
  rule_type: string
  service_category: string
  rule_logic: string
  check_field: string
  unit_of_application: string
  source: string
  check_ref: string
  comment: string
}
const EMPTY_FORM: AddRuleForm = {
  description: "",
  rule_category: "",
  severity: "",
  rule_type: "",
  service_category: "",
  rule_logic: "",
  check_field: "",
  unit_of_application: "",
  source: "",
  check_ref: "",
  comment: "",
}

function AddRuleDialog({
  open,
  insurerName,
  busy,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  insurerName: string
  busy: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (body: AddManualRuleInput) => void
}) {
  // The parent mounts this only while open, so a fresh mount always starts
  // from an empty form — no reset effect needed.
  const [f, setF] = React.useState<AddRuleForm>(EMPTY_FORM)
  const set = <K extends keyof AddRuleForm>(k: K, v: string) =>
    setF((p) => ({ ...p, [k]: v }))

  const valid = f.description.trim().length >= 3

  const submit = () => {
    if (!valid) return
    // Only send fields the user actually filled — an empty string would
    // otherwise persist as blank rather than being left unset.
    const body: AddManualRuleInput = { description: f.description.trim() }
    const opt = [
      "rule_category",
      "severity",
      "rule_type",
      "service_category",
      "rule_logic",
      "check_field",
      "unit_of_application",
      "source",
      "check_ref",
      "comment",
    ] as const
    for (const k of opt) {
      const v = f[k].trim()
      if (v) body[k] = v
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-[620px]">
        <DialogHeader className="border-b px-[22px] py-[18px]">
          <DialogTitle className="flex items-center gap-2 text-[16px] [&>svg]:size-[18px] [&>svg]:text-primary">
            <HiIcon name="plus" />
            Add a rule manually
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Author a rule the extractor missed for{" "}
            <b className="font-semibold text-foreground">{insurerName}</b>. It’s
            added to this contract’s rules as{" "}
            <b className="font-semibold text-foreground">Approved</b> and marked{" "}
            <b className="font-semibold text-foreground">Manual</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-[22px] py-5">
          <Field label="Rule description" required>
            <Textarea
              rows={2}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. Late charges not allowed after 30 days from date of discharge."
            />
          </Field>

          <FormGrid>
            <Field label="Category">
              <ConsoleSelect
                value={f.rule_category}
                onChange={(v) => set("rule_category", v)}
                options={MANUAL_CATEGORIES}
                placeholder="Select category"
              />
            </Field>
            <Field label="Severity">
              <ConsoleSelect
                value={f.severity}
                onChange={(v) => set("severity", v)}
                options={MANUAL_SEVERITIES}
                placeholder="Select severity"
              />
            </Field>
            <Field label="Rule type">
              <Input
                value={f.rule_type}
                onChange={(e) => set("rule_type", e.target.value)}
                placeholder="e.g. SUBMISSION_DEADLINE"
              />
            </Field>
            <Field label="Service category">
              <Input
                value={f.service_category}
                onChange={(e) => set("service_category", e.target.value)}
                placeholder="e.g. All services"
              />
            </Field>
          </FormGrid>

          <Field label="Rule logic">
            <Textarea
              rows={2}
              value={f.rule_logic}
              onChange={(e) => set("rule_logic", e.target.value)}
              placeholder="e.g. days_since_discharge <= 30"
              className="font-mono text-[12.5px]"
            />
          </Field>

          <FormGrid>
            <Field label="Check field">
              <Input
                value={f.check_field}
                onChange={(e) => set("check_field", e.target.value)}
                placeholder="e.g. invoice_date"
              />
            </Field>
            <Field label="Unit of application">
              <Input
                value={f.unit_of_application}
                onChange={(e) => set("unit_of_application", e.target.value)}
                placeholder="e.g. Per claim"
              />
            </Field>
            <Field label="Source">
              <Input
                value={f.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="e.g. Clause 6.ii"
              />
            </Field>
            <Field label="Clause / check ref">
              <Input
                value={f.check_ref}
                onChange={(e) => set("check_ref", e.target.value)}
                placeholder="e.g. CHK-019"
              />
            </Field>
          </FormGrid>

          <Field label="Note" optional hint="Recorded as the review comment.">
            <Input
              value={f.comment}
              onChange={(e) => set("comment", e.target.value)}
              placeholder="e.g. Added from annexure C."
            />
          </Field>
        </div>

        <DialogFooter className="border-t px-[22px] py-[14px]">
          <Button
            variant="ghost"
            className={hifiBtn}
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className={hifiBtn}
            disabled={!valid || busy}
            onClick={submit}
          >
            <HiIcon name="plus" />
            {busy ? "Adding…" : "Add rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ContractResults({
  provider,
  insurer,
  x,
  readonly,
  superseded = false,
  reviewMode = false,
  backLabel = "Contracts",
  onBack,
}: {
  /* Only the routing ids are read — callers without the full records
     (e.g. the Rule review queue) pass minimal objects. */
  provider: Pick<ServiceProvider, "displayId">
  insurer: Pick<Insurer, "accountId">
  x: Extraction
  readonly: boolean
  superseded?: boolean
  /** Reviewer workspace (Rule review) vs. provider record. The per-rule review
     actions (approve/edit/discard/archive) and the start/complete-review
     controls belong to the reviewer only — on the provider record the rules are
     read-only and the sole action is assigning a reviewer (matches V4). */
  reviewMode?: boolean
  /** Back-link text — "Rule review" when opened from the reviewer queue. */
  backLabel?: string
  onBack: () => void
}) {
  const [tab, setTab] = React.useState("rules")
  const [addOpen, setAddOpen] = React.useState(false)
  const reviewMut = useReviewRule()
  const updateMut = useUpdateRule()
  const addMut = useAddManualRule()
  const busy = reviewMut.isPending || updateMut.isPending
  const pending = x.ruleCounts.PENDING ?? 0

  // Manual add — an admin authoring a rule the extractor missed. Allowed
  // wherever the current (non-superseded) extraction is shown with write
  // access; the backend accepts it for ADMIN/APPROVER regardless of the
  // review stage. (Distinct from the per-rule review `ops`, which the record
  // view deliberately withholds.)
  const canAdd = !readonly && !superseded
  const insurerLabel =
    x.insurerName && x.insurerName !== "—" ? x.insurerName : "this insurer"

  const ops: ReviewOps | undefined =
    !reviewMode || readonly || superseded
      ? undefined
      : {
          busy,
          onReview: (ruleId, action, comment) =>
            reviewMut.mutate(
              {
                code: provider.displayId,
                insurerAccountId: insurer.accountId,
                ruleId,
                action,
                comment,
              },
              {
                onSuccess: () =>
                  toast(
                    action === "APPROVE"
                      ? "Rule approved."
                      : action === "DISCARD"
                        ? "Rule discarded."
                        : "Rule archived."
                  ),
                onError: (e) =>
                  toast.error("Review failed", {
                    description: e instanceof Error ? e.message : undefined,
                  }),
              }
            ),
          onEdit: (ruleId, description, comment) =>
            updateMut.mutate(
              {
                code: provider.displayId,
                insurerAccountId: insurer.accountId,
                ruleId,
                patch: { description, comment },
              },
              {
                onSuccess: () => toast("Rule updated."),
                onError: (e) =>
                  toast.error("Update failed", {
                    description: e instanceof Error ? e.message : undefined,
                  }),
              }
            ),
        }

  return (
    <div className="flex flex-col gap-3.5">
      <BackLink label={backLabel} onClick={onBack} />

      {superseded ? (
        <Note tone="info" icon={<HiIcon name="history" />}>
          <b>Superseded extraction</b> — a newer upload replaced this job. Shown
          read-only.
        </Note>
      ) : null}

      <div className="flex flex-wrap items-start gap-3 rounded-xl border bg-muted/30 p-[13px]">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&>svg]:size-[18px]">
          <HiIcon name="fileText" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[9px]">
            <h3 className="m-0 text-[16px] font-bold">{x.contractFilename}</h3>
            <MiniBadge tone={EXTRACT_REVIEW_TONE[x.reviewStatus]}>
              {x.reviewStatus === "IN_REVIEW" && pending > 0
                ? `In review · ${pending} pending`
                : EXTRACT_REVIEW_LABEL[x.reviewStatus]}
            </MiniBadge>
          </div>
          <div className="mt-[3px] text-[12px] text-muted-foreground">
            <span className="mono">{x.jobId.slice(0, 8)}</span> · extracted{" "}
            {x.completed} · {x.rules.length} rules · uploaded by {x.createdBy}
          </div>
        </div>
        <ReviewWorkflow
          x={x}
          code={provider.displayId}
          ins={insurer.accountId}
          mode={reviewMode ? "review" : "record"}
          canAct={!readonly && !superseded}
        />
      </div>

      <RuleProgressBar tally={x.ruleCounts} />

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          {
            k: "rules",
            label: "Extracted rules",
            icon: <HiIcon name="sliders" />,
            count: x.rules.length,
          },
          {
            k: "summary",
            label: "Summary & coverage",
            icon: <HiIcon name="fileText" />,
          },
        ]}
      />

      {tab === "rules" ? (
        <div className="flex flex-col gap-3">
          {canAdd ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-muted-foreground">
                Missing a rule the extractor didn’t catch? Add it manually.
              </span>
              <Button
                variant="outline"
                size="sm"
                className={hifiBtn}
                onClick={() => setAddOpen(true)}
              >
                <HiIcon name="plus" />
                Add rule
              </Button>
            </div>
          ) : null}
          <RulesByCategory rules={x.rules} ops={ops} />
        </div>
      ) : null}
      {tab === "summary" ? <ExtractionSummary x={x} /> : null}

      {canAdd && addOpen ? (
        <AddRuleDialog
          open
          insurerName={insurerLabel}
          busy={addMut.isPending}
          onOpenChange={setAddOpen}
          onSubmit={(body) =>
            addMut.mutate(
              {
                code: provider.displayId,
                insurerAccountId: insurer.accountId,
                body,
              },
              {
                onSuccess: () => {
                  toast("Manual rule added.")
                  setAddOpen(false)
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
    </div>
  )
}

/* ---------- extraction-level review workflow (assign → start → complete) */

function MemberPicker({
  label,
  emphasis,
  busy,
  onPick,
}: {
  label: string
  /** Primary-styled when this is the workflow's next step. */
  emphasis?: boolean
  busy: boolean
  onPick: (memberId: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  // Members endpoint is admin-only — only fetched once the picker opens
  // (the button itself is already gated by write access).
  const membersQ = useMembers({ status: "ACTIVE", size: 100 }, open)
  const members = membersQ.data?.items ?? []
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={emphasis ? "default" : "outline"}
          size="sm"
          className={hifiBtn}
          disabled={busy}
        >
          <HiIcon name="userCheck" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search members…" />
          <CommandList>
            <CommandEmpty>
              {membersQ.isLoading
                ? "Loading members…"
                : membersQ.isError
                  ? "Couldn’t load members."
                  : "No active members."}
            </CommandEmpty>
            <CommandGroup>
              {members.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.name}
                  onSelect={() => {
                    setOpen(false)
                    onPick(m.id)
                  }}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                    {spInitials(m.name)}
                  </span>
                  {m.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ReviewWorkflow({
  x,
  code,
  ins,
  mode,
  canAct,
}: {
  x: Extraction
  code: string
  ins: string
  /** "record" → assign/reassign only; "review" → start/complete controls. */
  mode: "record" | "review"
  canAct: boolean
}) {
  const assignMut = useAssignReviewer()
  const statusMut = useSetReviewStatus()
  const busy = assignMut.isPending || statusMut.isPending
  const pending = x.ruleCounts.PENDING ?? 0

  const assign = (memberId: number) =>
    assignMut.mutate(
      { code, insurerAccountId: ins, memberId },
      {
        onSuccess: (r) => toast(`Review assigned to ${r.assigneeName}.`),
        onError: (e) =>
          toast.error("Couldn’t assign reviewer", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  const advance = (status: "IN_REVIEW" | "COMPLETED") =>
    statusMut.mutate(
      { code, insurerAccountId: ins, status },
      {
        onSuccess: () =>
          toast(
            status === "IN_REVIEW"
              ? "Review started."
              : "Review marked complete."
          ),
        onError: (e) =>
          toast.error("Couldn’t update review status", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      {x.assigneeName ? (
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-primary/10 text-[8.5px] font-bold text-primary">
            {spInitials(x.assigneeName)}
          </span>
          <span>
            <b className="font-semibold text-foreground">{x.assigneeName}</b>
            {x.assigned !== "—" ? <> · assigned {x.assigned}</> : null}
          </span>
        </div>
      ) : (
        <span className="text-[12px] text-muted-foreground">
          No reviewer assigned
        </span>
      )}

      {canAct ? (
        <div className="flex flex-wrap justify-end gap-2">
          {mode === "record" ? (
            <MemberPicker
              label={x.assigneeName ? "Reassign" : "Assign reviewer"}
              emphasis={x.reviewStatus === "UNASSIGNED"}
              busy={busy}
              onPick={assign}
            />
          ) : null}
          {mode === "review" && x.reviewStatus === "ASSIGNED" ? (
            <Button
              size="sm"
              className={hifiBtn}
              disabled={busy}
              onClick={() => advance("IN_REVIEW")}
            >
              <HiIcon name="eye" />
              Start review
            </Button>
          ) : null}
          {mode === "review" && x.reviewStatus === "IN_REVIEW" ? (
            <Button
              size="sm"
              className={hifiBtn}
              disabled={busy || pending > 0}
              title={
                pending > 0
                  ? `${pending} rule${pending !== 1 ? "s" : ""} still pending review`
                  : undefined
              }
              onClick={() => advance("COMPLETED")}
            >
              <HiIcon name="checkCheck" />
              Complete review
            </Button>
          ) : null}
        </div>
      ) : null}

      {x.reviewStatus === "COMPLETED" && x.reviewCompleted !== "—" ? (
        <span className="text-[11px] text-muted-foreground">
          completed {x.reviewCompleted}
        </span>
      ) : null}
    </div>
  )
}

/* ---------- superseded job (read-only, via …/jobs/{jobId}) ---------- */

function SupersededJob({
  provider,
  insurer,
  jobId,
  onBack,
}: {
  provider: ServiceProvider
  insurer: Insurer
  jobId: string
  onBack: () => void
}) {
  const q = useExtractionJob(provider.displayId, jobId)

  if (q.isLoading)
    return (
      <div className="flex flex-col gap-3.5">
        <BackLink label="Contracts" onClick={onBack} />
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )

  const x = q.data
  if (q.isError || !x)
    return (
      <div className="flex flex-col gap-3.5">
        <BackLink label="Contracts" onClick={onBack} />
        <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-12 text-center">
          <p className="text-[13px] text-muted-foreground">
            Couldn’t load this extraction.{" "}
            <button
              className="font-semibold text-primary underline underline-offset-2"
              onClick={() => void q.refetch()}
            >
              Try again
            </button>
            .
          </p>
        </div>
      </div>
    )

  if (x.status === "COMPLETED")
    return (
      <ContractResults
        provider={provider}
        insurer={insurer}
        x={x}
        readonly
        superseded
        onBack={onBack}
      />
    )

  return <ExtractionStatusView x={x} onBack={onBack} />
}
