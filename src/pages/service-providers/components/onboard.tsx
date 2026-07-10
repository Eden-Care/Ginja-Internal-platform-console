import * as React from "react"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { MField, fieldInput } from "@/components/hifi/field"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { EA_COUNTRIES } from "@/lib/console-data"
import type { SpFormInput } from "@/features/service-providers/api"
import {
  DOC_TYPE_TO_ENUM,
  KE_COUNTIES,
  SP_CLASSES,
  SP_DOCS,
  SP_INTEGRATION,
  SP_OWNERSHIP,
  SP_SERVICES,
  SP_TIERS,
  SP_TYPES,
  type ServiceProvider,
  type SpDocument,
} from "@/features/service-providers/types"
import {
  useCreateProvider,
  useProviderDocuments,
  useSubmitProvider,
  useUpdateProvider,
  useUploadProviderDocument,
} from "@/features/service-providers/use-service-providers"
import { BackLink } from "./shared"

type SectionStatus = "todo" | "progress" | "complete"

const SPO_STEPS = [
  { k: "profile", l: "Provider profile", d: "Identity, type, tier & class" },
  { k: "location", l: "Location & contact", d: "Where it operates & who to reach" },
  { k: "systems", l: "Systems & integration", d: "HIMS, claim volume, services" },
  { k: "registration", l: "Registration", d: "Licences, KRA, accreditation" },
  { k: "documents", l: "Documents", d: "Contract & supporting files" },
  { k: "review", l: "Review & submit", d: "Submit for approval" },
] as const

const spIntro: Record<string, string> = {
  profile:
    "Identify the facility and how it’s classified. This drives claim rules and reporting downstream.",
  location:
    "Where the provider physically operates and the person we coordinate with.",
  systems:
    "The provider’s health information system, claim volume and integration progress — plus the services they offer.",
  registration:
    "Regulatory and tax identifiers used to verify the facility and settle claims.",
  documents:
    "Upload the signed partnership contract and supporting documents for review.",
  review:
    "Review the full submission. On submit, the provider is created as Inactive and routed to an Approver.",
}

type SpForm = {
  name: string
  type: string
  tier: string
  cls: string
  ownership: string
  country: string
  county: string
  town: string
  address: string
  contact: string
  role: string
  email: string
  dial: string
  phone: string
  hims: string
  claimsMonth: string
  integration: string
  services: string[]
  reg: string
  kra: string
  shif: string
}

const SP_BASE: SpForm = {
  name: "",
  type: "Hospital",
  tier: "Top 35",
  cls: "Tier 1",
  ownership: "Private (For-profit)",
  country: "Kenya",
  county: "Nairobi",
  town: "",
  address: "",
  contact: "",
  role: "",
  email: "",
  dial: "+254",
  phone: "",
  hims: "",
  claimsMonth: "",
  integration: "Not yet started",
  services: ["Outpatient", "Laboratory"],
  reg: "",
  kra: "",
  shif: "",
}

const optional = (
  <span className="text-[11.5px] font-normal text-muted-foreground">
    (optional)
  </span>
)

function toInput(f: SpForm): SpFormInput {
  return {
    name: f.name,
    type: f.type,
    cls: f.cls,
    tier: f.tier,
    ownership: f.ownership,
    country: f.country,
    county: f.county,
    town: f.town,
    address: f.address,
    contact: f.contact,
    role: f.role,
    email: f.email,
    phone: f.phone.trim() ? `${f.dial}${f.phone.trim()}` : "",
    hims: f.hims,
    claimsMonth: f.claimsMonth,
    integration: f.integration,
    services: f.services,
    reg: f.reg,
    kra: f.kra,
    shif: f.shif,
  }
}

function FormGrid({
  three,
  children,
}: {
  three?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-[18px] gap-y-[14px]",
        three ? "sm:grid-cols-3" : "sm:grid-cols-2"
      )}
    >
      {children}
    </div>
  )
}

