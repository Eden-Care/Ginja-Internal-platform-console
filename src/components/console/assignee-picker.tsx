import { CheckIcon, ChevronDownIcon } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ONB_TEAM, ONB_TEAM_KEYS, type OnbTeamKey } from "@/lib/console-data"
import { MiniAvatar } from "@/components/console/avatar-initials"

/** "Section owner" picker — assigns a section to a Ginja staff member. */
export function AssigneePicker({
  value,
  onChange,
}: {
  value: OnbTeamKey
  onChange: (key: OnbTeamKey) => void
}) {
  const cur = ONB_TEAM[value]
  return (
    <div className="shrink-0">
      <div className="eyebrow mb-1.5 text-[10px]">Section owner</div>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex w-56 items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-muted">
            <MiniAvatar initials={cur.initials} />
            <span className="flex min-w-0 flex-col leading-tight">
              <b className="truncate text-[13px] font-semibold">{cur.name}</b>
              <span className="truncate text-[11px] text-muted-foreground">
                {cur.role}
              </span>
            </span>
            <ChevronDownIcon className="ml-auto size-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-1.5">
          <div className="eyebrow px-2 py-1.5 text-[10px]">
            Assign this section to
          </div>
          {ONB_TEAM_KEYS.map((k) => {
            const m = ONB_TEAM[k]
            const on = value === k
            return (
              <button
                key={k}
                onClick={() => onChange(k)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted",
                  on && "bg-muted"
                )}
              >
                <MiniAvatar initials={m.initials} />
                <span className="flex min-w-0 flex-col leading-tight">
                  <b className="truncate text-[13px] font-semibold">{m.name}</b>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {m.role}
                  </span>
                </span>
                {on && <CheckIcon className="ml-auto size-3.5 text-primary" />}
              </button>
            )
          })}
        </PopoverContent>
      </Popover>
    </div>
  )
}
