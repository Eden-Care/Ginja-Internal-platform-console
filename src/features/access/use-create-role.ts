import { useMutation, useQueryClient } from "@tanstack/react-query"

import { createRole } from "./api"
import { roleKeys } from "./queries"

/** Create-role mutation. Invalidates the roles list on success; the caller
   handles success/error UX (toast, navigate back) at the call site. */
export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => qc.invalidateQueries({ queryKey: roleKeys.all }),
  })
}
