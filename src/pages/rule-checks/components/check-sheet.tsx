import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConsoleSelect, Field, FormGrid } from "@/components/console/form-atoms"
import { MBadge } from "@/components/hifi/badge"
import { Tagpill } from "@/components/console/tagpill"
import {
  CRITICALITIES,
  type Criticality,
  type CreateRulesCheckBody,
  type RulesCheck,
} from "@/features/rule-checks/types"

export type SheetMode = "view" | "edit" | "create"

/** Criticality → badge tone (severity ramp: mandatory→red, expected→amber). */
export function criticalityTone(
  c: Criticality
): "error" | "warning" | "neutral" {
  if (c === "MANDATORY") return "error"
  if (c === "EXPECTED") return "warning"
  return "neutral"
}

/** Split a semicolon-delimited API string into trimmed, non-empty tokens. */
function tokens(s: string): string[] {
  return s
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
}

type FormState = {
  category: string
  criticality: Criticality
  ruleType: string
  sortOrder: string
  active: boolean
  extractionGuidance: string
  fieldsToExtract: string
  triggerKeywords: string
  typicalLocation: string
  ruleCheckMapping: string
  triggeredAt: string
  ifMissing: string
  consequenceOfBreach: string
}

const EMPTY_FORM: FormState = {
  category: "",
  criticality: "EXPECTED",
  ruleType: "",
  sortOrder: "",
  active: true,
  extractionGuidance: "",
  fieldsToExtract: "",
  triggerKeywords: "",
  typicalLocation: "",
  ruleCheckMapping: "",
  triggeredAt: "",
  ifMissing: "",
  consequenceOfBreach: "",
}

function formFromCheck(c: RulesCheck): FormState {
  return {
    category: c.category,
    criticality: c.criticality,
    ruleType: c.ruleType,
    sortOrder: String(c.sortOrder ?? ""),
    active: c.active,
    extractionGuidance: c.extractionGuidance,
    fieldsToExtract: c.fieldsToExtract,
    triggerKeywords: c.triggerKeywords,
    typicalLocation: c.typicalLocation,
    ruleCheckMapping: c.ruleCheckMapping,
    triggeredAt: c.triggeredAt,
    ifMissing: c.ifMissing,
    consequenceOfBreach: c.consequenceOfBreach,
  }
}

/** Assemble the create/update body from the form (empty strings pass through so
   an edit can clear an optional field; sort_order omitted when blank). */
function bodyFromForm(f: FormState): CreateRulesCheckBody {
  const sort = f.sortOrder.trim() === "" ? undefined : Number(f.sortOrder)
  return {
    category: f.category.trim(),
    criticality: f.criticality,
    rule_type: f.ruleType.trim(),
    extraction_guidance: f.extractionGuidance.trim(),
    fields_to_extract: f.fieldsToExtract.trim(),
    trigger_keywords: f.triggerKeywords.trim(),
    typical_location: f.typicalLocation.trim(),
    rule_check_mapping: f.ruleCheckMapping.trim(),
    triggered_at: f.triggeredAt.trim(),
    if_missing: f.ifMissing.trim(),
    consequence_of_breach: f.consequenceOfBreach.trim(),
    active: f.active,
    ...(sort != null && !Number.isNaN(sort) ? { sort_order: sort } : {}),
  }
}

/* ------------------------------------------------------------------- view row --- */

