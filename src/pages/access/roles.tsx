import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  InfoIcon,
  KeyRoundIcon,
  LayersIcon,
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
import { useFunctionalities } from "@/features/access/use-functionalities"
import { useCreateRole } from "@/features/access/use-create-role"
import { useUpdateRole } from "@/features/access/use-update-role"
import { useDeleteRole } from "@/features/access/use-delete-role"
import type { Functionality, Role } from "@/features/access/types"
import {
  AccessTabs,
  CheckSquare,
  ConfirmDialog,
  RoleIcon,
  SysChip,
  useEditParam,
} from "./access-shared"

/* The API stores no role colour, so the icon tint is derived deterministically
   from the role code (presentation only — never persisted). */
const PALETTE_KEYS = ["iris", "emerald", "amber", "sky", "rose", "violet"]
function roleColor(role: Role): string {
  if (role.system) return "iris"
  let h = 0
  for (const ch of role.code) h += ch.charCodeAt(0)
  return PALETTE_KEYS[h % PALETTE_KEYS.length]
}

type EditorPayload = {
  name: string
  description: string
  functionalityCodes: string[]
}

/* ============================================================ role editor === */

function RoleEditor({
  base,
  functionalities,
  fnsLoading,
  fnsError,
  saving,
  deleting,
  onCancel,
  onSubmit,
  onDelete,
}: {
  base: Role | null
  functionalities: Functionality[]
  fnsLoading: boolean
  fnsError: boolean
  saving: boolean
  deleting: boolean
  onCancel: () => void
  onSubmit: (payload: EditorPayload) => void
  onDelete: (role: Role) => void
}) {
  const isNew = base === null
  const isSystem = base?.system ?? false
  // SYSTEM roles are immutable; new + CUSTOM roles are editable.
  const editable = isNew || !isSystem

  const [name, setName] = React.useState(base?.name ?? "")
  const [desc, setDesc] = React.useState(base?.description ?? "")
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(base?.functionalityCodes ?? [])
  )
  const [confirmDel, setConfirmDel] = React.useState(false)
  const valid = name.trim().length > 0
  const total = functionalities.length

  const toggle = (code: string) => {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const submit = () => {
    if (!valid || saving) return
    onSubmit({
      name: name.trim(),
      description: desc.trim(),
      functionalityCodes: [...selected],
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
            isNew
              ? "Name the role and grant the modules it can access. Modules can be changed later."
              : isSystem
                ? "Built-in system role — view the modules it grants."
                : "Edit the role’s details and the modules it can access."
          }
          actions={
            base && !isSystem ? (
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
          This is a built-in system role. Its modules are fixed and can’t be
          edited.
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
        </Panel>

        {/* right: module matrix */}
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-[15px]">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Modules{" "}
                <span className="font-normal tracking-normal normal-case">
                  · what this role can access
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Grant the platform modules this role should reach.
              </div>
            </div>
            <span className="mono shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {selected.size} / {total} selected
            </span>
          </div>

          {fnsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : fnsError ? (
            <div className="p-4">
              <Note tone="err" icon={<TriangleAlertIcon />}>
                Couldn’t load the module catalogue. Try again in a moment.
              </Note>
            </div>
          ) : total === 0 ? (
            <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              No modules are defined yet.
            </div>
          ) : (
            <div>
              {functionalities.map((f) => (
                <label
                  key={f.code}
                  className={cn(
                    "flex items-start gap-[11px] border-t border-border/60 px-4 py-[13px] first:border-t-0",
                    editable
                      ? "cursor-pointer hover:bg-muted/35"
                      : "cursor-default"
                  )}
                >
                  <CheckSquare on={selected.has(f.code)} />
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selected.has(f.code)}
                    disabled={!editable}
                    onChange={() => toggle(f.code)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium">
                      {f.name}
                      <span className="mono rounded-[5px] bg-muted px-1.5 py-px text-[9.5px] font-semibold tracking-[0.02em] text-muted-foreground">
                        {f.code}
                      </span>
                    </div>
                    {f.description && (
                      <div className="mt-px text-[11.5px] text-muted-foreground">
                        {f.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {editable && (
        <div className="flex items-center gap-2.5 border-t pt-3.5">
          <span className="flex-1 text-xs text-muted-foreground">
            {selected.size === 0
              ? "No modules selected — you can grant them later"
              : `${selected.size} module${selected.size === 1 ? "" : "s"} selected`}
          </span>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={submit}>
            <CheckIcon data-icon="inline-start" />
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
              lose its module access immediately. A role that is still assigned
              can’t be deleted.
            </p>
          }
        />
      )}
    </div>
  )
}

/* ============================================================== roles list === */

function RoleCard({ role, onOpen }: { role: Role; onOpen: () => void }) {
  const count = role.functionalities.length
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
        <div>
          <b className="text-[17px] font-bold tabular-nums">{count}</b>
          <span className="mt-px block text-[10.5px] text-muted-foreground">
            {count === 1 ? "module" : "modules"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary [&>svg]:size-[13px]">
          {role.system ? "View" : "Edit"}
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
  const fnsQuery = useFunctionalities()
  const createMut = useCreateRole()
  const updateMut = useUpdateRole()
  const deleteMut = useDeleteRole()
  const roles = rolesQuery.data

  const [q, setQ] = React.useState("")
  const [editing, setEditing] = React.useState<Role | "new" | null>(
    editParam === "new" ? "new" : null
  )

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
    if (editParam) navigate("/access-roles", { replace: true })
  }

  const handleSubmit = (payload: EditorPayload) => {
    if (active === "new") {
      createMut.mutate(
        {
          name: payload.name,
          description: payload.description || undefined,
          functionality_codes: payload.functionalityCodes,
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
          functionalityCodes: payload.functionalityCodes,
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
        base={active === "new" ? null : active}
        functionalities={fnsQuery.data ?? []}
        fnsLoading={fnsQuery.isLoading}
        fnsError={fnsQuery.isError}
        saving={createMut.isPending || updateMut.isPending}
        deleting={deleteMut.isPending}
        onCancel={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Roles & permissions"
        sub="Build roles from the platform modules, then assign them to users from the Users tab. Modules can be changed anytime."
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")}>
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
            <Tagpill>
              <KeyRoundIcon />
              {(roles ?? []).length} roles
            </Tagpill>
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
                  <RoleCard key={r.id} role={r} onOpen={() => setEditing(r)} />
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
                  <RoleCard key={r.id} role={r} onOpen={() => setEditing(r)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
                <LayersIcon className="size-[22px]" />
                <p className="max-w-[46ch] text-[13px] leading-relaxed">
                  No custom roles yet. Create one to tailor module access to your
                  team.
                </p>
                {canManage && (
                  <Button variant="outline" onClick={() => setEditing("new")}>
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
