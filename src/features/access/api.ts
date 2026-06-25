/* Thin service functions over the API client. Each returns mapped client types,
   never the raw DTO — callers (hooks/pages) stay free of snake_case. */

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client"
import { toPaged, type Paged, type PagedDTO } from "@/lib/api/paged"

import {
  toMember,
  toMemberActivity,
  toPermission,
  toRole,
  type CreateRoleRequest,
  type Member,
  type MemberActivity,
  type MemberActivityDTO,
  type MemberDTO,
  type MemberStatus,
  type OnboardMemberRequest,
  type Permission,
  type PermissionDTO,
  type Role,
  type RoleDTO,
} from "./types"

/** GET /platform/organization/roles → all roles (system + custom). */
export async function fetchRoles(): Promise<Role[]> {
  const rows = await apiGet<RoleDTO[]>("/platform/organization/roles")
  return rows.map(toRole)
}

/** GET /platform/organization/permissions → the capability catalogue that the
    role editor grants from (a flat list; the UI groups it by group_code). */
export async function fetchPermissions(): Promise<Permission[]> {
  const rows = await apiGet<PermissionDTO[]>(
    "/platform/organization/permissions"
  )
  return rows.map(toPermission)
}

/** GET /platform/organization/roles/{id} → one role. */
export async function fetchRole(id: number): Promise<Role> {
  const row = await apiGet<RoleDTO>(`/platform/organization/roles/${id}`)
  return toRole(row)
}

/** POST /platform/organization/roles → the created role. */
export async function createRole(body: CreateRoleRequest): Promise<Role> {
  const row = await apiPost<RoleDTO>("/platform/organization/roles", body)
  return toRole(row)
}

/** PATCH /platform/organization/roles/{id} → updated name/description/colour (CUSTOM only). */
export async function updateRoleDetails(
  id: number,
  body: { name?: string; description?: string; hex_color?: string }
): Promise<Role> {
  const row = await apiPatch<RoleDTO>(
    `/platform/organization/roles/${id}`,
    body
  )
  return toRole(row)
}

/** POST …/roles/{id}/permissions → add permissions (idempotent). */
export async function assignPermissions(
  id: number,
  codes: string[]
): Promise<Role> {
  const row = await apiPost<RoleDTO>(
    `/platform/organization/roles/${id}/permissions`,
    { permission_codes: codes }
  )
  return toRole(row)
}

/** DELETE …/roles/{id}/permissions/{permissionCode} → remove one permission. */
export async function unassignPermission(
  id: number,
  code: string
): Promise<Role> {
  const row = await apiDelete<RoleDTO>(
    `/platform/organization/roles/${id}/permissions/${code}`
  )
  return toRole(row)
}

/** DELETE /platform/organization/roles/{id} (CUSTOM only; 409 if still assigned). */
export async function deleteRole(id: number): Promise<void> {
  await apiDelete<void>(`/platform/organization/roles/${id}`)
}

/* --------------------------------------------------------------- members --- */

const MEMBERS = "/platform/organization/members"

export type MemberQuery = { q?: string; status?: string; page?: number; size?: number }

/** GET /platform/organization/members (paged). */
export async function fetchMembers(
  query: MemberQuery = {}
): Promise<Paged<Member>> {
  const params: Record<string, string | number> = {
    page: query.page ?? 0,
    size: query.size ?? 100,
    sort: "createdAt,desc",
  }
  if (query.q) params.q = query.q
  if (query.status) params.status = query.status
  const dto = await apiGet<PagedDTO<MemberDTO>>(MEMBERS, { params })
  return toPaged(dto, toMember)
}

/** GET /platform/organization/members/{id} → one member (full detail). */
export async function fetchMember(id: number): Promise<Member> {
  const row = await apiGet<MemberDTO>(`${MEMBERS}/${id}`)
  return toMember(row)
}

/** POST /platform/organization/members → onboard + send the invite in one call
    (no password ⇒ INVITED). Pass `expiry_days` to set the link validity. */
export async function onboardMember(
  body: OnboardMemberRequest
): Promise<Member> {
  const row = await apiPost<MemberDTO>(MEMBERS, body)
  return toMember(row)
}

export async function resendInvite(id: number): Promise<void> {
  await apiPost(`${MEMBERS}/${id}/resend-invite`)
}

export async function revokeInvite(id: number): Promise<void> {
  await apiPost(`${MEMBERS}/${id}/revoke-invite`)
}

/** PUT …/members/{id}/status → change status (reason mandatory when suspending). */
export async function setMemberStatus(
  id: number,
  status: MemberStatus,
  reason?: string
): Promise<Member> {
  const row = await apiPut<MemberDTO>(`${MEMBERS}/${id}/status`, {
    status,
    ...(reason ? { reason } : {}),
  })
  return toMember(row)
}

/** POST …/members/{id}/roles → add roles (idempotent). */
export async function assignMemberRoles(
  id: number,
  roleIds: number[]
): Promise<Member> {
  const row = await apiPost<MemberDTO>(`${MEMBERS}/${id}/roles`, {
    role_ids: roleIds,
  })
  return toMember(row)
}

/** DELETE …/members/{id}/roles/{roleId} → remove one role. */
export async function unassignMemberRole(
  id: number,
  roleId: number
): Promise<Member> {
  const row = await apiDelete<MemberDTO>(`${MEMBERS}/${id}/roles/${roleId}`)
  return toMember(row)
}

/** DELETE /platform/organization/members/{id} → hard delete. */
export async function deleteMember(id: number): Promise<void> {
  await apiDelete<void>(`${MEMBERS}/${id}`)
}

/** GET …/members/{id}/activity (paged) → the member's audit-trail timeline. */
export async function fetchMemberActivity(
  id: number,
  size = 50
): Promise<MemberActivity[]> {
  const dto = await apiGet<PagedDTO<MemberActivityDTO>>(
    `${MEMBERS}/${id}/activity`,
    { params: { page: 0, size, sort: "createdAt,desc" } }
  )
  return (dto.content ?? []).map(toMemberActivity)
}
