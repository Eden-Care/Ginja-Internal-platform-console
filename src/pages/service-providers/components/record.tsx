import * as React from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  useApproveProvider,
  useDeactivateProvider,
  useProviderAudit,
  useReactivateProvider,
  useServiceProvider,
} from "@/features/service-providers/use-service-providers"
import type {
  ServiceProvider,
  SpAuditEntry,
  SpAuditTone,
} from "@/features/service-providers/types"
import { useActiveInsurers } from "@/features/insurers/use-insurers"
import { useExtractionsOverview } from "@/features/rule-extraction/use-rule-extraction"
import {
  EXTRACT_REVIEW_LABEL,
  EXTRACT_REVIEW_TONE,
  EXTRACT_STATUS_TONE,
  type ExtractionSummary,
} from "@/features/rule-extraction/types"
import { CopyGlyph, DetailRow, SpAvatar, SpStatus, spInitials } from "./shared"

const SP_ROOT = "/service-providers"

const AUD_TONE: Record<SpAuditTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}
const AUD_GLYPH: Record<SpAuditTone, string> = {
  success: "checkCircle",
  warning: "ban",
  neutral: "pencil",
}

/**
 * Service-provider record as a SINGLE PAGE (no tabs) — the migration of the
 * experiment prototype to live data. Profile + services (onboarding-captured)
 * live in one collapsible card; the insurer list — the operational content —
 * sits below it and links out to each insurer's rule-review cockpit
 * (`/service-providers/:code/insurers/:id`); the audit trail fills the rail.
 * Bound to `GET /platform/service-providers/{code}` (+ `…/audit`) with real
 * Approve / Mark-Inactive / Reactivate mutations.
 */
