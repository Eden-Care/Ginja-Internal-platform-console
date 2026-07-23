import * as React from "react"
import {
  Link,
  Navigate,
  Outlet,
  useOutletContext,
  useParams,
} from "react-router-dom"
import { toast } from "sonner"

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
  RoutedTabBar,
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

/* ------------------------------------------------------------ layout */

/** Route element for `/experiments/sp/:code` — head + routed tabs + <Outlet>. */
export function ExpRecordLayout() {
  const { code } = useParams<{ code: string }>()
  const rec = getProvider(code)

  if (!rec) return <Navigate to={EXP_ROOT} replace />

  const base = `${EXP_ROOT}/${encodeURIComponent(rec.code)}`
  const insurerCount = EXP_INSURERS.filter((i) =>
    currentExtraction(rec.code, i.accountId)
  ).length

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

      <RoutedTabBar
        tabs={[
          { k: "overview", label: "Overview", icon: <HiIcon name="hospital" />, href: base, end: true },
          { k: "services", label: "Services", icon: <HiIcon name="layers" />, href: `${base}/services` },
          { k: "insurers", label: "Insurers", icon: <HiIcon name="shield" />, count: insurerCount, href: `${base}/insurers` },
          { k: "audit", label: "Audit trail", icon: <HiIcon name="fileText" />, count: rec.audit.length, href: `${base}/audit` },
        ]}
      />

      <Outlet context={rec} />
    </div>
  )
}

const useRec = () => useOutletContext<ExpProvider>()

/* --------------------------------------------------------------- tabs */

export function ExpOverviewTab() {
  const rec = useRec()
  const integrationTone =
    rec.integration === "Done"
      ? "success"
      : rec.integration === "In progress"
        ? "warning"
        : "neutral"

  const rows: [string, React.ReactNode][] = [
    ["Account ID", <span className="mono font-semibold">{rec.displayId}</span>],
    ["Provider type", rec.type],
    ["Classification", rec.cls],
    ["Tier", rec.tier],
    ["Ownership", rec.ownership],
    ["Location", `${rec.town}, ${rec.county}, ${rec.country}`],
    ["HIMS", rec.hims],
    ["Claims / month", Number(rec.claimsMonth).toLocaleString()],
    [
      "Integration",
      rec.integration !== "—" ? (
        <MiniBadge tone={integrationTone}>{rec.integration}</MiniBadge>
      ) : (
        "—"
      ),
    ],
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
      <PanelHead icon={<HiIcon name="hospital" />} title="Provider profile" />
      <PanelBody>
        <div className="grid gap-x-10 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <DetailRow key={k} k={k} v={v} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}

export function ExpServicesTab() {
  const rec = useRec()
  return (
    <Panel>
      <PanelHead icon={<HiIcon name="layers" />} title="Clinical services offered" />
      <PanelBody>
        <div className="flex flex-wrap gap-2">
          {rec.services.map((s) => (
            <MiniBadge key={s} tone="success">
              <HiIcon name="check" className="size-[11px]" />
              {s}
            </MiniBadge>
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}

export function ExpInsurersTab() {
  const rec = useRec()
  const base = `${EXP_ROOT}/${encodeURIComponent(rec.code)}`

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-[11px] rounded-[11px] border bg-muted/40 px-[13px] py-[11px]">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary [&>svg]:size-[15px]">
          <HiIcon name="refresh" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold">
            Insurers from the platform directory
          </div>
          <div className="mt-px text-[11px] text-muted-foreground">
            Upload a contract per insurer for {rec.name}. Each opens its own
            workspace at a real URL.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {EXP_INSURERS.map((ins) => {
          const x = currentExtraction(rec.code, ins.accountId)
          return (
            <Link
              key={ins.accountId}
              to={`${base}/insurers/${encodeURIComponent(ins.accountId)}`}
              className="flex w-full items-start gap-3 rounded-xl border bg-card p-[13px] text-left transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-xs"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[13px] font-bold text-primary">
                {spInitials(ins.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold">{ins.name}</span>
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
                  {x ? ` · ${x.contractFilename}` : ""}
                  {x?.assigneeName ? ` · reviewer ${x.assigneeName}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 pl-1.5">
                <div className="text-center">
                  <b className="block text-[15px] font-bold tabular-nums">
                    {x ? x.rules.length : 0}
                  </b>
                  <span className="text-[10px] text-muted-foreground">rules</span>
                </div>
                <HiIcon name="chevronRight" className="size-4 text-muted-foreground" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function ExpAuditTab() {
  const rec = useRec()
  return (
    <Panel>
      <PanelHead icon={<HiIcon name="fileText" />} title="Audit trail" />
      <PanelBody>
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
