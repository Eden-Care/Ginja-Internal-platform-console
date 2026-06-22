import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchSecurityPolicy, updateSecurityPolicy } from "./api"
import { settingsKeys } from "./queries"
import type { SecurityPolicy } from "./types"

/** Platform security policy (MFA / password / lockout / sessions). */
export function useSecurityPolicy() {
  return useQuery({
    queryKey: settingsKeys.securityPolicy(),
    queryFn: fetchSecurityPolicy,
  })
}

/** PATCH the security policy; seeds the cache with the response on success. */
export function useUpdateSecurityPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SecurityPolicy) => updateSecurityPolicy(p),
    onSuccess: (data) => qc.setQueryData(settingsKeys.securityPolicy(), data),
  })
}
