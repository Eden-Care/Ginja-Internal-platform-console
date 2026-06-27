import * as React from "react"
import { CheckIcon, ChevronDownIcon, UserPlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import type { Member } from "@/features/access/types"

export type OwnerOption = {
  email: string
  name: string
  roleLabel: string | null
}

/** Map a platform Member to the picker's display option (email is the key the
   assign API takes; roleLabel is the member's first role, if any). */
export function toOwnerOption(m: Member): OwnerOption {
  return {
    email: m.email,
    name: m.name || m.email,
    roleLabel: m.roles?.[0]?.name ?? null,
  }
}

/** Section owner picker — a searchable combobox over the team (or clear). */
export function OwnerSelect({
  value,
  team,
  onChange,
}: {
  value: string | null
  team: OwnerOption[]
  onChange: (email: string | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const cur = value ? team.find((t) => t.email === value) ?? null : null

  const pick = (email: string | null) => {
    onChange(email)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex w-[196px] items-center gap-2 rounded-[9px] border bg-card px-2.5 py-1.5 transition-colors hover:border-primary/50",
          cur ? "border-input" : "border-dashed border-input"
        )}
      >
        {cur ? (
          <>
            <AssigneeAvatar name={cur.name} size="sm" />
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
      <PopoverContent align="end" className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search teammates…" className="h-9" />
          <CommandList>
            <CommandEmpty>No teammates found.</CommandEmpty>
            <CommandGroup heading="Assign to a teammate">
              {team.map((t) => (
                <CommandItem
                  key={t.email}
                  // Searchable text: name, email and role all match the query.
                  value={`${t.name} ${t.email} ${t.roleLabel ?? ""}`}
                  onSelect={() => pick(t.email)}
                  className="gap-2.5"
                >
                  <AssigneeAvatar name={t.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {t.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {t.roleLabel ?? "Member"}
                    </span>
                  </span>
                  {value === t.email && (
                    <CheckIcon className="size-3.5 shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {value && (
          <button
            type="button"
            onClick={() => pick(null)}
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
