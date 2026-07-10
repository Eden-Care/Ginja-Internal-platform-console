import { useNavigate, useParams } from "react-router-dom"
import { TriangleAlertIcon } from "lucide-react"

import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useModule } from "@/features/registry/use-module"
import { ModuleForm } from "./components/module-form"

/**
 * Route component for `/module-registry/new` (create) and
 * `/module-registry/:moduleId/edit` (edit). In edit mode it fetches the module
 * by id so a refresh on the edit URL restores the form. On save/cancel it
 * returns to the list (create) or the module detail (edit).
 */
export function ModuleFormPage() {
  const { moduleId } = useParams<{ moduleId: string }>()
  const navigate = useNavigate()
  const editing = !!moduleId
  const q = useModule(editing ? (moduleId ?? null) : null)

  if (editing) {
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
            onClick={() => navigate("/module-registry")}
          >
            Back to registry
          </button>
          .
        </Note>
      )
    }
    return (
      <ModuleForm
        existing={q.data}
        onBack={() => navigate(`/module-registry/${moduleId}`)}
      />
    )
  }

  return <ModuleForm onBack={() => navigate("/module-registry")} />
}
