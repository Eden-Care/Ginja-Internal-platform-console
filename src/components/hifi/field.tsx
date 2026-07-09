import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input/select styling matching the hi-fi `.field input` (38px, 8px radius,
 * solid background, primary focus ring). Layer it BEFORE per-field extras so
 * `mono` / `text-[12.5px]` / disabled etc. still win via tailwind-merge:
 * `className={cn(fieldInput, "mono text-[12.5px]")}`. Scoped to the template
 * forms — the shared `Input` (32px) is left untouched for other screens.
 */
export const fieldInput =
  "h-[38px] rounded-[8px] border border-input bg-background px-[11px] text-[13px] focus-visible:border-primary focus-visible:ring-ring/[0.16] data-[size=default]:h-[38px]"

/**
 * Form field with the hi-fi `.field > label` — a **sentence-case** 12.5px / 500
 * label (matches `Ginja Console.html`). Pass `eyebrow` for the small 10px
 * uppercase variant (module sub-module rows). Optional hint below (muted, or
 * destructive when `hintTone="error"`).
 */
export function MField({
  label,
  required,
  eyebrow = false,
  hint,
  hintTone = "muted",
  className,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  /** Small uppercase eyebrow label (module sub-module rows). */
  eyebrow?: boolean
  hint?: React.ReactNode | false
  hintTone?: "muted" | "error"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        className={cn(
          "flex items-center",
          eyebrow
            ? "gap-1 text-[10px] font-semibold tracking-[0.04em] text-muted-foreground uppercase"
            : "gap-1.5 text-[12.5px] font-medium text-foreground"
        )}
      >
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
