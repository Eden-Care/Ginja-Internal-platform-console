/* Thin service functions for the Tenant accounts (Payers) domain — list +
   the full onboarding write flow (§8). Returns mapped client types. */

import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client"

import {
  toPayer,
  type AddDocumentRequest,
  type CreatePayerRequest,
  type Payer,
  type PayerDTO,
  type SetEntitlementsRequest,
  type SetSubscriptionRequest,
  type SubdomainCheck,
  type TechnicalRequest,
  type TenantDetailsRequest,
  type TenantLookup,
} from "./types"

const BASE = "/platform/payers"

/** GET /platform/payers → all payers (every lifecycle state; plain array). */
export async function fetchPayers(): Promise<Payer[]> {
  const rows = await apiGet<PayerDTO[]>(BASE)
  return (rows ?? []).map(toPayer)
}

/** GET /platform/payers/{id} → one payer. */
export async function fetchPayer(id: number): Promise<Payer> {
  return toPayer(await apiGet<PayerDTO>(`${BASE}/${id}`))
}

/* ----------------------------------------------- onboarding pre-checks --- */

/** GET …/subdomain-check?value= → sanitise + availability + suggestions. */
export async function checkSubdomain(value: string): Promise<SubdomainCheck> {
  return apiGet<SubdomainCheck>(`${BASE}/subdomain-check`, {
    params: { value },
  })
}

/** GET …/tenant-lookup → duplicate detection by legal name and/or tax number. */
export async function lookupTenant(query: {
  legalEntityName?: string
  taxVatNumber?: string
}): Promise<TenantLookup> {
  const params: Record<string, string> = {}
  if (query.legalEntityName) params.legal_entity_name = query.legalEntityName
  if (query.taxVatNumber) params.tax_vat_number = query.taxVatNumber
  const r = await apiGet<{
    found: boolean
    matched_by: string[]
    tenant: {
      legal_entity_name: string
      tenant_code: string
      country: string | null
      payer_status: string | null
    } | null
  }>(`${BASE}/tenant-lookup`, { params })
  return {
    found: r?.found ?? false,
    matchedBy: r?.matched_by ?? [],
    tenant: r?.tenant
      ? {
          legalEntityName: r.tenant.legal_entity_name,
          tenantCode: r.tenant.tenant_code,
          country: r.tenant.country,
          payerStatus: r.tenant.payer_status,
        }
      : null,
  }
}

/* -------------------------------------------------- onboarding writes --- */

/** POST /platform/payers → create payer + primary tenant (DRAFT). */
export async function createPayer(body: CreatePayerRequest): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(BASE, body))
}

/** POST …/{payerId}/tenants → add a secondary tenant. */
export async function addSecondaryTenant(
  payerId: number,
  body: TenantDetailsRequest
): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(`${BASE}/${payerId}/tenants`, body))
}

/** PATCH …/{payerId}/tenants/{tenantId}/technical → subdomain + infra config. */
export async function patchTechnical(
  payerId: number,
  tenantId: number,
  body: TechnicalRequest
): Promise<Payer> {
  return toPayer(
    await apiPatch<PayerDTO>(
      `${BASE}/${payerId}/tenants/${tenantId}/technical`,
      body
    )
  )
}

/** PUT …/{payerId}/entitlements → replace the entitlement set. */
export async function setEntitlements(
  payerId: number,
  body: SetEntitlementsRequest
): Promise<Payer> {
  return toPayer(await apiPut<PayerDTO>(`${BASE}/${payerId}/entitlements`, body))
}

/** PUT …/{payerId}/subscription → set the subscription (ACTIVE structure). */
export async function setSubscription(
  payerId: number,
  body: SetSubscriptionRequest
): Promise<Payer> {
  return toPayer(await apiPut<PayerDTO>(`${BASE}/${payerId}/subscription`, body))
}

/** POST …/{payerId}/tenants/{tenantId}/documents → add document metadata. */
export async function addDocument(
  payerId: number,
  tenantId: number,
  body: AddDocumentRequest
): Promise<Payer> {
  return toPayer(
    await apiPost<PayerDTO>(
      `${BASE}/${payerId}/tenants/${tenantId}/documents`,
      body
    )
  )
}

/** POST …/{payerId}/submit → validate + submit for approval. */
export async function submitPayer(payerId: number): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(`${BASE}/${payerId}/submit`))
}
