import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createModule, rollbackModule, updateModule } from "./api"
import { registryKeys } from "./queries"
import type { CreateModuleBody, UpdateModuleBody } from "./types"

/** Register a new module; refreshes the catalogue list on success. */
export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateModuleBody) => createModule(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: registryKeys.all }),
  })
}

/** Update a module (also covers publish/unpublish); refreshes list + detail. */
export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { moduleId: string; body: UpdateModuleBody }) =>
      updateModule(vars.moduleId, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: registryKeys.all }),
  })
}

/** Roll a module back to an earlier version (creates a new published version). */
export function useRollbackModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { moduleId: string; version: string }) =>
      rollbackModule(vars.moduleId, vars.version),
    onSuccess: () => qc.invalidateQueries({ queryKey: registryKeys.all }),
  })
}
