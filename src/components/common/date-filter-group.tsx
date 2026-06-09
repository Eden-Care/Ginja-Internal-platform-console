import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, PlusCircleIcon } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type DateOption = {
  value: string
  label: string
  icon: typeof CalendarIcon
}

const dateOptions: DateOption[] = [
  {
    value: "last7days",
    label: "Last 7 days",
    icon: CalendarIcon,
  },
  {
    value: "lastMonth",
    label: "Last one month",
    icon: CalendarIcon,
  },
  {
    value: "dateRange",
    label: "Date Range",
    icon: CalendarIcon,
  },
]

interface DateFilterGroupProps {
  selected: string
  dateRange: DateRange | null
  onOptionSelect: (value: string) => void
  onDateRangeChange: (range: DateRange | null) => void
}

export function DateFilterGroup({
  selected,
  dateRange,
  onOptionSelect,
  onDateRangeChange,
}: DateFilterGroupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleClearFilter = () => {
    onOptionSelect("")
    onDateRangeChange(null)
    setIsOpen(false)
  }

  const handleSelectedClick = () => {
    setIsOpen(true)
  }

  const getDisplayText = () => {
    if (selected === "last7days") return "Last 7 days"
    if (selected === "lastMonth") return "Last one month"
    if (dateRange) {
      return `${format(dateRange.from!, "LLL dd, y")} - ${
        dateRange.to ? format(dateRange.to, "LLL dd, y") : "..."
      }`
    }
    return null
  }

  const displayText = getDisplayText()

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div className="inline-flex items-center rounded-lg border border-dashed border-gray-200 bg-white p-1 shadow-sm">
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:text-gray-900">
              <PlusCircleIcon className="h-4 w-4" />
              Onboarded Date
            </button>
          </PopoverTrigger>
          {displayText && (
            <button
              onClick={handleSelectedClick}
              className="ml-1 rounded-md bg-gray-100/80 px-3 py-1.5 text-sm font-medium"
            >
              {displayText}
            </button>
          )}
        </div>

        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search date options..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {dateOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(value) => {
                      if (value === "dateRange") {
                        setShowDatePicker(true)
                      }
                      onOptionSelect(value)
                      setIsOpen(false)
                    }}
                  >
                    <option.icon
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.value === selected ? "opacity-100" : "opacity-40"
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {(selected || dateRange) && (
                <div className="border-t border-gray-100">
                  <CommandItem
                    onSelect={handleClearFilter}
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

      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange || undefined}
              onSelect={(range) => {
                onDateRangeChange(range || null)
                if (range?.to) {
                  setShowDatePicker(false)
                }
              }}
              numberOfMonths={2}
              className="flex space-x-4"
            />
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                onDateRangeChange(null)
                setShowDatePicker(false)
              }}
              className="text-destructive hover:text-destructive"
            >
              Clear Dates
            </Button>
            <Button variant="outline" onClick={() => setShowDatePicker(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
