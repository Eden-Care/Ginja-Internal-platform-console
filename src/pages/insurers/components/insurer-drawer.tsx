import * as React from "react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { TabBar } from "@/components/console/tab-bar"
import { Note } from "@/components/console/note"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  useDeactivateInsurer,
  useInsurerAudit,
  useInsurerProfile,
  useReactivateInsurer,
} from "@/features/insurers/use-insurers"
import type { AuditTone, Insurer } from "@/features/insurers/types"
import {
  CopyGlyph,
  InsurerAvatar,
  InsurerStatus,
  RegionPill,
} from "./shared"

/** Timeline dot tint per audit tone (hi-fi `.iar-dot.tone-*`). */
const AUD_TONE: Record<AuditTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}

const AUD_GLYPH: Record<AuditTone, string> = {
  success: "checkCircle",
  warning: "ban",
  neutral: "pencil",
}

/**
 * Insurer record drawer (hi-fi `InsurerDrawer`) — a right-side sheet bound to
 * `GET /platform/insurance-companies/{id}` (Overview) and `…/{id}/audit` (Audit
 * trail), with real Mark-Inactive / Reactivate mutations. Renders the clicked
 * list row instantly (placeholder) while the profile call refreshes it.
 */
export function InsurerDrawer({
  insurer,
  readonly,
  onClose,
  onEdit,
}: {
  insurer: Insurer | null
  readonly: boolean
  onClose: () => void
  onEdit: (insurer: Insurer) => void
}) {
  const open = !!insurer
  const accountId = insurer?.accountId ?? ""

  const profileQ = useInsurerProfile(accountId, {
    enabled: open,
    placeholder: insurer ?? undefined,
  })
  const auditQ = useInsurerAudit(accountId, { enabled: open })
  const deactivateMut = useDeactivateInsurer()
  const reactivateMut = useReactivateInsurer()

  const rec = profileQ.data ?? insurer
  const audit = auditQ.data ?? []

  const [tab, setTab] = React.useState<"overview" | "audit">("overview")
  const [confirm, setConfirm] = React.useState<
    "deactivate" | "activate" | null
  >(null)

  // Reset tab/confirm when a different insurer opens (during render).
  const [prevId, setPrevId] = React.useState(accountId)
  if (accountId !== prevId) {
    setPrevId(accountId)
    setTab("overview")
    setConfirm(null)
  }

  const doDeactivate = (reason?: string) => {
    if (!rec) return
    deactivateMut.mutate(
      { accountId: rec.accountId, reason: reason ?? "" },
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

  const doReactivate = () => {
    if (!rec) return
    reactivateMut.mutate(
      { accountId: rec.accountId },
      {
        onSuccess: () => {
          toast(`${rec.name} reactivated.`)
          setConfirm(null)
        },
        onError: (e) =>
          toast.error("Couldn’t reactivate", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  // Who/when for the Inactive banner — the latest deactivate audit entry.
  const deactEntry = audit.find((a) => a.title === "Marked Inactive")

  const rows: [string, React.ReactNode][] = rec
    ? [
        [
          "Account ID",
          <span className="mono inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
            {rec.accountId}
            <CopyGlyph value={rec.accountId} iconClass="size-[13px]" />
          </span>,
        ],
        ["Country", <RegionPill country={rec.country} />],
        ["Company type", rec.companyTypeLabel],
        ["City", rec.city],
        ["Regulator", rec.regulator],
        ["Licence number", <span className="mono">{rec.licence}</span>],
        ["Primary contact", rec.contactName],
        ["Contact email", <span className="mono">{rec.contactEmail}</span>],
        ["Contact phone", <span className="mono">{rec.contactPhone}</span>],
        ["Created", `${rec.created} · by ${rec.createdByName}`],
      ]
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 p-0 data-[side=right]:w-[560px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[560px] [&_svg]:[stroke-width:1.75]"
        >
          {rec ? (
            <>
              {/* Header + tabs */}
              <div className="shrink-0 px-[18px] pt-4">
                <div className="flex items-start gap-3">
                  <InsurerAvatar name={rec.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[9px]">
                      <SheetTitle className="min-w-0 truncate text-[17px] font-bold">
                        {rec.name}
                      </SheetTitle>
                      <span className="shrink-0">
                        <InsurerStatus status={rec.status} />
                      </span>
                    </div>
                    <div className="mt-[3px] flex items-center gap-[7px] text-[12px] text-muted-foreground">
                      <span className="mono">{rec.accountId}</span>
                      <span>
                        · {rec.companyTypeLabel} · {rec.country}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    title="Close"
                    className="grid size-[30px] shrink-0 place-items-center rounded-[8px] border border-input bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&>svg]:size-4"
                  >
                    <HiIcon name="x" />
                  </button>
                </div>
                <TabBar
                  className="mt-3.5"
                  value={tab}
                  onChange={(k) => setTab(k as "overview" | "audit")}
                  tabs={[
                    {
                      k: "overview",
                      label: "Overview",
                      icon: <HiIcon name="building" />,
                    },
                    {
                      k: "audit",
                      label: "Audit trail",
                      icon: <HiIcon name="fileText" />,
                      count: audit.length,
                    },
                  ]}
                />
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-[18px] py-4">
                {rec.status === "Inactive" ? (
                  <Note tone="warn" icon={<HiIcon name="ban" />} className="mb-4">
                    <b>Inactive.</b>
                    {deactEntry
                      ? ` Marked by ${deactEntry.by} on ${deactEntry.when}.`
                      : ""}{" "}
                    {rec.statusReason}
                  </Note>
                ) : null}

                {tab === "overview" ? (
                  <div className="flex flex-col">
                    {rows.map(([k, v]) => (
                      <div
                        key={k}
                        className="grid grid-cols-[150px_1fr] gap-3 border-b py-2.5 text-[13px] last:border-b-0"
                      >
                        <span className="text-[12px] text-muted-foreground">
                          {k}
                        </span>
                        <span className="min-w-0 text-foreground">{v}</span>
                      </div>
                    ))}
                  </div>
                ) : auditQ.isLoading ? (
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
                          <div className="text-[12.5px] font-semibold">
                            {a.title}
                          </div>
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
              </div>

              {/* Footer */}
              {!readonly ? (
                <div className="mt-auto flex shrink-0 items-center justify-between border-t px-[18px] py-3.5">
                  <Button
                    variant="outline"
                    className={hifiBtn}
                    onClick={() => onEdit(rec)}
                  >
                    <HiIcon name="pencil" />
                    Edit
                  </Button>
                  {rec.status === "Active" ? (
                    <Button
                      variant="outline"
                      className={hifiBtn}
                      disabled={deactivateMut.isPending}
                      onClick={() => setConfirm("deactivate")}
                    >
                      <HiIcon name="ban" />
                      Mark Inactive
                    </Button>
                  ) : (
                    <Button
                      className={hifiBtn}
                      disabled={reactivateMut.isPending}
                      onClick={() => setConfirm("activate")}
                    >
                      <HiIcon name="checkCircle" />
                      Reactivate
                    </Button>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirm === "deactivate"}
        icon={<HiIcon name="ban" />}
        tone="danger"
        title={`Mark ${rec?.name ?? ""} Inactive?`}
        body={
          <>
            <p>
              The insurer profile is preserved but flagged Inactive across the
              platform. It won't appear in active-only pickers and integrations
              may reject new references. You can reactivate it anytime.
            </p>
            <ImpactBox
              tone="danger"
              icon={<HiIcon name="info" />}
              heading="Recorded"
              items={[
                "Who marked it inactive (you) and when.",
                "The reason below, written to the audit trail.",
                "The profile and its account ID remain intact.",
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
        title={`Reactivate ${rec?.name ?? ""}?`}
        body={
          <p>
            The insurer becomes Active again and reappears across active-only
            pickers and integrations. This is recorded in the audit trail.
          </p>
        }
        confirmLabel="Reactivate"
        onConfirm={() => doReactivate()}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
