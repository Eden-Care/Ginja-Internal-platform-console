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

import { Button } from "@/components/ui/button"
import { MBadge } from "@/components/hifi/badge"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { CopyId } from "@/components/console/copy-id"
import { Note } from "@/components/console/note"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { ConfirmDialog, ImpactBox } from "@/components/console/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading"
import type { SmsTemplate, SmsVersionRow } from "@/features/sms-templates/types"
import {
  useRollbackSmsTemplate,
  useSmsTemplateDetail,
  useSmsTemplateVersions,
  useUpdateSmsTemplate,
} from "@/features/sms-templates/use-sms-templates"
import {
  SmsTemplateForm,
  type SmsTemplateFormHandle,
} from "./sms-template-form"
import { SmsVersionsTab } from "./sms-versions-tab"
import { SmsAuditTab } from "./sms-audit-tab"
import { SmsSendTestModal } from "./sms-send-test-modal"

const TPL_TONE = { Published: "success", Draft: "neutral" } as const

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

/** SMS template editor — record-page shell (breadcrumb, header, three tabs).
   The Editor tab embeds the create/edit form. Mirrors the hi-fi `SmsEditor`. */
export function SmsEditor({
  tpl,
  readonly = false,
  onBack,
}: {
  tpl: SmsTemplate
  readonly?: boolean
  onBack: () => void
}) {
  const [tab, setTab] = React.useState("editor")
  const [rollback, setRollback] = React.useState<SmsVersionRow | null>(null)
  const [sendTest, setSendTest] = React.useState(false)

  const detailQuery = useSmsTemplateDetail(tpl.templateId)
  const versionsQuery = useSmsTemplateVersions(tpl.templateId)
  const versionsCount =
    versionsQuery.data?.totalElements ?? versionsQuery.data?.items.length
  const TABS = buildTabs(versionsCount)

  const formRef = React.useRef<SmsTemplateFormHandle>(null)
  const updateMut = useUpdateSmsTemplate()
  const save = () => {
    const body = formRef.current?.submit()
    if (!body) return
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

  const rollbackMut = useRollbackSmsTemplate()
  const doRollback = () => {
    const v = rollback
    if (!v) return
    rollbackMut.mutate(
      { id: tpl.templateId, versionNumber: v.versionNumber },
      {
        onSuccess: () => {
          toast.success(
            `Rolled back ${tpl.name} to v${v.versionNumber}. A new draft version was created.`
          )
          setRollback(null)
          setTab("versions")
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
            SMS templates
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

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

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
          <SmsTemplateForm ref={formRef} detail={detailQuery.data} embedded />
        ) : null
      ) : tab === "versions" ? (
        <SmsVersionsTab
          templateId={tpl.templateId}
          readonly={readonly}
          onRollback={setRollback}
        />
      ) : (
        <SmsAuditTab templateId={tpl.templateId} />
      )}

      <SmsSendTestModal
        open={sendTest}
        tpl={tpl}
        message={detailQuery.data?.messageText ?? tpl.message}
        onClose={() => setSendTest(false)}
      />

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
                This restores the <b>v{rollback.versionNumber}</b> message as a{" "}
                <b>new draft version</b> of {tpl.name}. The current live version
                is unchanged.
              </p>
              <ImpactBox
                tone="warn"
                icon={<InfoIcon />}
                heading="Impact"
                items={[
                  `A new draft with the v${rollback.versionNumber} text is created — publish it to make it live.`,
                  "Tenants with their own override are unaffected.",
                  "A rollback entry is written to the audit log.",
                ]}
              />
            </>
          ) : undefined
        }
      />
    </div>
  )
}
