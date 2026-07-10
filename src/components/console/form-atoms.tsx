import * as React from "react"
import { CheckCircle2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SelectOption = string | { value: string; label: string }

/** Thin wrapper over the shadcn Select for simple string-option fields. */
export function ConsoleSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  )
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Labeled form field wrapper (label · required/optional · control · hint). */
export function Field({
  label,
  required,
  optional,
  hint,
  hintTone = "muted",
  className,
  children,
}: {
  label?: React.ReactNode
  required?: boolean
  optional?: boolean
  hint?: React.ReactNode
  hintTone?: "muted" | "error" | "success"
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label className="flex items-center gap-1 text-[13px] font-medium">
          {label}
          {required ? <span className="text-destructive">*</span> : null}
          {optional ? (
            <span className="text-[11px] font-normal text-muted-foreground">
              optional
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint ? (
        <span
          className={cn(
            "text-[11.5px]",
            hintTone === "error" && "text-destructive",
            hintTone === "success" && "text-success",
            hintTone === "muted" && "text-muted-foreground"
          )}
        >
          {hint}
        </span>
      ) : null}
    </div>
  )
}

/** Section block with a heading + optional description. */
export function FormSection({
  title,
  desc,
  action,
  className,
  children,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={className}>
      <div className="mb-3.5 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          {desc ? (
            <p className="mt-1 max-w-prose text-xs text-muted-foreground">
              {desc}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Two-column responsive form grid (use `sm:col-span-2` on a Field to span). */
export function FormGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}
      {...props}
    />
  )
}

type SegOption = string | { v: string; l: React.ReactNode }

/** Segmented control (pill group). */
export function Seg({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: SegOption[]
  onChange: (v: string) => void
  className?: string
}) {
  const opts = options.map((o) => (typeof o === "string" ? { v: o, l: o } : o))
  return (
    <div
      className={cn(
        "inline-flex gap-[3px] rounded-[9px] bg-muted p-[3px]",
        className
      )}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "h-[30px] cursor-pointer rounded-md px-3 text-[13px] transition-colors",
            value === o.v
              ? "bg-card font-semibold text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export type RadioCardOption = {
  v: string
  icon: React.ReactNode
  title: string
  desc: string
}

/** Selectable radio cards (tenant type, isolation tier, …). */
export function RadioCards({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: RadioCardOption[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {options.map((o) => {
        const on = value === o.v
        return (
          <button
            type="button"
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "relative flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-all",
              on
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/40 hover:bg-muted/40"
            )}
          >
            <span
              className={cn(
                "absolute top-3 right-3 text-primary transition-opacity",
                on ? "opacity-100" : "opacity-0"
              )}
            >
              <CheckCircle2Icon className="size-[18px]" />
            </span>
            <span className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-4">
                {o.icon}
              </span>
              <h5 className="text-[13px] font-semibold">{o.title}</h5>
            </span>
            <p className="text-xs text-muted-foreground">{o.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
