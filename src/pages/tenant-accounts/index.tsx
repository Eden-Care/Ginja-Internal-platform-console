import * as React from "react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  DownloadIcon,
  GlobeIcon,
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
import { AvatarInitials } from "@/components/console/avatar-initials"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { StatusPill } from "@/components/console/status-pill"
import { LoadingSpinner } from "@/components/common/loading"
import { usePayers } from "@/features/payers/use-payers"
import type { PayerSortField, SortDir } from "@/features/payers/api"
import { useDrafts } from "@/features/payers/use-drafts"
import { OnboardingDraftsStrip } from "./components/onboarding-drafts-strip"
import { DraftsDrawer, type DrawerView } from "./components/drafts-drawer"

type ColKey =
  | "name"
  | "status"
  | "region"
  | "members"
  | "subTenants"
  | "subscription"
  | "mrr"
  | "updated"

type Col = {
  k: ColKey
  label: string
  numeric?: boolean
  /** No API field yet — header is flagged with "*" and cells render "—". */
  pending?: boolean
  /** Present → header is clickable and sorts server-side on this property.
     Name/Region/Sub-tenants/Subscription aren't sortable by the API. */
  sortField?: PayerSortField
}

const COLS: Col[] = [
  { k: "name", label: "Tenant account" },
  { k: "status", label: "Status", sortField: "status" },
  { k: "region", label: "Region" },
  { k: "members", label: "Members", numeric: true, pending: true },
  { k: "subTenants", label: "Sub-tenants", numeric: true },
  { k: "subscription", label: "Subscription" },
  { k: "mrr", label: "MRR", numeric: true, pending: true },
  { k: "updated", label: "Updated", sortField: "createdAt" },
]

/** Filter chip label → API status enum (undefined = no filter). */
const STATUS_PARAM: Record<string, string | undefined> = {
  All: undefined,
  Active: "ACTIVE",
  Draft: "DRAFT",
  Suspended: "SUSPENDED",
  Retired: "RETIRED",
}
const STATUS_OPTS = Object.keys(STATUS_PARAM)
const PAGE_SIZE = 12

const fmtUpdated = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "—"

export function TenantAccountsPage() {
  const navigate = useNavigate()

  const [status, setStatus] = React.useState("All")
  const [sort, setSort] = React.useState<{ field: PayerSortField; dir: SortDir }>(
    { field: "createdAt", dir: "desc" }
  )
  const [page, setPage] = React.useState(0) // 0-based (server pages)
  const [drawer, setDrawer] = React.useState<DrawerView | null>(null)

  const { data, isLoading, isFetching, isError, refetch } = usePayers({
    status: STATUS_PARAM[status],
    sort,
    page,
    size: PAGE_SIZE,
  })
  const { drafts } = useDrafts()

  const rows = data?.items ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = Math.max(1, data?.totalPages ?? 1)
  const start = page * PAGE_SIZE

  const toggleSort = (field: PayerSortField) => {
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    )
    setPage(0)
  }

  const resume = (payerId: number) => {
    setDrawer(null)
    navigate(`/tenant-accounts/onboard?draft=${payerId}`)
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

      {drafts.length > 0 ? (
        <OnboardingDraftsStrip
          drafts={drafts}
          onOpenDraft={(payerId) => setDrawer({ mode: "detail", payerId })}
          onViewAll={() => setDrawer({ mode: "list" })}
          onManageTeam={(payerId) => setDrawer({ mode: "team", payerId })}
        />
      ) : null}

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
                disabled
                title="Search isn’t supported by the payers API yet — filter by status instead."
                placeholder="Search (pending backend)…"
              />
            </InputGroup>

            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_OPTS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    setStatus(o)
                    setPage(0)
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
                : `Showing ${totalElements === 0 ? 0 : start + 1}–${start + rows.length} of ${totalElements} accounts`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              <Table className={cn(isFetching && "opacity-60 transition-opacity")}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {COLS.map((c) => {
                      const sortable = !!c.sortField
                      const active = sortable && sort.field === c.sortField
                      return (
                        <TableHead
                          key={c.k}
                          onClick={
                            sortable ? () => toggleSort(c.sortField!) : undefined
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
                            ) : active ? (
                              <span className="text-[10px] text-muted-foreground">
                                {sort.dir === "asc" ? "▲" : "▼"}
                              </span>
                            ) : null}
                          </span>
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/tenant-accounts/${p.id}`)}
                    >
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
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={COLS.length}
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
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 0 || isFetching}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1 || isFetching}
                      onClick={() => setPage((p) => p + 1)}
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
      />
    </div>
  )
}
