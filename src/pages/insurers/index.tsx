import * as React from "react"
import { SearchIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import { Button } from "@/components/ui/button"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { StatTile } from "@/components/console/stat-tile"
import { Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { Seg } from "@/components/console/form-atoms"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { useInsurersDirectory } from "@/features/insurers/use-insurers"
import type { Insurer } from "@/features/insurers/types"
import { InsurerForm } from "./components/insurer-form"
import { InsurerCreated } from "./components/insurer-created"
import { InsurerDrawer } from "./components/insurer-drawer"
import { InsurerAvatar, InsurerStatus, RegionPill, insGrid } from "./components/shared"

type View = "list" | "create" | "created" | "edit"

/**
 * Insurers directory (hi-fi `InsurersDirectory`) — the "Claim Clean-up (LAMU)"
 * insurer registry, bound to `/platform/insurance-companies`. A local view state
 * machine (list / create / created) with a record drawer overlaying the list.
 */
export function InsurersPage() {
  const { isReadonly } = useAccess()
  const readonly = isReadonly("insurers")

  const [view, setView] = React.useState<View>("list")
  const [selected, setSelected] = React.useState<Insurer | null>(null)
  const [created, setCreated] = React.useState<Insurer | null>(null)
  const [editing, setEditing] = React.useState<Insurer | null>(null)
  const [q, setQ] = React.useState("")
  const [qDebounced, setQDebounced] = React.useState("")
  const [status, setStatus] = React.useState("All")

  // Debounce the search box so we hit the `q` endpoint at most ~3×/sec.
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading, isError, refetch } = useInsurersDirectory({
    q: qDebounced.trim() || undefined,
  })

  if (view === "create")
    return (
      <InsurerForm
        onBack={() => setView("list")}
        onCreated={(rec) => {
          setCreated(rec)
          setView("created")
        }}
      />
    )
  if (view === "edit" && editing)
    return (
      <InsurerForm
        initial={editing}
        onBack={() => {
          setSelected(editing)
          setView("list")
        }}
        onUpdated={(rec) => {
          setSelected(rec)
          setView("list")
        }}
      />
    )
  if (view === "created" && created)
    return (
      <InsurerCreated
        insurer={created}
        onDone={() => setView("list")}
        onView={() => {
          setSelected(created)
          setView("list")
        }}
      />
    )

  // `q` search is applied server-side (name / account id / country); only the
  // status segment is filtered client-side over the returned page.
  const companies = data?.companies ?? []
  const list = companies.filter((x) => status === "All" || x.status === status)
  const summary = data?.summary ?? { total: 0, active: 0, inactive: 0 }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={[{ label: "Tenant management" }, "Insurance companies"]}
        title="Insurance companies"
        sub="Registered insurer profiles across East Africa. Create a profile to generate a unique account ID."
        actions={
          !readonly ? (
            <Button className={hifiBtn} onClick={() => setView("create")}>
              <HiIcon name="plus" />
              Add insurance company
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          tone="primary"
          icon={<HiIcon name="building" />}
          value={summary.total}
          label="Total companies"
        />
        <StatTile
          tone="success"
          icon={<HiIcon name="checkCircle" />}
          value={summary.active}
          label="Active"
        />
        <StatTile
          tone={summary.inactive ? "warning" : "neutral"}
          icon={<HiIcon name="ban" />}
          value={summary.inactive}
          label="Inactive"
        />
      </div>

      <div>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-[9px] pb-3.5">
          <div className="flex h-[34px] min-w-[200px] max-w-[320px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
            <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, ID or country…"
              aria-label="Search insurers"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Seg
            value={status}
            onChange={setStatus}
            options={["All", "Active", "Inactive"]}
          />
          <Tagpill>
            {list.length} of {summary.total}
          </Tagpill>
        </div>

        {/* Directory table */}
        <Panel className="overflow-hidden">
          <div
            className={cn(
              insGrid,
              "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            )}
          >
            <span>Company</span>
            <span>Account ID</span>
            <span>Country</span>
            <span className="hidden lg:block">Type</span>
            <span>Status</span>
            <span className="hidden lg:block">Created</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : isError ? (
            <Note
              tone="err"
              icon={<TriangleAlertIcon />}
              className="m-4"
            >
              Couldn’t load insurance companies.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => refetch()}
              >
                Try again
              </button>
              .
            </Note>
          ) : (
            <>
              {list.map((x, i) => (
                <div
                  key={x.accountId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(x)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(x)}
                  className={cn(
                    insGrid,
                    "cursor-pointer border-t px-4 py-3 transition-colors hover:bg-muted/40",
                    i === 0 && "border-t-0"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <InsurerAvatar name={x.name} />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold">
                        {x.name}
                      </div>
                      <div className="mono truncate text-[11.5px] text-muted-foreground">
                        {x.city} · {x.regulator}
                      </div>
                    </div>
                  </div>
                  <div className="mono truncate text-[11.5px]">{x.accountId}</div>
                  <div className="min-w-0">
                    <RegionPill country={x.country} />
                  </div>
                  <div className="hidden truncate text-[12px] text-foreground lg:block">
                    {x.companyTypeLabel}
                  </div>
                  <div className="min-w-0">
                    <InsurerStatus status={x.status} />
                  </div>
                  <div className="hidden text-[12px] whitespace-nowrap text-foreground lg:block">
                    {x.created}
                  </div>
                  <div className="flex justify-end text-muted-foreground [&>svg]:size-4">
                    <HiIcon name="chevronRight" />
                  </div>
                </div>
              ))}

              {list.length === 0 ? (
                <div className="m-4 flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-input bg-muted/30 px-6 py-12 text-center">
                  <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground shadow-xs [&>svg]:size-[22px]">
                    <HiIcon name="building" />
                  </span>
                  <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                    <b>No companies match.</b>
                    <br />
                    Try a different search or filter.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      </div>

      <InsurerDrawer
        insurer={selected}
        readonly={readonly}
        onClose={() => setSelected(null)}
        onEdit={(rec) => {
          setEditing(rec)
          setSelected(null)
          setView("edit")
        }}
      />
    </div>
  )
}
