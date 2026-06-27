import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"

import type { Paged } from "@/lib/api/paged"

import { exportAuditLogs, fetchAuditLogs, type AuditQuery } from "./api"
import { auditKeys } from "./queries"
import type { AuditRow } from "./types"

const PAGE_SIZE = 20

/** A page of audit-log rows. Retained for any non-scrolling caller. */
export function useAuditLogs(q: AuditQuery = {}) {
  return useQuery({
    queryKey: auditKeys.list(q),
    queryFn: () => fetchAuditLogs(q),
  })
}

/** Infinitely-scrolled audit trail (newest first). Free-text search is done
   client-side over the accumulated loaded pages. */
export function useInfiniteAuditLogs(q: AuditQuery = {}) {
  return useInfiniteQuery({
    queryKey: auditKeys.infinite({ ...q, size: PAGE_SIZE }),
    queryFn: ({ pageParam }) =>
      fetchAuditLogs({ ...q, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last: Paged<AuditRow>) =>
      last.page < last.totalPages - 1 ? last.page + 1 : undefined,
  })
}

/** Download the audit trail as a file (CSV by default). Returns the Blob; the
   caller triggers the browser download. */
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (vars: { query?: AuditQuery; format?: "csv" | "json" } = {}) =>
      exportAuditLogs(vars.query, vars.format),
  })
}
