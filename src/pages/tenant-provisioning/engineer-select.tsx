import * as React from "react"
import { CheckIcon } from "lucide-react"

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

/** A pickable engineer (assign API takes id/email; we send email). */
export type EngineerOption = {
  email: string
  name: string
  roleLabel: string | null
}

/** Members eligible to own provisioning = those with the PLATFORM_ENGINEER role. */
export function engineerOptions(members: Member[]): EngineerOption[] {
  return members
    .filter((m) => m.roles.some((r) => r.name === "PLATFORM_ENGINEER"))
    .map((m) => ({
      email: m.email,
      name: m.name || m.email,
      roleLabel: m.roles[0]?.name ?? null,
    }))
}

/**
 * Admin-only "assign provisioning to a Platform Engineer" combobox. Assignment is
 * additive (there's no unassign endpoint), so there's no clear action. The caller
 * supplies the trigger so it can render compactly in a table cell or as a button.
 */
export function EngineerSelect({
  value,
  engineers,
  onAssign,
  disabled,
  trigger,
}: {
  /** Current assignee (id/email) — used to mark the active row. */
  value: string | null
  engineers: EngineerOption[]
  onAssign: (email: string) => void
  disabled?: boolean
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const pick = (email: string) => {
    onAssign(email)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search engineers…" className="h-9" />
          <CommandList>
            <CommandEmpty>No platform engineers found.</CommandEmpty>
            <CommandGroup heading="Assign a Platform Engineer">
              {engineers.map((e) => (
                <CommandItem
                  key={e.email}
                  value={`${e.name} ${e.email}`}
                  onSelect={() => pick(e.email)}
                  className="gap-2.5"
                >
                  <AssigneeAvatar name={e.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">
                      {e.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {e.roleLabel ?? "Engineer"}
                    </span>
                  </span>
                  {value && value.toLowerCase() === e.email.toLowerCase() && (
                    <CheckIcon className="size-3.5 shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
