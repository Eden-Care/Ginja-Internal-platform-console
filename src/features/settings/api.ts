/* Thin service over the API client for platform settings. */

import { apiGet, apiPatch, apiPost } from "@/lib/api/client"

import {
  toLocalization,
  toMfaDetail,
  toPasswordStatus,
  toPasswordSummary,
  toSecurityPolicy,
  toSecurityPolicyPatch,
  toSessionUsers,
  toValidationRuleset,
  type Localization,
  type LocalizationDTO,
  type MfaDetail,
  type MfaDetailDTO,
  type PasswordStatus,
  type PasswordStatusDTO,
  type PasswordStatusList,
  type PasswordStatusListDTO,
  type SecurityPolicy,
  type SecurityPolicyDTO,
  type SessionGroupDTO,
  type SessionUser,
  type ValidationRuleset,
  type ValidationRulesDTO,
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

/** GET /platform/settings/localization — platform formatting & locale defaults. */
export async function fetchLocalization(): Promise<Localization> {
  const res = await apiGet<LocalizationDTO>("/platform/settings/localization")
  console.log("[GET /platform/settings/localization]", res)
  return toLocalization(res)
}

/** GET /platform/settings/validation-rules — the current published ruleset. */
export async function fetchValidationRules(): Promise<ValidationRuleset> {
  const res = await apiGet<ValidationRulesDTO>(
    "/platform/settings/validation-rules"
  )
  console.log("[GET /platform/settings/validation-rules]", res)
  return toValidationRuleset(res)
}

/** GET /platform/settings/sessions — active device sessions, grouped by user. */
export async function fetchSessions(): Promise<SessionUser[]> {
  const res = await apiGet<SessionGroupDTO[]>("/platform/settings/sessions")
  console.log("[GET /platform/settings/sessions]", res)
  return toSessionUsers(res ?? [])
}

/** POST /platform/settings/sessions/{id}/revoke — sign a device out immediately. */
export async function revokeSession(sessionId: string): Promise<void> {
  const res = await apiPost(
    `/platform/settings/sessions/${sessionId}/revoke`,
    {}
  )
  console.log(`[POST /platform/settings/sessions/${sessionId}/revoke]`, res)
}

/** GET /platform/settings/mfa-status/{memberId} — one member's MFA enrolment detail. */
export async function fetchMfaDetail(memberId: number): Promise<MfaDetail> {
  const res = await apiGet<MfaDetailDTO>(
    `/platform/settings/mfa-status/${memberId}`
  )
  console.log(`[GET /platform/settings/mfa-status/${memberId}]`, res)
  return toMfaDetail(res)
}

/** POST /platform/settings/mfa-status/{memberId}/remind — send an MFA-enrolment
   reminder to a member (PLATFORM_ADMIN; audit-logged). */
export async function remindMfa(memberId: number): Promise<void> {
  const res = await apiPost(
    `/platform/settings/mfa-status/${memberId}/remind`,
    {}
  )
  console.log(`[POST /platform/settings/mfa-status/${memberId}/remind]`, res)
}

/** GET /platform/settings/password-status — `{ summary, users }`: the KPI-tile
   counts plus the per-member breakdown. Tolerates a bare array too. */
export async function fetchPasswordStatuses(): Promise<PasswordStatusList> {
  const res = await apiGet<PasswordStatusListDTO | PasswordStatusDTO[]>(
    "/platform/settings/password-status"
  )
  console.log("[GET /platform/settings/password-status]", res)
  const rows = Array.isArray(res) ? res : (res?.users ?? [])
  const statuses = rows.map(toPasswordStatus)
  const summary = toPasswordSummary(
    Array.isArray(res) ? undefined : res?.summary,
    statuses
  )
  return { summary, statuses }
}

/** GET /platform/settings/password-status/{memberId} — one member's detail. */
export async function fetchPasswordDetail(
  memberId: number
): Promise<PasswordStatus> {
  const res = await apiGet<PasswordStatusDTO>(
    `/platform/settings/password-status/${memberId}`
  )
  console.log(`[GET /platform/settings/password-status/${memberId}]`, res)
  return toPasswordStatus({ ...res, member_id: res?.member_id ?? memberId })
}

/** POST /platform/settings/password-status/{memberId}/force-reset — send the
   member a password-reset link (PLATFORM_ADMIN; audit-logged). */
export async function forcePasswordReset(memberId: number): Promise<void> {
  const res = await apiPost(
    `/platform/settings/password-status/${memberId}/force-reset`,
    {}
  )
  console.log(
    `[POST /platform/settings/password-status/${memberId}/force-reset]`,
    res
  )
}
