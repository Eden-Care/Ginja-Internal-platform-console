import * as React from "react"
import {
  FileCheck2Icon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  TriangleAlertIcon,
  UploadIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DOC_CATEGORY_LABEL,
  REQUIRED_DOC_CATEGORIES,
  type OnbDocument,
  type OnboardingForm,
} from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Note } from "@/components/console/note"

/** Accepted KYB file types + size cap (matches the document upload contract). */
const ACCEPT = ".pdf,.jpg,.jpeg,.png"
const MAX_BYTES = 25 * 1024 * 1024

const fmtSize = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : b >= 1024
      ? `${Math.round(b / 1024)} KB`
      : `${b} B`

export function StepDocuments({
  form,
  set,
  showErrors = false,
  onReplace,
  busy = false,
}: {
  form: OnboardingForm
  set: SetField
  /** Escalate the "documents missing" note + highlight empty rows (set once
     Continue is tried). */
  showErrors?: boolean
  /** Replace the file behind an already-uploaded document (server-backed —
     resets it to Pending review). Only offered once `documentId` exists. */
  onReplace?: (documentId: string, file: File) => void | Promise<void>
  busy?: boolean
}) {
  const [replacingCat, setReplacingCat] = React.useState<string | null>(null)
  const docFor = (cat: string) => form.documents.find((d) => d.category === cat)

  const pickFile = (cat: string, file?: File | null) => {
    if (!file) return
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is over the 25 MB limit.`)
      return
    }
    const others = form.documents.filter((d) => d.category !== cat)
    const prev = docFor(cat)
    set("documents", [
      ...others,
      { category: cat, fileName: file.name, file, expiryDate: prev?.expiryDate },
    ])
  }
  const clear = (cat: string) =>
    set(
      "documents",
      form.documents.filter((d) => d.category !== cat)
    )
  const update = (cat: string, patch: Partial<OnbDocument>) => {
    const cur = docFor(cat)
    if (!cur) return
    const others = form.documents.filter((d) => d.category !== cat)
    set("documents", [...others, { ...cur, ...patch }])
  }
  const pickReplace = async (cat: string, documentId: string, file?: File | null) => {
    if (!file || !onReplace) return
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is over the 25 MB limit.`)
      return
    }
    setReplacingCat(cat)
    try {
      await onReplace(documentId, file)
    } finally {
      setReplacingCat(null)
    }
  }

  const missing = REQUIRED_DOC_CATEGORIES.filter((c) => !docFor(c)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="eyebrow text-[10.5px]">Required documents</div>

      <div className="flex flex-col gap-2.5">
        {REQUIRED_DOC_CATEGORIES.map((cat) => {
          const doc = docFor(cat)
          // Resume: a doc already on the server has no local File to re-send.
          const onFile = doc?.uploaded
          const size = doc?.file ? ` · ${fmtSize(doc.file.size)}` : ""
          return (
            <div
              key={cat}
              className={cn(
                "rounded-xl border p-3.5",
                showErrors && !doc && "border-destructive"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg [&>svg]:size-[18px]",
                    doc
                      ? "bg-success-subtle text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {doc ? <FileCheck2Icon /> : <FileTextIcon />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">
                    {DOC_CATEGORY_LABEL[cat] ?? cat}
                  </div>
                  <div className="mono truncate text-[12px] text-muted-foreground">
                    {doc ? `${doc.fileName}${size}` : "Not uploaded"}
                  </div>
                </div>

                {doc ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-[12px] font-medium text-success-subtle-foreground">
                      <span className="size-1.5 rounded-full bg-current" />
                      Attached
                    </span>
                    {!onFile ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Remove"
                        onClick={() => clear(cat)}
                      >
                        <XIcon />
                      </Button>
                    ) : onReplace && doc.documentId ? (
                      <label
                        className={cn(
                          "inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] transition-colors hover:bg-muted/60",
                          (busy || replacingCat === cat) &&
                            "pointer-events-none opacity-50"
                        )}
                        title="Replace file"
                      >
                        <input
                          type="file"
                          accept={ACCEPT}
                          className="hidden"
                          onChange={(e) =>
                            pickReplace(cat, doc.documentId!, e.target.files?.[0])
                          }
                        />
                        {replacingCat === cat ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <RefreshCwIcon className="size-4" />
                        )}
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <label className="shrink-0">
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(e) => pickFile(cat, e.target.files?.[0])}
                    />
                    <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted/60">
                      <UploadIcon className="size-3.5" />
                      Upload
                    </span>
                  </label>
                )}
              </div>

              {/* Optional metadata — only for a freshly attached file (a resumed,
                 already-stored doc can't have its metadata re-sent). */}
              {doc && !onFile ? (
                <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] font-medium text-muted-foreground">
                      Expiry date <span className="font-normal">· optional</span>
                    </span>
                    <Input
                      type="date"
                      value={doc.expiryDate ?? ""}
                      onChange={(e) =>
                        update(cat, { expiryDate: e.target.value || undefined })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] font-medium text-muted-foreground">
                      Description <span className="font-normal">· optional</span>
                    </span>
                    <Input
                      value={doc.description ?? ""}
                      placeholder="e.g. Signed master agreement"
                      onChange={(e) =>
                        update(cat, { description: e.target.value || undefined })
                      }
                    />
                  </label>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {missing > 0 ? (
        <Note tone={showErrors ? "err" : "warn"} icon={<TriangleAlertIcon />}>
          {missing} required {missing === 1 ? "document is" : "documents are"} still
          missing. Upload all required items to submit — files are stored as{" "}
          <b>Pending Review</b> and routed to the approver on submission.
        </Note>
      ) : (
        <Note tone="ok" icon={<FileCheck2Icon />}>
          All required documents attached. They’ll be uploaded as{" "}
          <b>Pending Review</b> on submission.
        </Note>
      )}
    </div>
  )
}
