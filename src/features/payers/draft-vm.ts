/* Draft view-model. Merges a DRAFT payer, its onboarding /steps progress, and
   the member roster into the shape the drafts strip / cards / drawer render.
   Replaces the old ONB_DRAFTS mock contract. */

import {
  ONB_SECTIONS,
  type OnbTeamKey,
  type SecStatus,
  type TenantType,
} from "@/lib/console-data"
import { initials2 } from "@/lib/console-format"
import type { Member } from "@/features/access/types"

import type { OnboardingDraft } from "./types"

/** ISO-2 → display country name (reverse of the onboarding COUNTRY_CODE map). */
const COUNTRY_NAME: Record<string, string> = {
  KE: "Kenya",
  TZ: "Tanzania",
  UG: "Uganda",
  RW: "Rwanda",
  ET: "Ethiopia",
  NG: "Nigeria",
  ZA: "South Africa",
}
export const countryName = (iso: string | null | undefined) =>
  (iso && COUNTRY_NAME[iso]) || iso || "—"

/** A resolved step owner — the member the step's `assignee` email points at. */
export type DraftAssignee = {
  email: string
  name: string
  initials: string
  /** Best-effort role label (the member's first role) — null when unknown. */
  roleLabel: string | null
}

export type DraftSection = {
  /** ONB_SECTIONS key (= step_key): primary | secondary | modules | billing | documents */
  key: string
  label: string
  short: string
  icon: string
  status: SecStatus
  required: boolean
  ownerRole: OnbTeamKey | null
  assignee: DraftAssignee | null
  /** ISO completion timestamp (null until the step is complete). */
  completedAt: string | null
}

export type DraftVM = {
  payerId: number
  /** Human payer code, e.g. PAY000002. */
  code: string
  name: string
  country: string
  type: TenantType
  createdAt: string | null
  updatedAt: string | null
  /** Completed fillable sections out of ONB_SECTIONS.length (matches the SegTrack). */
  done: number
  total: number
  progressPct: number
  /** Label of the next incomplete required section (or a ready message). */
  waiting: string
  readyToSubmit: boolean
  sections: DraftSection[]
  /** key → status, for <SegTrack>. */
  sectionStatus: Record<string, SecStatus>
  /** Unique assignees across sections, in first-seen order. */
  team: DraftAssignee[]
  /** Sections with no assignee yet. */
  unassigned: DraftSection[]
  /** True when GET …/steps failed (a stale/broken draft) — progress is unknown. */
  stepsUnavailable: boolean
}

function resolveAssignee(
  email: string,
  byEmail: Map<string, Member>
): DraftAssignee {
  const m = byEmail.get(email.toLowerCase())
  const name = m?.name || email
  return {
    email,
    name,
    initials: initials2(name),
    roleLabel: m?.roles?.[0]?.name ?? null,
  }
}

/** Build the draft view-model for one DRAFT payer (basics + progress in one). */
export function toDraftVM(draft: OnboardingDraft, members: Member[]): DraftVM {
  const progress = draft.progress
  const byEmail = new Map(members.map((m) => [m.email.toLowerCase(), m]))
  const stepByKey = new Map(progress.steps.map((s) => [s.key, s]))

  const sections: DraftSection[] = ONB_SECTIONS.map((s) => {
    const step = stepByKey.get(s.k)
    return {
      key: s.k,
      label: s.l,
      short: s.short,
      icon: s.icon,
      status: step?.status ?? "empty",
      required: step?.required ?? true,
      ownerRole: step?.ownerRole ?? null,
      assignee: step?.assignee
        ? resolveAssignee(step.assignee, byEmail)
        : null,
      completedAt: step?.completedAt ?? null,
    }
  })

  const done = sections.filter((s) => s.status === "complete").length
  const total = sections.length
  const nextRequired = sections.find(
    (s) => s.required && s.status !== "complete"
  )
  const waiting = nextRequired ? nextRequired.label : "Ready to submit"

  // Unique assignees in first-seen order.
  const team: DraftAssignee[] = []
  const seen = new Set<string>()
  for (const s of sections) {
    if (s.assignee && !seen.has(s.assignee.email)) {
      seen.add(s.assignee.email)
      team.push(s.assignee)
    }
  }

  return {
    payerId: draft.id,
    code: draft.code,
    name: draft.name,
    country: countryName(draft.country),
    type: draft.type,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    done,
    total,
    progressPct: total ? Math.round((done / total) * 100) : 0,
    waiting,
    readyToSubmit: progress.readyToSubmit,
    sections,
    sectionStatus: Object.fromEntries(sections.map((s) => [s.key, s.status])),
    team,
    unassigned: sections.filter((s) => !s.assignee),
    // The batch endpoint always returns steps inline; treat an empty set as
    // "progress unavailable" (the old stale-draft guard).
    stepsUnavailable: progress.steps.length === 0,
  }
}
