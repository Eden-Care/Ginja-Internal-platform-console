/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet, apiPatch, apiPost } from "@/lib/api/client"
import { toPaged, type Paged, type PagedDTO } from "@/lib/api/paged"
import type { RegistryModule } from "@/lib/console-data"

import {
  toModuleActivity,
  toModuleCompare,
  toModuleVersion,
  toRegistryModule,
  type CreateModuleBody,
  type ModuleActivity,
  type ModuleActivityDTO,
  type ModuleCompare,
  type ModuleCompareDTO,
  type ModuleDTO,
  type ModuleVersion,
  type ModuleVersionDTO,
  type UpdateModuleBody,
} from "./types"

const MODULES = "/platform/organization/modules"

type ModuleListDTO = PagedDTO<ModuleDTO> | ModuleDTO[]

/** Rows out of either a Spring page envelope or a plain array. */
function rowsOf(res: ModuleListDTO): ModuleDTO[] {
  return Array.isArray(res) ? res : (res.content ?? [])
}

/** GET /platform/organization/modules → the platform module catalogue (paged).
   Tolerates either the Spring page envelope or a bare array (single page). */
export async function fetchModuleRegistry(
  page = 0,
  size = 20
): Promise<Paged<RegistryModule>> {
  const res = await apiGet<ModuleListDTO>(MODULES, {
    params: { page, size, sort: "code,asc" },
  })
  console.log("[GET /platform/organization/modules]", res)
  if (Array.isArray(res)) {
    const items = res.map(toRegistryModule)
    return {
      items,
      page: 0,
      size: items.length,
      totalElements: items.length,
      totalPages: 1,
    }
  }
  return toPaged(res, toRegistryModule)
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
  const res = await apiGet<ModuleDTO>(`${MODULES}/${moduleId}`)
  console.log(`[GET /platform/organization/modules/${moduleId}]`, res)
  return toRegistryModule(res)
}

/** POST /platform/organization/modules → register a new module. */
export async function createModule(
  body: CreateModuleBody
): Promise<RegistryModule> {
  const res = await apiPost<ModuleDTO>(MODULES, body)
  console.log("[POST /platform/organization/modules]", { body, response: res })
  return toRegistryModule(res)
}

/** PATCH /platform/organization/modules/{moduleId} → update (creates a version). */
export async function updateModule(
  moduleId: string,
  body: UpdateModuleBody
): Promise<RegistryModule> {
  const res = await apiPatch<ModuleDTO>(`${MODULES}/${moduleId}`, body)
  console.log(`[PATCH /platform/organization/modules/${moduleId}]`, {
    body,
    response: res,
  })
  return toRegistryModule(res)
}

/** POST .../{moduleId}/versions/{version}/rollback → restore that version's
   content as a new (published) version. Returns the updated module. */
export async function rollbackModule(
  moduleId: string,
  version: string
): Promise<RegistryModule> {
  const res = await apiPost<ModuleDTO>(
    `${MODULES}/${moduleId}/versions/${version}/rollback`,
    undefined
  )
  console.log(
    `[POST /platform/organization/modules/${moduleId}/versions/${version}/rollback]`,
    res
  )
  return toRegistryModule(res)
}

/** GET .../{moduleId}/versions → the module's version history (newest first). */
export async function fetchModuleVersions(
  moduleId: string
): Promise<ModuleVersion[]> {
  const res = await apiGet<ModuleVersionDTO[]>(
    `${MODULES}/${moduleId}/versions`
  )
  console.log(`[GET /platform/organization/modules/${moduleId}/versions]`, res)
  return (res ?? []).map(toModuleVersion)
}

/** GET .../{moduleId}/activity → the module's audit feed (paged, newest first). */
export async function fetchModuleActivity(
  moduleId: string,
  page = 0,
  size = 20
): Promise<Paged<ModuleActivity>> {
  const res = await apiGet<PagedDTO<ModuleActivityDTO>>(
    `${MODULES}/${moduleId}/activity`,
    { params: { page, size, sort: "createdAt,desc" } }
  )
  console.log(`[GET /platform/organization/modules/${moduleId}/activity]`, res)
  return toPaged(res, toModuleActivity)
}

/** GET .../{moduleId}/versions/compare?from&to → field-level diff of two versions. */
export async function fetchModuleCompare(
  moduleId: string,
  from: string,
  to: string
): Promise<ModuleCompare> {
  const res = await apiGet<ModuleCompareDTO>(
    `${MODULES}/${moduleId}/versions/compare`,
    { params: { from, to } }
  )
  console.log(
    `[GET /platform/organization/modules/${moduleId}/versions/compare?from=${from}&to=${to}]`,
    res
  )
  return toModuleCompare(res)
}
