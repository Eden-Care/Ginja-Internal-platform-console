/* Insurers — API service layer over the `/platform/insurance-companies`
 * endpoints. Each function returns mapped client types (never raw DTOs) and
 * logs the raw response to the console for diagnostics. */

import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import {
  type DirectoryDTO,
  type Insurer,
  type InsurerAuditDTO,
  type InsurerAuditEntry,
  type InsurerDirectory,
  type InsurerDTO,
  toAuditEntry,
  toInsurer,
} from "./types"

const BASE = "/platform/insurance-companies"

/** Create-form display company type → API `company_type` enum. */
const COMPANY_TYPE: Record<string, string> = {
  "Health insurer": "HEALTH_INSURER",
  "Composite insurer": "COMPOSITE_INSURER",
  "Third-party administrator (TPA)": "TPA",
  Reinsurer: "REINSURER",
  "Micro-insurer": "MICRO_INSURER",
}

export type ListInsurersParams = {
  q?: string
  status?: "ACTIVE" | "INACTIVE"
  page?: number
  size?: number
}

/** GET the directory — summary tiles + a page of companies (mapped). */
export async function fetchInsurersDirectory(
  params: ListInsurersParams = {}
): Promise<InsurerDirectory> {
  const dto = await apiGet<DirectoryDTO>(BASE, {
    params: { page: 0, size: 200, ...params },
  })
  console.log(`[GET ${BASE}] directory`, dto)
  return {
    summary: dto.summary,
    companies: dto.companies.content.map(toInsurer),
    totalElements: dto.companies.total_elements,
  }
}

/** GET one insurer profile (Overview). */
export async function fetchInsurerProfile(accountId: string): Promise<Insurer> {
  const dto = await apiGet<InsurerDTO>(`${BASE}/${accountId}`)
  console.log(`[GET ${BASE}/${accountId}] profile`, dto)
  return toInsurer(dto)
}

/** GET the audit trail for one profile (mapped, newest first). */
export async function fetchInsurerAudit(
  accountId: string
): Promise<InsurerAuditEntry[]> {
  const dto = await apiGet<InsurerAuditDTO[]>(`${BASE}/${accountId}/audit`)
  console.log(`[GET ${BASE}/${accountId}/audit]`, dto)
  return (dto ?? []).map(toAuditEntry)
}

export type CreateInsurerInput = {
  name: string
  country: string
  type: string
  city: string
  address: string
  regulator: string
  license: string
  contact: string
  email: string
  phone: string
}

/** Map the form input → the snake_case request body (create + update share it).
   Blank optional fields become null (partial PATCH ignores nulls). */
function toRequestBody(input: CreateInsurerInput) {
  return {
    name: input.name.trim(),
    country: input.country,
    company_type: COMPANY_TYPE[input.type] ?? input.type,
    city: input.city.trim() || null,
    registered_address: input.address.trim() || null,
    regulator: input.regulator.trim() || null,
    licence_number: input.license.trim() || null,
    contact_name: input.contact.trim() || null,
    contact_email: input.email.trim() || null,
    contact_phone: input.phone.trim() || null,
  }
}

/** POST create an insurer profile → the created insurer (mapped). */
export async function createInsurer(input: CreateInsurerInput): Promise<Insurer> {
  const dto = await apiPost<InsurerDTO>(BASE, toRequestBody(input))
  console.log(`[POST ${BASE}] create`, dto)
  return toInsurer(dto)
}

/** PATCH update an insurer profile (partial) → the updated insurer (mapped). */
export async function updateInsurer(
  accountId: string,
  input: CreateInsurerInput
): Promise<Insurer> {
  const dto = await apiPatch<InsurerDTO>(
    `${BASE}/${accountId}`,
    toRequestBody(input)
  )
  console.log(`[PATCH ${BASE}/${accountId}] update`, dto)
  return toInsurer(dto)
}

/** POST deactivate (reason required) → the updated insurer (mapped). */
export async function deactivateInsurer(
  accountId: string,
  reason: string
): Promise<Insurer> {
  const dto = await apiPost<InsurerDTO>(`${BASE}/${accountId}/deactivate`, {
    reason,
  })
  console.log(`[POST ${BASE}/${accountId}/deactivate]`, dto)
  return toInsurer(dto)
}

/** POST reactivate → the updated insurer (mapped). */
export async function reactivateInsurer(accountId: string): Promise<Insurer> {
  const dto = await apiPost<InsurerDTO>(`${BASE}/${accountId}/reactivate`)
  console.log(`[POST ${BASE}/${accountId}/reactivate]`, dto)
  return toInsurer(dto)
}
