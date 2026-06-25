import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  BanIcon,
  CreditCardIcon,
  FileCheck2Icon,
  GitBranchIcon,
  GlobeIcon,
  HistoryIcon,
  LayersIcon,
  Building2Icon,
  PencilIcon,
  PlayIcon,
  ArchiveIcon,
  SendIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  Loader2Icon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { useAccess } from "@/contexts/access-context"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { StatusPill } from "@/components/console/status-pill"
import { AvatarInitials } from "@/components/console/avatar-initials"
import { LoadingSpinner } from "@/components/common/loading"
import { toPayer, type SuspendReason } from "@/features/payers/types"
import {
  useLifecycleRequests,
  usePayerRecord,
  useReactivatePayer,
  useRetirePayer,
  useSubmitDraft,
  useSuspendPayer,
} from "@/features/payers/use-payer-record"
import {
  ReactivateDialog,
  RecActivity,
  RecBilling,
  RecDocuments,
  RecEntitlements,
  RecLifecycleRequests,
  RecOverview,
  RecTenants,
  RetireDialog,
  SuspendDialog,
} from "./record-parts"

type TabKey =
  | "overview"
  | "tenants"
  | "entitlements"
  | "billing"
  | "documents"
  | "activity"

/** v3 lifecycle rail. */
const LIFECYCLE = ["Draft", "Active", "Suspended", "Retired"] as const
const LIFE_INDEX: Record<string, number> = {
  DRAFT: 0,
  PENDING_REVIEW: 0,
  PENDING_ACTIVATION: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  RETIRED: 3,
  ARCHIVED: 3,
}

