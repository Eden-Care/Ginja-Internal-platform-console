import * as React from "react"
import {
  AlertTriangleIcon,
  BanIcon,
  Building2Icon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  FileTextIcon,
  GitBranchIcon,
  HistoryIcon,
  InfoIcon,
  LayersIcon,
  PencilIcon,
  ZapIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { ModuleStatus, RegistryModule } from "@/lib/console-data"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { CopyId } from "@/components/console/copy-id"
import { Note } from "@/components/console/note"
import { Glyph } from "@/components/console/glyph"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import {
  useRollbackModule,
  useUpdateModule,
} from "@/features/registry/use-module-mutations"
import type { ModuleVersion } from "@/features/registry/types"
import { MODULE_TONE } from "../status"
import { ModuleVersionsTab } from "./versions-tab"
import { ModuleAuditTab } from "./audit-tab"

const STAT_ICON: Record<ModuleStatus, React.ReactNode> = {
  Published: <CheckCircle2Icon />,
  Beta: <ZapIcon />,
  Sunset: <AlertTriangleIcon />,
}

/** A module-overview KPI cell. */
function ModStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs">
      <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/10 text-primary [&>svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold">{value}</div>
        <div className="text-[11px] font-medium text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  )
}

/** A definition-list row (right-aligned value). */
function DL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t py-2.5 text-[13px] first:border-t-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">
        {children}
      </span>
    </div>
  )
}

