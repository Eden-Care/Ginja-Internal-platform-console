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
import {
  ACCESS_USERS,
  MFA_METHOD_LABEL,
  USER_STATUS_TONE,
  mfaEnabled,
  mfaOf,
  type AccessUser,
} from "@/lib/console-data"
import {
  EmptyTile,
  SearchBox,
  SegToggle,
  Toolbar,
  UserIdCell,
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
  const users = ACCESS_USERS
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState("All")
  const [detail, setDetail] = React.useState<AccessUser | null>(null)
  const [reminded, setReminded] = React.useState<Set<string>>(() => new Set())

  const enabledCount = users.filter((u) => mfaEnabled(u.id)).length
  const notConfigured = users.length - enabledCount
  const adoption = Math.round((enabledCount / users.length) * 100)

  const matchesFilter = (u: AccessUser) =>
    filter === "All" ||
    (filter === "Enabled" ? mfaEnabled(u.id) : !mfaEnabled(u.id))
  const list = users.filter(
    (u) =>
      matchesFilter(u) &&
      (u.name + u.email).toLowerCase().includes(q.toLowerCase())
  )
  const remind = (u: AccessUser) => {
    setReminded((s) => new Set(s).add(u.id))
    toast(`Enrolment reminder sent to ${u.name}.`)
  }

  return (
    <>
      <Note tone="info" icon={<ShieldCheckIcon />} className="mb-4">
        <b>Admin-only.</b> Multi-factor enrolment for every Platform Console
        user. You can send enrolment reminders, but only the user can complete
        MFA setup.
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
          const m = mfaOf(u.id)
          const on = mfaEnabled(u.id)
          const sent = reminded.has(u.id)
          return (
            <div key={u.id} className={cn(GRID, "border-t px-4 py-3")}>
              <UserIdCell initials={u.initials} name={u.name} email={u.email} />
              <div>
                <MiniBadge tone={USER_STATUS_TONE[u.status]}>
                  {u.inviteExpired ? "Expired" : u.status}
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
                  <div className="flex flex-wrap gap-[5px]">
                    {m.methods.map((x) => (
                      <span
                        key={x}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary [&>svg]:size-[11px]"
                      >
                        {x === "totp" ? <KeyRoundIcon /> : <MailIcon />}
                        {MFA_METHOD_LABEL[x]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="hidden text-[13px] lg:block">
                {!on ? (
                  <span className="text-muted-foreground">N/A</span>
                ) : (m.backupCodes ?? 0) > 0 ? (
                  <span>{m.backupCodes} remaining</span>
                ) : (
                  <span className="text-destructive">None remaining</span>
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
                    <Button variant="ghost" size="sm" onClick={() => remind(u)}>
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
