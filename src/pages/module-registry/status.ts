import type { ModuleStatus } from "@/lib/console-data"

/** Module status → MiniBadge tone (shared across the registry screens). */
export const MODULE_TONE: Record<
  ModuleStatus,
  "success" | "warning" | "error"
> = {
  Published: "success",
  Beta: "warning",
  Sunset: "error",
}
