import * as React from "react"
import { cn } from "@/lib/utils"

/** Rounded "secondary" chip used for inline metadata. */
export function Tagpill({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-[3px] text-[11.5px] font-medium text-secondary-foreground [&>svg]:size-3",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export type BadgeTone =
  | "success"
  | "warning"
  | "neutral"
  | "info"
  | "error"
  | "primary"

const BADGE_TONE: Record<BadgeTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  primary: "bg-primary/12 text-primary",
}

/** Small status badge with a leading LED dot. */
export function MiniBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium",
        BADGE_TONE[tone],
        className
      )}
    >
      <span className="size-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}
