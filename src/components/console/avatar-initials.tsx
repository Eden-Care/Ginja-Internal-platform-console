import { cn } from "@/lib/utils"
import { initials2 } from "@/lib/console-format"
import { ROLE_TONE, STAFF_BY_ID, type RoleTone } from "@/lib/console-data"

const ROLE_AVATAR_TONE: Record<RoleTone, string> = {
  iris: "bg-primary/15 text-primary",
  emerald: "bg-success/15 text-success",
  amber: "bg-warning/20 text-warning-subtle-foreground",
}

/**
 * Round avatar for an internal staff member, tinted by their role
 * (iris = onboarding, emerald = engineer, amber = compliance).
 */
export function StaffAvatar({
  id,
  size,
  className,
}: {
  id: string
  size?: "sm"
  className?: string
}) {
  const p = STAFF_BY_ID[id]
  if (!p) return null
  return (
    <span
      title={`${p.name} · ${p.role}`}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold",
        size === "sm" ? "size-[22px] text-[9px]" : "size-7 text-[10.5px]",
        ROLE_AVATAR_TONE[ROLE_TONE[p.role]],
        className
      )}
    >
      {p.initials}
    </span>
  )
}

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

/**
 * Round avatar for an onboarding-step assignee (a real platform member),
 * iris-tinted with the member's initials. Use where the data source is the
 * API's step `assignee` (an email/member), not the mock STAFF roster.
 */
export function AssigneeAvatar({
  name,
  size,
  className,
  title,
}: {
  name: string
  size?: "sm"
  className?: string
  title?: string
}) {
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary",
        size === "sm" ? "size-[22px] text-[9px]" : "size-7 text-[10.5px]",
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
