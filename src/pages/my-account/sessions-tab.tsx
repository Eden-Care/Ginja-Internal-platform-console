import * as React from "react"
import {
  CheckIcon,
  InfoIcon,
  LogOutIcon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { ConfirmDialog } from "@/components/console/confirm-dialog"
import { MY_SESSIONS, type MySession } from "@/lib/console-data"

const GRID =
  "grid grid-cols-[minmax(0,1.5fr)_120px_110px] items-center gap-3.5 lg:grid-cols-[minmax(0,1.5fr)_130px_130px_120px_110px]"

const isMobile = (s: MySession) =>
  /iphone|ios|android|pixel/i.test(s.device + s.os)

type Confirm = MySession | "all"

export function SessionsTab() {
  const [list, setList] = React.useState<MySession[]>(() =>
    MY_SESSIONS.map((s) => ({ ...s }))
  )
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)

  const live = list.filter((s) => !s.ended)
  const others = live.filter((s) => !s.current).length

  const endOne = (id: string) => {
    setList((l) => l.map((s) => (s.id === id ? { ...s, ended: true } : s)))
    setConfirm(null)
    toast("Session signed out.")
  }
  const endAll = () => {
    setList((l) => l.map((s) => (s.current ? s : { ...s, ended: true })))
    setConfirm(null)
    toast("Signed out of all other devices.")
  }

  const session = confirm && confirm !== "all" ? confirm : null
  const all = confirm === "all"

  return (
    <>
      <Note tone="info" icon={<InfoIcon />} className="mb-4">
        These are the devices currently signed in to your account. If you don't
        recognise one, sign it out and change your password.
      </Note>

      <div className="mb-3 flex items-center">
        <Tagpill>
          {live.length} active {live.length === 1 ? "session" : "sessions"}
        </Tagpill>
        <span className="flex-1" />
        {others > 0 && (
          <Button variant="outline" size="sm" onClick={() => setConfirm("all")}>
            <LogOutIcon data-icon="inline-start" />
            Sign out all other devices
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div
          className={cn(
            GRID,
            "border-b bg-muted/50 px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
          )}
        >
          <span>Device</span>
          <span>Location</span>
          <span className="hidden lg:block">IP address</span>
          <span className="hidden lg:block">Last active</span>
          <span />
        </div>

        {live.map((s) => (
          <div
            key={s.id}
            className={cn(GRID, "border-t px-4 py-3 first:border-t-0")}
          >
            <div className="flex min-w-0 items-center gap-[11px]">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground">
                {isMobile(s) ? (
                  <SmartphoneIcon className="size-4" />
                ) : (
                  <MonitorIcon className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-[7px] text-[13.5px] font-semibold">
                  {s.browser} · {s.os}
                  {s.current && (
                    <span className="rounded-[5px] bg-success-subtle px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.03em] text-success-subtle-foreground uppercase">
                      This device
                    </span>
                  )}
                </div>
                <div className="mono truncate text-[11.5px] text-muted-foreground">
                  {s.device}
                </div>
              </div>
            </div>
            <div className="text-[13px] whitespace-nowrap text-foreground tabular-nums">
              {s.loc}
            </div>
            <div className="mono hidden text-[11.5px] whitespace-nowrap text-foreground lg:block">
              {s.ip}
            </div>
            <div className="hidden text-[13px] whitespace-nowrap text-foreground tabular-nums lg:block">
              {s.lastSeen}
            </div>
            <div className="flex items-center justify-end gap-2">
              {s.current ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-success [&>svg]:size-3.5">
                  <CheckIcon />
                  Current
                </span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirm(s)}
                >
                  <LogOutIcon data-icon="inline-start" />
                  Sign out
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirm}
        icon={<LogOutIcon />}
        tone={all ? "danger" : "warn"}
        title={
          all
            ? `Sign out ${others} other ${others === 1 ? "device" : "devices"}?`
            : "Sign out this device?"
        }
        confirmLabel={all ? "Sign out all others" : "Sign out"}
        onConfirm={all ? endAll : () => session && endOne(session.id)}
        onCancel={() => setConfirm(null)}
        body={
          confirm ? (
            <p>
              {all ? (
                <>
                  You'll stay signed in on <b>this device</b>. All other sessions
                  will be ended immediately and will need to sign in again.
                </>
              ) : (
                session && (
                  <>
                    <b>
                      {session.browser} · {session.os}
                    </b>{" "}
                    ({session.device},{" "}
                    <span className="mono">{session.ip}</span>) will be signed
                    out immediately.
                  </>
                )
              )}
            </p>
          ) : null
        }
      />
    </>
  )
}
