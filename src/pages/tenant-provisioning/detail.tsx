import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  FlagIcon,
  LockIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StaffAvatar } from "@/components/console/avatar-initials"
import { useAccess } from "@/contexts/access-context"
import {
  PROV_SECTIONS,
  PROV_STAGE_TONE,
  PROV_STATUS,
  STAFF_BY_ID,
  type ProvRemark,
  type ProvRemarkSeverity,
  type ProvSectionKey,
  type ProvSectionStatus,
  type ProvTone,
  type ProvisioningRecord,
} from "@/lib/console-data"
import { SECTION_ICON, SectionStatusPill, TonePill } from "./components"
import { RemarkCard, RemarkComposer } from "./remarks"
import {
  SecDatabase,
  SecDomains,
  SecEmail,
  SecMigration,
  SecSms,
} from "./sections"

const TILE_TONE: Record<ProvTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
}
const DOT_TONE: Record<ProvTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  neutral: "bg-muted-foreground/35",
  info: "bg-info",
}

export function ProvisioningDetail({
  p,
  onBack,
}: {
  p: ProvisioningRecord
  onBack: () => void
}) {
  const { role, isReadonly } = useAccess()
  const [active, setActive] = React.useState<ProvSectionKey>("database")
  const [cfg, setCfg] = React.useState(p.config)
  const [sec, setSec] = React.useState(p.sections)
  const [remarks, setRemarks] = React.useState<ProvRemark[]>(p.remarks ?? [])

  // Role-driven access: a Technical Reviewer is view-only but can leave remarks;
  // read-only roles can't edit at all; everyone else (admin/engineer) can edit.
  const isReviewer = role.techReviewer
  const readonly = isReadonly("provisioning")
  const ro: boolean | string = isReviewer
    ? "You have view-only access as Technical Reviewer — leave remarks below to flag issues for the engineer."
    : readonly
  const canResolve = !readonly && !isReviewer

  const markSec = (k: ProvSectionKey, st: ProvSectionStatus) =>
    setSec((s) => ({ ...s, [k]: st }))
  const resolveRemark = (id: string) => {
    setRemarks((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
    )
    toast.success("Remark marked resolved.")
  }
  const addRemark = (text: string, severity: ProvRemarkSeverity) => {
    setRemarks((rs) => [
      {
        id: "RMK-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        section: active,
        by: role.name,
        initials: role.initials,
        when: "Just now",
        severity,
        status: "open",
        text,
      },
      ...rs,
    ])
    toast(`Remark added on ${cur.l} — the engineer will be notified.`)
  }

  const openRemarks = remarks.filter((r) => r.status === "open")
  const remarksFor = (k: ProvSectionKey) => remarks.filter((r) => r.section === k)
  const openFor = (k: ProvSectionKey) =>
    remarks.filter((r) => r.section === k && r.status === "open").length

  const done = PROV_SECTIONS.filter((s) =>
    ["done", "tested"].includes(sec[s.k])
  ).length
  const allReady = PROV_SECTIONS.every((s) =>
    ["done", "tested"].includes(sec[s.k])
  )
  const eng = STAFF_BY_ID[p.engineer]
  const cur = PROV_SECTIONS.find((s) => s.k === active)!
  const CurIcon = SECTION_ICON[cur.icon]

  const renderActive = () => {
    switch (active) {
      case "database":
        return (
          <SecDatabase
            cfg={cfg.database}
            set={(patch) =>
              setCfg((c) => ({ ...c, database: { ...c.database, ...patch } }))
            }
            mark={(st) => markSec("database", st)}
            ro={ro}
          />
        )
      case "domains":
        return (
          <SecDomains
            cfg={cfg.domains}
            set={(patch) =>
              setCfg((c) => ({ ...c, domains: { ...c.domains, ...patch } }))
            }
            mark={(st) => markSec("domains", st)}
            ro={ro}
          />
        )
      case "sms":
        return (
          <SecSms
            cfg={cfg.sms}
            set={(patch) =>
              setCfg((c) => ({ ...c, sms: { ...c.sms, ...patch } }))
            }
            mark={(st) => markSec("sms", st)}
            ro={ro}
          />
        )
      case "email":
        return (
          <SecEmail
            cfg={cfg.email}
            set={(patch) =>
              setCfg((c) => ({ ...c, email: { ...c.email, ...patch } }))
            }
            mark={(st) => markSec("email", st)}
            ro={ro}
          />
        )
      case "migration":
        return (
          <SecMigration
            cfg={cfg.migration}
            set={(patch) =>
              setCfg((c) => ({
                ...c,
                migration: { ...c.migration, ...patch },
              }))
            }
            mark={(st) => markSec("migration", st)}
            ro={ro}
          />
        )
    }
  }

  return (
    <div className="flex flex-col">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3.5 self-start pl-1.5"
        onClick={onBack}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        All provisioning
      </Button>

      {/* record header */}
      <div className="flex items-start gap-4 pb-5">
        <span className="grid size-[52px] shrink-0 place-items-center rounded-[13px] border border-primary/20 bg-primary/10 text-[19px] font-bold text-primary">
          {p.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <TonePill tone={PROV_STAGE_TONE[p.stage]}>{p.stage}</TonePill>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="mono text-xs text-muted-foreground">
              {p.tenantId}
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              {p.type} · {p.country} · {p.modules} modules · approved{" "}
              {p.approvedOn}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[11px] text-muted-foreground">Lead engineer</span>
          <div className="mt-1 flex items-center justify-end gap-2">
            <StaffAvatar id={p.engineer} size="sm" />
            <b className="text-[12.5px]">{eng ? eng.name : "—"}</b>
          </div>
        </div>
      </div>

      {/* open-remarks banner */}
      {openRemarks.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-warning/40 bg-warning-subtle/60 px-3.5 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-warning/20 text-warning-subtle-foreground">
            <FlagIcon className="size-[15px]" />
          </span>
          <span className="text-[12.5px] text-warning-subtle-foreground">
            <b>
              {openRemarks.length} open remark
              {openRemarks.length > 1 ? "s" : ""} from technical review.
            </b>{" "}
            Resolve {openRemarks.length > 1 ? "them" : "it"} before activation —
            jump to:
          </span>
          {[...new Set(openRemarks.map((r) => r.section))].map((k) => {
            const s = PROV_SECTIONS.find((x) => x.k === k)!
            const Ic = SECTION_ICON[s.icon]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActive(k)}
                className="inline-flex items-center gap-1.5 rounded-full border border-warning/45 bg-card px-2.5 py-1 text-[11.5px] font-semibold hover:border-warning"
              >
                <Ic className="size-3" />
                {s.l}
                <span className="mono rounded-full bg-warning-subtle px-1.5 text-[10px] font-bold text-warning-subtle-foreground">
                  {openFor(k)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[264px_1fr]">
        {/* left rail */}
        <div className="flex flex-col gap-1 lg:sticky lg:top-3">
          {PROV_SECTIONS.map((s) => {
            const st = sec[s.k]
            const ps = PROV_STATUS[st]
            const Ic = SECTION_ICON[s.icon]
            const on = active === s.k
            return (
              <button
                key={s.k}
                type="button"
                onClick={() => setActive(s.k)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2.5 text-left transition-colors",
                  on
                    ? "border-border bg-card shadow-xs"
                    : "border-transparent hover:bg-muted/60"
                )}
              >
                <span
                  className={cn(
                    "grid size-[30px] shrink-0 place-items-center rounded-lg [&>svg]:size-[15px]",
                    TILE_TONE[ps.tone]
                  )}
                >
                  <Ic />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold">{s.l}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {ps.lab}
                  </span>
                </span>
                {openFor(s.k) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-1.5 text-[10px] font-bold text-warning-subtle-foreground">
                    <FlagIcon className="size-2.5" />
                    {openFor(s.k)}
                  </span>
                )}
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    DOT_TONE[ps.tone]
                  )}
                />
              </button>
            )
          })}

          <div className="mt-3 rounded-xl border bg-card px-3.5 py-3.5">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span>Readiness</span>
              <span className="mono text-muted-foreground">
                {done}/{PROV_SECTIONS.length}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-[width]"
                style={{ width: `${(done / PROV_SECTIONS.length) * 100}%` }}
              />
            </div>
            <Button
              variant={allReady ? "default" : "outline"}
              size="sm"
              disabled={!allReady || !!ro}
              className="mt-3 w-full justify-center"
              onClick={() => {
                toast.success(`${p.name} activated — Tenant Admin invited.`)
                onBack()
              }}
            >
              {allReady ? (
                <CheckCircle2Icon data-icon="inline-start" />
              ) : (
                <LockIcon data-icon="inline-start" />
              )}
              {allReady
                ? "Activate tenant"
                : `${PROV_SECTIONS.length - done} left to activate`}
            </Button>
            <p className="mt-2 text-[10.5px] leading-snug text-muted-foreground">
              {allReady
                ? "All checks passed. Activation provisions resources & sends the admin invite."
                : "All sections must be provisioned or tested before activation."}
            </p>
          </div>
        </div>

        {/* right panel */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/35 px-[18px] py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary [&>svg]:size-[17px]">
                <CurIcon />
              </span>
              <div>
                <h3 className="text-base font-semibold">{cur.l}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cur.desc}
                </p>
              </div>
            </div>
            <SectionStatusPill status={sec[active]} />
          </div>
          <div className="p-[18px]">
            {(remarksFor(active).length > 0 || isReviewer) && (
              <div className="mb-5 flex flex-col gap-3">
                {remarksFor(active).length > 0 && (
                  <div className="overflow-hidden rounded-xl border">
                    <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                      <FlagIcon className="size-3.5" />
                      Technical review remarks · {cur.l}
                      <span className="ml-auto">
                        {openFor(active) > 0 ? (
                          <span className="mono rounded-full bg-warning-subtle px-2 py-0.5 text-[10.5px] font-bold text-warning-subtle-foreground normal-case">
                            {openFor(active)} open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-success normal-case">
                            <CheckCircle2Icon className="size-3" />
                            All resolved
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="divide-y">
                      {remarksFor(active).map((r) => (
                        <RemarkCard
                          key={r.id}
                          r={r}
                          canResolve={canResolve}
                          onResolve={() => resolveRemark(r.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {isReviewer && (
                  <RemarkComposer sectionLabel={cur.l} onAdd={addRemark} />
                )}
              </div>
            )}
            {renderActive()}
          </div>
        </div>
      </div>
    </div>
  )
}
