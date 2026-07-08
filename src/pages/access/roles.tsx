import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  CopyIcon,
  InfoIcon,
  KeyRoundIcon,
  LayersIcon,
  Loader2Icon,
  PaletteIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { Field } from "@/components/console/form-atoms"
import { LoadingSpinner } from "@/components/common/loading"
import { useAccess } from "@/contexts/access-context"
import { useRoles } from "@/features/access/use-roles"
import { usePermissions } from "@/features/access/use-permissions"
import { useCreateRole } from "@/features/access/use-create-role"
import { useUpdateRole } from "@/features/access/use-update-role"
import { useDeleteRole } from "@/features/access/use-delete-role"
import {
  groupPermissions,
  type Permission,
  type Role,
} from "@/features/access/types"
import {
  AccessGlyph,
  AccessTabs,
  CheckSquare,
  ConfirmDialog,
  RoleIcon,
  SysChip,
  useEditParam,
} from "./access-shared"

/* A role badge tint: the backend's real `hex_color` when present, otherwise a
   stable palette key derived from the role code (presentation only). */
const PALETTE_KEYS = ["iris", "emerald", "amber", "sky", "rose", "violet"]
function roleColor(role: Role): string {
  if (role.hexColor) return role.hexColor
  if (role.system) return "iris"
  let h = 0
  for (const ch of role.code) h += ch.charCodeAt(0)
  return PALETTE_KEYS[h % PALETTE_KEYS.length]
}

/* The API carries no per-group icon, so map known capability groups to a glyph
   (presentation only; unknown groups fall back to a generic one). */
const GROUP_ICON: Record<string, string> = {
  TENANT_MANAGEMENT: "building",
  APPROVALS: "shieldCheck",
  CONFIG_LIBRARY: "layers",
  ACCESS_SECURITY: "key",
  OBSERVABILITY: "history",
}

/** On-brand preset accent colours offered in the role editor (hex — the value
   the API stores as `hex_color`). A native picker covers anything else. */
const ROLE_COLORS = [
  "#6741D9",
  "#3B5BDB",
  "#1098AD",
  "#0CA678",
  "#2F9E44",
  "#F08C00",
  "#E8590C",
  "#E03131",
  "#C2255C",
  "#9C36B5",
]
const DEFAULT_ROLE_COLOR = "#6741D9"

type EditorPayload = {
  name: string
  description: string
  permissionCodes: string[]
  hexColor: string
}

/* =============================================================== sensitive === */

function SensitiveBadge() {
  return (
    <span className="inline-flex items-center rounded-[5px] bg-warning-subtle px-1.5 py-px text-[9px] font-semibold tracking-[0.03em] text-warning-subtle-foreground uppercase">
      Sensitive
    </span>
  )
}

/* Dashed, muted pill marking a value the backend doesn't power yet (mirrors the
   PendingBadge convention in platform-settings/ua-shared). The per-role member
   count + assignee avatars have no API yet — see GET /roles/metrics (undocumented
   response shape). Kept visible + flagged rather than dropped. */
function PendingBadge({ children = "API pending" }: { children?: React.ReactNode }) {
  return (
    <span
      title="Not returned by the API yet — pending backend support"
      className="inline-flex items-center gap-1 rounded-full border border-dashed bg-muted/50 px-2 py-[2px] text-[10.5px] font-medium text-muted-foreground [&>svg]:size-2.5"
    >
      <ClockIcon />
      {children}
    </span>
  )
}

/* ============================================================ role editor === */

