/* Query-key factory for rules-extraction checks. */

import type { RulesCheckQuery } from "./api"

export const rulesCheckKeys = {
  all: ["rules-checks"] as const,
  lists: () => [...rulesCheckKeys.all, "list"] as const,
  list: (q: RulesCheckQuery) => [...rulesCheckKeys.lists(), q] as const,
  detail: (checkId: string) =>
    [...rulesCheckKeys.all, "detail", checkId] as const,
}
