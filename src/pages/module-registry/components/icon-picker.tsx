import * as React from "react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Glyph, GLYPH_NAMES } from "@/components/console/glyph"

/** A popover icon picker over the app's Glyph set. Mirrors the hi-fi `IconPicker`. */
export function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (name: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const list = GLYPH_NAMES.filter((n) =>
    n.toLowerCase().includes(q.trim().toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-[38px] w-full items-center gap-[9px] rounded-[8px] border border-input bg-transparent px-[11px] text-left transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-primary/[0.12] text-primary [&>svg]:size-[18px]">
            <Glyph name={value} />
          </span>
          <span className="mono flex-1 truncate text-[12.5px]">{value}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] rounded-[11px] p-[11px]">
        <div className="mb-2 flex items-center gap-2 rounded-[8px] border border-input px-2.5">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search icons…"
            className="h-8 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid max-h-[180px] grid-cols-7 gap-1 overflow-y-auto">
          {list.map((n) => (
            <button
              key={n}
              type="button"
              title={n}
              onClick={() => {
                onChange(n)
                setOpen(false)
                setQ("")
              }}
              className={cn(
                "grid aspect-square place-items-center rounded-[8px] border text-muted-foreground transition-colors hover:bg-muted/40 [&>svg]:size-[18px]",
                value === n
                  ? "border-primary bg-primary/[0.15] text-primary"
                  : "border-transparent"
              )}
            >
              <Glyph name={n} />
            </button>
          ))}
          {list.length === 0 ? (
            <div className="col-span-7 px-2 py-3 text-center text-[12px] text-muted-foreground">
              No icons match.
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
