/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"
import type { PagedDTO } from "@/lib/api/paged"
import type { RegistryModule } from "@/lib/console-data"

import {
  toModuleCatalogueItem,
  toRegistryModule,
  type ModuleCatalogueItem,
  type ModuleDTO,
} from "./types"

type ModuleListDTO = PagedDTO<ModuleDTO> | ModuleDTO[]

/** Rows out of either a Spring page envelope or a plain array. */
function rowsOf(res: ModuleListDTO): ModuleDTO[] {
  return Array.isArray(res) ? res : (res.content ?? [])
}

/** GET /platform/organization/modules → the platform module catalogue (paged). */
export async function fetchModuleRegistry(): Promise<RegistryModule[]> {
  const res = await apiGet<ModuleListDTO>("/platform/organization/modules", {
    params: { page: 0, size: 100, sort: "code,asc" },
  })
  console.log("[GET /platform/organization/modules]", res)
  return rowsOf(res).map(toRegistryModule)
}

/** A new tenant can only be entitled to live modules — DRAFT (unreleased) and
    SUNSET (retiring) modules are excluded from the onboarding catalogue. */
function isEntitleable(d: ModuleDTO): boolean {
  const status = (d.status ?? "").toUpperCase()
  return status !== "DRAFT" && status !== "SUNSET"
}

/** GET /platform/organization/modules → the catalogue for the onboarding
    entitlement step. Same endpoint as the registry, but keeps each module's
    functional `code` (what PUT /entitlements expects, which RegistryModule drops)
    and offers only entitleable (non-DRAFT/SUNSET) modules. */
export async function fetchModuleCatalogue(): Promise<ModuleCatalogueItem[]> {
  const res = await apiGet<ModuleListDTO>("/platform/organization/modules", {
    params: { page: 0, size: 100, sort: "code,asc" },
  })
  return rowsOf(res).filter(isEntitleable).map(toModuleCatalogueItem)
}

/** GET /platform/organization/modules/search?q= → modules matching the query. */
export async function searchModuleRegistry(
  q: string
): Promise<RegistryModule[]> {
  const res = await apiGet<ModuleListDTO>(
    "/platform/organization/modules/search",
    { params: { q } }
  )
  console.log("[GET /platform/organization/modules/search]", { q, res })
  return rowsOf(res).map(toRegistryModule)
}

/** GET /platform/organization/modules/{moduleId} → one module (full detail). */
export async function fetchModule(moduleId: string): Promise<RegistryModule> {
  const res = await apiGet<ModuleDTO>(
    `/platform/organization/modules/${moduleId}`
  )
  console.log(`[GET /platform/organization/modules/${moduleId}]`, res)
  return toRegistryModule(res)
}