export function ProviderRecord({
  code,
  readonly,
}: {
  /** URL `:code` segment (draft or account id) — the API key + link base. */
  code: string
  readonly: boolean
}) {
  const profileQ = useServiceProvider(code)
  const auditQ = useProviderAudit(code)
  const deactivateMut = useDeactivateProvider()
  const reactivateMut = useReactivateProvider()
  const approveMut = useApproveProvider()

  const rec = profileQ.data
  const audit = auditQ.data ?? []

  const [confirm, setConfirm] = React.useState<"activate" | "deactivate" | null>(
    null
  )

  const busy =
    deactivateMut.isPending || reactivateMut.isPending || approveMut.isPending

  if (profileQ.isLoading && !rec) {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "Service providers", href: SP_ROOT }, { label: "…" }]} />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  if (profileQ.isError || !rec) {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "Service providers", href: SP_ROOT }, { label: "…" }]} />
        <Note tone="err" icon={<HiIcon name="alert" />}>
          Couldn’t load this provider.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => profileQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      </div>
    )
  }

  const doDeactivate = (reason?: string) => {
    deactivateMut.mutate(
      { code: rec.code, reason: reason ?? "" },
      {
        onSuccess: () => {
          toast(`${rec.name} marked Inactive.`)
          setConfirm(null)
        },
        onError: (e) =>
          toast.error("Couldn’t mark inactive", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }
  const doActivate = () => {
    const mut = rec.status === "Pending review" ? approveMut : reactivateMut
    mut.mutate(
      { code: rec.code },
      {
        onSuccess: () => {
          toast(
            rec.status === "Pending review"
              ? `${rec.name} approved & activated.`
              : `${rec.name} activated.`
          )
          setConfirm(null)
        },
        onError: (e) =>
          toast.error("Couldn’t activate", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  // Who/when for the Inactive banner — the latest deactivation audit entry.
  const deactEntry = audit.find((a) => /deactivat|inactive/i.test(a.action))

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[{ label: "Service providers", href: SP_ROOT }, { label: rec.name }]}
      />

      {/* Record head */}
      <div className="flex items-start gap-4">
        <SpAvatar name={rec.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">{rec.name}</h1>
            <SpStatus status={rec.status} />
          </div>
          <div className="mt-[5px] flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="mono">{rec.displayId}</span>
            <span>
              · {rec.type} · {rec.tier}
            </span>
            <span className="inline-flex items-center gap-[5px] rounded-[6px] bg-muted px-[7px] py-0.5 text-[11px] [&>svg]:size-[11px]">
              <HiIcon name="mapPin" />
              {rec.town}, {rec.county}
            </span>
          </div>
        </div>
        {!readonly && rec.status === "Active" ? (
          <Button
            variant="outline"
            className={hifiBtn}
            disabled={busy}
            onClick={() => setConfirm("deactivate")}
          >
            <HiIcon name="ban" />
            Mark Inactive
          </Button>
        ) : null}
        {!readonly && (rec.status === "Inactive" || rec.status === "Pending review") ? (
          <Button
            className={hifiBtn}
            disabled={busy}
            onClick={() => setConfirm("activate")}
          >
            <HiIcon name="checkCircle" />
            {rec.status === "Pending review" ? "Approve & activate" : "Activate"}
          </Button>
        ) : null}
      </div>

      {rec.status === "Pending review" ? (
        <Note tone="warn" icon={<HiIcon name="clock" />}>
          <b>Pending review.</b> Submitted {rec.submittedAt ?? rec.created} by{" "}
          {rec.createdBy}. Approve to make this provider live.
        </Note>
      ) : null}
      {rec.status === "Inactive" ? (
        <Note tone="warn" icon={<HiIcon name="ban" />}>
          <b>Inactive.</b>
          {deactEntry ? ` Marked by ${deactEntry.by} on ${deactEntry.when}.` : ""}{" "}
          {rec.statusReason}
        </Note>
      ) : null}

      {/* single-page body: profile + insurers (main) · audit (rail) */}
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <ProfileCard rec={rec} />
          <InsurersSection rec={rec} linkBase={code} />
        </div>
        <aside className="lg:col-span-3 lg:self-start">
          <AuditRail audit={audit} loading={auditQ.isLoading} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === "deactivate"}
        icon={<HiIcon name="ban" />}
        tone="danger"
        title={`Mark ${rec.name} Inactive?`}
        body={
          <>
            <p>
              The provider profile is preserved but flagged Inactive. New claim
              submissions from this facility will be rejected until it is
              reactivated. The account ID stays intact.
            </p>
            <ImpactBox
              tone="danger"
              icon={<HiIcon name="info" />}
              heading="Recorded"
              items={[
                "Who marked it inactive (you) and when.",
                "The reason below, written to the audit trail.",
                "Existing cleaned claims are unaffected.",
              ]}
            />
          </>
        }
        reasonRequired
        reasonLabel="Reason for deactivation"
        confirmLabel="Mark Inactive"
        onConfirm={doDeactivate}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "activate"}
        icon={<HiIcon name="checkCircle" />}
        tone="primary"
        title={`${rec.status === "Pending review" ? "Approve" : "Activate"} ${rec.name}?`}
        body={
          <p>
            {rec.status === "Pending review"
              ? "Approving activates the provider for Claim Clean-up (all review sections must be cleared with no open remarks). "
              : "Reactivate this provider. "}
            It can then submit claims through Claim Clean-up. This is recorded in
            the audit trail with your name.
          </p>
        }
        confirmLabel={
          rec.status === "Pending review" ? "Approve & activate" : "Activate"
        }
        onConfirm={doActivate}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

/* ------------------------------------------------- profile + services card */

function ProfileCard({ rec }: { rec: ServiceProvider }) {
  // Reference detail — collapsed by default; expand for the full record.
  const [open, setOpen] = React.useState(false)

  const integrationTone =
    rec.integration === "Done"
      ? "success"
      : rec.integration === "In progress"
        ? "warning"
        : "neutral"

  const integrationBadge =
    rec.integration && rec.integration !== "—" ? (
      <MiniBadge tone={integrationTone}>{rec.integration}</MiniBadge>
    ) : (
      "—"
    )

  const claimsMonth =
    rec.claimsMonth != null ? Number(rec.claimsMonth).toLocaleString() : "—"

  const rows: [string, React.ReactNode][] = [
    [
      "Account ID",
      <span className="mono inline-flex items-center gap-1.5 font-semibold">
        {rec.displayId}
        <CopyGlyph value={rec.displayId} iconClass="size-[13px]" />
      </span>,
    ],
    ["Provider type", rec.type],
    ["Classification", rec.cls],
    ["Tier", rec.tier],
    ["Ownership", rec.ownership],
    ["Location", `${rec.town}, ${rec.county}, ${rec.country}`],
    ["HIMS", rec.hims],
    ["Claims / month", claimsMonth],
    ["Integration", integrationBadge],
    ["Registration", <span className="mono">{rec.reg}</span>],
    ["KRA PIN", <span className="mono">{rec.kra}</span>],
    [
      "SHIF / SHA",
      rec.shif && rec.shif !== "—" ? (
        <span className="mono">{rec.shif}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    ],
    ["Primary contact", `${rec.contact} · ${rec.role}`],
    ["Email", <span className="mono">{rec.email}</span>],
    ["Phone", <span className="mono">{rec.phone}</span>],
    ["Created", `${rec.created} · by ${rec.createdBy}`],
    [
      "Approved",
      rec.approvedBy ? (
        `${rec.approvedOn} · by ${rec.approvedBy}`
      ) : (
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
            <MiniFact label="Claims / month" value={claimsMonth} />
          </div>
        )}

        <div className="mt-4 border-t pt-4">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase [&>svg]:size-3.5">
            <HiIcon name="layers" />
            Clinical services offered
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

/** Per-insurer extraction, preferring the row the backend marks `current`. */
const forInsurer = (overview: ExtractionSummary[], accountId: string) =>
  overview.find((x) => x.insurerAccountId === accountId && x.current) ??
  overview.find((x) => x.insurerAccountId === accountId)

function InsurersSection({
  rec,
  linkBase,
}: {
  rec: ServiceProvider
  /** URL `:code` segment used for the cockpit links (kept consistent w/ record). */
  linkBase: string
}) {
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<InsFilter>("All")

  const dirQ = useActiveInsurers()
  const ovQ = useExtractionsOverview(rec.displayId)
  const insurers = dirQ.data ?? []
  const overview = ovQ.data ?? []

  const items = insurers.map((ins) => ({
    ins,
    x: forInsurer(overview, ins.accountId),
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
    if (q.trim() && !ins.name.toLowerCase().includes(q.trim().toLowerCase()))
      return false
    return true
  })

  const base = `${SP_ROOT}/${encodeURIComponent(linkBase)}/insurers`

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
        {dirQ.isLoading || ovQ.isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : dirQ.isError ? (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              Couldn’t load the insurer directory.{" "}
              <button
                className="font-semibold text-primary underline underline-offset-2"
                onClick={() => {
                  void dirQ.refetch()
                  void ovQ.refetch()
                }}
              >
                Try again
              </button>
              .
            </p>
          </div>
        ) : insurers.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed bg-muted/25 px-6 py-10 text-center">
            <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
              <HiIcon name="shield" />
            </span>
            <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:text-foreground">
              <b>No active insurers in the directory yet.</b>
              <br />
              Onboard insurers first — contracts are uploaded per provider ⇆ insurer
              pair.
            </p>
          </div>
        ) : (
          <>
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
                  to={`${base}/${encodeURIComponent(ins.accountId)}`}
                  className="-mx-4 flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-[12px] font-bold text-primary">
                    {spInitials(ins.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold">{ins.name}</span>
                      {x ? (
                        <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>
                          {x.status === "COMPLETED" ? "Contract extracted" : x.status}
                        </MiniBadge>
                      ) : (
                        <MiniBadge tone="neutral">No contract</MiniBadge>
                      )}
                      {x && x.reviewStatus !== "UNASSIGNED" ? (
                        <MiniBadge tone={EXTRACT_REVIEW_TONE[x.reviewStatus]}>
                          {EXTRACT_REVIEW_LABEL[x.reviewStatus]}
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
                        {x ? x.ruleCount : 0}
                      </b>
                      <span className="text-[10px] text-muted-foreground">rules</span>
                    </div>
                    <HiIcon
                      name="chevronRight"
                      className="size-4 self-center text-muted-foreground"
                    />
                  </div>
                </Link>
              ))}
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-muted-foreground">
                  No insurers match.
                </div>
              ) : null}
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  )
}

/* ------------------------------------------------------------- audit rail */

function AuditRail({
  audit,
  loading,
}: {
  audit: SpAuditEntry[]
  loading: boolean
}) {
  return (
    <Panel>
      <PanelHead
        icon={<HiIcon name="fileText" />}
        title="Audit trail"
        action={
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {audit.length}
          </span>
        }
      />
      <PanelBody className="max-h-[70vh] overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : audit.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No audit entries yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {audit.map((a) => (
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
        )}
      </PanelBody>
    </Panel>
  )
}
