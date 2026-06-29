import * as React from "react"
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  CheckIcon,
  CreditCardIcon,
  FileCheck2Icon,
  GitBranchIcon,
  LayersIcon,
  Loader2Icon,
  LockIcon,
  MinusIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { useAccess } from "@/contexts/access-context"
import {
  useApprovalDecision,
  useApprovalReview,
  useDecideSection,
} from "@/features/approvals/use-approvals"
import type {
  ApprovalQueueItem,
  ReviewSectionStatus,
} from "@/features/approvals/types"
import type { PayerDTO } from "@/features/payers/types"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"
import { Breadcrumbs } from "@/components/console/breadcrumbs"

type Decision = "ok" | "info" | "no"

/** A rendered review section: server-keyed (matches the API's sectionKey), with
   its content built from the payer aggregate. */
type RenderSection = {
  key: string
  icon: LucideIcon
  title: string
  body: React.ReactNode
  serverStatus: ReviewSectionStatus
  decidedByName: string | null
  comment: string | null
  decidedAt: string | null
}

/** The four decidable sections, in display order. The API has no key for
   secondary tenants — their detail is folded into `primary_tenant_details`. */
const SECTION_ORDER = [
  "primary_tenant_details",
  "module_entitlements",
  "subscription_billing",
  "kyb_documents",
] as const

const SECTION_LABEL: Record<string, string> = {
  primary_tenant_details: "Primary tenant details",
  module_entitlements: "Module entitlements",
  subscription_billing: "Subscription & billing",
  kyb_documents: "KYB documents",
}

const SECTION_ICON: Record<string, LucideIcon> = {
  primary_tenant_details: Building2Icon,
  module_entitlements: LayersIcon,
  subscription_billing: CreditCardIcon,
  kyb_documents: FileCheck2Icon,
}

/** Map a persisted per-section status to the segmented-toggle value (PENDING → none). */
const STATUS_TO_DECISION: Record<string, Decision | undefined> = {
  APPROVED: "ok",
  REJECTED: "no",
  INFO_REQUESTED: "info",
  PENDING: undefined,
}

const STATUS_TONE: Record<string, "success" | "warning" | "neutral" | "error"> = {
  APPROVED: "success",
  REJECTED: "error",
  INFO_REQUESTED: "warning",
  PENDING: "neutral",
}

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  INFO_REQUESTED: "Info requested",
  PENDING: "Pending",
}

/** Decision-comment dialog — reject / request-info need a reason, captured per
   section (or for the whole payer) at click time rather than in a shared box. */
function CommentDialog({
  open,
  title,
  description,
  submitLabel,
  destructive,
  busy,
  onCancel,
  onSubmit,
}: {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  destructive?: boolean
  busy: boolean
  onCancel: () => void
  onSubmit: (comment: string) => void
}) {
  // Fresh on each open: the parent keys this component by the pending target, so
  // it remounts (resetting `text`) rather than syncing via an effect.
  const [text, setText] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1">
            Reason / details<span className="text-destructive">*</span>
          </Label>
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Explain what the submitter needs to fix or provide…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!text.trim() || busy}
            onClick={() => onSubmit(text.trim())}
          >
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const PAYER_TYPE_LABEL: Record<string, string> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}

/** Small round dot used to separate inline metadata (v3 `.dotsep`). */
const Dot = () => (
  <span className="size-[3px] shrink-0 rounded-full bg-muted-foreground/40" />
)

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="bg-card px-[15px] py-[13px]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {k}
          </div>
          <div className="mt-[5px] text-[13px] font-semibold">{v || "—"}</div>
        </div>
      ))}
    </div>
  )
}

/** Build the body + count for each API review section from the payer aggregate.
   Keyed by the API's sectionKey so the rendered checklist lines up 1:1 with the
   persisted per-section decisions. Secondary tenants have no decision key of
   their own, so they're shown inside `primary_tenant_details`. */
