/* Query-key factory for the Approvals domain. */

export const approvalKeys = {
  all: ["approvals"] as const,
  lists: () => [...approvalKeys.all, "list"] as const,
  review: (payerId: number) => [...approvalKeys.all, "review", payerId] as const,
}
