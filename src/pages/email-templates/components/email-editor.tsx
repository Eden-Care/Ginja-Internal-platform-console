import * as React from "react"
import {
  CheckIcon,
  FileTextIcon,
  HistoryIcon,
  InfoIcon,
  SendIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  EMAIL_VERSIONS,
  type EmailTemplate,
  type DocStatus,
} from "@/lib/console-data"
import { Button } from "@/components/ui/button"
import { MBadge } from "@/components/hifi/badge"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { CopyId } from "@/components/console/copy-id"
import { Note } from "@/components/console/note"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import type { EmailVersionRow } from "@/features/email-templates/api"
import {
  useEmailTemplateDetail,
  useEmailTemplateVersions,
  useRollbackEmailTemplate,
  useUpdateEmailTemplate,
} from "@/features/email-templates/use-email-templates"
import {
  EmailTemplateForm,
  type EmailTemplateFormHandle,
} from "./email-template-form"
import { VersionsTab } from "./versions-tab"
import { AuditTab } from "./audit-tab"
import { SendTestModal } from "./send-test-modal"

const TPL_TONE: Record<DocStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
}

const buildTabs = (versionsCount?: number): TabItem[] => [
  { k: "editor", label: "Editor", icon: <HiIcon name="pencil" /> },
  {
    k: "versions",
    label: "Versions",
    icon: <HistoryIcon />,
    count: versionsCount,
  },
  { k: "audit", label: "Audit log", icon: <FileTextIcon /> },
]

/**
 * Email template editor — a record-page shell (breadcrumb, header with status +
 * Send test / Save & publish, three tabs). The Editor tab embeds the shared
 * create/edit form. Mirrors the hi-fi `EmailEditor`.
 */
export function EmailEditor({
  tpl,
  readonly = false,
  tab,
  onTabChange,
  onBack,
}: {
  tpl: EmailTemplate
  readonly?: boolean
  /** Active tab, driven by the `?tab=` URL param (see EmailEditorPage). */
  tab: string
  onTabChange: (t: string) => void
  onBack: () => void
}) {
  const [rollback, setRollback] = React.useState<EmailVersionRow | null>(null)
  const [sendTest, setSendTest] = React.useState(false)
  const cur = EMAIL_VERSIONS.find((v) => v.current) ?? EMAIL_VERSIONS[0]
  const overrides = tpl.overrides ?? 0

  // Fetch the full template detail (metadata + current version content) so the
  // editor form is filled from the live API, not derived/static placeholders.
  const detailQuery = useEmailTemplateDetail(tpl.templateId)

  // Real version count for the Versions tab badge (shares VersionsTab's query).
  const versionsQuery = useEmailTemplateVersions(tpl.templateId)
  const versionsCount =
    versionsQuery.data?.totalElements ?? versionsQuery.data?.items.length
  const TABS = buildTabs(versionsCount)

  // Editor form holds the edit state; the header Save button drives the PUT.
  const formRef = React.useRef<EmailTemplateFormHandle>(null)
  const updateMut = useUpdateEmailTemplate()
  const save = () => {
    const body = formRef.current?.submit()
    if (!body || tpl.templateId == null) return
    updateMut.mutate(
      { id: tpl.templateId, body, publish: true },
      {
        onSuccess: () => toast.success(`${tpl.name} saved & published.`),
        onError: (e) =>
          toast.error("Couldn't save template", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }
  const rollbackMut = useRollbackEmailTemplate()
  const doRollback = () => {
    const v = rollback
    if (!v || tpl.templateId == null) return
    rollbackMut.mutate(
      { id: tpl.templateId, versionNumber: v.versionNumber },
      {
        onSuccess: () => {
          toast.success(
            `Rolled back ${tpl.name} to v${v.versionNumber}. A new draft version was created.`
          )
          setRollback(null)
          onTabChange("versions")
        },
        onError: (e) =>
          toast.error("Couldn't roll back", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  return (
    <div className="flex flex-col gap-4 [&_svg]:[stroke-width:1.75]">
      <div>
        <div className="mb-2.5 flex items-center gap-[7px] text-xs text-muted-foreground">
          <button
            type="button"
            onClick={onBack}
            className="transition-colors hover:text-foreground"
          >
            Email templates
          </button>
          <span className="text-muted-foreground/45">/</span>
          <span className="font-medium text-foreground">{tpl.name}</span>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
              {tpl.name}
              <MBadge tone={tpl.archived ? "neutral" : TPL_TONE[tpl.status]}>
                {tpl.archived ? "Archived" : tpl.status}
              </MBadge>
            </h1>
            <div className="mt-[3px] flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
              <span>
                Trigger: {tpl.trigger} · {tpl.version}
              </span>
              <CopyId value={tpl.id} label="Template ID" />
            </div>
          </div>
          {tab === "editor" ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                className={hifiBtn}
                onClick={() => setSendTest(true)}
              >
                <SendIcon data-icon="inline-start" />
                Send test
              </Button>
              {!readonly ? (
                <Button
                  className={hifiBtn}
                  onClick={save}
                  disabled={updateMut.isPending}
                >
                  <CheckIcon data-icon="inline-start" />
                  {updateMut.isPending ? "Saving…" : "Save & publish"}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={onTabChange} />

      {tab === "editor" ? (
        detailQuery.isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : detailQuery.isError ? (
          <Note tone="err" icon={<TriangleAlertIcon />}>
            Couldn’t load this template.{" "}
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => detailQuery.refetch()}
            >
              Try again
            </button>
            .
          </Note>
        ) : detailQuery.data ? (
          <EmailTemplateForm ref={formRef} detail={detailQuery.data} embedded />
        ) : null
      ) : tab === "versions" ? (
        <VersionsTab
          templateId={tpl.templateId}
          readonly={readonly}
          onRollback={setRollback}
        />
      ) : (
        <AuditTab templateId={tpl.templateId} />
      )}

      {/* Mounted only while open so every open starts fresh (no stale
         sent/error state from a previous send). */}
      {sendTest ? (
        <SendTestModal
          open
          tpl={tpl}
          cur={cur}
          detail={detailQuery.data}
          onClose={() => setSendTest(false)}
        />
      ) : null}

      <ConfirmDialog
        open={!!rollback}
        icon={<HistoryIcon />}
        tone="warn"
        title={rollback ? `Roll back to v${rollback.versionNumber}?` : ""}
        confirmLabel={
          rollback ? `Roll back to v${rollback.versionNumber}` : "Roll back"
        }
        onConfirm={doRollback}
        onCancel={() => setRollback(null)}
        body={
          rollback ? (
            <>
              <p>
                This restores the <b>v{rollback.versionNumber}</b> subject &amp;
                body as a <b>new draft version</b> of {tpl.name}. The current
                live version is unchanged — nothing is deleted.
              </p>
              <ImpactBox
                tone="warn"
                icon={<InfoIcon />}
                heading="Impact"
                items={[
                  `A new draft with the v${rollback.versionNumber} content is created — publish it to make it live.`,
                  <>
                    <b>{overrides}</b> tenant{overrides === 1 ? "" : "s"} with
                    their own override are unaffected.
                  </>,
                  "A rollback entry is written to the audit log, attributed to you.",
                ]}
              />
            </>
          ) : undefined
        }
      />
    </div>
  )
}
