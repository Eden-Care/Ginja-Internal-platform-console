import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  SearchIcon,
  ServerIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Tagpill } from "@/components/console/tagpill"
import { StaffAvatar } from "@/components/console/avatar-initials"
import {
  PROVISIONING,
  PROV_SECTIONS,
  PROV_STAGE_TONE,
  PROV_ENGINEERS,
  STAFF,
  STAFF_BY_ID,
  provDone,
  provOpenRemarks,
  type ProvStage,
  type ProvTone,
} from "@/lib/console-data"
import { useAccess } from "@/contexts/access-context"
import { ProvTrack, TonePill } from "./components"
import { EngMultiSelect, StageMultiSelect } from "./filters"
import { ProvisioningDetail } from "./detail"

const STAGES: ProvStage[] = [
  "Awaiting start",
  "In progress",
  "Blocked",
  "Ready to activate",
]

const STAT_TILES: { stage: ProvStage; icon: LucideIcon; tone: ProvTone }[] = [
  { stage: "Awaiting start", icon: ClockIcon, tone: "neutral" },
  { stage: "In progress", icon: ServerIcon, tone: "warning" },
  { stage: "Blocked", icon: TriangleAlertIcon, tone: "error" },
  { stage: "Ready to activate", icon: CheckCircle2Icon, tone: "success" },
]

const STAT_TONE: Record<ProvTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
}

export function TenantProvisioningPage() {
  const { role } = useAccess()
  const me = STAFF.find((s) => s.name === role.name)
  // A Platform Engineer sees only the tenants assigned to them.
  const engineerView = role.key === "platform_engineer" && !!me

  const [openId, setOpenId] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [stageSel, setStageSel] = React.useState<Set<ProvStage>>(new Set())
  const [engSel, setEngSel] = React.useState<Set<string>>(new Set())

  const engineers = STAFF.filter((s) => PROV_ENGINEERS.includes(s.id))
  const engCount = (id: string) =>
    PROVISIONING.filter((i) => i.engineer === id).length
  const toggleEng = (id: string) =>
    setEngSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleStage = (s: ProvStage) =>
    setStageSel((x) => {
      const n = new Set(x)
      if (n.has(s)) n.delete(s)
      else n.add(s)
      return n
    })

  const open = openId ? PROVISIONING.find((x) => x.id === openId) : null
  if (open) {
    return <ProvisioningDetail p={open} onBack={() => setOpenId(null)} />
  }

  const scoped = engineerView
    ? PROVISIONING.filter((i) => i.engineer === me!.id)
    : engSel.size === 0
      ? PROVISIONING
      : PROVISIONING.filter((i) => engSel.has(i.engineer))

  const counts = Object.fromEntries(
    STAGES.map((s) => [s, scoped.filter((i) => i.stage === s).length])
  ) as Record<ProvStage, number>

  const q = query.toLowerCase()
  const list = scoped.filter(
    (i) =>
      (stageSel.size === 0 || stageSel.has(i.stage)) &&
      (i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q))
  )

  const filtersActive = stageSel.size > 0 || engSel.size > 0
  const clearAll = () => {
    setStageSel(new Set())
    setEngSel(new Set())
    setQuery("")
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={["Tenant management", "Tenant provisioning"]}
        title={engineerView ? "My provisioning queue" : "Tenant provisioning"}
        sub={
          engineerView
            ? "Tenants assigned to you for technical setup. Configure, test & activate."
            : "Technical setup for approved tenants. Configure infrastructure, integrations & data migration, then activate."
        }
      />

      {engineerView && me && (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-xs">
          <StaffAvatar id={me.id} />
          <div className="min-w-0 flex-1 text-[13px]">
            <b>{me.name}</b>
            <span className="text-muted-foreground">
              {" "}
              · {me.role} — showing only tenants assigned to you
            </span>
          </div>
          <Tagpill>{scoped.length} assigned</Tagpill>
          <Tagpill className="bg-success-subtle text-success-subtle-foreground">
            {counts["Ready to activate"]} ready
          </Tagpill>
        </div>
      )}

      {/* stat tiles double as single-stage filters */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_TILES.map(({ stage, icon: Ic, tone }) => {
          const on = stageSel.size === 1 && stageSel.has(stage)
          return (
            <button
              key={stage}
              type="button"
              onClick={() =>
                setStageSel((s) =>
                  s.size === 1 && s.has(stage) ? new Set() : new Set([stage])
                )
              }
              className={cn(
                "flex flex-wrap items-center gap-2.5 rounded-[13px] border bg-card p-3.5 text-left transition-all",
                on
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-primary/40 hover:shadow-xs"
              )}
            >
              <span
                className={cn(
                  "grid size-[38px] place-items-center rounded-[10px] [&>svg]:size-4",
                  STAT_TONE[tone]
                )}
              >
                <Ic />
              </span>
              <span className="mono ml-auto text-[22px] font-bold">
                {counts[stage]}
              </span>
              <span className="-mt-0.5 basis-full text-[11.5px] text-muted-foreground">
                {stage}
              </span>
            </button>
          )
        })}
      </div>

      <Panel className="overflow-hidden">
        {/* toolbar */}
        <div className="flex flex-col gap-3 border-b p-3.5 lg:flex-row lg:items-center">
          <InputGroup className="lg:max-w-xs">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenants…"
            />
          </InputGroup>

          {!engineerView && (
            <EngMultiSelect
              engineers={engineers}
              sel={engSel}
              onToggle={toggleEng}
              onClear={() => setEngSel(new Set())}
              count={engCount}
            />
          )}
          <StageMultiSelect
            stages={STAGES}
            sel={stageSel}
            onToggle={toggleStage}
            onClear={() => setStageSel(new Set())}
            count={(s) => scoped.filter((i) => i.stage === s).length}
          />
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <XIcon data-icon="inline-start" />
              Clear filters
            </Button>
          )}
          <Tagpill className="lg:ml-auto">
            {list.length} of {scoped.length}
          </Tagpill>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tenant</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Engineer</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((p) => {
              const eng = STAFF_BY_ID[p.engineer]
              const openR = provOpenRemarks(p)
              return (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(p.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-[30px] shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-[11px] font-bold text-primary">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold">{p.name}</div>
                        <div className="mono text-[11.5px] text-muted-foreground">
                          {p.id} · {p.country} · {p.modules} modules
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <ProvTrack p={p} />
                      <span className="text-[11.5px] text-muted-foreground">
                        {provDone(p)}/{PROV_SECTIONS.length}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <TonePill tone={PROV_STAGE_TONE[p.stage]}>
                        {p.stage}
                      </TonePill>
                      {openR > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[10.5px] font-semibold text-warning-subtle-foreground"
                          title={`${openR} open remark(s) from technical review`}
                        >
                          <FlagIcon className="size-2.5" />
                          {openR} remark{openR > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StaffAvatar id={p.engineer} size="sm" />
                      <span className="text-[12.5px]">
                        {eng ? eng.name : "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.approvedOn}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm">
                      <ChevronRightIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ServerIcon className="size-[22px]" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              <b className="text-foreground">No tenants match your filters.</b>
              <br />
              Try clearing the filters or adjusting your search.
            </p>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <XIcon data-icon="inline-start" />
              Clear all filters
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
