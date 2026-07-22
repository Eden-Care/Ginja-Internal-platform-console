/* Thin service over the rules-extraction checks API
   (`/platform/rule-extraction/rules-checks`). Returns mapped client types —
   never raw DTOs. Reads are ADMIN / SUPPORT / SERVICE; writes ADMIN only. */

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client"

import {
  toRulesCheck,
  type CreateRulesCheckBody,
  type RulesCheck,
  type RulesCheckDTO,
  type UpdateRulesCheckBody,
} from "./types"

const BASE = "/platform/rule-extraction/rules-checks"

export type RulesCheckQuery = {
  /** Category filter (exact, case-insensitive). */
  category?: string
  /** Return only active checks. */
  active?: boolean
}

/** GET /rules-checks?category&active → checks, ordered by sort order then id. */
export async function fetchRulesChecks(
  q: RulesCheckQuery = {}
): Promise<RulesCheck[]> {
  const params: Record<string, string | boolean> = {}
  if (q.category) params.category = q.category
  if (q.active != null) params.active = q.active
  const res = await apiGet<RulesCheckDTO[]>(BASE, { params })
  console.log("[GET /platform/rule-extraction/rules-checks]", { q, res })
  return (res ?? []).map(toRulesCheck)
}

/** GET /rules-checks/{checkId} → one check by its CHK-NNN id. */
export async function fetchRulesCheck(checkId: string): Promise<RulesCheck> {
  const res = await apiGet<RulesCheckDTO>(`${BASE}/${checkId}`)
  console.log(`[GET /platform/rule-extraction/rules-checks/${checkId}]`, res)
  return toRulesCheck(res)
}

/** POST /rules-checks → the created check (check_id is generated). */
export async function createRulesCheck(
  body: CreateRulesCheckBody
): Promise<RulesCheck> {
  const res = await apiPost<RulesCheckDTO>(BASE, body)
  console.log("[POST /platform/rule-extraction/rules-checks]", { body, res })
  return toRulesCheck(res)
}

/** PATCH /rules-checks/{checkId} → the updated check (partial body). */
export async function updateRulesCheck(
  checkId: string,
  body: UpdateRulesCheckBody
): Promise<RulesCheck> {
  const res = await apiPatch<RulesCheckDTO>(`${BASE}/${checkId}`, body)
  console.log(`[PATCH /platform/rule-extraction/rules-checks/${checkId}]`, {
    body,
    res,
  })
  return toRulesCheck(res)
}

/** DELETE /rules-checks/{checkId} — hard-delete. */
export async function deleteRulesCheck(checkId: string): Promise<void> {
  await apiDelete(`${BASE}/${checkId}`)
  console.log(`[DELETE /platform/rule-extraction/rules-checks/${checkId}]`)
}
