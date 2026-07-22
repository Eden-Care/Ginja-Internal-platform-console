import { Navigate, useNavigate, useParams } from "react-router-dom"

import { useAccess } from "@/contexts/access-context"
import { ProviderRecord } from "./components/record"

/**
 * Route component for `/service-providers/:code` — reads the provider code
 * (the `draft_code`) from the URL so a deep-link or a page refresh restores
 * the exact record. Mirrors ModuleRecordPage / PayerRecordPage. `ProviderRecord`
 * owns its own loading / 403 / error states via `useServiceProvider(code)`, so
 * this wrapper just supplies the code, the readonly flag and back navigation.
 */
export function ServiceProviderRecordPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { isReadonly } = useAccess()
  const readonly = isReadonly("providers")

  if (!code) return <Navigate to="/service-providers" replace />

  return (
    <ProviderRecord
      key={code}
      code={code}
      readonly={readonly}
      onClose={() => navigate("/service-providers")}
    />
  )
}
