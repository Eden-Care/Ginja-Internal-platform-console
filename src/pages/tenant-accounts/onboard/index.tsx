import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  Loader2Icon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ONB_TEAM,
  STEP_INTRO,
  WIZ_STEPS,
  type OnboardingForm,
  type OnbTeamKey,
  type WizStepKey,
} from "@/lib/console-data"
import { AssigneePicker } from "@/components/console/assignee-picker"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { useSubmitOnboarding } from "@/features/payers/use-onboarding"
import {
  OnboardingError,
  type OnboardInput,
  type OnboardStep,
} from "@/features/payers/onboarding"
import { useOnboardingForm } from "./use-onboarding-form"
import { StepPrimary } from "./sections/step-primary"
import { StepSecondary } from "./sections/step-secondary"
import { StepModules } from "./sections/step-modules"
import { StepBilling } from "./sections/step-billing"
import { StepDocuments } from "./sections/step-documents"
import { StepReview } from "./sections/step-review"

const STEP_LABEL: Record<OnboardStep, string> = {
  create: "Creating tenant…",
  technical: "Saving technical config…",
  secondary: "Adding secondary tenants…",
  entitlements: "Saving module access…",
  subscription: "Saving billing…",
  documents: "Recording documents…",
  submit: "Submitting for approval…",
}

/** Map the local wizard form to the onboarding API input. */
function buildInput(form: OnboardingForm): OnboardInput {
  const c0 = form.contacts[0] ?? { name: "", email: "", role: "", phone: "" }
  return {
    payerType: form.type,
    primary: {
      legalEntityName: form.legal,
      tradingName: form.trading,
      primaryContactName: c0.name,
      primaryContactEmail: c0.email,
      country: form.country,
      region: form.region,
      subdomain: form.subdomain,
      taxVatNumber: form.tax,
      phone: c0.phone,
      address: form.address,
      website: form.website,
      extraContacts: form.contacts
        .slice(1)
        .map((c) => ({ name: c.name, email: c.email, role: c.role })),
    },
    technical: {
      subdomain: form.subdomain,
      customDomain: form.customDomain,
      isolation: form.isolation,
      region: form.region,
    },
    // Secondary contact/admin details aren't collected in the design — they
    // default to the primary's so the request validates (flagged for backend).
    secondaries: form.secondaries.map((s) => ({
      legalEntityName: s.name,
      primaryContactName: c0.name,
      primaryContactEmail: c0.email,
      country: s.country,
      region: s.region,
      subdomain: s.subdomain,
    })),
    moduleCodes: Object.keys(form.modules),
    subscription: form.pricingStructureId
      ? {
          pricingStructureId: form.pricingStructureId,
          model: form.model,
          frequency: form.freq,
        }
      : null,
    documents: form.documents.map((d) => ({
      category: d.category,
      fileName: d.fileName,
      expiryDate: d.expiryDate,
    })),
  }
}

