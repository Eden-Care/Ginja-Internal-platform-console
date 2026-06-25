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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { useAccess } from "@/contexts/access-context"
import { useApprovalDecision, useApprovalReview } from "@/features/approvals/use-approvals"
import type { ApprovalQueueItem } from "@/features/approvals/types"
import type { PayerDTO } from "@/features/payers/types"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"
import { Breadcrumbs } from "@/components/console/breadcrumbs"

type Decision = "ok" | "info" | "no"
type Section = { k: string; icon: LucideIcon; title: string; body: React.ReactNode }

const PAYER_TYPE_LABEL: Record<string, string> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] text-muted-foreground">{k}</div>
          <div className="text-[13px]">{v || "—"}</div>
        </div>
      ))}
    </div>
  )
}

/** Build the review sections from the payer aggregate in the review payload. */
function sectionsFor(d: PayerDTO): Section[] {
  const tenants = d.tenants ?? []
  const primary =
    tenants.find((t) => t.primary) ??
    tenants.find((t) => t.id === d.primary_tenant_id) ??
    tenants[0]
  const secondaries = tenants.filter((t) => t !== primary)
  const entitlements = (d.entitlements ?? []).filter((e) => e.enabled)
  const sub = d.subscription
  const docs = primary?.documents ?? []

  const sections: Section[] = [
    {
      k: "details",
      icon: Building2Icon,
      title: "Primary tenant details",
      body: (
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
      ),
    },
  ]

  if (secondaries.length > 0) {
    sections.push({
      k: "secondary",
      icon: GitBranchIcon,
      title: `Secondary tenants (${secondaries.length})`,
      body: (
        <div className="flex flex-col gap-1.5">
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
      ),
    })
  }

  sections.push({
    k: "modules",
    icon: LayersIcon,
    title: `Module entitlements (${entitlements.length})`,
    body:
      entitlements.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {entitlements.map((e) => (
            <span
              key={e.entitlement_id}
              className="mono inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground"
            >
              {e.module_code}
              {e.submodule_code ? ` · ${e.submodule_code}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[12.5px] text-muted-foreground">
          No module entitlements set.
        </span>
      ),
  })

  sections.push({
    k: "billing",
    icon: CreditCardIcon,
    title: "Subscription & billing",
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
  })

  if (docs.length > 0) {
    sections.push({
      k: "docs",
      icon: FileCheck2Icon,
      title: `KYB documents (${docs.length})`,
      body: (
        <div className="flex flex-col gap-1.5">
          {docs.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
            >
              <span className="grid size-4 place-items-center rounded-full bg-success text-white">
                <CheckIcon className="size-2.5" />
              </span>
              {doc.file_name}
              <span className="mono ml-1 text-[11px] text-muted-foreground">
                {doc.category}
              </span>
              <MiniBadge tone="neutral" className="ml-auto">
                {doc.status}
              </MiniBadge>
            </div>
          ))}
        </div>
      ),
    })
  }

  return sections
}

const DECISION_BTN: Record<Decision, string> = {
  ok: "data-[on=true]:border-success data-[on=true]:bg-success-subtle data-[on=true]:text-success-subtle-foreground",
  info: "data-[on=true]:border-warning data-[on=true]:bg-warning-subtle data-[on=true]:text-warning-subtle-foreground",
  no: "data-[on=true]:border-destructive data-[on=true]:bg-destructive-subtle data-[on=true]:text-destructive-subtle-foreground",
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
  const sections = React.useMemo(
    () => (payerAgg ? sectionsFor(payerAgg) : []),
    [payerAgg]
  )
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>({})
  const [comment, setComment] = React.useState("")
  const setDec = (k: string, v: Decision) =>
    setDecisions((d) => ({ ...d, [k]: v }))

  const allDecided = sections.length > 0 && sections.every((s) => decisions[s.k])
  const anyReject = Object.values(decisions).includes("no")
  const anyInfo = Object.values(decisions).includes("info")
  const lockTip = ownSubmission
    ? "You submitted this — a different approver is required"
    : !canDecide
      ? "Only a Platform Approver can decide"
      : provisioningIncomplete
        ? "Tenant must be fully provisioned before approval"
        : ""

  const decide = (
    decision: "approve" | "reject" | "request-info",
    successMsg: string
  ) => {
    decisionMut.mutate(
      { payerId, decision, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(successMsg)
          navigate(decision === "approve" ? "/tenant-accounts" : "/approvals")
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Decision failed."),
      }
    )
  }

  const busy = decisionMut.isPending

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
        <div className="flex items-start gap-3.5">
          <span className="grid size-[52px] shrink-0 place-items-center rounded-[13px] border border-primary/20 bg-primary/10 text-[19px] font-bold text-primary">
            {head.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-semibold">{head.name}</h2>
              <MiniBadge tone={head.approved ? "success" : "warning"}>
                {head.approved ? "Approved" : "Pending review"}
              </MiniBadge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span className="mono">{head.code}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>Tenant onboarding</span>
              <span className="text-muted-foreground/50">·</span>
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
        <div className="flex items-start gap-3.5">
          <span className="size-[52px] shrink-0 animate-pulse rounded-[13px] bg-muted" />
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
                <Panel key={s.k} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                    <Ico className="size-4 text-muted-foreground" />
                    <h4 className="text-[13.5px] font-semibold">{s.title}</h4>
                    {!decided && (
                      <div className="ml-auto flex items-center gap-1.5">
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
                            data-on={decisions[s.k] === b.v}
                            onClick={() => setDec(s.k, b.v)}
                            className={cn(
                              "inline-flex h-7 items-center gap-1 rounded-md border border-input bg-card px-2.5 text-[11.5px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                              DECISION_BTN[b.v]
                            )}
                          >
                            {b.v === "ok" && <CheckIcon className="size-3" />}
                            {b.v === "no" && <XIcon className="size-3" />}
                            {b.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <PanelBody>{s.body}</PanelBody>
                </Panel>
              )
            })}
            {(anyReject || anyInfo) && (
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-[13px] font-medium">
                  Reason for rejection / information required
                  <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder="Required when any section is rejected or returned…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            )}
            {!decided && (
              <Note tone="info" className="text-[11.5px]">
                <b>Note:</b> the API records one decision per submission — the
                per-section choices above drive which action you take; only the
                final decision + comment is sent. Per-section approval is
                backend-pending.
              </Note>
            )}
          </div>

          {/* decision panel — only while the request is pending a decision */}
          {!decided && (
          <div className="lg:sticky lg:top-3">
            <Panel className="overflow-hidden">
              <PanelHead title="Decision" />
              <PanelBody className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {sections.map((s) => {
                    const dec = decisions[s.k]
                    const Ico =
                      dec === "ok"
                        ? CheckIcon
                        : dec === "no"
                          ? XIcon
                          : dec === "info"
                            ? AlertTriangleIcon
                            : MinusIcon
                    return (
                      <div key={s.k} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid size-[18px] shrink-0 place-items-center rounded-full",
                            dec === "ok"
                              ? "bg-success text-white"
                              : dec === "no"
                                ? "bg-destructive text-white"
                                : dec === "info"
                                  ? "bg-warning text-white"
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
                    !canDecide ||
                    provisioningIncomplete ||
                    !allDecided ||
                    anyReject ||
                    anyInfo ||
                    busy
                  }
                  title={lockTip || undefined}
                  onClick={() =>
                    decide(
                      "approve",
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
                  disabled={!canDecide || !anyInfo || anyReject || !comment.trim() || busy}
                  title={lockTip || undefined}
                  onClick={() =>
                    decide("request-info", "Returned to submitter — info requested.")
                  }
                >
                  <AlertTriangleIcon data-icon="inline-start" />
                  Return for info
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-center"
                  disabled={!canDecide || !anyReject || !comment.trim() || busy}
                  title={lockTip || undefined}
                  onClick={() => decide("reject", "Submission rejected. Submitter notified.")}
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
    </div>
  )
}
