import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Click-to-copy id chip — mirrors the hi-fi `.copy-id`. Shows a success state
 * for ~1.4s after copying. Stops propagation so it works inside clickable cards.
 */
export function CopyId({
  value,
  label,
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      void navigator.clipboard?.writeText(value)
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${value}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[7px] border bg-muted/50 px-2 py-[3px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground [&>svg]:size-3 [&>svg]:shrink-0",
        copied && "border-success text-success",
        className
      )}
    >
      {label ? (
        <span className="text-[9.5px] font-semibold tracking-[0.04em] uppercase opacity-80">
          {label}
        </span>
      ) : null}
      <code className="font-mono text-[11px] font-semibold">{value}</code>
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}
