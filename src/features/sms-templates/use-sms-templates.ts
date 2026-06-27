import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { Paged } from "@/lib/api/paged"

import {
  createSmsTemplate,
  duplicateSmsTemplate,
  fetchSmsTemplateActivity,
  fetchSmsTemplateCompare,
  fetchSmsTemplateDetail,
  fetchSmsTemplates,
  fetchSmsTemplateVersions,
  publishSmsTemplate,
  rollbackSmsTemplate,
  setSmsTemplateActive,
  setSmsTemplateArchived,
  updateSmsTemplate,
  type SmsTemplateQuery,
} from "./api"
import { smsTemplateKeys } from "./queries"
import type { CreateSmsTemplateBody, SmsTemplate } from "./types"

const PAGE_SIZE = 20

/** SMS templates list (paged). Kept for the archived-count badge query. */
export function useSmsTemplates(q: SmsTemplateQuery = {}) {
  return useQuery({
    queryKey: smsTemplateKeys.list(q),
    queryFn: () => fetchSmsTemplates(q),
  })
}

/** Infinitely-scrolled SMS template library. `archived` is a server filter. */
export function useInfiniteSmsTemplates(opts: { archived: boolean }) {
  return useInfiniteQuery({
    queryKey: smsTemplateKeys.infinite({
      size: PAGE_SIZE,
      archived: opts.archived,
    }),
    queryFn: ({ pageParam }) =>
      fetchSmsTemplates({
        page: pageParam,
        size: PAGE_SIZE,
        archived: opts.archived,
      }),
    initialPageParam: 0,
    getNextPageParam: (last: Paged<SmsTemplate>) =>
      last.page < last.totalPages - 1 ? last.page + 1 : undefined,
  })
}

/** Full detail for the editor (single get-one call). Disabled until id known. */
export function useSmsTemplateDetail(id: number | null | undefined) {
  return useQuery({
    queryKey: smsTemplateKeys.detail(id ?? 0),
    queryFn: () => fetchSmsTemplateDetail(id as number),
    enabled: id != null,
  })
}

/** Version history. */
export function useSmsTemplateVersions(
  id: number | null | undefined,
  q: SmsTemplateQuery = {}
) {
  return useQuery({
    queryKey: smsTemplateKeys.versions(id ?? 0, q),
    queryFn: () => fetchSmsTemplateVersions(id as number, q),
    enabled: id != null,
  })
}

/** Word-by-word diff between two versions (disabled unless a distinct pair). */
export function useSmsTemplateCompare(
  id: number | null | undefined,
  from: number | null | undefined,
  to: number | null | undefined
) {
  return useQuery({
    queryKey: smsTemplateKeys.compare(id ?? 0, from ?? 0, to ?? 0),
    queryFn: () =>
      fetchSmsTemplateCompare(id as number, from as number, to as number),
    enabled: id != null && from != null && to != null && from !== to,
  })
}

/** Audit/activity feed. */
export function useSmsTemplateActivity(
  id: number | null | undefined,
  q: SmsTemplateQuery = {}
) {
  return useQuery({
    queryKey: smsTemplateKeys.activity(id ?? 0, q),
    queryFn: () => fetchSmsTemplateActivity(id as number, q),
    enabled: id != null,
  })
}

/** POST a new SMS template; refetches the library. */
export function useCreateSmsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSmsTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Edit via PUT (new version), then optionally publish; refetches everything. */
export function useUpdateSmsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      body,
      publish,
    }: {
      id: number
      body: CreateSmsTemplateBody
      publish?: boolean
    }) => {
      const res = await updateSmsTemplate(id, body)
      if (publish) await publishSmsTemplate(id)
      return res
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Roll back to an old version (creates a new draft version); refetches. */
export function useRollbackSmsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      versionNumber,
    }: {
      id: number
      versionNumber: number
    }) => rollbackSmsTemplate(id, versionNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Publish the latest version. */
export function usePublishSmsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => publishSmsTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Enable/disable (activate/deactivate). */
export function useSetSmsTemplateActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setSmsTemplateActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Archive/restore (soft delete). */
export function useSetSmsTemplateArchived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      setSmsTemplateArchived(id, archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}

/** Duplicate (recreate as a new draft). */
export function useDuplicateSmsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => duplicateSmsTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: smsTemplateKeys.all }),
  })
}
