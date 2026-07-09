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

/* ------------------------------------------------------------ localization --- */

export type LocalizationDTO = {
  id?: number
  timezone?: string | null
  week_start?: string | null
  date_format?: string | null
  time_format?: string | null
  decimal_sep?: string | null
  thousands_sep?: string | null
  currency?: string | null
  currency_symbol?: string | null
  currency_decimals?: number | null
  default_language?: string | null
}

export type Localization = {
  timezone: string
  weekStart: string
  dateFormat: string
  timeFormat: string
  decimalSep: string
  thousandsSep: string
  currency: string
  currencySymbol: string
  currencyDecimals: string
  defaultLanguage: string
}

export function toLocalization(d: LocalizationDTO): Localization {
  return {
    timezone: d.timezone ?? "",
    weekStart: d.week_start ?? "",
    dateFormat: d.date_format ?? "",
    timeFormat: d.time_format ?? "",
    decimalSep: d.decimal_sep ?? "",
    thousandsSep: d.thousands_sep ?? "",
    currency: d.currency ?? "",
    currencySymbol: d.currency_symbol ?? "",
    currencyDecimals:
      d.currency_decimals != null ? String(d.currency_decimals) : "",
    defaultLanguage: d.default_language ?? "",
  }
}

/* -------------------------------------------------------- validation rules --- */

export type ValidationVariantDTO = {
  c?: string | null
  country?: string | null
  pattern?: string | null
  example?: string | null
}
export type ValidationRuleDTO = {
  id: string
  field: string
  applies?: string | null
  pattern?: string | null
  example?: string | null
  error?: string | null
  normalize?: string[] | null
  required?: boolean | null
  status?: string | null
  variants?: ValidationVariantDTO[] | null
}
export type ValidationGroupDTO = {
  icon?: string | null
  group: string
  rules?: ValidationRuleDTO[] | null
}
export type ValidationRulesDTO = {
  status?: string | null
  version?: number | string | null
  active_rules?: number | null
  note?: string | null
  published_at?: string | null
  created_at?: string | null
  updated_by?: string | null
  rules?: ValidationGroupDTO[] | null
}

export type ValidationVariant = {
  country: string
  pattern: string
  example: string
}
export type ValidationRule = {
  id: string
  field: string
  applies: string
  pattern: string
  example: string
  error: string
  normalize: string[]
  required: boolean
  status: string
  variants: ValidationVariant[]
}
export type ValidationGroup = {
  icon: string
  group: string
  rules: ValidationRule[]
}
export type ValidationRuleset = {
  status: string
  version: string
  activeRules: number
  note: string
  publishedAt: string
  updatedBy: string
  groups: ValidationGroup[]
}

export function toValidationRuleset(d: ValidationRulesDTO): ValidationRuleset {
  return {
    status: d.status ?? "",
    version: d.version != null ? `v${d.version}` : "",
    activeRules: d.active_rules ?? 0,
    note: d.note ?? "",
    publishedAt: d.published_at ?? d.created_at ?? "",
    updatedBy: d.updated_by ?? "",
    groups: (d.rules ?? []).map((g) => ({
      icon: g.icon ?? "",
      group: g.group,
      rules: (g.rules ?? []).map((r) => ({
        id: r.id,
        field: r.field,
        applies: r.applies ?? "",
        pattern: r.pattern ?? "",
        example: r.example ?? "",
        error: r.error ?? "",
        normalize: r.normalize ?? [],
        required: !!r.required,
        status: r.status ?? "",
        variants: (r.variants ?? []).map((v) => ({
          country: v.c ?? v.country ?? "",
          pattern: v.pattern ?? "",
          example: v.example ?? "",
        })),
      })),
    })),
  }
}

/* -------------------------------------------------------- active sessions --- */

/* GET /platform/settings/sessions returns an array of per-user GROUPS, each with
   the user's device sessions nested under `sessions`. We map each group to a
   SessionUser (and each nested row to a SessionItem). */

export type SessionDTO = {
  session_id: string
  user_session_id?: string | null
  member_id?: number | null
  account?: string | null
  user?: string | null
  browser?: string | null
  os?: string | null
  device?: string | null
  ip_address?: string | null
  location?: string | null
  started_at?: string | null
  last_seen_at?: string | null
  expires_at?: string | null
  status?: string | null
  current?: boolean | null
}

/** A per-user group as the API now returns it (sessions nested inside). */
export type SessionGroupDTO = {
  member_id?: number | null
  account?: string | null
  user?: string | null
  session_count?: number | null
  sessions?: SessionDTO[] | null
}

