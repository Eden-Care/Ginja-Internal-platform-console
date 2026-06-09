import * as React from "react"
import { TrendingUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type KpiTone = "b" | "p" | "w" | "e" | ""

const ICO_TONE: Record<KpiTone, string> = {
  b: "bg-brand/12 text-brand",
  p: "bg-primary/12 text-primary",
  w: "bg-warning-subtle text-warning-subtle-foreground",
  e: "bg-destructive-subtle text-destructive-subtle-foreground",
  "": "bg-muted text-muted-foreground",
}

/** Top-row KPI stat card (icon + uppercase label + big mono value + footnote). */
export function KpiStat({
  icon,
  label,
  value,
  foot,
  tone = "",
  trend = true,
}: {
  icon: React.ReactNode
  label: string
  value: string
  foot: string
  tone?: KpiTone
  trend?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid size-8 place-items-center rounded-[9px] [&>svg]:size-[17px]",
            ICO_TONE[tone]
          )}
        >
          {icon}
        </span>
        {trend ? (
          <TrendingUpIcon className="size-[15px] text-muted-foreground" />
        ) : null}
      </div>
      <div className="eyebrow mt-3 text-[10.5px]">{label}</div>
      <div className="mono mt-[7px] mb-1.5 text-[30px] leading-none font-bold tracking-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{foot}</div>
    </div>
  )
}

/** Compact horizontal stat (icon left, label/value/foot right). */
export function KpiStatInline({
  icon,
  label,
  value,
  foot,
}: {
  icon: React.ReactNode
  label: string
  value: string
  foot: string
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-xs">
      <span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[19px]">
        {icon}
      </span>
      <div>
        <div className="eyebrow text-[10.5px]">{label}</div>
        <div className="mono my-0.5 text-lg font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{foot}</div>
      </div>
    </div>
  )
}
