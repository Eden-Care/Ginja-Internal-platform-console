/* TanStack Query hooks for the Service Providers domain. Queries read the
 * directory / profile / audit / documents / review-queue / review; mutations
 * cover the onboarding + lifecycle + review flows and invalidate the affected
 * keys on success. Mutations do NOT toast or navigate — the page owns all UX. */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"

import {
  addRemark,
  approveProvider,
  createProvider,
  deactivateProvider,
  fetchProviderAudit,
  fetchProviderDocuments,
  fetchProviderReview,
  fetchReviewQueue,
  fetchServiceProvider,
  fetchServiceProvidersDirectory,
  markSectionReviewed,
  reactivateProvider,
  resolveRemark,
  sendBackProvider,
  submitProvider,
  updateProvider,
  uploadProviderDocument,
  type ListParams,
  type SpFormInput,
} from "./api"
import { spKeys } from "./queries"
import type { ServiceProvider } from "./types"

/* -------------------------------- queries ------------------------------- */

/** Don't retry a 4xx — a 403 (caller can't view providers) is terminal. */
const retry4xx = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status >= 400 && err.status < 500) &&
  count < 1

export function useServiceProvidersDirectory(params: ListParams = {}) {
  return useQuery({
    queryKey: spKeys.directory(params),
    queryFn: () => fetchServiceProvidersDirectory(params),
    placeholderData: keepPreviousData,
    retry: retry4xx,
  })
}

export function useServiceProvider(
  code: string,
  opts?: { enabled?: boolean; placeholder?: ServiceProvider }
) {
  return useQuery({
    queryKey: spKeys.profile(code),
    queryFn: () => fetchServiceProvider(code),
    enabled: (opts?.enabled ?? true) && !!code,
    placeholderData: opts?.placeholder,
  })
}

export function useProviderAudit(code: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: spKeys.audit(code),
    queryFn: () => fetchProviderAudit(code),
    enabled: (opts?.enabled ?? true) && !!code,
  })
}

export function useProviderDocuments(code: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: spKeys.documents(code),
    queryFn: () => fetchProviderDocuments(code),
    enabled: (opts?.enabled ?? true) && !!code,
  })
}

export function useReviewQueue(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: spKeys.reviewQueue(),
    queryFn: () => fetchReviewQueue(),
    enabled: opts?.enabled ?? true,
  })
}

export function useProviderReview(code: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: spKeys.review(code),
    queryFn: () => fetchProviderReview(code),
    enabled: (opts?.enabled ?? true) && !!code,
  })
}

/* ------------------------------- mutations ------------------------------ */

export function useCreateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SpFormInput) => createProvider(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useUpdateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; input: SpFormInput }) =>
      updateProvider(v.code, v.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useSubmitProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string }) => submitProvider(v.code),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useDeactivateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; reason: string }) =>
      deactivateProvider(v.code, v.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useReactivateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string }) => reactivateProvider(v.code),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useApproveProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string }) => approveProvider(v.code),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useSendBackProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; note: string }) =>
      sendBackProvider(v.code, v.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: spKeys.all }),
  })
}

export function useUploadProviderDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; docSlotKey: string; file: File }) =>
      uploadProviderDocument(v.code, v.docSlotKey, v.file),
    onSuccess: (_r, v) =>
      qc.invalidateQueries({ queryKey: spKeys.documents(v.code) }),
  })
}

export function useAddRemark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      code: string
      sectionKey: string
      severity: "action" | "note"
      body: string
    }) => addRemark(v.code, v),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: spKeys.review(v.code) })
      qc.invalidateQueries({ queryKey: spKeys.reviewQueue() })
    },
  })
}

export function useResolveRemark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; remarkId: string }) =>
      resolveRemark(v.code, v.remarkId),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: spKeys.review(v.code) })
      qc.invalidateQueries({ queryKey: spKeys.reviewQueue() })
    },
  })
}

export function useMarkSectionReviewed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { code: string; sectionKey: string }) =>
      markSectionReviewed(v.code, v.sectionKey),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: spKeys.review(v.code) })
      qc.invalidateQueries({ queryKey: spKeys.reviewQueue() })
    },
  })
}
