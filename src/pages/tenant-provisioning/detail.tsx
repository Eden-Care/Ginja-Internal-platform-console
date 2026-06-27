import * as React from "react"
import { Navigate, useParams } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  FlagIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { initials2 } from "@/lib/console-format"
import {
  PROV_SECTIONS,
  PROV_STATUS,
  type ProvConfig,
  type ProvRemark,
  type ProvRemarkSeverity,
  type ProvSectionKey,
  type ProvSectionStatus,
  type ProvTone,
} from "@/lib/console-data"
import { useAccess } from "@/contexts/access-context"
import { useMembers } from "@/features/access/use-members"
import {
  useAddRemark,
  useAssignProvisioning,
  useProvisioningDetail,
  useRemarks,
  useResolveRemark,
  useSaveSection,
  useTestSection,
} from "@/features/provisioning/use-provisioning"
import {
  PROV_STAGE_LABEL,
  PROV_STAGE_TONE,
  type ProvConfigStatus,
  type Provisioning,
  type ProvSectionCode,
  type Remark,
} from "@/features/provisioning/types"
import { SECTION_ICON, SectionStatusPill, TonePill } from "./components"
import { EngineerSelect, engineerOptions } from "./engineer-select"
import { RemarkCard, RemarkComposer } from "./remarks"
import {
  SecDatabase,
  SecDomains,
  SecEmail,
  SecMigration,
  SecSms,
} from "./sections"

/* --------------------------------------------------- mock ⇄ API mapping --- */

const SECTION_CODE: Record<ProvSectionKey, ProvSectionCode> = {
  database: "DATABASE",
  domains: "DOMAINS_SSL",
  sms: "SMS",
  email: "EMAIL",
  migration: "DATA_MIGRATION",
}
const CODE_TO_KEY: Record<string, ProvSectionKey> = {
  DATABASE: "database",
  DOMAINS_SSL: "domains",
  SMS: "sms",
  EMAIL: "email",
  DATA_MIGRATION: "migration",
}
const STATUS_TO_API: Record<ProvSectionStatus, ProvConfigStatus> = {
  todo: "NOT_STARTED",
  progress: "CONFIGURED",
  tested: "TESTED",
  done: "DONE",
  failed: "CONFIGURED",
}
const API_TO_STATUS: Record<string, ProvSectionStatus> = {
  NOT_STARTED: "todo",
  CONFIGURED: "progress",
  TESTED: "tested",
  DONE: "done",
}

const str = (v: unknown, fallback = "") =>
  typeof v === "string" ? v : v == null ? fallback : String(v)

/** Seed the mock config shape the section forms render from the API sections. */
function seedConfig(data: Provisioning): ProvConfig {
  const by = new Map(data.sections.map((s) => [s.section, s]))
  const cfg = (code: ProvSectionCode) =>
    (by.get(code)?.config ?? {}) as Record<string, unknown>
  const isDone = (code: ProvSectionCode) => by.get(code)?.status === "DONE"
  const isTested = (code: ProvSectionCode) =>
    by.get(code)?.status === "TESTED" || by.get(code)?.status === "DONE"

  const db = cfg("DATABASE")
  const dom = cfg("DOMAINS_SSL")
  const sms = cfg("SMS")
  const email = cfg("EMAIL")
  const mig = cfg("DATA_MIGRATION")

  return {
    database: {
      provider: str(db.provider, "rds"),
      region: str(db.region),
      providerName: str(db.provider_name),
      host: str(db.host),
      tested: isTested("DATABASE"),
      tables: isDone("DATABASE"),
    },
    domains: {
      subdomain: str(dom.subdomain, data.subdomain),
      custom: str(dom.custom_domain),
      cnameVerified: isDone("DOMAINS_SSL"),
      ssl: isDone("DOMAINS_SSL") ? "active" : "todo",
    },
    sms: {
      provider: str(sms.provider, "twilio"),
      senderId: str(sms.sender_id),
      tested: isTested("SMS"),
    },
    email: {
      provider: str(email.provider, "resend"),
      from: str(email.from_address),
      spf: isDone("EMAIL"),
      dkim: isDone("EMAIL"),
      tested: isTested("EMAIL"),
    },
    migration: {
      source: str(mig.source),
      status: isDone("DATA_MIGRATION") ? "done" : "todo",
      records: 0,
    },
  }
}

