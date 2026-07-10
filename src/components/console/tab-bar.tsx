import * as React from "react"
import { cn } from "@/lib/utils"

export type TabItem = {
  k: string
  label: React.ReactNode
  icon?: React.ReactNode
  count?: number
}

/**
 * Underline tab bar — a full-width bottom rule with the active tab marked by a
 * primary-coloured underline + label (mirrors the hi-fi `.tabs` / `.tab` style).
 */
export function TabBar({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[]
  value: string
  onChange: (k: string) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-0.5 overflow-x-auto border-b", className)}
    >
      {tabs.map((t) => {
        const active = t.k === value
        return (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.k)}
            className={cn(
              "-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors [&>svg]:size-[15px]",
              active
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === "number" ? (
              <span className="mono rounded-full bg-muted px-1.5 py-px text-[11px] font-semibold">
                {t.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
