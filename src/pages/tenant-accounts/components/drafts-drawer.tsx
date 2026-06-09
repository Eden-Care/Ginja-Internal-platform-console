import * as React from "react"
import {
  ArrowRightIcon,
  Building2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  GitBranchIcon,
  LayersIcon,
  type LucideIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  ONB_DRAFTS,
  ONB_SECTIONS,
  ONB_TEAM,
  onbDone,
  type OnbDraft,
  type SecStatus,
} from "@/lib/console-data"
import {
  AvatarInitials,
  MiniAvatar,
} from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { SegTrack } from "@/components/console/seg-track"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

export type DrawerView = { mode: "list" } | { mode: "detail"; id: string }

const SECTION_ICON: Record<string, LucideIcon> = {
  building: Building2Icon,
  gitBranch: GitBranchIcon,
  server: ServerIcon,
  layers: LayersIcon,
  creditCard: CreditCardIcon,
  fileText: FileTextIcon,
}

const SEC_BADGE: Record<
  SecStatus,
  { tone: "success" | "warning" | "neutral"; label: string }
> = {
  complete: { tone: "success", label: "Complete" },
  progress: { tone: "warning", label: "In progress" },
  empty: { tone: "neutral", label: "Not started" },
}

export function DraftsDrawer({
  view,
  onChangeView,
  onClose,
  onResume,
}: {
  view: DrawerView | null
  onChangeView: (v: DrawerView) => void
  onClose: () => void
  onResume: (draft: OnbDraft, section?: string) => void
}) {
  const [q, setQ] = React.useState("")
  const detail =
    view?.mode === "detail" ? ONB_DRAFTS.find((d) => d.id === view.id) : null

  const list = ONB_DRAFTS.filter(
    (d) =>
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.id.toLowerCase().includes(q.toLowerCase()) ||
      d.country.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <Sheet open={!!view} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[580px]"
      >
        {!detail ? (
          <>
            <div className="border-b p-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                  <ClockIcon className="size-[18px]" />
                </span>
                <div>
                  <SheetTitle className="text-base font-bold">
                    Onboarding drafts
                  </SheetTitle>
                  <div className="text-xs text-muted-foreground">
                    {ONB_DRAFTS.length} tenant submissions in progress
                  </div>
                </div>
              </div>
              <InputGroup className="mt-3.5">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search drafts by name, ID or country…"
                />
              </InputGroup>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-4">
              {list.map((d) => {
                const done = onbDone(d)
                const total = ONB_SECTIONS.length
                const pct = Math.round((done / total) * 100)
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChangeView({ mode: "detail", id: d.id })}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <AvatarInitials name={d.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold">
                          {d.name}
                        </span>
                        <span className="text-[11.5px] text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="mono mb-1.5 truncate text-[11.5px] text-muted-foreground">
                        {d.id} · {d.country} · {d.type}
                      </div>
                      <SegTrack sections={d.sections} />
                    </div>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
              {list.length === 0 ? (
                <Note tone="info" icon={<SearchIcon />}>
                  No drafts match “{q}”.
                </Note>
              ) : null}
            </div>
          </>
        ) : (
          <DraftDetail
            draft={detail}
            onBack={() => onChangeView({ mode: "list" })}
            onClose={onClose}
            onResume={onResume}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DraftDetail({
  draft,
  onBack,
  onClose,
  onResume,
}: {
  draft: OnbDraft
  onBack: () => void
  onClose: () => void
  onResume: (draft: OnbDraft, section?: string) => void
}) {
  const done = onbDone(draft)
  const total = ONB_SECTIONS.length
  const pct = Math.round((done / total) * 100)

  return (
    <>
      <div className="border-b p-5">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-1.5"
          onClick={onBack}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          All drafts
        </Button>
        <div className="flex items-center gap-3">
          <AvatarInitials
            name={draft.name}
            className="size-10 rounded-xl text-sm"
          />
          <div>
            <SheetTitle className="text-base font-bold">
              {draft.name}
            </SheetTitle>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="mono text-xs text-muted-foreground">
                {draft.id}
              </span>
              <Tagpill className="text-[10.5px]">{draft.type}</Tagpill>
              <span className="text-xs text-muted-foreground">
                {draft.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto p-5">
        <div className="rounded-xl border bg-muted/30 p-3.5">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">Overall progress</span>
            <span className="mono text-[13px]">
              <b>{pct}%</b>{" "}
              <span className="text-muted-foreground">
                · {done}/{total} sections
              </span>
            </span>
          </div>
          <SegTrack sections={draft.sections} />
        </div>

        <Note tone="warn" icon={<ClockIcon />}>
          Currently waiting on <b>{draft.waiting}</b>. Assign or resume the
          pending sections below to move this submission forward.
        </Note>

        <div>
          <div className="eyebrow mb-2.5 text-[10.5px]">
            Sections · {done} of {total} complete
          </div>
          <div className="flex flex-col gap-2">
            {ONB_SECTIONS.map((s) => {
              const st = draft.sections[s.k]
              const owner = ONB_TEAM[s.owner]
              const Ico = SECTION_ICON[s.icon] ?? Building2Icon
              const badge = SEC_BADGE[st]
              return (
                <div
                  key={s.k}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Ico className="size-[15px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{s.l}</span>
                      <MiniBadge tone={badge.tone}>{badge.label}</MiniBadge>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <MiniAvatar initials={owner.initials} />
                      {owner.name}
                      <span className="text-muted-foreground/50">·</span>
                      Edited {draft.edited[s.k]}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResume(draft, s.l)}
                  >
                    {st === "empty"
                      ? "Start"
                      : st === "complete"
                        ? "Review"
                        : "Continue"}
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t p-4">
        <span className="flex-1 text-[11.5px] text-muted-foreground">
          Started {draft.started} · updated {draft.updated}
        </span>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => onResume(draft)}>
          Resume onboarding
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </>
  )
}
