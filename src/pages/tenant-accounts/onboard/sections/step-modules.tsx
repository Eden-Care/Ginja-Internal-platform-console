import { CheckIcon, GitBranchIcon, InfoIcon, LayersIcon, TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OnboardingForm } from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { useFunctionalities } from "@/features/access/use-functionalities"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"

function Check({ on, size = 13 }: { on: boolean; size?: number }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "border-input"
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
  const { data, isLoading, isError, refetch } = useFunctionalities()
  const modules = data ?? []

  const toggleMod = (code: string) => {
    const cur = { ...form.modules }
    if (cur[code]) delete cur[code]
    else cur[code] = [] // modules-only: no submodule codes (no catalogue API)
    set("modules", cur)
  }

  const moduleCount = Object.keys(form.modules).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <LoadingSpinner />
      </div>
    )
  }
  if (isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load the module catalogue.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => refetch()}
        >
          Try again
        </button>
        .
      </Note>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-muted-foreground">
          {moduleCount} {moduleCount === 1 ? "module" : "modules"} selected
        </span>
        <Tagpill>
          <GitBranchIcon className="size-[11px]" />
          Applies to all tenants
        </Tagpill>
      </div>

      <div className="flex flex-col gap-2">
        {modules.map((m) => {
          const on = !!form.modules[m.code]
          return (
            <button
              key={m.code}
              type="button"
              onClick={() => toggleMod(m.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors hover:bg-muted/40",
                on && "border-primary/50"
              )}
            >
              <Check on={on} />
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-[17px]">
                <LayersIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium">{m.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {m.description || m.code}
                </span>
              </span>
              <span className="mono shrink-0 text-[11px] text-muted-foreground">
                {m.code}
              </span>
            </button>
          )
        })}
      </div>

      <Note tone="info" icon={<InfoIcon />}>
        <b>Sub-module selection is pending backend.</b> The API exposes the module
        catalogue but no sub-module catalogue yet, so entitlements are granted at
        the <b>whole-module</b> level for now. Module dependencies are auto-resolved
        server-side.
      </Note>
    </div>
  )
}
