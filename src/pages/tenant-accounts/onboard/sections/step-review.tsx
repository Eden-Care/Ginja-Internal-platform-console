import * as React from "react"
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  CheckIcon,
  MinusIcon,
  PencilIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DOC_CATEGORY_LABEL,
  REQUIRED_DOC_CATEGORIES,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import type { WizStatus } from "@/lib/console-format"
import { useModuleCatalogue } from "@/features/registry/use-module-catalogue"
import { useTenantPricingOptions } from "@/features/pricing/use-pricing-structures"
import { useMembers } from "@/features/access/use-members"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import {
  toOwnerOption,
  type OwnerOption,
} from "@/pages/tenant-accounts/components/owner-select"

const STEP_BY_KEY: Record<string, number> = {
  primary: 0,
  secondary: 1,
  modules: 2,
  billing: 3,
  documents: 4,
}

const STATUS_BADGE: Record<
  WizStatus,
  { tone: "success" | "warning" | "neutral"; label: string }
> = {
  complete: { tone: "success", label: "Complete" },
  progress: { tone: "warning", label: "In progress" },
  todo: { tone: "neutral", label: "Not started" },
}

function ReviewSection({
  title,
  sectionKey,
  status,
  owner,
  setStep,
  children,
}: {
  title: string
  sectionKey: WizStepKey
  status: Record<WizStepKey, WizStatus>
  owner: OwnerOption | null
  setStep: (n: number) => void
  children: React.ReactNode
}) {
  const badge = STATUS_BADGE[status[sectionKey]]
  return (
    <div className="rounded-xl border">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <h4 className="text-[13.5px] font-semibold">{title}</h4>
        <MiniBadge tone={badge.tone}>{badge.label}</MiniBadge>
        <Tagpill className="text-[10.5px]">
          {owner ? (
            <>
              <AssigneeAvatar
                name={owner.name}
                className="size-[15px] text-[9px]"
              />
              {owner.name}
            </>
          ) : (
            "Unassigned"
          )}
        </Tagpill>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setStep(STEP_BY_KEY[sectionKey])}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] text-muted-foreground">{k}</div>
          <div className="text-[13px]">{v}</div>
        </div>
      ))}
    </div>
  )
}

export function StepReview({
  form,
  status,
  assignees,
  setStep,
}: {
  form: OnboardingForm
  status: Record<WizStepKey, WizStatus>
  assignees: Record<WizStepKey, string | null>
  setStep: (n: number) => void
}) {
  const { data: modules } = useModuleCatalogue()
  const { data: structures } = useTenantPricingOptions()
  const { data: membersPage } = useMembers({ status: "ACTIVE" })
  const ownerByEmail = React.useMemo(() => {
    const m = new Map<string, OwnerOption>()
    for (const mb of membersPage?.items ?? []) m.set(mb.email, toOwnerOption(mb))
    return m
  }, [membersPage])
  const resolveOwner = (email: string | null): OwnerOption | null =>
    email ? ownerByEmail.get(email) ?? { email, name: email, roleLabel: null } : null
  const catByCode = new Map((modules ?? []).map((m) => [m.code, m]))
  const modCodes = Object.keys(form.modules)
  /** "Module" or "Module · 2/3" when only some sub-modules are entitled. */
  const moduleLabel = (code: string) => {
    const cat = catByCode.get(code)
    const name = cat?.name ?? code
    const total = cat?.subs.length ?? 0
    const picked = form.modules[code]?.length ?? 0
    if (total && picked && picked < total) return `${name} · ${picked}/${total}`
    return name
  }
  const structure = (structures ?? []).find(
    (s) => s.id === form.pricingStructureId
  )
  const allDone = (Object.values(status) as WizStatus[]).every(
    (v) => v === "complete"
  )
  const sectionProps = { status, setStep }

  return (
    <div className="flex flex-col gap-4">
      <Note
        tone={allDone ? "ok" : "warn"}
        icon={allDone ? <CheckCircle2Icon /> : <AlertTriangleIcon />}
      >
        {allDone ? (
          <span>
            Everything looks complete. On submit,{" "}
            <b>
              {1 + form.secondaries.length} tenant{" "}
              {form.secondaries.length === 0 ? "record" : "records"}
            </b>{" "}
            {form.secondaries.length === 0 ? "is" : "are"} created in{" "}
            <b>Draft</b> and routed to the Platform Approver.
          </span>
        ) : (
          <span>
            Some sections are still in progress. Submit becomes available once
            every required section is complete.
          </span>
        )}
      </Note>

      <ReviewSection
        title="Basic profile"
        sectionKey="primary"
        owner={resolveOwner(assignees.primary)}
        {...sectionProps}
      >
        <Meta
          items={[
            ["Legal entity", form.legal || "—"],
            ["Tenant type", form.type],
            ["Country", form.country],
            ["Subdomain", form.subdomain ? `${form.subdomain}.ginja.ai` : "—"],
            ["Region", form.region || "—"],
            ["Tax / VAT", form.tax || "—"],
            ["Primary contact", form.contacts[0]?.name || "—"],
            ["Contact email", form.contacts[0]?.email || "—"],
            ["Website", form.website || "—"],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title={`Secondary tenants (${form.secondaries.length})`}
        sectionKey="secondary"
        owner={resolveOwner(assignees.secondary)}
        {...sectionProps}
      >
        {form.secondaries.length === 0 ? (
          <div className="text-[13px] text-muted-foreground">
            None — single-tenant account.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {form.secondaries.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[13px]">
                <BriefcaseIcon className="size-[15px] text-muted-foreground" />
                <b>{s.name || `Secondary ${i + 1}`}</b>
                <span className="mono text-muted-foreground">
                  {s.subdomain}.ginja.ai · {s.region}
                </span>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title={`Module access (${modCodes.length})`}
        sectionKey="modules"
        owner={resolveOwner(assignees.modules)}
        {...sectionProps}
      >
        {modCodes.length === 0 ? (
          <div className="text-[13px] text-muted-foreground">
            No modules selected.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {modCodes.map((code) => (
              <Tagpill key={code}>{moduleLabel(code)}</Tagpill>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title="Subscription & billing"
        sectionKey="billing"
        owner={resolveOwner(assignees.billing)}
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-6 text-[13px]">
          <div>
            <span className="text-muted-foreground">Structure</span>
            <div className="font-semibold">
              {structure?.name ??
                (form.pricingStructureId ? `#${form.pricingStructureId}` : "—")}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Model</span>
            <div className="font-semibold">{form.model || "—"}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Frequency</span>
            <div className="font-semibold">{form.freq}</div>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection
        title="KYC & documents"
        sectionKey="documents"
        owner={resolveOwner(assignees.documents)}
        {...sectionProps}
      >
        <div className="flex flex-col gap-2">
          {REQUIRED_DOC_CATEGORIES.map((cat) => {
            const ok = form.documents.some((d) => d.category === cat)
            return (
              <div key={cat} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={
                    ok
                      ? "grid size-5 place-items-center rounded-full bg-success-subtle text-success-subtle-foreground"
                      : "grid size-5 place-items-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  {ok ? (
                    <CheckIcon className="size-3" />
                  ) : (
                    <MinusIcon className="size-3" />
                  )}
                </span>
                {DOC_CATEGORY_LABEL[cat] ?? cat}
              </div>
            )
          })}
        </div>
      </ReviewSection>
    </div>
  )
}
