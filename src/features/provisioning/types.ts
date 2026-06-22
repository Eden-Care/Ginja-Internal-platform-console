/* Tenant provisioning / system-configuration queue (PRD step 6).

   DTOs are snake_case exactly as the API returns them; client types are
   camelCase with a toX() mapper at the boundary so snake_case never leaks into
   components. See API_GUIDE.md §10A and the Provisioning folder of
   Ginja-Console.postman_collection.json. */

/** Subset of MiniBadge's tones used by stage pills. */
type StageTone = "neutral" | "warning" | "success" | "error"

/** Queue stage. Auto-advances AWAITING_START → IN_PROGRESS → READY_TO_ACTIVATE
   (a manual BLOCKED is preserved until changed). */
export type ProvStage =
  | "AWAITING_START"
  | "IN_PROGRESS"
  | "READY_TO_ACTIVATE"
  | "BLOCKED"

/** One config section (DATABASE, DOMAINS_SSL, EMAIL, SMS, DATA_MIGRATION). */
export type ProvSectionDTO = {
  config_id: string
  section: string
  status: string
  config: Record<string, unknown> | null
  last_result: string | null
  last_tested_at: string | null
}

export type ProvisioningDTO = {
  provisioning_id: string
  tenant_id: number
  tenant_code: string
  subdomain: string | null
  legal_entity_name: string
  stage: ProvStage | string
  assignee: string | null
  sections_done: number
  sections_total: number
  sections?: ProvSectionDTO[] | null
}

export type ProvSection = {
  configId: string
  section: string
  status: string
  config: Record<string, unknown> | null
  lastResult: string | null
  lastTestedAt: string | null
}

/** The camelCase queue row the UI renders. */
export type Provisioning = {
  /** Human-readable provisioning id. */
  id: string
  tenantId: number
  tenantCode: string
  subdomain: string
  legalEntityName: string
  stage: ProvStage
  assignee: string | null
  sectionsDone: number
  sectionsTotal: number
  sections: ProvSection[]
}

export function toProvSection(d: ProvSectionDTO): ProvSection {
  return {
    configId: d.config_id,
    section: d.section,
    status: d.status,
    config: d.config ?? null,
    lastResult: d.last_result,
    lastTestedAt: d.last_tested_at,
  }
}

export function toProvisioning(d: ProvisioningDTO): Provisioning {
  return {
    id: d.provisioning_id,
    tenantId: d.tenant_id,
    tenantCode: d.tenant_code,
    subdomain: d.subdomain ?? "",
    legalEntityName: d.legal_entity_name,
    stage: (d.stage as ProvStage) ?? "AWAITING_START",
    assignee: d.assignee,
    sectionsDone: d.sections_done ?? 0,
    sectionsTotal: d.sections_total ?? 0,
    sections: (d.sections ?? []).map(toProvSection),
  }
}

/** Human-readable stage label for pills. */
export const PROV_STAGE_LABEL: Record<ProvStage, string> = {
  AWAITING_START: "Awaiting start",
  IN_PROGRESS: "In progress",
  READY_TO_ACTIVATE: "Ready to activate",
  BLOCKED: "Blocked",
}

/** Badge tone per stage (mirrors the status→tone mapping used elsewhere). */
export const PROV_STAGE_TONE: Record<ProvStage, StageTone> = {
  AWAITING_START: "neutral",
  IN_PROGRESS: "warning",
  READY_TO_ACTIVATE: "success",
  BLOCKED: "error",
}
