/* Thin service over the API client for platform settings. */

import { apiGet, apiPatch } from "@/lib/api/client"

import {
  toSecurityPolicy,
  toSecurityPolicyPatch,
  type SecurityPolicy,
  type SecurityPolicyDTO,
} from "./types"

/** GET /platform/settings/security-policy — platform-wide MFA / password /
   lockout / session policy. */
export async function fetchSecurityPolicy(): Promise<SecurityPolicy> {
  const res = await apiGet<SecurityPolicyDTO>(
    "/platform/settings/security-policy"
  )
  console.log("[GET /platform/settings/security-policy]", res)
  return toSecurityPolicy(res)
}

/** PATCH /platform/settings/security-policy — persist the edited policy. */
export async function updateSecurityPolicy(
  p: SecurityPolicy
): Promise<SecurityPolicy> {
  const res = await apiPatch<SecurityPolicyDTO>(
    "/platform/settings/security-policy",
    toSecurityPolicyPatch(p)
  )
  return toSecurityPolicy(res)
}
