import * as React from "react"
import {
  AlertTriangleIcon,
  Building2Icon,
  BriefcaseIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MailIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { REGIONS, type OnboardingForm } from "@/lib/console-data"
import { emailOk } from "@/lib/console-format"
import type { SetField } from "../use-onboarding-form"
import {
  useSubdomainCheck,
  useTenantLookup,
} from "@/features/payers/use-onboarding"
import {
  ConsoleSelect,
  Field,
  FormGrid,
  FormSection,
  RadioCards,
} from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"

const COUNTRIES = [
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Ethiopia",
  "Nigeria",
  "South Africa",
]

const REGION_OPTS = REGIONS.filter((r) => r.status === "Active").map((r) => ({
  value: r.id,
  label: `${r.id} · ${r.city}`,
}))

const TYPES = [
  {
    v: "Insurer",
    icon: <ShieldIcon />,
    title: "Insurer",
    desc: "Licensed underwriter bearing risk",
  },
  {
    v: "TPA",
    icon: <BriefcaseIcon />,
    title: "TPA",
    desc: "Administers benefits, no risk",
  },
  {
    v: "Self-managed Scheme",
    icon: <Building2Icon />,
    title: "Self-managed Scheme",
    desc: "Self-funded own benefits",
  },
]

export function StepPrimary({
  form,
  set,
  showErrors = false,
  resume = false,
}: {
  form: OnboardingForm
  set: SetField
  /** Reveal field-level validation. False until the user tries to advance, so a
     freshly opened (blank) form isn't shown all-red. */
  showErrors?: boolean
  /** Resume mode: primary isn't re-submitted, so suppress the duplicate /
     subdomain self-match warnings (the draft matches its own record). */
  resume?: boolean
}) {
  const c = form.contacts
  const c0 = c[0] ?? { name: "", email: "", role: "", phone: "" }
  const setContact = (i: number, k: string, v: string) =>
    set(
      "contacts",
      c.map((x, xi) => (xi === i ? { ...x, [k]: v } : x))
    )
  const addContact = () => {
    if (c.length < 2)
      set("contacts", [...c, { name: "", email: "", role: "", phone: "" }])
  }
  const removeContact = (i: number) =>
    set(
      "contacts",
      c.filter((_, xi) => xi !== i)
    )

  // Live API checks — deferred so we don't fetch on every keystroke.
  const deferredLegal = React.useDeferredValue(form.legal)
  const deferredSub = React.useDeferredValue(form.subdomain)
  const lookup = useTenantLookup(deferredLegal)
  const subCheck = useSubdomainCheck(deferredSub)
  const dupe = !resume && lookup.data?.found ? lookup.data.tenant : null
  const subResult = form.subdomain.trim() ? subCheck.data : undefined
  const subTaken =
    !resume && subResult && (!subResult.available || !subResult.valid)

  // Gated on showErrors: until the user tries to advance, every flag is false,
  // so errCount is 0 (banner hidden) and no field shows a red border or hint.
  const err = {
    legal: showErrors && !form.legal.trim(),
    trading: showErrors && !form.trading.trim(),
    tax: showErrors && !form.tax.trim(),
    c0name: showErrors && !(c0.name || "").trim(),
    c0email: showErrors && !emailOk(c0.email),
    address: showErrors && !(form.address || "").trim(),
    subdomain: showErrors && !form.subdomain.trim(),
  }
  const errCount = Object.values(err).filter(Boolean).length

  return (
    <div className="flex flex-col gap-7">
      {errCount > 0 ? (
        <Note tone="err" icon={<AlertTriangleIcon />}>
          <b>
            {errCount} {errCount > 1 ? "fields need" : "field needs"} attention.
          </b>{" "}
          Fix the highlighted items below before this section is complete.
        </Note>
      ) : null}

      <FormSection title="Legal entity">
        <FormGrid>
          <Field
            label="Legal entity name"
            required
            hint={err.legal ? "Legal entity name is required." : undefined}
            hintTone="error"
          >
            <Input
              value={form.legal}
              aria-invalid={err.legal}
              onChange={(e) => set("legal", e.target.value)}
            />
          </Field>
          <Field
            label="Trading name"
            required
            hint={err.trading ? "Trading name is required." : undefined}
            hintTone="error"
          >
            <Input
              value={form.trading}
              aria-invalid={err.trading}
              onChange={(e) => set("trading", e.target.value)}
            />
          </Field>
          <Field label="Primary country of operation" required>
            <ConsoleSelect
              value={form.country}
              onChange={(v) => set("country", v)}
              options={COUNTRIES}
            />
          </Field>
          <Field
            label="Tax / VAT number"
            required
            hint={
              err.tax ? "Tax / VAT number is required for invoicing." : undefined
            }
            hintTone="error"
          >
            <Input
              placeholder="e.g. KRA-P051234567X"
              value={form.tax}
              aria-invalid={err.tax}
              onChange={(e) => set("tax", e.target.value)}
            />
          </Field>
        </FormGrid>

        {dupe ? (
          <div className="mt-3">
            <Note tone="warn" icon={<AlertTriangleIcon />}>
              An existing tenant <b>{dupe.legalEntityName}</b> ({dupe.tenantCode}
              {dupe.country ? ` · ${dupe.country}` : ""}
              {dupe.payerStatus ? ` · ${dupe.payerStatus}` : ""}) matches this
              name. Confirm this is a distinct entity before continuing.
            </Note>
          </div>
        ) : null}
      </FormSection>

      <FormSection
        title="Environment"
        desc="The subdomain and data-residency region for this tenant. Required to submit."
      >
        <FormGrid>
          <Field
            label="Subdomain"
            required
            hint={
              err.subdomain
                ? "Subdomain is required."
                : subResult && subResult.reserved
                  ? "This subdomain is reserved."
                  : subTaken
                    ? subResult?.suggestions?.length
                      ? `Taken — try: ${subResult.suggestions.slice(0, 3).join(", ")}`
                      : "This subdomain isn’t available."
                    : undefined
            }
            hintTone="error"
          >
            <div
              className={cn(
                "flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-ring/50",
                (err.subdomain || subTaken) && "border-destructive"
              )}
            >
              <input
                value={form.subdomain}
                placeholder="acme-health"
                onChange={(e) =>
                  set("subdomain", e.target.value.toLowerCase().trim())
                }
                className="h-8 min-w-0 flex-1 rounded-l-lg bg-transparent px-3 text-sm outline-none"
              />
              <span className="flex shrink-0 items-center gap-1 px-2.5 text-[13px] text-muted-foreground">
                {form.subdomain.trim() && subCheck.isFetching ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : subResult && !subTaken && !subResult.reserved ? (
                  <CheckCircle2Icon className="size-3.5 text-success" />
                ) : null}
                .ginja.ai
              </span>
            </div>
          </Field>
          <Field label="Data-residency region" required>
            <ConsoleSelect
              value={form.region}
              onChange={(v) => set("region", v)}
              options={REGION_OPTS}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Tenant type"
        desc="Version 1 focuses on Insurer onboarding."
      >
        <RadioCards
          value={form.type}
          options={TYPES}
          onChange={(v) => set("type", v as OnboardingForm["type"])}
        />
      </FormSection>

      <FormSection
        title="Contact information"
        desc="The Primary Tenant Admin receives the activation invitation when the account goes live. You can add one backup contact (maximum 2)."
      >
        <div className="flex flex-col gap-3">
          {c.map((ct, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold tracking-wide uppercase",
                    i === 0
                      ? "bg-primary/12 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i === 0 ? "Primary Tenant Admin" : "Additional contact"}
                </span>
                {i === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <MailIcon className="size-3" />
                    Receives activation invite
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove contact"
                    onClick={() => removeContact(i)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
              <FormGrid>
                <Field
                  label="Full name"
                  required={i === 0}
                  hint={
                    i === 0 && err.c0name
                      ? "Primary contact name is required."
                      : undefined
                  }
                  hintTone="error"
                >
                  <Input
                    value={ct.name}
                    placeholder="e.g. Grace Achieng"
                    aria-invalid={i === 0 && err.c0name}
                    onChange={(e) => setContact(i, "name", e.target.value)}
                  />
                </Field>
                <Field
                  label="Email"
                  required={i === 0}
                  hint={
                    i === 0 && err.c0email
                      ? "Enter a valid email address (e.g. name@company.com)."
                      : undefined
                  }
                  hintTone="error"
                >
                  <Input
                    type="email"
                    value={ct.email}
                    placeholder="name@company.com"
                    aria-invalid={i === 0 && err.c0email}
                    onChange={(e) => setContact(i, "email", e.target.value)}
                  />
                </Field>
                <Field label="Role / title" optional>
                  <Input
                    value={ct.role}
                    placeholder="e.g. Chief Executive Officer"
                    onChange={(e) => setContact(i, "role", e.target.value)}
                  />
                </Field>
                <Field label="Phone" optional>
                  <Input
                    value={ct.phone}
                    placeholder="+254 …"
                    onChange={(e) => setContact(i, "phone", e.target.value)}
                  />
                </Field>
              </FormGrid>
            </div>
          ))}

          {c.length < 2 ? (
            <button
              type="button"
              onClick={addContact}
              className="flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-[13px] font-medium transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <PlusIcon className="size-4" />
              Add another contact
              <span className="text-xs font-normal text-muted-foreground">
                {2 - c.length} slot left
              </span>
            </button>
          ) : (
            <div className="pl-0.5 text-[11.5px] text-muted-foreground">
              Maximum of 2 contacts reached — remove one to change it.
            </div>
          )}
        </div>

        <FormGrid className="mt-4">
          <Field
            label="Primary registered address"
            required
            className="sm:col-span-2"
            hint={
              err.address
                ? "Primary address is required for KYB and correspondence."
                : undefined
            }
            hintTone="error"
          >
            <Input
              value={form.address}
              placeholder="Building, street, city, country"
              aria-invalid={err.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Official website" optional className="sm:col-span-2">
            <Input
              value={form.website}
              placeholder="www.example.com"
              onChange={(e) => set("website", e.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>
    </div>
  )
}
