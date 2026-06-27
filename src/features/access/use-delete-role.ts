import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteRole } from "./api"
import { roleKeys } from "./queries"

/** Delete a CUSTOM role. The API returns 409 (surfaced as ApiError) if the role
   is still assigned to any member — the caller toasts that message. */
export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
