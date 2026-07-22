/* TanStack Query hook for the rule-review dashboard. Query only — the page
   owns all UX. */

import { useQuery } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"

import { fetchRuleReviewDashboard } from "./api"
import { ruleReviewKeys } from "./queries"

/** Don't retry a 4xx — a 403 (caller can't review) is terminal. */
const retry4xx = (count: number, err: unknown) =>
  !(err instanceof ApiError && err.status >= 400 && err.status < 500) &&
  count < 1

/** The signed-in reviewer's dashboard (tiles + assignments). Pass `assigneeId`
    only as an ADMIN override. */
export function useRuleReviewDashboard(assigneeId?: number) {
  return useQuery({
    queryKey: ruleReviewKeys.dashboard(assigneeId),
    queryFn: () => fetchRuleReviewDashboard(assigneeId),
    retry: retry4xx,
  })
}
