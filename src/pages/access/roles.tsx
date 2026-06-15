import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  InfoIcon,
  KeyRoundIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
import { useAccess } from "@/contexts/access-context"
import {
  ACCESS_ROLES,
  type AccessRole,
  PERM_CATALOG,
  PERM_TOTAL,
  ROLE_PALETTE,
  rolePermCount,
  usersWithRole,
} from "@/lib/console-data"
import {
  AccessGlyph,
  AccessTabs,
  ConfirmDialog,
  CheckSquare,
  ImpactBox,
  isHexColor,
  roleDotStyle,
  RoleIcon,
  SysChip,
  useEditParam,
} from "./access-shared"

/* ======================================================== colour picker === */

const PICKER_PRESETS = [
  "#E8590C",
  "#E03131",
  "#C2255C",
  "#9C36B5",
  "#6741D9",
  "#3B5BDB",
  "#1098AD",
  "#0CA678",
  "#2F9E44",
  "#F08C00",
  "#212529",
  "#868E96",
]

function hsvToHex(h: number, s: number, v: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    const c = v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0")
  }
  return ("#" + f(5) + f(3) + f(1)).toUpperCase()
}

function hexToHsv(hex: string) {
  if (!isHexColor(hex) || hex.length < 7) return { h: 240, s: 0.6, v: 0.85 }
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function ColorPickerDialog({
  value,
  onPick,
  onClose,
}: {
  value: string
  onPick: (hex: string) => void
  onClose: () => void
}) {
  const init = hexToHsv(value)
  const [h, setH] = React.useState(init.h)
  const [s, setS] = React.useState(init.s)
  const [v, setV] = React.useState(init.v)
  const svRef = React.useRef<HTMLDivElement>(null)
  const hueRef = React.useRef<HTMLDivElement>(null)
  const hex = hsvToHex(h, s, v)

  /** Track a pointer drag over `el`, calling `apply(clientX, clientY)` each move. */
  const track = (
    el: HTMLElement | null,
    e: React.PointerEvent,
    apply: (rect: DOMRect, cx: number, cy: number) => void
  ) => {
    if (!el) return
    e.preventDefault()
    const run = (cx: number, cy: number) =>
      apply(el.getBoundingClientRect(), cx, cy)
    run(e.clientX, e.clientY)
    const move = (ev: PointerEvent) => run(ev.clientX, ev.clientY)
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const onSVDown = (e: React.PointerEvent) =>
    track(svRef.current, e, (r, cx, cy) => {
      setS(Math.min(Math.max(cx - r.left, 0), r.width) / r.width)
      setV(1 - Math.min(Math.max(cy - r.top, 0), r.height) / r.height)
    })
  const onHueDown = (e: React.PointerEvent) =>
    track(hueRef.current, e, (r, cx) => {
      setH((Math.min(Math.max(cx - r.left, 0), r.width) / r.width) * 360)
    })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[280px]">
        <div
          ref={svRef}
          onPointerDown={onSVDown}
          className="relative h-[150px] cursor-crosshair touch-none overflow-hidden rounded-[10px]"
          style={{ background: `hsl(${h} 100% 50%)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <span
            className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
            style={{
              left: `${s * 100}%`,
              top: `${(1 - v) * 100}%`,
              background: hex,
            }}
          />
        </div>

        <div
          ref={hueRef}
          onPointerDown={onHueDown}
          className="relative h-3.5 cursor-pointer rounded-full"
          style={{
            background:
              "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
          }}
        >
          <span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: `${(h / 360) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-12 gap-1">
          {PICKER_PRESETS.map((p) => (
            <button
              key={p}
              title={p}
              onClick={() => {
                const n = hexToHsv(p)
                setH(n.h)
                setS(n.s)
                setV(n.v)
              }}
              className={cn(
                "aspect-square rounded-[5px] outline-offset-1",
                hex === p && "outline-2 outline-foreground"
              )}
              style={{ background: p }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="size-6 rounded-[7px] border"
            style={{ background: hex }}
          />
          <span className="mono text-[13px] font-semibold tracking-[0.04em]">
            {hex}
          </span>
          <span className="ml-auto" />
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onPick(hex)
              onClose()
            }}
          >
            <CheckIcon data-icon="inline-start" />
            Use colour
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ============================================================ role editor === */

function RoleEditor({
  base,
  readonly,
  onCancel,
  onSave,
  onDelete,
}: {
  base: AccessRole | null
  readonly: boolean
  onCancel: () => void
  onSave: (role: AccessRole) => void
  onDelete: (role: AccessRole) => void
}) {
  const [cloneMode, setCloneMode] = React.useState(false)
  const sysView = !!base?.system && !cloneMode
  const editable = !sysView
  const isNew = !base || cloneMode

  const [name, setName] = React.useState(base ? base.name : "")
  const [desc, setDesc] = React.useState(base ? base.desc : "")
  const [color, setColor] = React.useState(base ? base.color : "iris")
  const [perms, setPerms] = React.useState<Set<string>>(() => {
    if (!base) return new Set()
    if (base.perms.includes("*"))
      return new Set(PERM_CATALOG.flatMap((g) => g.perms.map((p) => p.id)))
    return new Set(base.perms)
  })
  const [confirmDel, setConfirmDel] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)

  const customOn = color.startsWith("#")
  const total = perms.size
  const valid = !!name.trim()

  const togglePerm = (id: string) => {
    if (!editable) return
    setPerms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleGroup = (ids: string[], on: boolean) => {
    if (!editable) return
    setPerms((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)))
      return next
    })
  }

  const save = () => {
    const id =
      base && !cloneMode
        ? base.id
        : "role_" +
          name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .slice(0, 24) +
          "_" +
          Math.random().toString(36).slice(2, 5)
    onSave({
      id,
      name: name.trim(),
      desc: desc.trim(),
      system: false,
      color,
      perms: total === PERM_TOTAL ? ["*"] : [...perms],
    })
  }

  const holders = base ? usersWithRole(base.id).length : 0

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
          title={sysView ? base!.name : isNew ? "Create role" : "Edit role"}
          sub={
            sysView
              ? "System role — view its permissions or clone it to customise."
              : "Name the role now and assign permissions now or later — nothing is locked in."
          }
          actions={
            <>
              {base && !base.system && !readonly && (
                <Button variant="outline" onClick={() => setConfirmDel(true)}>
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
              )}
              {sysView && !readonly && (
                <Button
                  onClick={() => {
                    setCloneMode(true)
                    setName(base!.name + " (copy)")
                  }}
                >
                  <CopyIcon data-icon="inline-start" />
                  Clone to edit
                </Button>
              )}
            </>
          }
        />
      </div>

      {sysView && (
        <Note tone="info" icon={<KeyRoundIcon />}>
          This is a built-in system role. Its permissions are fixed —{" "}
          <b>clone it</b> to create an editable custom role with the same
          starting point.
        </Note>
      )}

      <div className="grid items-start gap-[18px] lg:grid-cols-[340px_1fr]">
        {/* left: identity */}
        <div className="flex flex-col gap-4">
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
            <Field label="Description" className="mt-3">
              <Textarea
                rows={3}
                value={desc}
                disabled={!editable}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What is this role for?"
              />
            </Field>
            <Field label="Colour" className="mt-3">
              <div className="flex flex-wrap gap-2">
                {ROLE_PALETTE.map((p) => (
                  <button
                    key={p.id}
                    title={p.id}
                    disabled={!editable}
                    onClick={() => setColor(p.id)}
                    style={roleDotStyle(p.id)}
                    className={cn(
                      "size-[26px] rounded-lg border-2 border-transparent transition-shadow disabled:opacity-50",
                      color === p.id &&
                        "border-foreground ring-2 ring-ring/40 ring-offset-1 ring-offset-background"
                    )}
                  />
                ))}
                <button
                  title="Custom colour…"
                  disabled={!editable}
                  onClick={() => setPickerOpen(true)}
                  style={customOn ? { background: color } : undefined}
                  className={cn(
                    "grid size-[26px] place-items-center rounded-lg border border-dashed border-input text-muted-foreground transition-colors disabled:opacity-50 [&>svg]:size-3.5",
                    customOn &&
                      "border-solid border-foreground text-white ring-2 ring-ring/40 ring-offset-1 ring-offset-background"
                  )}
                >
                  {!customOn && <PlusIcon />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {customOn ? (
                  <>
                    Custom colour <span className="mono">{color}</span> ·{" "}
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => setPickerOpen(true)}
                      className="font-semibold text-primary disabled:opacity-50"
                    >
                      change
                    </button>
                  </>
                ) : (
                  "Pick a preset, or choose a custom colour."
                )}
              </p>
            </Field>
          </Panel>

          {editable && total === 0 && (
            <Note tone="info" icon={<InfoIcon />}>
              <b>No permissions yet — that's fine.</b> You can save this role
              now and add permissions later. Until then it grants no access.
            </Note>
          )}
        </div>

        {/* right: permission matrix */}
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-[15px]">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Permissions{" "}
                <span className="font-normal tracking-normal normal-case">
                  · optional, editable anytime
                </span>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Select what this role can do — now or later.
              </div>
            </div>
            <span className="mono shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {total} / {PERM_TOTAL} selected
            </span>
          </div>

          <div>
            {PERM_CATALOG.map((g) => {
              const ids = g.perms.map((p) => p.id)
              const on = ids.filter((id) => perms.has(id)).length
              const allOn = on === ids.length
              return (
                <div key={g.id} className="border-b last:border-0">
                  <div className="flex items-center gap-[11px] bg-muted/40 px-4 py-[11px]">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground [&>svg]:size-[15px]">
                      <AccessGlyph name={g.icon} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{g.label}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {g.desc}
                      </div>
                    </div>
                    <span className="mono text-[11px] font-semibold text-muted-foreground">
                      {on}/{ids.length}
                    </span>
                    {editable && (
                      <button
                        onClick={() => toggleGroup(ids, !allOn)}
                        className="rounded-[7px] border border-input bg-card px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary"
                      >
                        {allOn ? "Clear" : "All"}
                      </button>
                    )}
                  </div>
                  <div>
                    {g.perms.map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex items-start gap-[11px] border-t border-border/60 px-4 py-[11px] first:border-t-0",
                          editable
                            ? "cursor-pointer hover:bg-muted/35"
                            : "cursor-default"
                        )}
                      >
                        <CheckSquare on={perms.has(p.id)} />
                        <input
                          type="checkbox"
                          checked={perms.has(p.id)}
                          disabled={!editable}
                          onChange={() => togglePerm(p.id)}
                          className="hidden"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium">
                            {p.label}
                            {p.sensitive && (
                              <span
                                title="Sensitive permission"
                                className="inline-flex items-center gap-[3px] rounded-[5px] bg-warning-subtle px-1.5 py-px text-[9px] font-semibold tracking-[0.02em] text-warning-subtle-foreground uppercase [&>svg]:size-[9px]"
                              >
                                <ShieldIcon />
                                Sensitive
                              </span>
                            )}
                          </div>
                          <div className="mt-px text-[11.5px] text-muted-foreground">
                            {p.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {!sysView && (
        <div className="flex items-center gap-2.5 border-t pt-3.5">
          <span className="flex-1 text-xs text-muted-foreground">
            {total === 0
              ? "No permissions yet — assign now or later"
              : `${total} of ${PERM_TOTAL} permissions selected`}
          </span>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={save}>
            <CheckIcon data-icon="inline-start" />
            {isNew ? "Create role" : "Save changes"}
          </Button>
        </div>
      )}

      {pickerOpen && (
        <ColorPickerDialog
          value={customOn ? color : "#6741D9"}
          onPick={(c) => setColor(c)}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {confirmDel && base && (
        <ConfirmDialog
          icon={<Trash2Icon />}
          tone="danger"
          title={`Delete “${base.name}”?`}
          confirmLabel="Delete role"
          onConfirm={() => onDelete(base)}
          onCancel={() => setConfirmDel(false)}
          body={
            <>
              <p>
                This permanently removes the role.{" "}
                <b>
                  {holders} user{holders === 1 ? "" : "s"}
                </b>{" "}
                currently hold{holders === 1 ? "s" : ""} it and will lose these
                permissions immediately.
              </p>
              {holders > 0 && (
                <ImpactBox tone="warn" heading="Downstream impact">
                  <li>
                    {holders} user(s) lose {rolePermCount(base)} permissions
                    granted by this role.
                  </li>
                  <li>
                    Users with no other role will retain access to nothing until
                    reassigned.
                  </li>
                  <li>The deletion is recorded in the audit log.</li>
                </ImpactBox>
              )}
            </>
          }
        />
      )}
    </div>
  )
}

/* ============================================================== roles list === */

function RoleCard({
  role,
  canManage,
  onOpen,
}: {
  role: AccessRole
  canManage: boolean
  onOpen: () => void
}) {
  const users = usersWithRole(role.id)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="cursor-pointer rounded-[14px] border bg-card p-4 shadow-xs transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-sm"
    >
      <div className="mb-3.5 flex gap-[11px]">
        <RoleIcon color={role.color} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {role.name}
            {role.system && <SysChip />}
          </div>
          <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
            {role.desc}
          </div>
        </div>
      </div>
      <div className="mb-[11px] flex gap-6 border-y py-[11px]">
        <div>
          <b className="text-[17px] font-bold tabular-nums">
            {rolePermCount(role)}
            <span className="text-xs font-semibold text-muted-foreground">
              /{PERM_TOTAL}
            </span>
          </b>
          <span className="mt-px block text-[10.5px] text-muted-foreground">
            permissions
          </span>
        </div>
        <div>
          <b className="text-[17px] font-bold tabular-nums">{users.length}</b>
          <span className="mt-px block text-[10.5px] text-muted-foreground">
            {users.length === 1 ? "user assigned" : "users assigned"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2.5">
        {users.length === 0 ? (
          <span className="text-[11.5px] text-muted-foreground">
            No users yet
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {users.slice(0, 7).map((u) => (
              <span
                key={u.id}
                title={u.name}
                className="inline-grid size-6 place-items-center rounded-full bg-primary/14 text-[9.5px] font-bold text-primary ring-2 ring-card"
              >
                {u.initials}
              </span>
            ))}
            {users.length > 7 && (
              <span className="inline-grid size-6 place-items-center rounded-full bg-muted text-[9.5px] font-bold text-muted-foreground ring-2 ring-card">
                +{users.length - 7}
              </span>
            )}
          </div>
        )}
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
  const readonly = !canManage
  const editParam = useEditParam()

  const [roles, setRoles] = React.useState<AccessRole[]>(ACCESS_ROLES)
  const [q, setQ] = React.useState("")
  const [editing, setEditing] = React.useState<AccessRole | "new" | null>(() =>
    editParam === "new"
      ? "new"
      : editParam
        ? (ACCESS_ROLES.find((r) => r.id === editParam) ?? null)
        : null
  )

  const list = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.desc.toLowerCase().includes(q.toLowerCase())
  )
  const system = list.filter((r) => r.system)
  const custom = list.filter((r) => !r.system)

  const saveRole = (next: AccessRole) => {
    setRoles((rs) =>
      rs.some((r) => r.id === next.id)
        ? rs.map((r) => (r.id === next.id ? next : r))
        : [...rs, next]
    )
    toast.success(`Role “${next.name}” saved.`)
    setEditing(null)
  }
  const deleteRole = (r: AccessRole) => {
    setRoles((rs) => rs.filter((x) => x.id !== r.id))
    toast.success(`Role “${r.name}” deleted.`)
    setEditing(null)
  }
  const close = () => {
    setEditing(null)
    if (editParam) navigate("/access-roles", { replace: true })
  }

  if (editing) {
    return (
      <RoleEditor
        base={editing === "new" ? null : editing}
        readonly={readonly}
        onCancel={close}
        onSave={saveRole}
        onDelete={deleteRole}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={["Access & security", "Roles & permissions"]}
        title="Roles & permissions"
        sub="Build roles from the permission catalogue, then assign them to users from the Users tab. Permissions can be changed anytime."
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
        <Tagpill>{roles.length} roles</Tagpill>
        <Tagpill>
          <KeyRoundIcon />
          {PERM_TOTAL} permissions
        </Tagpill>
      </div>

      <div>
        <div className="mb-3 text-[13px] font-semibold">
          System roles{" "}
          <span className="text-xs font-normal text-muted-foreground">
            · built-in, cannot be deleted
          </span>
        </div>
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          {system.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              canManage={canManage}
              onOpen={() => setEditing(r)}
            />
          ))}
        </div>
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
                canManage={canManage}
                onOpen={() => setEditing(r)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 rounded-[14px] border border-dashed bg-muted/30 px-6 py-10 text-center text-muted-foreground">
            <KeyRoundIcon className="size-[22px]" />
            <p className="max-w-[46ch] text-[13px] leading-relaxed">
              No custom roles yet. Create one to tailor permissions to your
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
    </div>
  )
}
