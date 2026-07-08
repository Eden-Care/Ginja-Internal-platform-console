/* Query-key factories — the single source of truth for cache keys in the
   Access & Security domain. Mutations invalidate by the `all` prefix so any
   list/detail under it refetches. */

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
}

export const permissionKeys = {
  all: ["permissions"] as const,
  lists: () => [...permissionKeys.all, "list"] as const,
}

export const memberKeys = {
  all: ["members"] as const,
  list: (query: unknown) => [...memberKeys.all, "list", query] as const,
  metrics: () => [...memberKeys.all, "metrics"] as const,
  detail: (id: number) => [...memberKeys.all, "detail", id] as const,
  activity: (id: number) => [...memberKeys.all, "activity", id] as const,
}
