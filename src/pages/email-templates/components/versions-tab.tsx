import * as React from "react"
import {
  CheckCircle2Icon,
  GitBranchIcon,
  HistoryIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtDate, versionStatusBadge } from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MBadge } from "@/components/hifi/badge"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import type { EmailVersionRow } from "@/features/email-templates/api"
import {
  useEmailTemplateCompare,
  useEmailTemplateVersions,
} from "@/features/email-templates/use-email-templates"
import { DiffSegments } from "./diff-text"

const FIELD_LABEL: Record<string, string> = {
  subject: "Subject",
  html_content: "HTML body",
  css_content: "CSS",
  plain_text_content: "Plain text",
  sms_body: "SMS body",
}
const fieldLabel = (f: string) =>
  FIELD_LABEL[f] ??
  f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * The editor's "Versions" tab — the live version history (left) beside a diff
 * panel (right). Selecting version N shows the server-computed word-by-word diff
 * of its predecessor → itself (`/compare?from=N-1&to=N`), git-style.
 */
export function VersionsTab({
  templateId,
  readonly,
  onRollback,
}: {
  templateId?: number
  readonly: boolean
  onRollback: (v: EmailVersionRow) => void
}) {
  const versionsQuery = useEmailTemplateVersions(templateId)
  const rows = React.useMemo(
    () =>
      [...(versionsQuery.data?.items ?? [])].sort(
        (a, b) => b.versionNumber - a.versionNumber
      ),
    [versionsQuery.data]
  )
  const current = rows.find((r) => r.current) ?? rows[0]

  // Default selection = the current/latest version; derived so no effect needed.
  const [selectedNum, setSelectedNum] = React.useState<number | null>(null)
  const selected = rows.find((r) => r.versionNumber === selectedNum) ?? current

  // "previous → selected": v1 has no predecessor, so no compare for it.
  const hasPrev = !!selected && selected.versionNumber > 1
  const from = hasPrev ? selected!.versionNumber - 1 : null
  const to = hasPrev ? selected!.versionNumber : null
  const compareQuery = useEmailTemplateCompare(templateId, from, to)

  if (versionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <LoadingSpinner />
      </div>
    )
  }
  if (versionsQuery.isError) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load version history.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => versionsQuery.refetch()}
        >
          Try again
        </button>
        .
      </Note>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_1fr]">
      <Panel className="rounded-[12px]">
        <PanelHead icon={<HistoryIcon />} title="Version history" />
        <PanelBody className="p-2">
          {rows.length === 0 ? (
            <div className="px-2.5 py-8 text-center text-[12px] text-muted-foreground">
              No versions yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((v) => {
                const sel = selected?.versionNumber === v.versionNumber
                return (
                  <div
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNum(v.versionNumber)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedNum(v.versionNumber)
                      }
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-[13px] border-b px-2.5 py-3 last:border-b-0",
                      v.current &&
                        "rounded-[10px] border-b-0 bg-primary/[0.03]",
                      sel && "rounded-[10px] bg-primary/[0.06]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-[38px] shrink-0 place-items-center rounded-full text-[12px] font-bold",
                        v.current
                          ? "bg-primary/[0.14] text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {v.versionNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <b className="text-[13.5px]">v{v.versionNumber}</b>
                        {v.status ? (
                          <MBadge tone={versionStatusBadge(v.status).tone}>
                            {versionStatusBadge(v.status).label}
                          </MBadge>
                        ) : null}
                        <span className="mono text-[10.5px] text-muted-foreground">
                          {v.versionCode}
                        </span>
                      </div>
                      <div className="mt-[3px] truncate text-[12px] text-muted-foreground">
                        {v.changeNote || "—"}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {fmtDate(v.createdAt) || "—"} · {v.createdBy || "—"}
                      </div>
                    </div>
                    {v.current ? (
                      <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold whitespace-nowrap text-success [&>svg]:size-[13px]">
                        <CheckCircle2Icon />
                        Live
                      </span>
                    ) : !readonly ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRollback(v)
                        }}
                      >
                        <HistoryIcon data-icon="inline-start" />
                        Roll back
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel className="rounded-[12px]">
        <PanelHead
          icon={<GitBranchIcon />}
          title="Compare"
          action={
            <span className="text-[11.5px] text-muted-foreground">
              {hasPrev
                ? `v${from} → v${to}`
                : selected
                  ? `v${selected.versionNumber}`
                  : "—"}
            </span>
          }
        />
        <PanelBody>
          {!selected ? (
            <p className="text-[12px] text-muted-foreground">
              Select a version on the left to see what changed.
            </p>
          ) : !hasPrev ? (
            <Note tone="info" icon={<InfoIcon />}>
              <b>v{selected.versionNumber}</b> is the initial version — there’s
              no previous version to compare against.
            </Note>
          ) : compareQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : compareQuery.isError ? (
            <Note tone="err" icon={<TriangleAlertIcon />}>
              Couldn’t load this comparison.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => compareQuery.refetch()}
              >
                Try again
              </button>
              .
            </Note>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
                {(["old", "new"] as const).map((side) => (
                  <div key={side}>
                    <div
                      className={cn(
                        "mb-2.5 rounded-[7px] px-2.5 py-1.5 text-[11.5px] font-semibold",
                        side === "old"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success-subtle text-success-subtle-foreground"
                      )}
                    >
                      {side === "old"
                        ? `v${from} · previous`
                        : `v${to} · ${selected.current ? "current" : "selected"}`}
                    </div>
                    {(compareQuery.data?.diffs ?? []).map((d) => (
                      <React.Fragment key={`${side}-${d.field}`}>
                        <DcLabel>{fieldLabel(d.field)}</DcLabel>
                        <DiffSegments segments={d.segments} side={side} />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
              {!readonly && !selected.current ? (
                <div className="mt-3.5 flex items-center gap-3">
                  <span className="flex-1 text-[11.5px] text-muted-foreground">
                    Restoring v{selected.versionNumber} creates a new published
                    version; nothing is overwritten.
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => onRollback(selected)}
                  >
                    <HistoryIcon data-icon="inline-start" />
                    Roll back to v{selected.versionNumber}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </PanelBody>
      </Panel>
    </div>
  )
}

function DcLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 mb-1 text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}
