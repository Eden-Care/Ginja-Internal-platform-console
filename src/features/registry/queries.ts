/* Query-key factory for the module registry. */

export const registryKeys = {
  all: ["module-registry"] as const,
  metrics: () => [...registryKeys.all, "metrics"] as const,
  lists: () => [...registryKeys.all, "list"] as const,
  catalogue: () => [...registryKeys.all, "catalogue"] as const,
  infinite: () => [...registryKeys.all, "infinite"] as const,
  search: (q: string) => [...registryKeys.all, "search", q] as const,
  detail: (moduleId: string) =>
    [...registryKeys.all, "detail", moduleId] as const,
  versions: (moduleId: string) =>
    [...registryKeys.all, "versions", moduleId] as const,
  activity: (moduleId: string) =>
    [...registryKeys.all, "activity", moduleId] as const,
  compare: (moduleId: string, from: string, to: string) =>
    [...registryKeys.all, "compare", moduleId, from, to] as const,
}
