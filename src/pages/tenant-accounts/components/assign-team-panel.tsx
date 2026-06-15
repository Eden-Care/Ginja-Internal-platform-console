import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  TriangleAlertIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SheetTitle } from "@/components/ui/sheet"
import { StaffAvatar } from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import {
  ONB_SECTIONS,
  STAFF,
  STAFF_BY_ID,
  suggestAssign,
  type OnbDraft,
} from "@/lib/console-data"
import { RoleChip, SECTION_ICON } from "./draft-shared"
import { OwnerSelect } from "./owner-select"

/** Manage a draft's onboarding team + per-section ownership. */
export function AssignTeamPanel({
  draft,
  onBack,
  onSave,
}: {
  draft: OnbDraft
  onBack: () => void
  onSave: (id: string, assign: Record<string, string | null>) => void
}) {
  const [assign, setAssign] = React.useState<Record<string, string | null>>(
    draft.assign
  )

  const team = STAFF.map((p) => p.id).filter((id) =>
    Object.values(assign).includes(id)
  )
  const counts = (id: string) =>
    ONB_SECTIONS.filter((s) => assign[s.k] === id).length
  const setOwner = (k: string, id: string | null) =>
    setAssign((a) => ({ ...a, [k]: id }))
  const removePerson = (id: string) =>
    setAssign((a) =>
      Object.fromEntries(
        Object.entries(a).map(([k, v]) => [k, v === id ? null : v])
      )
    )
  const addable = STAFF.filter((p) => !team.includes(p.id))
  const openCount = ONB_SECTIONS.filter((s) => !assign[s.k]).length

  const addPerson = (id: string) => {
    const p = STAFF_BY_ID[id]
    const firstOpen =
      ONB_SECTIONS.find((s) => !assign[s.k] && s.specRole === p.role) ||
      ONB_SECTIONS.find((s) => !assign[s.k])
    if (firstOpen) setOwner(firstOpen.k, id)
  }
  const save = () => {
    onSave(draft.id, assign)
    toast.success(`Team updated for ${draft.name}.`)
    onBack()
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
              {draft.name} · {draft.id}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] overflow-y-auto p-5">
        {/* team roster */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="eyebrow text-[10.5px]">
              Team · {team.length || "none yet"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setAssign(
                  suggestAssign(team.length ? team : STAFF.map((p) => p.id))
                )
              }
            >
              <ZapIcon data-icon="inline-start" />
              Suggest by specialty
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            {team.map((id) => {
              const p = STAFF_BY_ID[id]
              return (
                <div
                  key={id}
                  className="flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2"
                >
                  <StaffAvatar id={id} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold leading-tight">
                      {p.name}
                    </div>
                    <div className="mt-0.5">
                      <RoleChip role={p.role} />
                    </div>
                  </div>
                  <span className="text-[11.5px] text-muted-foreground">
                    {counts(id)} {counts(id) === 1 ? "section" : "sections"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove from team"
                    onClick={() => removePerson(id)}
                  >
                    <XIcon />
                  </Button>
                </div>
              )
            })}
            <Popover>
              <PopoverTrigger
                disabled={addable.length === 0}
                className="inline-flex w-fit items-center gap-2 rounded-[10px] border border-dashed border-input px-3 py-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlusIcon className="size-[15px]" />
                Add teammate
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[250px] p-0">
                <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Add from roster
                </div>
                <div className="pb-1">
                  {addable.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addPerson(p.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted"
                    >
                      <StaffAvatar id={p.id} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold">
                          {p.name}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {p.role}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
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
            {ONB_SECTIONS.map((s) => {
              const Ico = SECTION_ICON[s.icon] ?? UsersIcon
              return (
                <div
                  key={s.k}
                  className="flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Ico className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{s.l}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {s.specRole}
                    </div>
                  </div>
                  <OwnerSelect
                    value={assign[s.k] ?? null}
                    team={team}
                    onChange={(id) => setOwner(s.k, id)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t p-4">
        <span className="flex-1 text-[11.5px] text-muted-foreground">
          {team.length} {team.length === 1 ? "person" : "people"} ·{" "}
          {ONB_SECTIONS.length - openCount}/{ONB_SECTIONS.length} sections owned
        </span>
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={save}>
          <CheckIcon data-icon="inline-start" />
          Save team
        </Button>
      </div>
    </>
  )
}
