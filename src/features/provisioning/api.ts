/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. Covers the full provisioning +
   technical-review surface (11 endpoints). */

import { apiGet, apiPost, apiPut } from "@/lib/api/client"

import {
  toProvisioning,
  toRemark,
  type AddRemarkRequest,
  type AssignProvisioningRequest,
  type Provisioning,
  type ProvisioningDTO,
  type Remark,
  type RemarkDTO,
  type SaveSectionRequest,
  type SetStageRequest,
} from "./types"

export type ProvisioningQuery = { stage?: string; assignee?: string }

const BASE = "/platform/provisioning"

/* ------------------------------------------------------------- reads --- */

/** GET /platform/provisioning → the tenant provisioning queue. */
export async function fetchProvisioning(
  q: ProvisioningQuery = {}
): Promise<Provisioning[]> {
  const params: Record<string, string> = {}
  if (q.stage) params.stage = q.stage
  if (q.assignee) params.assignee = q.assignee
  const rows = await apiGet<ProvisioningDTO[]>(BASE, { params })
  return (rows ?? []).map(toProvisioning)
}

/** GET /platform/provisioning/mine → the caller's own provisioning queue. */
export async function fetchProvisioningMine(): Promise<Provisioning[]> {
  const rows = await apiGet<ProvisioningDTO[]>(`${BASE}/mine`)
  return (rows ?? []).map(toProvisioning)
}

/** GET /platform/provisioning/{tenantId} → one tenant's full provisioning detail. */
export async function fetchProvisioningDetail(
  tenantId: number
): Promise<Provisioning> {
  return toProvisioning(await apiGet<ProvisioningDTO>(`${BASE}/${tenantId}`))
}

/** GET /platform/provisioning/{tenantId}/remarks → the technical-review trail. */
export async function fetchRemarks(tenantId: number): Promise<Remark[]> {
  const rows = await apiGet<RemarkDTO[]>(`${BASE}/${tenantId}/remarks`)
  return (rows ?? []).map(toRemark)
}

/* ------------------------------------------------------------ writes --- */

/** POST …/{tenantId}/assign → assign provisioning to an engineer (admin only). */
export async function assignProvisioning(
  tenantId: number,
  body: AssignProvisioningRequest
): Promise<Provisioning> {
  return toProvisioning(
    await apiPost<ProvisioningDTO>(`${BASE}/${tenantId}/assign`, body)
  )
}

/** PUT …/{tenantId}/sections/{section} → save a config section's settings. */
export async function saveSection(
  tenantId: number,
  section: string,
  body: SaveSectionRequest
): Promise<Provisioning> {
  return toProvisioning(
    await apiPut<ProvisioningDTO>(
      `${BASE}/${tenantId}/sections/${section}`,
      body
    )
  )
}

/** POST …/{tenantId}/sections/{section}/test → run the section's test; marks DONE. */
export async function testSection(
  tenantId: number,
  section: string
): Promise<Provisioning> {
  return toProvisioning(
    await apiPost<ProvisioningDTO>(`${BASE}/${tenantId}/sections/${section}/test`)
  )
}

/** POST …/{tenantId}/stage → manually set the provisioning stage (e.g. BLOCKED). */
export async function setStage(
  tenantId: number,
  body: SetStageRequest
): Promise<Provisioning> {
  return toProvisioning(
    await apiPost<ProvisioningDTO>(`${BASE}/${tenantId}/stage`, body)
  )
}

/** POST …/{tenantId}/sections/{section}/approve → reviewer approves a section. */
export async function approveSection(
  tenantId: number,
  section: string
): Promise<Provisioning> {
  return toProvisioning(
    await apiPost<ProvisioningDTO>(
      `${BASE}/${tenantId}/sections/${section}/approve`
    )
  )
}

/** POST …/{tenantId}/sections/{section}/remarks → add a technical-review remark. */
export async function addRemark(
  tenantId: number,
  section: string,
  body: AddRemarkRequest
): Promise<Provisioning> {
  return toProvisioning(
    await apiPost<ProvisioningDTO>(
      `${BASE}/${tenantId}/sections/${section}/remarks`,
      body
    )
  )
}

/** POST /platform/provisioning/remarks/{remarkId}/resolve → resolve a remark. */
export async function resolveRemark(remarkId: string): Promise<Remark> {
  return toRemark(
    await apiPost<RemarkDTO>(`${BASE}/remarks/${remarkId}/resolve`)
  )
}
