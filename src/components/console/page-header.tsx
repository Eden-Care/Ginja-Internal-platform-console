import * as React from "react"
import { cn } from "@/lib/utils"

/** Page header: small breadcrumb, large title, subtitle, right-aligned actions. */
export function ConsolePageHeader({
  crumbs,
  title,
  sub,
  actions,
  className,
}: {
  crumbs?: string[]
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
        {crumbs && crumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                <span
                  className={cn(
                    i === crumbs.length - 1 && "font-medium text-foreground"
                  )}
                >
                  {c}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : null}
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
