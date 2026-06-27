import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { DraftSection, DraftVM } from "@/features/payers/draft-vm"
import type { SecStatus } from "@/lib/console-data"
import {
  AssigneeAvatar,
  AvatarInitials,
} from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { SegTrack } from "@/components/console/seg-track"
import { Seg } from "@/components/console/form-atoms"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { SEC_BADGE, SECTION_ICON } from "./draft-shared"
import { AssignTeamPanel } from "./assign-team-panel"
import { WorkloadView } from "./workload-view"

export type DrawerView =
  | { mode: "list" }
  | { mode: "detail"; payerId: number }
  | { mode: "team"; payerId: number }
  | { mode: "team-roster" }

const SEG_DOT: Record<SecStatus, string> = {
  complete: "bg-success",
  progress: "bg-warning",
  empty: "bg-muted-foreground/25",
}

const fmtAgo = (iso: string | null) =>
  iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "—"

/** A muted role pill for a resolved assignee (the member's platform role). */
function MemberRole({ label }: { label: string | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-[7px] py-px text-[10px] font-semibold tracking-[0.02em] text-muted-foreground">
      {label ?? "Member"}
    </span>
  )
}

export function DraftsDrawer({
  view,
  drafts,
  onChangeView,
  onClose,
  onResume,
}: {
  view: DrawerView | null
  drafts: DraftVM[]
  onChangeView: (v: DrawerView) => void
  onClose: () => void
  onResume: (payerId: number) => void
}) {
  const [q, setQ] = React.useState("")

  const byId = (id: number) => drafts.find((d) => d.payerId === id) ?? null
  const detail = view?.mode === "detail" ? byId(view.payerId) : null
  const teamFor = view?.mode === "team" ? byId(view.payerId) : null
  const wide = view?.mode === "team" || view?.mode === "team-roster"

  const list = drafts.filter(
    (d) =>
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.code.toLowerCase().includes(q.toLowerCase()) ||
      d.country.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <Sheet open={!!view} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 p-0",
          wide
            ? "data-[side=right]:sm:max-w-[640px]"
            : "data-[side=right]:sm:max-w-[600px]"
        )}
      >
        {teamFor ? (
          <AssignTeamPanel
            draft={teamFor}
            onBack={() =>
              onChangeView({ mode: "detail", payerId: teamFor.payerId })
            }
          />
        ) : view?.mode === "team-roster" ? (
          <WorkloadView
            drafts={drafts}
            onOpenDraft={(payerId) => onChangeView({ mode: "detail", payerId })}
          />
        ) : !detail ? (
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
                    {drafts.length} tenant submissions in progress
                  </div>
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2">
                <InputGroup className="flex-1">
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search drafts by name, ID or country…"
                  />
                </InputGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChangeView({ mode: "team-roster" })}
                >
                  <UsersIcon data-icon="inline-start" />
                  By teammate
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto p-4">
              {list.map((d) => (
                <button
                  key={d.payerId}
                  type="button"
                  onClick={() =>
                    onChangeView({ mode: "detail", payerId: d.payerId })
                  }
                  className="flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <AvatarInitials name={d.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold">
                        {d.name}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {d.stepsUnavailable ? "—" : `${d.progressPct}%`}
                      </span>
                    </div>
                    <div className="mono mb-1.5 truncate text-[11.5px] text-muted-foreground">
                      {d.code} · {d.country} · {d.type}
                    </div>
                    <SegTrack sections={d.sectionStatus} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="flex items-center">
                      {d.team.map((a, i) => (
                        <AssigneeAvatar
                          key={a.email}
                          name={a.name}
                          size="sm"
                          className={cn("ring-2 ring-card", i > 0 && "-ml-1.5")}
                        />
                      ))}
                    </span>
                    {d.unassigned.length > 0 && (
                      <span className="rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold text-warning-subtle-foreground">
                        {d.unassigned.length} open
                      </span>
                    )}
                  </div>
                </button>
              ))}
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
            onManageTeam={() =>
              onChangeView({ mode: "team", payerId: detail.payerId })
            }
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
  onManageTeam,
}: {
  draft: DraftVM
  onBack: () => void
  onClose: () => void
  onResume: (payerId: number) => void
  onManageTeam: () => void
}) {
  const [view, setView] = React.useState("section")
  const open = draft.unassigned

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
                {draft.code}
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
              <b>{draft.progressPct}%</b>{" "}
              <span className="text-muted-foreground">
                · {draft.done}/{draft.total} sections
              </span>
            </span>
          </div>
          <SegTrack sections={draft.sectionStatus} />
        </div>

        {draft.stepsUnavailable ? (
          <Note tone="warn" icon={<UserPlusIcon />}>
            <b>Progress couldn’t be loaded for this draft.</b> Its onboarding
            step data is stale on the server (a known backend issue on older
            drafts) — section status and owners are unavailable.
          </Note>
        ) : open.length > 0 ? (
          <Note tone="warn" icon={<UserPlusIcon />}>
            <b>
              {open.length} {open.length === 1 ? "section has" : "sections have"}{" "}
              no owner.
            </b>{" "}
            {open.map((s) => s.label).join(", ")} — assign a teammate to keep
            things moving.
          </Note>
        ) : (
          <Note tone="warn" icon={<ClockIcon />}>
            Currently waiting on <b>{draft.waiting}</b>. Resume the pending
            sections below to move this submission forward.
          </Note>
        )}

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <Seg
              value={view}
              onChange={setView}
              options={[
                { v: "section", l: "By section" },
                { v: "person", l: "By person" },
              ]}
            />
            <Button variant="outline" size="sm" onClick={onManageTeam}>
              <UsersIcon data-icon="inline-start" />
              Manage team
            </Button>
          </div>
          {view === "section" ? (
            <SectionList draft={draft} onResume={onResume} />
          ) : (
            <PersonList draft={draft} onResume={onResume} />
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t p-4">
        <span className="flex-1 text-[11.5px] text-muted-foreground">
          Started {fmtAgo(draft.createdAt)} · updated {fmtAgo(draft.updatedAt)}
        </span>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => onResume(draft.payerId)}>
          Resume onboarding
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </>
  )
}

