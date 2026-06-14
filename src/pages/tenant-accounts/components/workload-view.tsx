import { ChevronRightIcon, UsersIcon } from "lucide-react"
import { SheetTitle } from "@/components/ui/sheet"
import { AvatarInitials, StaffAvatar } from "@/components/console/avatar-initials"
import { ONB_SECTIONS, STAFF, type OnbDraft } from "@/lib/console-data"
import { RoleChip } from "./draft-shared"

/** Roster workload: who is assigned across in-progress onboardings. */
export function WorkloadView({
  drafts,
  onOpenDraft,
}: {
  drafts: OnbDraft[]
  onOpenDraft: (id: string) => void
}) {
  const active = STAFF.map((p) => {
    const items = drafts
      .map((d) => ({
        d,
        secs: ONB_SECTIONS.filter((s) => d.assign[s.k] === p.id),
      }))
      .filter((x) => x.secs.length)
    const totalSecs = items.reduce((n, x) => n + x.secs.length, 0)
    return { p, items, totalSecs }
  }).filter((x) => x.items.length)

  return (
    <>
      <div className="border-b p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
            <UsersIcon className="size-[18px]" />
          </span>
          <div>
            <SheetTitle className="text-base font-bold">
              Team workload
            </SheetTitle>
            <div className="text-xs text-muted-foreground">
              Who is assigned across in-progress onboardings
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto p-5">
        {active.map(({ p, items, totalSecs }) => (
          <div key={p.id} className="overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2.5 border-b bg-muted/50 px-3 py-2.5">
              <StaffAvatar id={p.id} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight">
                  {p.name}
                </div>
                <div className="mt-0.5">
                  <RoleChip role={p.role} />
                </div>
              </div>
              <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                {items.length} {items.length === 1 ? "tenant" : "tenants"} ·{" "}
                {totalSecs} sections
              </span>
            </div>
            <div className="flex flex-col divide-y">
              {items.map(({ d, secs }) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onOpenDraft(d.id)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50"
                >
                  <AvatarInitials
                    name={d.name}
                    className="size-[26px] rounded-md text-[10px]"
                  />
                  <span className="flex min-w-0 flex-col">
                    <b className="truncate text-[13px]">{d.name}</b>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {secs.map((s) => s.short).join(" · ")}
                    </span>
                  </span>
                  <ChevronRightIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
