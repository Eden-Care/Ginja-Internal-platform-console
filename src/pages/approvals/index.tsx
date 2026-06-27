import * as React from "react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowRightIcon,
  Building2Icon,
  LockIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { useAccess } from "@/contexts/access-context"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ApprovalQueueItem } from "@/features/approvals/types"
import { useApprovals } from "@/features/approvals/use-approvals"
import { LifecycleDecisionDialog } from "./lifecycle-decision-dialog"

type Tab = "pending" | "approved" | "all"

const fmtWhen = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "—"

export function ApprovalsPage() {
  const navigate = useNavigate()
  const { role } = useAccess()
  const { data, isLoading, isError, error, refetch } = useApprovals()
  const rows = React.useMemo(() => data ?? [], [data])
  const forbidden = error instanceof ApiError && error.status === 403

  const [tab, setTab] = React.useState<Tab>("pending")
  // The lifecycle row currently being decided (opens the decision dialog).
  const [lcrItem, setLcrItem] = React.useState<ApprovalQueueItem | null>(null)

  // Routing by row kind/status:
  //  • lifecycle + pending → decide it in a dialog (approve/reject the request)
  //  • approved (either kind) → the payer is live, open its Tenant account record
  //  • onboarding + pending → the full decision review screen
  const openReview = (p: ApprovalQueueItem) => {
    if (p.status === "APPROVED") {
      navigate(`/tenant-accounts/${p.id}`)
      return
    }
    if (p.kind === "LIFECYCLE") {
      setLcrItem(p)
      return
    }
    navigate(`/approvals/${p.id}`, { state: { item: p } })
  }

  const counts = {
    pending: rows.filter((r) => r.status === "PENDING").length,
    approved: rows.filter((r) => r.status === "APPROVED").length,
  }
  const visible =
    tab === "all"
      ? rows
      : rows.filter((r) => r.status === (tab === "pending" ? "PENDING" : "APPROVED"))

  const TABS: { k: Tab; label: string; count?: number }[] = [
    { k: "pending", label: "Pending", count: counts.pending },
    { k: "approved", label: "Approved", count: counts.approved },
    { k: "all", label: "All", count: rows.length },
  ]

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Approval queue"
        sub="Maker-checker review of onboarding submissions and account changes. A second approver is always required."
      />

      {role.maker && !role.checker && (
        <Note tone="info" icon={<ShieldCheckIcon />}>
          You&rsquo;re acting as <b>{role.label}</b> (a maker). Items you
          submitted are shown but you cannot approve your own changes —
          separation of duties is enforced.
        </Note>
      )}

      {isError ? (
        forbidden ? (
          <Note tone="warn" icon={<LockIcon />}>
            <b>Approver access required.</b> The approval queue is restricted to
            the <b>Platform Approver</b> role (separation of duties) — your
            current role can&rsquo;t view it. Sign in as an approver to review
            submissions.
          </Note>
        ) : (
          <Note tone="err" icon={<TriangleAlertIcon />}>
            Couldn&rsquo;t load the approval queue.{" "}
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => refetch()}
            >
              Try again
            </button>
            .
          </Note>
        )
      ) : (
        <Panel className="overflow-hidden">
          <div className="flex items-center gap-1.5 border-b p-3.5">
            {TABS.map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors",
                  tab === t.k
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
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
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Request</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Submitted by</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => openReview(p)}
                    >
                      <TableCell className="mono text-[12.5px] font-medium">
                        {p.requestId}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-[12.5px]">
                          <Building2Icon className="size-[15px] text-muted-foreground" />
                          {p.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold">
                        {p.tenant}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {p.submittedBy ?? "—"}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {fmtWhen(p.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11.5px] text-muted-foreground">
                          {p.priority ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MiniBadge
                          tone={p.status === "APPROVED" ? "success" : "warning"}
                        >
                          {p.status === "APPROVED" ? "Approved" : "Pending"}
                        </MiniBadge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReview(p)}
                        >
                          Review
                          <ArrowRightIcon data-icon="inline-end" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {visible.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <ShieldCheckIcon className="size-[22px]" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Nothing {tab === "approved" ? "approved" : tab === "pending" ? "pending" : "here"} right now.
                  </p>
                </div>
              )}
            </>
          )}
        </Panel>
      )}

      <LifecycleDecisionDialog
        key={lcrItem?.lifecycleRequestId ?? "none"}
        item={lcrItem}
        onClose={() => setLcrItem(null)}
      />
    </div>
  )
}