export function ModuleRecord({
  module: m,
  readonly = false,
  onBack,
  onEdit,
}: {
  module: RegistryModule
  readonly?: boolean
  onBack: () => void
  onEdit: () => void
}) {
  const [tab, setTab] = React.useState("overview")
  const [published, setPublished] = React.useState(m.status === "Published")
  const [confirmPub, setConfirmPub] = React.useState(false)
  const [rollback, setRollback] = React.useState<ModuleVersion | null>(null)
  const updateMut = useUpdateModule()
  const rollbackMut = useRollbackModule()

  const doRollback = () => {
    if (!rollback) return
    const v = rollback
    rollbackMut.mutate(
      { moduleId: m.id, version: v.version },
      {
        onSuccess: () => {
          toast.success(
            `Rolled back ${m.name} to v${v.version}. A new published version was created.`
          )
          setRollback(null)
        },
        onError: (e) => {
          setRollback(null)
          toast.error("Couldn't roll back", {
            description: e instanceof Error ? e.message : undefined,
          })
        },
      }
    )
  }

  const TABS: TabItem[] = [
    { k: "overview", label: "Overview", icon: <InfoIcon /> },
    {
      k: "hierarchy",
      label: "Hierarchy",
      icon: <GitBranchIcon />,
      count: m.subs.length,
    },
    { k: "versions", label: "Versions", icon: <HistoryIcon /> },
    { k: "audit", label: "Audit log", icon: <FileTextIcon /> },
  ]

  const codeDisplay = m.code || m.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")

  const doPublish = () => {
    const next = !published
    updateMut.mutate(
      { moduleId: m.id, body: { status: next ? "PUBLISHED" : "DRAFT" } },
      {
        onSuccess: () => {
          setPublished(next)
          setConfirmPub(false)
          toast.success(`${m.name} ${next ? "published" : "unpublished"}.`)
        },
        onError: (e) => {
          setConfirmPub(false)
          toast.error(`Couldn't ${next ? "publish" : "unpublish"} the module`, {
            description: e instanceof Error ? e.message : undefined,
          })
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary [&>svg]:size-[14px]"
      >
        <ChevronLeftIcon />
        Module registry
      </button>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-primary/[0.12] text-primary [&>svg]:size-[18px]">
              <Glyph name={m.icon} />
            </span>
            {m.name}
            <MiniBadge tone={MODULE_TONE[m.status]}>{m.status}</MiniBadge>
            <Tagpill className="text-[10.5px]">{m.version}</Tagpill>
          </h1>
          <div className="mt-[3px] flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{m.desc || "—"}</span>
            <CopyId value={m.id} label="Module ID" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="flex items-center gap-2 text-[12.5px] font-medium">
            Published
            <Switch
              checked={published}
              disabled={readonly}
              onCheckedChange={() => !readonly && setConfirmPub(true)}
            />
          </label>
          {!readonly ? (
            <Button size="sm" onClick={onEdit}>
              <PencilIcon data-icon="inline-start" />
              Edit module
            </Button>
          ) : null}
        </div>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ModStat
              icon={STAT_ICON[m.status]}
              value={m.status}
              label="Status"
            />
            <ModStat
              icon={<GitBranchIcon />}
              value={m.version}
              label="Version"
            />
            <ModStat
              icon={<LayersIcon />}
              value={m.subs.length}
              label="Sub-modules"
            />
            <ModStat
              icon={<Building2Icon />}
              value={m.tenants}
              label="Active tenants"
            />
          </div>

          <Panel>
            <PanelHead icon={<InfoIcon />} title="Module details" />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                  Description
                </div>
                <p className="text-[13.5px] leading-[1.55]">{m.desc || "—"}</p>
              </div>
              <div className="flex flex-col">
                <DL label="Module ID">
                  <CopyId value={m.id} />
                </DL>
                <DL label="Module code">
                  <span className="mono">{codeDisplay}</span>
                </DL>
                <DL label="Module URL">
                  <span className="mono">{m.url || "—"}</span>
                </DL>
                <DL label="Owner team">{m.owner || "—"}</DL>
                <DL label="Icon">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="grid size-[22px] place-items-center rounded-md bg-muted text-muted-foreground [&>svg]:size-3">
                      <Glyph name={m.icon} />
                    </span>
                    <span className="mono text-[12px]">{m.icon}</span>
                  </span>
                </DL>
                <DL label="Status">
                  <MiniBadge tone={MODULE_TONE[m.status]}>{m.status}</MiniBadge>
                </DL>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead
              icon={<GitBranchIcon />}
              title="Sub-modules"
              action={
                <Tagpill className="text-[10.5px]">{m.subs.length}</Tagpill>
              }
            />
            <PanelBody className="flex flex-col gap-2">
              {m.subs.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                  This module has no sub-modules.
                </p>
              ) : (
                m.subs.map((s) => {
                  const dep = s.requires
                    ? m.subs.find((x) => x.id === s.requires)
                    : null
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <span className="grid size-[34px] shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-[15px]">
                        <GitBranchIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium">
                            {s.name}
                          </span>
                          <code className="mono rounded bg-muted px-1.5 py-px text-[10.5px] font-semibold text-muted-foreground">
                            {s.id.toUpperCase()}
                          </code>
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
                    </div>
                  )
                })
              )}
            </PanelBody>
          </Panel>
        </div>
      ) : tab === "hierarchy" ? (
        <Panel>
          <PanelHead icon={<GitBranchIcon />} title="Module hierarchy" />
          <PanelBody className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/[0.12] text-primary [&>svg]:size-4">
                <Glyph name={m.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{m.name}</div>
                <div className="mono text-[11px] text-muted-foreground">
                  {m.id}
                </div>
              </div>
              <MiniBadge tone={MODULE_TONE[m.status]}>{m.status}</MiniBadge>
            </div>
            <div className="flex flex-col gap-2 pl-5">
              {m.subs.map((s) => {
                const dep = s.requires
                  ? m.subs.find((x) => x.id === s.requires)
                  : null
                return (
                  <div key={s.id} className="relative flex items-center gap-3">
                    <span className="absolute top-1/2 -left-5 h-px w-4 bg-border" />
                    <span className="grid size-[26px] shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&>svg]:size-[13px]">
                      <GitBranchIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium">{s.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {s.desc}
                      </div>
                    </div>
                    {dep ? (
                      <span className="shrink-0 rounded-[5px] bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                        requires {dep.name}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <Note tone="info" icon={<InfoIcon />}>
              Dependencies are enforced during onboarding — selecting a
              dependent sub-module auto-selects its requirement.
            </Note>
          </PanelBody>
        </Panel>
      ) : tab === "versions" ? (
        <ModuleVersionsTab
          moduleId={m.id}
          readonly={readonly}
          onRollback={setRollback}
        />
      ) : (
        <ModuleAuditTab moduleId={m.id} />
      )}

      <ConfirmDialog
        open={confirmPub}
        icon={published ? <BanIcon /> : <CheckCircle2Icon />}
        tone="warn"
        title={published ? `Unpublish "${m.name}"?` : `Publish "${m.name}"?`}
        confirmLabel={published ? "Unpublish module" : "Publish module"}
        onConfirm={doPublish}
        onCancel={() => setConfirmPub(false)}
        body={
          <ImpactBox
            tone="warn"
            icon={<InfoIcon />}
            heading="What happens"
            items={
              published
                ? [
                    "The module is hidden from onboarding — new tenants can no longer select it.",
                    `${m.tenants} tenant${m.tenants === 1 ? "" : "s"} already using it keep access; nothing is removed.`,
                    `Its ${m.subs.length} sub-module${m.subs.length === 1 ? "" : "s"} become unavailable to select too.`,
                  ]
                : [
                    "The module becomes selectable during tenant onboarding immediately.",
                    `All ${m.subs.length} sub-module${m.subs.length === 1 ? "" : "s"} become available to select.`,
                    "An entry is written to the module audit log.",
                  ]
            }
          />
        }
      />

      <ConfirmDialog
        open={!!rollback}
        icon={<HistoryIcon />}
        tone="warn"
        title={rollback ? `Roll back to v${rollback.version}?` : "Roll back"}
        confirmLabel={
          rollbackMut.isPending
            ? "Rolling back…"
            : rollback
              ? `Roll back to v${rollback.version}`
              : "Roll back"
        }
        onConfirm={doRollback}
        onCancel={() => (rollbackMut.isPending ? undefined : setRollback(null))}
        body={
          rollback ? (
            <>
              <p>
                This restores the <b>v{rollback.version}</b> configuration as a
                new version. The current version is kept in history — nothing is
                overwritten.
              </p>
              <ImpactBox
                tone="warn"
                icon={<InfoIcon />}
                heading="What happens"
                items={[
                  `A new published version with the v${rollback.version} content is created and goes live immediately.`,
                  "The previously current version is archived in the version history.",
                  "A rollback entry is written to the module audit log, attributed to you.",
                ]}
              />
            </>
          ) : null
        }
      />
    </div>
  )
}
