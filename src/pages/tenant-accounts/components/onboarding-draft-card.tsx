import { ClockIcon } from "lucide-react"

import {
  ONB_SECTIONS,
  ONB_TEAM,
  onbDone,
  type OnbDraft,
} from "@/lib/console-data"
import {
  AvatarInitials,
  AvatarStack,
} from "@/components/console/avatar-initials"
import { SegTrack } from "@/components/console/seg-track"

/** A single resumable onboarding-draft card. */
export function OnboardingDraftCard({
  draft,
  onOpen,
}: {
  draft: OnbDraft
  onOpen: () => void
}) {
  const done = onbDone(draft)
  const total = ONB_SECTIONS.length
  const pct = Math.round((done / total) * 100)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-center gap-3">
        <AvatarInitials name={draft.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{draft.name}</div>
          <div className="mono truncate text-[11.5px] text-muted-foreground">
            {draft.id} · {draft.country}
          </div>
        </div>
        <div className="text-right">
          <b className="mono text-[15px] font-bold">{pct}%</b>
          <div className="text-[11px] text-muted-foreground">
            {done}/{total}
          </div>
        </div>
      </div>

      <SegTrack sections={draft.sections} />

      <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <ClockIcon className="size-3 shrink-0" />
        <span className="truncate">
          Waiting on{" "}
          <b className="font-semibold text-foreground">{draft.waiting}</b>
        </span>
        <span className="ml-auto shrink-0">
          <AvatarStack
            items={draft.team.map((k) => ONB_TEAM[k].initials)}
            title="Assigned owners"
          />
        </span>
      </div>
    </button>
  )
}
