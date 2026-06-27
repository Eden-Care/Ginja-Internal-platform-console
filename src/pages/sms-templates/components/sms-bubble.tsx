import * as React from "react"

import { cn } from "@/lib/utils"

/** A single received-style SMS chat bubble for the live preview. */
export function SmsBubble({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "max-w-[280px] rounded-[18px] rounded-bl-[5px] bg-primary px-[15px] py-[11px] text-[13.5px] leading-[1.5] break-words whitespace-pre-wrap text-primary-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}