function sectionBodies(
  d: PayerDTO
): Record<string, { body: React.ReactNode; count: number | null }> {
  const tenants = d.tenants ?? []
  const primary =
    tenants.find((t) => t.primary) ??
    tenants.find((t) => t.id === d.primary_tenant_id) ??
    tenants[0]
  const secondaries = tenants.filter((t) => t !== primary)
  const entitlements = (d.entitlements ?? []).filter((e) => e.enabled)
  const sub = d.subscription
  const docs = primary?.documents ?? []

  return {
    primary_tenant_details: {
      count: null,
      body: (
        <div className="flex flex-col gap-3">
          <Meta
            items={[
              ["Legal entity", primary?.legal_entity_name ?? "—"],
              ["Tenant type", PAYER_TYPE_LABEL[d.payer_type] ?? d.payer_type],
              ["Country", primary?.country ?? "—"],
              ["Data residency", primary?.data_residency_region ?? "—"],
              ["Subdomain", primary?.subdomain ?? "—"],
              ["Tenant Admin", primary?.tenant_admin_email ?? "—"],
            ]}
          />
          {secondaries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                Secondary tenants ({secondaries.length})
              </div>
              {secondaries.map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[13px]">
                  <GitBranchIcon className="size-[15px] text-muted-foreground" />
                  <b>{t.legal_entity_name}</b>
                  <span className="text-muted-foreground">
                    {t.country ?? ""} {t.subdomain ? `· ${t.subdomain}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    module_entitlements: {
      count: entitlements.length,
      body:
        entitlements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {entitlements.map((e) => (
              <Tagpill key={e.entitlement_id}>
                <LayersIcon className="size-3" />
                {e.module_code}
                {e.submodule_code ? ` · ${e.submodule_code}` : ""}
              </Tagpill>
            ))}
          </div>
        ) : (
          <span className="text-[12.5px] text-muted-foreground">
            No module entitlements set.
          </span>
        ),
    },
    subscription_billing: {
      count: null,
      body: sub ? (
        <Meta
          items={[
            [
              "Structure",
              sub.pricing_structure_name ??
                sub.structure_name ??
                sub.pricing_snapshot?.name ??
                "—",
            ],
            ["Model", sub.subscription_model ?? "—"],
            ["Frequency", sub.billing_frequency ?? "—"],
          ]}
        />
      ) : (
        <span className="text-[12.5px] text-muted-foreground">
          No subscription set.
        </span>
      ),
    },
    kyb_documents: {
      count: docs.length,
      body:
        docs.length > 0 ? (
          <div className="grid gap-[9px]">
            {docs.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center gap-2.5 text-[12.5px]"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-success-subtle text-success-subtle-foreground">
                  <CheckIcon className="size-3" />
                </span>
                <span>{doc.file_name}</span>
                <span className="mono text-[11px] text-muted-foreground">
                  {doc.category}
                </span>
                <MiniBadge tone="neutral" className="ml-auto">
                  {doc.status}
                </MiniBadge>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[12.5px] text-muted-foreground">
            No KYB documents attached.
          </span>
        ),
    },
  }
}

// v3 segmented control: a muted track holds three borderless buttons; the active
// choice fills with its solid status colour and white text.
const SEG: Record<Decision, string> = {
  ok: "data-[on=true]:bg-success data-[on=true]:text-white",
  info: "data-[on=true]:bg-warning data-[on=true]:text-white",
  no: "data-[on=true]:bg-destructive data-[on=true]:text-white",
}

/**
 * Approval review — a standalone, deep-linkable page at `/approvals/:payerId`.
 * It self-fetches the dedicated review payload (meta + payer aggregate) from the
 * URL id (works on refresh / direct link); a queue row passed via router `state`
 * only paints the header instantly while the request is in flight.
 */
export function ApprovalReviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { payerId: payerIdParam } = useParams<{ payerId: string }>()
  const payerId = Number(payerIdParam)
  const validId = Number.isFinite(payerId)

  const { role, user, isReadonly } = useAccess()
  const readonly = isReadonly("approvals")

  const reviewQ = useApprovalReview(validId ? payerId : null)
  const decisionMut = useApprovalDecision()
  const sectionMut = useDecideSection()
  const review = reviewQ.data
  const forbidden =
    reviewQ.error instanceof ApiError && reviewQ.error.status === 403

  // Header: prefer the fetched review header, fall back to the queue row handed
  // over via navigation state for an instant first paint.
  const stateItem = (location.state as { item?: ApprovalQueueItem } | null)?.item ?? null
  const head = review
    ? {
        name: review.header.name,
        code: review.header.code,
        submittedBy: review.header.submittedBy,
        submittedAt: review.header.submittedAt,
        approved: review.status === "APPROVED",
      }
    : stateItem
      ? {
          name: stateItem.tenant,
          code: stateItem.requestId,
          submittedBy: stateItem.submittedBy,
          submittedAt: stateItem.submittedAt,
          approved: stateItem.status === "APPROVED",
        }
      : null

  // Separation of duties: trust the server's can_decide / own_submission when
  // present; otherwise fall back to a client-side check.
  const clientOwn =
    !!user.email &&
    !!head?.submittedBy &&
    head.submittedBy.toLowerCase() === user.email.toLowerCase()
  const ownSubmission = review?.ownSubmission ?? clientOwn
  // A decided (already-approved) record has nothing left to action. The v3 design
  // models the review screen as a *pending-decision* tool only — there's no
  // approved/closed review state and no disabled-button state except the maker
  // separation-of-duties lock on a pending item. So for a closed record we drop
  // the decision controls entirely (the status badge in the header is the signal)
  // rather than show disabled buttons or an extra banner. The provisioning gate is
  // likewise only meaningful while the request is still pending.
  const decided = review?.status === "APPROVED"
  const provisioningIncomplete =
    !decided && review?.provisioningComplete === false
  const canDecide =
    !readonly && (review?.canDecide ?? (role.checker && !ownSubmission))

  const payerAgg = review?.payer
  const bodies = React.useMemo(
    () => (payerAgg ? sectionBodies(payerAgg) : {}),
    [payerAgg]
  )
  // Drive the checklist from the server's per-section decisions so it rehydrates
  // on reload; fall back to the four fixed sections (all PENDING) if the payload
  // predates per-section review.
  const sections = React.useMemo<RenderSection[]>(() => {
    const src =
      review?.sections && review.sections.length
        ? review.sections.map((s) => ({
            key: s.key,
            label: s.label,
            status: s.status,
            decidedByName: s.decidedByName,
            comment: s.comment,
            decidedAt: s.decidedAt,
          }))
        : SECTION_ORDER.map((key) => ({
            key,
            label: SECTION_LABEL[key],
            status: "PENDING" as ReviewSectionStatus,
            decidedByName: null,
            comment: null,
            decidedAt: null,
          }))
    return src
      .filter((s) => SECTION_ICON[s.key])
      .map((s) => {
        const b = bodies[s.key]
        const suffix = b && b.count != null ? ` (${b.count})` : ""
        return {
          key: s.key,
          title: (s.label || SECTION_LABEL[s.key] || s.key) + suffix,
          icon: SECTION_ICON[s.key] ?? Building2Icon,
          body: b?.body ?? null,
          serverStatus: s.status,
          decidedByName: s.decidedByName,
          comment: s.comment,
          decidedAt: s.decidedAt,
        }
      })
  }, [review, bodies])

  // Per-section state is server-truth and persists across sessions: each toggle
  // reflects its stored review_status and the click saves immediately. The final
  // payer-level buttons just run the transition over that persisted checklist.
  const statusDecision = (s: RenderSection): Decision | undefined =>
    STATUS_TO_DECISION[s.serverStatus]
  const allApproved = review?.allSectionsApproved ?? false
  const anyReject = sections.some((s) => s.serverStatus === "REJECTED")
  const anyInfo = sections.some((s) => s.serverStatus === "INFO_REQUESTED")
  const lockTip = ownSubmission
    ? "You submitted this — a different approver is required"
    : !canDecide
      ? "Only a Platform Approver can decide"
      : provisioningIncomplete
        ? "Tenant must be fully provisioned before approval"
        : ""

  // The section whose call is in flight (drives a per-row spinner).
  const pendingKey = sectionMut.isPending
    ? sectionMut.variables?.sectionKey
    : undefined
  const busy = decisionMut.isPending || sectionMut.isPending

  // Reject / request-info need a comment, so they open a dialog — per section,
  // or for the whole payer. Approve fires straight away (comment optional).
  type Pending =
    | { scope: "section"; key: string; title: string; action: "reject" | "request-info" }
    | { scope: "payer"; action: "reject" | "request-info" }
  const [pending, setPending] = React.useState<Pending | null>(null)

  const runSection = async (
    sectionKey: string,
    action: "approve" | "reject" | "request-info",
    sComment?: string
  ) => {
    try {
      await sectionMut.mutateAsync({ payerId, sectionKey, action, comment: sComment })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the decision.")
    }
  }

  const onSectionClick = (s: RenderSection, v: Decision) => {
    if (v === "ok") void runSection(s.key, "approve")
    else
      setPending({
        scope: "section",
        key: s.key,
        title: s.title,
        action: v === "no" ? "reject" : "request-info",
      })
  }

  const runPayer = async (
    decision: "approve" | "reject" | "request-info",
    pComment: string | undefined,
    successMsg: string
  ) => {
    try {
      await decisionMut.mutateAsync({ payerId, decision, comment: pComment })
      toast.success(successMsg)
      navigate(decision === "approve" ? "/tenant-accounts" : "/approvals")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Decision failed.")
    }
  }

  const onDialogSubmit = async (text: string) => {
    if (!pending) return
    if (pending.scope === "section") {
      await runSection(pending.key, pending.action, text)
      setPending(null)
    } else {
      const msg =
        pending.action === "reject"
          ? "Submission rejected. Submitter notified."
          : "Returned to submitter — info requested."
      await runPayer(pending.action, text, msg)
      setPending(null)
    }
  }

  const dialogCopy = !pending
    ? null
    : pending.scope === "section"
      ? {
          title:
            (pending.action === "reject" ? "Reject — " : "Request info — ") +
            pending.title,
          description:
            pending.action === "reject"
              ? "Tell the submitter why this section is rejected. Saved against this section; you can change it later."
              : "Tell the submitter what additional information this section needs. Saved against this section.",
          submitLabel: pending.action === "reject" ? "Reject section" : "Request info",
          destructive: pending.action === "reject",
        }
      : {
          title:
            pending.action === "reject"
              ? "Reject submission"
              : "Return to submitter",
          description:
            pending.action === "reject"
              ? "Returns the whole submission to the submitter as rejected."
              : "Returns the whole submission to the submitter for more information.",
          submitLabel:
            pending.action === "reject" ? "Reject submission" : "Return for info",
          destructive: pending.action === "reject",
        }

  // A malformed id in the URL can't resolve to a submission — bounce to the queue.
  if (!validId) return <Navigate to="/approvals" replace />

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Approvals", href: "/approvals" },
          { label: head?.code ?? "Review" },
        ]}
      />

      {/* record header */}
      {head ? (
        <div className="flex items-start gap-4">
          <span className="grid size-[56px] shrink-0 place-items-center rounded-[13px] border border-primary/20 bg-primary/10 text-[22px] font-bold text-primary">
            {head.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[22px] font-bold tracking-[-0.015em]">
                {head.name}
              </h2>
              <MiniBadge tone={head.approved ? "success" : "warning"}>
                {head.approved ? "Approved" : "Pending review"}
              </MiniBadge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span className="mono text-foreground">{head.code}</span>
              <Dot />
              <span>Tenant onboarding</span>
              <Dot />
              <span>
                Submitted by{" "}
                <b className="text-foreground">{head.submittedBy ?? "—"}</b>
                {head.submittedAt
                  ? ` · ${formatDistanceToNow(new Date(head.submittedAt), {
                      addSuffix: true,
                    })}`
                  : ""}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Deep-linked with no queue row in hand — skeleton until the fetch resolves.
        <div className="flex items-start gap-4">
          <span className="size-[56px] shrink-0 animate-pulse rounded-[13px] bg-muted" />
          <div className="min-w-0 flex-1 space-y-2 py-1.5">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-72 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}

      {review && !decided && !canDecide && (
        <Note tone="warn" icon={<LockIcon />}>
          {ownSubmission ? (
            <span>
              You submitted this request. <b>Separation of duties</b> means a
              different Platform Approver must review it — the decision controls
              are disabled for you.
            </span>
          ) : (
            <span>Your role can view this submission but cannot decide.</span>
          )}
        </Note>
      )}

      {review && provisioningIncomplete && (
        <Note tone="warn" icon={<TriangleAlertIcon />}>
          <b>Provisioning not complete.</b> This tenant isn&rsquo;t fully
          provisioned yet — approval stays blocked until every configuration
          section is ready (Tenant provisioning).
        </Note>
      )}

      {reviewQ.isLoading ? (
        <Panel>
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <LoadingSpinner />
          </div>
        </Panel>
      ) : forbidden ? (
        <Note tone="warn" icon={<LockIcon />}>
          <b>Approver access required.</b> Reviewing a submission is restricted to
          the <b>Platform Approver</b> role. Sign in as an approver to continue.
        </Note>
      ) : reviewQ.isError || !review ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn&rsquo;t load this submission.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => reviewQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 items-start gap-[18px]",
            !decided && "lg:grid-cols-[1fr_300px]"
          )}
        >
          {/* review sections */}
          <div className="flex flex-col gap-3">
            {sections.map((s) => {
              const Ico = s.icon
              return (
                <div
                  key={s.key}
                  className="overflow-hidden rounded-[11px] border bg-card"
                >
                  <div className="flex flex-wrap items-center gap-3 px-[15px] py-[13px]">
                    <Ico className="size-4 text-muted-foreground" />
                    <h4 className="text-[13.5px] font-semibold">{s.title}</h4>
                    {!decided && (
                      <div className="ml-auto inline-flex items-center gap-2">
                        {pendingKey === s.key && (
                          <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
                        )}
                        <div className="inline-flex gap-[3px] rounded-lg bg-muted p-[3px]">
                          {(
                            [
                              { v: "ok", label: "Approve" },
                              { v: "info", label: "Info needed" },
                              { v: "no", label: "Reject" },
                            ] as { v: Decision; label: string }[]
                          ).map((b) => (
                            <button
                              key={b.v}
                              type="button"
                              disabled={!canDecide || busy}
                              title={lockTip || undefined}
                              data-on={statusDecision(s) === b.v}
                              onClick={() => onSectionClick(s, b.v)}
                              className={cn(
                                "inline-flex h-7 items-center gap-[5px] rounded-md px-[11px] text-[11.5px] font-semibold text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                                SEG[b.v]
                              )}
                            >
                              {b.v === "ok" && <CheckIcon className="size-3" />}
                              {b.v === "no" && <XIcon className="size-3" />}
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-[15px] pb-[14px]">{s.body}</div>
                  {s.serverStatus !== "PENDING" && (
                    <div className="border-t bg-muted/30 px-[15px] py-2.5 text-[11.5px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <MiniBadge tone={STATUS_TONE[s.serverStatus]}>
                          {STATUS_LABEL[s.serverStatus]}
                        </MiniBadge>
                        {s.decidedByName && (
                          <span className="text-muted-foreground">
                            by{" "}
                            <b className="text-foreground">{s.decidedByName}</b>
                            {s.decidedAt
                              ? ` · ${formatDistanceToNow(new Date(s.decidedAt), {
                                  addSuffix: true,
                                })}`
                              : ""}
                          </span>
                        )}
                      </div>
                      {s.comment && (
                        <div className="mt-1 text-muted-foreground">
                          &ldquo;{s.comment}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {!decided && (
              <Note tone="info" className="text-[11.5px]">
                <b>Note:</b> each section&rsquo;s decision is saved the moment you
                set it (you can revisit and change it later). Approve every
                section to enable <b>Approve &amp; activate</b>; reject or request
                info on any section, then return the submission to the submitter.
              </Note>
            )}
          </div>

          {/* decision panel — only while the request is pending a decision */}
          {!decided && (
          <div className="lg:sticky lg:top-3">
            <Panel className="overflow-hidden">
              <PanelHead title="Decision" />
              <PanelBody className="flex flex-col gap-3">
                <div className="flex flex-col gap-[9px]">
                  {sections.map((s) => {
                    const dec = statusDecision(s)
                    const Ico =
                      dec === "ok"
                        ? CheckIcon
                        : dec === "no"
                          ? XIcon
                          : dec === "info"
                            ? AlertTriangleIcon
                            : MinusIcon
                    return (
                      <div key={s.key} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full",
                            dec === "ok"
                              ? "bg-success-subtle text-success-subtle-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Ico className="size-3" />
                        </span>
                        <span className="text-[12.5px]">{s.title}</span>
                      </div>
                    )
                  })}
                </div>
                <hr className="border-border" />
                <Button
                  className="w-full justify-center bg-brand text-brand-foreground hover:bg-brand/90"
                  disabled={
                    !canDecide || provisioningIncomplete || !allApproved || busy
                  }
                  title={
                    !allApproved && canDecide && !provisioningIncomplete
                      ? "Approve every section first"
                      : lockTip || undefined
                  }
                  onClick={() =>
                    runPayer(
                      "approve",
                      undefined,
                      `${head?.name ?? "Submission"} approved — auto-activation triggered.`
                    )
                  }
                >
                  {busy ? (
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <CheckCircle2Icon data-icon="inline-start" />
                  )}
                  Approve &amp; activate
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  disabled={!canDecide || !anyInfo || busy}
                  title={lockTip || undefined}
                  onClick={() => setPending({ scope: "payer", action: "request-info" })}
                >
                  <AlertTriangleIcon data-icon="inline-start" />
                  Return for info
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-center"
                  disabled={!canDecide || !anyReject || busy}
                  title={lockTip || undefined}
                  onClick={() => setPending({ scope: "payer", action: "reject" })}
                >
                  <XIcon data-icon="inline-start" />
                  Reject
                </Button>
                <Note tone="info" className="text-[11.5px]">
                  {review.autoActivateNote ??
                    "On approval the system auto-activates the tenant, provisions tenants and sends admin invites."}
                </Note>
              </PanelBody>
            </Panel>
          </div>
          )}
        </div>
      )}

      <CommentDialog
        key={
          pending
            ? pending.scope === "section"
              ? `s:${pending.key}:${pending.action}`
              : `p:${pending.action}`
            : "none"
        }
        open={pending != null}
        title={dialogCopy?.title ?? ""}
        description={dialogCopy?.description}
        submitLabel={dialogCopy?.submitLabel ?? "Submit"}
        destructive={dialogCopy?.destructive}
        busy={busy}
        onCancel={() => setPending(null)}
        onSubmit={onDialogSubmit}
      />
    </div>
  )
}