/** One device session (a row in the expanded per-user panel). */
export type SessionItem = {
  id: string // session_id — the handle used to revoke
  code: string // user_session_id (SES…)
  browser: string
  os: string
  device: string
  ip: string // host only (port + brackets stripped)
  loc: string
  started: string // formatted for display
  lastSeen: string // formatted for display
  startedAt: number // epoch ms (sorting)
  lastSeenAt: number // epoch ms (sorting)
  current: boolean
  status: string
}

/** A user with all their active device sessions. */
export type SessionUser = {
  id: string // account email — the stable group key
  memberId: number
  name: string
  email: string
  initials: string
  lastActive: string // most-recent last-seen, formatted
  firstLogin: string // earliest session start, formatted
  sessions: SessionItem[]
}

function cleanIp(raw?: string | null): string {
  if (!raw) return ""
  const s = raw.replace(/^\[|\]$/g, "").trim()
  const m = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(s) // IPv4:port
  return m ? m[1] : s
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
}

function epoch(iso?: string | null): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return isNaN(t) ? 0 : t
}

function toSessionItem(d: SessionDTO): SessionItem {
  return {
    id: d.session_id,
    code: d.user_session_id ?? "",
    browser:
      d.browser && d.browser !== "Unknown" ? d.browser : "Unknown browser",
    os: d.os && d.os !== "Unknown" ? d.os : "Unknown OS",
    device: d.device ?? "Device",
    ip: cleanIp(d.ip_address),
    loc: d.location ?? "",
    started: fmtDateTime(d.started_at),
    lastSeen: fmtDateTime(d.last_seen_at),
    startedAt: epoch(d.started_at),
    lastSeenAt: epoch(d.last_seen_at),
    current: !!d.current,
    status: d.status ?? "",
  }
}

/** Map the API's per-user groups to SessionUsers (most-recently-active first). */
export function toSessionUsers(groups: SessionGroupDTO[]): SessionUser[] {
  const users = (groups ?? []).map((g): SessionUser => {
    const sessions = (g.sessions ?? [])
      .map(toSessionItem)
      .sort(
        (a, b) =>
          Number(b.current) - Number(a.current) || b.lastSeenAt - a.lastSeenAt
      )
    const name = g.user ?? g.account ?? ""
    const lastSeenMax = Math.max(0, ...sessions.map((s) => s.lastSeenAt))
    const startedVals = sessions.map((s) => s.startedAt).filter((n) => n > 0)
    const startedMin = startedVals.length ? Math.min(...startedVals) : 0
    return {
      id: g.account ?? String(g.member_id ?? ""),
      memberId: g.member_id ?? 0,
      name,
      email: g.account ?? "",
      initials: initialsFromName(name),
      lastActive: lastSeenMax
        ? fmtDateTime(new Date(lastSeenMax).toISOString())
        : "",
      firstLogin: startedMin
        ? fmtDateTime(new Date(startedMin).toISOString())
        : "",
      sessions,
    }
  })

  return users.sort(
    (a, b) =>
      Math.max(0, ...b.sessions.map((s) => s.lastSeenAt)) -
      Math.max(0, ...a.sessions.map((s) => s.lastSeenAt))
  )
}

/* --------------------------------------------------------------- mfa detail --- */

/* GET /platform/settings/mfa-status/{memberId} — one member's MFA enrolment.
   `enabled_on` is null (not modeled by the API yet). */
export type MfaDetailDTO = {
  member_id: number
  account?: string | null
  user?: string | null
  enabled?: boolean | null
  methods?: string[] | null
  backup_codes?: number | null
  enabled_on?: string | null
}

export type MfaDetail = {
  memberId: number
  account: string
  user: string
  enabled: boolean
  /** Enrolled methods, e.g. ["totp", "sms", "webauthn"]. */
  methods: string[]
  /** Remaining backup codes; null when not applicable / not tracked. */
  backupCodes: number | null
  enabledOn: string | null
}

export function toMfaDetail(d: MfaDetailDTO): MfaDetail {
  return {
    memberId: d.member_id,
    account: d.account ?? "",
    user: d.user ?? "",
    enabled: !!d.enabled,
    methods: d.methods ?? [],
    backupCodes: d.backup_codes ?? null,
    enabledOn: d.enabled_on ?? null,
  }
}

/* --------------------------------------------------- password status --- */

/** Per-member password health (90-day rotation policy). */
export type PasswordState = "OK" | "EXPIRING" | "EXPIRED" | "PENDING"

