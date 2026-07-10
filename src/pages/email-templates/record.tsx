import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { TriangleAlertIcon } from "lucide-react"

import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useEmailTemplateDetail } from "@/features/email-templates/use-email-templates"
import { detailToEmailTemplate } from "@/features/email-templates/types"
import { EmailEditor } from "./components/email-editor"

/** Editor tabs — kept in sync with EmailEditor's buildTabs. */
const VALID_TABS = new Set(["editor", "versions", "audit"])

/**
 * Route component for `/email-templates/:templateId` — reads the numeric id (and
 * active tab via `?tab=`) from the URL and fetches by id, so a deep-link or
 * refresh restores the exact editor view. Mirrors ModuleRecordPage.
 */
export function EmailEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const id = Number(templateId)
  const validId = Number.isFinite(id)
  const q = useEmailTemplateDetail(validId ? id : null)

  if (!validId) return <Navigate to="/email-templates" replace />

  const tabParam = params.get("tab") ?? "editor"
  const tab = VALID_TABS.has(tabParam) ? tabParam : "editor"
  // Editor is the default → keep the URL clean; other tabs go in `?tab=`.
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
          onClick={() => navigate("/email-templates")}
        >
          back to templates
        </button>
        .
      </Note>
    )
  }

  return (
    <EmailEditor
      key={id}
      tpl={detailToEmailTemplate(q.data)}
      tab={tab}
      onTabChange={setTab}
      onBack={() => navigate("/email-templates")}
    />
  )
}
