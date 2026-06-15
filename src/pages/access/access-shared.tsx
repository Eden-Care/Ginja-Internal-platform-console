import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  BanIcon,
  Building2Icon,
  CheckIcon,
  GlobeIcon,
  HistoryIcon,
  KeyRoundIcon,
  LayersIcon,
  LockIcon,
  type LucideIcon,
  LogInIcon,
  MailIcon,
  MinusIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TabBar } from "@/components/console/tab-bar"
import { type AccessRole } from "@/lib/console-data"

/* ----------------------------------------------------------- role colours -- */

/** Palette key → HSL-channel expression + an optional distinct text colour. */
const PALETTE: Record<string, { ch: string; text?: string; soft: number }> = {
  iris: { ch: "var(--primary)", soft: 0.12 },
  emerald: { ch: "var(--success)", soft: 0.14 },
  amber: {
    ch: "var(--warning)",
    text: "var(--warning-subtle-foreground)",
    soft: 0.18,
  },
  sky: { ch: "var(--info)", text: "var(--info-subtle-foreground)", soft: 0.16 },
  rose: { ch: "var(--destructive)", soft: 0.12 },
  violet: { ch: "262 83% 62%", text: "262 83% 56%", soft: 0.14 },
}

export const isHexColor = (c: string) => c.startsWith("#")

/** Soft-tinted chip background + accent text for a role's icon tile. */
export function roleIconStyle(color: string): React.CSSProperties {
  if (isHexColor(color)) return { background: `${color}22`, color }
  const p = PALETTE[color] ?? PALETTE.iris
  return {
    background: `hsl(${p.ch} / ${p.soft})`,
    color: `hsl(${p.text ?? p.ch})`,
  }
}

/** Solid accent fill — used for the badge LED dot and editor swatches. */
export function roleDotStyle(color: string): React.CSSProperties {
  if (isHexColor(color)) return { background: color }
  const p = PALETTE[color] ?? PALETTE.iris
  return { background: `hsl(${p.ch})` }
}

/* --------------------------------------------------------------- glyphs --- */

const ICON_MAP: Record<string, LucideIcon> = {
  key: KeyRoundIcon,
  lock: LockIcon,
  building: Building2Icon,
  shieldCheck: ShieldCheckIcon,
  layers: LayersIcon,
  history: HistoryIcon,
  // timeline kinds
  mail: MailIcon,
  rotateCcw: RotateCcwIcon,
  userCheck: UserCheckIcon,
  ban: BanIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  logIn: LogInIcon,
  pause: PauseIcon,
  play: PlayIcon,
  globe: GlobeIcon,
  sparkles: SparklesIcon,
}

/** Resolve a hi-fi icon name to a lucide icon (falls back to a clock/history). */
export function AccessGlyph({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICON_MAP[name] ?? HistoryIcon
  return <Icon className={className} />
}

/* --------------------------------------------------------- role widgets --- */

/** Rounded, accent-tinted tile holding a key glyph — the role avatar. */
export function RoleIcon({
  color,
  size = 34,
  iconSize = 16,
  className,
}: {
  color: string
  size?: number
  iconSize?: number
  className?: string
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-[9px]",
        className
      )}
      style={{ width: size, height: size, ...roleIconStyle(color) }}
    >
      <KeyRoundIcon style={{ width: iconSize, height: iconSize }} />
    </span>
  )
}

/** Small custom checkbox box (filled primary + tick when on). */
export function CheckSquare({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-md border-[1.5px] transition-colors [&>svg]:size-3",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input text-transparent"
      )}
    >
      {on && <CheckIcon />}
    </span>
  )
}

/** "System" lock chip shown on built-in roles. */
export function SysChip() {
  return (
    <span className="inline-flex items-center gap-[3px] rounded-[5px] bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.03em] text-muted-foreground uppercase [&>svg]:size-[9px]">
      <LockIcon />
      System
    </span>
  )
}

