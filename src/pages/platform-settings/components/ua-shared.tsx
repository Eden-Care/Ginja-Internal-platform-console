import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Tagpill } from "@/components/console/tagpill"

/** Centered empty / no-results tile with a toned icon, used across the tabs. */
export function EmptyTile({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mt-[18px] flex flex-col items-center gap-2.5 rounded-xl border bg-card px-6 py-12 text-center shadow-xs">
      <span className="grid size-[52px] place-items-center rounded-[14px] bg-muted text-muted-foreground [&>svg]:size-[22px]">
        {icon}
      </span>
      <p className="max-w-[46ch] text-[13px] leading-[1.55] [&_b]:font-semibold [&_b]:text-foreground">
        {children}
      </p>
    </div>
  )
}

/** Pill segmented filter on a muted track — selected segment is a raised chip. */
export function SegToggle({
  value,
  options,
  onChange,
}: {
  value: string
  options: { k: string; label: string }[]
  onChange: (k: string) => void
}) {
  return (
    <div className="inline-flex gap-[2px] rounded-[9px] bg-muted p-[3px]">
      {options.map((o) => (
        <button
          key={o.k}
          type="button"
          onClick={() => onChange(o.k)}
          className={cn(
            "rounded-[7px] px-[11px] py-[5px] text-xs font-semibold transition-colors",
            value === o.k
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The search box used in the User access toolbars. */
export function SearchBox({
  value,
  onChange,
  placeholder = "Search users…",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex h-[34px] max-w-[320px] min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

/** Toolbar row: search on the left, optional filter + count chip on the right. */
export function Toolbar({
  search,
  filter,
  count,
}: {
  search: React.ReactNode
  filter?: React.ReactNode
  count: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-2.5 pb-3.5">
      {search}
      {filter}
      <Tagpill className="ml-auto">{count}</Tagpill>
    </div>
  )
}

/** Round person avatar with initials, indigo-tinted (hi-fi `.su-av`). */
export function UserAvatar({
  initials,
  className,
}: {
  initials: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-[12px] font-bold text-primary",
        className
      )}
    >
      {initials}
    </span>
  )
}

/** User id-cell: avatar + name over mono email. */
export function UserIdCell({
  initials,
  name,
  email,
}: {
  initials: string
  name: string
  email: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-[11px]">
      <UserAvatar initials={initials} />
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold">{name}</div>
        <div className="mono truncate text-[11.5px] text-muted-foreground">
          {email}
        </div>
      </div>
    </div>
  )
}