/** Seed the per-section status map from the API sections. */
function seedSec(data: Provisioning): Record<ProvSectionKey, ProvSectionStatus> {
  const by = new Map(data.sections.map((s) => [s.section, s]))
  const out = {} as Record<ProvSectionKey, ProvSectionStatus>
  for (const s of PROV_SECTIONS) {
    const api = by.get(SECTION_CODE[s.k])
    out[s.k] = api ? (API_TO_STATUS[str(api.status)] ?? "todo") : "todo"
  }
  return out
}

/** Serialize a section's editable config back to the API config object. Secrets
   for SMS/email aren't captured by the form, so they aren't sent (see banner). */
function serialize(key: ProvSectionKey, cfg: ProvConfig): Record<string, unknown> {
  switch (key) {
    case "database":
      return {
        provider: cfg.database.provider,
        region: cfg.database.region,
        provider_name: cfg.database.providerName,
        host: cfg.database.host,
      }
    case "domains":
      return {
        subdomain: cfg.domains.subdomain,
        custom_domain: cfg.domains.custom,
      }
    case "sms":
      return { provider: cfg.sms.provider, sender_id: cfg.sms.senderId }
    case "email":
      return { provider: cfg.email.provider, from_address: cfg.email.from }
    case "migration":
      return { source: cfg.migration.source }
  }
}

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

/* ------------------------------------------------------------- route page --- */

/**
 * Tenant-provisioning detail — a standalone, deep-linkable page at
 * `/tenant-provisioning/:tenantId`. It resolves the numeric tenant id from the
 * URL (so refresh / direct links work), then hands off to the loader gate;
 * "back" routes to the queue rather than toggling list state.
 */
export function ProvisioningDetailPage() {
  const { tenantId: tenantIdParam } = useParams<{ tenantId: string }>()
  const tenantId = Number(tenantIdParam)

  // A malformed id in the URL can't resolve to a record — bounce to the queue.
  if (!Number.isFinite(tenantId)) {
    return <Navigate to="/tenant-provisioning" replace />
  }

  return <ProvisioningDetail tenantId={tenantId} />
}

/* ----------------------------------------------------------------- gate --- */