function ViewField({
  label,
  value,
  pills,
  mono,
}: {
  label: string
  value?: string
  pills?: string[]
  mono?: boolean
}) {
  const has = pills ? pills.length > 0 : Boolean(value)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-semibold tracking-[0.03em] text-muted-foreground uppercase">
        {label}
      </div>
      {!has ? (
        <div className="text-[13px] text-muted-foreground/70">—</div>
      ) : pills ? (
        <div className="flex flex-wrap gap-1.5">
          {pills.map((p, i) => (
            <Tagpill key={`${p}-${i}`} className="text-[11px]">
              {p}
            </Tagpill>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "text-[13px] leading-relaxed whitespace-pre-wrap text-foreground",
            mono && "mono text-[12.5px]"
          )}
        >
          {value}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------- sheet --- */

export function CheckSheet({
  open,
  mode,
  check,
  canEdit,
  categories,
  saving,
  onModeChange,
  onSave,
  onDelete,
  onOpenChange,
}: {
  open: boolean
  mode: SheetMode
  /** The check being viewed/edited; null in create mode. */
  check: RulesCheck | null
  canEdit: boolean
  /** Known categories, for the create/edit datalist. */
  categories: string[]
  saving: boolean
  onModeChange: (mode: SheetMode) => void
  onSave: (body: CreateRulesCheckBody) => void
  onDelete: () => void
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [showErrors, setShowErrors] = React.useState(false)

  // Reset the form on the closed→open transition and whenever the target check
  // or mode changes while open — adjusted during render (no effect) so the sheet
  // can stay mounted between opens. See ConfirmDialog for the same pattern.
  const signature = `${open ? "open" : "closed"}:${mode}:${check?.checkId ?? "new"}`
  const [prevSig, setPrevSig] = React.useState(signature)
  if (signature !== prevSig) {
    setPrevSig(signature)
    if (open) {
      setShowErrors(false)
      setForm(mode === "create" || !check ? EMPTY_FORM : formFromCheck(check))
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const isForm = mode === "edit" || mode === "create"
  const categoryOk = form.category.trim().length > 0

  const submit = () => {
    if (!categoryOk) {
      setShowErrors(true)
      return
    }
    onSave(bodyFromForm(form))
  }

  const title =
    mode === "create"
      ? "New extraction check"
      : mode === "edit"
        ? `Edit ${check?.checkId ?? "check"}`
        : (check?.checkId ?? "Check")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-2xl [&_svg]:[stroke-width:1.75]"
      >
        <SheetHeader className="border-b p-5">
          <div className="flex items-center gap-2.5">
            <SheetTitle className="mono text-base font-semibold tracking-tight">
              {title}
            </SheetTitle>
            {mode === "view" && check ? (
              <>
                <MBadge tone={criticalityTone(check.criticality)}>
                  {check.criticality}
                </MBadge>
                <MBadge tone={check.active ? "success" : "neutral"}>
                  {check.active ? "Active" : "Inactive"}
                </MBadge>
              </>
            ) : null}
          </div>
          <SheetDescription className="text-[12.5px]">
            {mode === "create"
              ? "Add a check to the rules-extraction catalogue used during Claim Clean-up contract extraction."
              : mode === "edit"
                ? "Update this check. Changes take effect on the next extraction run."
                : (check?.category ?? "")}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isForm ? (
            <div className="flex flex-col gap-5">
              <FormGrid>
                <Field
                  label="Category"
                  required
                  hint={
                    showErrors && !categoryOk ? "Category is required." : undefined
                  }
                  hintTone={showErrors && !categoryOk ? "error" : "muted"}
                >
                  <Input
                    list="rules-check-categories"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="e.g. Pricing"
                    aria-invalid={showErrors && !categoryOk}
                  />
                  <datalist id="rules-check-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Criticality" required>
                  <ConsoleSelect
                    value={form.criticality}
                    onChange={(v) => set("criticality", v as Criticality)}
                    options={CRITICALITIES as unknown as string[]}
                  />
                </Field>
                <Field label="Rule type" optional>
                  <Input
                    value={form.ruleType}
                    onChange={(e) => set("ruleType", e.target.value)}
                    placeholder="e.g. NEGOTIATED_FEE_SCHEDULE"
                    className="mono text-[12.5px]"
                  />
                </Field>
                <Field label="Sort order" optional>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => set("sortOrder", e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </FormGrid>

              <Field label="Active">
                <label className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => set("active", v)}
                  />
                  {form.active
                    ? "Included in extraction runs"
                    : "Excluded from extraction runs"}
                </label>
              </Field>

              <Field
                label="Extraction guidance"
                optional
                hint="Instruction for the LLM — what to look for and extract."
              >
                <Textarea
                  rows={3}
                  value={form.extractionGuidance}
                  onChange={(e) => set("extractionGuidance", e.target.value)}
                  placeholder="Does the contract fix rates for named services? Extract the fee schedule."
                />
              </Field>

              <Field
                label="Fields to extract"
                optional
                hint="Semicolon-delimited, e.g. service name; line amount; currency."
              >
                <Textarea
                  rows={2}
                  value={form.fieldsToExtract}
                  onChange={(e) => set("fieldsToExtract", e.target.value)}
                  placeholder="service name; line amount; currency"
                />
              </Field>

              <Field
                label="Trigger keywords"
                optional
                hint="Semicolon-delimited, e.g. tariff; agreed rate; schedule of fees."
              >
                <Textarea
                  rows={2}
                  value={form.triggerKeywords}
                  onChange={(e) => set("triggerKeywords", e.target.value)}
                  placeholder="tariff; agreed rate; schedule of fees"
                />
              </Field>

              <FormGrid>
                <Field label="Typical location" optional>
                  <Input
                    value={form.typicalLocation}
                    onChange={(e) => set("typicalLocation", e.target.value)}
                    placeholder="Contract schedule; fees clause"
                  />
                </Field>
                <Field
                  label="Triggered at"
                  optional
                  hint="Semicolon-delimited stages, e.g. BILLING; VISIT CLOSE."
                >
                  <Input
                    value={form.triggeredAt}
                    onChange={(e) => set("triggeredAt", e.target.value)}
                    placeholder="BILLING; VISIT CLOSE"
                  />
                </Field>
              </FormGrid>

              <Field
                label="Rule-check mapping"
                optional
                hint="Machine-readable check expression."
              >
                <Input
                  value={form.ruleCheckMapping}
                  onChange={(e) => set("ruleCheckMapping", e.target.value)}
                  placeholder="line_amount <= tariff_rate"
                  className="mono text-[12.5px]"
                />
              </Field>

              <Field label="If missing" optional>
                <Textarea
                  rows={2}
                  value={form.ifMissing}
                  onChange={(e) => set("ifMissing", e.target.value)}
                  placeholder="Flag: no rate basis — request fee schedule"
                />
              </Field>

              <Field label="Consequence of breach" optional>
                <Textarea
                  rows={2}
                  value={form.consequenceOfBreach}
                  onChange={(e) => set("consequenceOfBreach", e.target.value)}
                  placeholder="Amount above the agreed rate is not payable"
                />
              </Field>
            </div>
          ) : check ? (
            <div className="flex flex-col gap-5">
              <FormGrid>
                <ViewField label="Category" value={check.category} />
                <ViewField label="Rule type" value={check.ruleType} mono />
                <ViewField
                  label="Sort order"
                  value={String(check.sortOrder)}
                  mono
                />
                <ViewField
                  label="Status"
                  value={check.active ? "Active" : "Inactive"}
                />
              </FormGrid>
              <ViewField
                label="Extraction guidance"
                value={check.extractionGuidance}
              />
              <ViewField
                label="Fields to extract"
                pills={tokens(check.fieldsToExtract)}
              />
              <ViewField
                label="Trigger keywords"
                pills={tokens(check.triggerKeywords)}
              />
              <ViewField
                label="Typical location"
                value={check.typicalLocation}
              />
              <ViewField
                label="Triggered at"
                pills={tokens(check.triggeredAt)}
              />
              <ViewField
                label="Rule-check mapping"
                value={check.ruleCheckMapping}
                mono
              />
              <ViewField label="If missing" value={check.ifMissing} />
              <ViewField
                label="Consequence of breach"
                value={check.consequenceOfBreach}
              />
              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 border-t pt-4 text-[11.5px] text-muted-foreground">
                {check.createdByName ? (
                  <span>Created by {check.createdByName}</span>
                ) : null}
                {check.createdAt ? <span>Added {check.createdAt}</span> : null}
                {check.updatedAt ? (
                  <span>Updated {check.updatedAt}</span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row items-center justify-between border-t p-4">
          {isForm ? (
            <>
              <Button
                variant="ghost"
                onClick={() =>
                  mode === "create"
                    ? onOpenChange(false)
                    : onModeChange("view")
                }
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving
                  ? "Saving…"
                  : mode === "create"
                    ? "Create check"
                    : "Save changes"}
              </Button>
            </>
          ) : (
            <>
              {canEdit && check ? (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
              ) : (
                <span />
              )}
              {canEdit ? (
                <Button onClick={() => onModeChange("edit")}>
                  <PencilIcon data-icon="inline-start" />
                  Edit check
                </Button>
              ) : (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
