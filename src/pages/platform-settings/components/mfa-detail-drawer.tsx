import {
  CheckIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MailIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MiniBadge } from "@/components/console/tagpill"
import {
  MFA_METHOD_LABEL,
  USER_STATUS_TONE,
  mfaEnabled,
  mfaOf,
  type AccessUser,
} from "@/lib/console-data"
import { UserAvatar } from "./ua-shared"

/** Uppercase eyebrow used for drawer block headings. */
function BlockHead({
  children,
  count,
}: {
  children: React.ReactNode
  count?: number
}) {
  return (
    <div className="mb-2 flex items-center gap-[7px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
      {children}
      {typeof count === "number" ? (
        <span className="mono rounded-full bg-muted px-1.5 py-px text-[10px] font-bold tracking-normal text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  )
}

export function MfaDetailDrawer({
  user,
  readonly,
  reminded,
  onRemind,
  onClose,
}: {
  user: AccessUser | null
  readonly: boolean
  reminded: boolean
  onRemind: (u: AccessUser) => void
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
              const m = mfaOf(user.id)
              const on = mfaEnabled(user.id)
              const accountLabel = user.inviteExpired ? "Expired" : user.status
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
                        on
                          ? "border-success/35 bg-success-subtle/50"
                          : "border-warning/40 bg-warning-subtle/50"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-[11px] [&>svg]:size-5",
                          on
                            ? "bg-success/16 text-success"
                            : "bg-warning/20 text-warning-subtle-foreground"
                        )}
                      >
                        {on ? <ShieldCheckIcon /> : <ShieldIcon />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">
                          MFA {on ? "enabled" : "not configured"}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                          {on
                            ? `Active since ${m.enabledOn}`
                            : "User hasn't completed MFA setup"}
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

                    {/* Methods */}
                    <div>
                      <BlockHead count={on ? m.methods.length : undefined}>
                        Methods
                      </BlockHead>
                      {on ? (
                        <div className="grid gap-[7px]">
                          {m.methods.map((x) => (
                            <div
                              key={x}
                              className="flex items-center gap-2.5 rounded-[10px] border bg-card px-[11px] py-[9px]"
                            >
                              <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary/12 text-primary [&>svg]:size-3.5">
                                {x === "totp" ? <KeyRoundIcon /> : <MailIcon />}
                              </span>
                              <div>
                                <div className="text-[12.5px] font-semibold">
                                  {MFA_METHOD_LABEL[x]}
                                </div>
                                <div className="mt-px text-[11px] text-muted-foreground">
                                  {x === "totp"
                                    ? "Time-based code"
                                    : "One-time passcode"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[10px] border border-dashed border-input px-[11px] py-[9px] text-[12.5px] text-muted-foreground">
                          No methods enrolled.
                        </div>
                      )}
                    </div>

                    {/* Backup codes */}
                    <div>
                      <BlockHead>Backup codes</BlockHead>
                      {!on ? (
                        <div className="rounded-[10px] border border-dashed border-input px-[11px] py-[9px] text-[12.5px] text-muted-foreground">
                          Not applicable
                        </div>
                      ) : (m.backupCodes ?? 0) > 0 ? (
                        <div className="flex items-center gap-2.5 rounded-[10px] bg-success-subtle/50 p-[11px] text-[12.5px] text-success-subtle-foreground">
                          <CheckCircle2Icon className="size-[15px] shrink-0" />
                          <div className="flex-1">
                            <b className="font-semibold">
                              {m.backupCodes} of 10 remaining
                            </b>
                            <div className="mt-[5px] h-[5px] overflow-hidden rounded-full bg-success/20">
                              <span
                                className="block h-full rounded-full bg-success"
                                style={{
                                  width: `${(m.backupCodes ?? 0) * 10}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 rounded-[10px] bg-destructive/8 p-[11px] text-[12.5px] text-destructive">
                          <TriangleAlertIcon className="size-[15px] shrink-0" />
                          <div>
                            <b className="font-semibold">None remaining</b>
                            <div className="mt-px text-[11px] opacity-85">
                              User should regenerate backup codes.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!on && !readonly && (
                    <div className="flex items-center justify-end gap-2 border-t px-[18px] py-3.5">
                      {reminded ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                          <CheckIcon />
                          Reminder sent
                        </span>
                      ) : (
                        <Button onClick={() => onRemind(user)}>
                          <MailIcon data-icon="inline-start" />
                          Send reminder
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
