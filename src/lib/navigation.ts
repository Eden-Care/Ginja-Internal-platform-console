/**
 * Navigation hierarchy — the single source of truth for breadcrumbs.
 *
 * Each node maps a route `path` to a human `label` and (optionally) its
 * `parent` route. Breadcrumbs are derived by walking the parent chain, so
 * pages never hand-author crumb strings: add a node here and the trail is
 * correct everywhere. Top-level pages (no parent) get no breadcrumb — they
 * are already located by the active sidebar item.
 */
export type RouteNode = {
  /** Route path, e.g. "/tenant-accounts/onboard". */
  path: string
  /** Label shown in the breadcrumb trail. */
  label: string
  /** Parent route path. Omit for top-level (sidebar-reachable) pages. */
  parent?: string
}

export const ROUTE_NODES: RouteNode[] = [
  { path: "/", label: "Dashboard" },
  { path: "/tenant-accounts", label: "Tenant accounts" },
  {
    path: "/tenant-accounts/onboard",
    label: "Onboard tenant",
    parent: "/tenant-accounts",
  },
  { path: "/approvals", label: "Approvals" },
  { path: "/tenant-provisioning", label: "Tenant provisioning" },
  { path: "/module-registry", label: "Module registry" },
  { path: "/document-templates", label: "Document templates" },
  { path: "/email-templates", label: "Email & SMS templates" },
  { path: "/pricing", label: "Pricing & plans" },
  { path: "/access-users", label: "Users" },
  { path: "/access-roles", label: "Roles & permissions" },
  { path: "/platform-settings", label: "Platform settings" },
  { path: "/audit-log", label: "Audit log" },
]

/** A single breadcrumb. `href` is omitted for the current (last) page. */
export type Crumb = { label: string; href?: string }

const NODES_BY_PATH = new Map(ROUTE_NODES.map((n) => [n.path, n]))

/**
 * Build the breadcrumb trail for a pathname by walking up the parent chain.
 *
 * Returns `[]` for top-level pages (a trail of one) — they need no
 * breadcrumb. The last crumb (current page) has no `href`; ancestors do.
 */
export function getBreadcrumbTrail(pathname: string): Crumb[] {
  const chain: RouteNode[] = []
  let node = NODES_BY_PATH.get(pathname)
  while (node) {
    chain.unshift(node)
    node = node.parent ? NODES_BY_PATH.get(node.parent) : undefined
  }

  if (chain.length < 2) return []

  return chain.map((n, i) => ({
    label: n.label,
    href: i < chain.length - 1 ? n.path : undefined,
  }))
}
