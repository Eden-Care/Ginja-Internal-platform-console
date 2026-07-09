import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom"
import { TriangleAlertIcon } from "lucide-react"

import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useModule } from "@/features/registry/use-module"
import { ModuleRecord } from "./components/module-record"

/** Detail tabs — kept in sync with ModuleRecord's TABS. */
const VALID_TABS = new Set(["overview", "hierarchy", "versions", "audit"])

/**
 * Route component for `/module-registry/:moduleId` — reads the module id (and
 * active tab via `?tab=`) from the URL and fetches by id, so a deep-link or a
 * page refresh restores the exact detail view. Mirrors PayerRecordPage.
 */
export function ModuleRecordPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const q = useModule(moduleId ?? null)

  if (!moduleId) return <Navigate to="/module-registry" replace />

  const tabParam = params.get("tab") ?? "overview"
  const tab = VALID_TABS.has(tabParam) ? tabParam : "overview"
  // Overview is the default → keep the URL clean; other tabs go in `?tab=`.
  // `replace` avoids stacking a history entry per tab switch.
  const setTab = (t: string) =>
    setParams(t === "overview" ? {} : { tab: t }, { replace: true })

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
        Couldn’t load this module.{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => q.refetch()}
        >
          Try again
        </button>{" "}
        or{" "}
        <button
          className="font-semibold underline underline-offset-2"
          onClick={() => navigate("/module-registry")}
        >
          back to registry
        </button>
        .
      </Note>
    )
  }

  return (
    <ModuleRecord
      key={moduleId}
      module={q.data}
      tab={tab}
      onTabChange={setTab}
      onBack={() => navigate("/module-registry")}
      onEdit={() => navigate(`/module-registry/${moduleId}/edit`)}
    />
  )
}
