/* TanStack Query hooks for rules-extraction checks. Queries read; mutations
   invalidate the catalogue on success. Mutations don't toast/navigate — the
   page owns all UX. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createRulesCheck,
  deleteRulesCheck,
  fetchRulesChecks,
  updateRulesCheck,
  type RulesCheckQuery,
} from "./api"
import { rulesCheckKeys } from "./queries"
import type { CreateRulesCheckBody, UpdateRulesCheckBody } from "./types"

/** The full catalogue (optionally filtered server-side by category/active). */
export function useRulesChecks(q: RulesCheckQuery = {}) {
  return useQuery({
    queryKey: rulesCheckKeys.list(q),
    queryFn: () => fetchRulesChecks(q),
  })
}

export function useCreateRulesCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRulesCheckBody) => createRulesCheck(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: rulesCheckKeys.all }),
  })
}

export function useUpdateRulesCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { checkId: string; body: UpdateRulesCheckBody }) =>
      updateRulesCheck(vars.checkId, vars.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: rulesCheckKeys.all }),
  })
}

export function useDeleteRulesCheck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (checkId: string) => deleteRulesCheck(checkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: rulesCheckKeys.all }),
  })
}
