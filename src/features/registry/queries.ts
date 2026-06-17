/* Query-key factory for the module registry (functionality catalogue). */

export const registryKeys = {
  all: ["module-registry"] as const,
  lists: () => [...registryKeys.all, "list"] as const,
}
