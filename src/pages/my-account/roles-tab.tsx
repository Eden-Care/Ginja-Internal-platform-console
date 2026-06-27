import { CheckIcon, InfoIcon, ShieldIcon, UsersIcon } from "lucide-react"

import { Note } from "@/components/console/note"
import { Panel, PanelBody } from "@/components/console/panel"
import { roleDotStyle } from "@/pages/access/access-shared"
import { MY_ROLES, permLabel, roleById } from "@/lib/console-data"

export function RolesTab() {
  return (
    <>
      <Note tone="info" icon={<InfoIcon />} className="mb-4">
        The roles assigned to you and what each one grants. Roles are managed by
        your administrator — contact them to request changes.
      </Note>

      <div className="flex flex-col gap-3.5">
        {MY_ROLES.map((r) => {
          const def = roleById(r.id)
          if (!def) return null
          const isAll = def.perms[0] === "*"
          const labels = isAll
            ? ["Full platform access"]
            : def.perms.map((p) => permLabel(p))
          return (
            <Panel key={r.id}>
              <PanelBody>
                <div className="flex items-start gap-[11px]">
                  <span
                    className="grid size-[34px] shrink-0 place-items-center rounded-[9px] text-white [&>svg]:size-[15px]"
                    style={roleDotStyle(def.color)}
                  >
                    <ShieldIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-semibold">{def.name}</b>
                      {def.system && (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-[3px] text-[11.5px] font-medium text-secondary-foreground">
                          System
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {def.desc}
                    </div>
                    <div className="mt-[9px] inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground [&>svg]:size-3">
                      <UsersIcon />
                      Granted by <b className="font-semibold">{r.grantedBy}</b> ·{" "}
                      {r.when}
                      {r.note ? ` · ${r.note}` : ""}
                    </div>
                    <div className="mt-3 mb-[7px] text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      {isAll ? "Scope" : `Scopes · ${labels.length}`}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((l) => (
                        <span
                          key={l}
                          className="inline-flex items-center gap-1 rounded-full bg-muted px-[9px] py-[3px] text-[11.5px] font-medium text-foreground [&>svg]:size-[11px] [&>svg]:text-success"
                        >
                          <CheckIcon />
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </PanelBody>
            </Panel>
          )
        })}
      </div>
    </>
  )
}
