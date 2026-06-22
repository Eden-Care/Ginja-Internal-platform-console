/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"

import {
  toProvisioning,
  type Provisioning,
  type ProvisioningDTO,
} from "./types"

export type ProvisioningQuery = { stage?: string; assignee?: string }

/** GET /platform/provisioning → the tenant provisioning queue. */
export async function fetchProvisioning(
  q: ProvisioningQuery = {}
): Promise<Provisioning[]> {
  const params: Record<string, string> = {}
  if (q.stage) params.stage = q.stage
  if (q.assignee) params.assignee = q.assignee

  const rows = await apiGet<ProvisioningDTO[]>("/platform/provisioning", {
    params,
  })
  console.log("[GET /platform/provisioning]", rows)
  return rows.map(toProvisioning)
}
