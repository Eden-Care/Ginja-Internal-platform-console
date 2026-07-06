import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Form field with the hi-fi `.field` label style — a 10px uppercase eyebrow
 * (the shared `Field` atom renders a 13px sentence-case label). Optional hint
 * below (muted, or destructive when `hintTone="error"`).
 */
export function MField({
  label,
  required,
  hint,
  hintTone = "muted",
  className,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  hint?: React.ReactNode | false
  hintTone?: "muted" | "error"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {hint ? (
        <span
          className={cn(
            "text-[11px]",
            hintTone === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {hint}
        </span>
      ) : null}
    </div>
  )
}
