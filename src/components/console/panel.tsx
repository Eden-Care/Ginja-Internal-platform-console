import * as React from "react"
import { cn } from "@/lib/utils"

/** Bordered white surface — the console's primary content container. */
export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-xs",
        className
      )}
      {...props}
    />
  )
}

/** Panel header row: leading icon, title, and an optional right-aligned action. */
export function PanelHead({
  icon,
  title,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b px-[18px] py-[15px]",
        className
      )}
    >
      {icon ? (
        <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {action ? (
        <div className="ml-auto flex items-center">{action}</div>
      ) : null}
    </div>
  )
}

export function PanelBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("p-[18px]", className)} {...props} />
}
