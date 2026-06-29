import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  Loader2Icon,
  SendIcon,
  TriangleAlertIcon,
  UserPlusIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  STEP_INTRO,
  WIZ_STEPS,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { LoadingSpinner } from "@/components/common/loading"
import { useQueryClient } from "@tanstack/react-query"

import { useSubmitOnboarding } from "@/features/payers/use-onboarding"
import {
  deleteSecondary,
  EMPTY_DRAFT_STATE,
  OnboardingError,
  payerDetailToForm,
  persistStep,
  reconcileSecondaries,
  type DraftState,
  type OnboardInput,
  type OnboardStep,
} from "@/features/payers/onboarding"
import {
  useAssignStep,
  useOnboardingSteps,
  usePayerDetail,
} from "@/features/payers/use-drafts"
import { useMembers } from "@/features/access/use-members"
import { payerKeys } from "@/features/payers/queries"
import type { OnboardingProgress } from "@/features/payers/types"
import {
  OwnerSelect,
  toOwnerOption,
  type OwnerOption,
} from "@/pages/tenant-accounts/components/owner-select"
import {
  useOnboardingForm,
  type AssigneeMap,
  type SetField,
} from "./use-onboarding-form"
import { StepPrimary } from "./sections/step-primary"
import { StepSecondary } from "./sections/step-secondary"
import { StepModules } from "./sections/step-modules"
import { StepBilling } from "./sections/step-billing"
import { StepDocuments } from "./sections/step-documents"
import { StepReview } from "./sections/step-review"

const STEP_LABEL: Record<OnboardStep, string> = {
  create: "Creating tenant…",
  secondary: "Adding secondary tenants…",
  entitlements: "Saving module access…",
  subscription: "Saving billing…",
  documents: "Recording documents…",
  submit: "Submitting for approval…",
}

/** Toast shown when Continue is pressed on an incomplete section. The rail still
   lets users jump between sections in any order — this only gates the linear
   Continue action ("this section is done, advance me"). */
const INCOMPLETE_MSG: Partial<Record<WizStepKey, string>> = {
  primary: "Complete the required fields in Basic profile before continuing.",
  secondary: "Finish or remove the incomplete secondary tenant before continuing.",
  modules: "Select at least one module before continuing.",
  billing: "Choose a pricing structure before continuing.",
  documents: "Attach all required documents before continuing.",
}

/** Resume context — present when the wizard is reopened on an existing DRAFT. */
type ResumeCtx = {
  payerId: number
  tenantId: number
  /** Payer code (e.g. PAY000002), for the status strip. */
  code: string
  /** Server-side step progress at load — drives completion + the submit gate. */
  progress: OnboardingProgress
  /** Document categories already saved (skipped to avoid duplicate rows). */
  savedDocCategories: string[]
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
    // Secondary contact/admin details aren't collected in the design — they
    // default to the primary's so the request validates (flagged for backend).
    // `tenantId` (when present) marks a server-backed row → PATCH not POST.
    secondaries: form.secondaries.map((s) => ({
      tenantId: s.tenantId,
      legalEntityName: s.name,
      primaryContactName: c0.name,
      primaryContactEmail: c0.email,
      country: s.country,
      region: s.region,
      subdomain: s.subdomain,
    })),
    entitlements: Object.entries(form.modules).map(
      ([moduleCode, submoduleCodes]) => ({ moduleCode, submoduleCodes })
    ),
    subscription: form.pricingStructureId
      ? {
          pricingStructureId: form.pricingStructureId,
          model: form.model,
          frequency: form.freq,
          freeTrialDays: form.freeTrialDays,
          contractStart: form.contractStart,
          contractEnd: form.contractEnd,
        }
      : null,
    documents: form.documents.map((d) => ({
      category: d.category,
      fileName: d.fileName,
      expiryDate: d.expiryDate,
      description: d.description,
      file: d.file,
    })),
  }
}

