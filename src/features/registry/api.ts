/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"
import type { PagedDTO } from "@/lib/api/paged"
import type { RegistryModule } from "@/lib/console-data"

import { toRegistryModule, type ModuleDTO } from "./types"

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