function SectionList({
  draft,
  onResume,
}: {
  draft: DraftVM
  onResume: (payerId: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {draft.sections.map((s) => {
        const Ico = SECTION_ICON[s.icon] ?? UsersIcon
        const badge = SEC_BADGE[s.status]
        return (
          <div
            key={s.key}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <Ico className="size-[15px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{s.label}</span>
                <MiniBadge tone={badge.tone}>{badge.label}</MiniBadge>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                {s.assignee ? (
                  <>
                    <AssigneeAvatar name={s.assignee.name} size="sm" />
                    {s.assignee.name}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-warning-subtle-foreground">
                    <span className="grid size-4 place-items-center rounded-full border border-dashed border-input">
                      <UserPlusIcon className="size-2.5" />
                    </span>
                    Unassigned
                  </span>
                )}
                {s.completedAt ? (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    Completed {fmtAgo(s.completedAt)}
                  </>
                ) : null}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResume(draft.payerId)}
            >
              {s.status === "empty"
                ? "Start"
                : s.status === "complete"
                  ? "Review"
                  : "Continue"}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function PersonList({
  draft,
  onResume,
}: {
  draft: DraftVM
  onResume: (payerId: number) => void
}) {
  const open = draft.unassigned
  return (
    <div className="flex flex-col gap-3">
      {draft.team.map((a) => {
        const secs = draft.sections.filter(
          (s) => s.assignee?.email === a.email
        )
        const done = secs.filter((s) => s.status === "complete").length
        return (
          <div key={a.email} className="overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2.5 border-b bg-muted/50 px-3 py-2.5">
              <AssigneeAvatar name={a.name} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight">
                  {a.name}
                </div>
                <div className="mt-0.5">
                  <MemberRole label={a.roleLabel} />
                </div>
              </div>
              <span className="text-[11.5px] text-muted-foreground">
                {done}/{secs.length} done
              </span>
            </div>
            <div className="flex flex-col divide-y">
              {secs.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onResume(draft.payerId)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-[3px]",
                      SEG_DOT[s.status]
                    )}
                  />
                  <span className="text-[12.5px] font-medium">{s.label}</span>
                  <span className="ml-auto">
                    <MiniBadge tone={SEC_BADGE[s.status].tone}>
                      {SEC_BADGE[s.status].label}
                    </MiniBadge>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {open.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-dashed">
          <div className="flex items-center gap-2.5 border-b bg-muted/50 px-3 py-2.5">
            <span className="grid size-7 place-items-center rounded-full border border-dashed border-input text-muted-foreground">
              <UserPlusIcon className="size-3.5" />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold leading-tight">
                Unassigned
              </div>
              <div className="text-[11px] text-muted-foreground">
                No owner yet
              </div>
            </div>
            <span className="rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold text-warning-subtle-foreground">
              {open.length} open
            </span>
          </div>
          <div className="flex flex-col divide-y">
            {open.map((s: DraftSection) => (
              <div
                key={s.key}
                className="flex items-center gap-2.5 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-[3px]",
                    SEG_DOT[s.status]
                  )}
                />
                <span className="text-[12.5px] font-medium">{s.label}</span>
                {s.ownerRole ? (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {s.ownerRole}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
