import * as React from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { StatTile } from "@/components/console/stat-tile"
import { Tagpill } from "@/components/console/tagpill"
import { ConsoleSelect, Seg } from "@/components/console/form-atoms"
import { HiIcon } from "@/components/hifi/icon"
import { EXP_PROVIDERS, providerSummary } from "./mock"
import {
  Avatar,
  EXP_ROOT,
  ExperimentBanner,
  SpStatusBadge,
} from "./shared"

const grid =
  "grid items-center gap-[14px] grid-cols-[minmax(0,1.6fr)_130px_120px_minmax(0,0.9fr)_110px_34px]"

/**
 * EXPERIMENT directory — same look as the live Service Providers list, but a
 * row click routes to `/experiments/sp/:code` (a real URL) instead of flipping
 * local view state.
 */
export function ExpDirectory() {
  const navigate = useNavigate()
  const [q, setQ] = React.useState("")
  const [typeF, setTypeF] = React.useState("All")
  const [status, setStatus] = React.useState("All")

  const summary = providerSummary()

  const list = EXP_PROVIDERS.filter((p) => {
    if (typeF !== "All" && p.type !== typeF) return false
    if (status !== "All" && p.status !== status) return false
    if (q.trim()) {
      const hay = `${p.name} ${p.displayId} ${p.county} ${p.town}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })

  const types = ["All", ...Array.from(new Set(EXP_PROVIDERS.map((p) => p.type)))]

  return (
    <div className="flex flex-col gap-5">
      <ExperimentBanner />

      <ConsolePageHeader
        title="Service providers"
        sub="Routed prototype — hospitals & clinics partnered under Claim Clean-up. Click a provider to open its record at a real URL."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tone="primary" icon={<HiIcon name="hospital" />} value={summary.total} label="Total providers" />
        <StatTile tone="success" icon={<HiIcon name="checkCircle" />} value={summary.active} label="Active" />
        <StatTile tone={summary.pendingReview ? "warning" : "neutral"} icon={<HiIcon name="clock" />} value={summary.pendingReview} label="Pending review" />
        <StatTile tone="neutral" icon={<HiIcon name="ban" />} value={summary.inactive} label="Inactive" />
      </div>

      <div>
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
          <ConsoleSelect className="h-[34px] w-[170px]" value={typeF} onChange={setTypeF} options={types} />
          <Seg
            value={status}
            onChange={setStatus}
            options={["All", "Active", { v: "Pending review", l: "Pending" }, "Inactive"]}
          />
          <Tagpill>
            {list.length} of {summary.total}
          </Tagpill>
        </div>

        <Panel className="overflow-hidden">
          <div
            className={cn(
              grid,
              "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            )}
          >
            <span>Provider</span>
            <span>Account ID</span>
            <span>Type</span>
            <span>County</span>
            <span>Status</span>
            <span />
          </div>

          {list.map((x, i) => (
            <div
              key={x.code}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`${EXP_ROOT}/${encodeURIComponent(x.code)}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigate(`${EXP_ROOT}/${encodeURIComponent(x.code)}`)
              }}
              className={cn(
                grid,
                "cursor-pointer border-t px-4 py-3 transition-colors hover:bg-muted/40",
                i === 0 && "border-t-0"
              )}
            >
              <div className="flex min-w-0 items-center gap-[11px]">
                <Avatar name={x.name} />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{x.name}</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">
                    {x.town} · {x.ownership.split(" ")[0]}
                  </div>
                </div>
              </div>
              <div className="mono truncate text-[11.5px]">{x.displayId}</div>
              <div className="truncate text-[12px] text-muted-foreground">{x.type}</div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-[5px] rounded-[6px] bg-muted px-[7px] py-0.5 text-[11px] text-muted-foreground [&>svg]:size-[11px]">
                  <HiIcon name="mapPin" />
                  {x.county}
                </span>
              </div>
              <div className="min-w-0">
                <SpStatusBadge status={x.status} />
              </div>
              <div className="flex justify-end text-muted-foreground [&>svg]:size-4">
                <HiIcon name="chevronRight" />
              </div>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  )
}
