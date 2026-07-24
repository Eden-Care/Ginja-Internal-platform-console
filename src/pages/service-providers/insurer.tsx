import * as React from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { useServiceProvider } from "@/features/service-providers/use-service-providers"
import { useActiveInsurers } from "@/features/insurers/use-insurers"
import type { Insurer } from "@/features/insurers/types"
import {
  useExtractionHistory,
  useStartExtraction,
} from "@/features/rule-extraction/use-rule-extraction"
import {
  EXTRACT_REVIEW_LABEL,
  EXTRACT_REVIEW_TONE,
  EXTRACT_STATUS_TONE,
  type ExtractionSummary,
} from "@/features/rule-extraction/types"
import { SpAvatar, DetailRow } from "./components/shared"
import { FileSlot } from "./components/contracts"

const SP_ROOT = "/service-providers"

/**
 * Route component for `/service-providers/:code/insurers/:insurerId` — the
 * INSURER DETAIL hub that sits between the provider record and a contract's
 * extracted rules (matches the experiment prototype). NO tabs: the contracts
 * list (operational content) fills the left ~70%, the insurer profile the right
 * ~30%. Opening a contract routes to its rule-review cockpit
 * (`.../contracts/:jobId`). Bound to `…/rule-extraction/{ins}/history`.
 */