function OnboardWizard({
  initialForm,
  resume,
}: {
  initialForm?: OnboardingForm
  resume?: ResumeCtx
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  // Seed section owners from the resumed draft's server-side step assignees.
  const initialAssignees = React.useMemo<AssigneeMap>(() => {
    const base = Object.fromEntries(
      WIZ_STEPS.map((s) => [s.k, null])
    ) as AssigneeMap
    for (const st of resume?.progress.steps ?? []) {
      if (st.assignee) base[st.key as WizStepKey] = st.assignee
    }
    return base
  }, [resume])
  const wiz = useOnboardingForm(0, initialForm, initialAssignees)
  const { form, set, step, setStep, assignees, setAssignees } = wiz

  // Real platform members back the "Section owner" picker (no more mock roster).
  const membersQ = useMembers()
  const teamOptions = React.useMemo<OwnerOption[]>(
    () => (membersQ.data?.items ?? []).map(toOwnerOption),
    [membersQ.data]
  )
  const ownerByEmail = React.useMemo(() => {
    const m = new Map<string, OwnerOption>()
    for (const o of teamOptions) m.set(o.email, o)
    return m
  }, [teamOptions])
  const resolveOwner = (email: string | null): OwnerOption | null =>
    email ? ownerByEmail.get(email) ?? { email, name: email, roleLabel: null } : null
  const assignMut = useAssignStep()

  const submitMut = useSubmitOnboarding()
  const [runStep, setRunStep] = React.useState<OnboardStep | null>(null)
  const [err, setErr] = React.useState<{ step: OnboardStep; message: string } | null>(
    null
  )
  // Server-side draft state — save-as-you-go. Seeded from a resume context.
  const [draft, setDraft] = React.useState<DraftState>(() =>
    resume
      ? {
          ...EMPTY_DRAFT_STATE,
          payerId: resume.payerId,
          tenantId: resume.tenantId,
          payerCode: resume.code,
          savedDocCategories: resume.savedDocCategories,
        }
      : EMPTY_DRAFT_STATE
  )
  // Step to resume the submit reconcile from after a failed run.
  const [retryFrom, setRetryFrom] = React.useState<OnboardStep | null>(null)
  const [saving, setSaving] = React.useState(false)
  // Steps the user has left at least once — field validation stays hidden until
  // then, so a freshly opened form isn't shown all-red.
  const [tried, setTried] = React.useState<Set<WizStepKey>>(() => new Set())

  const cur = WIZ_STEPS[step]
  const total = WIZ_STEPS.length
  const busy = submitMut.isPending || saving
  // A saved draft (the payer exists). Step 1 + secondaries are now editable via
  // the PATCH/DELETE tenant endpoints; we still pass this to the Primary step to
  // suppress its duplicate / subdomain self-match warnings (the draft matches its
  // own record).
  const resumed = !!draft.payerId

  // Steps edited since their last save. Lets a Submit reached by jumping through
  // the rail (which doesn't save) still flush pending primary/secondary edits —
  // the submit reconcile skips those steps on a resumed draft.
  const [dirty, setDirty] = React.useState<Set<WizStepKey>>(() => new Set())
  const markDirty = (k: WizStepKey) =>
    setDirty((d) => (d.has(k) ? d : new Set(d).add(k)))
  const clearDirty = (k: WizStepKey) =>
    setDirty((d) => {
      if (!d.has(k)) return d
      const n = new Set(d)
      n.delete(k)
      return n
    })
  // Marks the current step dirty on any field change, then forwards to the form.
  // Programmatic writes (e.g. secondary tenant-id write-back) use `set` directly
  // so they don't flag the step dirty.
  const trackedSet: SetField = (k, v) => {
    markDirty(cur.k)
    set(k, v)
  }

  // On resume, server-completed steps count as complete (the section tracker is
  // authoritative) even before the form re-derives status from rehydrated fields.
  const serverDone = new Set(resume?.progress.completedSteps ?? [])
  const status = { ...wiz.status }
  if (resume) {
    for (const s of WIZ_STEPS) if (serverDone.has(s.k)) status[s.k] = "complete"
  }
  const doneCount = WIZ_STEPS.filter((s) => status[s.k] === "complete").length

  // Submit is allowed once every required (non-secondary) section is complete.
  const canSubmit =
    status.primary === "complete" &&
    status.modules === "complete" &&
    status.billing === "complete" &&
    status.documents === "complete"

  /** Set a section's owner to a member (by email), or clear it. Persists via
     POST …/steps/{key}/assign once the payer exists; before then it's held
     locally and flushed on create (saveCurrentStep). */
  const onAssign = async (s: WizStepKey, email: string | null) => {
    setAssignees((a) => ({ ...a, [s]: email }))
    const label = WIZ_STEPS.find((x) => x.k === s)?.l ?? "Section"
    if (!email) {
      // The assign API has no un-assign (assignee is required) — a clear only
      // sticks locally until the draft reloads.
      if (draft.payerId)
        toast("Un-assigning isn’t supported by the API yet — it reverts on reload.")
      return
    }
    const who = resolveOwner(email)?.name ?? email
    if (!draft.payerId) {
      toast(`${label} will be assigned to ${who} when the draft is saved.`)
      return
    }
    try {
      await assignMut.mutateAsync({
        payerId: draft.payerId,
        stepKey: s,
        assignee: email,
      })
      toast.success(`${label} assigned to ${who}.`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t assign this section.")
    }
  }
  /** Persist the current step to the server (save-as-you-go). Returns false when
     the save fails so the caller halts — Continue stays on the step, Save & exit
     doesn't leave — and a failed API call never silently advances. The deliberate
     skips (no payer yet on a sub-step) return true — they aren't failures.
       - primary: creates the payer on first save, PATCHes it thereafter
       - secondary: reconciles (PATCH existing / POST new), writing tenant ids back */
  const saveCurrentStep = async (): Promise<boolean> => {
    const k = cur.k
    if (k === "review") return true
    if (!draft.payerId) {
      // Nothing is on the server yet — the payer is created from the Basic
      // profile. Other steps (incl. secondaries) can't persist until then; submit
      // creates + applies them. Step 1 must be complete first (incl. subdomain).
      if (k !== "primary") {
        toast(
          "Save the Basic profile first — the draft is created from it, then other sections save as you go."
        )
        return true
      }
      if (status.primary !== "complete") {
        toast(
          "Complete the Basic profile (incl. subdomain) to save this draft to the server."
        )
        return true
      }
    }
    setSaving(true)
    try {
      const hadPayer = !!draft.payerId
      if (k === "secondary" && draft.payerId) {
        // Reconcile then write authoritative tenant ids back into the form, so a
        // re-save updates rather than duplicates.
        const rebuilt = await reconcileSecondaries(
          draft.payerId,
          buildInput(form).secondaries
        )
        set("secondaries", rebuilt)
        clearDirty("secondary")
        qc.invalidateQueries({ queryKey: payerKeys.steps(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.detail(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.onboardingDrafts() })
        toast.success("Draft saved.")
        return true
      }
      const nextState = await persistStep(k, buildInput(form), draft)
      setDraft(nextState)
      clearDirty(k)
      if (nextState.payerId) {
        qc.invalidateQueries({ queryKey: payerKeys.steps(nextState.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.detail(nextState.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.lists() })
        qc.invalidateQueries({ queryKey: payerKeys.onboardingDrafts() })
      }
      if (!hadPayer && nextState.payerId) {
        // The payer was just created — flush any owners chosen before it existed
        // (each assign is idempotent; failures here don't block the save).
        const pid = nextState.payerId
        await Promise.all(
          (Object.entries(assignees) as [WizStepKey, string | null][])
            .filter(([, email]) => !!email)
            .map(([stepKey, email]) =>
              assignMut
                .mutateAsync({ payerId: pid, stepKey, assignee: email as string })
                .catch(() => {})
            )
        )
      }
      toast.success(
        !hadPayer && nextState.payerId
          ? `Draft saved — ${nextState.payerCode} created.`
          : "Draft saved."
      )
      return true
    } catch (e) {
      // Save failed — keep the user on this step instead of advancing past an
      // error (e.g. a rejected entitlement, a taken subdomain). Continue and
      // Save & exit both halt; the user fixes the input and retries.
      const msg = e instanceof Error ? e.message : "Couldn’t save this step."
      toast.error(msg)
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveDraft = async (exit: boolean) => {
    const ok = await saveCurrentStep()
    if (exit && ok) navigate("/tenant-accounts")
  }

  /** Remove a secondary tenant. Server-backed rows (carry a tenantId) are DELETEd
     first — the primary is protected server-side; new local rows just drop. */
  const removeSecondary = async (i: number) => {
    const s = form.secondaries[i]
    if (s.tenantId && draft.payerId) {
      setSaving(true)
      try {
        await deleteSecondary(draft.payerId, s.tenantId)
        qc.invalidateQueries({ queryKey: payerKeys.steps(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.detail(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.onboardingDrafts() })
        toast.success("Secondary tenant removed.")
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn’t remove this tenant.")
        return
      } finally {
        setSaving(false)
      }
    }
    set(
      "secondaries",
      form.secondaries.filter((_, x) => x !== i)
    )
  }

  /** Clear all secondaries — DELETE every server-backed row, then empty the list. */
  const clearSecondaries = async () => {
    const saved = form.secondaries.filter((s) => s.tenantId)
    if (saved.length && draft.payerId) {
      setSaving(true)
      try {
        for (const s of saved)
          await deleteSecondary(draft.payerId, s.tenantId as number)
        qc.invalidateQueries({ queryKey: payerKeys.steps(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.detail(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.onboardingDrafts() })
        toast.success(
          saved.length === 1
            ? "Secondary tenant removed."
            : `${saved.length} secondary tenants removed.`
        )
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn’t remove all tenants.")
        return // leave the list; a resume refetch reflects server truth
      } finally {
        setSaving(false)
      }
    }
    set("secondaries", [])
  }

  const submit = async () => {
    setErr(null)
    // On a resumed draft the submit reconcile starts at entitlements, so flush any
    // unsaved primary/secondary edits first — otherwise a Submit reached by jumping
    // through the rail (which doesn't save) would silently drop them.
    if (draft.payerId && (dirty.has("primary") || dirty.has("secondary"))) {
      setSaving(true)
      try {
        if (dirty.has("primary")) {
          await persistStep("primary", buildInput(form), draft)
          clearDirty("primary")
        }
        if (dirty.has("secondary")) {
          const rebuilt = await reconcileSecondaries(
            draft.payerId,
            buildInput(form).secondaries
          )
          set("secondaries", rebuilt)
          clearDirty("secondary")
        }
        qc.invalidateQueries({ queryKey: payerKeys.detail(draft.payerId) })
        qc.invalidateQueries({ queryKey: payerKeys.steps(draft.payerId) })
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Couldn’t save your latest edits."
        )
        setSaving(false)
        return
      }
      setSaving(false)
    }
    submitMut.mutate(
      {
        input: buildInput(form),
        opts: {
          // Reconcile against the server draft: skip create+secondary when it
          // already exists, re-PUT entitlements/subscription (idempotent), POST
          // only un-saved documents, then submit. A failed run resumes from retryFrom.
          existingPayerId: draft.payerId ?? undefined,
          existingTenantId: draft.tenantId ?? undefined,
          startFrom: retryFrom ?? (draft.payerId ? "entitlements" : undefined),
          skipDocumentCategories: draft.savedDocCategories,
          onStep: setRunStep,
        },
      },
      {
        onSuccess: (res) => {
          setRunStep(null)
          setRetryFrom(null)
          toast.success(
            `${form.legal || "Tenant"} submitted for approval — ${res.payerCode}.`
          )
          navigate("/tenant-accounts")
        },
        onError: (e) => {
          setRunStep(null)
          if (e instanceof OnboardingError) {
            setDraft((d) => ({
              ...d,
              payerId: e.payerId ?? d.payerId,
              tenantId: e.tenantId ?? d.tenantId,
            }))
            setRetryFrom(e.step)
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

  // Rail / Back: navigate without saving (Continue + Save draft are the save
  // triggers). Marks the step being left as "tried" so its validation surfaces.
  const goTo = (i: number) => {
    if (i === step) return
    setTried((t) => (t.has(cur.k) ? t : new Set(t).add(cur.k)))
    setStep(i)
  }
  const next = async () => {
    if (step >= total - 1) return
    // Reveal field-level validation for this section.
    setTried((t) => (t.has(cur.k) ? t : new Set(t).add(cur.k)))
    // Continue means "this section is done" — refuse to advance while it's
    // incomplete (the rail / goTo still allows jumping in any order). The errors
    // surfaced above by `tried` show the user exactly what's missing.
    if (status[cur.k] !== "complete") {
      toast.error(
        INCOMPLETE_MSG[cur.k] ?? "Complete this section before continuing."
      )
      return
    }
    const ok = await saveCurrentStep()
    if (ok) setStep(step + 1)
  }
  const back = () => step > 0 && goTo(step - 1)

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
                const owner = resolveOwner(assignees[s.k])
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
                    onClick={() => goTo(i)}
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
                        {owner ? (
                          <>
                            <AssigneeAvatar
                              name={owner.name}
                              className="size-[18px] text-[9px]"
                            />
                            <span className="truncate">{owner.name}</span>
                          </>
                        ) : (
                          <>
                            <span className="grid size-[18px] shrink-0 place-items-center rounded-full border border-dashed border-input">
                              <UserPlusIcon className="size-2.5" />
                            </span>
                            Unassigned
                          </>
                        )}
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
              <span className="text-[13px] font-semibold">
                {draft.payerId
                  ? `Draft ${draft.payerCode}`
                  : "Unsaved draft"}
              </span>
              <span className="text-xs text-muted-foreground">
                {draft.payerId
                  ? "Saved to server — each step saves as you go"
                  : "Complete the Basic profile to save this draft to the server"}
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
                <div className="shrink-0">
                  <div className="eyebrow mb-1.5 text-[10px]">Section owner</div>
                  <OwnerSelect
                    value={assignees[cur.k]}
                    team={teamOptions}
                    onChange={(email) => onAssign(cur.k, email)}
                  />
                </div>
              ) : null}
            </div>

            {/* Section body */}
            <div className="px-5 py-5">
              {resumed && (cur.k === "primary" || cur.k === "secondary") ? (
                <Note tone="info" icon={<InfoIcon />} className="mb-5">
                  <b>Editing saved draft {draft.payerCode}.</b>{" "}
                  {cur.k === "primary"
                    ? "Changes to these tenant details save to the server when you press Continue or Save draft. Bank details aren’t shown — they’re write-only on the server."
                    : "Adding or editing a secondary tenant saves on Continue or Save draft; removing a saved tenant deletes it from the server immediately."}
                </Note>
              ) : null}
              {cur.k === "primary" && (
                <StepPrimary
                  form={form}
                  set={trackedSet}
                  showErrors={tried.has("primary")}
                  resume={resumed}
                />
              )}
              {cur.k === "secondary" && (
                <StepSecondary
                  form={form}
                  set={trackedSet}
                  onRemove={removeSecondary}
                  onClear={clearSecondaries}
                  busy={busy}
                  showErrors={tried.has("secondary")}
                />
              )}
              {cur.k === "modules" && (
                <StepModules
                  form={form}
                  set={trackedSet}
                  showErrors={tried.has("modules")}
                />
              )}
              {cur.k === "billing" && (
                <StepBilling
                  form={form}
                  set={trackedSet}
                  showErrors={tried.has("billing")}
                />
              )}
              {cur.k === "documents" && (
                <StepDocuments
                  form={form}
                  set={trackedSet}
                  showErrors={tried.has("documents")}
                />
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

            {/* Submit error (resumable) */}
            {cur.k === "review" && err ? (
              <div className="px-5 pb-1">
                <Note tone="err" icon={<TriangleAlertIcon />}>
                  <b>Submission stopped at “{STEP_LABEL[err.step]}”.</b>{" "}
                  {err.message}{" "}
                  {draft.payerId ? (
                    <>The draft was saved — press Submit again to resume.</>
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
                    {saving ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <ClockIcon data-icon="inline-start" />
                    )}
                    Save draft
                  </Button>
                  <Button onClick={next} disabled={busy}>
                    {saving ? (
                      <>
                        <Loader2Icon
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRightIcon data-icon="inline-end" />
                      </>
                    )}
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

/** Shell used by the resume loading + error states. */
function ResumeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: "Tenant accounts", href: "/tenant-accounts" },
          { label: "Resume draft" },
        ]}
      />
      <Panel>{children}</Panel>
    </div>
  )
}

/** Loads an existing DRAFT (detail + steps) then mounts the wizard in resume mode. */
function ResumeGate({ payerId }: { payerId: number }) {
  const navigate = useNavigate()
  const detailQ = usePayerDetail(payerId)
  const stepsQ = useOnboardingSteps(payerId)

  if (detailQ.isLoading || stepsQ.isLoading) {
    return (
      <ResumeShell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </ResumeShell>
    )
  }

  if (detailQ.isError || !detailQ.data || stepsQ.isError || !stepsQ.data) {
    return (
      <ResumeShell>
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <TriangleAlertIcon className="size-6 text-destructive" />
          <div className="text-[13px] font-medium">
            Couldn’t load this draft.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/tenant-accounts")}
          >
            Back to tenant accounts
          </Button>
        </div>
      </ResumeShell>
    )
  }

  const mapped = payerDetailToForm(detailQ.data)
  const resume: ResumeCtx = {
    payerId: mapped.payerId,
    tenantId: mapped.tenantId,
    code: detailQ.data.payer_id,
    progress: stepsQ.data,
    savedDocCategories: mapped.savedDocCategories,
  }
  return <OnboardWizard initialForm={mapped.form} resume={resume} />
}

/** Route entry: blank wizard, or resume an existing DRAFT via `?draft=<payerId>`. */
export function OnboardTenantPage() {
  const [params] = useSearchParams()
  const draftParam = params.get("draft")
  const draftId = draftParam ? Number(draftParam) : NaN
  if (draftParam && Number.isFinite(draftId)) {
    return <ResumeGate payerId={draftId} />
  }
  return <OnboardWizard />
}
