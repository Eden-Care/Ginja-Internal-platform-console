import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  BanIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  InfoIcon,
  KeyRoundIcon,
  MailIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { ConsoleSelect, Field } from "@/components/console/form-atoms"
import { hifiTableHead } from "@/components/console/table"
import { useAccess } from "@/contexts/access-context"
import {
  ACCESS_ROLES,
  ACCESS_USERS,
  type AccessUser,
  ALL_PERMS,
  permLabel,
  PERM_TOTAL,
  roleById,
  rolePermCount,
  type TimelineEvent,
  TL_KIND,
  USER_STATUS_TONE,
} from "@/lib/console-data"
import {
  AccessGlyph,
  AccessTabs,
  CheckSquare,
  ConfirmDialog,
  ImpactBox,
  RoleBadge,
  RoleIcon,
  SysChip,
} from "./access-shared"

type ModalType = "suspend" | "revoke" | "delete"

/* ------------------------------------------------------------- atoms ----- */

const AVATAR_TONE: Record<string, string> = {
  success: "bg-primary/12 text-primary",
  info: "bg-info/15 text-info-subtle-foreground",
  warning: "bg-warning/18 text-warning-subtle-foreground",
  error: "bg-destructive/15 text-destructive",
}

function UserAvatar({ u, lg }: { u: AccessUser; lg?: boolean }) {
  const tone = USER_STATUS_TONE[u.status] ?? "neutral"
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-bold",
        lg ? "size-[46px] text-base" : "size-[34px] text-xs",
        AVATAR_TONE[tone] ?? "bg-primary/12 text-primary"
      )}
    >
      {u.initials}
    </span>
  )
}

/* ----------------------------------------------------------- timeline ---- */

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div>
      {events.map((e, i) => {
        const k = TL_KIND[e.kind] ?? {
          icon: "history",
          tone: "neutral" as const,
          label: e.kind,
        }
        const last = i === events.length - 1
        return (
          <div key={i} className="grid grid-cols-[28px_1fr] gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "z-10 grid size-7 shrink-0 place-items-center rounded-full [&>svg]:size-3",
                  TONE_BADGE[k.tone]
                )}
              >
                <AccessGlyph name={k.icon} />
              </span>
              {!last && (
                <span className="my-0.5 min-h-3.5 w-0.5 flex-1 bg-border" />
              )}
            </div>
            <div className="pb-4">
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="text-[13px] font-semibold">{k.label}</span>
                <span className="mono shrink-0 text-[11px] text-muted-foreground">
                  {e.when === "now" ? "Just now" : `${e.date} · ${e.when}`}
                </span>
              </div>
              {e.meta && (
                <div className="mt-[3px] inline-block rounded-md bg-muted/60 px-2 py-0.5 text-xs">
                  {e.meta}
                </div>
              )}
              <div className="mt-1 text-[11.5px] text-muted-foreground">
                by {e.by}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TONE_BADGE: Record<string, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}

/* ------------------------------------------------------- role-pick card -- */

function RolePick({
  roleId,
  on,
  onToggle,
  iconSize,
}: {
  roleId: string
  on: boolean
  onToggle: () => void
  iconSize?: number
}) {
  const r = roleById(roleId)
  if (!r) return null
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-[11px] rounded-[11px] border p-[10px_12px] transition-colors",
        on ? "border-primary/55 bg-primary/5" : "hover:border-primary/40"
      )}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={onToggle}
        className="hidden"
      />
      <RoleIcon color={r.color} size={iconSize ?? 30} iconSize={14} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
          {r.name}
          {r.system && <SysChip />}
        </div>
        <div className="text-[11.5px] text-muted-foreground">
          {rolePermCount(r)} of {PERM_TOTAL} permissions
        </div>
      </div>
      <CheckSquare on={on} />
    </label>
  )
}

/* ------------------------------------------------------- invite drawer --- */

