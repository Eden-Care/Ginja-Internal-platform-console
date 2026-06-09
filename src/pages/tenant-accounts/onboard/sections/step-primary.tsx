import {
  AlertTriangleIcon,
  Building2Icon,
  BriefcaseIcon,
  ExternalLinkIcon,
  MailIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { OnboardingForm } from "@/lib/console-data"
import { emailOk, findDuplicates } from "@/lib/console-format"
import type { SetField } from "../use-onboarding-form"
import {
  ConsoleSelect,
  Field,
  FormGrid,
  FormSection,
  RadioCards,
} from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { StatusPill } from "@/components/console/status-pill"

const COUNTRIES = [
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Ethiopia",
  "Nigeria",
  "South Africa",
]

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
}: {
  form: OnboardingForm
  set: SetField
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

  const err = {
    legal: !form.legal.trim(),
    trading: !form.trading.trim(),
    tax: !form.tax.trim(),
    c0name: !(c0.name || "").trim(),
    c0email: !emailOk(c0.email),
    address: !(form.address || "").trim(),
  }
  const errCount = Object.values(err).filter(Boolean).length
  const matches = findDuplicates(form.legal, form.country)

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
              err.tax
                ? "Tax / VAT number is required for invoicing."
                : undefined
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

        {matches.length > 0 ? (
          <div className="mt-3">
            <Note tone="warn" icon={<AlertTriangleIcon />}>
              {matches.length} existing Tenant{matches.length > 1 ? "s" : ""}{" "}
              with a similar legal name in <b>{form.country}</b>{" "}
              {matches.length > 1 ? "were" : "was"} found. Confirm this is a
              distinct entity before continuing.
            </Note>
            <div className="mt-2 overflow-hidden rounded-xl border border-warning/40">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0"
                >
                  <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-warning-subtle text-xs font-bold text-warning-subtle-foreground">
                    {m.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{m.name}</div>
                    <div className="mono text-[11.5px] text-muted-foreground">
                      {m.id} · {m.type} · {m.country}
                    </div>
                  </div>
                  <StatusPill status={m.status} />
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    View details
                    <ExternalLinkIcon className="size-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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
