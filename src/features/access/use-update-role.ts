import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignPermissions,
  fetchRole,
  unassignPermission,
  updateRoleDetails,
} from "./api"
import { roleKeys } from "./queries"
import type { Role } from "./types"

export type UpdateRoleInput = {
  role: Role
  name: string
  description: string
  hexColor?: string
  permissionCodes: string[]
}

/** Edit a CUSTOM role: PATCH name/description/colour, then sync its permissions
   by diffing against the current set (add the new, remove the dropped). Returns
   the fresh role from the server. */
export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      role,
      name,
      description,
      hexColor,
      permissionCodes,
    }: UpdateRoleInput) => {
      const colorChanged = hexColor != null && hexColor !== role.hexColor
      if (
        name !== role.name ||
        description !== role.description ||
        colorChanged
      ) {
        await updateRoleDetails(role.id, {
          name,
          description,
          ...(colorChanged ? { hex_color: hexColor } : {}),
        })
      }
      const next = new Set(permissionCodes)
      const toAdd = permissionCodes.filter(
        (c) => !role.permissionCodes.includes(c)
      )
      const toRemove = role.permissionCodes.filter((c) => !next.has(c))
      if (toAdd.length) await assignPermissions(role.id, toAdd)
      for (const code of toRemove) await unassignPermission(role.id, code)
      return fetchRole(role.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
