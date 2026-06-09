"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface CustomSearchProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function CustomSearch({
  placeholder = "Search...",
  value,
  onChange,
}: CustomSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}
