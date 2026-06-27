/* Access & Security domain — roles, the permission catalogue, and members.

   The backend grants a role a set of PERMISSIONS (each belonging to a capability
   group), plus an accent colour and optional region scopes — there is no
   "functionalities/modules" axis on roles. DTOs are snake_case exactly as the
   API returns them; client types are camelCase, with a toX() mapper at the
   boundary so snake_case never leaks into components. See API_REFERENCE.md
   §Roles/Permissions and the Roles/Permissions folders of
   Ginja-Console.postman_collection.json. */

/** A capability in the permission catalogue (GET /platform/organization/permissions). */
export type PermissionDTO = {
  id: number
  permission_id: string
  code: string
  name: string
  description: string | null
  /** Capability group this permission belongs to (e.g. ACCESS_SECURITY). */
  group_code: string | null
  group_label: string | null
  /** High-risk capability — surfaced with a "Sensitive" badge in the editor. */
  sensitive: boolean
  status: string
}

export type Permission = {
  id: number
  code: string
  name: string
  description: string
  groupCode: string
  groupLabel: string
  sensitive: boolean
}

export function toPermission(d: PermissionDTO): Permission {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description ?? "",
    groupCode: d.group_code ?? "OTHER",
    groupLabel: d.group_label ?? "Other",
    sensitive: !!d.sensitive,
  }
}

/** Permissions bucketed by capability group — the shape the grouped role-editor
   matrix renders (mirrors the hi-fi PERM_CATALOG design). */
export type PermissionGroup = {
  code: string
  label: string
  permissions: Permission[]
}

/** Group a flat permission list by `groupCode`, preserving first-seen order. */
export function groupPermissions(perms: Permission[]): PermissionGroup[] {
  const groups: PermissionGroup[] = []
  const byCode = new Map<string, PermissionGroup>()
  for (const p of perms) {
    let g = byCode.get(p.groupCode)
    if (!g) {
      g = { code: p.groupCode, label: p.groupLabel, permissions: [] }
      byCode.set(p.groupCode, g)
      groups.push(g)
    }
    g.permissions.push(p)
  }
  return groups
}

/** RoleResponse — `permissions` carries the role's granted capabilities; the
   role's display name is `role_name` (the `name` is the UPPER_SNAKE authority). */
export type RoleDTO = {
  id: number
  role_id: string
  name: string
  role_name: string | null
  description: string | null
  type: "SYSTEM" | "CUSTOM" | string
  status: string
  /** Accent colour for the role badge, as a hex string (may be null). */
  hex_color: string | null
  permissions?: PermissionDTO[] | null
  region_scopes?: string[] | null
  created_at: string
}

/** The camelCase role the UI renders. */
export type Role = {
  id: number
  /** Human-readable code, e.g. "ROL000002". */
  code: string
  /** Display name (role_name when present, else the authority name). */
  name: string
  description: string
  /** SYSTEM roles are built-in and immutable; CUSTOM roles are admin-authored. */
  system: boolean
  /** Accent colour (hex) when the backend has one; null falls back to a derived tint. */
  hexColor: string | null
  /** Permission codes this role grants. */
  permissionCodes: string[]
  permissions: Permission[]
  /** Region codes the role is scoped to (empty = no restriction). */
  regionScopes: string[]
  createdAt: string
}

export function toRole(d: RoleDTO): Role {
  const permissions = (d.permissions ?? []).map(toPermission)
  return {
    id: d.id,
    code: d.role_id,
    name: d.role_name ?? d.name,
    description: d.description ?? "",
    system: d.type === "SYSTEM",
    hexColor: d.hex_color,
    permissionCodes: permissions.map((p) => p.code),
    permissions,
    regionScopes: d.region_scopes ?? [],
    createdAt: d.created_at,
  }
}

/** POST /platform/organization/roles body. `permission_codes` may be empty. */
export type CreateRoleRequest = {
  name: string
  description?: string
  hex_color?: string
  permission_codes: string[]
}

/* --------------------------------------------------------------- members --- */

export type MemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED"

export type MemberRoleRef = { id: number; name: string }

