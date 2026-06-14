import {
  CheckIcon,
  ChevronDownIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StaffAvatar } from "@/components/console/avatar-initials"
import { STAFF_BY_ID } from "@/lib/console-data"

/** Section owner picker — choose a teammate from the draft's team (or clear). */
export function OwnerSelect({
  value,
  team,
  onChange,
}: {
  value: string | null
  team: string[]
  onChange: (id: string | null) => void
}) {
  const cur = value ? STAFF_BY_ID[value] : null
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex w-[196px] items-center gap-2 rounded-[9px] border bg-card px-2.5 py-1.5 transition-colors hover:border-primary/50",
          cur ? "border-input" : "border-dashed border-input"
        )}
      >
        {cur ? (
          <>
            <StaffAvatar id={cur.id} size="sm" />
            <span className="truncate text-[12.5px] font-medium">
              {cur.name}
            </span>
          </>
        ) : (
          <>
            <span className="grid size-[22px] shrink-0 place-items-center rounded-full border border-dashed border-input bg-muted text-muted-foreground">
              <UserPlusIcon className="size-3" />
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              Unassigned
            </span>
          </>
        )}
        <ChevronDownIcon className="ml-auto size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[240px] p-0">
        <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Assign to a teammate
        </div>
        {team.length === 0 && (
          <div className="px-3 py-1.5 text-xs text-muted-foreground">
            Add teammates first.
          </div>
        )}
        <div className="pb-1">
          {team.map((id) => {
            const p = STAFF_BY_ID[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
              >
                <StaffAvatar id={id} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold">
                    {p.name}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    {p.role}
                  </span>
                </span>
                {value === id && (
                  <CheckIcon className="size-3.5 text-primary" />
                )}
              </button>
            )
          })}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex w-full items-center gap-2.5 border-t px-3 py-2 text-left text-[12.5px] font-semibold text-muted-foreground hover:bg-muted"
          >
            <span className="grid size-[22px] place-items-center rounded-full border border-dashed border-input">
              <XIcon className="size-3" />
            </span>
            Clear assignment
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
