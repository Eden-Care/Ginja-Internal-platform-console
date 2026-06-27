import { useQuery } from "@tanstack/react-query"

import {
  fetchModuleActivity,
  fetchModuleCompare,
  fetchModuleVersions,
} from "./api"
import { registryKeys } from "./queries"

/** A module's version history (GET .../{id}/versions). */
export function useModuleVersions(moduleId: string | null) {
  return useQuery({
    queryKey: registryKeys.versions(moduleId ?? ""),
    queryFn: () => fetchModuleVersions(moduleId as string),
    enabled: !!moduleId,
  })
}

/** A module's audit feed (GET .../{id}/activity). */
export function useModuleActivity(moduleId: string | null) {
  return useQuery({
    queryKey: registryKeys.activity(moduleId ?? ""),
    queryFn: () => fetchModuleActivity(moduleId as string),
    enabled: !!moduleId,
  })
}

/** Field-level diff of two versions (GET .../{id}/versions/compare?from&to).
   Enabled only when both versions are present and differ. */
export function useModuleCompare(
  moduleId: string | null,
  from: string | null,
  to: string | null
) {
  return useQuery({
    queryKey: registryKeys.compare(moduleId ?? "", from ?? "", to ?? ""),
    queryFn: () =>
      fetchModuleCompare(moduleId as string, from as string, to as string),
    enabled: !!moduleId && !!from && !!to && from !== to,
  })
}
