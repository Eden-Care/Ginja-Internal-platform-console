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

export function toRegistryModule(d: ModuleDTO): RegistryModule {
  const code = (d.code ?? "").toUpperCase()
  return {
    // module_id (e.g. "MRC000001") is the identifier the get-one endpoint
    // expects at /modules/{moduleId}; fall back to the functional code.
    id: d.module_id ?? d.code,
    code: d.code ?? "",
    url: d.url ?? "",
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

/* ------------------------------------------------ create / update bodies --- */

export type SubModuleInput = {
  code: string
  name: string
  description?: string
  requires?: string
}

/** POST /platform/organization/modules body (snake_case, as the API expects). */
export type CreateModuleBody = {
  code: string
  name: string
  description?: string
  icon?: string
  url?: string
  version?: string
  owner_team?: string
  status?: string
  sub_modules: SubModuleInput[]
}

/** PATCH /platform/organization/modules/{id} body — same shape, all optional. */
export type UpdateModuleBody = Partial<CreateModuleBody>

/* ------------------------------------------------------------- versions --- */

export type ModuleVersionDTO = {
  version: string
  status?: string | null
  note?: string | null
  by?: string | null
  by_name?: string | null
  created_at?: string | null
  published_at?: string | null
  current?: boolean | null
  snapshot?: ModuleDTO | null
}

/** One row of a module's version history. */
export type ModuleVersion = {
  version: string
  status: string
  note: string
  byName: string
  createdAt: string
  current: boolean
}

export function toModuleVersion(d: ModuleVersionDTO): ModuleVersion {
  return {
    version: d.version ?? "",
    status: d.status ?? "",
    note: d.note ?? "",
    byName: d.by_name ?? d.by ?? "",
    createdAt: d.created_at ?? "",
    current: !!d.current,
  }
}

/* ------------------------------------------------------------- activity --- */

export type ModuleChangeMap = Record<
  string,
  { from?: unknown; to?: unknown }
> | null

export type ModuleActivityDTO = {
  audit_id: string
  actor?: string | null
  actor_name?: string | null
  actor_role?: string | null
  action: string
  entity_id?: string | null
  entity_label?: string | null
  changes?: ModuleChangeMap
  reason?: string | null
  created_at?: string | null
  kind?: string | null
}

export type ModuleFieldChange = { field: string; from: string; to: string }

export type ModuleActivity = {
  id: string
  actor: string
  /** Raw action code, e.g. "MODULE_PUBLISHED". */
  action: string
  createdAt: string
  kind: string
  reason: string
  changes: ModuleFieldChange[]
}

const valueStr = (v: unknown): string =>
  v === null || v === undefined || v === "" ? "—" : String(v)

function toFieldChanges(changes: ModuleChangeMap): ModuleFieldChange[] {
  if (!changes) return []
  return Object.entries(changes).map(([field, v]) => ({
    field,
    from: valueStr(v?.from),
    to: valueStr(v?.to),
  }))
}

export function toModuleActivity(d: ModuleActivityDTO): ModuleActivity {
  return {
    id: d.audit_id,
    actor: d.actor_name || d.actor || "—",
    action: d.action ?? "",
    createdAt: d.created_at ?? "",
    kind: d.kind ?? "",
    reason: d.reason ?? "",
    changes: toFieldChanges(d.changes ?? null),
  }
}

/* -------------------------------------------------------------- compare --- */

export type ModuleCompareDTO = {
  from?: ModuleVersionDTO | null
  to?: ModuleVersionDTO | null
  sub_modules_added?: SubModuleDTO[] | null
  sub_modules_removed?: SubModuleDTO[] | null
  changed_fields?: ModuleChangeMap
}

export type ModuleCompare = {
  fromVersion: string
  toVersion: string
  changedFields: ModuleFieldChange[]
  subsAdded: { code: string; name: string }[]
  subsRemoved: { code: string; name: string }[]
}

export function toModuleCompare(d: ModuleCompareDTO): ModuleCompare {
  const subs = (list: SubModuleDTO[] | null | undefined) =>
    (list ?? []).map((s) => ({ code: s.code, name: s.name }))
  return {
    fromVersion: d.from?.version ?? "",
    toVersion: d.to?.version ?? "",
    changedFields: toFieldChanges(d.changed_fields ?? null),
    subsAdded: subs(d.sub_modules_added),
    subsRemoved: subs(d.sub_modules_removed),
  }
}
