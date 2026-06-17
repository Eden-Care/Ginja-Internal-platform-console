/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"
import type { RegistryModule } from "@/lib/console-data"

import { toRegistryModule, type FunctionalityDTO } from "./types"

/** GET /platform/organization/functionalities → the platform module catalogue. */
export async function fetchModuleRegistry(): Promise<RegistryModule[]> {
  const rows = await apiGet<FunctionalityDTO[]>(
    "/platform/organization/functionalities"
  )
  console.log("[GET /platform/organization/functionalities]", rows)
  return rows.map(toRegistryModule)
}
