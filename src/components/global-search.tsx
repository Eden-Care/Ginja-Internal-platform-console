import * as React from "react"
import { useNavigate } from "react-router-dom"
import { SearchIcon } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { navGroups } from "@/components/app-sidebar"
import { useAccess } from "@/contexts/access-context"
import { PAYERS } from "@/lib/console-data"
import { cn } from "@/lib/utils"

/**
 * Header global search — a ⌘K command palette.
 *
 * The trigger looks like a search field; clicking it or pressing ⌘K / Ctrl+K
 * opens a dialog that searches across pages (gated by the current role, same
 * as the sidebar) and tenants, navigating on select.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { hasPermission } = useAccess()
  const [open, setOpen] = React.useState(false)
  const [isMac] = React.useState(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad/.test(navigator.userAgent)
  )

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const pages = navGroups
    .flatMap((group) => group.items)
    .filter((item) => hasPermission(item.permId))

  const go = (url: string) => {
    setOpen(false)
    navigate(url)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          className
        )}
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">
          Search tenants, modules, templates…
        </span>
        <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search across pages and tenants"
      >
        <CommandInput placeholder="Search pages and tenants…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((item) => (
              <CommandItem
                key={item.url}
                value={`${item.title} ${item.url}`}
                onSelect={() => go(item.url)}
              >
                <item.icon />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Tenants">
            {PAYERS.map((payer) => (
              <CommandItem
                key={payer.id}
                value={`${payer.name} ${payer.id} ${payer.country}`}
                onSelect={() => go("/tenant-accounts")}
              >
                <span className="truncate">{payer.name}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {payer.id} · {payer.country}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
