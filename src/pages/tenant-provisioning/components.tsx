import * as React from "react"
import {
  CheckCircle2Icon,
  CheckIcon,
  DatabaseIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  MessageSquareIcon,
  RotateCcwIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/console/note"
import {
  PROV_STATUS,
  PROV_SECTIONS,
  type ProvProvider,
  type ProvSectionStatus,
  type ProvTone,
  type ProvisioningRecord,
} from "@/lib/console-data"

/** Read-only flag: `true`/`false`, or a string carrying a custom read-only message. */
export type Ro = boolean | string

/* ---------------------------------------------------------------- icons -- */

export const SECTION_ICON: Record<string, LucideIcon> = {
  database: DatabaseIcon,
  globe: GlobeIcon,
  messageSquare: MessageSquareIcon,
  mail: MailIcon,
  rotateCcw: RotateCcwIcon,
}

/* ------------------------------------------------------------- tone pill -- */

const TONE_CLASS: Record<ProvTone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  error: "bg-destructive-subtle text-destructive-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
}

/** Status / stage pill with a leading LED dot (success · warning · error · …). */
export function TonePill({
  tone,
  children,
  className,
}: {
  tone: ProvTone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium",
        TONE_CLASS[tone],
        className
      )}
    >
      <span className="size-[6px] rounded-full bg-current" />
      {children}
    </span>
  )
}

/** Pill for a per-section status (uses its label + tone from PROV_STATUS). */
export function SectionStatusPill({ status }: { status: ProvSectionStatus }) {
  const s = PROV_STATUS[status] ?? PROV_STATUS.todo
  return <TonePill tone={s.tone}>{s.lab}</TonePill>
}

/* --------------------------------------------------------- progress bar -- */

const SEG_CLASS: Record<ProvSectionStatus, string> = {
  done: "bg-success",
  tested: "bg-success",
  progress: "bg-warning",
  failed: "bg-destructive",
  todo: "bg-muted-foreground/20",
}

