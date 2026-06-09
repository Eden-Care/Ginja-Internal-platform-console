import { cn } from "@/lib/utils"
import { initials2 } from "@/lib/console-format"

/** Square, indigo-tinted tenant avatar showing the first two letters of a name. */
export function AvatarInitials({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary",
        className
      )}
    >
      {initials2(name)}
    </span>
  )
}

/** Small round avatar for owners / section assignees. */
export function MiniAvatar({
  initials,
  className,
  title,
}: {
  initials: string
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-grid size-[18px] shrink-0 place-items-center rounded-full bg-primary/12 text-[10px] font-semibold text-primary",
        className
      )}
    >
      {initials}
    </span>
  )
}

/** Overlapping stack of owner initials. */
export function AvatarStack({
  items,
  title,
}: {
  items: string[]
  title?: string
}) {
  return (
    <span className="flex items-center" title={title}>
      {items.map((it, i) => (
        <span
          key={i}
          className={cn(
            "inline-grid size-6 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground ring-2 ring-card",
            i > 0 && "-ml-1.5"
          )}
        >
          {it}
        </span>
      ))}
    </span>
  )
}