function RoleEditor({
  base,
  cloneFrom,
  canManage,
  permissions,
  permsLoading,
  permsError,
  saving,
  deleting,
  onCancel,
  onClone,
  onSubmit,
  onDelete,
}: {
  base: Role | null
  /** When set (and base is null), seed a NEW role from this one — the "clone a
     system role" flow. The result is created via POST /roles like any new role. */
  cloneFrom: Role | null
  /** Whether the acting role may author roles (gates the "Clone to edit" action). */
  canManage: boolean
  permissions: Permission[]
  permsLoading: boolean
  permsError: boolean
  saving: boolean
  deleting: boolean
  onCancel: () => void
  onClone: (source: Role) => void
  onSubmit: (payload: EditorPayload) => void
  onDelete: (role: Role) => void
}) {
  const isNew = base === null
  const isSystem = base?.system ?? false
  const isClone = isNew && cloneFrom !== null
  // SYSTEM roles are immutable; new + CUSTOM roles are editable.
  const editable = isNew || !isSystem
  // A clone seeds its fields from the source role; a blank new role from nothing.
  const seed = base ?? cloneFrom

  const [name, setName] = React.useState(
    isClone ? `${cloneFrom!.name} (copy)` : (base?.name ?? "")
  )
  const [desc, setDesc] = React.useState(seed?.description ?? "")
  const [color, setColor] = React.useState(seed?.hexColor ?? DEFAULT_ROLE_COLOR)
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(seed?.permissionCodes ?? [])
  )
  const [confirmDel, setConfirmDel] = React.useState(false)
  const valid = name.trim().length > 0
  const total = permissions.length
  const groups = React.useMemo(
    () => groupPermissions(permissions),
    [permissions]
  )

  const toggle = (code: string) => {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleGroup = (codes: string[]) => {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      const allOn = codes.every((c) => next.has(c))
      codes.forEach((c) => (allOn ? next.delete(c) : next.add(c)))
      return next
    })
  }

  const submit = () => {
    if (!valid || saving) return
    onSubmit({
      name: name.trim(),
      description: desc.trim(),
      permissionCodes: [...selected],
      hexColor: color,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 pl-1.5"
          onClick={onCancel}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Back to roles
        </Button>
        <ConsolePageHeader
          title={isNew ? "Create role" : base.name}
          sub={
            isClone
              ? `Cloned from “${cloneFrom!.name}”. Edit and save as a new custom role.`
              : isNew
                ? "Name the role and grant the permissions it can use. Permissions can be changed later."
                : isSystem
                  ? "Built-in system role — view the permissions it grants, or clone it to create an editable copy."
                  : "Edit the role’s details and the permissions it grants."
          }
          actions={
            isSystem && canManage ? (
              <Button onClick={() => onClone(base!)}>
                <CopyIcon data-icon="inline-start" />
                Clone to edit
              </Button>
            ) : base && !isSystem ? (
              <Button
                variant="outline"
                onClick={() => setConfirmDel(true)}
                disabled={deleting}
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            ) : undefined
          }
        />
      </div>

      {isSystem && (
        <Note tone="info" icon={<InfoIcon />}>
          This is a built-in system role. Its permissions are fixed and can’t be
          edited — <b>clone it</b> to create an editable custom role with the
          same permissions.
        </Note>
      )}

      <div className="grid items-start gap-[18px] lg:grid-cols-[340px_1fr]">
        {/* left: identity */}
        <Panel className="p-4">
          <div className="mb-3 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Identity
          </div>
          <Field label="Role name" required>
            <Input
              value={name}
              disabled={!editable}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Onboarding Specialist"
            />
          </Field>
          <Field label="Description" className="mt-3" optional>
            <Textarea
              rows={3}
              value={desc}
              disabled={!editable}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this role for?"
            />
          </Field>
          <Field label="Colour" className="mt-3" optional>
            <div className="flex flex-wrap items-center gap-2">
              {ROLE_COLORS.map((c) => {
                const on = color.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!editable}
                    title={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-6 rounded-full border-2 transition-transform",
                      on ? "scale-110 border-foreground" : "border-transparent",
                      !editable && "cursor-default"
                    )}
                    style={{ background: c }}
                  />
                )
              })}
              <label
                title="Custom colour"
                className={cn(
                  "relative grid size-6 place-items-center rounded-full border border-dashed text-muted-foreground",
                  editable
                    ? "cursor-pointer hover:border-primary"
                    : "opacity-50"
                )}
              >
                <PaletteIcon className="size-3.5" />
                <input
                  type="color"
                  value={color}
                  disabled={!editable}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
                />
              </label>
              <span className="mono text-[11px] text-muted-foreground">
                {color.toUpperCase()}
              </span>
            </div>
          </Field>
        </Panel>

        {/* right: permission matrix */}
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-[15px]">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Permissions{" "}
                <span className="font-normal tracking-normal normal-case">
                  · what this role can do
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Grant the capabilities this role should have.
              </div>
            </div>
            <span className="mono shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {selected.size} / {total} selected
            </span>
          </div>

          {permsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : permsError ? (
            <div className="p-4">
              <Note tone="err" icon={<TriangleAlertIcon />}>
                Couldn’t load the permission catalogue. Try again in a moment.
              </Note>
            </div>
          ) : total === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              No permissions are defined yet.
            </div>
          ) : (
            <div>
              {groups.map((group) => {
                const codes = group.permissions.map((p) => p.code)
                const picked = codes.filter((c) => selected.has(c)).length
                const allOn = picked === codes.length
                return (
                  <div
                    key={group.code}
                    className="border-t border-border/60 first:border-t-0"
                  >
                    {/* group header — toggles the whole group */}
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => toggleGroup(codes)}
                      className={cn(
                        "flex w-full items-center gap-[11px] bg-muted/35 px-4 py-2.5 text-left",
                        editable
                          ? "cursor-pointer hover:bg-muted/55"
                          : "cursor-default"
                      )}
                    >
                      <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary [&>svg]:size-[14px]">
                        <AccessGlyph
                          name={GROUP_ICON[group.code] ?? "layers"}
                        />
                      </span>
                      <span className="flex-1 text-[12px] font-semibold">
                        {group.label}
                      </span>
                      <span className="mono text-[11px] font-semibold text-muted-foreground">
                        {picked} / {codes.length}
                      </span>
                      <CheckSquare on={allOn} />
                    </button>

                    {/* permission rows */}
                    {group.permissions.map((p) => (
                      <label
                        key={p.code}
                        className={cn(
                          "flex items-start gap-[11px] border-t border-border/60 px-4 py-[13px] pl-[22px]",
                          editable
                            ? "cursor-pointer hover:bg-muted/35"
                            : "cursor-default"
                        )}
                      >
                        <CheckSquare on={selected.has(p.code)} />
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selected.has(p.code)}
                          disabled={!editable}
                          onChange={() => toggle(p.code)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                            {p.name}
                            <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[9.5px] font-semibold tracking-[0.02em] text-muted-foreground">
                              {p.code}
                            </span>
                            {p.sensitive && <SensitiveBadge />}
                          </div>
                          {p.description && (
                            <div className="mt-px text-[11.5px] text-muted-foreground">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>

      {editable && (
        <div className="flex items-center gap-2.5 border-t pt-3.5">
          <span className="flex-1 text-xs text-muted-foreground">
            {selected.size === 0
              ? "No permissions selected — you can grant them later"
              : `${selected.size} permission${selected.size === 1 ? "" : "s"} selected`}
          </span>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={submit}>
            {saving ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <CheckIcon data-icon="inline-start" />
            )}
            {saving
              ? isNew
                ? "Creating…"
                : "Saving…"
              : isNew
                ? "Create role"
                : "Save changes"}
          </Button>
        </div>
      )}

      {confirmDel && base && (
        <ConfirmDialog
          icon={<Trash2Icon />}
          tone="danger"
          title={`Delete “${base.name}”?`}
          confirmLabel={deleting ? "Deleting…" : "Delete role"}
          busy={deleting}
          onConfirm={() => onDelete(base)}
          onCancel={() => setConfirmDel(false)}
          body={
            <p>
              This permanently removes the role. Members currently holding it
              lose its access immediately. A role that is still assigned can’t
              be deleted.
            </p>
          }
        />
      )}
    </div>
  )
}

/* ============================================================== roles list === */

function RoleCard({
  role,
  total,
  canManage,
  onOpen,
}: {
  role: Role
  /** Size of the permission catalogue — the denominator in "granted / total". */
  total: number
  canManage: boolean
  onOpen: () => void
}) {
  const count = role.permissions.length
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="cursor-pointer rounded-[14px] border bg-card p-4 shadow-xs transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-sm"
    >
      <div className="mb-3.5 flex gap-[11px]">
        <RoleIcon color={roleColor(role)} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {role.name}
            {role.system && <SysChip />}
          </div>
          <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {role.description || "No description."}
          </div>
        </div>
      </div>
      <div className="mb-[11px] flex gap-6 border-y py-[11px]">
        {/* permissions — real (granted / catalogue total) */}
        <div>
          <b className="text-[17px] font-bold tabular-nums">
            {count}
            {total > 0 && (
              <span className="font-semibold text-muted-foreground">
                /{total}
              </span>
            )}
          </b>
          <span className="mt-px block text-[10.5px] text-muted-foreground">
            {count === 1 ? "permission" : "permissions"}
          </span>
        </div>
        {/* users assigned — no per-role member API yet; flagged, not faked */}
        <div>
          <span className="flex h-[22px] items-center">
            <PendingBadge />
          </span>
          <span className="mt-px block text-[10.5px] text-muted-foreground">
            users assigned
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {/* assignee avatars — placeholder silhouette until the members-per-role
            API lands (kept to match the design; not real identities) */}
        <div className="flex items-center -space-x-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-[22px] rounded-full border border-dashed border-muted-foreground/30 bg-muted/40"
            />
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary [&>svg]:size-[13px]">
          {role.system ? (canManage ? "View / clone" : "View") : "Edit"}
          <ArrowRightIcon />
        </span>
      </div>
    </div>
  )
}

export function AccessRolesPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAccess()
  const canManage = hasPermission("access-roles")
  const editParam = useEditParam()

  const rolesQuery = useRoles()
  const permsQuery = usePermissions()
  const createMut = useCreateRole()
  const updateMut = useUpdateRole()
  const deleteMut = useDeleteRole()
  const roles = rolesQuery.data

  const [q, setQ] = React.useState("")
  const [editing, setEditing] = React.useState<Role | "new" | null>(
    editParam === "new" ? "new" : null
  )
  // The system role a pending "new" editor is cloning from (null = blank new role).
  const [cloneSource, setCloneSource] = React.useState<Role | null>(null)
  // Permission-catalogue size — the "/ total" denominator on each card + toolbar.
  const permTotal = permsQuery.data?.length ?? 0

  const startCreate = () => {
    setCloneSource(null)
    setEditing("new")
  }
  const startClone = (source: Role) => {
    setCloneSource(source)
    setEditing("new")
  }

  // A ?edit=<roleCode> deep-link resolves once roles load (derived, not state);
  // a local `editing` selection (card click / Create) takes precedence.
  const deepRole = React.useMemo(() => {
    if (!editParam || editParam === "new" || !roles) return null
    return (
      roles.find((x) => x.code === editParam || String(x.id) === editParam) ??
      null
    )
  }, [editParam, roles])
  const active = editing ?? deepRole

  const list = (roles ?? []).filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.description.toLowerCase().includes(q.toLowerCase())
  )
  const system = list.filter((r) => r.system)
  const custom = list.filter((r) => !r.system)

  const close = () => {
    setEditing(null)
    setCloneSource(null)
    if (editParam) navigate("/access-roles", { replace: true })
  }

  const handleSubmit = (payload: EditorPayload) => {
    if (active === "new") {
      createMut.mutate(
        {
          name: payload.name,
          description: payload.description || undefined,
          hex_color: payload.hexColor,
          permission_codes: payload.permissionCodes,
        },
        {
          onSuccess: (role) => {
            toast.success(`Role “${role.name}” created.`)
            close()
          },
          onError: (e) =>
            toast.error(
              e instanceof Error ? e.message : "Could not create the role."
            ),
        }
      )
    } else if (active) {
      updateMut.mutate(
        {
          role: active,
          name: payload.name,
          description: payload.description,
          hexColor: payload.hexColor,
          permissionCodes: payload.permissionCodes,
        },
        {
          onSuccess: (role) => {
            toast.success(`Role “${role.name}” updated.`)
            close()
          },
          onError: (e) =>
            toast.error(
              e instanceof Error ? e.message : "Could not update the role."
            ),
        }
      )
    }
  }

  const handleDelete = (role: Role) => {
    deleteMut.mutate(role.id, {
      onSuccess: () => {
        toast.success(`Role “${role.name}” deleted.`)
        close()
      },
      onError: (e) =>
        toast.error(
          e instanceof Error ? e.message : "Could not delete the role."
        ),
    })
  }

  if (active) {
    return (
      <RoleEditor
        // Force a fresh mount per target so the editor's seeded useState resets
        // when switching view↔clone↔another role (same JSX position otherwise).
        key={
          active === "new"
            ? cloneSource
              ? `clone-${cloneSource.id}`
              : "new"
            : `edit-${active.id}`
        }
        base={active === "new" ? null : active}
        cloneFrom={active === "new" ? cloneSource : null}
        canManage={canManage}
        permissions={permsQuery.data ?? []}
        permsLoading={permsQuery.isLoading}
        permsError={permsQuery.isError}
        saving={createMut.isPending || updateMut.isPending}
        deleting={deleteMut.isPending}
        onCancel={close}
        onClone={startClone}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Roles & permissions"
        sub="Build roles from platform permissions, then assign them to users from the Users tab. Permissions can be changed anytime."
        actions={
          canManage && (
            <Button onClick={startCreate}>
              <PlusIcon data-icon="inline-start" />
              Create role
            </Button>
          )
        }
      />

      <AccessTabs active="roles" />

      {rolesQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : rolesQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load roles.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => rolesQuery.refetch()}
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
                placeholder="Search roles…"
              />
            </InputGroup>
            <Tagpill>{(roles ?? []).length} roles</Tagpill>
            {permTotal > 0 && (
              <Tagpill>
                <KeyRoundIcon />
                {permTotal} permissions
              </Tagpill>
            )}
          </div>

          <div>
            <div className="mb-3 text-[13px] font-semibold">
              System roles{" "}
              <span className="text-xs font-normal text-muted-foreground">
                · built-in, cannot be deleted
              </span>
            </div>
            {system.length ? (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
                {system.map((r) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    total={permTotal}
                    canManage={canManage}
                    onOpen={() => setEditing(r)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                No system roles match.
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 text-[13px] font-semibold">
              Custom roles{" "}
              <span className="text-xs font-normal text-muted-foreground">
                · created by your team
              </span>
            </div>
            {custom.length ? (
              <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
                {custom.map((r) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    total={permTotal}
                    canManage={canManage}
                    onOpen={() => setEditing(r)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
                <LayersIcon className="size-[22px]" />
                <p className="max-w-[46ch] text-[13px] leading-relaxed">
                  No custom roles yet. Create one to tailor permission access to
                  your team.
                </p>
                {canManage && (
                  <Button variant="outline" onClick={startCreate}>
                    <PlusIcon data-icon="inline-start" />
                    Create role
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
