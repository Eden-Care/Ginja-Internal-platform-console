import { CheckIcon, LockIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MiniBadge } from "@/components/console/tagpill"
import type { Member } from "@/features/access/types"
import {
  MEMBER_STATUS_TONE,
  PendingBadge,
  UserAvatar,
  initialsOf,
  memberAccountLabel,
} from "./ua-shared"

export function PasswordDetailDrawer({
  user,
  readonly,
  done,
  onForceReset,
  onClose,
}: {
  user: Member | null
  readonly: boolean
  done: boolean
  onForceReset: (u: Member) => void
  onClose: () => void
}) {
  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="gap-0 p-0 data-[side=right]:w-[416px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[416px]"
      >
        {user
          ? (() => {
              const canReset = user.status === "ACTIVE" && !readonly
              return (
                <>
                  <div className="flex items-center gap-[11px] border-b px-[18px] py-4">
                    <UserAvatar
                      initials={initialsOf(user.name)}
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
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/60 p-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground [&>svg]:size-5">
                        <LockIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">Password health</div>
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                          Last changed, expiry and rotation status aren’t
                          exposed by the API yet.
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
                          {user.code}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 bg-card px-3 py-2.5">
                        <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                          Account
                        </span>
                        <MiniBadge tone={MEMBER_STATUS_TONE[user.status]}>
                          {memberAccountLabel(user)}
                        </MiniBadge>
                      </div>
                    </div>

                    {/* Rotation — pending backend */}
                    <div>
                      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                        Rotation
                      </div>
                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border bg-border">
                        <div className="flex flex-col gap-1.5 bg-card px-3 py-2.5">
                          <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                            Last changed
                          </span>
                          <PendingBadge />
                        </div>
                        <div className="flex flex-col gap-1.5 bg-card px-3 py-2.5">
                          <span className="text-[9.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                            Expires
                          </span>
                          <PendingBadge />
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
