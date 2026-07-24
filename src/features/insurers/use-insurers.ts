/* TanStack Query hooks for the Insurers domain. Queries read the directory /
 * profile / audit; mutations create / deactivate / reactivate and invalidate the
 * affected keys on success. Mutations do NOT toast or navigate — the page owns
 * all UX (per the app convention). */

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createInsurer,
  deactivateInsurer,
  fetchActiveInsurers,
  fetchInsurerAudit,
  fetchInsurerProfile,
  fetchInsurersDirectory,
  reactivateInsurer,
  type CreateInsurerInput,
  type ListInsurersParams,
} from "./api"
import { insurerKeys } from "./queries"
import type { Insurer } from "./types"

/** The directory (summary tiles + companies). One fetch per param set; the
   previous results stay on screen while a new search (`q`) loads. */
export function useInsurersDirectory(params: ListInsurersParams = {}) {
  return useQuery({
    queryKey: insurerKeys.directory(params),
    queryFn: () => fetchInsurersDirectory(params),
    placeholderData: keepPreviousData,
  })
}

/** The active-insurers lookup — every authed role can read this (the paged
   directory is ADMIN/SUPPORT-only). Used by the SP record's Insurers section
   and the insurer cockpit, so approvers can see the list too. */
export function useActiveInsurers(enabled = true) {
  return useQuery({
    queryKey: insurerKeys.active(),
    queryFn: fetchActiveInsurers,
    enabled,
  })
}

/** One insurer profile (Overview). `enabled` gates the fetch to when the drawer
   is open; pass `placeholder` (the already-loaded list row) for instant render
   while the profile call is in flight. */
export function useInsurerProfile(
  accountId: string,
  opts?: { enabled?: boolean; placeholder?: Insurer }
) {
  return useQuery({
    queryKey: insurerKeys.profile(accountId),
    queryFn: () => fetchInsurerProfile(accountId),
    enabled: (opts?.enabled ?? true) && !!accountId,
    placeholderData: opts?.placeholder,
  })
}

/** The audit trail for one profile. */
export function useInsurerAudit(
  accountId: string,
  opts?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: insurerKeys.audit(accountId),
    queryFn: () => fetchInsurerAudit(accountId),
    enabled: (opts?.enabled ?? true) && !!accountId,
  })
}

export function useCreateInsurer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateInsurerInput) => createInsurer(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: insurerKeys.all }),
  })
}

export function useDeactivateInsurer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { accountId: string; reason: string }) =>
      deactivateInsurer(v.accountId, v.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: insurerKeys.all }),
  })
}

export function useReactivateInsurer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { accountId: string }) => reactivateInsurer(v.accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: insurerKeys.all }),
  })
}
