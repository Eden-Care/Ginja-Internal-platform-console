import * as React from "react"
import { PlusIcon, SearchIcon, TriangleAlertIcon } from "lucide-react"

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Note } from "@/components/console/note"
import { MBadge } from "@/components/hifi/badge"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { LoadingSpinner } from "@/components/common/loading"
import { LoadMore } from "@/components/common/load-more"
import { useModuleRegistry } from "@/features/registry/use-module-registry"
import { useModuleMetrics } from "@/features/registry/use-module-metrics"
import { useModuleSearch } from "@/features/registry/use-module-search"
import { useModule } from "@/features/registry/use-module"
import { MODULE_TONE } from "./status"
import { ModuleRecord } from "./components/module-record"
import { ModuleForm } from "./components/module-form"

/** Compact KPI tile: icon left, big mono value over an uppercase label. */
function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-[13px] rounded-[12px] border bg-card p-3.5 shadow-xs">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[18px]">
        {icon}
      </span>
      <div>
        <div className="mono text-[22px] leading-[normal] font-bold">{value}</div>
        <div className="mt-0.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground uppercase leading-[normal]">
          {label}
        </div>
      </div>
    </div>
  )
}

export function ModuleRegistryPage() {
  const listQuery = useModuleRegistry()
  // Dashboard KPI counts come from the metrics endpoint (authoritative totals).
  const metricsQuery = useModuleMetrics()
  // Flattened across infinite-scroll pages. KPI tiles below count this loaded
  // set (not a guaranteed grand total — same as the old size-100 single fetch).
  const all = React.useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data]
  )

  // Search box → debounced → server-side /modules/search.
  const [query, setQuery] = React.useState("")
  const [dq, setDq] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDq(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const searching = dq.length > 0
  const searchQuery = useModuleSearch(dq)
  const rows = searching ? (searchQuery.data ?? []) : all

  // Navigation: list → record → create/edit form.
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const detailQuery = useModule(openId)
  const recordModule =
    detailQuery.data ??
    rows.find((m) => m.id === openId) ??
    all.find((m) => m.id === openId) ??
    null

  // KPI tiles use the authoritative metrics endpoint; while it loads, fall back
  // to counts derived from the loaded pages so the tiles aren't empty.
  const metrics = metricsQuery.data
  const total = metrics?.totalModules ?? all.length
  const published =
    metrics?.published ?? all.filter((m) => m.status === "Published").length
  const beta = metrics?.inBeta ?? all.filter((m) => m.status === "Beta").length
  const subs =
    metrics?.totalSubModules ?? all.reduce((n, m) => n + m.subs.length, 0)

  if (creating) return <ModuleForm onBack={() => setCreating(false)} />
  if (editing && recordModule)
    return (
      <ModuleForm existing={recordModule} onBack={() => setEditing(false)} />
    )
  if (openId && recordModule)
    return (
      <ModuleRecord
        key={recordModule.id}
        module={recordModule}
        onBack={() => {
          setOpenId(null)
          setEditing(false)
        }}
        onEdit={() => setEditing(true)}
      />
    )

  return (
    // Lucide icons here are drawn at the hi-fi's 1.75 stroke (vs the app's
    // default 2) so the dashboard glyphs match the reference exactly.
    // Explicit v3 spacing rhythm (no uniform gap): page-head mb 18, stats mb 16,
    // search toolbar pt 10 / pb 14 — matches Ginja Console-v3.html around the search.
    <div className="flex flex-col [&_svg]:[stroke-width:1.75]">
      {/* Local header (no shared `max-w-prose` cap) so the subtitle stays on a
         single line like the hi-fi `.page-sub`. */}
      <div className="mb-[18px] flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Module registry
          </h1>
          <p className="mt-[3px] text-[13px] text-muted-foreground">
            The platform catalogue of modules and sub-modules. Everything here is
            selectable during tenant onboarding — nothing is hard-coded.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button className={hifiBtn} onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            Register module
          </Button>
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : listQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load the module registry.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => listQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={<HiIcon name="layers" />}
              value={String(total)}
              label="Total modules"
            />
            <StatTile
              icon={<HiIcon name="checkCircle" />}
              value={String(published)}
              label="Published"
            />
            <StatTile
              icon={<HiIcon name="zap" />}
              value={String(beta)}
              label="In beta"
            />
            <StatTile
              icon={<HiIcon name="gitBranch" />}
              value={String(subs)}
              label="Sub-modules"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-[10px] pb-[14px]">
            {/* The search sits in the hi-fi `.toolbar`: 10px above (after the
               stats' 16px margin) and 14px below, before the table. Local search
               box matches `.search` (34px, 8px radius, 15px icon). */}
            <div className="flex h-[34px] max-w-xs min-w-[200px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
              <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            {searching && searchQuery.isFetching ? <LoadingSpinner /> : null}
          </div>

          {searching && searchQuery.isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : searching && searchQuery.isError ? (
            <Note tone="err" icon={<TriangleAlertIcon />}>
              Couldn’t search modules.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => searchQuery.refetch()}
              >
                Try again
              </button>
              .
            </Note>
          ) : (
            <div className="overflow-hidden rounded-[10px] border bg-card">
              <table className="w-full caption-bottom text-[13px]">
                <TableHeader className="bg-transparent [&_th]:h-auto [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:tracking-[0.03em] [&_th]:text-muted-foreground [&_th]:uppercase">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Module</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner team</TableHead>
                    <TableHead>Sub-modules</TableHead>
                    <TableHead className="text-right">Tenants</TableHead>
                    <TableHead className="w-11" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((m) => (
                    <TableRow
                      key={m.id}
                      className="cursor-pointer"
                      onClick={() => setOpenId(m.id)}
                    >
                      <TableCell className="h-11 px-3 py-0">
                        <div className="flex items-center gap-[11px]">
                          <span className="grid size-[30px] shrink-0 place-items-center rounded-[8px] bg-primary/10 text-primary [&>svg]:size-[15px]">
                            <HiIcon name={m.icon} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold">
                              {m.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {m.desc}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="mono h-11 px-3 py-0 text-[12.5px]">
                        {m.version}
                      </TableCell>
                      <TableCell className="h-11 px-3 py-0">
                        <MBadge tone={MODULE_TONE[m.status]}>{m.status}</MBadge>
                      </TableCell>
                      <TableCell className="h-11 px-3 py-0 text-[13px] text-muted-foreground">
                        {m.owner}
                      </TableCell>
                      <TableCell className="h-11 px-3 py-0 text-[13px] text-muted-foreground">
                        {m.subs.length}
                      </TableCell>
                      <TableCell className="mono h-11 px-3 py-0 text-right">
                        {m.tenants}
                      </TableCell>
                      <TableCell className="h-11 px-3 py-0">
                        <span className="grid size-[30px] place-items-center rounded-[8px] border border-input bg-card text-muted-foreground [&>svg]:size-[15px]">
                          <HiIcon name="chevronRight" />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
              {rows.length === 0 && (
                <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                  {searching
                    ? `No modules match “${dq}”.`
                    : "No modules in the registry yet."}
                </div>
              )}
            </div>
          )}

          {/* Infinite scroll only for the browse list; search returns one set. */}
          {!searching ? (
            <div className="mt-4">
              <LoadMore
                hasMore={listQuery.hasNextPage}
                loading={listQuery.isFetchingNextPage}
                onLoadMore={() => listQuery.fetchNextPage()}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
