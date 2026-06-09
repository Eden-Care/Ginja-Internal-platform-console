import { cn } from "@/lib/utils"
import { ONB_SECTIONS, type SecStatus } from "@/lib/console-data"

const SEG_CLASS: Record<SecStatus | "todo", string> = {
  complete: "bg-success",
  progress: "bg-warning",
  empty: "bg-muted-foreground/20",
  todo: "bg-muted-foreground/20",
}

const SEG_LABEL: Record<SecStatus, string> = {
  complete: "Complete",
  progress: "In progress",
  empty: "Not started",
}

/** Six-segment onboarding progress track (one segment per fillable section). */
export function SegTrack({
  sections,
  className,
}: {
  sections: Record<string, SecStatus>
  className?: string
}) {
  return (
    <div className={cn("flex gap-[3px]", className)}>
      {ONB_SECTIONS.map((s) => {
        const st = sections[s.k] ?? "empty"
        return (
          <span
            key={s.k}
            title={`${s.l} — ${SEG_LABEL[st]}`}
            className={cn("h-[7px] flex-1 rounded-[3px]", SEG_CLASS[st])}
          />
        )
      })}
    </div>
  )
}

/** Legend for the segment track. */
export function SegLegend() {
  const items: { k: SecStatus; label: string }[] = [
    { k: "complete", label: "Complete" },
    { k: "progress", label: "In progress" },
    { k: "empty", label: "Not started" },
  ]
  return (
    <div className="flex gap-3.5 text-[11px] text-muted-foreground">
      {items.map((it) => (
        <span key={it.k} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2 w-3.5 rounded-[3px]", SEG_CLASS[it.k])} />
          {it.label}
        </span>
      ))}
    </div>
  )
}
