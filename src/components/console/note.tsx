import * as React from "react"
import { cn } from "@/lib/utils"

type NoteTone = "info" | "warn" | "ok" | "err"

const TONE: Record<NoteTone, string> = {
  info: "bg-info-subtle text-info-subtle-foreground",
  warn: "bg-warning-subtle text-warning-subtle-foreground",
  ok: "bg-success-subtle text-success-subtle-foreground",
  err: "bg-destructive-subtle text-destructive-subtle-foreground",
}

/** Inline contextual note / callout (info · warn · ok · err). */
export function Note({
  tone = "info",
  icon,
  className,
  children,
}: {
  tone?: NoteTone
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[9px] px-3 py-2.5 text-[12.5px] leading-normal [&_b]:font-semibold [&>svg]:mt-px [&>svg]:size-[15px] [&>svg]:shrink-0",
        TONE[tone],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </div>
  )
}
