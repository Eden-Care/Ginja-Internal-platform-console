import { Navigate, useParams } from "react-router-dom"

import { useAccess } from "@/contexts/access-context"
import { ProviderRecord } from "./components/record"

/**
 * Route component for `/service-providers/:code` — reads the provider code
 * (the `draft_code`) from the URL so a deep-link or a page refresh restores
 * the exact record. `ProviderRecord` owns its own loading / 403 / error states
 * via `useServiceProvider(code)` and renders a breadcrumb trail back to the
 * directory, so this wrapper just supplies the code + the readonly flag.
 */
export function ServiceProviderRecordPage() {
  const { code } = useParams<{ code: string }>()
  const { isReadonly } = useAccess()
  const readonly = isReadonly("providers")

  if (!code) return <Navigate to="/service-providers" replace />

  return <ProviderRecord key={code} code={code} readonly={readonly} />
}
