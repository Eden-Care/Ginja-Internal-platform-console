import * as React from "react"
import {
  CheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
  MinusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MiniBadge } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { StatTile } from "@/components/console/stat-tile"
import {
  ACCESS_USERS,
  USER_STATUS_TONE,
  pwdOf,
  type AccessUser,
} from "@/lib/console-data"
import {
  PWD_POLICY_DAYS,
  pwdExpiryDate,
  pwdState,
  type PwdState,
} from "@/lib/console-format"
import {
  EmptyTile,
  SearchBox,
  SegToggle,
  Toolbar,
  UserIdCell,
} from "./ua-shared"
import { PasswordDetailDrawer } from "./password-detail-drawer"

type BadgeTone = "success" | "warning" | "error" | "neutral"

/** Display config per password state — shared with the detail drawer. */
export const PWD_STATE: Record<
  PwdState,
  { label: string; badge: BadgeTone; icon: React.ReactNode }
> = {
  ok: { label: "OK", badge: "success", icon: <CheckCircle2Icon /> },
  soon: { label: "Expiring soon", badge: "warning", icon: <ClockIcon /> },
  expired: { label: "Expired", badge: "error", icon: <TriangleAlertIcon /> },
  pending: { label: "Pending setup", badge: "neutral", icon: <MinusIcon /> },
}

const FILTERS = [
  { k: "All", label: "All" },
  { k: "ok", label: "OK" },
  { k: "soon", label: "Expiring" },
  { k: "expired", label: "Expired" },
]

const GRID =
  "grid grid-cols-[minmax(0,1.4fr)_130px_130px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_110px_140px_120px_110px_168px]"

export function PasswordTab({ readonly }: { readonly: boolean }) {
  const users = ACCESS_USERS
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState("All")
  const [detail, setDetail] = React.useState<AccessUser | null>(null)
  const [reset, setReset] = React.useState<Set<string>>(() => new Set())

  const count = (st: PwdState) =>
    users.filter((u) => pwdState(u.id) === st).length
  const okN = count("ok")
  const soonN = count("soon")
  const expiredN = count("expired")

  const matchesFilter = (u: AccessUser) =>
    filter === "All" || pwdState(u.id) === filter
  const list = users.filter(
    (u) =>
      matchesFilter(u) &&
      (u.name + u.email).toLowerCase().includes(q.toLowerCase())
  )
  const forceReset = (u: AccessUser) => {
    setReset((s) => new Set(s).add(u.id))
    toast(`Password reset link sent to ${u.name}.`)
  }

  return (
    <>
      <Note tone="info" icon={<ShieldCheckIcon />} className="mb-4">
        <b>Admin-only.</b> Password health for every Platform Console user under
        the {PWD_POLICY_DAYS}-day rotation policy. You can force a reset; users
        set the new password themselves.
      </Note>

      <div className="mb-[18px] grid grid-cols-3 gap-3">
        <StatTile
          icon={<CheckCircle2Icon />}
          tone="success"
          value={okN}
          label="OK"
        />
        <StatTile
          icon={<ClockIcon />}
          tone={soonN ? "warning" : "neutral"}
          value={soonN}
          label="Expiring soon"
        />
        <StatTile
          icon={<TriangleAlertIcon />}
          tone={expiredN ? "error" : "neutral"}
          value={expiredN}
          label="Expired"
        />
      </div>

      <Toolbar
        search={<SearchBox value={q} onChange={setQ} />}
        filter={
          <SegToggle value={filter} options={FILTERS} onChange={setFilter} />
        }
        count={`${list.length} of ${users.length}`}
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div
          className={cn(
            GRID,
            "border-b bg-muted/50 px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase"
          )}
        >
          <span>User</span>
          <span>Account</span>
          <span>Password status</span>
          <span className="hidden lg:block">Last changed</span>
          <span className="hidden lg:block">Expires</span>
          <span />
        </div>

        {list.map((u) => {
          const st = pwdState(u.id)
          const S = PWD_STATE[st]
          const p = pwdOf(u.id)
          const done = reset.has(u.id)
          return (
            <div key={u.id} className={cn(GRID, "border-t px-4 py-3")}>
              <UserIdCell initials={u.initials} name={u.name} email={u.email} />
              <div>
                <MiniBadge tone={USER_STATUS_TONE[u.status]}>
                  {u.inviteExpired ? "Expired" : u.status}
                </MiniBadge>
              </div>
              <div>
                <MiniBadge tone={S.badge}>{S.label}</MiniBadge>
              </div>
              <div className="hidden text-[13px] lg:block">
                {p.pending ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  p.lastChanged.split(" · ")[0]
                )}
              </div>
              <div className="hidden text-[13px] lg:block">
                {p.pending ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <span
                    className={cn(
                      st === "expired" && "font-semibold text-destructive",
                      st === "soon" &&
                        "font-semibold text-warning-subtle-foreground"
                    )}
                  >
                    {pwdExpiryDate(u.id)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {!p.pending &&
                  !readonly &&
                  st !== "ok" &&
                  (done ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                      <CheckIcon />
                      Reset sent
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => forceReset(u)}
                    >
                      <RotateCcwIcon data-icon="inline-start" />
                      Force reset
                    </Button>
                  ))}
                <Button variant="ghost" size="sm" onClick={() => setDetail(u)}>
                  View details
                </Button>
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <EmptyTile icon={<LockIcon />}>
            <b>No matching users.</b>
            <br />
            No users match your search or filter.
          </EmptyTile>
        )}
      </div>

      <PasswordDetailDrawer
        user={detail}
        readonly={readonly}
        done={detail ? reset.has(detail.id) : false}
        onForceReset={forceReset}
        onClose={() => setDetail(null)}
      />
    </>
  )
}
