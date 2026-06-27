import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  GitBranchIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
  ZapIcon,
} from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { Glyph } from "@/components/console/glyph"
import { hifiTableHead } from "@/components/console/table"
import { LoadingSpinner } from "@/components/common/loading"
import { LoadMore } from "@/components/common/load-more"
import { useModuleRegistry } from "@/features/registry/use-module-registry"
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
    <div className="flex items-center gap-[13px] rounded-xl border bg-card p-3.5 shadow-xs">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[18px]">
        {icon}
      </span>
      <div>
        <div className="mono text-[22px] leading-none font-bold">{value}</div>
        <div className="mt-0.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {label}
        </div>
      </div>
    </div>
  )
}

export function ModuleRegistryPage() {
  const listQuery = useModuleRegistry()
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

  // KPI tiles reflect the full catalogue, not the filtered search.
  const total = all.length
  const published = all.filter((m) => m.status === "Published").length
  const beta = all.filter((m) => m.status === "Beta").length
  const subs = all.reduce((n, m) => n + m.subs.length, 0)

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
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Module registry"
        sub="The platform catalogue of modules and sub-modules. Everything here is selectable during tenant onboarding — nothing is hard-coded."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon data-icon="inline-start" />
            Register module
          </Button>
        }
      />

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={<LayersIcon />}
              value={String(total)}
              label="Total modules"
            />
            <StatTile
              icon={<CheckCircle2Icon />}
              value={String(published)}
              label="Published"
            />
            <StatTile icon={<ZapIcon />} value={String(beta)} label="In beta" />
            <StatTile
              icon={<GitBranchIcon />}
              value={String(subs)}
              label="Sub-modules"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <InputGroup className="max-w-xs min-w-[200px] flex-1">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules…"
              />
            </InputGroup>
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
            <Panel className="overflow-hidden">
              <Table>
                <TableHeader className={hifiTableHead}>
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
                      <TableCell>
                        <div className="flex items-center gap-[11px]">
                          <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[15px]">
                            <Glyph name={m.icon} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium">
                              {m.name}
                            </div>
                            <div className="text-[11.5px] text-muted-foreground">
                              {m.desc}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="mono text-[12.5px]">
                        {m.version}
                      </TableCell>
                      <TableCell>
                        <MiniBadge tone={MODULE_TONE[m.status]}>
                          {m.status}
                        </MiniBadge>
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {m.owner}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {m.subs.length}
                      </TableCell>
                      <TableCell className="mono text-right">
                        {m.tenants}
                      </TableCell>
                      <TableCell>
                        <span className="grid size-[30px] place-items-center rounded-lg border bg-card text-muted-foreground [&>svg]:size-[15px]">
                          <ChevronRightIcon />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length === 0 && (
                <div className="px-6 py-14 text-center text-sm text-muted-foreground">
                  {searching
                    ? `No modules match “${dq}”.`
                    : "No modules in the registry yet."}
                </div>
              )}
            </Panel>
          )}

          {/* Infinite scroll only for the browse list; search returns one set. */}
          {!searching ? (
            <LoadMore
              hasMore={listQuery.hasNextPage}
              loading={listQuery.isFetchingNextPage}
              onLoadMore={() => listQuery.fetchNextPage()}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