/** MemberResponse — the Users directory row (enriched: invited_by, last_active, …).
   These fields are present on BOTH the list and detail payloads. */
export type MemberDTO = {
  id: number
  member_id: string
  email: string
  full_name: string
  status: MemberStatus | string
  /** Reason captured when suspending (null otherwise). */
  status_reason?: string | null
  /** Whether the member has enrolled a second factor. */
  mfa_enabled?: boolean | null
  roles?: MemberRoleRef[] | null
  /** Effective capability-group codes (union of the member's roles' groups). */
  accessible_modules?: string[] | null
  /** Effective permission codes (union of the member's roles' permissions). */
  accessible_permissions?: string[] | null
  invited_by: string | null
  /** Invite link expiry (ISO) + a server-computed expired flag — INVITED only. */
  invite_expires_at?: string | null
  invite_expired?: boolean | null
  member_since: string | null
  last_active: string | null
  active_sessions: number
  created_at: string
}

export type Member = {
  id: number
  /** Human-readable code, e.g. "MBR000005". */
  code: string
  email: string
  name: string
  status: MemberStatus
  /** Reason captured when the member was suspended (null otherwise). */
  statusReason: string | null
  /** Whether a second factor is enrolled. */
  mfaEnabled: boolean
  roles: MemberRoleRef[]
  roleIds: number[]
  /** Effective capability-group codes across all assigned roles. */
  accessibleModules: string[]
  /** Effective permission codes across all assigned roles. */
  accessiblePermissions: string[]
  invitedBy: string | null
  /** Invite expiry (ISO) + expired flag — meaningful only while INVITED. */
  inviteExpiresAt: string | null
  inviteExpired: boolean
  /** ISO timestamps (null when never). */
  memberSince: string | null
  lastActive: string | null
  activeSessions: number
}

export function toMember(d: MemberDTO): Member {
  const roles = d.roles ?? []
  return {
    id: d.id,
    code: d.member_id,
    email: d.email,
    name: d.full_name,
    status: (d.status as MemberStatus) ?? "INVITED",
    statusReason: d.status_reason ?? null,
    mfaEnabled: !!d.mfa_enabled,
    roles,
    roleIds: roles.map((r) => r.id),
    accessibleModules: d.accessible_modules ?? [],
    accessiblePermissions: d.accessible_permissions ?? [],
    invitedBy: d.invited_by,
    inviteExpiresAt: d.invite_expires_at ?? null,
    inviteExpired: !!d.invite_expired,
    memberSince: d.member_since,
    lastActive: d.last_active,
    activeSessions: d.active_sessions ?? 0,
  }
}

/* ----------------------------------------------------- member activity --- */

/** One row of a member's activity feed (GET /members/{id}/activity) — an
   audit-trail entry scoped to that member. The backend supplies `kind`. */
export type MemberActivityDTO = {
  audit_id: string
  actor: string | null
  actor_name: string | null
  actor_role: string | null
  action: string
  module: string | null
  module_label: string | null
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  reason: string | null
  created_at: string
  kind: string | null
}

export type MemberActivity = {
  id: string
  /** Categorical kind for the timeline dot tone/icon (from the API). */
  kind: string
  /** Prettified action label, e.g. "User invited". */
  label: string
  actor: string
  reason: string | null
  /** ISO timestamp. */
  at: string
}

/** "USER_INVITED" → "User invited". */
function prettyAction(action: string): string {
  const s = action.replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function toMemberActivity(d: MemberActivityDTO): MemberActivity {
  return {
    id: d.audit_id,
    kind: (d.kind ?? "system").toLowerCase(),
    label: prettyAction(d.action),
    actor: d.actor_name || d.actor || "—",
    reason: d.reason,
    at: d.created_at,
  }
}

/** POST /platform/organization/members body — creates the member and sends the
   invite (no password → stays INVITED). `expiry_days` (1-90, default 7) sets the
   invite validity; there is no separate "send invite" endpoint. */
export type OnboardMemberRequest = {
  email: string
  full_name: string
  role_ids?: number[]
  expiry_days?: number
}
