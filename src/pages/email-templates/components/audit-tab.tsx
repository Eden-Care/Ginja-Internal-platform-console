import * as React from "react"
import {
  CheckIcon,
  FileTextIcon,
  HistoryIcon,
  PencilIcon,
  PlusIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { initials2 } from "@/lib/console-format"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { LoadingSpinner } from "@/components/common/loading"
import { useEmailTemplateActivity } from "@/features/email-templates/use-email-templates"

type Tone = "success" | "warning" | "info" | "neutral"

/** Maps an API `action` (uppercase) to an icon + dot tone. Unknown → neutral. */
const ACTION_META: Record<string, { icon: React.ReactNode; tone: Tone }> = {
  CREATED: { icon: <PlusIcon />, tone: "info" },
  PUBLISHED: { icon: <CheckIcon />, tone: "success" },
  UPDATED: { icon: <PencilIcon />, tone: "info" },
  VERSION_SWITCHED: { icon: <HistoryIcon />, tone: "warning" },
  ROLLED_BACK: { icon: <HistoryIcon />, tone: "warning" },
  ACTIVATED: { icon: <CheckIcon />, tone: "success" },
  DEACTIVATED: { icon: <HistoryIcon />, tone: "warning" },
  SENT_TEST: { icon: <SendIcon />, tone: "info" },
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

/** "VERSION_SWITCHED" → "Version switched". */
const prettyAction = (action: string) =>
  (action ?? "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase()) || "Activity"

/** ISO → "22 Jun 2026, 03:52". */
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

/** The editor's "Audit log" tab — the live, append-only, attributed event feed. */
export function AuditTab({ templateId }: { templateId?: number }) {
  const activityQuery = useEmailTemplateActivity(templateId)
  const rows = activityQuery.data?.items ?? []
  const count = activityQuery.data?.totalElements ?? rows.length

  return (
    <Panel className="rounded-[12px]">
      <PanelHead
        icon={<FileTextIcon />}
        title="Audit log"
        action={
          !activityQuery.isLoading && !activityQuery.isError ? (
            <Tagpill className="text-[10.5px]">
              {count} {count === 1 ? "event" : "events"}
            </Tagpill>
          ) : undefined
        }
      />
      <PanelBody className="p-0">
        {activityQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : activityQuery.isError ? (
          <div className="p-4">
            <Note tone="err" icon={<TriangleAlertIcon />}>
              Couldn’t load the audit log.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => activityQuery.refetch()}
              >
                Try again
              </button>
              .
            </Note>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {rows.map((a) => {
              const meta = metaFor(a.action)
              const versionInfo =
                a.fromVersionNumber != null && a.toVersionNumber != null
                  ? `v${a.fromVersionNumber} → v${a.toVersionNumber}`
                  : a.toVersionNumber != null
                    ? `v${a.toVersionNumber}`
                    : ""
              const detail = [a.summary, versionInfo]
                .filter(Boolean)
                .join(" · ")
              return (
                <div
                  key={a.id}
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
                        {prettyAction(a.action)}
                      </b>
                      <span className="mono text-[11px] text-muted-foreground">
                        {fmtWhen(a.occurredAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {detail || "—"}
                    </div>
                  </div>
                  {a.actor ? (
                    <span className="inline-flex shrink-0 items-center gap-[7px] text-[11.5px] text-muted-foreground">
                      <MiniAvatar
                        initials={initials2(a.actor)}
                        className="size-6 text-[9.5px]"
                      />
                      {a.actor}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}
