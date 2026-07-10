import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { HiIcon } from "@/components/hifi/icon"
import { MiniBadge } from "@/components/console/tagpill"
import type { InsurerStatusValue } from "@/lib/console-data"

/**
 * Column template shared by the directory header row and body rows — mirrors
 * the hi-fi `.ins-grid`. Full 7 columns from `lg`; below `lg` it collapses to
 * 5 (the Type + Created cells are `hidden lg:flex`, so they drop out of the
 * grid and the remaining cells map onto the narrow template).
 */
export const insGrid =
  "grid items-center gap-[14px] grid-cols-[minmax(0,1.5fr)_120px_96px_108px_34px] lg:grid-cols-[minmax(0,1.5fr)_128px_116px_minmax(0,1fr)_96px_108px_34px]"

/** Active/Inactive status badge — hi-fi `InsurerStatus` (`.badge success/neutral`). */
export function InsurerStatus({ status }: { status: InsurerStatusValue }) {
  return (
    <MiniBadge tone={status === "Active" ? "success" : "neutral"}>
      {status}
    </MiniBadge>
  )
}

/**
 * Square insurer avatar — hi-fi `.ins-av` (`.lg` variant for the drawer head).
 * Shows the first two letters of the name (NOT word-initials, matching the
 * reference: "Jubilee Health…" → "JU").
 */
export function InsurerAvatar({
  name,
  size,
  className,
}: {
  name: string
  size?: "lg"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[9px] bg-primary/10 font-bold text-primary",
        size === "lg"
          ? "size-12 rounded-[12px] text-[15px]"
          : "size-9 text-[12px]",
        className
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

/**
 * Borderless click-to-copy glyph button — hi-fi `.t2-copy`. Copies `value` and
 * flips to a success check for ~1.4s. `iconClass` sizes the glyph (e.g.
 * `size-[13px]` in the drawer, `size-[15px]` on the success screen).
 */
export function CopyGlyph({
  value,
  iconClass = "size-[15px]",
}: {
  value: string
  iconClass?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
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
      title="Copy"
      className="grid place-items-center rounded-[6px] p-[5px] text-muted-foreground transition-colors hover:bg-card hover:text-primary"
    >
      {copied ? (
        <CheckIcon className={cn(iconClass, "text-success")} />
      ) : (
        <HiIcon name="copy" className={iconClass} />
      )}
    </button>
  )
}

/** Country chip with a globe glyph — hi-fi `.region-pill`. */
export function RegionPill({ country }: { country: string }) {
  return (
    <span className="mono inline-flex items-center gap-[5px] rounded-[6px] bg-muted px-[7px] py-0.5 text-[11px] text-muted-foreground [&>svg]:size-[11px]">
      <HiIcon name="globe" />
      {country}
    </span>
  )
}
