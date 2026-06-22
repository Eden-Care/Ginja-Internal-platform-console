import * as React from "react"
import { useNavigate } from "react-router-dom"
import { format, formatDistanceToNow } from "date-fns"
import {
  BanIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  HistoryIcon,
  InfoIcon,
  KeyRoundIcon,
  LayersIcon,
  MailIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  TriangleAlertIcon,
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
import { LoadingSpinner } from "@/components/common/loading"
import { useAccess } from "@/contexts/access-context"
import { useMember, useMembers } from "@/features/access/use-members"
import { useRoles } from "@/features/access/use-roles"
import {
  useDeleteMember,
  useInviteMember,
  useResendInvite,
  useRevokeInvite,
  useSetMemberStatus,
  useUpdateMemberRoles,
} from "@/features/access/use-member-mutations"
import type { Member, MemberStatus, Role } from "@/features/access/types"
import {
  AccessTabs,
  CheckSquare,
  ConfirmDialog,
  ImpactBox,
  RoleIcon,
  SysChip,
  roleDotStyle,
} from "./access-shared"

type ModalType = "suspend" | "revoke" | "delete"

/* The API stores no role colour — derive a stable tint from a string key. */
const PALETTE_KEYS = ["iris", "emerald", "amber", "sky", "rose", "violet"]
function paletteFor(key: string, system = false): string {
  if (system) return "iris"
  let h = 0
  for (const ch of key) h += ch.charCodeAt(0)
  return PALETTE_KEYS[h % PALETTE_KEYS.length]
}

const STATUS_TONE: Record<MemberStatus, "success" | "info" | "warning" | "error"> =
  { ACTIVE: "success", INVITED: "info", SUSPENDED: "warning", DISABLED: "error" }
const STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "Active",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
}
const AVATAR_TONE: Record<string, string> = {
  success: "bg-primary/12 text-primary",
  info: "bg-info/15 text-info-subtle-foreground",
  warning: "bg-warning/18 text-warning-subtle-foreground",
  error: "bg-destructive/15 text-destructive",
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

const fmtLastActive = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "Never"
const fmtSince = (iso: string | null) =>
  iso ? format(new Date(iso), "dd MMM yyyy") : "—"

/** Muted, dashed pill marking a UI element the backend doesn't power yet. */
function PendingBadge({ children = "Not available yet" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed bg-muted/50 px-2 py-[2px] text-[10.5px] font-medium text-muted-foreground [&>svg]:size-2.5">
      <ClockIcon />
      {children}
    </span>
  )
}

/* ------------------------------------------------------------- atoms ----- */

function MemberAvatar({ m, lg }: { m: Member; lg?: boolean }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-bold",
        lg ? "size-[46px] text-base" : "size-[34px] text-xs",
        AVATAR_TONE[STATUS_TONE[m.status]] ?? "bg-primary/12 text-primary"
      )}
    >
      {initialsOf(m.name)}
    </span>
  )
}

/** Small role pill with a coloured dot + name. */
function RoleChip({ name, size }: { name: string; size?: "sm" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[150px] items-center gap-1.5 overflow-hidden rounded-full border bg-muted py-[3px] pr-[9px] pl-2 font-semibold whitespace-nowrap",
        size === "sm" ? "text-[10.5px]" : "text-[11.5px]"
      )}
    >
      <i
        className="size-[7px] shrink-0 rounded-full"
        style={roleDotStyle(paletteFor(name))}
      />
      <span className="truncate">{name}</span>
    </span>
  )
}

/* ------------------------------------------------------- role-pick card -- */

