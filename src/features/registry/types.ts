/* Module registry — the platform module catalogue.

   Reads GET /platform/organization/modules (paged) and maps each module onto
   the RegistryModule shape the registry table + drawer render. Unlike the old
   functionalities endpoint, this carries every field the UI needs: version,
   owner team, status, and sub-modules. DTOs are snake_case exactly as the API
   returns them; a toX() mapper keeps snake_case out of components. */

import type {
  ModuleStatus,
  RegistryModule,
  SubModule,
} from "@/lib/console-data"

export type SubModuleDTO = {
  id?: number
  sub_module_id?: string
  code: string
  name: string
  description?: string | null
  /** Code of the sub-module this one depends on (if any). */
  requires?: string | null
}

export type ModuleDTO = {
  id?: number
  module_id?: string
  code: string
  name: string
  description?: string | null
  icon?: string | null
  url?: string | null
  version?: string | null
  owner_team?: string | null
  status?: string | null
  /** Active tenant count (alt keys tolerated). */
  tenants?: number | null
  active_tenants?: number | null
  sub_modules?: SubModuleDTO[] | null
}

/** Fallback Glyph per code when the API doesn't send an `icon`. */
const CODE_GLYPH: Record<string, string> = {
  CLAIMS: "claims",
  FINANCE: "finance",
  MEMBER: "crm",
  PROVIDER: "providers",
  EMPLOYER: "building",
  REPORTING: "analytics",
  ACCESS: "underwriting",
  TENANT: "building",
  REINSURANCE: "reinsurance",
}

/** API status → the registry's Published/Beta/Sunset vocabulary. */
function toModuleStatus(status: string | null | undefined): ModuleStatus {
  switch ((status ?? "").toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
      return "Published"
    case "SUNSET":
    case "DEPRECATED":
    case "ARCHIVED":
    case "INACTIVE":
      return "Sunset"
    default:
      // BETA / DRAFT / unknown
      return "Beta"
  }
}

function toSubModule(d: SubModuleDTO): SubModule {
  return {
    id: d.code,
    name: d.name,
    desc: d.description ?? "",
    requires: d.requires ?? undefined,
  }
}

/* A module as the onboarding entitlement step needs it: the functional `code`
   (the value PUT /entitlements expects as `module_code`) plus display fields and
   sub-modules. RegistryModule folds `code` into `id` for the registry table, so
   this is a distinct, code-preserving view over the same endpoint. */
export type ModuleCatalogueSub = {
  code: string
  name: string
  description: string
  /** Code of the sub-module this one depends on (if any). */
  requires?: string
}

export type ModuleCatalogueItem = {
  /** Functional code, e.g. "CLAIMS" — the value PUT /entitlements expects. */
  code: string
  name: string
  description: string
  subs: ModuleCatalogueSub[]
}

export function toModuleCatalogueItem(d: ModuleDTO): ModuleCatalogueItem {
  return {
    code: (d.code ?? "").toUpperCase(),
    name: d.name,
    description: d.description ?? "",
    subs: (d.sub_modules ?? []).map((s) => ({
      code: s.code,
      name: s.name,
      description: s.description ?? "",
      requires: s.requires ?? undefined,
    })),
  }
}

export function toRegistryModule(d: ModuleDTO): RegistryModule {
  const code = (d.code ?? "").toUpperCase()
  return {
    // module_id (e.g. "MRC000001") is the identifier the get-one endpoint
    // expects at /modules/{moduleId}; fall back to the functional code.
    id: d.module_id ?? d.code,
    name: d.name,
    icon: d.icon || CODE_GLYPH[code] || "layers",
    version: d.version || "—",
    status: toModuleStatus(d.status),
    owner: d.owner_team || "—",
    tenants: d.tenants ?? d.active_tenants ?? 0,
    desc: d.description ?? "",
    subs: (d.sub_modules ?? []).map(toSubModule),
  }
}
