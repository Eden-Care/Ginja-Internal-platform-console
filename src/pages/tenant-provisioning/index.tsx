import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  FlagIcon,
  SearchIcon,
  ServerIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
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
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import {
  AssigneeAvatar,
  AvatarInitials,
} from "@/components/console/avatar-initials"
import { LoadingSpinner } from "@/components/common/loading"
import type { ProvTone } from "@/lib/console-data"
import { useAccess } from "@/contexts/access-context"
import { useMembers } from "@/features/access/use-members"
import {
  useAssignProvisioning,
  useProvisioning,
  useProvisioningMine,
} from "@/features/provisioning/use-provisioning"
import {
  PROV_STAGE_LABEL,
  PROV_STAGE_TONE,
  type ProvStage,
  type Provisioning,
} from "@/features/provisioning/types"
import { TonePill } from "./components"
import { EngineerSelect, engineerOptions } from "./engineer-select"
import {
  EngMultiSelect,
  StageMultiSelect,
  type StageOption,
} from "./filters"

const STAGES: ProvStage[] = [
  "AWAITING_START",
  "IN_PROGRESS",
  "BLOCKED",
  "READY_TO_ACTIVATE",
]

const STAT_TILES: { stage: ProvStage; icon: LucideIcon; tone: ProvTone }[] = [
  { stage: "AWAITING_START", icon: ClockIcon, tone: "neutral" },
  { stage: "IN_PROGRESS", icon: ServerIcon, tone: "warning" },
  { stage: "BLOCKED", icon: TriangleAlertIcon, tone: "error" },
  { stage: "READY_TO_ACTIVATE", icon: CheckCircle2Icon, tone: "success" },
]

const STAT_TONE: Record<ProvTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
}

const TOTAL_SECTIONS = 5

/** A five-segment progress track from the API section counts / statuses. */
function ProvTrack({ p }: { p: Provisioning }) {
  const total = p.sectionsTotal || TOTAL_SECTIONS
  const seg = (i: number) => {
    const s = p.sections[i]
    if (s) {
      if (s.status === "DONE" || s.status === "TESTED") return "bg-success"
      if (s.status === "CONFIGURED") return "bg-warning"
      return "bg-muted-foreground/20"
    }
    // Queue summaries can omit sections[]; fall back to the done count.
    return i < p.sectionsDone ? "bg-success" : "bg-muted-foreground/20"
  }
  return (
    <div className="flex w-[120px] gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-[7px] flex-1 rounded-[3px]", seg(i))} />
      ))}
    </div>
  )
}