function InviteDrawer({
  existing,
  onClose,
  onInvite,
}: {
  existing: AccessUser[]
  onClose: () => void
  onInvite: (p: { name: string; email: string; roles: string[] }) => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [roles, setRoles] = React.useState<Set<string>>(new Set())
  const [expiry, setExpiry] = React.useState("7 days")
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const dupe = existing.some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  )
  const valid = !!name.trim() && emailOk && !dupe && roles.size > 0
  const emailErr = !!email && (!emailOk || dupe)

  const toggle = (id: string) =>
    setRoles((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const sumPerms = new Set<string>()
  ;[...roles].forEach((id) => {
    const r = roleById(id)
    if (!r) return
    ;(r.perms.includes("*") ? ALL_PERMS : r.perms).forEach((p) =>
      sumPerms.add(p)
    )
  })

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: "100%", maxWidth: 540 }}
        className="gap-0 p-0"
      >
        <div className="flex items-start justify-between gap-3 border-b p-[18px]">
          <div className="flex items-center gap-[11px]">
            <span className="grid size-[34px] place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[18px]">
              <UserPlusIcon />
            </span>
            <div>
              <SheetTitle className="text-base font-bold">
                Invite user
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                Send a secure invitation to a Ginja staff member.
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button variant="outline" size="icon-sm">
              <XIcon />
            </Button>
          </SheetClose>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
          <Field label="Full name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kwame Mensah"
            />
          </Field>
          <Field
            label="Work email"
            required
            hint={
              email && !emailOk
                ? "Enter a valid email address."
                : dupe
                  ? "A user with this email already exists."
                  : undefined
            }
            hintTone="error"
          >
            <Input
              type="email"
              value={email}
              aria-invalid={emailErr}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@ginja.ai"
            />
          </Field>

          <div>
            <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Assign roles<span className="text-destructive">*</span>
            </div>
            <p className="mb-2.5 text-xs text-muted-foreground">
              A user can hold multiple roles — permissions are the union of all
              assigned roles.
            </p>
            <div className="flex flex-col gap-[7px]">
              {ACCESS_ROLES.map((r) => (
                <RolePick
                  key={r.id}
                  roleId={r.id}
                  on={roles.has(r.id)}
                  onToggle={() => toggle(r.id)}
                />
              ))}
            </div>
          </div>

          {roles.size > 0 && (
            <Note tone="info" icon={<ShieldIcon />}>
              This user will receive{" "}
              <b>
                {sumPerms.size} permission{sumPerms.size === 1 ? "" : "s"}
              </b>{" "}
              across {roles.size} role{roles.size === 1 ? "" : "s"}.
            </Note>
          )}

          <Field label="Invitation expires after">
            <ConsoleSelect
              className="max-w-[200px]"
              value={expiry}
              onChange={setExpiry}
              options={["3 days", "7 days", "14 days", "30 days"]}
            />
          </Field>
        </div>

        <div className="flex items-center gap-2 border-t p-3.5">
          <span className="flex-1 text-[11.5px] text-muted-foreground">
            An email with a secure setup link will be sent.
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onInvite({
                name: name.trim(),
                email: email.trim(),
                roles: [...roles],
              })
            }
          >
            <MailIcon data-icon="inline-start" />
            Send invitation
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------- user drawer ---- */

const SUB_TABS: [string, string][] = [
  ["overview", "Overview"],
  ["access", "Access"],
  ["timeline", "Activity timeline"],
]

