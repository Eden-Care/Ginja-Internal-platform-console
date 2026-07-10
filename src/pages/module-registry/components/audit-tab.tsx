import * as React from "react"
import { TriangleAlertIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { initials2 } from "@/lib/console-format"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Tagpill } from "@/components/console/tagpill"
import { HiIcon } from "@/components/hifi/icon"
import { Note } from "@/components/console/note"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { LoadingSpinner } from "@/components/common/loading"
import { useModuleActivity } from "@/features/registry/use-module-detail"

type Tone = "success" | "warning" | "info" | "neutral"

/** Maps an API `action` (uppercase) to an icon + dot tone. */
const ACTION_META: Record<string, { icon: React.ReactNode; tone: Tone }> = {
  MODULE_REGISTERED: { icon: <HiIcon name="plus" />, tone: "info" },
  MODULE_PUBLISHED: { icon: <HiIcon name="check" />, tone: "success" },
  MODULE_UPDATED: { icon: <HiIcon name="pencil" />, tone: "info" },
  MODULE_UNPUBLISHED: { icon: <HiIcon name="ban" />, tone: "warning" },
  MODULE_ARCHIVED: { icon: <HiIcon name="history" />, tone: "warning" },
}
const metaFor = (action: string) =>
  ACTION_META[action?.toUpperCase()] ?? {
    icon: <HiIcon name="fileText" />,
    tone: "neutral" as Tone,
  }

const DOT_TONE: Record<Tone, string> = {
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
  neutral: "bg-muted text-muted-foreground",
}

/** "MODULE_PUBLISHED" → "Module published". */
const prettyAction = (action: string) =>
  (action ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase()) || "Activity"

/** ISO → "22 Jun 2026, 14:05". */
const fmtWhen = (iso: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
}

export function ModuleAuditTab({ moduleId }: { moduleId: string }) {
  const q = useModuleActivity(moduleId)
  const rows = q.data?.items ?? []

  if (q.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <LoadingSpinner />
      </div>
    )
  }
  if (q.isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn't load the audit log.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => q.refetch()}
        >
          Try again
        </button>
        .
      </Note>
    )
  }

  return (
    <Panel className="rounded-[12px]">
      <PanelHead
        icon={<HiIcon name="fileText" />}
        title="Audit log"
        action={<Tagpill className="text-[10.5px]">{rows.length}</Tagpill>}
      />
      <PanelBody className="p-0">
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
            No activity recorded for this module yet.
          </div>
        ) : (
          <ol className="flex flex-col">
            {rows.map((r) => {
              const meta = metaFor(r.action)
              return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 border-t px-4 py-[13px] first:border-t-0"
                >
                  <span
                    className={cn(
                      "grid size-[26px] shrink-0 place-items-center rounded-full [&>svg]:size-3",
                      DOT_TONE[meta.tone]
                    )}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="text-[13px] font-bold">
                        {prettyAction(r.action)}
                      </b>
                      <span className="mono text-[11px] text-muted-foreground">
                        {fmtWhen(r.createdAt)}
                      </span>
                    </div>

                    {r.description ? (
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {r.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-[7px] text-[11.5px] text-muted-foreground">
                    <MiniAvatar
                      initials={initials2(r.actor)}
                      className="size-6 text-[9.5px]"
                    />
                    {r.actor}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </PanelBody>
    </Panel>
  )
}
