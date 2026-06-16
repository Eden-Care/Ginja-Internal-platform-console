import { useQuery } from "@tanstack/react-query"

import { fetchFunctionalities } from "./api"
import { functionalityKeys } from "./queries"

/** The module catalogue — drives the role editor's module matrix. */
export function useFunctionalities() {
  return useQuery({
    queryKey: functionalityKeys.lists(),
    queryFn: fetchFunctionalities,
  })
}