function UserDrawer({
  u,
  canManage,
  onClose,
  onResend,
  onReactivate,
  onSetRoles,
  onModal,
}: {
  u: AccessUser
  canManage: boolean
  onClose: () => void
  onResend: (u: AccessUser) => void
  onReactivate: (u: AccessUser) => void
  onSetRoles: (
    u: AccessUser,
    roles: string[],
    ev: { kind: string; meta: string } | null
  ) => void
  onModal: (type: ModalType) => void
}) {
  const navigate = useNavigate()
  const [tab, setTab] = React.useState("overview")
  const [editRoles, setEditRoles] = React.useState(false)
  const [expandedRole, setExpandedRole] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Set<string>>(new Set(u.roles))
  const isInvited = u.status === "Invited"
  const isSuspended = u.status === "Suspended"

  const toggle = (id: string) =>
    setDraft((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const saveRoles = () => {
    const added = [...draft].filter((r) => !u.roles.includes(r))
    const removed = u.roles.filter((r) => !draft.has(r))
    let ev: { kind: string; meta: string } | null = null
    if (added.length)
      ev = {
        kind: "role_added",
        meta: added
          .map((r) => roleById(r)?.name)
          .filter(Boolean)
          .join(", "),
      }
    else if (removed.length)
      ev = {
        kind: "role_removed",
        meta: removed
          .map((r) => roleById(r)?.name)
          .filter(Boolean)
          .join(", "),
      }
    onSetRoles(u, [...draft], ev)
    setEditRoles(false)
  }

  const perms = new Set<string>()
  u.roles.forEach((id) => {
    const r = roleById(id)
    if (!r) return
    ;(r.perms.includes("*") ? ALL_PERMS : r.perms).forEach((p) => perms.add(p))
  })

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: "100%", maxWidth: 560 }}
        className="gap-0 p-0"
      >
        <div className="border-b p-[18px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-[13px]">
              <UserAvatar u={u} lg />
              <div>
                <SheetTitle className="text-[17px] font-bold">
                  {u.name}
                </SheetTitle>
                <SheetDescription className="mono mt-px text-xs">
                  {u.email}
                </SheetDescription>
                <div className="mt-[7px] flex items-center gap-[7px]">
                  <MiniBadge tone={USER_STATUS_TONE[u.status]}>
                    {u.status}
                  </MiniBadge>
                  {u.mfa && (
                    <Tagpill className="text-[10.5px]">
                      <ShieldIcon />
                      MFA on
                    </Tagpill>
                  )}
                  <span className="text-[11.5px] text-muted-foreground">
                    {u.id}
                  </span>
                </div>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="outline" size="icon-sm">
                <XIcon />
              </Button>
            </SheetClose>
          </div>
          <div className="mt-4 -mb-px flex gap-0.5 border-b-0">
            {SUB_TABS.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                  tab === k
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
          {isSuspended && (
            <Note tone="warn" icon={<PauseIcon />}>
              <b>Suspended.</b>{" "}
              {u.suspendReason ? `Reason: ${u.suspendReason}.` : ""} Sessions
              are revoked until reactivated.
            </Note>
          )}
          {isInvited && (
            <Note tone="info" icon={<MailIcon />}>
              <b>Invitation pending.</b> Sent {u.invitedAgo}, expires in{" "}
              {u.expiresIn}. Awaiting acceptance.
            </Note>
          )}

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <StatCard
                  icon={<ClockIcon />}
                  k="Last active"
                  v={u.lastActive === "—" ? "Never" : u.lastActive}
                />
                <StatCard
                  icon={<CalendarIcon />}
                  k="Member since"
                  v={u.joined === "—" ? "Pending" : u.joined}
                />
                <StatCard
                  icon={<ShieldCheckIcon />}
                  k="Two-factor"
                  v={u.mfa ? "Enabled" : "Not set up"}
                />
              </div>

              <div>
                <Eyebrow className="mb-2">Account details</Eyebrow>
                <div className="overflow-hidden rounded-xl border">
                  <DetailRow icon={<InfoIcon />} k="Account status">
                    <MiniBadge tone={USER_STATUS_TONE[u.status]}>
                      {u.inviteExpired ? "Expired" : u.status}
                    </MiniBadge>
                  </DetailRow>
                  <DetailRow icon={<MailIcon />} k="Email">
                    <span className="mono">{u.email}</span>
                  </DetailRow>
                  <DetailRow icon={<KeyRoundIcon />} k="User ID">
                    <span className="mono">{u.id}</span>
                  </DetailRow>
                  <DetailRow icon={<UserPlusIcon />} k="Invited / added by">
                    {u.addedBy}
                  </DetailRow>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Eyebrow>Roles &amp; access</Eyebrow>
                  <span className="text-[11.5px] text-muted-foreground">
                    {u.roles.length} {u.roles.length === 1 ? "role" : "roles"} ·{" "}
                    {perms.size}{" "}
                    {perms.size === 1 ? "permission" : "permissions"}
                  </span>
                </div>
                {u.roles.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">
                    No roles assigned — this user can sign in but see nothing.
                  </p>
                ) : (
                  <div className="flex flex-col gap-[9px]">
                    {u.roles.map((id) => {
                      const r = roleById(id)
                      if (!r) return null
                      const open = expandedRole === id
                      const rperms = r.perms.includes("*") ? ALL_PERMS : r.perms
                      return (
                        <div
                          key={id}
                          className={cn(
                            "overflow-hidden rounded-xl border bg-card",
                            open && "border-primary/40"
                          )}
                        >
                          <button
                            onClick={() => setExpandedRole(open ? null : id)}
                            className="flex w-full items-center gap-3 p-[13px_14px] text-left transition-colors hover:bg-muted/40"
                          >
                            <RoleIcon color={r.color} iconSize={15} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold">
                                {r.name}
                              </div>
                              <div className="text-[11.5px] text-muted-foreground">
                                {rolePermCount(r)} of {PERM_TOTAL} permissions
                              </div>
                            </div>
                            <ChevronDownIcon
                              className={cn(
                                "size-4 text-muted-foreground transition-transform",
                                open && "rotate-180"
                              )}
                            />
                          </button>
                          {open && (
                            <div className="border-t p-[12px_14px_14px]">
                              <div className="flex flex-wrap gap-1.5 pt-3">
                                {rperms.map((p) => (
                                  <span
                                    key={p}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-[3px] text-[11.5px] font-medium text-success [&>svg]:size-[11px]"
                                  >
                                    <CheckIcon />
                                    {permLabel(p)}
                                  </span>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  onClose()
                                  navigate(`/access-roles?edit=${r.id}`)
                                }}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-[7px] text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5 [&>svg]:size-[13px]"
                              >
                                Open role page
                                <ExternalLinkIcon />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "access" && (
            <>
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <Eyebrow>Assigned roles</Eyebrow>
                  {canManage && !editRoles && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDraft(new Set(u.roles))
                        setEditRoles(true)
                      }}
                    >
                      <PencilIcon data-icon="inline-start" />
                      Edit roles
                    </Button>
                  )}
                </div>
                {!editRoles ? (
                  <div className="flex flex-col gap-[7px]">
                    {u.roles.map((id) => {
                      const r = roleById(id)
                      if (!r) return null
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2.5 rounded-[10px] border p-[8px_11px]"
                        >
                          <RoleIcon color={r.color} size={28} iconSize={13} />
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {rolePermCount(r)} of {PERM_TOTAL} permissions
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {u.roles.length === 0 && (
                      <p className="text-[12.5px] text-muted-foreground">
                        No roles assigned — this user can sign in but see
                        nothing.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-[7px]">
                      {ACCESS_ROLES.map((r) => (
                        <RolePick
                          key={r.id}
                          roleId={r.id}
                          on={draft.has(r.id)}
                          onToggle={() => toggle(r.id)}
                          iconSize={28}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditRoles(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveRoles}>
                        <CheckIcon data-icon="inline-start" />
                        Save roles
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {!editRoles && (
                <div>
                  <Eyebrow className="mb-2">
                    Effective permissions{" "}
                    <span className="font-normal tracking-normal normal-case">
                      · union of all roles
                    </span>
                  </Eyebrow>
                  <div className="flex flex-wrap gap-1.5">
                    {[...perms].map((p) => (
                      <Tagpill key={p} className="text-[11px]">
                        <CheckIcon className="size-2.5" />
                        {permLabel(p)}
                      </Tagpill>
                    ))}
                    {perms.size === 0 && (
                      <span className="text-[12.5px] text-muted-foreground">
                        None
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "timeline" && <Timeline events={u.timeline} />}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2 border-t p-3.5">
            {isInvited ? (
              <>
                <Button variant="outline" size="sm" onClick={() => onResend(u)}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Resend invite
                </Button>
                <span className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onModal("revoke")}
                >
                  <BanIcon data-icon="inline-start" />
                  Revoke invite
                </Button>
              </>
            ) : isSuspended ? (
              <>
                <Button size="sm" onClick={() => onReactivate(u)}>
                  <PlayIcon data-icon="inline-start" />
                  Reactivate
                </Button>
                <span className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onModal("delete")}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete user
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onModal("suspend")}
                >
                  <PauseIcon data-icon="inline-start" />
                  Suspend
                </Button>
                <span className="flex-1" />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onModal("delete")}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete user
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Eyebrow({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </div>
  )
}

function StatCard({
  icon,
  k,
  v,
}: {
  icon: React.ReactNode
  k: string
  v: string
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <span className="mb-3 grid size-[30px] place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[15px]">
        {icon}
      </span>
      <div className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {k}
      </div>
      <div className="mt-px text-[15px] font-bold">{v}</div>
    </div>
  )
}

function DetailRow({
  icon,
  k,
  children,
}: {
  icon: React.ReactNode
  k: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-[11px] border-b p-[13px_15px] last:border-0 [&>svg]:size-[15px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <span className="text-[13px] text-muted-foreground">{k}</span>
      <span className="ml-auto text-right text-[13px] font-semibold">
        {children}
      </span>
    </div>
  )
}

/* ============================================================ users page === */

export function AccessUsersPage() {
  const { user, hasPermission } = useAccess()
  const canManage = hasPermission("access-users")
  const actor = user.fullName || "You"

  const [users, setUsers] = React.useState<AccessUser[]>(ACCESS_USERS)
  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState("All")
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [invite, setInvite] = React.useState(false)
  const [modal, setModal] = React.useState<{
    type: ModalType
    user: AccessUser
  } | null>(null)

  const counts: Record<string, number> = { All: users.length }
  ;["Active", "Invited", "Suspended"].forEach(
    (s) => (counts[s] = users.filter((u) => u.status === s).length)
  )
  const list = users.filter(
    (u) =>
      (filter === "All" || u.status === filter) &&
      (u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()))
  )
  const open = openId ? users.find((u) => u.id === openId) : null

  /* --- mutations (optimistic; also push an audit toast) --- */
  const patch = (id: string, fn: (u: AccessUser) => AccessUser) =>
    setUsers((us) => us.map((u) => (u.id === id ? fn(u) : u)))
  const addEvent = (
    u: AccessUser,
    kind: string,
    meta?: string
  ): AccessUser => ({
    ...u,
    timeline: [
      { kind, when: "now", date: "Today", by: actor, meta },
      ...u.timeline,
    ],
  })

  const doInvite = (payload: {
    name: string
    email: string
    roles: string[]
  }) => {
    const u: AccessUser = {
      id: "USR-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      name: payload.name,
      email: payload.email,
      initials: payload.name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      status: "Invited",
      roles: payload.roles,
      lastActive: "—",
      addedBy: actor,
      joined: "—",
      mfa: false,
      invitedAgo: "just now",
      expiresIn: "7 days",
      timeline: [
        {
          kind: "invited",
          when: "now",
          date: "Today",
          by: actor,
          meta: payload.roles
            .map((r) => roleById(r)?.name)
            .filter(Boolean)
            .join(", "),
        },
      ],
    }
    setUsers((us) => [u, ...us])
    toast.success(`Invitation sent to ${payload.email}.`)
    setInvite(false)
  }
  const resend = (u: AccessUser) => {
    patch(u.id, (x) => ({
      ...addEvent(x, "resent"),
      invitedAgo: "just now",
      expiresIn: "7 days",
    }))
    toast.success(`Invitation resent to ${u.email}.`)
  }
  const revoke = (u: AccessUser) => {
    setUsers((us) => us.filter((x) => x.id !== u.id))
    toast.success(`Invitation to ${u.email} revoked.`)
    setModal(null)
    setOpenId(null)
  }
  const suspend = (u: AccessUser, reason: string) => {
    patch(u.id, (x) => ({
      ...addEvent(x, "suspended", reason),
      status: "Suspended",
      suspendReason: reason,
    }))
    toast.success(`${u.name} suspended.`)
    setModal(null)
  }
  const reactivate = (u: AccessUser) => {
    patch(u.id, (x) => ({
      ...addEvent(x, "reactivated"),
      status: "Active",
      suspendReason: null,
    }))
    toast.success(`${u.name} reactivated.`)
  }
  const remove = (u: AccessUser) => {
    setUsers((us) => us.filter((x) => x.id !== u.id))
    toast.success(`${u.name} deleted.`)
    setModal(null)
    setOpenId(null)
  }
  const setRoles = (
    u: AccessUser,
    roles: string[],
    ev: { kind: string; meta: string } | null
  ) =>
    patch(u.id, (x) => {
      let nx: AccessUser = { ...x, roles }
      if (ev) nx = addEvent(nx, ev.kind, ev.meta)
      return nx
    })

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={["Access & security", "Users"]}
        title="Users"
        sub="Invite internal Ginja staff, assign them roles, and manage their access lifecycle."
        actions={
          canManage && (
            <Button onClick={() => setInvite(true)}>
              <UserPlusIcon data-icon="inline-start" />
              Invite user
            </Button>
          )
        }
      />

      <AccessTabs active="users" />

      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="max-w-xs flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
          />
        </InputGroup>
        <div className="inline-flex gap-[3px] rounded-[9px] bg-muted p-[3px]">
          {["All", "Active", "Invited", "Suspended"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "inline-flex h-[30px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-semibold transition-colors",
                filter === s
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
              <span
                className={cn(
                  "mono rounded-full px-1.5 py-px text-[10.5px] font-semibold",
                  filter === s
                    ? "bg-primary/14 text-primary"
                    : "bg-border text-muted-foreground"
                )}
              >
                {counts[s] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden">
        <Table>
          <TableHeader className={hifiTableHead}>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((u) => (
              <TableRow
                key={u.id}
                onClick={() => setOpenId(u.id)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <UserAvatar u={u} />
                    <div>
                      <div className="text-[13px] font-semibold">{u.name}</div>
                      <div className="mono text-[11.5px] text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {u.roles.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        No roles
                      </span>
                    ) : (
                      <>
                        {u.roles.slice(0, 2).map((r) => (
                          <RoleBadge key={r} role={roleById(r)} size="sm" />
                        ))}
                        {u.roles.length > 2 && (
                          <span
                            title={u.roles
                              .slice(2)
                              .map((r) => roleById(r)?.name)
                              .filter(Boolean)
                              .join(", ")}
                            className="shrink-0 rounded-full border bg-muted px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap text-muted-foreground"
                          >
                            +{u.roles.length - 2} more
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {u.status === "Invited" && u.inviteExpired ? (
                    <div className="flex flex-col items-start gap-[3px]">
                      <MiniBadge tone="error">Expired</MiniBadge>
                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            resend(u)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary [&>svg]:size-[11px]"
                        >
                          <RotateCcwIcon />
                          Resend invitation
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <MiniBadge tone={USER_STATUS_TONE[u.status]}>
                        {u.status}
                      </MiniBadge>
                      {u.status === "Invited" && (
                        <div className="mt-[3px] text-[10.5px] text-muted-foreground">
                          expires in {u.expiresIn}
                        </div>
                      )}
                    </>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.lastActive}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {u.addedBy}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenId(u.id)
                    }}
                  >
                    <ChevronRightIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {list.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
          <UsersIcon className="size-[22px]" />
          <p className="text-[13px]">No users match your filter.</p>
        </div>
      )}

      {invite && (
        <InviteDrawer
          existing={users}
          onClose={() => setInvite(false)}
          onInvite={doInvite}
        />
      )}

      {open && (
        <UserDrawer
          u={open}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onResend={resend}
          onReactivate={reactivate}
          onSetRoles={setRoles}
          onModal={(type) => setModal({ type, user: open })}
        />
      )}

      {modal?.type === "suspend" && (
        <ConfirmDialog
          icon={<PauseIcon />}
          tone="warn"
          title={`Suspend ${modal.user.name}?`}
          confirmLabel="Suspend user"
          reasonRequired
          reasonLabel="Reason for suspension"
          onConfirm={(r) => suspend(modal.user, r)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                The user is signed out of all sessions immediately and cannot
                sign back in until reactivated. Their roles and history are
                preserved.
              </p>
              <ImpactBox tone="warn" heading="What happens">
                <li>
                  All active sessions end and API tokens stop working at once.
                </li>
                <li>
                  {modal.user.roles.length} role(s) and the full timeline are
                  retained for reactivation.
                </li>
                <li>
                  Any onboarding sections owned by this user keep their
                  assignment but stall until reassigned.
                </li>
              </ImpactBox>
            </>
          }
        />
      )}

      {modal?.type === "revoke" && (
        <ConfirmDialog
          icon={<BanIcon />}
          tone="danger"
          title="Revoke invitation?"
          confirmLabel="Revoke invitation"
          onConfirm={() => revoke(modal.user)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                The pending invitation to <b>{modal.user.email}</b> is
                cancelled. The secure link stops working immediately.
              </p>
              <ImpactBox tone="warn" heading="What happens">
                <li>
                  The invite link is invalidated — the recipient can no longer
                  accept.
                </li>
                <li>
                  The user record is removed. You can re-invite them later.
                </li>
                <li>Recorded in the audit log.</li>
              </ImpactBox>
            </>
          }
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          icon={<Trash2Icon />}
          tone="danger"
          title={`Delete ${modal.user.name}?`}
          confirmLabel="Delete user"
          confirmWord={modal.user.name}
          reasonRequired
          reasonLabel="Reason for deletion"
          onConfirm={() => remove(modal.user)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                <b>This is permanent.</b> The user and their access are removed
                from the platform. For compliance, their audit-log entries are
                retained but anonymised links remain.
              </p>
              <ImpactBox tone="danger" heading="Downstream impact">
                <li>
                  All {modal.user.roles.length} role assignment(s) and active
                  sessions are removed immediately.
                </li>
                <li>
                  Any onboarding sections owned by this user become{" "}
                  <b>unassigned</b> and must be reassigned.
                </li>
                <li>
                  Maker-checker requests submitted by this user remain valid and
                  attributed.
                </li>
                <li>
                  Prefer <b>Suspend</b> if access may be needed again — deletion
                  cannot be undone.
                </li>
              </ImpactBox>
            </>
          }
        />
      )}
    </div>
  )
}
