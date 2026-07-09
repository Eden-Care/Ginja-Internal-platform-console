import * as React from "react"
import {
  CheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
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
import { LoadingSpinner } from "@/components/common/loading"
import {
  useForcePasswordReset,
  usePasswordStatuses,
} from "@/features/settings/use-password"
import type { PasswordStatus } from "@/features/settings/types"
import {
  EmptyTile,
  PWD_STATE,
  PendingBadge,
  SearchBox,
  SegToggle,
  Toolbar,
  UserIdCell,
  initialsOf,
  passwordExpires,
  passwordLastChanged,
} from "./ua-shared"
import { PasswordDetailDrawer } from "./password-detail-drawer"

const GRID =
  "grid grid-cols-[minmax(0,1.4fr)_130px_130px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_110px_140px_120px_110px_168px]"

// Filter tabs mirror the hi-fi Password status seg-toggle (keys are our
// PasswordState values; "All" shows everyone incl. pending).
const FILTERS = [
  { k: "All", label: "All" },
  { k: "OK", label: "OK" },
  { k: "EXPIRING", label: "Expiring" },
  { k: "EXPIRED", label: "Expired" },
]

export function PasswordTab({ readonly }: { readonly: boolean }) {
  // Single source of truth: the password-status endpoint returns the summary
  // (KPI tiles) plus the per-member rows.
  const statusesQuery = usePasswordStatuses()
  const summary = statusesQuery.data?.summary
  const statuses = statusesQuery.data?.statuses ?? []

  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState("All")
  const [detail, setDetail] = React.useState<PasswordStatus | null>(null)
  const [reset, setReset] = React.useState<Set<number>>(() => new Set())

  const list = statuses.filter((ps) => {
    if (!(ps.name + ps.email).toLowerCase().includes(q.toLowerCase()))
      return false
    if (filter === "All") return true
    return ps.state === filter
  })

  const resetMut = useForcePasswordReset()
  const forceReset = (ps: PasswordStatus) => {
    resetMut.mutate(ps.memberId, {
      onSuccess: () => {
        setReset((s) => new Set(s).add(ps.memberId))
        toast.success(`Password reset link sent to ${ps.name}.`)
      },
      onError: (e) =>
        toast.error("Couldn't send the reset link", {
          description: e instanceof Error ? e.message : undefined,
        }),
    })
  }

  if (statusesQuery.isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <LoadingSpinner />
      </div>
    )
  }
  if (statusesQuery.isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load password status.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => statusesQuery.refetch()}
        >
          Try again
        </button>
        .
      </Note>
    )
  }

  return (
    <>
      <Note tone="info" icon={<ShieldCheckIcon />} className="mb-4">
        <b>Admin-only.</b> Password health (status, last changed and expiry) for
        every Platform Console user, from the platform API. Account status is
        shown as a static value.
      </Note>

      <div className="mb-[18px] grid grid-cols-3 gap-3">
        <StatTile
          icon={<CheckCircle2Icon />}
          tone="success"
          value={summary ? summary.ok : <PendingBadge />}
          label="OK"
        />
        <StatTile
          icon={<ClockIcon />}
          tone={summary && summary.expiringSoon ? "warning" : "neutral"}
          value={summary ? summary.expiringSoon : <PendingBadge />}
          label="Expiring soon"
        />
        <StatTile
          icon={<TriangleAlertIcon />}
          tone={summary && summary.expired ? "error" : "neutral"}
          value={summary ? summary.expired : <PendingBadge />}
          label="Expired"
        />
      </div>

      <Toolbar
        search={<SearchBox value={q} onChange={setQ} />}
        filter={
          <SegToggle value={filter} options={FILTERS} onChange={setFilter} />
        }
        count={`${list.length} of ${statuses.length}`}
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

        {list.map((ps) => {
          const canReset =
            !readonly && (ps.state === "EXPIRING" || ps.state === "EXPIRED")
          const done = reset.has(ps.memberId)
          const lastChanged = passwordLastChanged(ps)
          const expires = passwordExpires(ps)
          return (
            <div key={ps.memberId} className={cn(GRID, "border-t px-4 py-3")}>
              <UserIdCell
                initials={initialsOf(ps.name)}
                name={ps.name}
                email={ps.email}
              />
              <div>
                {/* Account status isn't in the password-status API — static. */}
                <MiniBadge tone="success">Active</MiniBadge>
              </div>
              <div>
                <MiniBadge tone={PWD_STATE[ps.state].tone}>
                  {PWD_STATE[ps.state].label}
                </MiniBadge>
              </div>
              <div className="hidden lg:block">
                {lastChanged ? (
                  <span className="text-[13px]">{lastChanged}</span>
                ) : (
                  <PendingBadge />
                )}
              </div>
              <div className="hidden lg:block">
                {expires ? (
                  <span className="text-[13px]">{expires}</span>
                ) : (
                  <PendingBadge />
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {canReset &&
                  (done ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                      <CheckIcon />
                      Reset sent
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={resetMut.isPending}
                      onClick={() => forceReset(ps)}
                    >
                      <RotateCcwIcon data-icon="inline-start" />
                      Force reset
                    </Button>
                  ))}
                <Button variant="ghost" size="sm" onClick={() => setDetail(ps)}>
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
            No users match your search.
          </EmptyTile>
        )}
      </div>

      <PasswordDetailDrawer
        ps={detail}
        readonly={readonly}
        done={detail ? reset.has(detail.memberId) : false}
        onForceReset={forceReset}
        onClose={() => setDetail(null)}
      />
    </>
  )
}
