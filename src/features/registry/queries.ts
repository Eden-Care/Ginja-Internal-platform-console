/* Query-key factory for the module registry. */

export const registryKeys = {
  all: ["module-registry"] as const,
  lists: () => [...registryKeys.all, "list"] as const,
  search: (q: string) => [...registryKeys.all, "search", q] as const,
  detail: (moduleId: string) =>
    [...registryKeys.all, "detail", moduleId] as const,
}
