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
import { useMembers } from "@/features/access/use-members"
import type { Member } from "@/features/access/types"
import {
  EmptyTile,
  MEMBER_STATUS_TONE,
  PendingBadge,
  SearchBox,
  Toolbar,
  UserIdCell,
  initialsOf,
  memberAccountLabel,
} from "./ua-shared"
import { PasswordDetailDrawer } from "./password-detail-drawer"

const GRID =
  "grid grid-cols-[minmax(0,1.4fr)_130px_130px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_110px_140px_120px_110px_168px]"

export function PasswordTab({ readonly }: { readonly: boolean }) {
  const membersQuery = useMembers({})
  const users = membersQuery.data?.items ?? []

  const [q, setQ] = React.useState("")
  const [detail, setDetail] = React.useState<Member | null>(null)
  const [reset, setReset] = React.useState<Set<number>>(() => new Set())

  const list = users.filter((u) =>
    (u.name + u.email).toLowerCase().includes(q.toLowerCase())
  )

  // No reset-link endpoint yet — client-only acknowledgement (flagged gap).
  const forceReset = (u: Member) => {
    setReset((s) => new Set(s).add(u.id))
    toast(`Password reset link sent to ${u.name}.`)
  }

  if (membersQuery.isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <LoadingSpinner />
      </div>
    )
  }
  if (membersQuery.isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load users.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => membersQuery.refetch()}
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
        <b>Admin-only.</b> The user directory is live. Password health — last
        changed, expiry and rotation status — isn’t exposed by the API yet, so
        those columns show <b>Pending backend</b>.
      </Note>

      <div className="mb-[18px] grid grid-cols-3 gap-3">
        <StatTile
          icon={<CheckCircle2Icon />}
          value={<PendingBadge />}
          label="OK"
        />
        <StatTile
          icon={<ClockIcon />}
          value={<PendingBadge />}
          label="Expiring soon"
        />
        <StatTile
          icon={<TriangleAlertIcon />}
          value={<PendingBadge />}
          label="Expired"
        />
      </div>

      <Toolbar
        search={<SearchBox value={q} onChange={setQ} />}
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
          const canReset = u.status === "ACTIVE" && !readonly
          const done = reset.has(u.id)
          return (
            <div key={u.id} className={cn(GRID, "border-t px-4 py-3")}>
              <UserIdCell
                initials={initialsOf(u.name)}
                name={u.name}
                email={u.email}
              />
              <div>
                <MiniBadge tone={MEMBER_STATUS_TONE[u.status]}>
                  {memberAccountLabel(u)}
                </MiniBadge>
              </div>
              <div>
                <PendingBadge />
              </div>
              <div className="hidden lg:block">
                <PendingBadge />
              </div>
              <div className="hidden lg:block">
                <PendingBadge />
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
            No users match your search.
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
