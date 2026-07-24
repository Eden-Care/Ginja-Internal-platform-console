/**
 * EXPERIMENT — routed service-provider detail prototype. Self-contained under
 * `src/pages/experiments/`; delete the folder + its App.tsx routes to remove.
 * Demonstrates: every drill-down is a real, refresh-safe route
 * (directory → provider record → insurer detail hub → a contract's rules), one
 * breadcrumb trail instead of stacked back-links, URL-backed tabs (`?tab=`,
 * `?panel=`) and a rule-inspector drawer addressable via `?rule=`.
 */
export { ExpDirectory } from "./directory"
export { ExpRecordPage } from "./record"
export { ExpInsurerPage } from "./insurer"
export { ExpContractPage } from "./contract"
