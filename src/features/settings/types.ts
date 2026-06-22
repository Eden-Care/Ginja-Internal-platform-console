/* GET/PATCH /platform/settings/security-policy.

   The API groups fields under display-name keys (with spaces/caps), e.g.
   "Multi-factor authentication". We map that to a flat camelCase client type so
   components never touch the awkward keys, and map back for the PATCH body
   (same grouped shape — see the postman collection's updateSecurityPolicy). */

export type SecurityPolicyDTO = {
  id?: number
  "Multi-factor authentication"?: {
    mfa_required?: boolean
    mfa_totp_enabled?: boolean
    mfa_sms_enabled?: boolean
    mfa_webauthn_enabled?: boolean
  } | null
  "Password policy"?: {
    password_min_length?: number
    password_require_upper?: boolean
    password_require_lower?: boolean
    password_require_number?: boolean
    password_require_special?: boolean
    password_expiry_days?: number
    password_history_count?: number
  } | null
  Lockout?: {
    lockout_max_attempts?: number
    lockout_duration_minutes?: number
  } | null
  Sessions?: {
    session_timeout_minutes?: number
    idle_timeout_minutes?: number
  } | null
  updated_by?: string | null
  updated_at?: string | null
}

/** Flat camelCase policy the Security policies UI binds to. */
export type SecurityPolicy = {
  mfaRequired: boolean
  mfaTotp: boolean
  mfaSms: boolean
  mfaWebauthn: boolean
  minLength: number
  requireUpper: boolean
  requireLower: boolean
  requireNumber: boolean
  requireSpecial: boolean
  /** Days until forced rotation; 0 = never. */
  expiryDays: number
  /** Number of previous passwords blocked; 0 = no re-use restriction. */
  historyCount: number
  lockoutMaxAttempts: number
  lockoutDurationMinutes: number
  sessionTimeoutMinutes: number
  idleTimeoutMinutes: number
  updatedBy: string | null
  updatedAt: string | null
}

export function toSecurityPolicy(d: SecurityPolicyDTO): SecurityPolicy {
  const mfa = d["Multi-factor authentication"] ?? {}
  const pw = d["Password policy"] ?? {}
  const lo = d.Lockout ?? {}
  const se = d.Sessions ?? {}
  return {
    mfaRequired: !!mfa.mfa_required,
    mfaTotp: !!mfa.mfa_totp_enabled,
    mfaSms: !!mfa.mfa_sms_enabled,
    mfaWebauthn: !!mfa.mfa_webauthn_enabled,
    minLength: pw.password_min_length ?? 12,
    requireUpper: pw.password_require_upper ?? true,
    requireLower: pw.password_require_lower ?? true,
    requireNumber: pw.password_require_number ?? true,
    requireSpecial: pw.password_require_special ?? true,
    expiryDays: pw.password_expiry_days ?? 0,
    historyCount: pw.password_history_count ?? 0,
    lockoutMaxAttempts: lo.lockout_max_attempts ?? 5,
    lockoutDurationMinutes: lo.lockout_duration_minutes ?? 30,
    sessionTimeoutMinutes: se.session_timeout_minutes ?? 480,
    idleTimeoutMinutes: se.idle_timeout_minutes ?? 30,
    updatedBy: d.updated_by ?? null,
    updatedAt: d.updated_at ?? null,
  }
}

/** Map back onto the grouped PATCH body. */
export function toSecurityPolicyPatch(p: SecurityPolicy): SecurityPolicyDTO {
  return {
    "Multi-factor authentication": {
      mfa_required: p.mfaRequired,
      mfa_totp_enabled: p.mfaTotp,
      mfa_sms_enabled: p.mfaSms,
      mfa_webauthn_enabled: p.mfaWebauthn,
    },
    "Password policy": {
      password_min_length: p.minLength,
      password_require_upper: p.requireUpper,
      password_require_lower: p.requireLower,
      password_require_number: p.requireNumber,
      password_require_special: p.requireSpecial,
      password_expiry_days: p.expiryDays,
      password_history_count: p.historyCount,
    },
    Lockout: {
      lockout_max_attempts: p.lockoutMaxAttempts,
      lockout_duration_minutes: p.lockoutDurationMinutes,
    },
    Sessions: {
      session_timeout_minutes: p.sessionTimeoutMinutes,
      idle_timeout_minutes: p.idleTimeoutMinutes,
    },
  }
}