export function ServiceProviderInsurerPage() {
  const { code, insurerId } = useParams<{ code: string; insurerId: string }>()
  const { isReadonly } = useAccess()
  const readonly = isReadonly("providers")

  const providerQ = useServiceProvider(code ?? "")
  const provider = providerQ.data
  const dirQ = useActiveInsurers()
  const insurer: Insurer | null =
    dirQ.data?.find((i) => i.accountId === insurerId) ?? null

  const apiCode = provider?.displayId ?? ""
  const historyQ = useExtractionHistory(apiCode, insurerId ?? "", !!apiCode)
  const startMut = useStartExtraction()

  const [uploadOpen, setUploadOpen] = React.useState(false)

  if (!code || !insurerId) return <Navigate to={SP_ROOT} replace />

  const recBase = `${SP_ROOT}/${encodeURIComponent(code)}`
  const insBase = `${recBase}/insurers/${encodeURIComponent(insurerId)}`
  const insurerName = insurer?.name ?? historyQ.data?.[0]?.insurerName ?? insurerId
  const canUpload = !readonly && provider?.status === "Active"

  const doUpload = (contract: File) =>
    startMut.mutate(
      { code: apiCode, insurerAccountId: insurerId, contract },
      {
        onSuccess: () => {
          toast("Contract accepted — extraction job queued.")
          setUploadOpen(false)
        },
        onError: (e) =>
          toast.error("Couldn’t start extraction", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )

  if (providerQ.isLoading && !provider) {
    return (
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Service providers", href: SP_ROOT }, { label: "…" }]} />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }
  if (providerQ.isError || !provider) {
    return (
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: "Service providers", href: SP_ROOT }, { label: "…" }]} />
        <Note tone="err" icon={<HiIcon name="alert" />}>
          Couldn’t load this provider.{" "}
          <button className="font-semibold underline underline-offset-2" onClick={() => providerQ.refetch()}>
            Try again
          </button>
          .
        </Note>
      </div>
    )
  }

  const metaParts = insurer
    ? [
        insurer.companyTypeLabel,
        insurer.country,
        insurer.city,
        insurer.regulator ? `${insurer.regulator} regulated` : "",
      ].filter(Boolean)
    : []

  const contracts = historyQ.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: "Service providers", href: SP_ROOT },
          { label: provider.name, href: recBase },
          { label: insurerName },
        ]}
      />

      {/* header */}
      <div className="flex items-start gap-3.5">
        <SpAvatar name={insurerName} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-[-0.01em]">{insurerName}</h1>
            {insurer ? (
              <MiniBadge tone={insurer.status === "Active" ? "success" : "neutral"}>
                {insurer.status}
              </MiniBadge>
            ) : null}
          </div>
          <div className="mt-[5px] text-[12.5px] text-muted-foreground">
            <span className="mono">{insurerId}</span>
            {metaParts.length ? ` · ${metaParts.join(" · ")}` : ""}
            {` · working with ${provider.name}`}
          </div>
        </div>
      </div>

      {/* combined body — contracts (left) · insurer profile (right) */}
      <div className="grid gap-4 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <ContractsPanel
            contracts={contracts}
            loading={historyQ.isLoading}
            error={historyQ.isError}
            onRetry={() => historyQ.refetch()}
            insurerName={insurerName}
            insBase={insBase}
            canUpload={canUpload}
            onUpload={() => setUploadOpen(true)}
          />
        </div>
        <aside className="lg:col-span-3 lg:self-start">
          <InsurerProfilePanel
            insurer={insurer}
            insurerId={insurerId}
            insurerName={insurerName}
            providerName={provider.name}
          />
        </aside>
      </div>

      {uploadOpen ? (
        <UploadContractDialog
          insurerName={insurerName}
          busy={startMut.isPending}
          providerActive={provider.status === "Active"}
          onOpenChange={setUploadOpen}
          onSubmit={doUpload}
        />
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------- contracts */

function ContractsPanel({
  contracts,
  loading,
  error,
  onRetry,
  insurerName,
  insBase,
  canUpload,
  onUpload,
}: {
  contracts: ExtractionSummary[]
  loading: boolean
  error: boolean
  onRetry: () => void
  insurerName: string
  insBase: string
  canUpload: boolean
  onUpload: () => void
}) {
  const hasContracts = contracts.length > 0

  return (
    <Panel className="flex flex-col lg:min-h-[560px]">
      <PanelHead
        icon={<HiIcon name="fileText" />}
        title="Contracts"
        action={
          hasContracts && canUpload ? (
            <Button size="sm" className={hifiBtn} onClick={onUpload}>
              <HiIcon name="upload" />
              Upload contract
            </Button>
          ) : undefined
        }
      />
      <PanelBody className="flex flex-1 flex-col p-4">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-10 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-[13px] text-muted-foreground">
              Couldn’t load contracts.{" "}
              <button className="font-semibold text-primary underline underline-offset-2" onClick={onRetry}>
                Try again
              </button>
              .
            </p>
          </div>
        ) : !hasContracts ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-10 text-center">
            <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
              <HiIcon name="fileText" />
            </span>
            <div className="text-[13.5px] font-bold">No contracts yet</div>
            <p className="max-w-[42ch] text-[12.5px] leading-[1.55] text-muted-foreground">
              Upload the signed contract with {insurerName} to extract and review its
              claim rules.
            </p>
            {canUpload ? (
              <Button className={hifiBtn} onClick={onUpload}>
                <HiIcon name="upload" />
                Upload contract
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-muted-foreground">
              Rules are extracted automatically from each signed contract — open a
              contract to review its rules.
            </p>
            <div className="flex flex-col gap-2.5">
              {contracts.map((c) => {
                const live = c.status === "QUEUED" || c.status === "RUNNING"
                return (
                  <Link
                    key={c.jobId}
                    to={`${insBase}/contracts/${encodeURIComponent(c.jobId)}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-muted/30",
                      !c.current && "opacity-90"
                    )}
                  >
                    <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary [&>svg]:size-[18px]">
                      <HiIcon name="fileText" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="truncate text-[13px] font-semibold">
                          {c.contractFilename}
                        </b>
                        {c.current ? (
                          <MiniBadge tone="success">Current</MiniBadge>
                        ) : (
                          <MiniBadge tone="neutral">Superseded</MiniBadge>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                        <span className="mono">{c.jobId.slice(0, 8)}</span> · extracted{" "}
                        {c.completed} · uploaded by {c.createdBy}
                      </div>
                    </div>
                    {c.status === "COMPLETED" ? (
                      <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground sm:inline">
                        {c.ruleCount} rules
                      </span>
                    ) : null}
                    {c.status === "COMPLETED" ? (
                      <MiniBadge tone={EXTRACT_REVIEW_TONE[c.reviewStatus]}>
                        {EXTRACT_REVIEW_LABEL[c.reviewStatus]}
                      </MiniBadge>
                    ) : (
                      <MiniBadge tone={EXTRACT_STATUS_TONE[c.status]}>
                        {c.status}
                      </MiniBadge>
                    )}
                    {live ? (
                      <HiIcon
                        name="clock"
                        className="size-4 animate-[spin_2.4s_linear_infinite] text-warning"
                      />
                    ) : null}
                    <HiIcon name="chevronRight" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </PanelBody>
    </Panel>
  )
}

/* --------------------------------------------------------- insurer profile */

function InsurerProfilePanel({
  insurer,
  insurerId,
  insurerName,
  providerName,
}: {
  insurer: Insurer | null
  insurerId: string
  insurerName: string
  providerName: string
}) {
  const rows: [string, React.ReactNode][] = [
    ["Insurer ID", <span className="mono">{insurerId}</span>],
    ["Type", insurer?.companyTypeLabel ?? "—"],
    ["Country", insurer?.country ?? "—"],
    ["City", insurer?.city || "—"],
    ["Regulator", insurer?.regulator || "—"],
    [
      "Insurer status",
      insurer ? (
        <MiniBadge tone={insurer.status === "Active" ? "success" : "neutral"}>
          {insurer.status}
        </MiniBadge>
      ) : (
        "—"
      ),
    ],
    ["Relationship", `Working with ${providerName}`],
  ]

  return (
    <Panel>
      <PanelHead icon={<HiIcon name="shield" />} title="Insurer profile" />
      <PanelBody>
        {!insurer ? (
          <p className="mb-2 text-[11.5px] text-muted-foreground">
            {insurerName} isn’t in the active-insurer directory — showing the
            details carried on its extractions.
          </p>
        ) : null}
        <div className="grid">
          {rows.map(([k, v]) => (
            <DetailRow key={k} k={k} v={v} />
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}

/* --------------------------------------------------------- upload dialog */

function UploadContractDialog({
  insurerName,
  busy,
  providerActive,
  onOpenChange,
  onSubmit,
}: {
  insurerName: string
  busy: boolean
  providerActive: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (contract: File) => void
}) {
  // The parent mounts this only while open, so a fresh mount always starts from
  // an empty slot — no reset effect needed (mirrors AddRuleDialog).
  const [file, setFile] = React.useState<File | null>(null)

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b px-[22px] py-[18px]">
          <DialogTitle className="flex items-center gap-2 text-[16px] [&>svg]:size-[18px] [&>svg]:text-primary">
            <HiIcon name="upload" />
            Upload contract
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            For <b className="font-semibold text-foreground">{insurerName}</b>. The
            document is sent for automated rule extraction — this runs in the
            background.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-[22px] py-5">
          <FileSlot
            label="Signed contract"
            hint="PDF, JPG/PNG or DOCX up to 25 MB"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            file={file}
            onFile={setFile}
          />
          <Note tone="info" icon={<HiIcon name="info" />}>
            Extraction is asynchronous — you’ll get a job you can track; the rules
            appear once it completes. The provider must be <b>Active</b> to start an
            extraction.
          </Note>
          {!providerActive ? (
            <Note tone="warn" icon={<HiIcon name="alert" />}>
              This provider is not Active — the extraction will be rejected until it
              is.
            </Note>
          ) : null}
        </div>

        <DialogFooter className="border-t px-[22px] py-[14px]">
          <Button variant="ghost" className={hifiBtn} disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className={hifiBtn}
            disabled={!file || busy}
            onClick={() => file && onSubmit(file)}
          >
            <HiIcon name="send" />
            {busy ? "Submitting…" : "Submit for extraction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
