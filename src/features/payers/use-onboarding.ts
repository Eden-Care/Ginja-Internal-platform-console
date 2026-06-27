import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { checkSubdomain, lookupTenant } from "./api"
import { payerKeys } from "./queries"
import { runOnboarding, type OnboardInput, type RunOptions } from "./onboarding"

/** Runs the full onboarding sequence (create → … → submit). Pass `opts` to
   resume a partial run and to receive per-step progress via `onStep`. */
export function useSubmitOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { input: OnboardInput; opts?: RunOptions }) =>
      runOnboarding(vars.input, vars.opts),
    onSuccess: () => qc.invalidateQueries({ queryKey: payerKeys.all }),
  })
}

/** Live subdomain availability check (Step 1). Enabled once a value is typed. */
export function useSubdomainCheck(value: string) {
  const v = value.trim().toLowerCase()
  return useQuery({
    queryKey: ["subdomain-check", v],
    queryFn: () => checkSubdomain(v),
    enabled: v.length >= 2,
    staleTime: 30_000,
  })
}

/** Duplicate-tenant lookup by legal entity name (Step 1). */
export function useTenantLookup(legalEntityName: string) {
  const v = legalEntityName.trim()
  return useQuery({
    queryKey: ["tenant-lookup", v],
    queryFn: () => lookupTenant({ legalEntityName: v }),
    enabled: v.length >= 3,
    staleTime: 30_000,
  })
}
