import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import { approvalKeys } from "@/features/approvals/queries"
import {
  decideLifecycleRequest,
  fetchLifecycleRequests,
  fetchPayerActivity,
  fetchPayerDetail,
  reactivatePayer,
  retirePayer,
  submitPayer,
  suspendPayer,
} from "./api"
import { payerKeys } from "./queries"
import type { SuspendReason } from "./types"

/** Don't retry a 4xx — a 403 (caller can't view this payer) is terminal. */
const retry4xx = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status >= 400 && err.status < 500) &&
  count < 1

/** The full payer aggregate (tenants, entitlements, subscription, documents) for
   the Tenant account record page. Returns the raw `PayerDTO` — the page maps the
   header via `toPayer(dto)` and reads the aggregate arrays directly, mirroring the
   approval-review pattern. */
export function usePayerRecord(payerId: number | null) {
  return useQuery({
    queryKey: payerKeys.detail(payerId ?? -1),
    queryFn: () => fetchPayerDetail(payerId as number),
    enabled: payerId != null,
    retry: retry4xx,
  })
}

/** The payer's audit-trail timeline (Activity tab). */
export function usePayerActivity(payerId: number | null) {
  return useQuery({
    queryKey: payerKeys.activity(payerId ?? -1),
    queryFn: () => fetchPayerActivity(payerId as number),
    enabled: payerId != null,
    retry: retry4xx,
  })
}

/** The payer's lifecycle change-request history (pending + decided). */
export function useLifecycleRequests(payerId: number | null) {
  return useQuery({
    queryKey: payerKeys.lifecycleRequests(payerId ?? -1),
    queryFn: () => fetchLifecycleRequests(payerId as number),
    enabled: payerId != null,
    retry: retry4xx,
  })
}

/** Refresh the record + its activity + change-requests + the approvals queue and
   payer lists after raising or deciding a lifecycle request. */
function invalidatePayer(
  qc: ReturnType<typeof useQueryClient>,
  payerId: number
) {
  qc.invalidateQueries({ queryKey: payerKeys.detail(payerId) })
  qc.invalidateQueries({ queryKey: payerKeys.activity(payerId) })
  qc.invalidateQueries({ queryKey: payerKeys.lifecycleRequests(payerId) })
  qc.invalidateQueries({ queryKey: payerKeys.lists() })
  // Raising/deciding a request adds/removes a row in the maker-checker queue.
  qc.invalidateQueries({ queryKey: approvalKeys.all })
}

/* ----------------------------- maker: raise a lifecycle change request --- */

/** Raise a SUSPEND request (payer stays ACTIVE until a checker approves). */
export function useSuspendPayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { payerId: number; reason: SuspendReason; note?: string }) =>
      suspendPayer(v.payerId, v.reason, v.note),
    onSuccess: (_d, v) => invalidatePayer(qc, v.payerId),
  })
}

/** Raise a REACTIVATE request (payer stays SUSPENDED until approved). */
export function useReactivatePayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { payerId: number; note?: string }) =>
      reactivatePayer(v.payerId, v.note),
    onSuccess: (_d, v) => invalidatePayer(qc, v.payerId),
  })
}

/** Raise a RETIRE request (payer stays SUSPENDED until approved). */
export function useRetirePayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { payerId: number; reason: string; note?: string }) =>
      retirePayer(v.payerId, v.reason, v.note),
    onSuccess: (_d, v) => invalidatePayer(qc, v.payerId),
  })
}

/* -------------------------------- checker: decide a lifecycle request --- */

/** Approve / reject a pending lifecycle request. Approve executes the transition;
   reject leaves the payer unchanged. The page owns toasts + UX. */
export function useDecideLifecycleRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      payerId: number
      requestId: string
      decision: "approve" | "reject"
      comment?: string
    }) => decideLifecycleRequest(v.payerId, v.requestId, v.decision, v.comment),
    onSuccess: (_d, v) => invalidatePayer(qc, v.payerId),
  })
}

/** Submit a DRAFT payer for approval (POST …/submit). The API validates the
   draft and may reject an incomplete one — the page surfaces the error. */
export function useSubmitDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { payerId: number }) => submitPayer(v.payerId),
    onSuccess: (_d, v) => invalidatePayer(qc, v.payerId),
  })
}
