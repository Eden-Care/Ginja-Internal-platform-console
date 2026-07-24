import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2Icon, SearchIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConsolePageHeader } from "@/components/console/page-header"
import { StatTile } from "@/components/console/stat-tile"
import { Tagpill, MiniBadge } from "@/components/console/tagpill"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { TabBar } from "@/components/console/tab-bar"
import { Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import {
  useAddRemark,
  useApproveProvider,
  useMarkSectionReviewed,
  useProviderDocuments,
  useProviderDocumentUrl,
  useProviderReview,
  useReviewQueue,
  useResolveRemark,
  useSendBackProvider,
  useServiceProvider,
  useServiceProvidersDirectory,
} from "@/features/service-providers/use-service-providers"
import type {
  ServiceProvider,
  SpReviewRemark,
} from "@/features/service-providers/types"
import { BackLink, RegionPill, SpAvatar, SpStatus, spGrid } from "./shared"

const SECTION_ICON: Record<string, string> = {
  profile: "hospital",
  location: "mapPin",
  systems: "server",
  registration: "fileText",
  documents: "paperclip",
}

/** Lean grid for the review-queue tables (the queue DTO carries town/submitted,
   not type/county). Provider · Account ID · Town · Submitted · Review · ›. */
const queueGrid =
  "grid items-center gap-[14px] grid-cols-[minmax(0,1.6fr)_128px_108px_34px] lg:grid-cols-[minmax(0,1.6fr)_140px_minmax(0,0.8fr)_120px_108px_34px]"

/* ===================== REVIEW QUEUE (tab 1) =====================
   Onboardings awaiting approval. List only — the page header + tabs live in
   ProviderReviewHub below. Rich review badge: open remarks → "N open",
   else ready-to-activate → "Ready", else "In review". */
function QueueTable({ onOpen }: { onOpen: (code: string) => void }) {
  const { data, isLoading, isError, refetch } = useReviewQueue()
  const [q, setQ] = React.useState("")
  const queue = data?.queue ?? []
  const list = queue.filter((x) =>
    (x.name + x.displayId).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-[9px]">
        <div className="flex h-[34px] min-w-[200px] max-w-[340px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
          <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search providers awaiting review…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Tagpill>
          {list.length} of {queue.length}
        </Tagpill>
      </div>

      <Panel className="overflow-hidden">
        <div
          className={cn(
            queueGrid,
            "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          )}
        >
          <span>Provider</span>
          <span>Account ID</span>
          <span className="hidden lg:block">Town</span>
          <span className="hidden lg:block">Submitted</span>
          <span>Review</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <Note tone="err" icon={<TriangleAlertIcon />} className="m-4">
            Couldn’t load the review queue.{" "}
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => refetch()}
            >
              Try again
            </button>
            .
          </Note>
        ) : (
          <>
            {list.map((x, i) => (
              <div
                key={x.code}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(x.code)}
                onKeyDown={(e) => e.key === "Enter" && onOpen(x.code)}
                className={cn(
                  queueGrid,
                  "cursor-pointer border-t px-4 py-3 transition-colors hover:bg-muted/40",
                  i === 0 && "border-t-0"
                )}
              >
                <div className="flex min-w-0 items-center gap-[11px]">
                  <SpAvatar name={x.name} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">
                      {x.name}
                    </div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {x.ownershipLabel}
                    </div>
                  </div>
                </div>
                <div className="mono truncate text-[11.5px]">{x.displayId}</div>
                <div className="hidden min-w-0 lg:block">
                  <RegionPill label={x.town} />
                </div>
                <div className="hidden truncate text-[11.5px] text-muted-foreground lg:block">
                  {x.submittedAt}
                </div>
                <div className="min-w-0">
                  {x.openRemarks > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2 py-0.5 text-[11px] font-medium text-destructive [&>svg]:size-[10px]">
                      <HiIcon name="flag" />
                      {x.openRemarks} open
                    </span>
                  ) : x.readyToActivate ? (
                    <MiniBadge tone="success">Ready</MiniBadge>
                  ) : (
                    <MiniBadge tone="neutral">In review</MiniBadge>
                  )}
                </div>
                <div className="flex justify-end text-muted-foreground [&>svg]:size-4">
                  <HiIcon name="chevronRight" />
                </div>
              </div>
            ))}
            {list.length === 0 ? (
              <div className="m-4 flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-input bg-muted/30 px-6 py-12 text-center">
                <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground shadow-xs [&>svg]:size-[22px]">
                  <HiIcon name="checkCircle" />
                </span>
                <p className="max-w-[46ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                  <b>Nothing to review.</b>
                  <br />
                  All submitted providers have been actioned.
                </p>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </div>
  )
}

/* ---- remark card + composer ---- */
function RemarkCard({
  r,
  onResolve,
  resolving,
}: {
  r: SpReviewRemark
  onResolve: () => void
  resolving: boolean
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-[10px] border p-3",
        r.status === "resolved"
          ? "opacity-70"
          : r.severity === "action"
            ? "border-destructive/30 bg-destructive-subtle/40"
            : "bg-muted/30"
      )}
    >
      <MiniAvatar initials={r.by.slice(0, 2).toUpperCase()} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <b className="font-semibold">{r.by}</b>
          <span className="text-muted-foreground">{r.when}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-px text-[10px] font-semibold",
              r.severity === "action"
                ? "bg-destructive/12 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            {r.typeLabel}
          </span>
          {r.status === "resolved" ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] text-success [&>svg]:size-3">
              <HiIcon name="checkCircle" />
              Resolved
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[12.5px] leading-[1.5]">{r.body}</p>
        {r.status === "open" ? (
          <button
            type="button"
            onClick={onResolve}
            disabled={resolving}
            className="mt-2 inline-flex items-center gap-1 rounded-[7px] border px-2 py-1 text-[12px] transition-colors hover:bg-muted disabled:opacity-50 [&>svg]:size-[13px]"
          >
            <HiIcon name="check" />
            Mark resolved
          </button>
        ) : null}
      </div>
    </div>
  )
}

