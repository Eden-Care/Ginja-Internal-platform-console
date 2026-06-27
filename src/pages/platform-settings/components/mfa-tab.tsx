import * as React from "react"
import {
  CheckIcon,
  GaugeIcon,
  KeyRoundIcon,
  MailIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UsersIcon,
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
import { useRemindMfa } from "@/features/settings/use-mfa"
import {
  EmptyTile,
  MEMBER_STATUS_TONE,
  PendingBadge,
  SearchBox,
  SegToggle,
  Toolbar,
  UserIdCell,
  initialsOf,
  memberAccountLabel,
} from "./ua-shared"
import { MfaDetailDrawer } from "./mfa-detail-drawer"

const FILTERS = [
  { k: "All", label: "All" },
  { k: "Enabled", label: "Enabled" },
  { k: "Not configured", label: "Not configured" },
]

const GRID =
  "grid grid-cols-[minmax(0,1.4fr)_120px_130px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_110px_130px_minmax(0,1.2fr)_120px_168px]"

export function MfaTab({ readonly }: { readonly: boolean }) {
  const membersQuery = useMembers({})
  const users = membersQuery.data?.items ?? []

  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState("All")
  const [detail, setDetail] = React.useState<Member | null>(null)
  const [reminded, setReminded] = React.useState<Set<number>>(() => new Set())

  const enabledCount = users.filter((u) => u.mfaEnabled).length
  const notConfigured = users.length - enabledCount
  const adoption = users.length
    ? Math.round((enabledCount / users.length) * 100)
    : 0

  const matchesFilter = (u: Member) =>
    filter === "All" || (filter === "Enabled" ? u.mfaEnabled : !u.mfaEnabled)
  const list = users.filter(
    (u) =>
      matchesFilter(u) &&
      (u.name + u.email).toLowerCase().includes(q.toLowerCase())
  )

  const remindMut = useRemindMfa()
  const remind = (u: Member) => {
    remindMut.mutate(u.id, {
      onSuccess: () => {
        setReminded((s) => new Set(s).add(u.id))
        toast.success(`Enrolment reminder sent to ${u.name}.`)
      },
      onError: (e) =>
        toast.error("Couldn't send the reminder", {
          description: e instanceof Error ? e.message : undefined,
        }),
    })
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
        <b>Admin-only.</b> Multi-factor enrolment for every Platform Console
        user. Enrolment status is live; the specific methods and backup-code
        counts aren’t exposed by the API yet.
      </Note>

      <div className="mb-[18px] grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={<UsersIcon />}
          value={users.length}
          label="Total users"
        />
        <StatTile
          icon={<ShieldCheckIcon />}
          tone="success"
          value={enabledCount}
          label="MFA enabled"
        />
        <StatTile
          icon={<TriangleAlertIcon />}
          tone={notConfigured ? "warning" : "neutral"}
          value={notConfigured}
          label="Not configured"
        />
        <StatTile
          icon={<GaugeIcon />}
          value={`${adoption}%`}
          label="Adoption rate"
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
          <span>MFA status</span>
          <span className="hidden lg:block">Methods</span>
          <span className="hidden lg:block">Backup codes</span>
          <span />
        </div>

        {list.map((u) => {
          const on = u.mfaEnabled
          const sent = reminded.has(u.id)
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
                {on ? (
                  <MiniBadge tone="success">Enabled</MiniBadge>
                ) : (
                  <MiniBadge tone="warning">Not configured</MiniBadge>
                )}
              </div>
              <div className="hidden lg:block">
                {on ? (
                  <PendingBadge />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="hidden text-[13px] lg:block">
                {on ? (
                  <PendingBadge />
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {!on &&
                  !readonly &&
                  (sent ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                      <CheckIcon />
                      Reminder sent
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={remindMut.isPending}
                      onClick={() => remind(u)}
                    >
                      <MailIcon data-icon="inline-start" />
                      Remind
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
          <EmptyTile icon={<KeyRoundIcon />}>
            <b>No matching users.</b>
            <br />
            No users match your search or filter.
          </EmptyTile>
        )}
      </div>

      <MfaDetailDrawer
        user={detail}
        readonly={readonly}
        reminded={detail ? reminded.has(detail.id) : false}
        onRemind={remind}
        onClose={() => setDetail(null)}
      />
    </>
  )
}
