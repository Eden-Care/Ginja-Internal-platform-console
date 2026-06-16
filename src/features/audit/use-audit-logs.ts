import { useQuery } from "@tanstack/react-query"

import { fetchAuditLogs, type AuditQuery } from "./api"
import { auditKeys } from "./queries"

/** A page of audit-log rows. Free-text search is done client-side over the
   loaded page (the API filters are structured: entity_type / action / actor). */
export function useAuditLogs(q: AuditQuery = {}) {
  return useQuery({
    queryKey: auditKeys.list(q),
    queryFn: () => fetchAuditLogs(q),
  })
}
