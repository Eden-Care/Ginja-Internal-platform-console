import { useQuery } from "@tanstack/react-query"

import { fetchRoles } from "./api"
import { roleKeys } from "./queries"

/** All roles (system + custom) for the Roles & permissions screen. */
export function useRoles() {
  return useQuery({ queryKey: roleKeys.lists(), queryFn: fetchRoles })
}
