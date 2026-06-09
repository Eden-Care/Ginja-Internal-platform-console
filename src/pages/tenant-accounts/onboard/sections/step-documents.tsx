import * as React from "react"
import {
  AlertTriangleIcon,
  CheckIcon,
  FileCheckIcon,
  FileTextIcon,
  PlusIcon,
  ShieldCheckIcon,
  UploadIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ONB_TEAM,
  type OnbTeamKey,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import { Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

const REQUIRED = [
  "Signed Contract",
  "Company Registration Certificate",
  "Proof of Address",
  "Director / Shareholder IDs",
]
const OPTIONAL = [
  "Tax Clearance Certificate",
  "BBBEE Certificate",
  "Insurance License",
  "Power of Attorney",
]
const UPLOADED = [
  "Signed Contract",
  "Company Registration Certificate",
  "Proof of Address",
]

export function StepDocuments({
  form,
  assignees,
}: {
  form: OnboardingForm
  assignees: Record<WizStepKey, OnbTeamKey>
}) {
  const owner = ONB_TEAM[assignees.documents]
  const [tenant, setTenant] = React.useState("primary")
  const tenantOpts = [
    { v: "primary", l: form.legal },
    ...form.secondaries.map((s, i) => ({
      v: "s" + i,
      l: s.name || `Secondary ${i + 1}`,
    })),
  ]

  return (
    <div className="flex flex-col gap-5">
      <Note tone="info" icon={<ShieldCheckIcon />}>
        KYC review is owned by <b>{owner.name}</b> ({owner.role}). Uploaded
        files are stored as <b>Pending Review</b> and routed to the Platform
        Approver on submission.
      </Note>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg value={tenant} options={tenantOpts} onChange={setTenant} />
        <span className="text-xs text-muted-foreground">
          PDF, JPG, PNG · max 25 MB each
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed py-8 text-center">
        <UploadIcon className="size-6 text-muted-foreground" />
        <b className="text-[13px]">
          Drag &amp; drop documents, or click to browse
        </b>
        <span className="text-[11.5px] text-muted-foreground">
          Select a category for each file before uploading
        </span>
      </div>

      <div>
        <div className="eyebrow mb-2.5 text-[10.5px]">Required documents</div>
        <div className="flex flex-col gap-2">
          {REQUIRED.map((d) => {
            const up = UPLOADED.includes(d)
            return (
              <div
                key={d}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <span
                  className={
                    up
                      ? "grid size-8 place-items-center rounded-lg bg-success-subtle text-success-subtle-foreground"
                      : "grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"
                  }
                >
                  {up ? (
                    <FileCheckIcon className="size-4" />
                  ) : (
                    <FileTextIcon className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{d}</div>
                  <div className="mono text-[11.5px] text-muted-foreground">
                    {up
                      ? `${d.toLowerCase().replace(/[^a-z]/g, "_")}.pdf · 1.4 MB`
                      : "Not uploaded"}
                  </div>
                </div>
                {up ? (
                  <MiniBadge tone="success">
                    <CheckIcon className="size-3" />
                    Attached
                  </MiniBadge>
                ) : (
                  <Button variant="outline" size="sm">
                    <UploadIcon data-icon="inline-start" />
                    Upload
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Note tone="warn" icon={<AlertTriangleIcon />}>
        1 required document still missing for <b>{form.legal}</b>. Upload all
        required items to submit.
      </Note>

      <div>
        <div className="eyebrow mb-2.5 text-[10.5px]">Optional documents</div>
        <div className="flex flex-wrap gap-2">
          {OPTIONAL.map((d) => (
            <Tagpill key={d}>
              <PlusIcon className="size-[11px]" />
              {d}
            </Tagpill>
          ))}
        </div>
      </div>
    </div>
  )
}
