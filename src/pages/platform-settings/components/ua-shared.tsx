import * as React from "react"
import { ClockIcon, SearchIcon } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

import { cn } from "@/lib/utils"
import { Tagpill } from "@/components/console/tagpill"
import type { MemberStatus } from "@/features/access/types"
import type { PasswordState, PasswordStatus } from "@/features/settings/types"

/* ----------------------------------- member status + formatting helpers --- */

/** MemberStatus → MiniBadge tone (mirrors the Users directory). */
export const MEMBER_STATUS_TONE: Record<
  MemberStatus,
  "success" | "info" | "warning" | "error"
> = {
  ACTIVE: "success",
  INVITED: "info",
  SUSPENDED: "warning",
  DISABLED: "error",
}
export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
}

/** Account badge label — a lapsed invite reads "Expired". */
export const memberAccountLabel = (m: {
  status: MemberStatus
  inviteExpired: boolean
}) =>
  m.inviteExpired && m.status === "INVITED"
    ? "Expired"
    : MEMBER_STATUS_LABEL[m.status]

/** First letters of the first two name parts, uppercased (avatar fallback). */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

export const fmtLastActive = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "Never"
export const fmtSince = (iso: string | null) =>
  iso ? format(new Date(iso), "dd MMM yyyy") : "—"

/* --------------------------------------------- password-status helpers --- */

/** PasswordState → MiniBadge tone + label (shared by the tab + detail drawer). */
export const PWD_STATE: Record<
  PasswordState,
  { tone: "success" | "warning" | "error" | "neutral"; label: string }
> = {
  OK: { tone: "success", label: "OK" },
  EXPIRING: { tone: "warning", label: "Expiring soon" },
  EXPIRED: { tone: "error", label: "Expired" },
  PENDING: { tone: "neutral", label: "Pending" },
}

/** Format an ISO date safely; "" if missing/unparseable (so callers can fall
   back to a Pending badge). */
const fmtPwdDate = (s: string): string => {
  if (!s) return ""
  const d = new Date(s)
  return isNaN(d.getTime()) ? "" : format(d, "dd MMM yyyy")
}

/** "Last changed" cell text; "" → render a Pending badge. */
export const passwordLastChanged = (ps: PasswordStatus): string =>
  fmtPwdDate(ps.lastChanged)

/** "Expires" cell text; null → render a Pending badge. Prefers an explicit
   date, else a relative days-left phrase. */
export function passwordExpires(ps: PasswordStatus): string | null {
  const d = fmtPwdDate(ps.expiresOn)
  if (d) return d
  if (ps.daysLeft == null) return null
  if (ps.daysLeft < 0) return `${-ps.daysLeft}d overdue`
  if (ps.daysLeft === 0) return "Today"
  return `in ${ps.daysLeft}d`
}

/** Dashed, muted pill marking a value the backend doesn't power yet. */
export function PendingBadge({
  children = "Pending backend",
}: {
  children?: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed bg-muted/50 px-2 py-[2px] text-[10.5px] font-medium text-muted-foreground [&>svg]:size-2.5">
      <ClockIcon />
      {children}
    </span>
  )
}

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
