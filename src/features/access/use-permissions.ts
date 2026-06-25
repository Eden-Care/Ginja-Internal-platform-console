import { useQuery } from "@tanstack/react-query"

import { fetchPermissions } from "./api"
import { permissionKeys } from "./queries"

/** The permission catalogue — drives the role editor's grouped capability matrix. */
export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: fetchPermissions,
  })
}
