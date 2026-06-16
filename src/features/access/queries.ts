/* Query-key factories — the single source of truth for cache keys in the
   Access & Security domain. Mutations invalidate by the `all` prefix so any
   list/detail under it refetches. */

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
}

export const functionalityKeys = {
  all: ["functionalities"] as const,
  lists: () => [...functionalityKeys.all, "list"] as const,
}

export const memberKeys = {
  all: ["members"] as const,
  list: (query: unknown) => [...memberKeys.all, "list", query] as const,
}
