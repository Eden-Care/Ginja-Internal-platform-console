import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { fetchSessions, revokeSession } from "./api"
import { settingsKeys } from "./queries"

/** Active device sessions across all Platform Console users, grouped by user. */
export function useSessions() {
  return useQuery({
    queryKey: settingsKeys.sessions(),
    queryFn: fetchSessions,
  })
}

/** Revoke one or more sessions (signs those devices out), then refetch the list. */
export function useRevokeSessions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionIds: string[]) =>
      Promise.all(sessionIds.map(revokeSession)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: settingsKeys.sessions() }),
  })
}
