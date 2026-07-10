import { CheckIcon, LockIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MiniBadge } from "@/components/console/tagpill"
import { usePasswordDetail } from "@/features/settings/use-password"
import type { PasswordStatus } from "@/features/settings/types"
import {
  PWD_STATE,
  PendingBadge,
  UserAvatar,
  initialsOf,
  passwordExpires,
  passwordLastChanged,
} from "./ua-shared"

export function PasswordDetailDrawer({
  ps,
  readonly,
  done,
  onForceReset,
  onClose,
}: {
  ps: PasswordStatus | null
  readonly: boolean
  done: boolean
  onForceReset: (ps: PasswordStatus) => void
  onClose: () => void
}) {
  // Per-user endpoint; render instantly from the passed row, refresh from detail.
  const detailQuery = usePasswordDetail(ps?.memberId ?? null)
  return (
    <Sheet open={!!ps} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="gap-0 p-0 data-[side=right]:w-[416px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[416px]"
      >
        {ps
          ? (() => {
              const canReset =
                !readonly && (ps.state === "EXPIRING" || ps.state === "EXPIRED")
              const health = detailQuery.data ?? ps
              const lastChanged = passwordLastChanged(health)
              const expires = passwordExpires(health)
              return (
                <>
                  <div className="flex items-center gap-[11px] border-b px-[18px] py-4">
                    <UserAvatar
                      initials={initialsOf(ps.name)}
                      className="size-[38px] text-[12px]"
                    />
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold">{ps.name}</div>
                      <div className="mono truncate text-[11.5px] text-muted-foreground">
                        {ps.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 content-start gap-3.5 overflow-y-auto px-[18px] py-4">
                    {/* Hero */}
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 p-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground [&>svg]:size-5">
                        <LockIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">Password health</div>
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                          90-day rotation policy.
                        </div>
                      </div>
                      <MiniBadge tone={PWD_STATE[health.state].tone}>
                        {PWD_STATE[health.state].label}
                      </MiniBadge>
                    </div>

                    {/* Key-value grid */}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border bg-border">
                      <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          User ID
                        </span>
                        <span className="mono text-[12.5px] font-medium">
                          #{ps.memberId}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          Account
                        </span>
                        {/* Not in the password-status API — static. */}
                        <MiniBadge tone="success">Active</MiniBadge>
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                        Rotation
                      </div>
                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border bg-border">
                        <div className="flex flex-col gap-1.5 bg-card px-3 py-2.5">
                          <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                            Last changed
                          </span>
                          {lastChanged ? (
                            <span className="text-[12.5px] font-medium">
                              {lastChanged}
                            </span>
                          ) : (
                            <PendingBadge />
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 bg-card px-3 py-2.5">
                          <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                            Expires
                          </span>
                          {expires ? (
                            <span className="text-[12.5px] font-medium">
                              {expires}
                            </span>
                          ) : (
                            <PendingBadge />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {canReset && (
                    <div className="flex items-center justify-end gap-2 border-t px-[18px] py-3.5">
                      {done ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success [&>svg]:size-3.5">
                          <CheckIcon />
                          Reset link sent
                        </span>
                      ) : (
                        <Button onClick={() => onForceReset(ps)}>
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
