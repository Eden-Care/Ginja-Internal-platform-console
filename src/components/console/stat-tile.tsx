import * as React from "react"

import { cn } from "@/lib/utils"

export type StatTone = "primary" | "success" | "warning" | "error" | "neutral"

const ICON_TONE: Record<StatTone, string> = {
  primary: "bg-primary/12 text-primary",
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}

/**
 * KPI stat tile — a toned icon chip beside a big mono-tabular value and a small
 * label (mirrors the hi-fi `.sess-stat`). Used by the User access screens.
 */
export function StatTile({
  icon,
  value,
  label,
  tone = "primary",
  className,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: React.ReactNode
  tone?: StatTone
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-4 py-[15px] shadow-xs",
        className
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[10px] [&>svg]:size-[17px]",
          ICON_TONE[tone]
        )}
      >
        {icon}
      </span>
      <div>
        <div className="mono text-[22px] leading-none font-bold">{value}</div>
        <div className="mt-1 text-[11.5px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