/** Loads one tenant's provisioning detail + remark trail, then mounts the editor. */
export function ProvisioningDetail({ tenantId }: { tenantId: number }) {
  const detailQ = useProvisioningDetail(tenantId)
  const remarksQ = useRemarks(tenantId)

  if (detailQ.isLoading || remarksQ.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <BackBar />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  if (detailQ.isError || !detailQ.data) {
    return (
      <div className="flex flex-col gap-4">
        <BackBar />
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn&rsquo;t load this provisioning record.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => detailQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      </div>
    )
  }

  return (
    <ProvisioningEditor data={detailQ.data} remarks={remarksQ.data ?? []} />
  )
}

function BackBar() {
  return (
    <Breadcrumbs
      items={[
        { label: "Tenant provisioning", href: "/tenant-provisioning" },
        { label: "Detail" },
      ]}
    />
  )
}

/* --------------------------------------------------------------- editor --- */

function ProvisioningEditor({
  data,
  remarks,
}: {
  data: Provisioning
  remarks: Remark[]
}) {
  const { role, roleKey, isReadonly } = useAccess()
  const tenantId = data.tenantId

  // The members roster is admin-only; only admins need it (name resolution +
  // the assign picker). Non-admins skip it (names fall back to the raw id).
  const isAdmin = roleKey === "platform_admin"
  const membersQ = useMembers({}, isAdmin)
  const members = membersQ.data?.items ?? []
  const memberName = (id: string | null) =>
    (id && members.find((m) => m.email.toLowerCase() === id.toLowerCase())?.name) ||
    id ||
    "—"

  const engineers = engineerOptions(members)

  const [active, setActive] = React.useState<ProvSectionKey>("database")
  const [cfg, setCfg] = React.useState<ProvConfig>(() => seedConfig(data))
  const [sec, setSec] = React.useState(() => seedSec(data))

  const saveMut = useSaveSection()
  const addRemarkMut = useAddRemark()
  const resolveMut = useResolveRemark()
  const assignMut = useAssignProvisioning()
  const testMut = useTestSection()

  const assignEngineer = (email: string) =>
    assignMut.mutate(
      { tenantId, assignee: email },
      {
        onSuccess: () => toast.success(`Assigned to ${memberName(email)}.`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn’t assign engineer."),
      }
    )

  // Maker / checker split: admins & engineers configure (makers); approvers and
  // technical reviewers review — view-only on config, can leave remarks.
  const isReviewer = role.techReviewer || role.checker
  const readonly = isReadonly("provisioning")
  const ro: boolean | string = isReviewer
    ? "You have view-only access as a reviewer — leave remarks below to flag issues for the engineer."
    : readonly
  const canResolve = !readonly && !isReviewer

  /** Run the real section test (POST …/sections/{section}/test) — wired to each
     section's in-form test button. The backend requires a section to be
     configured before it can be tested, so we persist the current config
     (PUT …/sections/{section}, status CONFIGURED) first, then run the test —
     which marks the section DONE on success. */
  const runTest = async (key: ProvSectionKey): Promise<boolean> => {
    try {
      await saveMut.mutateAsync({
        tenantId,
        section: SECTION_CODE[key],
        body: { config: serialize(key, cfg), status: "CONFIGURED" },
      })
      await testMut.mutateAsync({ tenantId, section: SECTION_CODE[key] })
      setSec((s) => ({ ...s, [key]: "done" }))
      toast.success("Test complete.")
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed.")
      return false
    }
  }

  // Remarks come live from the API; map to the shape the cards render.
  const mockRemarks: ProvRemark[] = remarks.map((r) => {
    const name = memberName(r.author)
    return {
      id: r.id,
      section: CODE_TO_KEY[str(r.section)] ?? "database",
      by: name,
      initials: initials2(name),
      when: r.createdAt
        ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })
        : "—",
      severity: r.severity === "INFO" ? "note" : "action",
      status: r.status === "RESOLVED" ? "resolved" : "open",
      text: r.body,
    }
  })

  const persist = (key: ProvSectionKey, st: ProvSectionStatus) => {
    setSec((s) => ({ ...s, [key]: st }))
    const label = PROV_SECTIONS.find((s) => s.k === key)?.l ?? "Section"
    saveMut.mutate(
      {
        tenantId,
        section: SECTION_CODE[key],
        body: { config: serialize(key, cfg), status: STATUS_TO_API[st] },
      },
      {
        onSuccess: () => toast.success(`${label} saved.`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn’t save section."),
      }
    )
  }

  const resolveRemark = (id: string) =>
    resolveMut.mutate(
      { tenantId, remarkId: id },
      {
        onSuccess: () => toast.success("Remark marked resolved."),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn’t resolve remark."),
      }
    )

  const addRemark = (text: string, severity: ProvRemarkSeverity) =>
    addRemarkMut.mutate(
      {
        tenantId,
        section: SECTION_CODE[active],
        body: { body: text, severity: severity === "note" ? "INFO" : "ACTION" },
      },
      {
        onSuccess: () =>
          toast(`Remark added on ${cur.l} — the engineer will be notified.`),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Couldn’t add remark."),
      }
    )

  const openRemarks = mockRemarks.filter((r) => r.status === "open")
  const remarksFor = (k: ProvSectionKey) => mockRemarks.filter((r) => r.section === k)
  const openFor = (k: ProvSectionKey) =>
    mockRemarks.filter((r) => r.section === k && r.status === "open").length

  const allReady = data.stage === "READY_TO_ACTIVATE"
  const engName = data.assignee ? memberName(data.assignee) : null
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
            mark={(st) => persist("database", st)}
            onTest={() => runTest("database")}
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
            mark={(st) => persist("domains", st)}
            onTest={() => runTest("domains")}
            ro={ro}
          />
        )
      case "sms":
        return (
          <SecSms
            cfg={cfg.sms}
            set={(patch) => setCfg((c) => ({ ...c, sms: { ...c.sms, ...patch } }))}
            mark={(st) => persist("sms", st)}
            onTest={() => runTest("sms")}
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
            mark={(st) => persist("email", st)}
            onTest={() => runTest("email")}
            ro={ro}
          />
        )
      case "migration":
        return (
          <SecMigration
            cfg={cfg.migration}
            set={(patch) =>
              setCfg((c) => ({ ...c, migration: { ...c.migration, ...patch } }))
            }
            mark={(st) => persist("migration", st)}
            ro={ro}
          />
        )
    }
  }

  return (
    <div className="flex flex-col">
      <BackBar />

      {/* record header */}
      <div className="flex items-start gap-4 pt-2 pb-5">
        <span className="grid size-[52px] shrink-0 place-items-center rounded-[13px] border border-primary/20 bg-primary/10 text-[19px] font-bold text-primary">
          {data.legalEntityName.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold">{data.legalEntityName}</h2>
            <TonePill tone={PROV_STAGE_TONE[data.stage]}>
              {PROV_STAGE_LABEL[data.stage]}
            </TonePill>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="mono text-xs text-muted-foreground">
              {data.tenantCode}
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              {data.subdomain ? `${data.subdomain}.ginja.ai` : "subdomain pending"}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[11px] text-muted-foreground">Lead engineer</span>
          <div className="mt-1 flex items-center justify-end gap-2">
            {isAdmin ? (
              <EngineerSelect
                value={data.assignee}
                engineers={engineers}
                onAssign={assignEngineer}
                disabled={assignMut.isPending}
                trigger={
                  <button
                    type="button"
                    className="flex w-[200px] items-center gap-2 rounded-[9px] border border-input bg-card px-2.5 py-1.5 transition-colors hover:border-primary/50"
                  >
                    {engName ? (
                      <>
                        <AssigneeAvatar name={engName} size="sm" />
                        <b className="truncate text-[12.5px]">{engName}</b>
                      </>
                    ) : (
                      <span className="text-[12.5px] text-muted-foreground">
                        Assign engineer
                      </span>
                    )}
                    <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                  </button>
                }
              />
            ) : engName ? (
              <>
                <AssigneeAvatar name={engName} size="sm" />
                <b className="text-[12.5px]">{engName}</b>
              </>
            ) : (
              <b className="text-[12.5px] text-muted-foreground">Unassigned</b>
            )}
          </div>
        </div>
      </div>

      {/* backend-pending disclosure */}
      <Note tone="info" icon={<InfoIcon />} className="mb-4">
        <b>Section tests and technical-review remarks are live.</b> Save persists
        each section&rsquo;s settings &amp; status. Schema provisioning, CNAME/TLS,
        SPF/DKIM, data-migration progress and credential storage are simulated and{" "}
        <b>backend-pending</b>. <b>Activate tenant</b> is pending backend (the
        provisioning API must return the payer id, and initial go-live currently
        runs through the Approvals approval).
      </Note>

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
                {data.sectionsDone}/{data.sectionsTotal || PROV_SECTIONS.length}
              </span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-[width]"
                style={{
                  width: `${(data.sectionsDone / (data.sectionsTotal || PROV_SECTIONS.length)) * 100}%`,
                }}
              />
            </div>
            <Button
              variant={allReady ? "default" : "outline"}
              size="sm"
              disabled
              className="mt-3 w-full justify-center"
              title="Activation is backend-pending — needs the payer id from the provisioning API; initial go-live currently runs through Approvals."
            >
              {allReady ? (
                <>
                  <CheckCircle2Icon data-icon="inline-start" />
                  Activate tenant
                </>
              ) : (
                `${(data.sectionsTotal || PROV_SECTIONS.length) - data.sectionsDone} left to activate`
              )}
            </Button>
            <p className="mt-2 text-[10.5px] leading-snug text-muted-foreground">
              {allReady
                ? "All sections ready. Activate tenant is backend-pending; for now go-live runs through the Approvals queue."
                : "All sections must be provisioned or tested before the tenant can be activated."}
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
                <p className="mt-0.5 text-xs text-muted-foreground">{cur.desc}</p>
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
