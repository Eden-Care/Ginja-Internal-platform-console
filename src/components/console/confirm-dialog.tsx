import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmTone = "danger" | "warn"

const ICON_TONE: Record<ConfirmTone, string> = {
  danger: "bg-destructive/12 text-destructive",
  warn: "bg-warning-subtle text-warning-subtle-foreground",
}

const IMPACT_TONE: Record<ConfirmTone, string> = {
  danger:
    "border-destructive/30 bg-destructive-subtle/50 [&_.ib-h]:text-destructive-subtle-foreground",
  warn: "border-warning/35 bg-warning-subtle/50 [&_.ib-h]:text-warning-subtle-foreground",
}

/**
 * High-stakes confirmation dialog — a toned icon, title, body and an optional
 * impact list, with Cancel + a confirm button whose colour follows the tone
 * (`danger` → destructive button). Mirrors the hi-fi `ConfirmDialog`.
 */
export function ConfirmDialog({
  open,
  icon,
  tone = "danger",
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  icon?: React.ReactNode
  tone?: ConfirmTone
  title: React.ReactNode
  body?: React.ReactNode
  confirmLabel: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[470px] gap-3 p-5"
      >
        <span
          className={cn(
            "grid size-[42px] place-items-center rounded-[11px] [&>svg]:size-5",
            ICON_TONE[tone]
          )}
        >
          {icon}
        </span>
        <DialogTitle className="font-heading text-base font-bold">
          {title}
        </DialogTitle>
        {body ? (
          <div className="text-[13px] leading-[1.55] text-foreground [&_b]:font-semibold [&_p]:mb-2.5 [&_p:last-child]:mb-0">
            {body}
          </div>
        ) : null}
        <DialogFooter className="mx-0 mt-2 mb-0 gap-2 border-0 bg-transparent p-0">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {icon}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The "What happens" impact box used inside a ConfirmDialog body. */
export function ImpactBox({
  tone = "warn",
  heading,
  icon,
  items,
}: {
  tone?: ConfirmTone
  heading: React.ReactNode
  icon?: React.ReactNode
  items: React.ReactNode[]
}) {
  return (
    <div className={cn("mt-1 rounded-[11px] border p-3.5", IMPACT_TONE[tone])}>
      <div className="ib-h mb-1.5 flex items-center gap-1.5 text-xs font-semibold [&>svg]:size-3.5">
        {icon}
        {heading}
      </div>
      <ul className="grid list-disc gap-1.5 pl-[18px]">
        {items.map((it, i) => (
          <li key={i} className="text-xs leading-[1.45]">
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
