import * as React from "react"
import {
  ArrowRightIcon,
  BanIcon,
  CheckIcon,
  FileTextIcon,
  HistoryIcon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { initials2 } from "@/lib/console-format"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { LoadingSpinner } from "@/components/common/loading"
import { useModuleActivity } from "@/features/registry/use-module-detail"

type Tone = "success" | "warning" | "info" | "neutral"

/** Maps an API `action` (uppercase) to an icon + dot tone. */
const ACTION_META: Record<string, { icon: React.ReactNode; tone: Tone }> = {
  MODULE_REGISTERED: { icon: <PlusIcon />, tone: "info" },
  MODULE_PUBLISHED: { icon: <CheckIcon />, tone: "success" },
  MODULE_UPDATED: { icon: <PencilIcon />, tone: "info" },
  MODULE_UNPUBLISHED: { icon: <BanIcon />, tone: "warning" },
  MODULE_ARCHIVED: { icon: <HistoryIcon />, tone: "warning" },
}
const metaFor = (action: string) =>
  ACTION_META[action?.toUpperCase()] ?? {
    icon: <FileTextIcon />,
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

const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  description: "Description",
  ownerTeam: "Owner team",
  owner_team: "Owner team",
  status: "Status",
  icon: "Icon",
  url: "URL",
  version: "Version",
}
const fieldLabel = (f: string) =>
  FIELD_LABEL[f] ??
  f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

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
    <Panel>
      <PanelHead
        icon={<FileTextIcon />}
        title="Audit log"
        action={<Tagpill className="text-[10.5px]">{rows.length}</Tagpill>}
      />
      <PanelBody>
        {rows.length === 0 ? (
          <div className="px-2 py-10 text-center text-[12.5px] text-muted-foreground">
            No activity recorded for this module yet.
          </div>
        ) : (
          <ol className="flex flex-col">
            {rows.map((r, i) => {
              const meta = metaFor(r.action)
              return (
                <li key={r.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full [&>svg]:size-[14px]",
                        DOT_TONE[meta.tone]
                      )}
                    >
                      {meta.icon}
                    </span>
                    {i < rows.length - 1 ? (
                      <span className="my-1 w-px flex-1 bg-border" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-[13px] font-semibold">
                        {prettyAction(r.action)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                        <MiniAvatar
                          initials={initials2(r.actor)}
                          className="size-6 text-[9.5px]"
                        />
                        {r.actor}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground">
                        · {fmtWhen(r.createdAt)}
                      </span>
                    </div>

                    {r.reason ? (
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {r.reason}
                      </p>
                    ) : null}

                    {r.changes.length > 0 ? (
                      <div className="mt-1.5 flex flex-col gap-1">
                        {r.changes.map((ch) => (
                          <div
                            key={ch.field}
                            className="flex flex-wrap items-center gap-1.5 text-[11.5px]"
                          >
                            <span className="font-medium text-muted-foreground">
                              {fieldLabel(ch.field)}
                            </span>
                            <span className="rounded-[4px] bg-destructive/[0.1] px-1.5 py-0.5 text-destructive line-through">
                              {ch.from}
                            </span>
                            <ArrowRightIcon className="size-3 text-muted-foreground" />
                            <span className="rounded-[4px] bg-success/[0.14] px-1.5 py-0.5 text-success-subtle-foreground">
                              {ch.to}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </PanelBody>
    </Panel>
  )
}
