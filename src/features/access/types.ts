/* Access & Security domain — roles and functionalities (modules).

   DTOs are snake_case exactly as the API returns them; client types are
   camelCase. A `toX()` mapper sits at the boundary so snake_case never leaks
   into components. See API_GUIDE.md §3–4 and the Roles/Functionalities folders
   of Ginja-Console.postman_collection.json. */

/** A platform module (e.g. CLAIMS, FINANCE) — the unit a role is granted. */
export type FunctionalityDTO = {
  id: number
  functionality_id: string
  code: string
  name: string
  description: string | null
  status: string
}

export type Functionality = {
  id: number
  code: string
  name: string
  description: string
}

export function toFunctionality(d: FunctionalityDTO): Functionality {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description ?? "",
  }
}

/** RoleResponse — the `functionalities` array carries the role's granted modules. */
export type RoleDTO = {
  id: number
  role_id: string
  name: string
  description: string | null
  type: "SYSTEM" | "CUSTOM" | string
  status: string
  functionalities?: FunctionalityDTO[] | null
  created_at: string
}

/** The camelCase role the UI renders. */
export type Role = {
  id: number
  /** Human-readable code, e.g. "ROL000002". */
  code: string
  name: string
  description: string
  /** SYSTEM roles are built-in and immutable; CUSTOM roles are admin-authored. */
  system: boolean
  /** Functionality (module) codes this role grants. */
  functionalityCodes: string[]
  functionalities: Functionality[]
  createdAt: string
}

export function toRole(d: RoleDTO): Role {
  const functionalities = (d.functionalities ?? []).map(toFunctionality)
  return {
    id: d.id,
    code: d.role_id,
    name: d.name,
    description: d.description ?? "",
    system: d.type === "SYSTEM",
    functionalityCodes: functionalities.map((f) => f.code),
    functionalities,
    createdAt: d.created_at,
  }
}

/** POST /platform/organization/roles body. `functionality_codes` may be empty. */
export type CreateRoleRequest = {
  name: string
  description?: string
  functionality_codes: string[]
}

/* --------------------------------------------------------------- members --- */

export type MemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED"

export type MemberRoleRef = { id: number; name: string }

/** MemberResponse — the Users directory row (enriched: invited_by, last_active, …). */
export type MemberDTO = {
  id: number
  member_id: string
  email: string
  full_name: string
  status: MemberStatus | string
  roles?: MemberRoleRef[] | null
  accessible_modules?: string[] | null
  accessible_permissions?: string[] | null
  invited_by: string | null
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
  roles: MemberRoleRef[]
  roleIds: number[]
  invitedBy: string | null
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
    roles,
    roleIds: roles.map((r) => r.id),
    invitedBy: d.invited_by,
    memberSince: d.member_since,
    lastActive: d.last_active,
    activeSessions: d.active_sessions ?? 0,
  }
}

/** POST /platform/organization/members body (no password → stays INVITED). */
export type OnboardMemberRequest = {
  email: string
  full_name: string
  role_ids?: number[]
}
