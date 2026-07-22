/* TanStack Query hooks for contract rule-extraction. Mutations invalidate;
   the page owns all UX (toasts, navigation). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import {
  addManualRule,
  assignReviewer,
  fetchCurrentExtraction,
  fetchExtractionHistory,
  fetchExtractionJob,
  fetchExtractionsOverview,
  reviewRule,
  setReviewStatus,
  startExtraction,
  updateRule,
  type AddManualRuleInput,
  type RuleReviewAction,
  type UpdateRuleInput,
} from "./api"
import { rxKeys } from "./queries"
import type { Extraction } from "./types"

const isLive = (x: Extraction | null | undefined) =>
  x?.status === "QUEUED" || x?.status === "RUNNING"

/** One row per insurer — drives the Insurers-tab link cards. */
export function useExtractionsOverview(code: string, enabled = true) {
  return useQuery({
    queryKey: rxKeys.overview(code),
    queryFn: () => fetchExtractionsOverview(code),
    enabled: enabled && !!code,
  })
}

/** The current (latest) extraction for a provider + insurer. A 404 means the
    pair has no contract yet — surfaced as `null`, not an error. Polls every
    5s while the job is QUEUED/RUNNING so the status view goes live. */
export function useCurrentExtraction(
  code: string,
  insurerAccountId: string,
  enabled = true
) {
  return useQuery<Extraction | null>({
    queryKey: rxKeys.current(code, insurerAccountId),
    queryFn: async () => {
      try {
        return await fetchCurrentExtraction(code, insurerAccountId)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
    enabled: enabled && !!code && !!insurerAccountId,
    refetchInterval: (q) => (isLive(q.state.data) ? 5000 : false),
  })
}

/** One extraction by job id (any status) — used to open superseded
    history rows read-only. */
export function useExtractionJob(code: string, jobId: string | null) {
  return useQuery({
    queryKey: rxKeys.job(code, jobId ?? ""),
    queryFn: () => fetchExtractionJob(code, jobId!),
    enabled: !!code && !!jobId,
  })
}

/** All extraction jobs for a provider + insurer, newest first. */
export function useExtractionHistory(
  code: string,
  insurerAccountId: string,
  enabled = true
) {
  return useQuery({
    queryKey: rxKeys.history(code, insurerAccountId),
    queryFn: () => fetchExtractionHistory(code, insurerAccountId),
    enabled: enabled && !!code && !!insurerAccountId,
    refetchInterval: (q) =>
      q.state.data?.some((x) => x.status === "QUEUED" || x.status === "RUNNING")
        ? 5000
        : false,
  })
}

/** Seed the fresh extraction into the current-query cache and refresh lists. */
function useApplyExtraction() {
  const qc = useQueryClient()
  return (code: string, ins: string, extraction: Extraction) => {
    qc.setQueryData(rxKeys.current(code, ins), extraction)
    void qc.invalidateQueries({ queryKey: rxKeys.overview(code) })
    void qc.invalidateQueries({ queryKey: rxKeys.history(code, ins) })
  }
}

export function useStartExtraction() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      contract,
    }: {
      code: string
      insurerAccountId: string
      contract: File
    }) => startExtraction(code, insurerAccountId, { contract }),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}

export function useReviewRule() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      ruleId,
      action,
      comment,
    }: {
      code: string
      insurerAccountId: string
      ruleId: string
      action: RuleReviewAction
      comment?: string
    }) => reviewRule(code, insurerAccountId, ruleId, action, comment),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}

export function useAssignReviewer() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      memberId,
    }: {
      code: string
      insurerAccountId: string
      memberId: number
    }) => assignReviewer(code, insurerAccountId, memberId),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}

export function useSetReviewStatus() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      status,
    }: {
      code: string
      insurerAccountId: string
      status: "IN_REVIEW" | "COMPLETED"
    }) => setReviewStatus(code, insurerAccountId, status),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}

export function useUpdateRule() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      ruleId,
      patch,
    }: {
      code: string
      insurerAccountId: string
      ruleId: string
      patch: UpdateRuleInput
    }) => updateRule(code, insurerAccountId, ruleId, patch),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}

export function useAddManualRule() {
  const apply = useApplyExtraction()
  return useMutation({
    mutationFn: ({
      code,
      insurerAccountId,
      body,
    }: {
      code: string
      insurerAccountId: string
      body: AddManualRuleInput
    }) => addManualRule(code, insurerAccountId, body),
    onSuccess: (extraction, v) => apply(v.code, v.insurerAccountId, extraction),
  })
}
