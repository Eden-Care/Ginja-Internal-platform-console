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
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="grid size-[26px] shrink-0 place-items-center rounded-md bg-primary/10 text-primary [&>svg]:size-[16px]">
            <Glyph name={value} />
          </span>
          <span className="mono flex-1 truncate text-[12.5px]">{value}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-2">
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-input px-2.5">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search icons…"
            className="h-8 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-6 gap-1">
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
                "grid aspect-square place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-muted [&>svg]:size-[18px]",
                value === n
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-transparent"
              )}
            >
              <Glyph name={n} />
            </button>
          ))}
          {list.length === 0 ? (
            <div className="col-span-6 px-2 py-3 text-center text-[12px] text-muted-foreground">
              No icons match.
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
