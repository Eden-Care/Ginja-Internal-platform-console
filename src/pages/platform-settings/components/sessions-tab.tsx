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
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Note } from "@/components/console/note"
import { StatTile } from "@/components/console/stat-tile"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import {
  useRevokeSessions,
  useSessions,
} from "@/features/settings/use-sessions"
import type { SessionItem, SessionUser } from "@/features/settings/types"
import { EmptyTile, SearchBox, Toolbar, UserIdCell } from "./ua-shared"

type Confirm =
  | { userId: string; all: true }
  | { userId: string; all: false; session: SessionItem }

const isMobile = (s: SessionItem) =>
  /iphone|android|pixel|samsung|ipad|mobile/i.test(s.device + s.os)

/** Sessions a "revoke" can target — never the acting device's own session. */
const revocable = (u: SessionUser) => u.sessions.filter((s) => !s.current)

const GRID =
  "grid grid-cols-[minmax(0,1fr)_96px_120px_150px] items-center gap-3.5 lg:grid-cols-[minmax(0,1fr)_110px_130px_130px_168px]"

export function SessionsTab({
  readonly,
  roleName,
}: {
  readonly: boolean
  roleName: string
}) {
  const q = useSessions()
  const revoke = useRevokeSessions()
  const users = q.data ?? []

  const [q_, setQ] = React.useState("")
  // All user groups start collapsed; the user expands a row to see its sessions.
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set())
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)

  const totalNow = users.reduce((n, u) => n + u.sessions.length, 0)
  const activeUsers = users.length
  const avg = activeUsers ? totalNow / activeUsers : 0
  const filtered = users.filter((u) =>
    (u.name + u.email).toLowerCase().includes(q_.toLowerCase())
  )

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const confirmRow = confirm
    ? users.find((u) => u.id === confirm.userId)
    : undefined
  const confirmN =
    confirm && confirmRow ? (confirm.all ? revocable(confirmRow).length : 1) : 0

  const doEnd = () => {
    if (!confirm || !confirmRow) return
    const ids = confirm.all
      ? revocable(confirmRow).map((s) => s.id)
      : [confirm.session.id]
    const label = confirmRow.name
    revoke.mutate(ids, {
      onSuccess: () => {
        toast(
          confirm.all
            ? `Ended ${ids.length} ${ids.length === 1 ? "session" : "sessions"} for ${label}.`
            : `Session ended for ${label}.`
        )
        setConfirm(null)
      },
      onError: () => {
        toast.error("Couldn’t end the session. Please try again.")
        setConfirm(null)
      },
    })
  }

  if (q.isLoading) {
    return (
      <div className="grid place-items-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (q.isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load active sessions.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => q.refetch()}
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
        search={<SearchBox value={q_} onChange={setQ} />}
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
            const open = expanded.has(d.id)
            const canEndAll = !readonly && revocable(d).length > 0
            return (
              <div key={d.id} className="border-t">
                <div
                  className={cn(
                    GRID,
                    "cursor-pointer px-4 py-3 hover:bg-muted/40"
                  )}
                  onClick={() => toggle(d.id)}
                >
                  <UserIdCell
                    initials={d.initials}
                    name={d.name}
                    email={d.email}
                  />
                  <div>
                    <span className="inline-flex rounded-full bg-success-subtle px-[9px] py-[3px] text-[11.5px] font-semibold text-success-subtle-foreground">
                      {d.sessions.length} active
                    </span>
                  </div>
                  <div className="text-[13px] whitespace-nowrap text-foreground tabular-nums">
                    {d.lastActive}
                  </div>
                  <div className="hidden text-[13px] whitespace-nowrap text-foreground tabular-nums lg:block">
                    {d.firstLogin}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {canEndAll && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={revoke.isPending}
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirm({ userId: d.id, all: true })
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
                            {s.device}
                            {s.ip ? (
                              <>
                                {" · "}
                                <span className="mono">{s.ip}</span>
                              </>
                            ) : null}
                            {s.loc ? (
                              <>
                                {" · "}
                                <MapPinIcon className="inline size-[11px] -translate-y-px" />{" "}
                                {s.loc}
                              </>
                            ) : null}
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
                            disabled={s.current || revoke.isPending}
                            title={
                              s.current
                                ? "You can't end your own current session here"
                                : "End this session"
                            }
                            onClick={() =>
                              setConfirm({
                                userId: d.id,
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
        confirmLabel={
          revoke.isPending
            ? "Ending…"
            : confirm?.all
              ? `End ${confirmN} sessions`
              : "End session"
        }
        onConfirm={doEnd}
        onCancel={() => (revoke.isPending ? undefined : setConfirm(null))}
        body={
          confirm && confirmRow ? (
            <>
              <p>
                {confirm.all ? (
                  <>
                    <b>{confirmRow.name}</b> will be signed out of{" "}
                    <b>{confirmN}</b> {confirmN === 1 ? "device" : "devices"}{" "}
                    immediately and must re-authenticate.
                  </>
                ) : (
                  <>
                    <b>{confirmRow.name}</b> will be signed out of{" "}
                    <b>{confirm.session.browser}</b> on {confirm.session.device}
                    {confirm.session.ip ? (
                      <>
                        {" "}
                        (<span className="mono">{confirm.session.ip}</span>)
                      </>
                    ) : null}{" "}
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