export function OnboardTenantPage() {
  const navigate = useNavigate()
  const wiz = useOnboardingForm()
  const {
    form,
    set,
    step,
    setStep,
    assignees,
    setAssignees,
    status,
    doneCount,
  } = wiz

  const submitMut = useSubmitOnboarding()
  const [runStep, setRunStep] = React.useState<OnboardStep | null>(null)
  const [err, setErr] = React.useState<{ step: OnboardStep; message: string } | null>(
    null
  )
  // Ids of a partial run, so a retry resumes from the failed step.
  const [partial, setPartial] = React.useState<{
    payerId?: number
    tenantId?: number
    from?: OnboardStep
  }>({})

  const cur = WIZ_STEPS[step]
  const total = WIZ_STEPS.length
  const busy = submitMut.isPending

  // Submit is allowed once every required (non-secondary) section is complete.
  const canSubmit =
    status.primary === "complete" &&
    status.modules === "complete" &&
    status.billing === "complete" &&
    status.documents === "complete"

  const onAssign = (s: WizStepKey, k: OnbTeamKey) => {
    setAssignees((a) => ({ ...a, [s]: k }))
    toast(
      `${WIZ_STEPS.find((x) => x.k === s)?.l} assigned to ${ONB_TEAM[k].name}.`
    )
  }
  const saveDraft = (exit: boolean) => {
    if (exit) {
      toast("Exited. Note: onboarding drafts aren’t saved to the server yet.")
      navigate("/tenant-accounts")
    } else {
      toast("Progress kept in this browser tab.")
    }
  }

  const submit = () => {
    setErr(null)
    submitMut.mutate(
      {
        input: buildInput(form),
        opts: {
          existingPayerId: partial.payerId,
          existingTenantId: partial.tenantId,
          startFrom: partial.from,
          onStep: setRunStep,
        },
      },
      {
        onSuccess: (res) => {
          setRunStep(null)
          setPartial({})
          toast.success(
            `${form.legal || "Tenant"} submitted for approval — ${res.payerCode}.`
          )
          navigate("/tenant-accounts")
        },
        onError: (e) => {
          setRunStep(null)
          if (e instanceof OnboardingError) {
            setPartial({ payerId: e.payerId, tenantId: e.tenantId, from: e.step })
            setErr({ step: e.step, message: e.message })
          } else {
            setErr({
              step: "create",
              message: e instanceof Error ? e.message : "Submission failed.",
            })
          }
        },
      }
    )
  }

  const next = () => step < total - 1 && setStep(step + 1)
  const back = () => step > 0 && setStep(step - 1)

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Tenant accounts", href: "/tenant-accounts" },
          { label: "Onboard tenant" },
        ]}
      />

      <Panel className="overflow-hidden">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Section navigation rail */}
          <aside className="border-b px-[18px] py-[22px] lg:border-r lg:border-b-0">
            <div className="text-[13px] font-semibold">
              {form.legal || "New tenant"}
            </div>
            <div className="mt-[3px] mb-[18px] text-xs text-muted-foreground">
              {form.type} onboarding · {total} sections
            </div>
            <div className="relative grid gap-0.5">
              {WIZ_STEPS.map((s, i) => {
                const st = status[s.k]
                const active = i === step
                const owner = ONB_TEAM[assignees[s.k]]
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
                      <span className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-medium text-muted-foreground">
                        <MiniAvatar initials={owner.initials} />
                        {owner.role}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3">
              <div className="flex items-start gap-2.5 rounded-[9px] bg-info-subtle px-3 py-2.5 text-[11.5px] leading-normal text-info-subtle-foreground">
                <InfoIcon className="mt-px size-[15px] shrink-0" />
                <span>
                  Complete sections in any order. On submit, the tenant is
                  created in Draft and routed to the approver.
                </span>
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <div className="flex min-w-0 flex-col">
            {/* Status strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-3.5">
              <ClockIcon className="size-[15px] text-muted-foreground" />
              <span className="text-[13px] font-semibold">Unsaved draft</span>
              <span className="text-xs text-muted-foreground">
                Kept in this browser — server drafts coming soon
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
                  onClick={() => saveDraft(true)}
                  disabled={busy}
                >
                  <ClockIcon data-icon="inline-start" />
                  Save &amp; exit
                </Button>
              </div>
            </div>

            {/* Section header */}
            <div className="flex flex-col gap-3 px-5 pt-5 pb-1 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="eyebrow text-[10px]">
                  SECTION {step + 1} OF {total}
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {cur.l}
                </h2>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                  {STEP_INTRO[cur.k]}
                </p>
              </div>
              {cur.k !== "review" ? (
                <AssigneePicker
                  value={assignees[cur.k]}
                  onChange={(k) => onAssign(cur.k, k)}
                />
              ) : null}
            </div>

            {/* Section body */}
            <div className="px-5 py-5">
              {cur.k === "primary" && <StepPrimary form={form} set={set} />}
              {cur.k === "secondary" && <StepSecondary form={form} set={set} />}
              {cur.k === "modules" && <StepModules form={form} set={set} />}
              {cur.k === "billing" && <StepBilling form={form} set={set} />}
              {cur.k === "documents" && <StepDocuments form={form} set={set} />}
              {cur.k === "review" && (
                <StepReview
                  form={form}
                  status={status}
                  assignees={assignees}
                  setStep={setStep}
                />
              )}
            </div>

            {/* Submit error (resumable) */}
            {cur.k === "review" && err ? (
              <div className="px-5 pb-1">
                <Note tone="err" icon={<TriangleAlertIcon />}>
                  <b>Submission stopped at “{STEP_LABEL[err.step]}”.</b>{" "}
                  {err.message}{" "}
                  {partial.payerId ? (
                    <>The draft was created — press Submit again to resume.</>
                  ) : null}
                </Note>
              </div>
            ) : null}

            {/* Footer nav */}
            <div className="flex items-center gap-2 border-t px-5 py-3.5">
              {step > 0 ? (
                <Button variant="outline" onClick={back} disabled={busy}>
                  <ChevronLeftIcon data-icon="inline-start" />
                  Back
                </Button>
              ) : null}
              <span className="flex-1" />
              {step < total - 1 ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => saveDraft(false)}
                    disabled={busy}
                  >
                    <ClockIcon data-icon="inline-start" />
                    Save draft
                  </Button>
                  <Button onClick={next}>
                    Continue
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={submit}
                  disabled={busy || !canSubmit}
                  title={
                    canSubmit ? undefined : "Complete all required sections first"
                  }
                >
                  {busy ? (
                    <>
                      <Loader2Icon data-icon="inline-start" className="animate-spin" />
                      {runStep ? STEP_LABEL[runStep] : "Submitting…"}
                    </>
                  ) : (
                    <>
                      <SendIcon data-icon="inline-start" />
                      {err ? "Retry submit" : "Submit for review"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
