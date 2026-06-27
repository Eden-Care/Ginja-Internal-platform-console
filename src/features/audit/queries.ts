import type { AuditQuery } from "./api"

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (q: AuditQuery) => [...auditKeys.all, "list", q] as const,
  infinite: (q: AuditQuery) => [...auditKeys.all, "infinite", q] as const,
}