function RemarkComposer({
  sectionLabel,
  onAdd,
  adding,
}: {
  sectionLabel: string
  onAdd: (body: string, severity: "action" | "note") => void
  adding: boolean
}) {
  const [text, setText] = React.useState("")
  const [sev, setSev] = React.useState("action")
  return (
    <div className="rounded-[10px] border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[12px] font-medium [&_b]:font-semibold [&>svg]:size-[14px]">
        <HiIcon name="messageSquare" />
        Leave a remark on <b>{sectionLabel}</b>
      </div>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What should the onboarding specialist fix in this section?"
        className="mt-2 w-full resize-none rounded-[8px] border border-input bg-background px-[11px] py-[9px] text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/[0.16]"
      />
      <div className="mt-2.5 flex items-center gap-2">
        <Seg
          value={sev}
          onChange={setSev}
          options={[
            { v: "action", l: "Action required" },
            { v: "note", l: "Note" },
          ]}
        />
        <span className="flex-1" />
        <Button
          size="sm"
          className={hifiBtn}
          disabled={text.trim().length < 3 || adding}
          onClick={() => {
            onAdd(text.trim(), sev as "action" | "note")
            setText("")
          }}
        >
          <HiIcon name="flag" data-icon="inline-start" />
          Add remark
        </Button>
      </div>
    </div>
  )
}

