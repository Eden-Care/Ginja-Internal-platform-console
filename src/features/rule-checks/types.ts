/* Rules-extraction checks — the master catalogue (CHK-NNN) the document service
   reads during Claim Clean-up contract rule extraction. Snake_case `*DTO` ↔
   camelCase client type + `toX` mapper. CRUD lives at
   `/platform/rule-extraction/rules-checks` (reads ADMIN / SUPPORT / SERVICE;
   writes ADMIN only). */

import { fmtDate } from "@/lib/console-format"

/** Criticality tiers accepted by the API (create/update enum). */
export type Criticality = "MANDATORY" | "EXPECTED" | "OPTIONAL"

export const CRITICALITIES: Criticality[] = [
  "MANDATORY",
  "EXPECTED",
  "OPTIONAL",
]

/* --------------------------------------------------------------- list/get-one --- */

export type RulesCheckDTO = {
  id: number
  check_id: string
  category: string
  rule_type: string | null
  extraction_guidance: string | null
  fields_to_extract: string | null
  trigger_keywords: string | null
  typical_location: string | null
  criticality: Criticality
  if_missing: string | null
  rule_check_mapping: string | null
  triggered_at: string | null
  consequence_of_breach: string | null
  sort_order: number | null
  active: boolean
  created_by_name: string | null
  created_at: string | null
  updated_at: string | null
}

/** The row/detail shape the UI binds to. */
export type RulesCheck = {
  /** Numeric id (not used for API calls — the API keys off `checkId`). */
  id: number
  /** Business id, e.g. "CHK-001" — the display id and API path param. */
  checkId: string
  category: string
  ruleType: string
  extractionGuidance: string
  fieldsToExtract: string
  triggerKeywords: string
  typicalLocation: string
  criticality: Criticality
  ifMissing: string
  ruleCheckMapping: string
  triggeredAt: string
  consequenceOfBreach: string
  sortOrder: number
  active: boolean
  createdByName: string
  /** Humanised dates for display. */
  createdAt: string
  updatedAt: string
}

export function toRulesCheck(d: RulesCheckDTO): RulesCheck {
  return {
    id: d.id,
    checkId: d.check_id,
    category: d.category ?? "",
    ruleType: d.rule_type ?? "",
    extractionGuidance: d.extraction_guidance ?? "",
    fieldsToExtract: d.fields_to_extract ?? "",
    triggerKeywords: d.trigger_keywords ?? "",
    typicalLocation: d.typical_location ?? "",
    criticality: d.criticality ?? "OPTIONAL",
    ifMissing: d.if_missing ?? "",
    ruleCheckMapping: d.rule_check_mapping ?? "",
    triggeredAt: d.triggered_at ?? "",
    consequenceOfBreach: d.consequence_of_breach ?? "",
    sortOrder: d.sort_order ?? 0,
    active: d.active ?? true,
    createdByName: d.created_by_name ?? "",
    createdAt: fmtDate(d.created_at),
    updatedAt: fmtDate(d.updated_at),
  }
}

/* ------------------------------------------------------------- create/update --- */

/** POST body. `category` + `criticality` required; the rest optional. */
export type CreateRulesCheckBody = {
  category: string
  rule_type?: string
  extraction_guidance?: string
  fields_to_extract?: string
  trigger_keywords?: string
  typical_location?: string
  criticality: Criticality
  if_missing?: string
  rule_check_mapping?: string
  triggered_at?: string
  consequence_of_breach?: string
  sort_order?: number
  active?: boolean
}

/** PATCH body — partial; only non-null fields are applied (incl. `active`). */
export type UpdateRulesCheckBody = Partial<CreateRulesCheckBody>
