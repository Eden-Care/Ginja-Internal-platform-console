import { CheckIcon, GitBranchIcon, InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  REGISTRY,
  type OnboardingForm,
  type SubModule,
} from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Glyph } from "@/components/console/glyph"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"

function Check({ on, size = 13 }: { on: boolean; size?: number }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input"
      )}
    >
      {on ? <CheckIcon style={{ width: size, height: size }} /> : null}
    </span>
  )
}

export function StepModules({
  form,
  set,
}: {
  form: OnboardingForm
  set: SetField
}) {
  const toggleMod = (id: string, subs: SubModule[]) => {
    const cur = { ...form.modules }
    if (cur[id]) delete cur[id]
    else cur[id] = subs.filter((s) => !s.requires).map((s) => s.id)
    set("modules", cur)
  }

  const toggleSub = (mid: string, subs: SubModule[], sid: string) => {
    const cur = { ...form.modules }
    let list = cur[mid] ? [...cur[mid]] : []
    const sub = subs.find((s) => s.id === sid)
    if (list.includes(sid)) {
      list = list.filter((x) => x !== sid)
      subs
        .filter((s) => s.requires === sid)
        .forEach((s) => {
          list = list.filter((x) => x !== s.id)
        })
    } else {
      list.push(sid)
      if (sub?.requires && !list.includes(sub.requires)) list.push(sub.requires)
    }
    if (list.length) cur[mid] = list
    else delete cur[mid]
    set("modules", cur)
  }

  const moduleCount = Object.keys(form.modules).length
  const subCount = Object.values(form.modules).flat().length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          {moduleCount} modules · {subCount} sub-modules selected
        </span>
        <Tagpill>
          <GitBranchIcon className="size-[11px]" />
          Applies to all tenants
        </Tagpill>
      </div>

      <div className="flex flex-col gap-2">
        {REGISTRY.filter((m) => m.status !== "Sunset").map((m) => {
          const on = !!form.modules[m.id]
          const sel = form.modules[m.id] ?? []
          return (
            <div
              key={m.id}
              className={cn(
                "overflow-hidden rounded-xl border",
                on && "border-primary/50"
              )}
            >
              <button
                type="button"
                onClick={() => toggleMod(m.id, m.subs)}
                className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <Check on={on} />
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-[17px]">
                  <Glyph name={m.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium">
                    {m.name}
                    {m.status === "Beta" ? (
                      <span className="rounded bg-warning-subtle px-1.5 py-0.5 text-[10px] font-semibold text-warning-subtle-foreground">
                        Beta
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {m.desc}
                  </span>
                </span>
                <span className="shrink-0 text-[11.5px] text-muted-foreground">
                  {on
                    ? `${sel.length}/${m.subs.length}`
                    : `${m.subs.length} sub-modules`}
                </span>
              </button>

              {on ? (
                <div className="flex flex-col gap-px border-t bg-muted/20 p-2">
                  {m.subs.map((s) => {
                    const son = sel.includes(s.id)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSub(m.id, m.subs, s.id)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-card"
                      >
                        <Check on={son} size={12} />
                        <span className="text-[13px] font-medium">
                          {s.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          — {s.desc}
                        </span>
                        {s.requires ? (
                          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            requires{" "}
                            {m.subs.find((x) => x.id === s.requires)?.name}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <Note tone="info" icon={<InfoIcon />}>
        <b>Advanced reporting</b> auto-selects <b>Core reporting</b> as a
        dependency. Sunset modules are hidden from new onboarding.
      </Note>
    </div>
  )
}