/* ========================= REVIEW DETAIL ========================= */
export function ProviderReview({
  code,
  onBack,
}: {
  code: string
  onBack: () => void
}) {
  const reviewQ = useProviderReview(code)
  const providerQ = useServiceProvider(code)
  const documentsQ = useProviderDocuments(code)
  const addMut = useAddRemark()
  const resolveMut = useResolveRemark()
  const markMut = useMarkSectionReviewed()
  const approveMut = useApproveProvider()
  const sendBackMut = useSendBackProvider()
  const openMut = useProviderDocumentUrl()

  /* Open a document via a freshly-minted pre-signed URL (fetched on click, not
     the load-time cached one). Opens a blank tab synchronously so it survives
     popup blockers, then points it at the URL once it resolves. */
  const openDoc = (docType: string) => {
    const w = window.open("about:blank", "_blank")
    openMut.mutate(
      { code, docType },
      {
        onSuccess: (url) => {
          if (w) w.location.href = url
          else window.open(url, "_blank")
        },
        onError: (e) => {
          w?.close()
          toast.error("Couldn’t open document", {
            description: e instanceof Error ? e.message : undefined,
          })
        },
      }
    )
  }

  const review = reviewQ.data
  const p = providerQ.data
  const documents = documentsQ.data ?? []

  const [active, setActive] = React.useState<string>("profile")
  const [confirm, setConfirm] = React.useState<"approve" | "reject" | null>(null)

  if (reviewQ.isLoading && !review) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink label="Review queue" onClick={onBack} />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  if (reviewQ.isError || !review) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink label="Review queue" onClick={onBack} />
        <Note tone="err" icon={<HiIcon name="alert" />}>
          Couldn’t load this review.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => reviewQ.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      </div>
    )
  }

  const sections = review.sections
  const cur = sections.find((s) => s.key === active) ?? sections[0]
  const activeKey = cur?.key ?? "profile"
  const openRemarksAll = review.remarks.filter((r) => r.status === "open")
  const remarksFor = (k: string) => review.remarks.filter((r) => r.section === k)
  const openFor = (k: string) =>
    review.remarks.filter((r) => r.section === k && r.status === "open").length
  const busy =
    addMut.isPending ||
    resolveMut.isPending ||
    markMut.isPending ||
    approveMut.isPending ||
    sendBackMut.isPending

  const addRemark = (body: string, severity: "action" | "note") => {
    addMut.mutate(
      { code, sectionKey: activeKey, severity, body },
      {
        onSuccess: () => toast(`Remark added on ${cur?.label ?? "section"}.`),
        onError: (e) =>
          toast.error("Couldn’t add remark", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }
  const resolveRemark = (remarkId: string) => {
    resolveMut.mutate(
      { code, remarkId },
      {
        onSuccess: () => toast("Remark marked resolved."),
        onError: (e) =>
          toast.error("Couldn’t resolve remark", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }
  const markReviewed = () => {
    markMut.mutate(
      { code, sectionKey: activeKey },
      {
        onSuccess: () => toast(`${cur?.label ?? "Section"} marked reviewed.`),
        onError: (e) =>
          toast.error("Couldn’t mark reviewed", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  const sectionRows: Record<string, [string, React.ReactNode][]> = {
    profile: [
      ["Provider name", p?.name ?? review.name],
      ["Type", p?.type ?? "—"],
      ["Tier", p?.tier ?? "—"],
      ["Ownership", p?.ownership ?? "—"],
    ],
    location: [
      ["Location", p ? `${p.town}, ${p.county}, ${p.country}` : "—"],
      ["Primary contact", p ? `${p.contact} · ${p.role}` : "—"],
      ["Email", p?.email ?? "—"],
      ["Phone", p?.phone ?? "—"],
    ],
    systems: [
      ["HIMS", p?.hims ?? "—"],
      [
        "Claims / month",
        p?.claimsMonth ? Number(p.claimsMonth).toLocaleString() : "—",
      ],
      ["Integration", p?.integration ?? "—"],
      ["Services", p?.services.length ? p.services.join(", ") : "—"],
    ],
    registration: [
      ["Registration no.", p?.reg ?? "—"],
      ["KRA PIN", p?.kra ?? "—"],
      ["SHIF / SHA", p?.shif ?? "—"],
    ],
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink label="Review queue" onClick={onBack} />

      {/* head */}
      <div className="flex items-start gap-3.5">
        <SpAvatar name={review.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold">{review.name}</h2>
            <SpStatus status={review.status} />
          </div>
          <div className="mt-[5px] flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
            <span className="mono">{review.accountId ?? review.code}</span>
            {p ? (
              <span>
                {p.type} · {p.county} · submitted {review.submittedAt} by{" "}
                {p.createdBy}
              </span>
            ) : (
              <span>submitted {review.submittedAt}</span>
            )}
          </div>
        </div>
      </div>

      {/* open-remarks banner */}
      {openRemarksAll.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-destructive/30 bg-destructive-subtle/40 px-3.5 py-2.5 text-[12.5px] text-destructive-subtle-foreground [&_b]:font-semibold">
          <span className="text-destructive [&>svg]:size-[15px]">
            <HiIcon name="flag" />
          </span>
          <span>
            <b>
              {openRemarksAll.length} open remark
              {openRemarksAll.length > 1 ? "s" : ""}.
            </b>{" "}
            Resolve or the specialist must address{" "}
            {openRemarksAll.length > 1 ? "them" : "it"} before activation — jump
            to:
          </span>
          {[...new Set(openRemarksAll.map((r) => r.section))].map((k) => {
            const s = sections.find((x) => x.key === k)
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActive(k)}
                className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground [&>svg]:size-3"
              >
                <HiIcon name={SECTION_ICON[k] ?? "fileText"} />
                {s?.label ?? k}
                <span className="rounded-full bg-destructive/12 px-1 text-destructive">
                  {openFor(k)}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* rail */}
        <div className="flex flex-col gap-1.5">
          {sections.map((s) => {
            const open = s.openRemarks
            const on = activeKey === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors",
                  on ? "border-primary bg-primary/[0.06]" : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-[9px] [&>svg]:size-[15px]",
                    open
                      ? "bg-destructive-subtle text-destructive-subtle-foreground"
                      : s.reviewed
                        ? "bg-success-subtle text-success-subtle-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <HiIcon name={SECTION_ICON[s.key] ?? "fileText"} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium">{s.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {open ? `${open} open` : s.reviewed ? "Reviewed" : "Not reviewed"}
                  </span>
                </span>
                {open > 0 ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-destructive/12 px-1.5 py-px text-[10px] font-semibold text-destructive [&>svg]:size-[10px]">
                    <HiIcon name="flag" />
                    {open}
                  </span>
                ) : s.reviewed ? (
                  <span className="size-2 rounded-full bg-success" />
                ) : (
                  <span className="size-2 rounded-full bg-muted-foreground/40" />
                )}
              </button>
            )
          })}

          {/* readiness card */}
          <div className="mt-1.5 rounded-xl border bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-[12px] font-medium">
              <span>Review status</span>
              <span className="mono">
                {review.reviewedSections}/{review.totalSections}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(review.reviewedSections / Math.max(review.totalSections, 1)) * 100}%`,
                }}
              />
            </div>
            <Button
              className={cn("mt-3 w-full justify-center", hifiBtn)}
              variant={review.canApprove ? "default" : "outline"}
              disabled={!review.canApprove || busy}
              onClick={() => setConfirm("approve")}
            >
              <HiIcon name={review.canApprove ? "checkCircle" : "flag"} />
              {review.canApprove
                ? "Approve & activate"
                : openRemarksAll.length
                  ? `${openRemarksAll.length} remark${openRemarksAll.length > 1 ? "s" : ""} open`
                  : "Review all sections"}
            </Button>
            <Button
              variant="ghost"
              className={cn("mt-2 w-full justify-center", hifiBtn)}
              disabled={busy}
              onClick={() => setConfirm("reject")}
            >
              <HiIcon name="messageSquare" />
              Send back to specialist
            </Button>
            <p className="mt-2 text-[10.5px] leading-[1.4] text-muted-foreground">
              {review.canApprove
                ? "All sections reviewed with no open remarks. Approving activates the provider."
                : "Resolve open remarks and mark every section reviewed before activation."}
            </p>
          </div>
        </div>

        {/* panel */}
        <Panel className="overflow-hidden">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary [&>svg]:size-[17px]">
              <HiIcon name={SECTION_ICON[activeKey] ?? "fileText"} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold">{cur?.label}</h3>
            </div>
            {cur && openFor(activeKey) > 0 ? (
              <MiniBadge tone="error">{openFor(activeKey)} open</MiniBadge>
            ) : cur?.reviewed ? (
              <MiniBadge tone="success">Reviewed</MiniBadge>
            ) : (
              <Button
                size="sm"
                className={hifiBtn}
                disabled={busy}
                onClick={markReviewed}
              >
                <HiIcon name="check" data-icon="inline-start" />
                Mark reviewed
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3.5 p-4">
            {remarksFor(activeKey).length > 0 ? (
              <div className="flex flex-col gap-2 rounded-[10px] bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold [&>svg]:size-[13px]">
                  <HiIcon name="flag" />
                  Review remarks · {cur?.label}
                  <span className="flex-1" />
                  {openFor(activeKey) > 0 ? (
                    <span className="text-[11px] font-medium text-destructive">
                      {openFor(activeKey)} open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-success [&>svg]:size-3">
                      <HiIcon name="checkCircle" />
                      All resolved
                    </span>
                  )}
                </div>
                {remarksFor(activeKey).map((r) => (
                  <RemarkCard
                    key={r.id}
                    r={r}
                    resolving={resolveMut.isPending}
                    onResolve={() => resolveRemark(r.id)}
                  />
                ))}
              </div>
            ) : null}

            {activeKey === "documents" ? (
              <div className="flex flex-col gap-2.5">
                {documents.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    No documents uploaded.
                  </p>
                ) : (
                  documents.map((d) => (
                    <div
                      key={d.docType}
                      className={cn(
                        "flex items-center gap-3 rounded-[10px] border px-3.5 py-3",
                        d.uploaded && "bg-muted/30"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-[9px] [&>svg]:size-[17px]",
                          d.uploaded
                            ? "bg-success-subtle text-success-subtle-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <HiIcon name={d.uploaded ? "checkCircle" : "upload"} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium">
                          {d.label}
                          {d.required ? (
                            <span className="text-destructive"> *</span>
                          ) : null}
                        </div>
                        <div className="truncate text-[11.5px] text-muted-foreground">
                          {d.uploaded
                            ? `${d.fileName ?? "Uploaded"} · PDF`
                            : "Not uploaded"}
                        </div>
                      </div>
                      {d.uploaded ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={hifiBtn}
                          disabled={
                            openMut.isPending &&
                            openMut.variables?.docType === d.docType
                          }
                          onClick={() => openDoc(d.docType)}
                        >
                          {openMut.isPending &&
                          openMut.variables?.docType === d.docType ? (
                            <Loader2Icon
                              data-icon="inline-start"
                              className="animate-spin"
                            />
                          ) : (
                            <HiIcon name="eye" data-icon="inline-start" />
                          )}
                          View
                        </Button>
                      ) : (
                        <MiniBadge tone="warning">Missing</MiniBadge>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid gap-x-10 sm:grid-cols-2">
                {(sectionRows[activeKey] ?? []).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b py-2.5 text-[13px] last:border-b-0"
                  >
                    <span className="shrink-0 text-[12px] text-muted-foreground">
                      {k}
                    </span>
                    <span className="min-w-0 text-right text-foreground">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <RemarkComposer
              sectionLabel={cur?.label ?? "section"}
              adding={addMut.isPending}
              onAdd={addRemark}
            />
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirm === "approve"}
        icon={<HiIcon name="checkCircle" />}
        tone="primary"
        title={`Approve ${review.name}?`}
        body={
          <>
            <p>
              Approving activates the provider for Claim Clean-up. It can then
              submit claims and appears in active-only pickers.
            </p>
            <ImpactBox
              tone="primary"
              icon={<HiIcon name="info" />}
              heading="On approval"
              items={[
                <>
                  Status changes to <b>Active</b>, recorded with your name.
                </>,
                "The onboarding specialist is notified.",
                "Written to the provider audit trail.",
              ]}
            />
          </>
        }
        confirmLabel="Approve & activate"
        onConfirm={() =>
          approveMut.mutate(
            { code },
            {
              onSuccess: () => {
                toast(`${review.name} approved & activated.`)
                setConfirm(null)
                onBack()
              },
              onError: (e) =>
                toast.error("Couldn’t approve", {
                  description: e instanceof Error ? e.message : undefined,
                }),
            }
          )
        }
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "reject"}
        icon={<HiIcon name="messageSquare" />}
        tone="danger"
        title={`Send ${review.name} back?`}
        body={
          <p>
            The onboarding returns to the specialist with your remarks. The
            provider stays <b>Pending review</b> until they resubmit.
          </p>
        }
        reasonRequired
        reasonLabel="Summary note to the specialist"
        confirmLabel="Send back"
        onConfirm={(note) =>
          sendBackMut.mutate(
            { code, note: note ?? "" },
            {
              onSuccess: () => {
                toast(`${review.name} sent back to specialist.`)
                setConfirm(null)
                onBack()
              },
              onError: (e) =>
                toast.error("Couldn’t send back", {
                  description: e instanceof Error ? e.message : undefined,
                }),
            }
          )
        }
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

/* ===================== APPROVED PROVIDERS (tab 2) ===================== */
function ApprovedTable({ onOpen }: { onOpen: (code: string) => void }) {
  const [q, setQ] = React.useState("")
  // Lists every approved provider and filters client-side, so pull a large
  // page rather than the directory's default 20.
  const approvedQ = useServiceProvidersDirectory({ status: "ACTIVE", size: 200 })
  const approved = approvedQ.data?.providers ?? []
  const approvedTotal = approvedQ.data?.summary.active ?? approved.length
  const list = approved.filter((x) =>
    (x.name + x.displayId).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-[9px]">
        <div className="flex h-[34px] min-w-[200px] max-w-[340px] flex-1 items-center gap-2 rounded-[8px] border border-input bg-background px-2.5">
          <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search approved providers…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Tagpill>
          {list.length} of {approvedTotal}
        </Tagpill>
      </div>
      <Panel className="overflow-hidden">
        <div
          className={cn(
            spGrid,
            "border-b bg-muted/50 px-4 py-[10px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          )}
        >
          <span>Provider</span>
          <span>Account ID</span>
          <span className="hidden lg:block">Type</span>
          <span>County</span>
          <span className="hidden lg:block">Approved by</span>
          <span>Status</span>
          <span />
        </div>
        {list.map((x: ServiceProvider, i) => (
          <div
            key={x.code}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(x.code)}
            onKeyDown={(e) => e.key === "Enter" && onOpen(x.code)}
            className={cn(
              spGrid,
              "cursor-pointer border-t px-4 py-3 transition-colors hover:bg-muted/40",
              i === 0 && "border-t-0"
            )}
          >
            <div className="flex min-w-0 items-center gap-[11px]">
              <SpAvatar name={x.name} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold">
                  {x.name}
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  Approved {x.approvedOn ?? "—"}
                </div>
              </div>
            </div>
            <div className="mono truncate text-[11.5px]">{x.displayId}</div>
            <div className="hidden truncate text-[12px] text-muted-foreground lg:block">
              {x.type}
            </div>
            <div className="min-w-0">
              <RegionPill label={x.county} />
            </div>
            <div className="hidden truncate text-[11.5px] text-muted-foreground lg:block">
              {x.approvedBy ?? "—"}
            </div>
            <div className="min-w-0">
              <SpStatus status={x.status} />
            </div>
            <div className="flex justify-end text-muted-foreground [&>svg]:size-4">
              <HiIcon name="chevronRight" />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}

/* ===================== AUDIT LOG (tab 3) ===================== */
function AuditPanel() {
  return (
    <Panel>
      <PanelHead icon={<HiIcon name="fileText" />} title="Approval audit log" />
      <PanelBody>
        <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed border-input bg-muted/30 px-6 py-12 text-center">
          <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground shadow-xs [&>svg]:size-[22px]">
            <HiIcon name="fileText" />
          </span>
          <p className="max-w-[52ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
            <b>The cross-provider approval log is pending backend.</b>
            <br />
            Per-provider history is on each record’s <b>Audit trail</b> tab; a
            combined approval activity feed isn’t exposed by the API yet.
          </p>
          <MiniBadge tone="info">Pending backend</MiniBadge>
        </div>
      </PanelBody>
    </Panel>
  )
}

/* ==================== PROVIDER REVIEW HUB ====================
   The single landing for the approver flow (`/provider-review`). Tabs are
   URL-backed via `?tab=` (default "queue" = no param, so the sidebar entry
   lands straight on the actionable Review-queue list — no status-KPI screen
   in between). `approved`/`audit` are the other two tabs. */
const REVIEW_TABS = ["queue", "approved", "audit"] as const
type ReviewTabKey = (typeof REVIEW_TABS)[number]

export function ProviderReviewHub({
  onOpenReview,
  onOpenApproved,
}: {
  /** Open an onboarding under review (→ the section-by-section review). */
  onOpenReview: (code: string) => void
  /** Open an approved provider (→ its record page). */
  onOpenApproved: (code: string) => void
}) {
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab") ?? ""
  const tab: ReviewTabKey = (REVIEW_TABS as readonly string[]).includes(raw)
    ? (raw as ReviewTabKey)
    : "queue"
  const setTab = (t: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (t === "queue") next.delete("tab")
        else next.set("tab", t)
        return next
      },
      { replace: true }
    )

  // Drives the KPI strip + the tab count badges. The tables fetch their own
  // data (deduped by react-query on the same keys).
  const queueQ = useReviewQueue()
  const approvedQ = useServiceProvidersDirectory({ status: "ACTIVE", size: 200 })
  const stats = queueQ.data?.stats
  const queueCount = queueQ.data?.queue.length ?? 0
  const approvedCount =
    approvedQ.data?.summary.active ?? approvedQ.data?.providers.length ?? 0

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Provider review"
        sub="Onboardings awaiting your approval, everything you've approved, and the approval audit trail."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          tone="warning"
          icon={<HiIcon name="clock" />}
          value={stats?.awaitingReview ?? 0}
          label="Awaiting review"
        />
        <StatTile
          tone={stats?.openRemarks ? "error" : "neutral"}
          icon={<HiIcon name="flag" />}
          value={stats?.openRemarks ?? 0}
          label="Open remarks"
        />
        <StatTile
          tone="success"
          icon={<HiIcon name="checkCircle" />}
          value={stats?.readyToActivate ?? 0}
          label="Ready to activate"
        />
      </div>

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          {
            k: "queue",
            label: "Review queue",
            icon: <HiIcon name="clock" />,
            count: queueCount,
          },
          {
            k: "approved",
            label: "Approved providers",
            icon: <HiIcon name="checkCircle" />,
            count: approvedCount,
          },
          {
            k: "audit",
            label: "Audit log",
            icon: <HiIcon name="fileText" />,
          },
        ]}
      />

      {tab === "queue" ? <QueueTable onOpen={onOpenReview} /> : null}
      {tab === "approved" ? <ApprovedTable onOpen={onOpenApproved} /> : null}
      {tab === "audit" ? <AuditPanel /> : null}
    </div>
  )
}