/** Five-segment provisioning progress track (one segment per section). */
export function ProvTrack({ p }: { p: ProvisioningRecord }) {
  return (
    <div className="flex w-[120px] gap-[3px]">
      {PROV_SECTIONS.map((s) => {
        const st = p.sections[s.k]
        return (
          <span
            key={s.k}
            title={`${s.l}: ${PROV_STATUS[st].lab}`}
            className={cn("h-[7px] flex-1 rounded-[3px]", SEG_CLASS[st])}
          />
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------- provider cards -- */

export function ProviderGrid({
  list,
  value,
  onPick,
  ro,
}: {
  list: ProvProvider[]
  value: string
  onPick: (id: string) => void
  ro?: Ro
}) {
  return (
    <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-2">
      {list.map((pr) => {
        const on = value === pr.id
        return (
          <button
            key={pr.id}
            type="button"
            disabled={!!ro}
            onClick={() => onPick(pr.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left transition-colors",
              on
                ? "border-primary/55 bg-primary/5"
                : "hover:border-primary/40",
              ro && "cursor-not-allowed opacity-60"
            )}
          >
            <span
              className={cn(
                "grid size-[18px] shrink-0 place-items-center rounded-full border",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input"
              )}
            >
              {on && <CheckIcon className="size-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                {pr.name}
                {pr.default && (
                  <span className="rounded-[5px] bg-primary/12 px-1.5 py-px text-[9px] font-semibold tracking-wide text-primary uppercase">
                    Default
                  </span>
                )}
              </div>
              {pr.hint && (
                <div className="mt-px text-[11px] text-muted-foreground">
                  {pr.hint}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------- test button -- */

/** Test button (idle → testing → ok). When `onTest` is supplied it runs the real
   async action (the section test endpoint) and reflects its result; otherwise it
   falls back to a simulated pass. Fires `onResult(true)` on success. */
export function TestButton({
  label,
  okLabel,
  onResult,
  onTest,
  ro,
  kind,
}: {
  label: string
  okLabel?: string
  onResult?: (ok: boolean) => void
  /** Real async test; resolves true on success. Omit for a simulated pass. */
  onTest?: () => Promise<boolean>
  ro?: Ro
  kind?: "send"
}) {
  const [state, setState] = React.useState<"idle" | "testing" | "ok">("idle")
  const run = async () => {
    if (ro || state === "testing") return
    setState("testing")
    if (onTest) {
      const ok = await onTest()
      setState(ok ? "ok" : "idle")
      if (ok) onResult?.(true)
    } else {
      setTimeout(() => {
        setState("ok")
        onResult?.(true)
      }, 1100)
    }
  }
  return (
    <button
      type="button"
      onClick={run}
      disabled={!!ro || state === "testing"}
      className={cn(
        "inline-flex h-[34px] items-center gap-[7px] rounded-lg border px-3.5 text-[12.5px] font-semibold transition-all",
        state === "ok"
          ? "border-success/50 bg-success-subtle/50 text-success"
          : state === "testing"
            ? "border-input bg-card text-muted-foreground"
            : "border-input bg-card text-foreground hover:border-primary hover:text-primary",
        (!!ro || state === "testing") && "cursor-not-allowed opacity-90 disabled:opacity-55"
      )}
    >
      {state === "testing" ? (
        <>
          <Loader2Icon className="size-3.5 animate-spin" />
          Testing…
        </>
      ) : state === "ok" ? (
        <>
          <CheckCircle2Icon className="size-3.5" />
          {okLabel || "Passed"}
        </>
      ) : (
        <>
          {kind === "send" ? (
            <MailIcon className="size-3.5" />
          ) : (
            <ZapIcon className="size-3.5" />
          )}
          {label}
        </>
      )}
    </button>
  )
}

/** Inline "passed / reachable" confirmation shown next to a TestButton. */
export function OkInline({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success">
      <CheckCircle2Icon className="size-3.5" />
      {children}
    </span>
  )
}

/* --------------------------------------------------------- secret input -- */

/** Masked credential input with a show/hide eye toggle. */
export function SecretInput({
  placeholder,
  ro,
  value,
  onChange,
}: {
  placeholder?: string
  ro?: Ro
  value?: string
  onChange?: (v: string) => void
}) {
  const [show, setShow] = React.useState(false)
  const [inner, setInner] = React.useState("")
  const v = value !== undefined ? value : inner
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={v}
        disabled={!!ro}
        onChange={(e) =>
          onChange ? onChange(e.target.value) : setInner(e.target.value)
        }
        className="pr-9"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        title={show ? "Hide" : "Show"}
        aria-label={show ? "Hide value" : "Show value"}
        className="absolute top-1/2 right-1.5 grid -translate-y-1/2 place-items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {show ? (
          <EyeOffIcon className="size-[15px]" />
        ) : (
          <EyeIcon className="size-[15px]" />
        )}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------- save bar -- */

/** Sticky-ish footer save bar; renders a read-only note when `ro` is set. */
export function SaveBar({
  ro,
  disabled,
  onSave,
  label,
}: {
  ro?: Ro
  disabled?: boolean
  onSave: () => void
  label: string
}) {
  const [saved, setSaved] = React.useState(false)
  if (ro) {
    return (
      <Note tone="info" icon={<LockIcon />}>
        {typeof ro === "string"
          ? ro
          : "You have read-only access to provisioning. Ask a Platform Engineer to make changes."}
      </Note>
    )
  }
  return (
    <div className="flex items-center">
      <span className="flex-1" />
      {saved && (
        <span className="mr-2.5">
          <OkInline>Saved</OkInline>
        </span>
      )}
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => {
          onSave()
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        }}
      >
        <CheckIcon data-icon="inline-start" />
        {label}
      </Button>
    </div>
  )
}
