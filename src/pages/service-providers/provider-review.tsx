import { useNavigate, useParams } from "react-router-dom"

import { ProviderReview, ProviderReviewHub } from "./components/review"

/**
 * Provider review — the maker-checker approval workspace, a top-level routed
 * area (`/provider-review`) instead of a `useState` view inside the directory:
 *   /provider-review          → the hub (tabs: Review queue / Approved / Audit,
 *                               URL-backed via `?tab=`; default = the queue)
 *   /provider-review/:code    → one onboarding's section-by-section review
 * Nav-gated to approvers via the `provider-review` permId (see CONSOLE_ROLES).
 * The screens live in `components/review.tsx`; these wrappers only bind
 * navigation.
 */

export function ProviderReviewQueuePage() {
  const navigate = useNavigate()
  return (
    <ProviderReviewHub
      onOpenReview={(c) => navigate(`/provider-review/${encodeURIComponent(c)}`)}
      onOpenApproved={(c) =>
        navigate(`/service-providers/${encodeURIComponent(c)}`)
      }
    />
  )
}

export function ProviderReviewDetailPage() {
  const navigate = useNavigate()
  const { code = "" } = useParams()
  return (
    <ProviderReview
      key={code}
      code={code}
      onBack={() => navigate("/provider-review")}
    />
  )
}
