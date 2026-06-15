import * as React from "react"
import { Link, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import { getBreadcrumbTrail, type Crumb } from "@/lib/navigation"

/**
 * Breadcrumb trail for the current page.
 *
 * By default it derives the trail from the route (see `getBreadcrumbTrail`),
 * so most pages render nothing to pass — top-level pages show no crumbs and
 * nested pages get a real, clickable path back up. Pass `items` to override
 * with a custom trail when a label is dynamic (e.g. a tenant's name).
 *
 * Renders nothing unless the trail has at least two crumbs.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items?: Crumb[]
  className?: string
}) {
  const { pathname } = useLocation()
  const crumbs = items ?? getBreadcrumbTrail(pathname)

  if (crumbs.length < 2) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <React.Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {crumb.href && !isLast ? (
              <Link to={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={cn(isLast && "font-medium text-foreground")}
              >
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
