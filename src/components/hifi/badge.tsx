import * as React from "react"

import { cn } from "@/lib/utils"
import { MiniBadge } from "@/components/console/tagpill"

type Tone = "success" | "warning" | "neutral" | "info" | "error"

/**
 * Status badge matching the hi-fi `.badge` — a 6px-radius rectangle at weight
 * 600 (the shared `MiniBadge` is a full pill at 500). Wraps `MiniBadge` so the
 * LED dot + tone colours are preserved.
 */
export function MBadge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone
  className?: string
  children: React.ReactNode
}) {
  return (
    <MiniBadge
      tone={tone}
      className={cn(
        "h-auto gap-[5px] rounded-[6px] px-2 py-[3px] font-semibold",
        className
      )}
    >
      {children}
    </MiniBadge>
  )
}