export function PayerRecordPage() {
  const navigate = useNavigate()
  const { payerId: payerIdParam } = useParams<{ payerId: string }>()
  const payerId = Number(payerIdParam)
  const validId = Number.isFinite(payerId)

  const { role, isReadonly } = useAccess()
  const readonly = isReadonly("payers")
  const actAllowed = role.maker && !readonly
  const lockTip = readonly
    ? "Read-only role"
    : !role.maker
      ? "Only a Platform Admin can change account state"
      : ""

  const recordQ = usePayerRecord(validId ? payerId : null)
  const dto = recordQ.data
  const forbidden =
    recordQ.error instanceof ApiError && recordQ.error.status === 403

  const suspendMut = useSuspendPayer()
  const reactivateMut = useReactivatePayer()
  const retireMut = useRetirePayer()
  const submitMut = useSubmitDraft()

  const lifecycleQ = useLifecycleRequests(validId ? payerId : null)
  const requests = lifecycleQ.data ?? []
  // Only one lifecycle change can be in flight; while one is PENDING the maker
  // can't raise another (the checker decides it from the approvals queue).
  const pending = requests.find((r) => r.status === "PENDING") ?? null
  const pendingTip = pending
    ? `A ${pending.action.toLowerCase()} request is already awaiting approval`
    : ""
  const canAct = actAllowed && !pending

  const [tab, setTab] = React.useState<TabKey>("overview")
  const [dialog, setDialog] = React.useState<
    "suspend" | "retire" | "reactivate" | null
  >(null)

  // Derived view of the aggregate (read defensively).
  const head = dto ? toPayer(dto) : null
  const tenants = dto?.tenants ?? []
  const primary =
    tenants.find((t) => t.primary) ??
    tenants.find((t) => t.id === dto?.primary_tenant_id) ??
    tenants[0]
  const secondaries = tenants.filter((t) => t !== primary)
  const entitlements = dto?.entitlements ?? []
  const moduleCount = new Set(
    entitlements.filter((e) => e.enabled).map((e) => e.module_code)
  ).size
  const docCount = primary?.documents?.length ?? 0
  const rawStatus = head?.rawStatus ?? ""
  const lifeIdx = LIFE_INDEX[rawStatus] ?? 0

  const busy =
    suspendMut.isPending ||
    reactivateMut.isPending ||
    retireMut.isPending ||
    submitMut.isPending

  const onRaised = (msg: string) => {
    setDialog(null)
    toast.success(msg)
  }
  const onRaiseError = (e: unknown, fallback: string) =>
    toast.error(e instanceof Error ? e.message : fallback)

  const runSuspend = (reason: SuspendReason, note: string) =>
    suspendMut.mutate(
      { payerId, reason, note: note || undefined },
      {
        onSuccess: () => onRaised("Suspension submitted for approval."),
        onError: (e) => onRaiseError(e, "Couldn’t submit suspension."),
      }
    )

  const runReactivate = (note: string) =>
    reactivateMut.mutate(
      { payerId, note: note || undefined },
      {
        onSuccess: () => onRaised("Reactivation submitted for approval."),
        onError: (e) => onRaiseError(e, "Couldn’t submit reactivation."),
      }
    )

  const runRetire = (reason: string, note: string) =>
    retireMut.mutate(
      { payerId, reason, note: note || undefined },
      {
        onSuccess: () => onRaised("Retirement submitted for approval."),
        onError: (e) => onRaiseError(e, "Couldn’t submit retirement."),
      }
    )

  const runSubmit = () =>
    submitMut.mutate(
      { payerId },
      {
        onSuccess: () => {
          toast.success("Submitted for Platform Approver review.")
          navigate("/approvals")
        },
        onError: (e) =>
          toast.error(
            e instanceof Error ? e.message : "Couldn’t submit for review."
          ),
      }
    )

  if (!validId) return <Navigate to="/tenant-accounts" replace />

  const TABS: { k: TabKey; label: string; icon: LucideIcon; count?: number }[] = [
    { k: "overview", label: "Overview", icon: Building2Icon },
    { k: "tenants", label: "Tenants", icon: GitBranchIcon, count: tenants.length },
    {
      k: "entitlements",
      label: "Entitlements",
      icon: LayersIcon,
      count: moduleCount,
    },
    { k: "billing", label: "Billing", icon: CreditCardIcon },
    {
      k: "documents",
      label: "Documents",
      icon: FileCheck2Icon,
      count: docCount,
    },
    { k: "activity", label: "Activity", icon: HistoryIcon },
  ]

  /** Status-driven lifecycle actions (mirrors v3 lifecycleActions). */
  const lifecycleActions = () => {
    if (rawStatus === "DRAFT") {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={!actAllowed}
            title={lockTip || undefined}
            onClick={() => navigate(`/tenant-accounts/onboard?draft=${payerId}`)}
          >
            <PencilIcon data-icon="inline-start" />
            Edit
          </Button>
          <Button
            size="sm"
            disabled={!actAllowed || busy}
            title={lockTip || undefined}
            onClick={runSubmit}
          >
            {submitMut.isPending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SendIcon data-icon="inline-start" />
            )}
            Submit for review
          </Button>
        </>
      )
    }
    if (rawStatus === "ACTIVE") {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Adding a secondary tenant is DRAFT-only in the API (backend pending for active accounts)"
          >
            <UserPlusIcon data-icon="inline-start" />
            Add secondary tenant
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Editing tenant details is DRAFT-only in the API (backend pending for active accounts)"
          >
            <PencilIcon data-icon="inline-start" />
            Edit details
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canAct}
            title={pendingTip || lockTip || undefined}
            onClick={() => setDialog("suspend")}
          >
            <BanIcon data-icon="inline-start" />
            Suspend
          </Button>
        </>
      )
    }
    if (rawStatus === "SUSPENDED") {
      return (
        <>
          <Button
            size="sm"
            disabled={!canAct}
            title={pendingTip || lockTip || undefined}
            onClick={() => setDialog("reactivate")}
          >
            <PlayIcon data-icon="inline-start" />
            Reactivate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canAct}
            title={pendingTip || lockTip || undefined}
            onClick={() => setDialog("retire")}
          >
            <ArchiveIcon data-icon="inline-start" />
            Retire
          </Button>
        </>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Tenant accounts", href: "/tenant-accounts" },
          { label: head?.name ?? head?.code ?? "Record" },
        ]}
      />

      {/* record header */}
      {head ? (
        <div className="flex flex-wrap items-start gap-3.5">
          <AvatarInitials
            name={head.name}
            className="size-[52px] rounded-[13px] text-[19px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-semibold">{head.name}</h2>
              <StatusPill status={head.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span className="mono">{head.code}</span>
              <span className="text-muted-foreground/50">·</span>
              <span>{head.type}</span>
              {head.subdomain && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="mono">{head.subdomain}.ginja.ai</span>
                </>
              )}
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-center gap-1">
                <GlobeIcon className="size-3" />
                {head.region}
                {head.country ? ` · ${head.country}` : ""}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lifecycleActions()}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3.5">
          <span className="size-[52px] shrink-0 animate-pulse rounded-[13px] bg-muted" />
          <div className="min-w-0 flex-1 space-y-2 py-1.5">
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-72 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}

      {/* suspended banner */}
      {head && rawStatus === "SUSPENDED" && (
        <Note tone="warn" icon={<TriangleAlertIcon />}>
          This account is <b>suspended</b>. The tenant URL shows a suspension
          notice and logins are blocked. Reactivation restores access without
          re-provisioning.
        </Note>
      )}

      {/* pending lifecycle change-request banner */}
      {head && pending && (
        <Note tone="info" icon={<HistoryIcon />}>
          A <b>{pending.action.toLowerCase()}</b> request (
          <span className="mono">{pending.id}</span>) raised by{" "}
          <b>{pending.requestedBy}</b> is awaiting a second Platform Admin&rsquo;s
          decision (separation of duties). It&rsquo;s in the{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => navigate("/approvals")}
          >
            Approvals queue
          </button>
          .
        </Note>
      )}

      {recordQ.isLoading ? (
        <Panel>
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <LoadingSpinner />
          </div>
        </Panel>
      ) : forbidden ? (
        <Note tone="warn" icon={<TriangleAlertIcon />}>
          <b>Access required.</b> You don&rsquo;t have permission to view this
          tenant account.
        </Note>
      ) : recordQ.isError || !dto || !head ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn&rsquo;t load this tenant account.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => recordQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <>
          {/* lifecycle rail */}
          <Panel className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-3.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {LIFECYCLE.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && (
                    <span className="h-px w-5 bg-border sm:w-8" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[12.5px]",
                      i === lifeIdx
                        ? "font-semibold text-foreground"
                        : i < lifeIdx
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                    )}
                  >
                    <span
                      className={cn(
                        "size-[7px] rounded-full",
                        i === lifeIdx
                          ? "bg-primary"
                          : i < lifeIdx
                            ? "bg-muted-foreground"
                            : "bg-muted-foreground/30"
                      )}
                    />
                    {s}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <span className="text-[11.5px] text-muted-foreground">
              All state changes are audited
            </span>
          </Panel>

          {/* tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b">
            {TABS.map((t) => {
              const Ico = t.icon
              return (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setTab(t.k)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 border-b-2 px-3 text-[13px] transition-colors",
                    tab === t.k
                      ? "border-primary font-medium text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Ico className="size-[15px]" />
                  {t.label}
                  {typeof t.count === "number" && (
                    <span
                      className={cn(
                        "mono rounded-full px-1.5 text-[10.5px] font-semibold",
                        tab === t.k
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* tab body */}
          {tab === "overview" && <RecOverview dto={dto} primary={primary} />}
          {tab === "tenants" && (
            <RecTenants
              primary={primary}
              secondaries={secondaries}
              actAllowed={actAllowed}
              lockTip={lockTip}
            />
          )}
          {tab === "entitlements" && (
            <RecEntitlements
              entitlements={entitlements}
              actAllowed={actAllowed}
              lockTip={lockTip}
            />
          )}
          {tab === "billing" && (
            <RecBilling
              subscription={dto.subscription}
              onOpenPricing={() => navigate("/pricing")}
            />
          )}
          {tab === "documents" && (
            <RecDocuments payerId={payerId} primary={primary} />
          )}
          {tab === "activity" && (
            <div className="flex flex-col gap-3.5">
              <RecLifecycleRequests requests={requests} />
              <RecActivity payerId={payerId} />
            </div>
          )}
        </>
      )}

      <SuspendDialog
        open={dialog === "suspend"}
        name={head?.name ?? "this account"}
        busy={suspendMut.isPending}
        onOpenChange={(o) => !o && setDialog(null)}
        onConfirm={runSuspend}
      />
      <ReactivateDialog
        open={dialog === "reactivate"}
        name={head?.name ?? "this account"}
        busy={reactivateMut.isPending}
        onOpenChange={(o) => !o && setDialog(null)}
        onConfirm={runReactivate}
      />
      <RetireDialog
        open={dialog === "retire"}
        name={head?.name ?? "this account"}
        busy={retireMut.isPending}
        onOpenChange={(o) => !o && setDialog(null)}
        onConfirm={runRetire}
      />
    </div>
  )
}
