import * as React from "react"
import {
  ArrowRightIcon,
  Building2Icon,
  CreditCardIcon,
  FileTextIcon,
  GitBranchIcon,
  LayersIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import {
  APPROVALS,
  APPROVAL_KIND_ICON,
  type Approval,
} from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApprovalReview } from "./review"

const KIND_LUCIDE: Record<string, LucideIcon> = {
  building: Building2Icon,
  layers: LayersIcon,
  fileText: FileTextIcon,
  gitBranch: GitBranchIcon,
  creditCard: CreditCardIcon,
  shieldCheck: ShieldCheckIcon,
}

export function kindIcon(kind: string): LucideIcon {
  return KIND_LUCIDE[APPROVAL_KIND_ICON[kind] ?? "fileText"] ?? FileTextIcon
}

const priorityTone = (p: Approval["priority"]) =>
  p === "High" ? "warning" : p === "Low" ? "neutral" : "info"

type Tab = "pending" | "approved" | "all"

export function ApprovalsPage() {
  const { role, isReadonly } = useAccess()
  const readonly = isReadonly("approvals")
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<Tab>("pending")

  const open = openId ? APPROVALS.find((a) => a.id === openId) : null
  if (open) {
    return <ApprovalReview approval={open} onBack={() => setOpenId(null)} />
  }

  const counts = {
    pending: APPROVALS.filter((a) => a.status === "pending").length,
    approved: APPROVALS.filter((a) => a.status === "approved").length,
  }
  const rows = APPROVALS.filter((a) => (tab === "all" ? true : a.status === tab))

  const TABS: { k: Tab; label: string; count?: number }[] = [
    { k: "pending", label: "Pending", count: counts.pending },
    { k: "approved", label: "Approved", count: counts.approved },
    { k: "all", label: "All" },
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
            {rows.map((a) => {
              const Ico = kindIcon(a.kind)
              return (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(a.id)}
                >
                  <TableCell className="mono text-[12.5px] font-medium">
                    {a.id}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-[12.5px]">
                      <Ico className="size-[15px] text-muted-foreground" />
                      {a.kind}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold">
                    {a.payer}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {a.maker}
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {a.submitted}
                  </TableCell>
                  <TableCell>
                    <MiniBadge tone={priorityTone(a.priority)}>
                      {a.priority}
                    </MiniBadge>
                  </TableCell>
                  <TableCell>
                    <MiniBadge tone={a.status === "pending" ? "warning" : "success"}>
                      {a.status === "pending" ? "Pending" : "Approved"}
                    </MiniBadge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(a.id)}
                    >
                      Review
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ShieldCheckIcon className="size-[22px]" />
            </span>
            <p className="text-sm text-muted-foreground">
              Nothing {tab === "approved" ? "approved" : "pending"} right now.
            </p>
          </div>
        )}
        {readonly && (
          <div className="border-t p-3.5">
            <Tagpill>Read-only — you can review but not decide</Tagpill>
          </div>
        )}
      </Panel>
    </div>
  )
}
