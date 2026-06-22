import * as React from "react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  DownloadIcon,
  GlobeIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"

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
import { ONB_DRAFTS, type OnbDraft } from "@/lib/console-data"
import { AvatarInitials } from "@/components/console/avatar-initials"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { StatusPill } from "@/components/console/status-pill"
import { LoadingSpinner } from "@/components/common/loading"
import { usePayers } from "@/features/payers/use-payers"
import type { Payer } from "@/features/payers/types"
import { OnboardingDraftsStrip } from "./components/onboarding-drafts-strip"
import { DraftsDrawer, type DrawerView } from "./components/drafts-drawer"

type SortKey = "name" | "status" | "region" | "subTenants" | "subscription" | "updated"
type Sort = { k: SortKey; dir: 1 | -1 }

type Col = {
  k: SortKey | "members" | "mrr"
  label: string
  numeric?: boolean
  /** No API field yet — header is flagged and cells render "—". */
  pending?: boolean
}

const COLS: Col[] = [
  { k: "name", label: "Tenant account" },
  { k: "status", label: "Status" },
  { k: "region", label: "Region" },
  { k: "members", label: "Members", numeric: true, pending: true },
  { k: "subTenants", label: "Sub-tenants", numeric: true },
  { k: "subscription", label: "Subscription" },
  { k: "mrr", label: "MRR", numeric: true, pending: true },
  { k: "updated", label: "Updated" },
]

const SORT_VAL: Record<SortKey, (p: Payer) => string | number> = {
  name: (p) => p.name.toLowerCase(),
  status: (p) => p.status,
  region: (p) => p.region,
  subTenants: (p) => p.subTenants,
  subscription: (p) => p.subscriptionLabel.toLowerCase(),
  updated: (p) => p.updatedAt ?? "",
}

const STATUS_OPTS = ["All", "Active", "Draft", "Suspended", "Retired"]
const PAGE_SIZE = 12

const fmtUpdated = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "—"

export function TenantAccountsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = usePayers()
  const payers = React.useMemo(() => data ?? [], [data])

  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("All")
  const [sort, setSort] = React.useState<Sort>({ k: "updated", dir: -1 })
  const [page, setPage] = React.useState(1)
  const [drawer, setDrawer] = React.useState<DrawerView | null>(null)
  const [drafts, setDrafts] = React.useState<OnbDraft[]>(ONB_DRAFTS)

  const saveAssign = (id: string, assign: Record<string, string | null>) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, assign } : d)))

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    const filtered = payers.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q))
    )
    const val = SORT_VAL[sort.k]
    return [...filtered].sort((a, b) => (val(a) > val(b) ? 1 : -1) * sort.dir)
  }, [payers, query, status, sort])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const pageRows = rows.slice(start, start + PAGE_SIZE)

  const toggleSort = (k: SortKey) => {
    setSort((s) => ({ k, dir: s.k === k ? ((s.dir * -1) as 1 | -1) : 1 }))
    setPage(1)
  }

  const resume = () => {
    setDrawer(null)
    navigate("/tenant-accounts/onboard")
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Tenant accounts"
        sub="Health insurers, TPAs and self-managed schemes onboarded to the platform."
        actions={
          <>
            <Button variant="outline" size="sm">
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            <Button size="sm" onClick={() => navigate("/tenant-accounts/onboard")}>
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

      {isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load tenant accounts.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <Panel className="overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b p-3.5 lg:flex-row lg:items-center">
            <InputGroup className="lg:max-w-xs">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, ID or country…"
              />
            </InputGroup>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_OPTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    setStatus(o)
                    setPage(1)
                  }}
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
              {isLoading
                ? "Loading…"
                : `Showing ${rows.length === 0 ? 0 : start + 1}–${start + pageRows.length} of ${rows.length} accounts`}
            </span>
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
                    {COLS.map((c) => {
                      const sortable = !c.pending
                      return (
                        <TableHead
                          key={c.k}
                          onClick={
                            sortable ? () => toggleSort(c.k as SortKey) : undefined
                          }
                          className={cn(
                            "whitespace-nowrap select-none",
                            sortable && "cursor-pointer",
                            c.numeric && "text-right"
                          )}
                        >
                          <span className="inline-flex items-center gap-1">
                            {c.label}
                            {c.pending ? (
                              <span
                                title="Pending backend — not returned by the API yet"
                                className="text-[10px] text-muted-foreground/70"
                              >
                                *
                              </span>
                            ) : sort.k === c.k ? (
                              <span className="text-[10px] text-muted-foreground">
                                {sort.dir > 0 ? "▲" : "▼"}
                              </span>
                            ) : null}
                          </span>
                        </TableHead>
                      )
                    })}
                    <TableHead className="w-11" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <AvatarInitials name={p.name} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium">{p.name}</div>
                            <div className="mono text-[11.5px] text-muted-foreground">
                              {p.code} · {p.type}
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
                      <TableCell className="mono text-right text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell className="mono text-right">{p.subTenants}</TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {p.subscriptionLabel}
                      </TableCell>
                      <TableCell className="mono text-right text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {fmtUpdated(p.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" title="More">
                          <MoreHorizontalIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageRows.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={COLS.length + 1}
                        className="py-12 text-center text-[13px] text-muted-foreground"
                      >
                        No tenant accounts match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between gap-3 border-t p-3.5 text-sm">
                <span className="text-[11.5px] text-muted-foreground">
                  * Members and MRR aren’t returned by the API yet.
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Page {safePage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Panel>
      )}

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
