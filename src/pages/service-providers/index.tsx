import * as React from "react"
import { SearchIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import { Button } from "@/components/ui/button"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { StatTile } from "@/components/console/stat-tile"
import { Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { ConsoleSelect, Seg } from "@/components/console/form-atoms"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { useServiceProvidersDirectory } from "@/features/service-providers/use-service-providers"
import {
  PROVIDER_TYPE_TO_ENUM,
  SP_TYPES,
  type ServiceProvider,
} from "@/features/service-providers/types"
import { RegionPill, SpAvatar, SpStatus, spGrid } from "./components/shared"
import { ProviderOnboard } from "./components/onboard"
import { ProviderCreated } from "./components/created"
import { ProviderRecord } from "./components/record"
import {
  ProviderReview,
  SPApprovedHistory,
  SPReviewQueue,
} from "./components/review"

type View =
  | "list"
  | "onboard"
  | "created"
  | "record"
  | "review-queue"
  | "review"
  | "review-history"

const STATUS_PARAM: Record<string, "ACTIVE" | "PENDING_REVIEW" | "INACTIVE" | undefined> = {
  All: undefined,
  Active: "ACTIVE",
  "Pending review": "PENDING_REVIEW",
  Inactive: "INACTIVE",
}

/**
 * Service Providers directory (hi-fi `ProvidersDirectory`) — the "Claim
 * Clean-up (LAMU)" hospital/clinic registry, bound to
 * `/platform/service-providers`. A local view state machine drives the
 * directory, the onboarding wizard, the record page and the approver flow.
 */
export function ServiceProvidersPage() {
  const { isReadonly } = useAccess()
  const readonly = isReadonly("providers")

  const [view, setView] = React.useState<View>("list")
  const [code, setCode] = React.useState("")
  const [created, setCreated] = React.useState<ServiceProvider | null>(null)
  const [q, setQ] = React.useState("")
  const [qDebounced, setQDebounced] = React.useState("")
  const [typeF, setTypeF] = React.useState("All")
  const [status, setStatus] = React.useState("All")

  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isLoading, isError, refetch } = useServiceProvidersDirectory({
    q: qDebounced.trim() || undefined,
    type: typeF === "All" ? undefined : PROVIDER_TYPE_TO_ENUM[typeF],
    status: STATUS_PARAM[status],
  })

  if (view === "onboard")
    return (
      <ProviderOnboard
        onBack={() => setView("list")}
        onDone={(rec) => {
          setCreated(rec)
          setView("created")
        }}
      />
    )
  if (view === "created" && created)
    return (
      <ProviderCreated
        provider={created}
        onList={() => setView("list")}
        onView={() => {
          setCode(created.code)
          setView("record")
        }}
      />
    )
  if (view === "review-queue")
    return (
      <SPReviewQueue
        onOpen={(c) => {
          setCode(c)
          setView("review")
        }}
        onHistory={() => setView("review-history")}
        onBack={() => setView("list")}
      />
    )
  if (view === "review")
    return (
      <ProviderReview code={code} onBack={() => setView("review-queue")} />
    )
  if (view === "review-history")
    return (
      <SPApprovedHistory
        onOpen={(c) => {
          setCode(c)
          setView("record")
        }}
        onBack={() => setView("review-queue")}
      />
    )
  if (view === "record")
    return (
      <ProviderRecord
        code={code}
        readonly={readonly}
        onClose={() => setView("list")}
      />
    )

  const summary = data?.summary ?? {
    total: 0,
    active: 0,
    pendingReview: 0,
    inactive: 0,
  }
  const list = data?.providers ?? []

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Service providers"
        sub="Hospitals & clinics partnered under Claim Clean-up. Onboard a provider to create their profile — Inactive until an Approver activates it."
        actions={
          !readonly ? (
            <>
              <Button
                variant="outline"
                className={hifiBtn}
                onClick={() => setView("review-queue")}
              >
                <HiIcon name="clock" />
                Review queue
                {summary.pendingReview > 0 ? ` · ${summary.pendingReview}` : ""}
              </Button>
              <Button
                variant="outline"
                className={hifiBtn}
                onClick={() =>
                  toast(`Exporting ${summary.total} providers to Excel (.xlsx)…`)
                }
              >
                <HiIcon name="download" />
                Export
              </Button>
              <Button className={hifiBtn} onClick={() => setView("onboard")}>
                <HiIcon name="plus" />
                Onboard provider
              </Button>
            </>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          tone="primary"
          icon={<HiIcon name="hospital" />}
          value={summary.total}
          label="Total providers"
        />
        <StatTile
          tone="success"
          icon={<HiIcon name="checkCircle" />}
          value={summary.active}
          label="Active"
        />
        <StatTile
          tone={summary.pendingReview ? "warning" : "neutral"}
          icon={<HiIcon name="clock" />}
          value={summary.pendingReview}
          label="Pending review"
        />
        <StatTile
          tone="neutral"
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
              placeholder="Search by name, ID or county…"
              aria-label="Search providers"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ConsoleSelect
            className="h-[34px] w-[160px]"
            value={typeF}
            onChange={setTypeF}
            options={["All", ...SP_TYPES]}
          />
          <Seg
            value={status}
            onChange={setStatus}
            options={[
              "All",
              "Active",
              { v: "Pending review", l: "Pending" },
              "Inactive",
            ]}
          />
          <Tagpill>
            {list.length} of {summary.total}
          </Tagpill>
        </div>

        {/* Directory table */}
        <Panel className="overflow-hidden">
          <div
            className={cn(
              spGrid,
              "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            )}
          >
            <span>Provider</span>
            <span>Account ID</span>
            <span className="hidden lg:block">Type</span>
            <span>County</span>
            <span className="hidden lg:block">Tier</span>
            <span>Status</span>
            <span />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : isError ? (
            <Note tone="err" icon={<TriangleAlertIcon />} className="m-4">
              Couldn’t load service providers.{" "}
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
                  key={x.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setCode(x.code)
                    setView("record")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setCode(x.code)
                      setView("record")
                    }
                  }}
                  className={cn(
                    spGrid,
                    "cursor-pointer border-t px-4 py-3 transition-colors hover:bg-muted/40",
                    i === 0 && "border-t-0"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <SpAvatar name={x.name} />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold">
                        {x.name}
                      </div>
                      <div className="truncate text-[11.5px] text-muted-foreground">
                        {x.town} · {x.ownership.split(" ")[0]}
                      </div>
                    </div>
                  </div>
                  <div className="mono truncate text-[11.5px]">{x.displayId}</div>
                  <div className="hidden truncate text-[12px] text-muted-foreground lg:block">
                    {x.type}
                  </div>
                  <div className="min-w-0">
                    <RegionPill label={x.county} />
                  </div>
                  <div className="hidden truncate text-[11.5px] text-muted-foreground lg:block">
                    {x.tier}
                  </div>
                  <div className="min-w-0">
                    <SpStatus status={x.status} />
                  </div>
                  <div className="flex justify-end text-muted-foreground [&>svg]:size-4">
                    <HiIcon name="chevronRight" />
                  </div>
                </div>
              ))}

              {list.length === 0 ? (
                <div className="m-4 flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-input bg-muted/30 px-6 py-12 text-center">
                  <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground shadow-xs [&>svg]:size-[22px]">
                    <HiIcon name="hospital" />
                  </span>
                  <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                    <b>No providers match.</b>
                    <br />
                    Try a different search or filter.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
