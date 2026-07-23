/**
 * EXPERIMENT — routed service-provider detail prototype. Self-contained under
 * `src/pages/experiments/`; delete the folder + its App.tsx routes to remove.
 * Demonstrates: nested routes + <Outlet> (refresh-safe / deep-linkable), one
 * breadcrumb trail instead of stacked back-links, and a rule-inspector drawer
 * addressable via `?rule=`.
 */
export { ExpDirectory } from "./directory"
export {
  ExpRecordLayout,
  ExpOverviewTab,
  ExpServicesTab,
  ExpInsurersTab,
  ExpAuditTab,
} from "./record"
export { ExpWorkspacePage } from "./workspace"
export { ExpExtractionResults } from "./results"