export function TenantProvisioningPage() {
  const navigate = useNavigate()
  const { roleKey } = useAccess()
  // A Platform Engineer sees only the tenants assigned to them (/mine).
  const engineerView = roleKey === "platform_engineer"

  const queueQ = useProvisioning({}, !engineerView)
  const mineQ = useProvisioningMine(engineerView)
  const activeQ = engineerView ? mineQ : queueQ
  const rows = React.useMemo(() => activeQ.data ?? [], [activeQ.data])

  // The members roster is admin-only; only admins need it (for name resolution
  // + the assign picker). Non-admins skip it (names fall back to the raw id).
  const isAdmin = roleKey === "platform_admin"
  const membersQ = useMembers({}, isAdmin)
  const members = React.useMemo(
    () => membersQ.data?.items ?? [],
    [membersQ.data]
  )
  const memberName = React.useCallback(
    (id: string | null) => {
      if (!id) return null
      const m = members.find((x) => x.email.toLowerCase() === id.toLowerCase())
      return m?.name ?? id
    },
    [members]
  )

  // Only an admin can (re)assign provisioning to an engineer (API-restricted).
  const engineerPicks = React.useMemo(() => engineerOptions(members), [members])
  const assignMut = useAssignProvisioning()
  const assignEngineer = (tenantId: number, email: string) =>
    assignMut.mutate(
      { tenantId, assignee: email },
      {
        onSuccess: () => toast.success(`Assigned to ${memberName(email) ?? email}.`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn’t assign engineer."),
      }
    )

  const [query, setQuery] = React.useState("")
  const [stageSel, setStageSel] = React.useState<Set<string>>(new Set())
  const [engSel, setEngSel] = React.useState<Set<string>>(new Set())

  // Engineer options come from the assignees actually present in the queue.
  const engineers = React.useMemo(() => {
    const seen = new Map<string, string>()
    for (const r of rows) {
      if (r.assignee && !seen.has(r.assignee)) {
        seen.set(r.assignee, memberName(r.assignee) ?? r.assignee)
      }
    }
    return [...seen].map(([id, name]) => ({ id, name }))
  }, [rows, memberName])

  const engCount = (id: string) => rows.filter((i) => i.assignee === id).length
  const toggleEng = (id: string) =>
    setEngSel((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleStage = (s: string) =>
    setStageSel((x) => {
      const n = new Set(x)
      if (n.has(s)) n.delete(s)
      else n.add(s)
      return n
    })

  // Open a tenant on its own detail route (deep-linkable), not an inline panel.
  const openDetail = (tenantId: number) =>
    navigate(`/tenant-provisioning/${tenantId}`)

  const scoped =
    engSel.size === 0 ? rows : rows.filter((i) => i.assignee && engSel.has(i.assignee))

  const counts = Object.fromEntries(
    STAGES.map((s) => [s, scoped.filter((i) => i.stage === s).length])
  ) as Record<ProvStage, number>

  const q = query.toLowerCase()
  const list = scoped.filter(
    (i) =>
      (stageSel.size === 0 || stageSel.has(i.stage)) &&
      (i.legalEntityName.toLowerCase().includes(q) ||
        i.tenantCode.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q))
  )

  const stageOptions: StageOption[] = STAGES.map((s) => ({
    value: s,
    label: PROV_STAGE_LABEL[s],
    tone: PROV_STAGE_TONE[s],
  }))

  const filtersActive = stageSel.size > 0 || engSel.size > 0
  const clearAll = () => {
    setStageSel(new Set())
    setEngSel(new Set())
    setQuery("")
  }

  const readyCount = counts["READY_TO_ACTIVATE"] ?? 0

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title={engineerView ? "My provisioning queue" : "Tenant provisioning"}
        sub={
          engineerView
            ? "Tenants assigned to you for technical setup. Configure, test & activate."
            : "Technical setup for approved tenants. Configure infrastructure, integrations & data migration, then activate."
        }
      />

      {engineerView && (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3.5 py-2.5 shadow-xs">
          <ServerIcon className="size-[18px] text-muted-foreground" />
          <div className="min-w-0 flex-1 text-[13px]">
            <b>Your assignments</b>
            <span className="text-muted-foreground">
              {" "}
              — showing only tenants assigned to you
            </span>
          </div>
          <Tagpill>{scoped.length} assigned</Tagpill>
          <Tagpill className="bg-success-subtle text-success-subtle-foreground">
            {readyCount} ready
          </Tagpill>
        </div>
      )}

      {activeQ.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn&rsquo;t load the provisioning queue.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => activeQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <>
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
                    {PROV_STAGE_LABEL[stage]}
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
                stages={stageOptions}
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

            {activeQ.isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <LoadingSpinner />
              </div>
            ) : (
              <>
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
                      const engName = memberName(p.assignee)
                      return (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer"
                          onClick={() => openDetail(p.tenantId)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <AvatarInitials name={p.legalEntityName} />
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold">
                                  {p.legalEntityName}
                                </div>
                                <div className="mono text-[11.5px] text-muted-foreground">
                                  {p.tenantCode}
                                  {p.subdomain ? ` · ${p.subdomain}` : ""}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <ProvTrack p={p} />
                              <span className="text-[11.5px] text-muted-foreground">
                                {p.sectionsDone}/{p.sectionsTotal || TOTAL_SECTIONS}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <TonePill tone={PROV_STAGE_TONE[p.stage]}>
                                {PROV_STAGE_LABEL[p.stage]}
                              </TonePill>
                              {p.openRemarks > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[10.5px] font-semibold text-warning-subtle-foreground"
                                  title={`${p.openRemarks} open remark(s) from technical review`}
                                >
                                  <FlagIcon className="size-2.5" />
                                  {p.openRemarks} remark{p.openRemarks > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            onClick={
                              isAdmin ? (e) => e.stopPropagation() : undefined
                            }
                          >
                            {isAdmin ? (
                              <EngineerSelect
                                value={p.assignee}
                                engineers={engineerPicks}
                                onAssign={(email) =>
                                  assignEngineer(p.tenantId, email)
                                }
                                disabled={assignMut.isPending}
                                trigger={
                                  <button
                                    type="button"
                                    className="flex w-[176px] items-center gap-2 rounded-[9px] border border-input bg-card px-2 py-1 transition-colors hover:border-primary/50"
                                  >
                                    {engName ? (
                                      <>
                                        <AssigneeAvatar name={engName} size="sm" />
                                        <span className="truncate text-[12.5px]">
                                          {engName}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[12.5px] text-muted-foreground">
                                        Assign
                                      </span>
                                    )}
                                    <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                                  </button>
                                }
                              />
                            ) : engName ? (
                              <div className="flex items-center gap-2">
                                <AssigneeAvatar name={engName} size="sm" />
                                <span className="text-[12.5px]">{engName}</span>
                              </div>
                            ) : (
                              <span className="text-[12.5px] text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell
                            className="text-xs text-muted-foreground"
                            title="Approval date isn't returned by the provisioning API yet"
                          >
                            —
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
                      <b className="text-foreground">
                        No tenants match your filters.
                      </b>
                      <br />
                      Try clearing the filters or adjusting your search.
                    </p>
                    {filtersActive && (
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        <XIcon data-icon="inline-start" />
                        Clear all filters
                      </Button>
                    )}
                  </div>
                )}

                <div className="border-t p-3.5">
                  <span className="text-[11.5px] text-muted-foreground">
                    Country, tenant type, module count and approval date aren&rsquo;t
                    returned by the provisioning API yet — backend pending.
                  </span>
                </div>
              </>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
