import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  DownloadIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ONB_DRAFTS, PAYERS, type OnbDraft } from "@/lib/console-data"
import { fmtNum, fmtUSD } from "@/lib/console-format"
import { AvatarInitials } from "@/components/console/avatar-initials"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { StatusPill } from "@/components/console/status-pill"
import { OnboardingDraftsStrip } from "./components/onboarding-drafts-strip"
import { DraftsDrawer, type DrawerView } from "./components/drafts-drawer"

type SortKey =
  | "name"
  | "status"
  | "region"
  | "members"
  | "secondary"
  | "plan"
  | "mrr"
  | "updated"
type Sort = { k: SortKey; dir: 1 | -1 }

type Col = { k: SortKey; label: string; numeric?: boolean }

const COLS: Col[] = [
  { k: "name", label: "Tenant account" },
  { k: "status", label: "Status" },
  { k: "region", label: "Region" },
  { k: "members", label: "Members", numeric: true },
  { k: "secondary", label: "Sub-tenants", numeric: true },
  { k: "plan", label: "Subscription" },
  { k: "mrr", label: "MRR", numeric: true },
  { k: "updated", label: "Updated" },
]

const STATUS_OPTS = ["All", "Active", "Draft", "Suspended", "Retired"]

export function TenantAccountsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("All")
  const [sort, setSort] = React.useState<Sort>({ k: "updated", dir: -1 })
  const [drawer, setDrawer] = React.useState<DrawerView | null>(null)
  const [drafts, setDrafts] = React.useState<OnbDraft[]>(ONB_DRAFTS)

  const saveAssign = (id: string, assign: Record<string, string | null>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, assign } : d)))

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    const filtered = PAYERS.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q))
    )
    return [...filtered].sort(
      (a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir
    )
  }, [query, status, sort])

  const toggleSort = (k: SortKey) =>
    setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }))

  const resume = (draft: OnbDraft, section?: string) => {
    toast(`Resuming ${draft.name}${section ? " · " + section : ""}.`)
    setDrawer(null)
    navigate("/tenant-accounts/onboard")
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={["Tenant management", "Tenant accounts"]}
        title="Tenant accounts"
        sub="Health insurers, TPAs and self-managed schemes onboarded to the platform."
        actions={
          <>
            <Button variant="outline" size="sm">
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/tenant-accounts/onboard")}
            >
              <PlusIcon data-icon="inline-start" />
              Onboard tenant
            </Button>
          </>
        }
      />

      <OnboardingDraftsStrip
        drafts={drafts}
        onOpenDraft={(id) => setDrawer({ mode: "detail", id })}
        onViewAll={() => setDrawer({ mode: "list" })}
        onManageTeam={(id) => setDrawer({ mode: "team", id })}
      />

      <Panel className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b p-3.5 lg:flex-row lg:items-center">
          <InputGroup className="lg:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID or country…"
            />
          </InputGroup>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setStatus(o)}
                className={cn(
                  "h-7 rounded-full border px-3 text-[13px] transition-colors",
                  status === o
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                {o}
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground lg:ml-auto">
            Showing {rows.length} of 24 accounts
          </span>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {COLS.map((c) => (
                <TableHead
                  key={c.k}
                  onClick={() => toggleSort(c.k)}
                  className={cn(
                    "cursor-pointer whitespace-nowrap select-none",
                    c.numeric && "text-right"
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {sort.k === c.k ? (
                      <span className="text-[10px] text-muted-foreground">
                        {sort.dir > 0 ? "▲" : "▼"}
                      </span>
                    ) : null}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <AvatarInitials name={p.name} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{p.name}</div>
                      <div className="mono text-[11.5px] text-muted-foreground">
                        {p.id} · {p.type}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill status={p.status} />
                </TableCell>
                <TableCell>
                  <span className="mono inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11.5px] text-muted-foreground">
                    <GlobeIcon className="size-3" />
                    {p.region}
                  </span>
                </TableCell>
                <TableCell className="mono text-right">
                  {p.members ? fmtNum(p.members) : "—"}
                </TableCell>
                <TableCell className="mono text-right">
                  {1 + p.secondary}
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {p.plan}
                </TableCell>
                <TableCell className="mono text-right">
                  {p.mrr ? fmtUSD(p.mrr) : "—"}
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {p.updated}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" title="More">
                    <MoreHorizontalIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t p-3.5 text-sm">
          <span className="text-muted-foreground">Page 1 of 2</span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Panel>

      <DraftsDrawer
        view={drawer}
        drafts={drafts}
        onChangeView={setDrawer}
        onClose={() => setDrawer(null)}
        onResume={resume}
        onSaveAssign={saveAssign}
      />
    </div>
  )
}
