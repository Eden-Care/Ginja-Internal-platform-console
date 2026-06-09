import * as React from "react"

import {
  BASE_FORM,
  WIZ_STEPS,
  type OnbTeamKey,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import {
  isSubReserved,
  isSubTaken,
  sectionStatuses,
} from "@/lib/console-format"

/** Wizard state: the form object, current step, section owners, and derived status. */
export function useOnboardingForm(initialStep = 0) {
  const [form, setForm] = React.useState<OnboardingForm>(BASE_FORM)
  const [step, setStep] = React.useState(initialStep)
  const [assignees, setAssignees] = React.useState<
    Record<WizStepKey, OnbTeamKey>
  >(
    () =>
      Object.fromEntries(WIZ_STEPS.map((s) => [s.k, s.owner])) as Record<
        WizStepKey,
        OnbTeamKey
      >
  )
  const [lastSaved, setLastSaved] = React.useState("just now")

  const set = React.useCallback(
    <K extends keyof OnboardingForm>(k: K, v: OnboardingForm[K]) =>
      setForm((f) => ({ ...f, [k]: v })),
    []
  )

  const subTaken = isSubTaken(form.subdomain)
  const subReserved = isSubReserved(form.subdomain)
  const modCount = Object.keys(form.modules).filter(
    (k) => form.modules[k]?.length
  ).length
  const status = sectionStatuses(form, { subTaken, subReserved })
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
    subTaken,
    subReserved,
    modCount,
    status,
    doneCount,
  }
}

export type SetField = <K extends keyof OnboardingForm>(
  k: K,
  v: OnboardingForm[K]
) => void
