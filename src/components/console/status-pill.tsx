import { cn } from "@/lib/utils"
import {
  STATUS_TONE,
  type StatusTone,
  type TenantStatus,
} from "@/lib/console-data"

const TONE_CLASS: Record<StatusTone, string> = {
  active: "bg-success-subtle text-success-subtle-foreground",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning-subtle text-warning-subtle-foreground",
  suspended: "bg-warning-subtle text-warning-subtle-foreground",
  retired: "bg-destructive-subtle text-destructive-subtle-foreground",
}

/** Lifecycle status pill with a leading LED dot (color follows the tone). */
export function StatusPill({
  status,
  className,
}: {
  status: TenantStatus | string
  className?: string
}) {
  const tone = STATUS_TONE[status] ?? "draft"
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-[7px] px-2.5 text-xs font-semibold",
        TONE_CLASS[tone],
        className
      )}
    >
      <span className="size-[7px] rounded-full bg-current" />
      {status}
    </span>
  )
}
