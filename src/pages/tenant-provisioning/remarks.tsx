import * as React from "react"
import {
  CheckCircle2Icon,
  CheckIcon,
  FlagIcon,
  MessageSquareIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Seg } from "@/components/console/form-atoms"
import type { ProvRemark, ProvRemarkSeverity } from "@/lib/console-data"

/** A single technical-review remark, with an optional "mark resolved" action. */
export function RemarkCard({
  r,
  canResolve,
  onResolve,
}: {
  r: ProvRemark
  canResolve: boolean
  onResolve: () => void
}) {
  const resolved = r.status === "resolved"
  return (
    <div
      className={cn(
        "flex gap-2.5 p-3.5",
        resolved
          ? "opacity-70"
          : r.severity === "action" && "bg-warning-subtle/35"
      )}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-[10.5px] font-bold text-primary">
        {r.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-[12.5px]">{r.by}</b>
          <span className="mono text-[11px] text-muted-foreground">{r.when}</span>
          <span
            className={cn(
              "rounded-[5px] px-1.5 py-0.5 text-[9.5px] font-semibold tracking-wide uppercase",
              r.severity === "action"
                ? "bg-warning-subtle text-warning-subtle-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {r.severity === "action" ? "Action required" : "Note"}
          </span>
          {resolved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
              <CheckCircle2Icon className="size-3" />
              Resolved
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed">{r.text}</p>
        {!resolved && canResolve && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={onResolve}
          >
            <CheckIcon data-icon="inline-start" />
            Mark resolved
          </Button>
        )}
      </div>
    </div>
  )
}

/** Composer for a Technical Reviewer to leave a remark on the active section. */
export function RemarkComposer({
  sectionLabel,
  onAdd,
}: {
  sectionLabel: string
  onAdd: (text: string, severity: ProvRemarkSeverity) => void
}) {
  const [text, setText] = React.useState("")
  const [sev, setSev] = React.useState<ProvRemarkSeverity>("action")
  return (
    <div className="rounded-xl border border-dashed border-input bg-muted/30 p-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-[12.5px]">
        <MessageSquareIcon className="size-3.5" />
        Leave a remark on <b>{sectionLabel}</b>
      </div>
      <Textarea
        rows={2}
        placeholder="What should the engineer check or fix in this section?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-2.5 flex items-center gap-2">
        <Seg
          value={sev}
          onChange={(v) => setSev(v as ProvRemarkSeverity)}
          options={[
            { v: "action", l: "Action required" },
            { v: "note", l: "Note" },
          ]}
        />
        <span className="flex-1" />
        <Button
          size="sm"
          disabled={text.trim().length < 3}
          onClick={() => {
            onAdd(text.trim(), sev)
            setText("")
          }}
        >
          <FlagIcon data-icon="inline-start" />
          Add remark
        </Button>
      </div>
    </div>
  )
}