function RolePick({
  role,
  on,
  onToggle,
  iconSize,
}: {
  role: Role
  on: boolean
  onToggle: () => void
  iconSize?: number
}) {
  const count = role.functionalities.length
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-[11px] rounded-[11px] border p-[10px_12px] transition-colors",
        on ? "border-primary/55 bg-primary/5" : "hover:border-primary/40"
      )}
    >
      <input type="checkbox" checked={on} onChange={onToggle} className="hidden" />
      <RoleIcon color={paletteFor(role.code, role.system)} size={iconSize ?? 30} iconSize={14} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
          {role.name}
          {role.system && <SysChip />}
        </div>
        <div className="text-[11.5px] text-muted-foreground">
          {count} {count === 1 ? "module" : "modules"}
        </div>
      </div>
      <CheckSquare on={on} />
    </label>
  )
}

/* ------------------------------------------------------- invite drawer --- */

function InviteDrawer({
  existing,
  roles,
  saving,
  onClose,
  onInvite,
}: {
  existing: Member[]
  roles: Role[]
  saving: boolean
  onClose: () => void
  onInvite: (p: { name: string; email: string; roleIds: number[]; expiryDays: number }) => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [picked, setPicked] = React.useState<Set<number>>(new Set())
  const [expiry, setExpiry] = React.useState("7 days")
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const dupe = existing.some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  )
  const valid = !!name.trim() && emailOk && !dupe && picked.size > 0
  const emailErr = !!email && (!emailOk || dupe)

  const toggle = (id: number) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const moduleUnion = new Set<string>()
  roles
    .filter((r) => picked.has(r.id))
    .forEach((r) => r.functionalityCodes.forEach((c) => moduleUnion.add(c)))

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
              <SheetTitle className="text-base font-bold">Invite user</SheetTitle>
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
              A user can hold multiple roles — module access is the union of all
              assigned roles.
            </p>
            <div className="flex flex-col gap-[7px]">
              {roles.map((r) => (
                <RolePick
                  key={r.id}
                  role={r}
                  on={picked.has(r.id)}
                  onToggle={() => toggle(r.id)}
                />
              ))}
            </div>
          </div>

          {picked.size > 0 && (
            <Note tone="info" icon={<LayersIcon />}>
              This user will receive{" "}
              <b>
                {moduleUnion.size} module{moduleUnion.size === 1 ? "" : "s"}
              </b>{" "}
              across {picked.size} role{picked.size === 1 ? "" : "s"}.
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
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            disabled={!valid || saving}
            onClick={() =>
              onInvite({
                name: name.trim(),
                email: email.trim(),
                roleIds: [...picked],
                expiryDays: parseInt(expiry, 10) || 7,
              })
            }
          >
            <MailIcon data-icon="inline-start" />
            {saving ? "Sending…" : "Send invitation"}
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
  ["activity", "Activity timeline"],
]

function UserDrawer({
  m,
  roles,
  rolesById,
  canManage,
  busy,
  onClose,
  onResend,
  onReactivate,
  onSetRoles,
  onModal,
}: {
  m: Member
  roles: Role[]
  rolesById: Map<number, Role>
  canManage: boolean
  busy: boolean
  onClose: () => void
  onResend: (m: Member) => void
  onReactivate: (m: Member) => void
  onSetRoles: (m: Member, roleIds: number[]) => void
  onModal: (type: ModalType) => void
}) {
  const navigate = useNavigate()
  const [tab, setTab] = React.useState("overview")
  const [editRoles, setEditRoles] = React.useState(false)
  const [expandedRole, setExpandedRole] = React.useState<number | null>(null)
  const [draft, setDraft] = React.useState<Set<number>>(new Set(m.roleIds))
  const isInvited = m.status === "INVITED"
  const isSuspended = m.status === "SUSPENDED"

  const toggle = (id: number) =>
    setDraft((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // Effective modules = union of the modules granted by the member's roles.
  const modules = new Set<string>()
  m.roleIds.forEach((id) =>
    rolesById.get(id)?.functionalityCodes.forEach((c) => modules.add(c))
  )

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
              <MemberAvatar m={m} lg />
              <div>
                <SheetTitle className="text-[17px] font-bold">{m.name}</SheetTitle>
                <SheetDescription className="mono mt-px text-xs">
                  {m.email}
                </SheetDescription>
                <div className="mt-[7px] flex items-center gap-[7px]">
                  <MiniBadge tone={STATUS_TONE[m.status]}>
                    {STATUS_LABEL[m.status]}
                  </MiniBadge>
                  <span className="text-[11.5px] text-muted-foreground">
                    {m.code}
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
          <div className="mt-4 -mb-px flex gap-0.5">
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
              <b>Suspended.</b> Sessions are revoked until reactivated.
            </Note>
          )}
          {isInvited && (
            <Note tone="info" icon={<MailIcon />}>
              <b>Invitation pending.</b> Awaiting acceptance of the setup link.
              <span className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <ClockIcon className="size-3 shrink-0" />
                Expiry countdown isn’t shown — the API doesn’t return invite
                expiry yet.
              </span>
            </Note>
          )}

          {tab === "overview" && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <StatCard
                  icon={<ClockIcon />}
                  k="Last active"
                  v={fmtLastActive(m.lastActive)}
                />
                <StatCard
                  icon={<CalendarIcon />}
                  k="Member since"
                  v={fmtSince(m.memberSince)}
                />
                <StatCard
                  icon={<ShieldCheckIcon />}
                  k="Two-factor"
                  v={<PendingBadge>Pending backend</PendingBadge>}
                />
              </div>

              <div>
                <Eyebrow className="mb-2">Account details</Eyebrow>
                <div className="overflow-hidden rounded-xl border">
                  <DetailRow icon={<InfoIcon />} k="Account status">
                    <MiniBadge tone={STATUS_TONE[m.status]}>
                      {STATUS_LABEL[m.status]}
                    </MiniBadge>
                  </DetailRow>
                  <DetailRow icon={<MailIcon />} k="Email">
                    <span className="mono">{m.email}</span>
                  </DetailRow>
                  <DetailRow icon={<KeyRoundIcon />} k="User ID">
                    <span className="mono">{m.code}</span>
                  </DetailRow>
                  <DetailRow icon={<UserPlusIcon />} k="Invited / added by">
                    {m.invitedBy ?? "—"}
                  </DetailRow>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <Eyebrow>Roles &amp; access</Eyebrow>
                  <span className="text-[11.5px] text-muted-foreground">
                    {m.roles.length} {m.roles.length === 1 ? "role" : "roles"} ·{" "}
                    {modules.size} {modules.size === 1 ? "module" : "modules"}
                  </span>
                </div>
                {m.roles.length === 0 ? (
                  <p className="text-[12.5px] text-muted-foreground">
                    No roles assigned — this user can sign in but see nothing.
                  </p>
                ) : (
                  <div className="flex flex-col gap-[9px]">
                    {m.roles.map((ref) => {
                      const r = rolesById.get(ref.id)
                      const open = expandedRole === ref.id
                      const mods = r?.functionalities ?? []
                      return (
                        <div
                          key={ref.id}
                          className={cn(
                            "overflow-hidden rounded-xl border bg-card",
                            open && "border-primary/40"
                          )}
                        >
                          <button
                            onClick={() => setExpandedRole(open ? null : ref.id)}
                            className="flex w-full items-center gap-3 p-[13px_14px] text-left transition-colors hover:bg-muted/40"
                          >
                            <RoleIcon
                              color={paletteFor(r?.code ?? ref.name, r?.system)}
                              iconSize={15}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold">{ref.name}</div>
                              <div className="text-[11.5px] text-muted-foreground">
                                {mods.length} {mods.length === 1 ? "module" : "modules"}
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
                                {mods.length === 0 ? (
                                  <span className="text-[12px] text-muted-foreground">
                                    No modules granted.
                                  </span>
                                ) : (
                                  mods.map((f) => (
                                    <span
                                      key={f.code}
                                      className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-[3px] text-[11.5px] font-medium text-success [&>svg]:size-[11px]"
                                    >
                                      <CheckIcon />
                                      {f.name}
                                    </span>
                                  ))
                                )}
                              </div>
                              {r && (
                                <button
                                  onClick={() => {
                                    onClose()
                                    navigate(`/access-roles?edit=${r.code}`)
                                  }}
                                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-[7px] text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5 [&>svg]:size-[13px]"
                                >
                                  Open role page
                                  <ExternalLinkIcon />
                                </button>
                              )}
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
                        setDraft(new Set(m.roleIds))
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
                    {m.roles.map((ref) => {
                      const r = rolesById.get(ref.id)
                      const count = r?.functionalities.length ?? 0
                      return (
                        <div
                          key={ref.id}
                          className="flex items-center gap-2.5 rounded-[10px] border p-[8px_11px]"
                        >
                          <RoleIcon
                            color={paletteFor(r?.code ?? ref.name, r?.system)}
                            size={28}
                            iconSize={13}
                          />
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold">{ref.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {count} {count === 1 ? "module" : "modules"}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {m.roles.length === 0 && (
                      <p className="text-[12.5px] text-muted-foreground">
                        No roles assigned — this user can sign in but see nothing.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-[7px]">
                      {roles.map((r) => (
                        <RolePick
                          key={r.id}
                          role={r}
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
                        disabled={busy}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          onSetRoles(m, [...draft])
                          setEditRoles(false)
                        }}
                      >
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
                    Effective modules{" "}
                    <span className="font-normal tracking-normal normal-case">
                      · union of all roles
                    </span>
                  </Eyebrow>
                  <div className="flex flex-wrap gap-1.5">
                    {[...modules].map((c) => (
                      <Tagpill key={c} className="text-[11px]">
                        <CheckIcon className="size-2.5" />
                        {c}
                      </Tagpill>
                    ))}
                    {modules.size === 0 && (
                      <span className="text-[12.5px] text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "activity" && (
            <div className="flex flex-col items-center gap-3 rounded-[14px] border border-dashed bg-muted/30 px-6 py-12 text-center">
              <span className="grid size-[42px] place-items-center rounded-full bg-muted text-muted-foreground [&>svg]:size-5">
                <HistoryIcon />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold">
                  Per-member activity timeline
                </p>
                <p className="mx-auto mt-1 max-w-[340px] text-[12.5px] text-muted-foreground">
                  A per-member history feed isn’t available from the API yet. In the
                  meantime, the platform-wide <b>Audit log</b> records every action
                  with its actor and target.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose()
                  navigate("/audit-log")
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-card px-3 py-[7px] text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5 [&>svg]:size-[13px]"
              >
                Open audit log
                <ExternalLinkIcon />
              </button>
              <PendingBadge>Pending backend — per-member activity endpoint</PendingBadge>
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2 border-t p-3.5">
            {isInvited ? (
              <>
                <Button variant="outline" size="sm" onClick={() => onResend(m)} disabled={busy}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Resend invite
                </Button>
                <span className="flex-1" />
                <Button variant="destructive" size="sm" onClick={() => onModal("revoke")}>
                  <BanIcon data-icon="inline-start" />
                  Revoke invite
                </Button>
              </>
            ) : isSuspended ? (
              <>
                <Button size="sm" onClick={() => onReactivate(m)} disabled={busy}>
                  <PlayIcon data-icon="inline-start" />
                  Reactivate
                </Button>
                <span className="flex-1" />
                <Button variant="destructive" size="sm" onClick={() => onModal("delete")}>
                  <Trash2Icon data-icon="inline-start" />
                  Delete user
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => onModal("suspend")}>
                  <PauseIcon data-icon="inline-start" />
                  Suspend
                </Button>
                <span className="flex-1" />
                <Button variant="destructive" size="sm" onClick={() => onModal("delete")}>
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
  v: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <span className="mb-3 grid size-[30px] place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[15px]">
        {icon}
      </span>
      <div className="text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {k}
      </div>
      <div className="mt-1 text-[15px] font-bold">{v}</div>
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
      <span className="ml-auto text-right text-[13px] font-semibold">{children}</span>
    </div>
  )
}

/* ============================================================ users page === */

const FILTER_TABS: { label: string; status: MemberStatus | "All" }[] = [
  { label: "All", status: "All" },
  { label: "Active", status: "ACTIVE" },
  { label: "Invited", status: "INVITED" },
  { label: "Suspended", status: "SUSPENDED" },
]

export function AccessUsersPage() {
  const { hasPermission } = useAccess()
  const canManage = hasPermission("access-users")

  const membersQuery = useMembers({})
  const rolesQuery = useRoles()
  const members = React.useMemo(() => membersQuery.data?.items ?? [], [membersQuery.data])
  const roles = React.useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const rolesById = React.useMemo(
    () => new Map(roles.map((r) => [r.id, r])),
    [roles]
  )

  const inviteMut = useInviteMember()
  const statusMut = useSetMemberStatus()
  const rolesMut = useUpdateMemberRoles()
  const resendMut = useResendInvite()
  const revokeMut = useRevokeInvite()
  const deleteMut = useDeleteMember()
  const busy = statusMut.isPending || rolesMut.isPending || resendMut.isPending

  const [q, setQ] = React.useState("")
  const [filter, setFilter] = React.useState<MemberStatus | "All">("All")
  const [openId, setOpenId] = React.useState<number | null>(null)
  const [invite, setInvite] = React.useState(false)
  const [modal, setModal] = React.useState<{ type: ModalType; member: Member } | null>(null)

  // Opening a row fetches that member's full detail from GET /members/{id};
  // the already-loaded list row seeds the drawer while the request is in flight.
  const detailQuery = useMember(openId)

  const counts: Record<string, number> = { All: members.length }
  ;(["ACTIVE", "INVITED", "SUSPENDED"] as MemberStatus[]).forEach(
    (s) => (counts[s] = members.filter((m) => m.status === s).length)
  )
  const list = members.filter(
    (m) =>
      (filter === "All" || m.status === filter) &&
      (m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.email.toLowerCase().includes(q.toLowerCase()))
  )
  const open =
    openId == null
      ? null
      : detailQuery.data ?? members.find((m) => m.id === openId) ?? null

  const errToast = (e: unknown, fallback: string) =>
    toast.error(e instanceof Error ? e.message : fallback)

  const doInvite = (p: { name: string; email: string; roleIds: number[]; expiryDays: number }) =>
    inviteMut.mutate(p, {
      onSuccess: () => {
        toast.success(`Invitation sent to ${p.email}.`)
        setInvite(false)
      },
      onError: (e) => errToast(e, "Could not send the invitation."),
    })

  const resend = (m: Member) =>
    resendMut.mutate(m.id, {
      onSuccess: () => toast.success(`Invitation resent to ${m.email}.`),
      onError: (e) => errToast(e, "Could not resend the invite."),
    })

  const revoke = (m: Member) =>
    revokeMut.mutate(m.id, {
      onSuccess: () => {
        toast.success(`Invitation to ${m.email} revoked.`)
        setModal(null)
        setOpenId(null)
      },
      onError: (e) => errToast(e, "Could not revoke the invite."),
    })

  const suspend = (m: Member, reason: string) =>
    statusMut.mutate(
      { id: m.id, status: "SUSPENDED", reason },
      {
        onSuccess: () => {
          toast.success(`${m.name} suspended.`)
          setModal(null)
        },
        onError: (e) => errToast(e, "Could not suspend the user."),
      }
    )

  const reactivate = (m: Member) =>
    statusMut.mutate(
      { id: m.id, status: "ACTIVE" },
      {
        onSuccess: () => toast.success(`${m.name} reactivated.`),
        onError: (e) => errToast(e, "Could not reactivate the user."),
      }
    )

  const remove = (m: Member) =>
    deleteMut.mutate(m.id, {
      onSuccess: () => {
        toast.success(`${m.name} deleted.`)
        setModal(null)
        setOpenId(null)
      },
      onError: (e) => errToast(e, "Could not delete the user."),
    })

  const setRoles = (m: Member, roleIds: number[]) =>
    rolesMut.mutate(
      { member: m, roleIds },
      {
        onSuccess: () => toast.success(`Roles updated for ${m.name}.`),
        onError: (e) => errToast(e, "Could not update roles."),
      }
    )

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
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

      {membersQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : membersQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load users.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => membersQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <>
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
              {FILTER_TABS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setFilter(t.status)}
                  className={cn(
                    "inline-flex h-[30px] items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-semibold transition-colors",
                    filter === t.status
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "mono rounded-full px-1.5 py-px text-[10.5px] font-semibold",
                      filter === t.status
                        ? "bg-primary/14 text-primary"
                        : "bg-border text-muted-foreground"
                    )}
                  >
                    {counts[t.status] || 0}
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
                {list.map((m) => (
                  <TableRow
                    key={m.id}
                    onClick={() => setOpenId(m.id)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-[11px]">
                        <MemberAvatar m={m} />
                        <div>
                          <div className="text-[13px] font-semibold">{m.name}</div>
                          <div className="mono text-[11.5px] text-muted-foreground">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {m.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        ) : (
                          <>
                            {m.roles.slice(0, 2).map((r) => (
                              <RoleChip key={r.id} name={r.name} size="sm" />
                            ))}
                            {m.roles.length > 2 && (
                              <span
                                title={m.roles.slice(2).map((r) => r.name).join(", ")}
                                className="shrink-0 rounded-full border bg-muted px-2 py-[3px] text-[10.5px] font-semibold whitespace-nowrap text-muted-foreground"
                              >
                                +{m.roles.length - 2} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <MiniBadge tone={STATUS_TONE[m.status]}>
                        {STATUS_LABEL[m.status]}
                      </MiniBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtLastActive(m.lastActive)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.invitedBy ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenId(m.id)
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
        </>
      )}

      {invite && (
        <InviteDrawer
          existing={members}
          roles={roles}
          saving={inviteMut.isPending}
          onClose={() => setInvite(false)}
          onInvite={doInvite}
        />
      )}

      {open && (
        <UserDrawer
          m={open}
          roles={roles}
          rolesById={rolesById}
          canManage={canManage}
          busy={busy}
          onClose={() => setOpenId(null)}
          onResend={resend}
          onReactivate={reactivate}
          onSetRoles={setRoles}
          onModal={(type) => setModal({ type, member: open })}
        />
      )}

      {modal?.type === "suspend" && (
        <ConfirmDialog
          icon={<PauseIcon />}
          tone="warn"
          title={`Suspend ${modal.member.name}?`}
          confirmLabel="Suspend user"
          reasonRequired
          reasonLabel="Reason for suspension"
          onConfirm={(r) => suspend(modal.member, r)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                The user is signed out of all sessions immediately and cannot sign
                back in until reactivated. Their roles are preserved.
              </p>
              <ImpactBox tone="warn" heading="What happens">
                <li>All active sessions end and API tokens stop working at once.</li>
                <li>{modal.member.roles.length} role(s) are retained for reactivation.</li>
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
          onConfirm={() => revoke(modal.member)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                The pending invitation to <b>{modal.member.email}</b> is cancelled.
                The secure link stops working immediately.
              </p>
              <ImpactBox tone="warn" heading="What happens">
                <li>The invite link is invalidated — the recipient can no longer accept.</li>
                <li>The user record is removed. You can re-invite them later.</li>
              </ImpactBox>
            </>
          }
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          icon={<Trash2Icon />}
          tone="danger"
          title={`Delete ${modal.member.name}?`}
          confirmLabel="Delete user"
          confirmWord={modal.member.name}
          onConfirm={() => remove(modal.member)}
          onCancel={() => setModal(null)}
          body={
            <>
              <p>
                <b>This is permanent.</b> The user and their access are removed from
                the platform.
              </p>
              <ImpactBox tone="danger" heading="Downstream impact">
                <li>
                  All {modal.member.roles.length} role assignment(s) and active
                  sessions are removed immediately.
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
