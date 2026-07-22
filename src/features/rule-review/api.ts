/* Rule review — API service layer over `/platform/rule-review`. Returns mapped
   client types (never raw DTOs). */

import { apiGet } from "@/lib/api/client"

import {
  toRuleReviewDashboard,
  type RuleReviewDashboard,
  type RuleReviewDashboardDTO,
} from "./types"

const BASE = "/platform/rule-review"

/** GET the reviewer dashboard — token-scoped to the signed-in member (tile
    counts + assignment rows). `assigneeId` is an ADMIN-only override to inspect
    another member's queue; omit it for the normal "assigned to me" view. */
export async function fetchRuleReviewDashboard(
  assigneeId?: number
): Promise<RuleReviewDashboard> {
  const dto = await apiGet<RuleReviewDashboardDTO>(`${BASE}/dashboard`, {
    params: assigneeId != null ? { assignee_id: assigneeId } : undefined,
  })
  console.log(`[GET ${BASE}/dashboard]`, dto)
  return toRuleReviewDashboard(dto)
}
