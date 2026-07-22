import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"

import type { ServiceProvider } from "@/features/service-providers/types"
import { ProviderOnboard } from "./components/onboard"
import { ProviderCreated } from "./components/created"

/**
 * Route component for `/service-providers/onboard` (new provider) and
 * `/service-providers/:code/edit` (resume a DRAFT). The post-submit
 * confirmation stays un-routed — it renders from local state after `onDone`,
 * mirroring the tenant-accounts onboard flow.
 */
export function OnboardServiceProviderPage() {
  const navigate = useNavigate()
  // `code` is set only on the `/:code/edit` route (resume a draft).
  const { code } = useParams<{ code?: string }>()
  const [created, setCreated] = React.useState<ServiceProvider | null>(null)

  if (created)
    return (
      <ProviderCreated
        provider={created}
        onList={() => navigate("/service-providers")}
        onView={() =>
          navigate(`/service-providers/${encodeURIComponent(created.code)}`)
        }
      />
    )

  return (
    <ProviderOnboard
      initialCode={code || undefined}
      onBack={() => navigate("/service-providers")}
      onDone={(rec) => setCreated(rec)}
    />
  )
}