function Section({
  title,
  desc,
  children,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {desc ? (
          <p className="mt-1 max-w-prose text-xs text-muted-foreground">
            {desc}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/**
 * Service-provider onboarding wizard (hi-fi `ProviderOnboard`), bound to
 * `POST /platform/service-providers` (create draft) → `PATCH …/{code}` (save
 * sections) → `POST …/{code}/submit`. The draft is created lazily on the first
 * save (once a name exists); documents upload to the live draft.
 */
export function ProviderOnboard({
  onBack,
  onDone,
}: {
  onBack: () => void
  onDone: (rec: ServiceProvider) => void
}) {
  const [step, setStep] = React.useState(0)
  const [form, setForm] = React.useState<SpForm>(SP_BASE)
  const [draftCode, setDraftCode] = React.useState<string | null>(null)
  const codeRef = React.useRef<string | null>(null)

  const createMut = useCreateProvider()
  const updateMut = useUpdateProvider()
  const submitMut = useSubmitProvider()
  const uploadMut = useUploadProviderDocument()
  const documentsQ = useProviderDocuments(draftCode ?? "", {
    enabled: !!draftCode,
  })

  const set = <K extends keyof SpForm>(k: K, v: SpForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))
  const cur = SPO_STEPS[step]
  const total = SPO_STEPS.length
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())
  const busy = createMut.isPending || updateMut.isPending || submitMut.isPending

  const status: Record<string, SectionStatus> = {
    profile:
      form.name.trim() && form.type && form.tier && form.cls && form.ownership
        ? "complete"
        : form.name.trim()
          ? "progress"
          : "todo",
    location:
      form.town.trim() && form.contact.trim() && emailOk
        ? "complete"
        : form.town.trim()
          ? "progress"
          : "todo",
    systems:
      form.hims.trim() && form.services.length
        ? "complete"
        : form.hims.trim() || form.services.length
          ? "progress"
          : "todo",
    registration:
      form.reg.trim() && form.kra.trim()
        ? "complete"
        : form.reg.trim() || form.kra.trim()
          ? "progress"
          : "todo",
    documents: "progress",
  }
  status.review = (["profile", "location", "systems", "registration"] as const).every(
    (k) => status[k] === "complete"
  )
    ? "complete"
    : "todo"

  const doneCount = SPO_STEPS.filter((s) => status[s.k] === "complete").length
  const next = () => step < total - 1 && setStep(step + 1)
  const back = () => step > 0 && setStep(step - 1)
  const toggleSvc = (s: string) =>
    set(
      "services",
      form.services.includes(s)
        ? form.services.filter((x) => x !== s)
        : [...form.services, s]
    )

  /** Create the draft (once a name exists) then PATCH the full form. Returns
     the draft code, or null when there's no name yet to create with. */
  const persist = async (): Promise<string | null> => {
    if (!form.name.trim()) return codeRef.current
    let c = codeRef.current
    if (!c) {
      const created = await createMut.mutateAsync(toInput(form))
      c = created.code
      codeRef.current = c
      setDraftCode(c)
    }
    await updateMut.mutateAsync({ code: c, input: toInput(form) })
    return c
  }

  const onContinue = async () => {
    try {
      await persist()
    } catch (e) {
      toast.error("Couldn’t save this section", {
        description: e instanceof Error ? e.message : undefined,
      })
      return
    }
    next()
  }
  const onSaveDraft = async () => {
    try {
      const c = await persist()
      toast(
        c
          ? `Progress saved to draft ${c}.`
          : "Enter the provider name to save this draft."
      )
    } catch (e) {
      toast.error("Couldn’t save draft", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }
  const onSaveExit = async () => {
    try {
      await persist()
    } catch {
      /* surfaced on the next explicit save */
    }
    onBack()
  }
  const onSubmit = async () => {
    let c: string | null
    try {
      c = await persist()
    } catch (e) {
      toast.error("Couldn’t save the draft", {
        description: e instanceof Error ? e.message : undefined,
      })
      return
    }
    if (!c) {
      toast.error("Enter the provider name before submitting.")
      return
    }
    submitMut.mutate(
      { code: c },
      {
        onSuccess: (rec) => onDone(rec),
        onError: (e) =>
          toast.error("Couldn’t submit for approval", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  /* ---- document upload: ensure a draft exists, then pick + upload a file --- */
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const pendingSlot = React.useRef<string | null>(null)
  const [uploadingSlot, setUploadingSlot] = React.useState<string | null>(null)

  const startUpload = async (slotKey: string) => {
    let c = codeRef.current
    if (!c) {
      try {
        c = await persist()
      } catch (e) {
        toast.error("Couldn’t create the draft", {
          description: e instanceof Error ? e.message : undefined,
        })
        return
      }
    }
    if (!c) {
      toast.error("Enter the provider name and save the draft before uploading.")
      return
    }
    pendingSlot.current = slotKey
    fileInputRef.current?.click()
  }
  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const slot = pendingSlot.current
    e.target.value = ""
    const c = codeRef.current
    if (!file || !slot || !c) return
    setUploadingSlot(slot)
    uploadMut.mutate(
      { code: c, docSlotKey: slot, file },
      {
        onSuccess: () => toast("Document uploaded — pending review."),
        onError: (err) =>
          toast.error("Upload failed", {
            description: err instanceof Error ? err.message : undefined,
          }),
        onSettled: () => setUploadingSlot(null),
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink label="All providers" onClick={onBack} />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={onFileChosen}
      />

      <Panel className="overflow-hidden">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Section navigation rail */}
          <aside className="border-b px-[18px] py-[22px] lg:border-r lg:border-b-0">
            <div className="text-[13px] font-semibold">New service provider</div>
            <div className="mt-[3px] mb-[18px] text-xs text-muted-foreground">
              Claim Clean-up onboarding · {total} sections
            </div>
            <div className="relative grid gap-0.5">
              {SPO_STEPS.map((s, i) => {
                const st = status[s.k]
                const active = i === step
                const dotCls =
                  st === "complete"
                    ? "border-brand bg-brand text-brand-foreground"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : st === "progress"
                        ? "border-warning bg-warning-subtle text-warning"
                        : "border-input bg-card text-muted-foreground"
                return (
                  <button
                    key={s.k}
                    type="button"
                    onClick={() => setStep(i)}
                    className={cn(
                      "relative flex w-full items-start gap-3 rounded-[9px] px-2 py-[9px] text-left transition-colors",
                      active ? "bg-primary/[0.07]" : "hover:bg-muted/60"
                    )}
                  >
                    {i < total - 1 ? (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-[33px] -bottom-0.5 left-[21px] w-[1.5px]",
                          st === "complete" ? "bg-brand" : "bg-border"
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "mono relative z-[1] grid size-[26px] shrink-0 place-items-center rounded-full border-[1.5px] text-[12px] font-semibold",
                        dotCls
                      )}
                    >
                      {st === "complete" ? (
                        <CheckIcon className="size-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[13px] leading-[1.3]",
                          active ? "font-semibold text-primary" : "font-medium"
                        )}
                      >
                        {s.l}
                      </span>
                      <span className="mt-px block text-[11.5px] text-muted-foreground">
                        {s.d}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3">
              <div className="flex items-start gap-2.5 rounded-[9px] bg-info-subtle px-3 py-2.5 text-[11.5px] leading-normal text-info-subtle-foreground [&_b]:font-semibold">
                <HiIcon name="info" className="mt-px size-[15px] shrink-0" />
                <span>
                  Complete sections in any order. On submit the provider is
                  created <b>Inactive</b> and sent to an Approver.
                </span>
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <div className="flex min-w-0 flex-col">
            {/* Status strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-3.5">
              <HiIcon name="clock" className="size-[15px] text-muted-foreground" />
              <span className="text-[13px] font-semibold">
                {draftCode ? `Draft ${draftCode}` : "Unsaved draft"}
              </span>
              <span className="text-xs text-muted-foreground">
                {draftCode
                  ? "Saved to server — each save persists your progress"
                  : "Complete the provider name to save this draft"}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {doneCount}/{total} sections complete
                </span>
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${(doneCount / total) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={hifiBtn}
                  disabled={busy}
                  onClick={onSaveExit}
                >
                  <HiIcon name="clock" data-icon="inline-start" />
                  Save &amp; exit
                </Button>
              </div>
            </div>

            {/* Section header */}
            <div className="px-5 pt-5 pb-1">
              <div className="eyebrow text-[10px]">
                SECTION {step + 1} OF {total}
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                {cur.l}
              </h2>
              <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                {spIntro[cur.k]}
              </p>
            </div>

            {/* Section body */}
            <div className="px-5 py-5">
              {cur.k === "profile" && <StepProfile form={form} set={set} />}
              {cur.k === "location" && (
                <StepLocation form={form} set={set} emailOk={emailOk} />
              )}
              {cur.k === "systems" && (
                <StepSystems form={form} set={set} toggleSvc={toggleSvc} />
              )}
              {cur.k === "registration" && (
                <StepRegistration form={form} set={set} />
              )}
              {cur.k === "documents" && (
                <StepDocuments
                  hasDraft={!!draftCode}
                  documents={documentsQ.data ?? []}
                  uploadingSlot={uploadingSlot}
                  onUpload={startUpload}
                />
              )}
              {cur.k === "review" && (
                <StepReview form={form} status={status} setStep={setStep} />
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center gap-2 border-t px-5 py-3.5">
              {step > 0 ? (
                <Button
                  variant="outline"
                  className={hifiBtn}
                  disabled={busy}
                  onClick={back}
                >
                  <HiIcon name="chevronLeft" data-icon="inline-start" />
                  Back
                </Button>
              ) : null}
              <span className="flex-1" />
              <Button
                variant="ghost"
                className={hifiBtn}
                disabled={busy}
                onClick={onSaveDraft}
              >
                {busy ? (
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <HiIcon name="clock" data-icon="inline-start" />
                )}
                Save draft
              </Button>
              {step < total - 1 ? (
                <Button className={hifiBtn} disabled={busy} onClick={onContinue}>
                  Continue
                  <HiIcon name="arrowRight" data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  className={cn(
                    hifiBtn,
                    "bg-brand text-brand-foreground hover:bg-brand/90"
                  )}
                  disabled={busy || submitMut.isPending}
                  onClick={onSubmit}
                >
                  {submitMut.isPending ? (
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <HiIcon name="send" data-icon="inline-start" />
                  )}
                  Submit for approval
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

type StepProps = {
  form: SpForm
  set: <K extends keyof SpForm>(k: K, v: SpForm[K]) => void
}

/* ---- Step 1: Provider profile ------------------------------------------ */
function StepProfile({ form, set }: StepProps) {
  return (
    <div className="flex flex-col gap-[26px]">
      <Section title="Facility identity">
        <div className="flex flex-col gap-[14px]">
          <MField label="Service provider name" required>
            <Input
              className={fieldInput}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Aga Khan University Hospital"
            />
          </MField>
          <FormGrid three>
            <MField label="Provider type" required>
              <ConsoleSelect
                className={fieldInput}
                value={form.type}
                onChange={(v) => set("type", v)}
                options={SP_TYPES}
              />
            </MField>
            <MField label="Provider classification" required>
              <ConsoleSelect
                className={fieldInput}
                value={form.cls}
                onChange={(v) => set("cls", v)}
                options={SP_CLASSES}
              />
            </MField>
            <MField label="Ownership" required>
              <ConsoleSelect
                className={fieldInput}
                value={form.ownership}
                onChange={(v) => set("ownership", v)}
                options={SP_OWNERSHIP}
              />
            </MField>
          </FormGrid>
        </div>
      </Section>

      <Section
        title="Provider tier"
        desc="Ranking bucket by claim volume — drives prioritisation."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {SP_TIERS.map((t) => {
            const on = form.tier === t.v
            return (
              <button
                key={t.v}
                type="button"
                onClick={() => set("tier", t.v)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all",
                  on
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-[16px] place-items-center rounded-full border-[1.5px]",
                      on ? "border-primary" : "border-input"
                    )}
                  >
                    {on ? (
                      <span className="size-[7px] rounded-full bg-primary" />
                    ) : null}
                  </span>
                  <b className="text-[13px] font-semibold">{t.v}</b>
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  {t.d}
                </span>
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ---- Step 2: Location & contact ---------------------------------------- */
function StepLocation({
  form,
  set,
  emailOk,
}: StepProps & { emailOk: boolean }) {
  return (
    <div className="flex flex-col gap-[26px]">
      <Section title="Physical location">
        <FormGrid>
          <MField label="Country" required>
            <ConsoleSelect
              className={fieldInput}
              value={form.country}
              onChange={(v) => set("country", v)}
              options={EA_COUNTRIES}
            />
          </MField>
          <MField label="County / region" required>
            <ConsoleSelect
              className={fieldInput}
              value={form.county}
              onChange={(v) => set("county", v)}
              options={KE_COUNTIES}
            />
          </MField>
          <MField label="Town / city" required>
            <Input
              className={fieldInput}
              value={form.town}
              onChange={(e) => set("town", e.target.value)}
              placeholder="e.g. Parklands"
            />
          </MField>
          <MField className="sm:col-span-2" label="Physical address" required>
            <Input
              className={fieldInput}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, building, P.O. Box"
            />
          </MField>
        </FormGrid>
      </Section>

      <Section
        title="Primary contact"
        desc="The person we coordinate claims and integration with."
      >
        <FormGrid>
          <MField label="Contact name" required>
            <Input
              className={fieldInput}
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="Full name"
            />
          </MField>
          <MField label={<>Role / title {optional}</>}>
            <Input
              className={fieldInput}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="e.g. Claims Officer"
            />
          </MField>
          <MField
            label="Email"
            required
            hint={form.email && !emailOk ? "Enter a valid email address." : false}
            hintTone="error"
          >
            <Input
              className={fieldInput}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@facility.co.ke"
            />
          </MField>
          <MField label={<>Phone {optional}</>}>
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <ConsoleSelect
                className={fieldInput}
                value={form.dial}
                onChange={(v) => set("dial", v)}
                options={["+254", "+255", "+256", "+250"]}
              />
              <Input
                className={fieldInput}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="712 345 678"
              />
            </div>
          </MField>
        </FormGrid>
      </Section>
    </div>
  )
}

/* ---- Step 3: Systems & integration ------------------------------------- */
function StepSystems({
  form,
  set,
  toggleSvc,
}: StepProps & { toggleSvc: (s: string) => void }) {
  return (
    <div className="flex flex-col gap-[26px]">
      <Section title="Health information system">
        <FormGrid three>
          <MField label="HIMS name" required>
            <Input
              className={fieldInput}
              value={form.hims}
              onChange={(e) => set("hims", e.target.value)}
              placeholder="e.g. Care2x, OpenMRS"
            />
          </MField>
          <MField label={<>Claims processed / month {optional}</>}>
            <div className="relative">
              <Input
                className={cn(fieldInput, "pr-11")}
                type="number"
                min={0}
                value={form.claimsMonth}
                onChange={(e) => set("claimsMonth", e.target.value)}
                placeholder="0"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-muted-foreground">
                /mo
              </span>
            </div>
          </MField>
          <MField label={<>Integration status {optional}</>}>
            <ConsoleSelect
              className={fieldInput}
              value={form.integration}
              onChange={(v) => set("integration", v)}
              options={SP_INTEGRATION}
            />
          </MField>
        </FormGrid>
      </Section>

      <Section
        title={
          <>
            Services offered <span className="text-destructive">*</span>
          </>
        }
        desc="Used to validate the claim lines a provider can submit."
      >
        <div className="flex flex-wrap gap-2">
          {SP_SERVICES.map((s) => {
            const on = form.services.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSvc(s)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors [&>svg]:size-[13px]",
                  on
                    ? "border-primary bg-primary/[0.08] font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <HiIcon name={on ? "check" : "plus"} />
                {s}
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ---- Step 4: Registration ---------------------------------------------- */
function StepRegistration({ form, set }: StepProps) {
  return (
    <div className="flex flex-col gap-[26px]">
      <Section title="Regulatory & tax">
        <FormGrid three>
          <MField label="Facility registration no. (KMPDC / PPB)" required>
            <Input
              className={cn(fieldInput, "mono text-[12.5px]")}
              value={form.reg}
              onChange={(e) => set("reg", e.target.value)}
              placeholder="e.g. KMPDC/FAC/0142"
            />
          </MField>
          <MField label="KRA PIN" required>
            <Input
              className={cn(fieldInput, "mono text-[12.5px]")}
              value={form.kra}
              onChange={(e) => set("kra", e.target.value)}
              placeholder="e.g. P051200345K"
            />
          </MField>
          <MField label={<>SHIF / SHA accreditation {optional}</>}>
            <Input
              className={cn(fieldInput, "mono text-[12.5px]")}
              value={form.shif}
              onChange={(e) => set("shif", e.target.value)}
              placeholder="e.g. SHA-AC-004821"
            />
          </MField>
        </FormGrid>
      </Section>
      <Note tone="info" icon={<HiIcon name="info" />}>
        These identifiers are used to verify the facility and to settle cleaned
        claims. They can be edited later by an admin.
      </Note>
    </div>
  )
}

/* ---- Step 5: Documents ------------------------------------------------- */
function StepDocuments({
  hasDraft,
  documents,
  uploadingSlot,
  onUpload,
}: {
  hasDraft: boolean
  documents: SpDocument[]
  uploadingSlot: string | null
  onUpload: (slotKey: string) => void
}) {
  const byType = new Map(documents.map((d) => [d.docType, d]))
  return (
    <div className="flex flex-col gap-[18px]">
      <Note tone="info" icon={<HiIcon name="info" />}>
        {hasDraft
          ? "Upload the signed contract and supporting documents. Files are stored as Pending review and checked by the Approver."
          : "Enter the provider name and save the draft first — documents attach to the saved draft."}
      </Note>
      <div className="flex flex-col gap-2.5">
        {SP_DOCS.map((d) => {
          const doc = byType.get(DOC_TYPE_TO_ENUM[d.k])
          const done = !!doc?.uploaded
          const uploading = uploadingSlot === d.k
          return (
            <div
              key={d.k}
              className={cn(
                "flex items-center gap-3 rounded-[10px] border px-3.5 py-3",
                done && "bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-[9px] [&>svg]:size-[17px]",
                  done
                    ? "bg-success-subtle text-success-subtle-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <HiIcon name={done ? "checkCircle" : "upload"} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">
                  {d.l}
                  {d.req ? <span className="text-destructive"> *</span> : null}
                </div>
                <div className="truncate text-[11.5px] text-muted-foreground">
                  {done
                    ? `${doc?.fileName ?? "Uploaded"} · pending review`
                    : d.req
                      ? "Required — not uploaded"
                      : "Optional — not uploaded"}
                </div>
              </div>
              {done ? (
                <div className="flex items-center gap-2">
                  <MiniBadge tone="warning">Pending review</MiniBadge>
                  <Button
                    variant="outline"
                    size="sm"
                    className={hifiBtn}
                    disabled={uploading}
                    onClick={() => onUpload(d.k)}
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className={hifiBtn}
                  disabled={uploading}
                  onClick={() => onUpload(d.k)}
                >
                  {uploading ? (
                    <Loader2Icon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <HiIcon name="upload" data-icon="inline-start" />
                  )}
                  Upload
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---- Step 6: Review ---------------------------------------------------- */
function Meta({ pairs }: { pairs: [string, React.ReactNode][] }) {
  return (
    <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {pairs.map(([k, v]) => (
        <div key={k} className="flex flex-col gap-0.5">
          <div className="text-[11px] text-muted-foreground">{k}</div>
          <div className="text-[13px] text-foreground">
            {v || <span className="text-muted-foreground">Not set</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function StepReview({
  form,
  status,
  setStep,
}: {
  form: SpForm
  status: Record<string, SectionStatus>
  setStep: (n: number) => void
}) {
  const SECS = [
    { key: "profile", l: "Provider profile", step: 0 },
    { key: "location", l: "Location & contact", step: 1 },
    { key: "systems", l: "Systems & integration", step: 2 },
    { key: "registration", l: "Registration", step: 3 },
    { key: "documents", l: "Documents", step: 4 },
  ]
  const required = ["profile", "location", "systems", "registration"]
  const doneN = required.filter((k) => status[k] === "complete").length
  const allDone = doneN === required.length

  const bodyFor = (key: string) => {
    if (key === "profile")
      return (
        <Meta
          pairs={[
            ["Provider name", form.name],
            ["Type", form.type],
            ["Classification", form.cls],
            ["Tier", form.tier],
            ["Ownership", form.ownership],
          ]}
        />
      )
    if (key === "location")
      return (
        <Meta
          pairs={[
            ["Location", [form.town, form.county, form.country].filter(Boolean).join(", ")],
            ["Address", form.address],
            ["Primary contact", form.contact],
            ["Role", form.role],
            ["Email", form.email],
            ["Phone", form.phone ? `${form.dial} ${form.phone}` : ""],
          ]}
        />
      )
    if (key === "systems")
      return (
        <>
          <Meta
            pairs={[
              ["HIMS", form.hims],
              ["Claims / month", form.claimsMonth ? Number(form.claimsMonth).toLocaleString() : ""],
              ["Integration", form.integration],
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {form.services.map((s) => (
              <MiniBadge key={s} tone="neutral">
                <HiIcon name="check" className="size-[11px]" />
                {s}
              </MiniBadge>
            ))}
          </div>
        </>
      )
    if (key === "registration")
      return (
        <Meta
          pairs={[
            ["Facility reg. no.", form.reg],
            ["KRA PIN", form.kra],
            ["SHIF / SHA", form.shif],
          ]}
        />
      )
    return (
      <p className="text-[12.5px] text-muted-foreground">
        Documents are uploaded in the Documents section and checked by the
        Approver after submission.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div
        className={cn(
          "flex items-center gap-3 rounded-[11px] border px-4 py-3 text-[12.5px] leading-normal [&_b]:font-semibold [&>svg]:size-4 [&>svg]:shrink-0",
          allDone
            ? "border-success/35 bg-success-subtle/50 text-success-subtle-foreground"
            : "border-warning/35 bg-warning-subtle/50 text-warning-subtle-foreground"
        )}
      >
        <HiIcon name={allDone ? "checkCircle" : "clock"} />
        <span className="flex-1">
          {allDone ? (
            <>
              All required sections complete. On submit, the provider is created
              as <b>Pending review</b> and activated only after an Approver
              approves.
            </>
          ) : (
            <>
              <b>
                {doneN} of {required.length}
              </b>{" "}
              required sections done. Complete the rest to submit, or save a
              draft.
            </>
          )}
        </span>
        <span className="mono font-semibold">
          {doneN}/{required.length}
        </span>
      </div>

      {SECS.map((s) => (
        <div key={s.key} className="rounded-xl border">
          <div className="flex items-center gap-2.5 border-b px-4 py-2.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                status[s.key] === "complete"
                  ? "bg-success"
                  : status[s.key] === "progress"
                    ? "bg-warning"
                    : "bg-muted-foreground/40"
              )}
            />
            <h4 className="flex-1 text-[13px] font-semibold">{s.l}</h4>
            <button
              type="button"
              onClick={() => setStep(s.step)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline [&>svg]:size-3"
            >
              <HiIcon name="pencil" />
              Edit
            </button>
          </div>
          <div className="px-4 py-3.5">{bodyFor(s.key)}</div>
        </div>
      ))}

      <Note tone="info" icon={<HiIcon name="info" />}>
        On submit, a unique account ID (<b>SP-…</b>) is generated and the
        provider is routed to an Approver. It stays Inactive until approved.
      </Note>
    </div>
  )
}
