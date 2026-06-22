/* Query-key factory for the Tenant accounts (Payers) domain. */

export const payerKeys = {
  all: ["payers"] as const,
  lists: () => [...payerKeys.all, "list"] as const,
}
