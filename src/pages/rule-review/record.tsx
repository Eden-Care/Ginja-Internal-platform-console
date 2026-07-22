import { Navigate, useNavigate, useParams } from "react-router-dom"

import { useAccess } from "@/contexts/access-context"
import { MiniBadge } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { useCurrentExtraction } from "@/features/rule-extraction/use-rule-extraction"
import { EXTRACT_STATUS_TONE } from "@/features/rule-extraction/types"
import { ContractResults } from "@/pages/service-providers/components/contracts"
import { BackLink } from "@/pages/service-providers/components/shared"

/**
 * Route component for `/rule-review/:providerCode/:insurerAccountId` — one
 * opened assignment. Reads the two routing ids from the URL so a deep-link or
 * a page refresh restores the exact review workspace. Mirrors
 * ServiceProviderRecordPage / ModuleRecordPage.
 *
 * No provider/insurer profile fetches — the review workspace only needs the
 * two routing ids (both in the URL), and the insurer-profile endpoint is
 * admin-only, which would 403 for approver reviewers.
 */
export function RuleReviewRecordPage() {
  const { providerCode, insurerAccountId } = useParams<{
    providerCode: string
    insurerAccountId: string
  }>()
  const navigate = useNavigate()
  const { isReadonly } = useAccess()
  const readonly = isReadonly("rule-review")

  const back = () => navigate("/rule-review")
  const currentQ = useCurrentExtraction(
    providerCode ?? "",
    insurerAccountId ?? ""
  )

  if (!providerCode || !insurerAccountId)
    return <Navigate to="/rule-review" replace />

  if (currentQ.isLoading)
    return (
      <div className="flex flex-col gap-3.5">
        <BackLink label="Rule review" onClick={back} />
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )

  if (currentQ.isError)
    return (
      <div className="flex flex-col gap-3.5">
        <BackLink label="Rule review" onClick={back} />
        <Note tone="err" icon={<HiIcon name="alert" />}>
          Couldn’t load this assignment. Retry, or open it from the provider’s
          Insurers tab.
        </Note>
      </div>
    )

  const x = currentQ.data
  if (!x || x.status !== "COMPLETED")
    return (
      <div className="flex flex-col gap-3.5">
        <BackLink label="Rule review" onClick={back} />
        <Note tone="info" icon={<HiIcon name="info" />}>
          {!x ? (
            <>No extraction exists for this pair yet.</>
          ) : (
            <>
              The current extraction is{" "}
              <MiniBadge tone={EXTRACT_STATUS_TONE[x.status]}>
                {x.status}
              </MiniBadge>{" "}
              — rules can be reviewed once it completes. Track it from the
              provider’s Insurers tab.
            </>
          )}
        </Note>
      </div>
    )

  return (
    <ContractResults
      key={`${providerCode}-${insurerAccountId}`}
      provider={{ displayId: providerCode }}
      insurer={{ accountId: insurerAccountId }}
      x={x}
      readonly={readonly}
      reviewMode
      backLabel="Rule review"
      onBack={back}
    />
  )
}
