import * as React from "react"
import { cn } from "@/lib/utils"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import { type Crumb } from "@/lib/navigation"

/** Page header: route-derived breadcrumb, large title, subtitle, right-aligned actions. */
export function ConsolePageHeader({
  crumbs,
  title,
  sub,
  actions,
  className,
}: {
  /** Optional breadcrumb override; by default the trail is derived from the route. */
  crumbs?: Crumb[]
  title: React.ReactNode
  sub?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <Breadcrumbs items={crumbs} />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub ? (
          <p className="max-w-prose text-sm text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
