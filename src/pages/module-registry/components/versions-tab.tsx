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
import { MiniBadge } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import {
  useModuleCompare,
  useModuleVersions,
} from "@/features/registry/use-module-detail"
import type { ModuleVersion } from "@/features/registry/types"
import type { EmailDiffSegment } from "@/features/email-templates/types"
import { DiffSegments } from "@/pages/email-templates/components/diff-text"

const FIELD_LABEL: Record<string, string> = {
  name: "Name",
  description: "Description",
  owner_team: "Owner team",
  ownerTeam: "Owner team",
  status: "Status",
  icon: "Icon",
  url: "Module URL",
  version: "Version",
  note: "Change note",
  code: "Code",
}
const fieldLabel = (f: string) =>
  FIELD_LABEL[f] ??
  f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

/** One labelled diff row (field name + old/new segments per side). */
type DiffField = { label: string; segments: EmailDiffSegment[] }

/**
 * The module's "Versions" tab — version history (left) beside a Compare panel
 * (right), mirroring the email template editor. Selecting a version shows the
 * field-level diff of its predecessor → itself, rendered git-style.
 */
export function ModuleVersionsTab({
  moduleId,
  readonly,
  onRollback,
}: {
  moduleId: string
  readonly?: boolean
  onRollback: (v: ModuleVersion) => void
}) {
  const versionsQuery = useModuleVersions(moduleId)
  const rows = versionsQuery.data ?? [] // newest first
  const current = rows.find((r) => r.current) ?? rows[0]

  const [selectedVer, setSelectedVer] = React.useState<string | null>(null)
  const selected = rows.find((r) => r.version === selectedVer) ?? current
  const selIndex = selected
    ? rows.findIndex((r) => r.version === selected.version)
    : -1
  // Rows are newest-first, so the predecessor is the next row down.
  const prev = selIndex >= 0 ? (rows[selIndex + 1] ?? null) : null
  const from = prev?.version ?? null
  const to = selected?.version ?? null
  const hasPrev = !!from && !!to

  const compareQuery = useModuleCompare(moduleId, from, to)

  // Fold the field-level diff (+ sub-module add/remove) into email-style rows.
  const diffFields: DiffField[] = React.useMemo(() => {
    const c = compareQuery.data
    if (!c) return []
    const fields: DiffField[] = c.changedFields.map((f) => ({
      label: fieldLabel(f.field),
      segments: [
        { op: "DELETE", text: f.from },
        { op: "INSERT", text: f.to },
      ],
    }))
    if (c.subsAdded.length > 0 || c.subsRemoved.length > 0) {
      fields.push({
        label: "Sub-modules",
        segments: [
          ...c.subsRemoved.map((s) => ({
            op: "DELETE" as const,
            text: `${s.name} `,
          })),
          ...c.subsAdded.map((s) => ({
            op: "INSERT" as const,
            text: `${s.name} `,
          })),
        ],
      })
    }
    return fields
  }, [compareQuery.data])

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
      <Panel>
        <PanelHead icon={<HistoryIcon />} title="Version history" />
        <PanelBody className="p-2">
          {rows.length === 0 ? (
            <div className="px-2.5 py-8 text-center text-[12px] text-muted-foreground">
              No versions yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {rows.map((v) => {
                const sel = selected?.version === v.version
                const badge = versionStatusBadge(v.status)
                return (
                  <div
                    key={v.version}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedVer(v.version)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedVer(v.version)
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
                        "mono grid size-[38px] shrink-0 place-items-center rounded-full text-[12px] font-bold",
                        v.current
                          ? "bg-primary/[0.14] text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {v.version}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <b className="text-[13.5px]">v{v.version}</b>
                        {v.status ? (
                          <MiniBadge tone={badge.tone}>{badge.label}</MiniBadge>
                        ) : null}
                      </div>
                      <div className="mt-[3px] truncate text-[12px] text-muted-foreground">
                        {v.note || "—"}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {fmtDate(v.createdAt) || "—"} · {v.byName || "—"}
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
                        Rollback
                      </Button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          icon={<GitBranchIcon />}
          title="Compare"
          action={
            <span className="text-[11.5px] text-muted-foreground">
              {hasPrev
                ? `v${from} → v${to}`
                : selected
                  ? `v${selected.version}`
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
              <b>v{selected.version}</b> is the initial version — there’s no
              previous version to compare against.
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
          ) : diffFields.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No field changes between v{from} and v{to}.
            </p>
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
                    {diffFields.map((d) => (
                      <React.Fragment key={`${side}-${d.label}`}>
                        <DcLabel>{d.label}</DcLabel>
                        <DiffSegments segments={d.segments} side={side} />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
              {!readonly && !selected.current ? (
                <div className="mt-3.5 flex items-center gap-3">
                  <span className="flex-1 text-[11.5px] text-muted-foreground">
                    Restoring v{selected.version} creates a new published
                    version; nothing is overwritten.
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => onRollback(selected)}
                  >
                    <HistoryIcon data-icon="inline-start" />
                    Rollback to v{selected.version}
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
