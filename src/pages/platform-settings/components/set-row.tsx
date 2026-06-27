import * as React from "react"

/** A single labelled setting row: title + description left, control right. */
export function SetRow({
  title,
  desc,
  children,
}: {
  title: React.ReactNode
  desc: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3.5 border-b py-[15px] last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-0.5 max-w-[60ch] text-xs text-muted-foreground">
          {desc}
        </div>
      </div>
      <div className="ml-auto shrink-0">{children}</div>
    </div>
  )
}
