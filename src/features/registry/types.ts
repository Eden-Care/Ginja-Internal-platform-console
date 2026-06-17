/* Module registry — the platform functionality (module) catalogue.

   Reads GET /platform/organization/functionalities (API_GUIDE.md §3) and maps
   each functionality onto the RegistryModule shape the existing registry table
   and drawer render. The API is a flat catalogue, so fields it doesn't carry
   (version, owner team, tenant counts, sub-modules) are left empty and surface
   as "—"/0 in the UI. A dedicated mapper here keeps `status`, which the shared
   features/access Functionality type drops. */

import type { ModuleStatus, RegistryModule } from "@/lib/console-data"

/** FunctionalityResponse — snake_case exactly as the API returns it. */
export type FunctionalityDTO = {
  id: number
  functionality_id: string
  code: string
  name: string
  description: string | null
  status: string
}

/** Known module codes → a fitting Glyph name (Glyph falls back for the rest). */
const CODE_GLYPH: Record<string, string> = {
  CLAIMS: "claims",
  FINANCE: "finance",
  MEMBER: "crm",
  PROVIDER: "providers",
  EMPLOYER: "building",
  REPORTING: "analytics",
  ACCESS: "underwriting",
  TENANT: "building",
}

/** API status → the registry's Published/Beta/Sunset vocabulary so the existing
   status badge + tones render unchanged (ACTIVE ≙ available ≙ "Published"). */
function toModuleStatus(status: string): ModuleStatus {
  const s = (status ?? "").toUpperCase()
  if (s === "ACTIVE") return "Published"
  if (s === "INACTIVE" || s === "ARCHIVED" || s === "DEPRECATED")
    return "Sunset"
  return "Beta"
}

export function toRegistryModule(d: FunctionalityDTO): RegistryModule {
  const code = (d.code ?? "").toUpperCase()
  return {
    id: d.code,
    name: d.name,
    icon: CODE_GLYPH[code] ?? "layers",
    version: "—",
    status: toModuleStatus(d.status),
    owner: "—",
    tenants: 0,
    desc: d.description ?? "",
    subs: [],
  }
}