/** Derive a state from days-until-expiry when the API doesn't send an explicit
   one (mirrors the mock policy): invited / no-password → PENDING; <0 → EXPIRED;
   ≤14 → EXPIRING; else OK. */
export function derivePasswordState(
  daysLeft: number | null,
  pending: boolean
): PasswordState {
  if (pending || daysLeft == null) return "PENDING"
  if (daysLeft < 0) return "EXPIRED"
  if (daysLeft <= 14) return "EXPIRING"
  return "OK"
}

/** Normalise an API status string to a PasswordState (null if unrecognised so
   the caller falls back to deriving from daysLeft). */
function normPasswordState(s?: string | null): PasswordState | null {
  const u = (s ?? "").toUpperCase().replace(/[\s_-]+/g, "_")
  if (!u) return null
  if (u.includes("EXPIRING") || u.includes("SOON")) return "EXPIRING"
  if (u.includes("EXPIRED") || u.includes("OVERDUE")) return "EXPIRED"
  if (u.includes("PENDING") || u.includes("INVITED") || u.includes("NONE"))
    return "PENDING"
  if (
    u.includes("OK") ||
    u.includes("HEALTHY") ||
    u.includes("ACTIVE") ||
    u.includes("GOOD") ||
    u.includes("CURRENT")
  )
    return "OK"
  return null
}

/* snake_case as the API returns it (API_REFERENCE.md → GET
   /platform/settings/password-status). A few alternate key names are tolerated
   defensively. */
export type PasswordStatusDTO = {
  member_id?: number | null
  member?: { id?: number | null } | null
  account?: string | null
  user?: string | null
  status?: string | null
  pending?: boolean | null
  last_changed_at?: string | null
  last_changed?: string | null
  changed_at?: string | null
  password_last_changed?: string | null
  expires_at?: string | null
  expires_on?: string | null
  expiry_date?: string | null
  days_until_expiry?: number | null
  days_left?: number | null
}

export type PasswordStatus = {
  memberId: number
  /** Display name (DTO `user`). */
  name: string
  /** Login / email (DTO `account`). */
  email: string
  state: PasswordState
  /** ISO / display string of the last change; "" when unknown. */
  lastChanged: string
  /** ISO / display string of the expiry; "" when unknown. */
  expiresOn: string
  daysLeft: number | null
}

export function toPasswordStatus(d: PasswordStatusDTO): PasswordStatus {
  const daysLeft = d.days_until_expiry ?? d.days_left ?? null
  const lastChanged =
    d.last_changed_at ??
    d.last_changed ??
    d.changed_at ??
    d.password_last_changed ??
    ""
  const expiresOn = d.expires_at ?? d.expires_on ?? d.expiry_date ?? ""
  const pending = !!d.pending || (!lastChanged && daysLeft == null)
  const state =
    normPasswordState(d.status) ?? derivePasswordState(daysLeft, pending)
  return {
    memberId: d.member_id ?? d.member?.id ?? -1,
    name: d.user ?? "",
    email: d.account ?? "",
    state,
    lastChanged,
    expiresOn,
    daysLeft,
  }
}

/* ---- summary (KPI tiles) + the list envelope `{ summary, users }` ---- */

export type PasswordSummaryDTO = {
  total_users?: number | null
  ok?: number | null
  expiring_soon?: number | null
  expired?: number | null
  pending?: number | null
}

export type PasswordSummary = {
  totalUsers: number
  ok: number
  expiringSoon: number
  expired: number
  pending: number
}

/** GET /platform/settings/password-status → `{ summary, users }`. */
export type PasswordStatusListDTO = {
  summary?: PasswordSummaryDTO | null
  users?: PasswordStatusDTO[] | null
}

export type PasswordStatusList = {
  summary: PasswordSummary
  statuses: PasswordStatus[]
}

/** Map the API summary; when absent, derive the counts from the rows so the
   tiles still populate. */
export function toPasswordSummary(
  dto: PasswordSummaryDTO | null | undefined,
  rows: PasswordStatus[]
): PasswordSummary {
  if (dto) {
    return {
      totalUsers: dto.total_users ?? rows.length,
      ok: dto.ok ?? 0,
      expiringSoon: dto.expiring_soon ?? 0,
      expired: dto.expired ?? 0,
      pending: dto.pending ?? 0,
    }
  }
  const count = (s: PasswordState) => rows.filter((r) => r.state === s).length
  return {
    totalUsers: rows.length,
    ok: count("OK"),
    expiringSoon: count("EXPIRING"),
    expired: count("EXPIRED"),
    pending: count("PENDING"),
  }
}
