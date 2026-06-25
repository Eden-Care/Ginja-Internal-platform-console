import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useMembers } from "@/features/access/use-members"

import {
  assignStep,
  fetchOnboardingDrafts,
  fetchOnboardingSteps,
  fetchPayerDetail,
} from "./api"
import { toDraftVM, type DraftVM } from "./draft-vm"
import { payerKeys } from "./queries"

/** Every in-progress onboarding draft (DRAFT payers) as a view-model: payer
   basics + onboarding progress + resolved assignees. A single
   GET /onboarding-drafts call now carries both (replacing the old N-per-draft
   /steps fan-out and the separate payers-list fetch). The members roster only
   resolves assignee emails to names. /steps itself is now hit only when a single
   draft is opened in the resume wizard (useOnboardingSteps). */
export function useDrafts(): {
  drafts: DraftVM[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
} {
  const draftsQ = useQuery({
    queryKey: payerKeys.onboardingDrafts(),
    queryFn: fetchOnboardingDrafts,
    staleTime: 30_000,
  })
  const membersQ = useMembers()

  const members = membersQ.data?.items ?? []
  const drafts = (draftsQ.data ?? []).map((d) => toDraftVM(d, members))

  return {
    drafts,
    isLoading: draftsQ.isLoading,
    isError: draftsQ.isError,
    refetch: () => draftsQ.refetch(),
  }
}

/** One draft's onboarding progress (the section tracker). */
export function useOnboardingSteps(payerId: number | null) {
  return useQuery({
    queryKey: payerKeys.steps(payerId ?? -1),
    queryFn: () => fetchOnboardingSteps(payerId as number),
    enabled: payerId != null,
  })
}

/** Raw payer detail (for resume rehydration). */
export function usePayerDetail(payerId: number | null) {
  return useQuery({
    queryKey: payerKeys.detail(payerId ?? -1),
    queryFn: () => fetchPayerDetail(payerId as number),
    enabled: payerId != null,
  })
}

/** Assign (or clear) a step's owner. Refreshes both that draft's steps and the
   batch drafts progress (which the strip/drawer render from) on success. */
export function useAssignStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      payerId: number
      stepKey: string
      assignee: string | null
    }) => assignStep(v.payerId, v.stepKey, v.assignee),
    onSuccess: (_data, v) => {
      qc.invalidateQueries({ queryKey: payerKeys.steps(v.payerId) })
      qc.invalidateQueries({ queryKey: payerKeys.onboardingDrafts() })
    },
  })
}
