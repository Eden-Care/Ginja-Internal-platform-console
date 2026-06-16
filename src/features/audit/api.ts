import { apiGet } from "@/lib/api/client"
import { toPaged, type Paged, type PagedDTO } from "@/lib/api/paged"

import { toAuditRow, type AuditLogDTO, type AuditRow } from "./types"

export type AuditQuery = {
  entityType?: string
  action?: string
  actor?: string
  page?: number
  size?: number
}

/** GET /platform/organization/audit-logs (paged). */
export async function fetchAuditLogs(
  q: AuditQuery = {}
): Promise<Paged<AuditRow>> {
  const params: Record<string, string | number> = {
    page: q.page ?? 0,
    size: q.size ?? 50,
    sort: "createdAt,desc",
  }
  if (q.entityType) params.entity_type = q.entityType
  if (q.action) params.action = q.action
  if (q.actor) params.actor = q.actor

  const dto = await apiGet<PagedDTO<AuditLogDTO>>(
    "/platform/organization/audit-logs",
    { params }
  )
  return toPaged(dto, toAuditRow)
}

/** GET /platform/organization/audit-logs/modules → entity types for filtering. */
export async function fetchAuditModules(): Promise<string[]> {
  return apiGet<string[]>("/platform/organization/audit-logs/modules")
}
