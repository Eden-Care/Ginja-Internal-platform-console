import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { TabBar } from "@/components/console/tab-bar"
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
import type { SpAuditTone } from "@/features/service-providers/types"
import { BackLink, CopyGlyph, SpAvatar, SpStatus } from "./shared"

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

function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2.5 text-[13px] last:border-b-0">
      <span className="shrink-0 text-[12px] text-muted-foreground">{k}</span>
      <span className="min-w-0 text-right text-foreground">{v}</span>
    </div>
  )
}

/**
 * Service-provider record (hi-fi `ProviderDrawer`, rendered as a full page),
 * bound to `GET /platform/service-providers/{code}` + `…/audit`, with real
 * Approve / Mark-Inactive / Reactivate mutations. The "Insurers" tab is kept
 * but shows a pending-backend state — the provider⇆insurer directory-sync has
 * no endpoint yet.
 */
export function ProviderRecord({
  code,
  readonly,
  onClose,
}: {
  code: string
  readonly: boolean
  onClose: () => void
}) {
  const profileQ = useServiceProvider(code)
  const auditQ = useProviderAudit(code)
  const deactivateMut = useDeactivateProvider()
  const reactivateMut = useReactivateProvider()
  const approveMut = useApproveProvider()

  const rec = profileQ.data
  const audit = auditQ.data ?? []

  const [tab, setTab] = React.useState("overview")
  const [confirm, setConfirm] = React.useState<"activate" | "deactivate" | null>(
    null
  )

  const busy =
    deactivateMut.isPending || reactivateMut.isPending || approveMut.isPending

  if (profileQ.isLoading && !rec) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink label="All providers" onClick={onClose} />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  if (profileQ.isError || !rec) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink label="All providers" onClick={onClose} />
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

  const integrationTone =
    rec.integration === "Done"
      ? "success"
      : rec.integration === "In progress"
        ? "warning"
        : "neutral"

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
    [
      "Claims / month",
      rec.claimsMonth ? Number(rec.claimsMonth).toLocaleString() : "—",
    ],
    [
      "Integration",
      rec.integration && rec.integration !== "—" ? (
        <MiniBadge tone={integrationTone}>{rec.integration}</MiniBadge>
      ) : (
        "—"
      ),
    ],
    ["Registration", <span className="mono">{rec.reg}</span>],
    ["KRA PIN", <span className="mono">{rec.kra}</span>],
    [
      "SHIF / SHA",
      rec.shif !== "—" ? (
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

  // Who/when for the Inactive banner — the latest deactivation audit entry.
  const deactEntry = audit.find((a) => /deactivat|inactive/i.test(a.action))

  return (
    <div className="flex flex-col gap-4">
      <BackLink label="All providers" onClick={onClose} />

      {/* Record head */}
      <div className="flex items-start gap-4">
        <SpAvatar name={rec.name} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">
              {rec.name}
            </h1>
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
        {!readonly &&
        (rec.status === "Inactive" || rec.status === "Pending review") ? (
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

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { k: "overview", label: "Overview", icon: <HiIcon name="hospital" /> },
          { k: "services", label: "Services", icon: <HiIcon name="layers" /> },
          { k: "insurers", label: "Insurers", icon: <HiIcon name="shield" /> },
          {
            k: "audit",
            label: "Audit trail",
            icon: <HiIcon name="fileText" />,
            count: audit.length,
          },
        ]}
      />

      {tab === "overview" ? (
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
      ) : null}

      {tab === "services" ? (
        <Panel>
          <PanelHead
            icon={<HiIcon name="layers" />}
            title="Clinical services offered"
          />
          <PanelBody>
            {rec.services.length ? (
              <div className="flex flex-wrap gap-2">
                {rec.services.map((s) => (
                  <MiniBadge key={s} tone="success">
                    <HiIcon name="check" className="size-[11px]" />
                    {s}
                  </MiniBadge>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No services recorded.
              </p>
            )}
          </PanelBody>
        </Panel>
      ) : null}

      {tab === "insurers" ? (
        <Panel>
          <PanelHead icon={<HiIcon name="shield" />} title="Linked insurers" />
          <PanelBody>
            <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-input bg-muted/30 px-6 py-12 text-center">
              <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground shadow-xs [&>svg]:size-[22px]">
                <HiIcon name="shield" />
              </span>
              <p className="max-w-[52ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                <b>Insurer links are pending backend integration.</b>
                <br />
                The provider⇆insurer directory sync (contracts, policyholders &
                claim rules per insurer) isn’t exposed by the API yet — this tab
                will populate once that endpoint ships.
              </p>
              <MiniBadge tone="info">Pending backend</MiniBadge>
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      {tab === "audit" ? (
        <Panel>
          <PanelHead icon={<HiIcon name="fileText" />} title="Audit trail" />
          <PanelBody>
            {auditQ.isLoading ? (
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
                  <div
                    key={a.id}
                    className="flex gap-[11px] border-b py-[11px] last:border-b-0"
                  >
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
      ) : null}

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
