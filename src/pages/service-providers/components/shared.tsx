import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { HiIcon } from "@/components/hifi/icon"
import { MiniBadge } from "@/components/console/tagpill"
import {
  SP_STATUS_TONE,
  type SpStatus,
} from "@/features/service-providers/types"

/**
 * Column template shared by every service-provider table (directory, review
 * queue, approved history) — mirrors the hi-fi `.sp-grid`. Seven columns from
 * `lg`; below `lg` the 3rd + 5th cells (`hidden lg:*`) drop out and the
 * remaining five map onto the narrow template.
 */
export const spGrid =
  "grid items-center gap-[14px] grid-cols-[minmax(0,1.6fr)_120px_112px_108px_34px] lg:grid-cols-[minmax(0,1.6fr)_128px_116px_minmax(0,0.9fr)_104px_108px_34px]"

/** Word-initials (first letter of up to two words) — hi-fi `.ins-av` for SPs. */
export function spInitials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

/** Status badge across the 4 SP lifecycle states (hi-fi `SPStatus`). */
export function SpStatus({ status }: { status: SpStatus }) {
  return <MiniBadge tone={SP_STATUS_TONE[status]}>{status}</MiniBadge>
}

/**
 * Square provider avatar — hi-fi `.ins-av` (`lg` for the workspace head, `xl`
 * for the record head). Shows word-initials of the facility name.
 */
export function SpAvatar({
  name,
  size,
  className,
}: {
  name: string
  size?: "lg" | "xl"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[9px] bg-primary/10 font-bold text-primary",
        size === "xl"
          ? "size-14 rounded-[14px] text-[18px]"
          : size === "lg"
            ? "size-12 rounded-[12px] text-[15px]"
            : "size-9 text-[12px]",
        className
      )}
    >
      {spInitials(name)}
    </span>
  )
}

/** County chip with a pin glyph — hi-fi `.region-pill` (SP variant). */
export function RegionPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-[5px] rounded-[6px] bg-muted px-[7px] py-0.5 text-[11px] text-muted-foreground [&>svg]:size-[11px]">
      <HiIcon name="mapPin" />
      {label}
    </span>
  )
}

/**
 * Borderless click-to-copy glyph button — hi-fi `.t2-copy`. Copies `value` and
 * flips to a success check for ~1.4s.
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

/** One key→value line of a detail sheet — hi-fi `.ins-drow`. */
export function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2.5 text-[13px] last:border-b-0">
      <span className="shrink-0 text-[12px] text-muted-foreground">{k}</span>
      <span className="min-w-0 text-right text-foreground">{v}</span>
    </div>
  )
}

/** A "back to X" ghost link with a leading chevron — used atop sub-views. */
export function BackLink({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary hover:underline [&>svg]:size-3.5"
    >
      <HiIcon name="chevronLeft" />
      {label}
    </button>
  )
}
