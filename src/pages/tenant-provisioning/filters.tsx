import {
  CheckIcon,
  ChevronDownIcon,
  LayersIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StaffAvatar } from "@/components/console/avatar-initials"
import { PROV_STAGE_TONE, type ProvStage, type Staff } from "@/lib/console-data"
import { TonePill } from "./components"

const triggerCls = (active: boolean) =>
  cn(
    "inline-flex h-[38px] items-center gap-2 rounded-lg border bg-card px-3 text-[12.5px] font-semibold transition-colors",
    active ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
  )

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-md border-[1.5px]",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input"
      )}
    >
      {on && <CheckIcon className="size-3" />}
    </span>
  )
}

function MenuHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </div>
  )
}

function ClearRow({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="flex w-full items-center gap-2.5 border-t px-3 py-2 text-left text-[12.5px] font-semibold text-muted-foreground hover:bg-muted"
    >
      <span className="grid size-[18px] place-items-center rounded-full border border-dashed border-input">
        <XIcon className="size-3" />
      </span>
      Clear selection
    </button>
  )
}

/** Multi-select engineer filter for the admin queue. */
export function EngMultiSelect({
  engineers,
  sel,
  onToggle,
  onClear,
  count,
}: {
  engineers: Staff[]
  sel: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  count: (id: string) => number
}) {
  const picked = engineers.filter((e) => sel.has(e.id))
  return (
    <Popover>
      <PopoverTrigger className={triggerCls(sel.size > 0)}>
        <UsersIcon className="size-3.5" />
        {sel.size === 0 ? (
          <span>All engineers</span>
        ) : (
          <>
            <span className="flex items-center">
              {picked.slice(0, 3).map((e, i) => (
                <StaffAvatar
                  key={e.id}
                  id={e.id}
                  size="sm"
                  className={cn("ring-2 ring-card", i > 0 && "-ml-1.5")}
                />
              ))}
            </span>
            <span>
              {sel.size === 1
                ? picked[0].name.split(" ")[0]
                : `${sel.size} engineers`}
            </span>
          </>
        )}
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-0">
        <MenuHead>Filter by engineer · multi-select</MenuHead>
        <div className="pb-1">
          {engineers.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => onToggle(e.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
            >
              <Check on={sel.has(e.id)} />
              <StaffAvatar id={e.id} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{e.name}</span>
                <span className="block text-[11.5px] text-muted-foreground">
                  {count(e.id)} assigned
                </span>
              </span>
            </button>
          ))}
        </div>
        {sel.size > 0 && <ClearRow onClear={onClear} />}
      </PopoverContent>
    </Popover>
  )
}

/** Multi-select provisioning-stage filter. */
export function StageMultiSelect({
  stages,
  sel,
  onToggle,
  onClear,
  count,
}: {
  stages: ProvStage[]
  sel: Set<ProvStage>
  onToggle: (s: ProvStage) => void
  onClear: () => void
  count: (s: ProvStage) => number
}) {
  return (
    <Popover>
      <PopoverTrigger className={triggerCls(sel.size > 0)}>
        <LayersIcon className="size-3.5" />
        <span>
          {sel.size === 0
            ? "All stages"
            : sel.size === 1
              ? [...sel][0]
              : `${sel.size} stages`}
        </span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[250px] p-0">
        <MenuHead>Filter by stage · multi-select</MenuHead>
        <div className="pb-1">
          {stages.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
            >
              <Check on={sel.has(s)} />
              <span className="pointer-events-none">
                <TonePill tone={PROV_STAGE_TONE[s]}>{s}</TonePill>
              </span>
              <span className="ml-auto text-[12px] text-muted-foreground">
                {count(s)}
              </span>
            </button>
          ))}
        </div>
        {sel.size > 0 && <ClearRow onClear={onClear} />}
      </PopoverContent>
    </Popover>
  )
}
