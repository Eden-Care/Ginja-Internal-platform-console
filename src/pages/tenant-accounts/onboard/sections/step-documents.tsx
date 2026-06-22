import {
  CheckIcon,
  FileTextIcon,
  InfoIcon,
  UploadIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  DOC_CATEGORY_LABEL,
  REQUIRED_DOC_CATEGORIES,
  type OnboardingForm,
} from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Field } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"

export function StepDocuments({
  form,
  set,
}: {
  form: OnboardingForm
  set: SetField
}) {
  const docFor = (cat: string) => form.documents.find((d) => d.category === cat)
  const setDoc = (cat: string, fileName: string) => {
    const others = form.documents.filter((d) => d.category !== cat)
    set(
      "documents",
      fileName.trim()
        ? [...others, { category: cat, fileName: fileName.trim() }]
        : others
    )
  }
  const provided = REQUIRED_DOC_CATEGORIES.filter((c) => docFor(c)).length

  return (
    <div className="flex flex-col gap-5">
      <Note tone="warn" icon={<UploadIcon />}>
        <b>File upload isn’t available yet.</b> The API stores document{" "}
        <b>metadata only</b> (category + file name) — actual file bytes can’t be
        uploaded until the backend exposes a document store. Enter the file name
        for each required document to record it; swap in real upload once
        supported. (Flagged for the backend: see API_UI_FIT.md.)
      </Note>

      <div className="flex items-center justify-between">
        <span className="eyebrow text-[10.5px]">
          Required documents · primary tenant
        </span>
        <MiniBadge tone={provided === REQUIRED_DOC_CATEGORIES.length ? "success" : "warning"}>
          {provided}/{REQUIRED_DOC_CATEGORIES.length} provided
        </MiniBadge>
      </div>

      <div className="flex flex-col gap-2.5">
        {REQUIRED_DOC_CATEGORIES.map((cat) => {
          const doc = docFor(cat)
          return (
            <div
              key={cat}
              className="flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-end"
            >
              <span
                className={
                  doc
                    ? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-success-subtle text-success-subtle-foreground"
                    : "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
                }
              >
                {doc ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <FileTextIcon className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Field
                  label={DOC_CATEGORY_LABEL[cat] ?? cat}
                  required
                  hint={`Category sent as ${cat}`}
                >
                  <Input
                    value={doc?.fileName ?? ""}
                    placeholder="e.g. signed-contract.pdf"
                    onChange={(e) => setDoc(cat, e.target.value)}
                  />
                </Field>
              </div>
              {doc ? (
                <MiniBadge tone="success">
                  <CheckIcon className="size-3" />
                  Recorded
                </MiniBadge>
              ) : (
                <MiniBadge tone="neutral">Missing</MiniBadge>
              )}
            </div>
          )
        })}
      </div>

      <Note tone="info" icon={<InfoIcon />}>
        Optional KYB documents (Tax Clearance, Insurance License, …) and{" "}
        <b>per-secondary-tenant</b> documents aren’t captured yet — their category
        codes need backend confirmation. Only the four required primary-tenant
        categories are wired.
      </Note>
    </div>
  )
}
