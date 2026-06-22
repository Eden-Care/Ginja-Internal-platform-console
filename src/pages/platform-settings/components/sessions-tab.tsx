import * as React from "react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  GaugeIcon,
  InfoIcon,
  LogOutIcon,
  MapPinIcon,
  MonitorIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Note } from "@/components/console/note"
import { StatTile } from "@/components/console/stat-tile"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import {
  SESSION_USERS,
  firstLoginOf,
  userSessions,
  type AccessUser,
  type UserSession,
} from "@/lib/console-data"
import { EmptyTile, SearchBox, Toolbar, UserIdCell } from "./ua-shared"

type Row = { user: AccessUser; sessions: UserSession[] }
type Confirm =
  | { userId: string; all: true }
  | { userId: string; all: false; session: UserSession }

const isMobile = (s: UserSession) =>
  /iphone|android|pixel|samsung|ipad/i.test(s.device + s.os)

const GRID =
  "grid grid-cols-[minmax(0,1fr)_96px_120px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1fr)_110px_130px_130px_168px]"

export function SessionsTab({
  readonly,
  roleName,
}: {
  readonly: boolean
  roleName: string
}) {
  const [data, setData] = React.useState<Row[]>(() =>
    SESSION_USERS.map((u) => ({
      user: u,
      sessions: userSessions(u.id).map((s) => ({ ...s })),
    }))
  )
  const [q, setQ] = React.useState("")
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set([SESSION_USERS[0]?.id].filter(Boolean) as string[])
  )
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)

  const liveData = data.filter((d) => d.sessions.length > 0)
  const totalNow = liveData.reduce((n, d) => n + d.sessions.length, 0)
  const activeUsers = liveData.length
  const avg = activeUsers ? totalNow / activeUsers : 0
  const filtered = liveData.filter((d) =>
    (d.user.name + d.user.email).toLowerCase().includes(q.toLowerCase())
  )

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const confirmRow = confirm
    ? data.find((d) => d.user.id === confirm.userId)
    : undefined
  const confirmN =
    confirm && confirmRow ? (confirm.all ? confirmRow.sessions.length : 1) : 0

  const doEnd = () => {
    if (!confirm) return
    setData((rows) =>
      rows.map((row) => {
        if (row.user.id !== confirm.userId) return row
        if (confirm.all) return { ...row, sessions: [] }
        return {
          ...row,
          sessions: row.sessions.filter((s) => s.id !== confirm.session.id),
        }
      })
    )
    toast(
      confirm.all
        ? `Ended ${confirmN} sessions for ${confirmRow?.user.name}.`
        : `Session ended for ${confirmRow?.user.name}.`
    )
    setConfirm(null)
  }

  return (
    <>
      <Note tone="info" icon={<ShieldCheckIcon />} className="mb-4">
        <b>Admin-only.</b> Only a Platform Admin can view and end other users'
        sessions. Ending a session signs that device out immediately and is
        written to the audit log.
      </Note>

      <div className="mb-[18px] grid grid-cols-3 gap-3">
        <StatTile
          icon={<MonitorIcon />}
          value={totalNow}
          label="Total active sessions"
        />
        <StatTile
          icon={<UsersIcon />}
          value={activeUsers}
          label="Signed-in users"
        />
        <StatTile
          icon={<GaugeIcon />}
          value={avg.toFixed(1)}
          label="Avg sessions / user"
        />
      </div>

      <Toolbar
        search={<SearchBox value={q} onChange={setQ} />}
        count={`${filtered.length} of ${activeUsers} users`}
      />

      {activeUsers === 0 ? (
        <EmptyTile icon={<MonitorIcon />}>
          <b>No active sessions.</b>
          <br />
          No Platform Console users are currently signed in. Sessions appear
          here the moment a user logs in.
        </EmptyTile>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div
            className={cn(
              GRID,
              "border-b bg-muted/50 px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.04em] text-muted-foreground uppercase"
            )}
          >
            <span>User</span>
            <span>Sessions</span>
            <span>Last activity</span>
            <span className="hidden lg:block">First login</span>
            <span />
          </div>

          {filtered.map((d) => {
            const open = expanded.has(d.user.id)
            return (
              <div key={d.user.id} className="border-t">
                <div
                  className={cn(
                    GRID,
                    "cursor-pointer px-4 py-3 hover:bg-muted/40"
                  )}
                  onClick={() => toggle(d.user.id)}
                >
                  <UserIdCell
                    initials={d.user.initials}
                    name={d.user.name}
                    email={d.user.email}
                  />
                  <div>
                    <span className="inline-flex rounded-full bg-success-subtle px-[9px] py-[3px] text-[11.5px] font-semibold text-success-subtle-foreground">
                      {d.sessions.length} active
                    </span>
                  </div>
                  <div className="text-[13px] whitespace-nowrap text-foreground tabular-nums">
                    {d.user.lastActive}
                  </div>
                  <div className="hidden text-[13px] whitespace-nowrap text-foreground tabular-nums lg:block">
                    {firstLoginOf(d.user)}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirm({ userId: d.user.id, all: true })
                        }}
                      >
                        <LogOutIcon data-icon="inline-start" />
                        End all
                      </Button>
                    )}
                    {open ? (
                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t bg-muted/25">
                    {d.sessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 border-t py-[11px] pr-[15px] pl-[18px] first:border-t-0"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground">
                          {isMobile(s) ? (
                            <SmartphoneIcon className="size-4" />
                          ) : (
                            <MonitorIcon className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-[7px] text-[12.5px] font-semibold">
                            {s.browser} · {s.os}
                            {s.current && (
                              <span className="rounded-[5px] bg-success-subtle px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.03em] text-success-subtle-foreground uppercase">
                                This device
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                            {s.device} · <span className="mono">{s.ip}</span> ·{" "}
                            <MapPinIcon className="inline size-[11px] -translate-y-px" />{" "}
                            {s.loc}
                          </div>
                        </div>
                        <div className="hidden flex-col gap-0.5 text-right text-[11px] whitespace-nowrap text-muted-foreground min-[1180px]:flex [&_b]:font-semibold [&_b]:text-foreground">
                          <div>
                            <b>Started</b> {s.started}
                          </div>
                          <div>
                            <b>Last seen</b> {s.lastSeen}
                          </div>
                        </div>
                        {!readonly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={s.current}
                            title={
                              s.current
                                ? "You can't end your own current session here"
                                : "End this session"
                            }
                            onClick={() =>
                              setConfirm({
                                userId: d.user.id,
                                all: false,
                                session: s,
                              })
                            }
                            className="shrink-0"
                          >
                            <LogOutIcon data-icon="inline-start" />
                            End
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <EmptyTile icon={<MonitorIcon />}>
              <b>No matching users.</b>
              <br />
              No signed-in users match your search.
            </EmptyTile>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        icon={<LogOutIcon />}
        tone="danger"
        title={confirm?.all ? `End all ${confirmN} sessions?` : "End session?"}
        confirmLabel={confirm?.all ? `End ${confirmN} sessions` : "End session"}
        onConfirm={doEnd}
        onCancel={() => setConfirm(null)}
        body={
          confirm && confirmRow ? (
            <>
              <p>
                {confirm.all ? (
                  <>
                    <b>{confirmRow.user.name}</b> will be signed out of{" "}
                    <b>{confirmN}</b> {confirmN === 1 ? "device" : "devices"}{" "}
                    immediately and must re-authenticate.
                  </>
                ) : (
                  <>
                    <b>{confirmRow.user.name}</b> will be signed out of{" "}
                    <b>{confirm.session.browser}</b> on {confirm.session.device}{" "}
                    (<span className="mono">{confirm.session.ip}</span>)
                    immediately.
                  </>
                )}
              </p>
              <ImpactBox
                tone="warn"
                icon={<InfoIcon />}
                heading="What happens"
                items={[
                  `The ${confirm.all ? "devices are" : "device is"} signed out on their next request.`,
                  `An audit entry is written attributing this to you (${roleName}).`,
                  "The user can sign back in unless their account is also suspended.",
                ]}
              />
            </>
          ) : null
        }
      />
    </>
  )
}
