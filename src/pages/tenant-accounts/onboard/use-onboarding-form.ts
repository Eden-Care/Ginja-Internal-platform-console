import * as React from "react"

import {
  BASE_FORM,
  WIZ_STEPS,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import { sectionStatuses } from "@/lib/console-format"

/** Per-step section owner, keyed by step. The value is a platform member's email
   (the key the assign API takes), or null when the step is unassigned. */
export type AssigneeMap = Record<WizStepKey, string | null>

/** Wizard state: the form object, current step, section owners, and derived status. */
export function useOnboardingForm(
  initialStep = 0,
  initialForm?: OnboardingForm,
  initialAssignees?: AssigneeMap
) {
  const [form, setForm] = React.useState<OnboardingForm>(initialForm ?? BASE_FORM)
  const [step, setStep] = React.useState(initialStep)
  const [assignees, setAssignees] = React.useState<AssigneeMap>(
    () =>
      initialAssignees ??
      (Object.fromEntries(WIZ_STEPS.map((s) => [s.k, null])) as AssigneeMap)
  )
  const [lastSaved, setLastSaved] = React.useState("just now")

  const set = React.useCallback(
    <K extends keyof OnboardingForm>(k: K, v: OnboardingForm[K]) =>
      setForm((f) => ({ ...f, [k]: v })),
    []
  )

  const modCount = Object.keys(form.modules).filter(
    (k) => form.modules[k]?.length
  ).length
  const status = sectionStatuses(form)
  const doneCount = WIZ_STEPS.filter((s) => status[s.k] === "complete").length

  return {
    form,
    set,
    step,
    setStep,
    assignees,
    setAssignees,
    lastSaved,
    setLastSaved,
    modCount,
    status,
    doneCount,
  }
}

export type SetField = <K extends keyof OnboardingForm>(
  k: K,
  v: OnboardingForm[K]
) => void
