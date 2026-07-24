import * as React from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  currentExtraction,
  EXP_INSURERS,
  getProvider,
  type ExpAuditTone,
  type ExpProvider,
} from "./mock"
import {
  Avatar,
  DetailRow,
  EXP_ROOT,
  ExperimentBanner,
  ExpCrumbs,
  EXTRACT_TONE,
  REVIEW_LABEL,
  REVIEW_TONE,
  SpStatusBadge,
  spInitials,
} from "./shared"

const AUD_TONE: Record<ExpAuditTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}
const AUD_GLYPH: Record<ExpAuditTone, string> = {
  success: "checkCircle",
  warning: "ban",
  neutral: "pencil",
}

/* --------------------------------------------------------------- page */

/**
 * EXPERIMENT — service-provider record as a SINGLE PAGE (no tabs). Profile +
 * services (both onboarding-captured) live in one card; the insurer workspace
 * list — the operational content — sits below it; the audit trail fills the 30%
 * rail. Opening an insurer still routes out to its own cockpit.
 */
export function ExpRecordPage() {
  const { code } = useParams<{ code: string }>()
  const rec = getProvider(code)

  if (!rec) return <Navigate to={EXP_ROOT} replace />

  const base = `${EXP_ROOT}/${encodeURIComponent(rec.code)}`

  return (
    <div className="flex flex-col gap-4">
      <ExperimentBanner />
      <ExpCrumbs
        items={[
          { label: "Service providers", href: EXP_ROOT },
          { label: rec.name },
        ]}
      />

      {/* record head */}
      <div className="flex items-start gap-4">
        <Avatar name={rec.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">{rec.name}</h1>
            <SpStatusBadge status={rec.status} />
          </div>
          <div className="mt-[5px] flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="mono">{rec.displayId}</span>
            <span>· {rec.type} · {rec.tier}</span>
            <span className="inline-flex items-center gap-[5px] rounded-[6px] bg-muted px-[7px] py-0.5 text-[11px] [&>svg]:size-[11px]">
              <HiIcon name="mapPin" />
              {rec.town}, {rec.county}
            </span>
          </div>
        </div>
        {rec.status === "Active" ? (
          <Button
            variant="outline"
            className={hifiBtn}
            onClick={() => toast(`${rec.name} would be marked Inactive.`)}
          >
            <HiIcon name="ban" />
            Mark Inactive
          </Button>
        ) : null}
        {rec.status === "Inactive" ? (
          <Button className={hifiBtn} onClick={() => toast(`${rec.name} would be activated.`)}>
            <HiIcon name="checkCircle" />
            Activate
          </Button>
        ) : null}
      </div>

      {rec.status === "Pending review" ? (
        <Note tone="warn" icon={<HiIcon name="clock" />}>
          <b>Pending review.</b> Submitted {rec.created} by {rec.createdBy}. Approve
          to make this provider live.
        </Note>
      ) : null}
      {rec.status === "Inactive" ? (
        <Note tone="warn" icon={<HiIcon name="ban" />}>
          <b>Inactive.</b> New claim submissions are rejected until reactivated.
        </Note>
      ) : null}

      {/* single-page body: profile + insurers (main) · audit (rail) */}
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <ProfileCard rec={rec} />
          <InsurersSection rec={rec} base={base} />
        </div>
        <aside className="lg:col-span-3 lg:self-start">
          <AuditRail rec={rec} />
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------- profile + services card */

function ProfileCard({ rec }: { rec: ExpProvider }) {
  // Reference detail — collapsed by default; expand for the full record.
  const [open, setOpen] = React.useState(false)

  const integrationTone =
    rec.integration === "Done"
      ? "success"
      : rec.integration === "In progress"
        ? "warning"
        : "neutral"

  const integrationBadge =
    rec.integration !== "—" ? (
      <MiniBadge tone={integrationTone}>{rec.integration}</MiniBadge>
    ) : (
      "—"
    )

  const rows: [string, React.ReactNode][] = [
    ["Account ID", <span className="mono font-semibold">{rec.displayId}</span>],
    ["Provider type", rec.type],
    ["Classification", rec.cls],
    ["Tier", rec.tier],
    ["Ownership", rec.ownership],
    ["Location", `${rec.town}, ${rec.county}, ${rec.country}`],
    ["HIMS", rec.hims],
    ["Claims / month", Number(rec.claimsMonth).toLocaleString()],
    ["Integration", integrationBadge],
    ["Registration", <span className="mono">{rec.reg}</span>],
    ["KRA PIN", <span className="mono">{rec.kra}</span>],
    ["SHIF / SHA", <span className="mono">{rec.shif}</span>],
    ["Primary contact", `${rec.contact} · ${rec.role}`],
    ["Email", <span className="mono">{rec.email}</span>],
    ["Phone", <span className="mono">{rec.phone}</span>],
    ["Created", `${rec.created} · by ${rec.createdBy}`],
    [
      "Approved",
      rec.approvedBy ? `${rec.approvedOn} · by ${rec.approvedBy}` : (
        <span className="text-muted-foreground">Not yet approved</span>
      ),
    ],
  ]

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="hospital" />}
        title="Provider profile"
        action={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline [&>svg]:size-3.5"
          >
            {open ? "Show less" : "Show all details"}
            <HiIcon
              name="chevronDown"
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
        }
      />
      <PanelBody>
        {open ? (
          <div className="grid gap-x-10 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <DetailRow key={k} k={k} v={v} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <MiniFact label="Primary contact" value={`${rec.contact} · ${rec.role}`} />
            <MiniFact label="HIMS" value={rec.hims} />
            <MiniFact label="Integration" value={integrationBadge} />
            <MiniFact label="Claims / month" value={Number(rec.claimsMonth).toLocaleString()} />
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase [&>svg]:size-3.5">
            <HiIcon name="layers" />
            Services offered
          </div>
          {rec.services.length ? (
            <div className="flex flex-wrap gap-2">
              {rec.services.map((s) => (
                <MiniBadge key={s} tone="neutral">
                  <HiIcon name="check" className="size-[11px]" />
                  {s}
                </MiniBadge>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">No services recorded.</p>
          )}
        </div>
      </PanelBody>
    </Panel>
  )
}

function MiniFact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 truncate text-[13px] font-medium">{value}</div>
    </div>
  )
}

/* -------------------------------------------------------- insurers section */

const INS_FILTERS = ["All", "With contracts", "In progress", "No contracts"] as const
type InsFilter = (typeof INS_FILTERS)[number]

function InsurersSection({ rec, base }: { rec: ExpProvider; base: string }) {
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<InsFilter>("All")

  const items = EXP_INSURERS.map((ins) => ({
    ins,
    x: currentExtraction(rec.code, ins.accountId),
  }))

  const counts: Record<InsFilter, number> = {
    All: items.length,
    "With contracts": items.filter((i) => i.x).length,
    "In progress": items.filter((i) => i.x && i.x.reviewStatus !== "COMPLETED").length,
    "No contracts": items.filter((i) => !i.x).length,
  }

  const filtered = items.filter(({ ins, x }) => {
    if (filter === "With contracts" && !x) return false
    if (filter === "No contracts" && x) return false
    if (filter === "In progress" && !(x && x.reviewStatus !== "COMPLETED")) return false
    if (q.trim() && !ins.name.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  })

  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="shield" />}
        title="Insurers"
        action={
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {items.length}
          </span>
        }
      />
      <PanelBody className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-[34px] min-w-[180px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
            <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search insurers…"
              aria-label="Search insurers"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INS_FILTERS.map((f) => {
              const active = filter === f
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                  <span
                    className={cn(
                      "rounded-full px-1 text-[10px] tabular-nums",
                      active ? "bg-primary/15" : "bg-background/70"
                    )}
                  >
                    {counts[f]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-2 divide-y">
          {filtered.map(({ ins, x }) => (
            <Link
              key={ins.accountId}
              to={`${base}/insurers/${encodeURIComponent(ins.accountId)}`}
              className="-mx-4 flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[12px] font-bold text-primary">
                {spInitials(ins.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold">{ins.name}</span>
                  {x ? (
                    <MiniBadge tone={EXTRACT_TONE[x.status]}>
                      {x.status === "COMPLETED" ? "Contract extracted" : x.status}
                    </MiniBadge>
                  ) : (
                    <MiniBadge tone="neutral">No contract</MiniBadge>
                  )}
                  {x && x.reviewStatus !== "UNASSIGNED" ? (
                    <MiniBadge tone={REVIEW_TONE[x.reviewStatus]}>
                      {REVIEW_LABEL[x.reviewStatus]}
                    </MiniBadge>
                  ) : null}
                </div>
                <div className="mt-[3px] text-[11.5px] text-muted-foreground">
                  {ins.companyTypeLabel} · {ins.country}
                </div>
                {x ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground [&>span]:inline-flex [&>span]:min-w-0 [&>span]:items-center [&>span]:gap-1.5 [&_svg]:size-[12px] [&_svg]:shrink-0">
                    <span>
                      <HiIcon name="fileText" />
                      <span className="truncate" title={x.contractFilename}>
                        {x.contractFilename}
                      </span>
                    </span>
                    {x.assigneeName ? (
                      <span>
                        <HiIcon name="userCheck" />
                        {x.assigneeName}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-1.5">
                <div className="text-center">
                  <b className="block text-[14px] font-bold tabular-nums">
                    {x ? x.rules.length : 0}
                  </b>
                  <span className="text-[10px] text-muted-foreground">rules</span>
                </div>
                <HiIcon name="chevronRight" className="size-4 self-center text-muted-foreground" />
              </div>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-muted-foreground">
              No insurers match.
            </div>
          ) : null}
        </div>
      </PanelBody>
    </Panel>
  )
}

/* ------------------------------------------------------------- audit rail */

function AuditRail({ rec }: { rec: ExpProvider }) {
  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="fileText" />}
        title="Audit trail"
        action={
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {rec.audit.length}
          </span>
        }
      />
      <PanelBody className="max-h-[70vh] overflow-y-auto p-4">
        <div className="flex flex-col gap-0.5">
          {rec.audit.map((a) => (
            <div key={a.id} className="flex gap-[11px] border-b py-[11px] last:border-b-0">
              <span
                className={cn(
                  "grid size-[26px] shrink-0 place-items-center rounded-full [&>svg]:size-3",
                  AUD_TONE[a.tone]
                )}
              >
                <HiIcon name={AUD_GLYPH[a.tone]} />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold">{a.action}</div>
                <div className="mt-0.5 text-[11.5px] leading-[1.45] text-muted-foreground">
                  {a.detail}
                </div>
                <div className="mt-[5px] flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MiniAvatar initials={a.initials} />
                  {a.by} · {a.when}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}
