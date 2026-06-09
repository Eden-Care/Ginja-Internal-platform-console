import {
  DatabaseIcon,
  LayersIcon,
  LockIcon,
  ServerIcon,
  ShieldIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { REGIONS, type OnboardingForm } from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import {
  ConsoleSelect,
  Field,
  FormGrid,
  FormSection,
  RadioCards,
} from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"

const TIERS = [
  {
    v: "shared",
    icon: <DatabaseIcon />,
    title: "Shared",
    desc: "Logical isolation, shared infra",
  },
  {
    v: "dedicated",
    icon: <LayersIcon />,
    title: "Dedicated schema",
    desc: "Schema per tenant on shared clusters",
  },
  {
    v: "isolated",
    icon: <ShieldIcon />,
    title: "Isolated",
    desc: "Dedicated namespace, schema & topics",
  },
]

const REGION_OPTS = REGIONS.filter((r) => r.status === "Active").map((r) => ({
  value: r.id,
  label: `${r.id} · ${r.city}, ${r.country}`,
}))

export function StepTechnical({
  form,
  set,
  subTaken,
  subReserved,
}: {
  form: OnboardingForm
  set: SetField
  subTaken: boolean
  subReserved: boolean
}) {
  const region = REGIONS.find((r) => r.id === form.region)
  const subErr = subTaken || subReserved

  return (
    <div className="flex flex-col gap-7">
      <Note tone="info" icon={<ServerIcon />}>
        Infrastructure &amp; identity settings — typically completed by a{" "}
        <b>Platform Engineer</b>. This section can be filled in independently of
        the basic profile.
      </Note>

      <FormSection
        title="Tenant subdomain"
        desc="The tenant's live URL. Lowercase and hyphens only; reserved names are blocked."
      >
        <FormGrid>
          <Field
            label="Subdomain"
            required
            className="sm:col-span-2"
            hintTone={subErr ? "error" : "success"}
            hint={
              subReserved
                ? `"${form.subdomain}" is reserved. Choose another.`
                : subTaken
                  ? `"${form.subdomain}" is taken. Try ${form.subdomain}-za or ${form.subdomain}-health.`
                  : `✓ ${form.subdomain}.ginja.ai is available · lowercase, hyphens only`
            }
          >
            <div
              className={cn(
                "flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-ring/50",
                subErr && "border-destructive"
              )}
            >
              <span className="shrink-0 pl-3 text-[13px] text-muted-foreground">
                https://
              </span>
              <input
                value={form.subdomain}
                onChange={(e) =>
                  set(
                    "subdomain",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                  )
                }
                className="h-8 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
              />
              <span className="shrink-0 pr-3 text-[13px] text-muted-foreground">
                .ginja.ai
              </span>
            </div>
          </Field>
          <Field
            label="Custom domain"
            optional
            className="sm:col-span-2"
            hint={`Add later via a CNAME to ${form.subdomain}.ginja.ai. TLS is auto-provisioned.`}
          >
            <Input
              placeholder="e.g. health.cic.co.ke"
              value={form.customDomain}
              onChange={(e) => set("customDomain", e.target.value)}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection title="Data residency & deployment">
        <FormGrid>
          <Field
            label="Data residency region"
            required
            hint="All tenant data is provisioned and pinned to this region."
          >
            <ConsoleSelect
              value={form.region}
              onChange={(v) => set("region", v)}
              options={REGION_OPTS}
            />
          </Field>
          <Field
            label="Deployment cluster"
            hint="Derived from the residency region."
          >
            <div className="flex h-8 items-center gap-2 rounded-lg bg-muted px-3 text-[13px] text-muted-foreground">
              <ServerIcon className="size-3.5" />
              {region
                ? `${region.city} cluster · ${region.id}`
                : "Select a region"}
            </div>
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Isolation tier"
        desc="How tenant-scoped resources are provisioned at activation."
      >
        <RadioCards
          value={form.isolation}
          options={TIERS}
          onChange={(v) => set("isolation", v)}
        />
      </FormSection>

      <FormSection title="Identity & access">
        <FormGrid>
          <Field
            label="Single sign-on"
            hint="Tenant Admins can configure SSO themselves later."
          >
            <ConsoleSelect
              value={form.sso}
              onChange={(v) => set("sso", v)}
              options={["None", "SAML 2.0", "OIDC / OpenID Connect"]}
            />
          </Field>
          <Field
            label="MFA enforcement"
            hint="Set globally in Platform settings → Security."
          >
            <div className="flex h-8 items-center gap-2 rounded-lg bg-muted px-3 text-[13px] text-muted-foreground">
              <LockIcon className="size-3.5" />
              Required · inherited from platform policy
            </div>
          </Field>
        </FormGrid>
      </FormSection>
    </div>
  )
}
