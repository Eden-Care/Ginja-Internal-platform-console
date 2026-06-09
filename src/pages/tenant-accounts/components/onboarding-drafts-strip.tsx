import { ArrowRightIcon, ClockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ONB_DRAFTS } from "@/lib/console-data"
import { Panel } from "@/components/console/panel"
import { SegLegend } from "@/components/console/seg-track"
import { Tagpill } from "@/components/console/tagpill"
import { OnboardingDraftCard } from "./onboarding-draft-card"

const VISIBLE = 3

/** "Onboarding drafts in progress" strip: header + first 3 cards + "+N more". */
export function OnboardingDraftsStrip({
  onOpenDraft,
  onViewAll,
}: {
  onOpenDraft: (id: string) => void
  onViewAll: () => void
}) {
  const drafts = ONB_DRAFTS
  const extra = drafts.length - VISIBLE

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-[18px] py-[15px]">
        <ClockIcon className="size-[15px] text-muted-foreground" />
        <h3 className="text-sm font-semibold">Onboarding drafts in progress</h3>
        <Tagpill>{drafts.length}</Tagpill>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:block">
            <SegLegend />
          </span>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all ({drafts.length})
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 p-[18px] sm:grid-cols-2 xl:grid-cols-3">
        {drafts.slice(0, VISIBLE).map((d) => (
          <OnboardingDraftCard
            key={d.id}
            draft={d}
            onOpen={() => onOpenDraft(d.id)}
          />
        ))}
        {extra > 0 ? (
          <button
            type="button"
            onClick={onViewAll}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/30 p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
          >
            <div className="mono text-2xl font-bold text-primary">+{extra}</div>
            <div className="text-xs text-muted-foreground">
              more in progress
            </div>
            <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-primary">
              View all
              <ArrowRightIcon className="size-3.5" />
            </div>
          </button>
        ) : null}
      </div>
    </Panel>
  )
}
