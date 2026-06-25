import * as React from "react"
import {
  CheckIcon,
  ChevronDownIcon,
  GitBranchIcon,
  InfoIcon,
  LayersIcon,
  MinusIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { OnboardingForm } from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { useModuleCatalogue } from "@/features/registry/use-module-catalogue"
import type { ModuleCatalogueItem } from "@/features/registry/types"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"

type CheckState = "on" | "off" | "some"

function Check({ state, size = 13 }: { state: CheckState; size?: number }) {
  const filled = state !== "off"
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors",
        filled ? "border-primary bg-primary text-primary-foreground" : "border-input"
      )}
    >
      {state === "on" ? <CheckIcon style={{ width: size, height: size }} /> : null}
      {state === "some" ? <MinusIcon style={{ width: size, height: size }} /> : null}
    </span>
  )
}

const allSubCodes = (m: ModuleCatalogueItem) => m.subs.map((s) => s.code)

/** Add `code` plus the chain of sub-modules it (transitively) `requires`. */
function addWithRequires(m: ModuleCatalogueItem, set: Set<string>, code: string) {
  const byCode = new Map(m.subs.map((s) => [s.code, s]))
  let cur: string | undefined = code
  while (cur && byCode.has(cur) && !set.has(cur)) {
    set.add(cur)
    cur = byCode.get(cur)?.requires ?? undefined
  }
}

/** Remove `code` plus any sub-modules that (transitively) require it. */
function removeWithDependents(m: ModuleCatalogueItem, set: Set<string>, code: string) {
  set.delete(code)
  let changed = true
  while (changed) {
    changed = false
    for (const s of m.subs) {
      if (set.has(s.code) && s.requires && !set.has(s.requires)) {
        set.delete(s.code)
        changed = true
      }
    }
  }
}

export function StepModules({
  form,
  set,
}: {
  form: OnboardingForm
  set: SetField
}) {
  const { data, isLoading, isError, refetch } = useModuleCatalogue()
  const modules = data ?? []
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  // Resume safety: a selected module that has sub-modules but no explicit codes
  // (e.g. stored as a whole-module entitlement) means "all sub-modules". Expand it
  // to the explicit set once the catalogue loads, so selection stays unambiguous.
  React.useEffect(() => {
    if (!data) return
    let changed = false
    const next: Record<string, string[]> = { ...form.modules }
    for (const m of data) {
      if (m.subs.length && next[m.code] && next[m.code].length === 0) {
        next[m.code] = allSubCodes(m)
        changed = true
      }
    }
    if (changed) set("modules", next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  /** The effective set of selected sub-module codes for a module. Empty array on
     a module that *has* subs is treated as "whole module = all subs". */
  const selectedSubs = (m: ModuleCatalogueItem): Set<string> => {
    const arr = form.modules[m.code]
    if (!arr) return new Set() // not entitled
    if (m.subs.length === 0) return new Set() // whole-module unit, no subs
    return new Set(arr.length ? arr : allSubCodes(m))
  }

  const moduleState = (m: ModuleCatalogueItem): CheckState => {
    if (!form.modules[m.code]) return "off"
    if (m.subs.length === 0) return "on"
    const sel = selectedSubs(m).size
    return sel >= m.subs.length ? "on" : sel === 0 ? "off" : "some"
  }

  const toggleModule = (m: ModuleCatalogueItem) => {
    const cur = { ...form.modules }
    if (cur[m.code]) {
      delete cur[m.code]
      setExpanded((e) => {
        const n = new Set(e)
        n.delete(m.code)
        return n
      })
    } else {
      cur[m.code] = m.subs.length ? allSubCodes(m) : []
      if (m.subs.length) setExpanded((e) => new Set(e).add(m.code))
    }
    set("modules", cur)
  }

  const toggleSub = (m: ModuleCatalogueItem, code: string) => {
    const sel = selectedSubs(m)
    if (sel.has(code)) removeWithDependents(m, sel, code)
    else addWithRequires(m, sel, code)
    const cur = { ...form.modules }
    if (sel.size === 0) delete cur[m.code]
    else cur[m.code] = [...sel]
    set("modules", cur)
  }

  const toggleExpand = (code: string) =>
    setExpanded((e) => {
      const n = new Set(e)
      if (n.has(code)) n.delete(code)
      else n.add(code)
      return n
    })

  const modCount = Object.keys(form.modules).length
  const subCount = modules.reduce(
    (n, m) => n + (form.modules[m.code] ? selectedSubs(m).size : 0),
    0
  )

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
          {modCount} {modCount === 1 ? "module" : "modules"} · {subCount} sub-
          {subCount === 1 ? "module" : "modules"} selected
        </span>
        <Tagpill>
          <GitBranchIcon className="size-[11px]" />
          Applies to all tenants
        </Tagpill>
      </div>

      <div className="flex flex-col gap-2">
        {modules.map((m) => {
          const hasSubs = m.subs.length > 0
          const st = moduleState(m)
          const sel = selectedSubs(m)
          const open = expanded.has(m.code)
          return (
            <div
              key={m.code}
              className={cn(
                "rounded-xl border transition-colors",
                st !== "off" && "border-primary/50"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => (hasSubs ? toggleExpand(m.code) : toggleModule(m))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    if (hasSubs) toggleExpand(m.code)
                    else toggleModule(m)
                  }
                }}
                className="flex w-full cursor-pointer items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <button
                  type="button"
                  aria-label={`Toggle ${m.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleModule(m)
                  }}
                  className="contents"
                >
                  <Check state={st} />
                </button>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-[17px]">
                  <LayersIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium">{m.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.description || m.code}
                  </span>
                </span>
                {hasSubs ? (
                  <>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                      {st === "off"
                        ? `${m.subs.length} sub-modules`
                        : `${sel.size}/${m.subs.length}`}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </>
                ) : (
                  <span className="mono shrink-0 text-[11px] text-muted-foreground">
                    {m.code}
                  </span>
                )}
              </div>

              {hasSubs && open ? (
                <div className="flex flex-col gap-0.5 border-t px-3.5 py-2 pl-[52px]">
                  {m.subs.map((s) => {
                    const son = sel.has(s.code)
                    const reqName = s.requires
                      ? m.subs.find((x) => x.code === s.requires)?.name
                      : undefined
                    return (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => toggleSub(m, s.code)}
                        className="flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-muted/40"
                      >
                        <Check state={son ? "on" : "off"} size={11} />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="text-[12.5px] font-medium">
                            {s.name}
                          </span>
                          {s.description ? (
                            <span className="text-[11.5px] text-muted-foreground">
                              {" "}
                              — {s.description}
                            </span>
                          ) : null}
                          {reqName ? (
                            <span className="ml-1.5 text-[10.5px] text-muted-foreground">
                              · requires {reqName}
                            </span>
                          ) : null}
                        </span>
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
        Entitlements apply to the primary and every secondary tenant. Selecting a
        module grants all of its sub-modules; expand a module to entitle a subset.
        Sub-module dependencies are resolved automatically.
      </Note>
    </div>
  )
}
