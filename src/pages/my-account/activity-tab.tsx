import {
  InfoIcon,
  KeyRoundIcon,
  LockIcon,
  LogOutIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Note } from "@/components/console/note"
import { Panel, PanelBody } from "@/components/console/panel"
import {
  MY_ACTIVITY,
  MY_ACTIVITY_KIND,
  type MyActivityKind,
} from "@/lib/console-data"

const KIND_ICON: Record<MyActivityKind, React.ReactNode> = {
  login: <LogOutIcon />,
  mfa: <KeyRoundIcon />,
  password: <LockIcon />,
}

const TONE_STYLE: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  error: "bg-destructive/12 text-destructive",
}

export function ActivityTab() {
  return (
    <>
      <Note tone="info" icon={<InfoIcon />} className="mb-4">
        Recent security events on your account. This log is read-only. See
        something you didn't do?{" "}
        <a className="cursor-pointer font-medium text-primary hover:underline">
          This wasn't me — secure my account
        </a>
      </Note>

      <Panel>
        <PanelBody className="p-0">
          <div className="flex flex-col">
            {MY_ACTIVITY.map((a, i) => {
              const k = MY_ACTIVITY_KIND[a.kind]
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 border-t px-4 py-[13px] first:border-t-0"
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg [&>svg]:size-3.5",
                      a.ok ? TONE_STYLE[k.tone] : TONE_STYLE.error
                    )}
                  >
                    {a.ok ? KIND_ICON[a.kind] : <TriangleAlertIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      {a.label}
                      {!a.ok && (
                        <span className="rounded-[5px] bg-destructive/12 px-[7px] py-0.5 text-[9.5px] font-semibold tracking-[0.03em] text-destructive uppercase">
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {a.detail} · <span className="mono">{a.ip}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11.5px] whitespace-nowrap text-muted-foreground">
                    {a.when}
                  </span>
                </div>
              )
            })}
          </div>
        </PanelBody>
      </Panel>
    </>
  )
}
