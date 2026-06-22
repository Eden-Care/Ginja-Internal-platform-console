import {
  CheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  MinusIcon,
  RotateCcwIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MiniBadge } from "@/components/console/tagpill"
import {
  PWD_POLICY_DAYS,
  USER_STATUS_TONE,
  pwdOf,
  type AccessUser,
} from "@/lib/console-data"
import { pwdExpiryDate, pwdState, type PwdState } from "@/lib/console-format"
import { UserAvatar } from "./ua-shared"
import { PWD_STATE } from "./password-tab"

const HERO_TONE: Record<PwdState, string> = {
  ok: "border-success/35 bg-success-subtle/50",
  soon: "border-warning/40 bg-warning-subtle/50",
  expired: "border-destructive/35 bg-destructive/8",
  pending: "border-border bg-muted/60",
}
const HERO_IC_TONE: Record<PwdState, string> = {
  ok: "bg-success/16 text-success",
  soon: "bg-warning/20 text-warning-subtle-foreground",
  expired: "bg-destructive/14 text-destructive",
  pending: "bg-muted text-muted-foreground",
}
const METER_TONE: Record<PwdState, string> = {
  ok: "bg-success",
  soon: "bg-warning",
  expired: "bg-destructive",
  pending: "bg-success",
}

const HERO_ICON: Record<PwdState, React.ReactNode> = {
  ok: <CheckCircle2Icon />,
  soon: <ClockIcon />,
  expired: <TriangleAlertIcon />,
  pending: <MinusIcon />,
}

function daysLabel(id: string): string {
  const p = pwdOf(id)
  if (p.pending) return ""
  if (p.daysLeft < 0) {
    const n = Math.abs(p.daysLeft)
    return `Overdue by ${n} ${n === 1 ? "day" : "days"}`
  }
  return `${p.daysLeft} ${p.daysLeft === 1 ? "day" : "days"} to change`
}

export function PasswordDetailDrawer({
  user,
  readonly,
  done,
  onForceReset,
  onClose,
}: {
  user: AccessUser | null
  readonly: boolean
  done: boolean
  onForceReset: (u: AccessUser) => void
  onClose: () => void
}) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="w-[416px] gap-0 p-0 sm:max-w-[416px]"
      >
        {user
          ? (() => {
              const st = pwdState(user.id)
              const S = PWD_STATE[st]
              const p = pwdOf(user.id)
              const accountLabel = user.inviteExpired ? "Expired" : user.status
              const pct = p.pending
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round((p.daysLeft / PWD_POLICY_DAYS) * 100)
                    )
                  )
              return (
                <>
                  <div className="flex items-center gap-[11px] border-b px-[18px] py-4">
                    <UserAvatar
                      initials={user.initials}
                      className="size-[38px] text-[12px]"
                    />
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold">{user.name}</div>
                      <div className="mono truncate text-[11.5px] text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 content-start gap-3.5 overflow-y-auto px-[18px] py-4">
                    {/* Hero */}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5",
                        HERO_TONE[st]
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-[11px] [&>svg]:size-5",
                          HERO_IC_TONE[st]
                        )}
                      >
                        {HERO_ICON[st]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">
                          Password {S.label.toLowerCase()}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {p.pending
                            ? "No password set — user hasn't completed sign-up"
                            : daysLabel(user.id)}
                        </div>
                      </div>
                    </div>

                    {/* Key-value grid */}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border bg-border">
                      <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          User ID
                        </span>
                        <span className="mono text-[12.5px] font-medium">
                          {user.id}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          Account
                        </span>
                        <MiniBadge tone={USER_STATUS_TONE[user.status]}>
                          {accountLabel}
                        </MiniBadge>
                      </div>
                    </div>

                    {!p.pending && (
                      <div>
                        <div className="mb-2 text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          Rotation · {PWD_POLICY_DAYS}-day policy
                        </div>
                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border bg-border">
                          <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                            <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                              Last changed
                            </span>
                            <span className="text-[12.5px] font-medium">
                              {p.lastChanged}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                            <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                              Expires
                            </span>
                            <span className="text-[12.5px] font-medium">
                              {p.daysLeft < 0
                                ? `${pwdExpiryDate(user.id)} (overdue)`
                                : pwdExpiryDate(user.id)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2.5">
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                METER_TONE[st]
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-1.5 text-[11.5px] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
                            {p.daysLeft < 0 ? (
                              <b className="text-destructive">
                                Overdue by {Math.abs(p.daysLeft)} days
                              </b>
                            ) : (
                              <>
                                <b>{p.daysLeft} days</b> until change required
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {p.pending && (
                      <div className="rounded-[10px] border border-dashed border-input px-[11px] py-[9px] text-[12.5px] text-muted-foreground">
                        This user was invited but hasn't set a password yet. It
                        will appear here once they complete sign-up.
                      </div>
                    )}
                  </div>

                  {!p.pending && !readonly && st !== "ok" && (
                    <div className="flex items-center justify-end gap-2 border-t px-[18px] py-3.5">
                      {done ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                          <CheckIcon />
                          Reset link sent
                        </span>
                      ) : (
                        <Button onClick={() => onForceReset(user)}>
                          <RotateCcwIcon data-icon="inline-start" />
                          Force password reset
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )
            })()
          : null}
      </SheetContent>
    </Sheet>
  )
}
