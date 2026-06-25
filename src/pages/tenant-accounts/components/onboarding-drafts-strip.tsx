import * as React from "react"
import {
  ArrowRightIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  ClockIcon,
  UserPlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { DraftAssignee, DraftVM } from "@/features/payers/draft-vm"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/console/panel"
import { SegLegend } from "@/components/console/seg-track"
import { Tagpill } from "@/components/console/tagpill"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import { OnboardingDraftCard } from "./onboarding-draft-card"

/** Matches the `xl:grid-cols-3` breakpoint below — the width where the grid is 3 wide. */
const XL_BREAKPOINT = 1280

/** Max staff avatars shown in the collapsed snapshot before a "+N" overflow. */
const SNAPSHOT_AVATARS = 6

/** True once the drafts grid is 3 columns wide (Tailwind `xl`). */
function useIsThreeCol() {
  const [threeCol, setThreeCol] = React.useState(
    () => window.innerWidth >= XL_BREAKPOINT
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`)
    const onChange = () => setThreeCol(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return threeCol
}

/** Unique assignees across a set of drafts, in first-seen order. */
function uniqueTeam(drafts: DraftVM[]): DraftAssignee[] {
  const seen = new Set<string>()
  const out: DraftAssignee[] = []
  for (const d of drafts) {
    for (const a of d.team) {
      if (!seen.has(a.email)) {
        seen.add(a.email)
        out.push(a)
      }
    }
  }
  return out
}

/** "Onboarding drafts in progress" strip: collapsible header + cards (or a snapshot when collapsed). */
export function OnboardingDraftsStrip({
  drafts,
  onOpenDraft,
  onViewAll,
  onManageTeam,
}: {
  drafts: DraftVM[]
  onOpenDraft: (payerId: number) => void
  onViewAll: () => void
  onManageTeam: (payerId: number) => void
}) {
  const threeCol = useIsThreeCol()
  const [collapsed, setCollapsed] = React.useState(false)

  // On the 3-col layout, show 2 drafts so the "View all" card completes the row
  // instead of sitting alone below it. On the 2-col layout 3 drafts + the card
  // fill two full rows. Only trim when there are extra drafts to fold into the card
  // (≤3 drafts has no "View all" card, so let all of them fill the row).
  const visible = threeCol && drafts.length > 3 ? 2 : 3
  const extra = drafts.length - visible

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-[18px] py-[15px]">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand drafts" : "Collapse drafts"}
          className="-m-1 flex items-center gap-3 rounded-md p-1 text-left transition-colors hover:text-primary"
        >
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              collapsed && "-rotate-90"
            )}
          />
          <ClockIcon className="size-[15px] text-muted-foreground" />
          <h3 className="text-sm font-semibold">Onboarding drafts in progress</h3>
          <Tagpill>{drafts.length}</Tagpill>
        </button>
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

      {collapsed ? (
        <DraftsSnapshot drafts={drafts} />
      ) : (
        <div className="grid gap-3 p-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {drafts.slice(0, visible).map((d) => (
            <OnboardingDraftCard
              key={d.payerId}
              draft={d}
              onOpen={() => onOpenDraft(d.payerId)}
              onManageTeam={() => onManageTeam(d.payerId)}
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
      )}
    </Panel>
  )
}

/** At-a-glance roll-up shown when the strip is collapsed: overall progress, what needs
 *  attention, and everyone on the drafts — no need to expand the full card grid. */
function DraftsSnapshot({ drafts }: { drafts: DraftVM[] }) {
  // Aggregate section status across every draft (mirrors the per-card SegTrack tones).
  const counts = drafts.reduce(
    (acc, d) => {
      d.sections.forEach((s) => {
        if (s.status === "complete") acc.complete += 1
        else if (s.status === "progress") acc.progress += 1
        else acc.empty += 1
      })
      return acc
    },
    { complete: 0, progress: 0, empty: 0 }
  )
  const totalSections = drafts.reduce((n, d) => n + d.sections.length, 0)
  const pct = (n: number) => (totalSections ? (n / totalSections) * 100 : 0)
  const donePct = Math.round(pct(counts.complete))

  const needsAssignment = drafts.filter((d) => d.unassigned.length > 0).length
  const team = uniqueTeam(drafts)

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-[18px] py-4">
      <div className="flex items-center gap-3">
        <b className="mono text-[22px] leading-none font-bold">{donePct}%</b>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium text-muted-foreground">
            Overall · {counts.complete}/{totalSections} sections complete
          </span>
          <div className="flex h-[7px] w-40 overflow-hidden rounded-full bg-muted-foreground/20">
            <span
              className="h-full bg-success"
              style={{ width: `${pct(counts.complete)}%` }}
            />
            <span
              className="h-full bg-warning"
              style={{ width: `${pct(counts.progress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-[12.5px]">
        {needsAssignment > 0 ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-warning-subtle-foreground">
            <UserPlusIcon className="size-3.5" />
            {needsAssignment} {needsAssignment === 1 ? "draft" : "drafts"} need
            assignment
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <CircleCheckIcon className="size-3.5 text-success" />
            All sections assigned
          </span>
        )}
      </div>

      {team.length > 0 ? (
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center">
            {team.slice(0, SNAPSHOT_AVATARS).map((a, i) => (
              <AssigneeAvatar
                key={a.email}
                name={a.name}
                size="sm"
                className={cn("ring-2 ring-card", i > 0 && "-ml-1.5")}
              />
            ))}
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            {team.length > SNAPSHOT_AVATARS
              ? `+${team.length - SNAPSHOT_AVATARS} more · `
              : ""}
            {team.length} staff
          </span>
        </div>
      ) : null}
    </div>
  )
}
