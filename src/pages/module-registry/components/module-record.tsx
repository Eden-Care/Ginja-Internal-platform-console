import * as React from "react"
import {
  BanIcon,
  ChevronLeftIcon,
  HistoryIcon,
  InfoIcon,
} from "lucide-react"
import { toast } from "sonner"

import type { ModuleStatus, RegistryModule } from "@/lib/console-data"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Tagpill } from "@/components/console/tagpill"
import { MBadge } from "@/components/hifi/badge"
import { hifiBtn } from "@/components/hifi/button"
import { CopyId } from "@/components/console/copy-id"
import { Note } from "@/components/console/note"
import { HiIcon } from "@/components/hifi/icon"
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
  Published: <HiIcon name="checkCircle" />,
  Beta: <HiIcon name="zap" />,
  Sunset: <HiIcon name="alert" />,
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
    <div className="flex items-center gap-[11px] rounded-[12px] border bg-card px-[15px] py-3.5 shadow-xs">
      <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/[0.12] text-primary [&>svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[16px] leading-[1.1] font-bold">{value}</div>
        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

/** A definition-list row (right-aligned value). */
function DL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[30px] items-center justify-between gap-4 border-b py-[11px] text-[13px]">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
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
            `Rolled back ${m.name} to ${v.version}. A new published version was created.`
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
      icon: <HiIcon name="gitBranch" />,
      count: m.subs.length,
    },
    { k: "versions", label: "Versions", icon: <HistoryIcon /> },
    { k: "audit", label: "Audit log", icon: <HiIcon name="fileText" /> },
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
    <div className="flex flex-col gap-4 [&_svg]:[stroke-width:1.75]">
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
              <HiIcon name={m.icon} />
            </span>
            {m.name}
            <MBadge tone={MODULE_TONE[m.status]}>{m.status}</MBadge>
            <Tagpill className="text-[10.5px]">{m.version}</Tagpill>
          </h1>
          <div className="mt-[3px] flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
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
            <Button className={hifiBtn} onClick={onEdit}>
              <HiIcon name="pencil" />
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
              icon={<HiIcon name="gitBranch" />}
              value={m.version}
              label="Version"
            />
            <ModStat
              icon={<HiIcon name="layers" />}
              value={m.subs.length}
              label="Sub-modules"
            />
            <ModStat
              icon={<HiIcon name="building" />}
              value={m.tenants}
              label="Active tenants"
            />
          </div>

          <Panel className="rounded-[12px]">
            <PanelHead icon={<InfoIcon />} title="Module details" />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 text-[10px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
                  Description
                </div>
                <p className="text-[13.5px] leading-[1.55]">{m.desc || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
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
                      <HiIcon name={m.icon} />
                    </span>
                    <span className="mono text-[12px]">{m.icon}</span>
                  </span>
                </DL>
                <DL label="Status">
                  <MBadge tone={MODULE_TONE[m.status]}>{m.status}</MBadge>
                </DL>
              </div>
            </PanelBody>
          </Panel>

          <Panel className="rounded-[12px]">
            <PanelHead
              icon={<HiIcon name="gitBranch" />}
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
                      className="flex items-center gap-3 rounded-[10px] border bg-card px-[13px] py-[11px]"
                    >
                      <span className="grid size-[34px] shrink-0 place-items-center rounded-[8px] bg-muted text-muted-foreground [&>svg]:size-[15px]">
                        <HiIcon name="gitBranch" />
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
        <Panel className="rounded-[12px]">
          <PanelHead icon={<HiIcon name="gitBranch" />} title="Module hierarchy" />
          <PanelBody className="flex flex-col gap-3.5">
            <div className="rounded-[12px] border bg-muted/25 p-4">
              <div className="flex items-center gap-[11px] rounded-[10px] border bg-card px-[13px] py-[11px]">
                <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-primary/[0.12] text-primary [&>svg]:size-4">
                  <HiIcon name={m.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{m.name}</div>
                  <div className="mono text-[11px] text-muted-foreground">
                    {m.id}
                  </div>
                </div>
                <MBadge tone={MODULE_TONE[m.status]}>{m.status}</MBadge>
              </div>
              <div className="ml-[30px] flex flex-col border-l-2 pl-[18px]">
                {m.subs.map((s) => {
                  const dep = s.requires
                    ? m.subs.find((x) => x.id === s.requires)
                    : null
                  return (
                    <div
                      key={s.id}
                      className="relative mt-2.5 flex items-center gap-2.5 rounded-[9px] border bg-card px-3 py-2.5"
                    >
                      <span className="absolute top-1/2 -left-[18px] h-0.5 w-4 bg-border" />
                      <span className="grid size-[28px] shrink-0 place-items-center rounded-[7px] bg-muted text-muted-foreground [&>svg]:size-[13px]">
                        <HiIcon name="gitBranch" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
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
        icon={published ? <BanIcon /> : <HiIcon name="checkCircle" />}
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
        title={rollback ? `Roll back to ${rollback.version}?` : "Roll back"}
        confirmLabel={
          rollbackMut.isPending
            ? "Rolling back…"
            : rollback
              ? `Roll back to ${rollback.version}`
              : "Roll back"
        }
        onConfirm={doRollback}
        onCancel={() => (rollbackMut.isPending ? undefined : setRollback(null))}
        body={
          rollback ? (
            <>
              <p>
                This restores the <b>{rollback.version}</b> configuration as a
                new version. The current version is kept in history — nothing is
                overwritten.
              </p>
              <ImpactBox
                tone="warn"
                icon={<InfoIcon />}
                heading="What happens"
                items={[
                  `A new published version with the ${rollback.version} content is created and goes live immediately.`,
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