/** Pill with a coloured LED dot + role name. */
export function RoleBadge({
  role,
  size,
}: {
  role: AccessRole | undefined
  size?: "sm"
}) {
  if (!role) return null
  return (
    <span
      className={cn(
        "inline-flex max-w-[150px] items-center gap-1.5 overflow-hidden rounded-full border bg-muted py-[3px] pr-[9px] pl-2 font-semibold whitespace-nowrap text-foreground",
        size === "sm" ? "text-[10.5px]" : "text-[11.5px]"
      )}
    >
      <i
        className="size-[7px] shrink-0 rounded-full"
        style={roleDotStyle(role.color)}
      />
      <span className="truncate">{role.name}</span>
    </span>
  )
}

/* --------------------------------------------------- access sub-nav tabs --- */

/** Underline tabs that cross-navigate the two Access screens (own routes). */
export function AccessTabs({ active }: { active: "users" | "roles" }) {
  const navigate = useNavigate()
  return (
    <TabBar
      className="mb-1"
      value={active === "roles" ? "access-roles" : "access-users"}
      onChange={(k) => navigate(`/${k}`)}
      tabs={[
        { k: "access-users", label: "Users", icon: <UsersIcon /> },
        {
          k: "access-roles",
          label: "Roles & permissions",
          icon: <KeyRoundIcon />,
        },
      ]}
    />
  )
}

/** Read the `?edit=<roleId>` deep-link used by "Open role page". */
export function useEditParam() {
  const { search } = useLocation()
  return new URLSearchParams(search).get("edit")
}

/* ------------------------------------------------------- shared callouts -- */

/** Bordered impact list inside a confirm dialog (warn = amber, danger = red). */
export function ImpactBox({
  tone = "warn",
  heading,
  children,
}: {
  tone?: "warn" | "danger"
  heading: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mt-1 rounded-[11px] border p-3",
        tone === "danger"
          ? "border-destructive/30 bg-destructive-subtle/50"
          : "border-warning/35 bg-warning-subtle/50"
      )}
    >
      <div
        className={cn(
          "mb-1.5 flex items-center gap-1.5 text-xs font-semibold [&>svg]:size-3.5",
          tone === "danger"
            ? "text-destructive-subtle-foreground"
            : "text-warning-subtle-foreground"
        )}
      >
        <TriangleAlertIcon />
        {heading}
      </div>
      <ul className="grid list-disc gap-1.5 pl-[18px] text-[12px] leading-snug [&_b]:font-semibold">
        {children}
      </ul>
    </div>
  )
}

/* --------------------------------------------------------- confirm dialog -- */

/**
 * High-stakes confirmation modal: tone-coloured icon, body, an optional reason
 * textarea and an optional type-to-confirm word. Mirrors the hi-fi ConfirmDialog.
 */
export function ConfirmDialog({
  icon,
  tone = "danger",
  title,
  body,
  confirmLabel,
  confirmWord,
  reasonRequired,
  reasonLabel = "Reason",
  onConfirm,
  onCancel,
}: {
  icon: React.ReactNode
  tone?: "danger" | "warn"
  title: string
  body: React.ReactNode
  confirmLabel: string
  confirmWord?: string
  reasonRequired?: boolean
  reasonLabel?: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [word, setWord] = React.useState("")
  const [reason, setReason] = React.useState("")
  const wordOk = !confirmWord || word.trim() === confirmWord
  const reasonOk = !reasonRequired || reason.trim().length > 2
  const ok = wordOk && reasonOk

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[470px]">
        <span
          className={cn(
            "grid size-[42px] place-items-center rounded-[11px] [&>svg]:size-5",
            tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-warning-subtle text-warning-subtle-foreground"
          )}
        >
          {icon}
        </span>
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <div className="text-[13px] leading-normal [&_b]:font-semibold [&_p]:mb-2.5 [&_p:last-child]:mb-0">
          {body}
        </div>

        {reasonRequired && (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1 text-[13px] font-medium">
              {reasonLabel}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Recorded in the audit log…"
            />
          </div>
        )}

        {confirmWord && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium">
              Type <b className="mono font-semibold">{confirmWord}</b> to
              confirm
            </label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={confirmWord}
            />
          </div>
        )}

        <DialogFooter className="mx-0 mb-0 border-0 bg-transparent p-0 pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            disabled={!ok}
            onClick={() => onConfirm(reason)}
          >
            {icon}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
