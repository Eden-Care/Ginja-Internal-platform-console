import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import {
  ArchiveIcon,
  BanIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  HistoryIcon,
  InfoIcon,
  LayersIcon,
  Loader2Icon,
  LockIcon,
  PlayIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { StatusPill } from "@/components/console/status-pill"
import { LoadingSpinner } from "@/components/common/loading"
import { fetchDocumentDownload, replaceDocument } from "@/features/payers/api"
import { payerKeys } from "@/features/payers/queries"
import { usePayerActivity } from "@/features/payers/use-payer-record"
import type {
  EntitlementDTO,
  LifecycleRequest,
  PayerDTO,
  SubscriptionDTO,
  SuspendReason,
  TenantDTO,
} from "@/features/payers/types"

const PAYER_TYPE_LABEL: Record<string, string> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}

/* ----------------------------------------------------- small layouts --- */

/** Key/value grid (mirrors the v3 meta-grid). */
function MetaGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] text-muted-foreground">{k}</div>
          <div className="mt-0.5 text-[13px]">{v || "—"}</div>
        </div>
      ))}
    </div>
  )
}

/** Stacked label/value rows inside a panel (v3 kv-row). */
function KvRows({
  rows,
}: {
  rows: [string, React.ReactNode, React.ReactNode?][]
}) {
  return (
    <div className="flex flex-col">
      {rows.map(([k, v, tail], i) => (
        <div
          key={k}
          className={cn(
            "flex items-center justify-between gap-4 py-2.5 text-[13px]",
            i > 0 && "border-t"
          )}
        >
          <span className="text-muted-foreground">{k}</span>
          <span className="flex items-center gap-1.5 text-right">
            {v || "—"}
            {tail}
          </span>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------- Overview --- */

export function RecOverview({
  dto,
  primary,
}: {
  dto: PayerDTO
  primary: TenantDTO | undefined
}) {
  const enabled = (dto.entitlements ?? []).filter((e) => e.enabled)
  const secondaries = (dto.tenants ?? []).filter((t) => !t.primary).length
  const sub = dto.subscription
  const structure =
    sub?.pricing_structure_name ??
    sub?.structure_name ??
    sub?.pricing_snapshot?.name ??
    "—"

  return (
    <div className="flex flex-col gap-3.5">
      <Panel>
        <PanelBody>
          <MetaGrid
            items={[
              ["Tenant type", PAYER_TYPE_LABEL[dto.payer_type] ?? dto.payer_type],
              ["Secondary tenants", String(secondaries)],
              ["Modules enabled", String(enabled.length)],
              ["Data residency", primary?.data_residency_region ?? "—"],
              ["Country of operation", primary?.country ?? "—"],
              ["Subscription", structure],
            ]}
          />
        </PanelBody>
      </Panel>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHead title="Organisation details" />
          <PanelBody className="py-1">
            <KvRows
              rows={[
                ["Legal entity name", primary?.legal_entity_name],
                ["Trading name", primary?.trading_name],
                ["Tax / VAT number", primary?.tax_vat_number],
                ["Primary contact", primary?.primary_contact_name],
                ["Contact email", primary?.primary_contact_email],
                [
                  "Website",
                  primary?.website,
                ],
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHead title="Bank account" />
          <PanelBody>
            <Note tone="info" icon={<LockIcon />} className="text-[12px]">
              Bank details are <b>write-only / encrypted</b> and aren&rsquo;t
              returned by the API — not shown here.{" "}
              <span className="text-muted-foreground">(backend pending)</span>
            </Note>
          </PanelBody>
        </Panel>
      </div>

      <Note tone="info" icon={<InfoIcon />} className="text-[11.5px]">
        <b>Members covered</b> and <b>monthly recurring revenue</b> aren&rsquo;t
        returned by the API yet — omitted here (backend pending).
      </Note>
    </div>
  )
}

/* --------------------------------------------------------- Tenants --- */

function TenantNode({ t, isPrimary }: { t: TenantDTO; isPrimary?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-4 py-3",
        isPrimary && "border-primary/40 bg-primary/[0.03]"
      )}
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <LayersIcon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          {t.legal_entity_name}
          {isPrimary && <Tagpill className="text-[10px]">Primary</Tagpill>}
        </div>
        <div className="mono mt-0.5 text-[11.5px] text-muted-foreground">
          {t.subdomain ? `${t.subdomain}.ginja.ai · ` : ""}
          {t.data_residency_region ?? t.country ?? ""} · {t.tenant_code}
        </div>
      </div>
      <StatusPill status={t.status} />
    </div>
  )
}

export function RecTenants({
  primary,
  secondaries,
  actAllowed,
  lockTip,
}: {
  primary: TenantDTO | undefined
  secondaries: TenantDTO[]
  actAllowed: boolean
  lockTip: string
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Tenant hierarchy</div>
          <div className="text-[12.5px] text-muted-foreground">
            Primary is the contracting entity. Secondary tenants share billing but
            run isolated environments.
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!actAllowed}
          title={
            actAllowed
              ? "Adding a secondary tenant is only supported on a DRAFT payer (backend pending for active accounts)"
              : lockTip
          }
        >
          Add secondary
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        {primary && <TenantNode t={primary} isPrimary />}
        {secondaries.map((t) => (
          <TenantNode key={t.id} t={t} />
        ))}
        {secondaries.length === 0 && (
          <Note tone="info" icon={<InfoIcon />}>
            No secondary tenants. Branches or subsidiaries that share this
            tenant&rsquo;s commercial arrangement would appear here.
          </Note>
        )}
      </div>

      <Note tone="info" icon={<InfoIcon />} className="text-[11.5px]">
        Adding secondary tenants / editing tenant details is restricted to{" "}
        <b>DRAFT</b> payers by the API — for an active account this is{" "}
        <span className="text-muted-foreground">backend pending</span>.
      </Note>
    </div>
  )
}

/* ---------------------------------------------------- Entitlements --- */

export function RecEntitlements({
  entitlements,
  actAllowed,
  lockTip,
}: {
  entitlements: EntitlementDTO[]
  actAllowed: boolean
  lockTip: string
}) {
  // Group enabled entitlements by module → its enabled sub-module codes.
  const groups = React.useMemo(() => {
    const m = new Map<string, string[]>()
    for (const e of entitlements.filter((x) => x.enabled)) {
      const subs = m.get(e.module_code) ?? []
      if (e.submodule_code) subs.push(e.submodule_code)
      m.set(e.module_code, subs)
    }
    return Array.from(m.entries())
  }, [entitlements])

  return (
    <div className="flex flex-col gap-3.5">
      <Note tone="info" icon={<InfoIcon />}>
        Entitlements apply to the primary tenant <b>and all secondary tenants</b>.
      </Note>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {groups.length} module{groups.length === 1 ? "" : "s"} enabled
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!actAllowed}
          title={lockTip || undefined}
        >
          Edit entitlements
        </Button>
      </div>

      {groups.length === 0 ? (
        <Note tone="info" icon={<InfoIcon />}>
          No module entitlements set on this account.
        </Note>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {groups.map(([code, subs]) => (
            <Panel key={code} className="overflow-hidden">
              <PanelBody className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <LayersIcon className="size-[18px]" />
                  </div>
                  <div className="mono flex-1 text-[13px] font-semibold">
                    {code}
                  </div>
                  <MiniBadge tone="success">On</MiniBadge>
                </div>
                {subs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {subs.map((s) => (
                      <Tagpill key={s} className="mono text-[10.5px]">
                        {s}
                      </Tagpill>
                    ))}
                  </div>
                )}
              </PanelBody>
            </Panel>
          ))}
        </div>
      )}

      <Note tone="info" icon={<InfoIcon />} className="text-[11.5px]">
        Module display names, versions and sub-module catalogues come from the
        Module registry — the entitlement payload carries codes only (registry
        join <span className="text-muted-foreground">backend pending</span>).
      </Note>
    </div>
  )
}

/* ----------------------------------------------------------- Billing --- */

export function RecBilling({
  subscription,
  onOpenPricing,
}: {
  subscription: SubscriptionDTO | undefined
  onOpenPricing: () => void
}) {
  const sub = subscription
  const fmtDate = (iso?: string | null) =>
    iso ? format(new Date(iso), "dd MMM yyyy") : "—"
  const structure =
    sub?.pricing_structure_name ??
    sub?.structure_name ??
    sub?.pricing_snapshot?.name ??
    "—"

  return (
    <div className="flex flex-col gap-3.5">
      <Panel className="overflow-hidden">
        <PanelHead
          title="Subscription"
          action={
            <Button variant="ghost" size="sm" onClick={onOpenPricing}>
              Pricing library
              <ExternalLinkIcon data-icon="inline-end" />
            </Button>
          }
        />
        <PanelBody className="py-1">
          {sub ? (
            <KvRows
              rows={[
                ["Pricing structure", structure],
                ["Model", sub.subscription_model ?? "—"],
                ["Billing frequency", sub.billing_frequency ?? "—"],
                ["Contract start", fmtDate(sub.contract_start)],
                ["Contract end", fmtDate(sub.contract_end)],
                [
                  "Discount",
                  sub.discount_pct != null ? `${sub.discount_pct}%` : "—",
                ],
              ]}
            />
          ) : (
            <Note tone="info" icon={<InfoIcon />}>
              No subscription set on this account.
            </Note>
          )}
        </PanelBody>
      </Panel>
      <Note tone="info" icon={<InfoIcon />} className="text-[11.5px]">
        Subscription &amp; billing are tied to the <b>primary tenant only</b>.
        Monthly-recurring / annualised revenue and implementation-fee figures
        aren&rsquo;t returned by the API{" "}
        <span className="text-muted-foreground">(backend pending)</span>.
      </Note>
    </div>
  )
}

/* --------------------------------------------------------- Documents --- */

const DOC_TONE: Record<string, "success" | "warning" | "neutral"> = {
  APPROVED: "success",
  PENDING_REVIEW: "warning",
  REJECTED: "neutral",
}

/** Accepted KYB file types + size cap (matches the document upload contract). */
const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png"
const MAX_DOC_BYTES = 25 * 1024 * 1024

export function RecDocuments({
  payerId,
  primary,
  actAllowed,
  lockTip,
}: {
  payerId: number
  primary: TenantDTO | undefined
  actAllowed: boolean
  lockTip: string
}) {
  const qc = useQueryClient()
  const docs = primary?.documents ?? []
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [replacingId, setReplacingId] = React.useState<string | null>(null)

  const view = async (documentId: string) => {
    if (!primary) return
    setBusyId(documentId)
    try {
      const dl = await fetchDocumentDownload(payerId, primary.id, documentId)
      window.open(dl.url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t open the document.")
    } finally {
      setBusyId(null)
    }
  }

  const replace = async (documentId: string, file?: File | null) => {
    if (!primary || !file) return
    if (file.size > MAX_DOC_BYTES) {
      toast.error(`${file.name} is over the 25 MB limit.`)
      return
    }
    setReplacingId(documentId)
    try {
      await replaceDocument(payerId, primary.id, documentId, file)
      qc.invalidateQueries({ queryKey: payerKeys.detail(payerId) })
      toast.success("Document replaced — back to Pending review.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t replace this document.")
    } finally {
      setReplacingId(null)
    }
  }

  if (docs.length === 0) {
    return (
      <Note tone="info" icon={<InfoIcon />}>
        No documents on the primary tenant.
      </Note>
    )
  }

  return (
    <Panel className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Document</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-44" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((d) => (
            <TableRow key={d.document_id}>
              <TableCell>
                <span className="flex items-center gap-2.5 text-[13px] font-medium">
                  <FileTextIcon className="size-4 text-muted-foreground" />
                  {d.file_name}
                </span>
              </TableCell>
              <TableCell className="mono text-[12px] text-muted-foreground">
                {d.category}
              </TableCell>
              <TableCell>
                <MiniBadge tone={DOC_TONE[d.status] ?? "neutral"}>
                  {d.status}
                </MiniBadge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === d.document_id}
                    onClick={() => view(d.document_id)}
                  >
                    {busyId === d.document_id ? (
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <EyeIcon data-icon="inline-start" />
                    )}
                    View
                  </Button>
                  <label
                    className={cn(
                      "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted hover:text-foreground",
                      (!actAllowed || replacingId === d.document_id) &&
                        "pointer-events-none opacity-50"
                    )}
                    title={actAllowed ? "Replace file" : lockTip}
                  >
                    <input
                      type="file"
                      accept={DOC_ACCEPT}
                      className="hidden"
                      onChange={(e) => replace(d.document_id, e.target.files?.[0])}
                    />
                    {replacingId === d.document_id ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="size-3.5" />
                    )}
                    Replace
                  </label>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  )
}

/* ---------------------------------------------------------- Activity --- */

const ACTION_LABEL: Record<string, string> = {
  PAYER_SUBMITTED: "Submitted for review",
  PAYER_APPROVED: "Approved (maker-checker)",
  PAYER_REJECTED: "Rejected",
  PAYER_INFO_REQUESTED: "Information requested",
  PAYER_ACTIVATED: "Account activated · resources provisioned",
  PAYER_SUSPENDED: "Account suspended",
  PAYER_REACTIVATED: "Account reactivated",
  PAYER_RETIRED: "Account retired",
  ENTITLEMENTS_UPDATED: "Entitlements updated",
  SUBSCRIPTION_UPDATED: "Subscription updated",
  TENANT_UPDATED: "Tenant details updated",
  TENANT_ADDED: "Secondary tenant added",
}

const humanizeAction = (a: string) =>
  ACTION_LABEL[a] ??
  a
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())

