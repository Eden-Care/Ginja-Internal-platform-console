import * as React from "react"

import { cn } from "@/lib/utils"
import type { EmailDiffSegment } from "@/features/email-templates/types"

/**
 * Renders one side of a server-computed diff (git-style). The /compare API
 * returns word-by-word segments (EQUAL / DELETE / INSERT); we show the half that
 * belongs to a side:
 * - old side (`from`): EQUAL (plain) + DELETE (red, strike-through)
 * - new side (`to`):   EQUAL (plain) + INSERT (green)
 * Mirrors the hi-fi `DiffText` styling.
 */
export function DiffSegments({
  segments,
  side,
}: {
  segments: EmailDiffSegment[]
  side: "old" | "new"
}) {
  const drop = side === "old" ? "INSERT" : "DELETE"
  const mark = side === "old" ? "DELETE" : "INSERT"
  const visible = segments.filter((s) => s.op !== drop)
  return (
    <div className="rounded-lg border bg-muted/40 p-2.5 font-mono text-[12.5px] leading-[1.6] whitespace-pre-wrap text-foreground">
      {visible.length === 0 ? (
        <span className="text-muted-foreground">— none —</span>
      ) : (
        visible.map((s, i) =>
          s.op === mark ? (
            <span
              key={i}
              className={cn(
                "rounded-[3px]",
                side === "old"
                  ? "bg-destructive/[0.18] text-destructive line-through"
                  : "bg-success/[0.22] text-success-subtle-foreground"
              )}
            >
              {s.text}
            </span>
          ) : (
            <React.Fragment key={i}>{s.text}</React.Fragment>
          )
        )
      )}
    </div>
  )
}
