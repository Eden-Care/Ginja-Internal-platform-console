import { ClockIcon, TriangleAlertIcon, UserPlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { DraftVM } from "@/features/payers/draft-vm"
import {
  AssigneeAvatar,
  AvatarInitials,
} from "@/components/console/avatar-initials"
import { SegTrack } from "@/components/console/seg-track"

/** A single resumable onboarding-draft card with a team / manage-team footer. */
export function OnboardingDraftCard({
  draft,
  onOpen,
  onManageTeam,
}: {
  draft: DraftVM
  onOpen: () => void
  onManageTeam: () => void
}) {
  const { team, unassigned } = draft

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        <AvatarInitials name={draft.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{draft.name}</div>
          <div className="mono truncate text-[11.5px] text-muted-foreground">
            {draft.code} · {draft.country}
          </div>
        </div>
        <div className="text-right">
          <b className="mono text-[15px] font-bold">
            {draft.stepsUnavailable ? "—" : `${draft.progressPct}%`}
          </b>
          <div className="text-[11px] text-muted-foreground">
            {draft.stepsUnavailable ? "" : `${draft.done}/${draft.total}`}
          </div>
        </div>
      </div>

      <SegTrack sections={draft.sectionStatus} />

      <div className="flex items-center gap-2 text-[11.5px]">
        {draft.stepsUnavailable ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <TriangleAlertIcon className="size-3 shrink-0" />
            Progress unavailable
          </span>
        ) : unassigned.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-warning-subtle-foreground">
            <UserPlusIcon className="size-3" />
            {unassigned.length} unassigned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <ClockIcon className="size-3 shrink-0" />
            Waiting on{" "}
            <b className="font-semibold text-foreground">{draft.waiting}</b>
          </span>
        )}
        <button
          type="button"
          title="Manage team"
          onClick={(e) => {
            e.stopPropagation()
            onManageTeam()
          }}
          className="group ml-auto flex items-center"
        >
          {team.map((a, i) => (
            <AssigneeAvatar
              key={a.email}
              name={a.name}
              size="sm"
              className={cn("ring-2 ring-card", i > 0 && "-ml-1.5")}
            />
          ))}
          <span className="-ml-1.5 grid size-6 place-items-center rounded-full border-2 border-dashed border-input bg-muted text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:bg-primary/12 group-hover:text-primary">
            <UserPlusIcon className="size-3" />
          </span>
        </button>
      </div>
    </div>
  )
}
