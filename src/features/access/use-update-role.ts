import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignFunctionalities,
  fetchRole,
  unassignFunctionality,
  updateRoleDetails,
} from "./api"
import { roleKeys } from "./queries"
import type { Role } from "./types"

export type UpdateRoleInput = {
  role: Role
  name: string
  description: string
  functionalityCodes: string[]
}

/** Edit a CUSTOM role: PATCH name/description, then sync its modules by diffing
   against the current set (add the new, remove the dropped). Returns the fresh
   role from the server. */
export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      role,
      name,
      description,
      functionalityCodes,
    }: UpdateRoleInput) => {
      if (name !== role.name || description !== role.description) {
        await updateRoleDetails(role.id, { name, description })
      }
      const next = new Set(functionalityCodes)
      const toAdd = functionalityCodes.filter(
        (c) => !role.functionalityCodes.includes(c)
      )
      const toRemove = role.functionalityCodes.filter((c) => !next.has(c))
      if (toAdd.length) await assignFunctionalities(role.id, toAdd)
      for (const code of toRemove) await unassignFunctionality(role.id, code)
      return fetchRole(role.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
