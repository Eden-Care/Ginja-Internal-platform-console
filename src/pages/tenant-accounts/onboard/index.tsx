import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  SendIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ONB_TEAM,
  STEP_INTRO,
  WIZ_STEPS,
  type OnbTeamKey,
  type WizStepKey,
} from "@/lib/console-data"
import { AssigneePicker } from "@/components/console/assignee-picker"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { Panel } from "@/components/console/panel"
import { useOnboardingForm } from "./use-onboarding-form"
import { StepPrimary } from "./sections/step-primary"
import { StepSecondary } from "./sections/step-secondary"
import { StepTechnical } from "./sections/step-technical"
import { StepModules } from "./sections/step-modules"
import { StepBilling } from "./sections/step-billing"
import { StepDocuments } from "./sections/step-documents"
import { StepReview } from "./sections/step-review"

const DRAFT_ID = "ONB-2041"

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
    lastSaved,
    setLastSaved,
    subTaken,
    subReserved,
    modCount,
    status,
    doneCount,
  } = wiz

  const cur = WIZ_STEPS[step]
  const total = WIZ_STEPS.length

  const onAssign = (s: WizStepKey, k: OnbTeamKey) => {
    setAssignees((a) => ({ ...a, [s]: k }))
    toast(
      `${WIZ_STEPS.find((x) => x.k === s)?.l} assigned to ${ONB_TEAM[k].name}.`
    )
  }
  const saveDraft = (exit: boolean) => {
    setLastSaved("just now")
    if (exit) {
      toast(`Draft ${DRAFT_ID} saved — resume anytime from Tenant accounts.`)
      navigate("/tenant-accounts")
    } else {
      toast(`Progress saved to draft ${DRAFT_ID}.`)
    }
  }
  const submit = () => {
    toast("Tenant created in Draft — sent to the approval queue.")
    navigate("/approvals")
  }
  const next = () => step < total - 1 && setStep(step + 1)
  const back = () => step > 0 && setStep(step - 1)

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/tenant-accounts" className="hover:text-foreground">
          Tenant accounts
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">
          Onboard tenant · {DRAFT_ID}
        </span>
      </nav>

      <Panel className="overflow-hidden">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Section navigation rail */}
          <aside className="flex flex-col gap-1 border-b p-4 lg:border-r lg:border-b-0">
            <div className="text-[15px] font-bold">
              {form.legal || "New tenant"}
            </div>
            <div className="mb-2 text-xs text-muted-foreground">
              {form.type} onboarding · {total} sections
            </div>
            {WIZ_STEPS.map((s, i) => {
              const st = status[s.k]
              const owner = ONB_TEAM[assignees[s.k]]
              const dotCls =
                st === "complete"
                  ? "bg-brand text-brand-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : st === "progress"
                      ? "bg-warning-subtle text-warning-subtle-foreground"
                      : "bg-muted text-muted-foreground"
              return (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors",
                    i === step
                      ? "bg-primary/5 ring-1 ring-primary/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
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
                    <span className="block text-[13px] font-medium">{s.l}</span>
                    <span className="block text-[11.5px] text-muted-foreground">
                      {s.d}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MiniAvatar initials={owner.initials} />
                      {owner.role}
                    </span>
                  </span>
                </button>
              )
            })}
            <div className="mt-3">
              <div className="flex items-start gap-2.5 rounded-[9px] bg-info-subtle px-3 py-2.5 text-[11.5px] leading-normal text-info-subtle-foreground">
                <InfoIcon className="mt-px size-[15px] shrink-0" />
                <span>
                  Complete sections in any order and hand off to a teammate.
                  Progress is saved as a draft you can resume anytime.
                </span>
              </div>
            </div>
          </aside>

          {/* Form panel */}
          <div className="flex min-w-0 flex-col">
            {/* Status strip */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-3.5">
              <ClockIcon className="size-[15px] text-muted-foreground" />
              <span className="mono text-[13px] font-semibold">
                Draft {DRAFT_ID}
              </span>
              <span className="text-xs text-muted-foreground">
                Saved {lastSaved}
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
              {cur.k === "technical" && (
                <StepTechnical
                  form={form}
                  set={set}
                  subTaken={subTaken}
                  subReserved={subReserved}
                />
              )}
              {cur.k === "modules" && <StepModules form={form} set={set} />}
              {cur.k === "billing" && (
                <StepBilling form={form} set={set} modCount={modCount} />
              )}
              {cur.k === "documents" && (
                <StepDocuments form={form} assignees={assignees} />
              )}
              {cur.k === "review" && (
                <StepReview
                  form={form}
                  status={status}
                  assignees={assignees}
                  setStep={setStep}
                />
              )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center gap-2 border-t px-5 py-3.5">
              {step > 0 ? (
                <Button variant="outline" onClick={back}>
                  <ChevronLeftIcon data-icon="inline-start" />
                  Back
                </Button>
              ) : null}
              <span className="flex-1" />
              <Button variant="ghost" onClick={() => saveDraft(false)}>
                <ClockIcon data-icon="inline-start" />
                Save draft
              </Button>
              {step < total - 1 ? (
                <Button onClick={next}>
                  Continue
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={submit}
                >
                  <SendIcon data-icon="inline-start" />
                  Submit for review
                </Button>
              )}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  )
}
