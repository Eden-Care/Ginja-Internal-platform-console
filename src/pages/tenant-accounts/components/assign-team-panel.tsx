import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SheetTitle } from "@/components/ui/sheet"
import { AssigneeAvatar } from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useMembers } from "@/features/access/use-members"
import { useAssignStep } from "@/features/payers/use-drafts"
import type { DraftVM } from "@/features/payers/draft-vm"
import { SECTION_ICON } from "./draft-shared"
import { OwnerSelect, toOwnerOption, type OwnerOption } from "./owner-select"

/** Manage a draft's onboarding team + per-section ownership.
   Assignments persist via POST …/steps/{key}/assign (one call per changed
   section on Save). */
export function AssignTeamPanel({
  draft,
  onBack,
}: {
  draft: DraftVM
  onBack: () => void
}) {
  const membersQ = useMembers()
  const members = React.useMemo(
    () => membersQ.data?.items ?? [],
    [membersQ.data]
  )
  const assignMut = useAssignStep()
  const [saving, setSaving] = React.useState(false)

  // member email → display option.
  const optByEmail = React.useMemo(() => {
    const m = new Map<string, OwnerOption>()
    for (const mb of members) m.set(mb.email, toOwnerOption(mb))
    return m
  }, [members])

  const resolve = (email: string): OwnerOption =>
    optByEmail.get(email) ?? { email, name: email, roleLabel: null }

  // Original per-section assignee (email | null), keyed by section.
  const original = React.useMemo(() => {
    const o: Record<string, string | null> = {}
    draft.sections.forEach((s) => (o[s.key] = s.assignee?.email ?? null))
    return o
  }, [draft])

  const [assign, setAssign] = React.useState<Record<string, string | null>>(
    () => ({ ...original })
  )
  // Roster = people available to assign: current assignees + ones added here.
  const [roster, setRoster] = React.useState<string[]>(() =>
    Array.from(new Set(draft.team.map((a) => a.email)))
  )

  const teamOptions: OwnerOption[] = roster.map(resolve)
  const counts = (email: string) =>
    draft.sections.filter((s) => assign[s.key] === email).length
  const setOwner = (k: string, email: string | null) =>
    setAssign((a) => ({ ...a, [k]: email }))
  const removePerson = (email: string) => {
    setRoster((r) => r.filter((e) => e !== email))
    setAssign((a) =>
      Object.fromEntries(
        Object.entries(a).map(([k, v]) => [k, v === email ? null : v])
      )
    )
  }
  const addPerson = (email: string) =>
    setRoster((r) => (r.includes(email) ? r : [...r, email]))

  const addable = members.filter((m) => !roster.includes(m.email))
  const openCount = draft.sections.filter((s) => !assign[s.key]).length

  const save = async () => {
    // Only push sections whose owner actually changed.
    const changed = draft.sections.filter((s) => assign[s.key] !== original[s.key])
    // The API has no un-assign (assignee is required), so clears can't persist.
    const toAssign = changed.filter((s) => assign[s.key])
    const cleared = changed.filter((s) => !assign[s.key])
    if (changed.length === 0) {
      onBack()
      return
    }
    setSaving(true)
    try {
      await Promise.all(
        toAssign.map((s) =>
          assignMut.mutateAsync({
            payerId: draft.payerId,
            stepKey: s.key,
            assignee: assign[s.key] as string,
          })
        )
      )
      if (cleared.length > 0) {
        toast("Saved. Note: un-assigning a section isn’t supported by the API yet — those owners are unchanged.")
      } else {
        toast.success(`Team updated for ${draft.name}.`)
      }
      onBack()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Couldn’t save the assignments."
      )
    } finally {
      setSaving(false)
    }
  }

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
          Back
        </Button>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
            <UsersIcon className="size-[18px]" />
          </span>
          <div>
            <SheetTitle className="text-base font-bold">
              Manage onboarding team
            </SheetTitle>
            <div className="text-xs text-muted-foreground">
              {draft.name} · {draft.code}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] overflow-y-auto p-5">
        {/* team roster */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="eyebrow text-[10.5px]">
              Team · {roster.length || "none yet"}
            </span>
          </div>
          {membersQ.isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {teamOptions.map((p) => (
                <div
                  key={p.email}
                  className="flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2"
                >
                  <AssigneeAvatar name={p.name} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-tight">
                      {p.name}
                    </div>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center rounded-full bg-muted px-[7px] py-px text-[10px] font-semibold tracking-[0.02em] text-muted-foreground">
                        {p.roleLabel ?? "Member"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11.5px] text-muted-foreground">
                    {counts(p.email)}{" "}
                    {counts(p.email) === 1 ? "section" : "sections"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove from team"
                    onClick={() => removePerson(p.email)}
                  >
                    <XIcon />
                  </Button>
                </div>
              ))}
              <Popover>
                <PopoverTrigger
                  disabled={addable.length === 0}
                  className="inline-flex w-fit items-center gap-2 rounded-[10px] border border-dashed border-input px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlusIcon className="size-[15px]" />
                  Add teammate
                </PopoverTrigger>
                <PopoverContent align="start" className="max-h-[320px] w-[260px] overflow-y-auto p-0">
                  <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Add from members
                  </div>
                  <div className="pb-1">
                    {addable.map((m) => (
                      <button
                        key={m.email}
                        type="button"
                        onClick={() => addPerson(m.email)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
                      >
                        <AssigneeAvatar name={m.name || m.email} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold">
                            {m.name || m.email}
                          </span>
                          <span className="block text-[11.5px] text-muted-foreground">
                            {m.roles?.[0]?.name ?? m.email}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* section ownership */}
        <div>
          <div className="eyebrow mb-2.5 text-[10.5px]">Section ownership</div>
          {openCount > 0 && (
            <Note tone="warn" icon={<TriangleAlertIcon />} className="mb-2.5">
              <b>
                {openCount} {openCount === 1 ? "section is" : "sections are"}{" "}
                unassigned.
              </b>{" "}
              Assign an owner so nothing stalls — or leave open and assign later.
            </Note>
          )}
          <div className="flex flex-col gap-1.5">
            {draft.sections.map((s) => {
              const Ico = SECTION_ICON[s.icon] ?? UsersIcon
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Ico className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.ownerRole ? `Owner team: ${s.ownerRole}` : "Any team"}
                    </div>
                  </div>
                  <OwnerSelect
                    value={assign[s.key] ?? null}
                    team={teamOptions}
                    onChange={(email) => setOwner(s.key, email)}
                  />
                </div>
              )
            })}
          </div>
          <Note tone="info" icon={<InfoIcon />} className="mt-2.5">
            Owners are assigned manually — the API has no specialty data for
            “suggest by specialty”, and a section can’t be un-assigned once set.
          </Note>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t p-4">
        <span className="flex-1 text-[11.5px] text-muted-foreground">
          {roster.length} {roster.length === 1 ? "person" : "people"} ·{" "}
          {draft.sections.length - openCount}/{draft.sections.length} sections
          owned
        </span>
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2Icon data-icon="inline-start" className="animate-spin" />
          ) : (
            <CheckIcon data-icon="inline-start" />
          )}
          Save team
        </Button>
      </div>
    </>
  )
}
