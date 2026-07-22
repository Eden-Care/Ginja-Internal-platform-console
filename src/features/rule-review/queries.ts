/* Query-key factory for the rule-review dashboard domain. */

export const ruleReviewKeys = {
  all: ["rule-review"] as const,
  dashboard: (assigneeId?: number) =>
    [...ruleReviewKeys.all, "dashboard", assigneeId ?? "me"] as const,
}
