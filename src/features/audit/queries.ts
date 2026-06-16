import type { AuditQuery } from "./api"

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (q: AuditQuery) => [...auditKeys.all, "list", q] as const,
}
