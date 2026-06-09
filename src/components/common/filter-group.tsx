import { Check, PlusCircleIcon } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroupProps {
  type: string
  options: FilterOption[]
  selected: string[]
  onSelect: (value: string) => void
}

export function FilterGroup({
  type,
  options,
  selected,
  onSelect,
}: FilterGroupProps) {
  const [open, setOpen] = useState(false)

  const handleSelectedClick = () => {
    setOpen(true) // Open the dropdown instead of directly removing
  }

  const handleClearFilters = () => {
    // Clear all selected filters for this group
    selected.forEach((value) => onSelect(value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="inline-flex items-center rounded-lg border border-dashed border-gray-200 bg-white p-1 shadow-sm">
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:text-gray-900">
            <PlusCircleIcon className="h-4 w-4" />
            {type}
          </button>
        </PopoverTrigger>
        {selected.map((value) => (
          <button
            key={value}
            onClick={() => handleSelectedClick()}
            className="ml-1 rounded-md bg-gray-100/80 px-3 py-1.5 text-sm font-medium"
          >
            {options.find((opt) => opt.value === value)?.label || value}
          </button>
        ))}
      </div>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${type.toLowerCase()}...`}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onSelect(option.value)
                      // Don't close the dropdown when selecting/deselecting
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span className="ml-2">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.length > 0 && (
              <div className="border-t border-gray-100">
                <CommandItem
                  onSelect={handleClearFilters}
                  className="justify-center text-sm text-gray-500 hover:text-gray-900"
                >
                  Clear filters
                </CommandItem>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