const DOT_TONE: Record<string, string> = {
  danger: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
}

export function RecActivity({ payerId }: { payerId: number }) {
  const { data, isLoading, isError, refetch } = usePayerActivity(payerId)
  const items = data ?? []

  return (
    <Panel className="overflow-hidden">
      <PanelHead
        icon={<HistoryIcon />}
        title="Audit trail"
        action={
          <Tagpill className="text-[10px]">
            <LockIcon className="size-2.5" /> Append-only
          </Tagpill>
        }
      />
      <PanelBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <Note tone="err" icon={<TriangleAlertIcon />}>
            Couldn&rsquo;t load activity.{" "}
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => refetch()}
            >
              Try again
            </button>
            .
          </Note>
        ) : items.length === 0 ? (
          <Note tone="info" icon={<InfoIcon />}>
            No recorded activity yet.
          </Note>
        ) : (
          <ol className="flex flex-col">
            {items.map((a) => (
              <li key={a.id} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 size-2.5 shrink-0 rounded-full",
                      DOT_TONE[a.kind ?? ""] ?? "bg-muted-foreground/40"
                    )}
                  />
                  <span className="w-px flex-1 bg-border" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">
                    {humanizeAction(a.action)}
                  </div>
                  {a.reason && (
                    <div className="text-[12px] text-muted-foreground">
                      {a.reason}
                    </div>
                  )}
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {a.actor}
                    {a.actorRole ? ` · ${a.actorRole}` : ""}
                    {a.at
                      ? ` · ${formatDistanceToNow(new Date(a.at), {
                          addSuffix: true,
                        })}`
                      : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </PanelBody>
    </Panel>
  )
}

/* ----------------------------------------------------------- Dialogs --- */

const SUSPEND_REASONS: { value: SuspendReason; label: string }[] = [
  { value: "NON_PAYMENT", label: "Non-Payment" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "SECURITY", label: "Security" },
  { value: "OTHER", label: "Other" },
]

export function SuspendDialog({
  open,
  name,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  name: string
  busy: boolean
  onOpenChange: (o: boolean) => void
  onConfirm: (reason: SuspendReason, note: string) => void
}) {
  const [reason, setReason] = React.useState<SuspendReason>("NON_PAYMENT")
  const [note, setNote] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend {name}?</DialogTitle>
          <DialogDescription>
            On approval, access is revoked and all active sessions end
            immediately. Tenant data is preserved and the account can be
            reactivated. This change requires a second Platform Admin to approve
            (maker-checker).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>
            Reason <span className="text-destructive">*</span>
          </Label>
          <Select
            value={reason}
            onValueChange={(v) => setReason(v as SuspendReason)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUSPEND_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Note for the approver</Label>
          <Textarea
            placeholder="Add context for the checker…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => onConfirm(reason, note.trim())}
          >
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <BanIcon data-icon="inline-start" />
            )}
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RetireDialog({
  open,
  name,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  name: string
  busy: boolean
  onOpenChange: (o: boolean) => void
  onConfirm: (reason: string, note: string) => void
}) {
  const [reason, setReason] = React.useState("")
  const [note, setNote] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const ok = confirm.trim() === name && reason.trim().length > 3

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retire {name}?</DialogTitle>
          <DialogDescription>
            <b className="text-foreground">This is irreversible once approved.</b>{" "}
            All tenant users are deactivated, the tenant URL is taken offline, and
            a data-retention countdown begins (90 days to hard deletion per
            policy). Requires a second Platform Admin to approve (maker-checker).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>
            Retirement reason <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Why is this account being retired?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Note for the approver</Label>
          <Textarea
            placeholder="Add context for the checker…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>
            Type <span className="mono text-foreground">{name}</span> to confirm{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            value={confirm}
            placeholder={name}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!ok || busy}
            onClick={() => onConfirm(reason.trim(), note.trim())}
          >
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <ArchiveIcon data-icon="inline-start" />
            )}
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ReactivateDialog({
  open,
  name,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  name: string
  busy: boolean
  onOpenChange: (o: boolean) => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate {name}?</DialogTitle>
          <DialogDescription>
            On approval, access is restored without re-provisioning. This change
            requires a second Platform Admin to approve (maker-checker).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>Note for the approver</Label>
          <Textarea
            placeholder="Add context for the checker…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => onConfirm(note.trim())}>
            {busy ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------------------- lifecycle change-request history --- */

const LCR_ACTION_LABEL: Record<string, string> = {
  SUSPEND: "Suspension",
  REACTIVATE: "Reactivation",
  RETIRE: "Retirement",
}

const LCR_STATUS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "neutral",
}

export function RecLifecycleRequests({
  requests,
}: {
  requests: LifecycleRequest[]
}) {
  if (requests.length === 0) return null
  return (
    <Panel className="overflow-hidden">
      <PanelHead icon={<HistoryIcon />} title="Lifecycle change requests" />
      <PanelBody className="flex flex-col gap-2.5">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3.5 py-2.5"
          >
            <span className="text-[13px] font-semibold">
              {LCR_ACTION_LABEL[r.action] ?? r.action}
            </span>
            <MiniBadge tone={LCR_STATUS_TONE[r.status] ?? "neutral"}>
              {r.status}
            </MiniBadge>
            <span className="mono text-[11px] text-muted-foreground">{r.id}</span>
            <span className="flex-1" />
            {r.reason && (
              <span className="mono text-[11px] text-muted-foreground">
                {r.reason}
              </span>
            )}
          </div>
        ))}
        {requests.map((r) =>
          r.note || r.decisionComment ? (
            <div
              key={`${r.id}-detail`}
              className="px-1 text-[11.5px] text-muted-foreground"
            >
              <span className="mono">{r.id}</span> —{" "}
              {r.note && (
                <>
                  requested by <b>{r.requestedBy}</b>
                  {`: “${r.note}”`}
                </>
              )}
              {r.decisionComment && (
                <>
                  {r.note ? " · " : ""}
                  {r.status.toLowerCase()} by <b>{r.decidedBy ?? "—"}</b>
                  {`: “${r.decisionComment}”`}
                </>
              )}
            </div>
          ) : null
        )}
      </PanelBody>
    </Panel>
  )
}
