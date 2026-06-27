import * as React from "react"
import {
  CheckIcon,
  FingerprintIcon,
  KeyRoundIcon,
  MailIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SmartphoneIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { MiniBadge } from "@/components/console/tagpill"
import type { Member } from "@/features/access/types"
import { useMfaDetail } from "@/features/settings/use-mfa"
import {
  MEMBER_STATUS_TONE,
  UserAvatar,
  initialsOf,
  memberAccountLabel,
} from "./ua-shared"

/** Enrolment method → label + icon. */
const METHOD_META: Record<string, { label: string; icon: React.ReactNode }> = {
  totp: { label: "Authenticator app (TOTP)", icon: <KeyRoundIcon /> },
  sms: { label: "SMS code", icon: <SmartphoneIcon /> },
  webauthn: { label: "Security key (WebAuthn)", icon: <FingerprintIcon /> },
  email: { label: "Email code", icon: <MailIcon /> },
}

/** Uppercase eyebrow used for drawer block headings. */
function BlockHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-[7px] text-[10.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}

function GapBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-input px-[11px] py-[9px] text-[12.5px] text-muted-foreground">
      {children}
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
  user: Member | null
  readonly: boolean
  reminded: boolean
  onRemind: (u: Member) => void
  onClose: () => void
}) {
  // GET /platform/settings/mfa-status/{id} — fetched when the drawer opens.
  const detailQuery = useMfaDetail(user?.id ?? null)
  const detail = detailQuery.data

  return (
    <Sheet open={!!user} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="gap-0 p-0 data-[side=right]:w-[416px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[416px]"
      >
        {user
          ? (() => {
              // The detail endpoint is authoritative; fall back to the row's
              // mfa_enabled flag while it loads.
              const on = detail?.enabled ?? user.mfaEnabled
              const methods = detail?.methods ?? []
              const backupCodes = detail?.backupCodes ?? null
              const loading = detailQuery.isLoading
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
                            ? "User has completed multi-factor enrolment"
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

                    {/* Methods (from /mfa-status/{id}) */}
                    <div>
                      <BlockHead>Methods</BlockHead>
                      {loading ? (
                        <GapBox>Loading…</GapBox>
                      ) : methods.length > 0 ? (
                        <div className="grid gap-[7px]">
                          {methods.map((m) => {
                            const meta = METHOD_META[m] ?? {
                              label: m,
                              icon: <ShieldCheckIcon />,
                            }
                            return (
                              <div
                                key={m}
                                className="flex items-center gap-2.5 rounded-[10px] border bg-card px-[11px] py-[9px]"
                              >
                                <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary/12 text-primary [&>svg]:size-3.5">
                                  {meta.icon}
                                </span>
                                <span className="text-[12.5px] font-semibold">
                                  {meta.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <GapBox>No methods enrolled.</GapBox>
                      )}
                    </div>

                    {/* Backup codes (from /mfa-status/{id}) */}
                    <div>
                      <BlockHead>Backup codes</BlockHead>
                      {loading ? (
                        <GapBox>Loading…</GapBox>
                      ) : backupCodes != null ? (
                        <div className="flex items-center gap-2 rounded-[10px] border bg-card px-[11px] py-[9px] text-[12.5px]">
                          <span className="font-semibold">{backupCodes}</span>
                          <span className="text-muted-foreground">
                            {backupCodes === 1 ? "code" : "codes"} remaining
                          </span>
                        </div>
                      ) : (
                        <GapBox>Not applicable</GapBox>
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
