import { ChevronRightIcon, UsersIcon } from "lucide-react"

import { SheetTitle } from "@/components/ui/sheet"
import {
  AssigneeAvatar,
  AvatarInitials,
} from "@/components/console/avatar-initials"
import type {
  DraftAssignee,
  DraftSection,
  DraftVM,
} from "@/features/payers/draft-vm"

type WorkItem = { draft: DraftVM; secs: DraftSection[] }
type WorkRow = { assignee: DraftAssignee; items: WorkItem[]; totalSecs: number }

/** Roster workload: who is assigned across in-progress onboardings. */
export function WorkloadView({
  drafts,
  onOpenDraft,
}: {
  drafts: DraftVM[]
  onOpenDraft: (payerId: number) => void
}) {
  const byEmail = new Map<string, WorkRow>()
  for (const d of drafts) {
    for (const a of d.team) {
      const secs = d.sections.filter((s) => s.assignee?.email === a.email)
      if (!secs.length) continue
      const row = byEmail.get(a.email) ?? { assignee: a, items: [], totalSecs: 0 }
      row.items.push({ draft: d, secs })
      row.totalSecs += secs.length
      byEmail.set(a.email, row)
    }
  }
  const active = [...byEmail.values()]

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
        {active.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-[12.5px] text-muted-foreground">
            No teammates assigned to any draft yet.
          </div>
        ) : null}
        {active.map(({ assignee, items, totalSecs }) => (
          <div key={assignee.email} className="overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2.5 border-b bg-muted/50 px-3 py-2.5">
              <AssigneeAvatar name={assignee.name} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight">
                  {assignee.name}
                </div>
                <div className="mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-muted px-[7px] py-px text-[10px] font-semibold tracking-[0.02em] text-muted-foreground">
                    {assignee.roleLabel ?? "Member"}
                  </span>
                </div>
              </div>
              <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                {items.length} {items.length === 1 ? "tenant" : "tenants"} ·{" "}
                {totalSecs} sections
              </span>
            </div>
            <div className="flex flex-col divide-y">
              {items.map(({ draft, secs }) => (
                <button
                  key={draft.payerId}
                  type="button"
                  onClick={() => onOpenDraft(draft.payerId)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50"
                >
                  <AvatarInitials
                    name={draft.name}
                    className="size-[26px] rounded-md text-[10px]"
                  />
                  <span className="flex min-w-0 flex-col">
                    <b className="truncate text-[13px]">{draft.name}</b>
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
