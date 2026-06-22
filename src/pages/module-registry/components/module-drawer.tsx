import * as React from "react"
import { GitBranchIcon, InfoIcon, PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { type ModuleStatus, type RegistryModule } from "@/lib/console-data"
import { Glyph } from "@/components/console/glyph"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

/** Module status → MiniBadge tone (shared with the registry list). */
export const MODULE_TONE: Record<
  ModuleStatus,
  "success" | "warning" | "error"
> = {
  Published: "success",
  Beta: "warning",
  Sunset: "error",
}

export function ModuleDrawer({
  module,
  onClose,
}: {
  module: RegistryModule | null
  onClose: () => void
}) {
  // Persist the last opened module so its content stays during the close
  // animation, and re-seed the publish toggle when a different module opens
  // (React's "adjust state while rendering" pattern — no effect needed).
  const [shown, setShown] = React.useState<RegistryModule | null>(module)
  const [published, setPublished] = React.useState(
    module ? module.status === "Published" : true
  )
  // Reseed whenever a different module object arrives — covers both opening a
  // new row and upgrading the list-row placeholder to the fetched detail (same
  // id, richer object). `shown` is kept while closing (module === null).
  if (module && module !== shown) {
    setShown(module)
    setPublished(module.status === "Published")
  }

  return (
    <Sheet open={!!module} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[540px]"
      >
        {shown ? (
          <>
            <div className="border-b p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[19px]">
                  <Glyph name={shown.icon} />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-bold">
                    {shown.name}
                  </SheetTitle>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="mono text-xs text-muted-foreground">
                      {shown.id}
                    </span>
                    <MiniBadge tone={MODULE_TONE[shown.status]}>
                      {shown.status}
                    </MiniBadge>
                    <Tagpill className="text-[10.5px]">{shown.version}</Tagpill>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <p className="text-[13px] text-muted-foreground">{shown.desc}</p>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border">
                <div className="bg-card p-[13px_15px]">
                  <div className="eyebrow text-[10px]">Owner team</div>
                  <div className="mt-1 text-sm font-semibold">
                    {shown.owner}
                  </div>
                </div>
                <div className="bg-card p-[13px_15px]">
                  <div className="eyebrow text-[10px]">Active tenants</div>
                  <div className="mono mt-1 text-sm font-semibold">
                    {shown.tenants}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="eyebrow text-[10.5px]">
                    Sub-modules · {shown.subs.length}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast("Add a sub-module.")}
                  >
                    <PlusIcon data-icon="inline-start" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {shown.subs.map((s) => {
                    const dep = s.requires
                      ? shown.subs.find((x) => x.id === s.requires)
                      : null
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <GitBranchIcon className="size-[15px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium">
                            {s.name}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {s.desc}
                          </div>
                        </div>
                        {dep ? (
                          <span className="shrink-0 rounded-[5px] bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                            requires {dep.name}
                          </span>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={`Edit ${s.name}`}
                          onClick={() => toast(`Editing ${s.name}.`)}
                        >
                          <PencilIcon />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Note tone="info" icon={<InfoIcon />}>
                Dependencies are enforced during onboarding — selecting a
                dependent sub-module auto-selects its requirement.
              </Note>
            </div>

            <div className="mt-auto flex items-center gap-2 border-t p-4">
              <label className="flex flex-1 items-center gap-2 text-[12.5px] font-medium">
                Published
                <Switch checked={published} onCheckedChange={setPublished} />
              </label>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  toast(`${shown.name} saved.`)
                  onClose()
                }}
              >
                Save changes
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
