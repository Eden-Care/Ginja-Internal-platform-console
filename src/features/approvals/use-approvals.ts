import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import { payerKeys } from "@/features/payers/queries"

import {
  approvePayer,
  decideSection,
  fetchApprovalReview,
  fetchApprovals,
  rejectPayer,
  requestInfo,
} from "./api"
import type { ApprovalDecision, ApprovalReview } from "./types"
import { approvalKeys } from "./queries"

/** Don't retry a 4xx — a 403 (e.g. caller isn't an approver) is terminal. */
const retry4xx = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status >= 400 && err.status < 500) &&
  count < 1

/** The maker-checker queue (all rows; tabs + counts derived client-side). The
   endpoint is restricted to PLATFORM_APPROVER, so 4xx is terminal — no retry. */
export function useApprovals() {
  return useQuery({
    queryKey: approvalKeys.lists(),
    queryFn: () => fetchApprovals("all"),
    retry: retry4xx,
  })
}

/** One submission's full review payload (meta + payer aggregate). */
export function useApprovalReview(payerId: number | null) {
  return useQuery({
    queryKey: approvalKeys.review(payerId ?? -1),
    queryFn: () => fetchApprovalReview(payerId as number),
    enabled: payerId != null,
    retry: retry4xx,
  })
}

/** Record one review section's decision. The endpoint returns the refreshed
   review payload, so we write it straight into the review cache — the checklist
   (and `allSectionsApproved`) update without a refetch. The page owns toasts. */
export function useDecideSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      payerId: number
      sectionKey: string
      action: ApprovalDecision
      comment?: string
    }) => decideSection(v.payerId, v.sectionKey, v.action, v.comment),
    onSuccess: (review: ApprovalReview, v) => {
      qc.setQueryData(approvalKeys.review(v.payerId), review)
    },
  })
}

/** Approve / reject / request-info. The page owns toasts + navigation; this just
   runs the call and invalidates the queue + payer lists on success. */
export function useApprovalDecision() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      payerId: number
      decision: "approve" | "reject" | "request-info"
      comment?: string
    }) => {
      if (v.decision === "approve") return approvePayer(v.payerId, v.comment)
      if (v.decision === "reject")
        return rejectPayer(v.payerId, v.comment ?? "")
      return requestInfo(v.payerId, v.comment ?? "")
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: approvalKeys.all })
      qc.invalidateQueries({ queryKey: approvalKeys.review(v.payerId) })
      qc.invalidateQueries({ queryKey: payerKeys.all })
    },
  })
}
