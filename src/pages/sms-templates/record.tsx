import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { TriangleAlertIcon } from "lucide-react"

import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useSmsTemplateDetail } from "@/features/sms-templates/use-sms-templates"
import { detailToSmsTemplate } from "@/features/sms-templates/types"
import { SmsEditor } from "./components/sms-editor"

/** Editor tabs — kept in sync with SmsEditor's buildTabs. */
const VALID_TABS = new Set(["editor", "versions", "audit"])

/**
 * Route component for `/sms-templates/:templateId` — reads the numeric id (and
 * active tab via `?tab=`) from the URL and fetches by id, so a deep-link or
 * refresh restores the exact editor view. Mirrors ModuleRecordPage.
 */
export function SmsEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const id = Number(templateId)
  const validId = Number.isFinite(id)
  const q = useSmsTemplateDetail(validId ? id : null)

  if (!validId) return <Navigate to="/sms-templates" replace />

  const tabParam = params.get("tab") ?? "editor"
  const tab = VALID_TABS.has(tabParam) ? tabParam : "editor"
  const setTab = (t: string) =>
    setParams(t === "editor" ? {} : { tab: t }, { replace: true })

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <LoadingSpinner />
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <Note tone="err" icon={<TriangleAlertIcon />}>
        Couldn’t load this template.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => q.refetch()}
        >
          Try again
        </button>{" "}
        or{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => navigate("/sms-templates")}
        >
          back to templates
        </button>
        .
      </Note>
    )
  }

  return (
    <SmsEditor
      key={id}
      tpl={detailToSmsTemplate(q.data)}
      tab={tab}
      onTabChange={setTab}
      onBack={() => navigate("/sms-templates")}
    />
  )
}
