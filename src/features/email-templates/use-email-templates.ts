import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { Paged } from "@/lib/api/paged"
import type { EmailTemplate } from "@/lib/console-data"

import {
  createEmailTemplate,
  duplicateEmailTemplate,
  fetchEmailTemplateActivity,
  fetchEmailTemplateCompare,
  fetchEmailTemplateDetail,
  fetchEmailTemplates,
  fetchEmailTemplateVersions,
  publishEmailTemplate,
  rollbackEmailTemplate,
  sendTestEmail,
  setEmailTemplateActive,
  setEmailTemplateArchived,
  updateEmailTemplate,
  type EmailTemplateQuery,
  type SendTestEmailBody,
} from "./api"
import { emailTemplateKeys } from "./queries"
import type { CreateEmailTemplateBody } from "./types"

const PAGE_SIZE = 20

/** Email templates list (document service). Kept (non-infinite) for the
   archived-count badge query. */
export function useEmailTemplates(q: EmailTemplateQuery = {}) {
  return useQuery({
    queryKey: emailTemplateKeys.list(q),
    queryFn: () => fetchEmailTemplates(q),
  })
}

/** Infinitely-scrolled email template library. `archived` is a server filter;
   changing it swaps the query key, restarting at page 0. */
export function useInfiniteEmailTemplates(opts: { archived: boolean }) {
  return useInfiniteQuery({
    queryKey: emailTemplateKeys.infinite({
      size: PAGE_SIZE,
      archived: opts.archived,
    }),
    queryFn: ({ pageParam }) =>
      fetchEmailTemplates({
        page: pageParam,
        size: PAGE_SIZE,
        archived: opts.archived,
      }),
    initialPageParam: 0,
    getNextPageParam: (last: Paged<EmailTemplate>) =>
      last.page < last.totalPages - 1 ? last.page + 1 : undefined,
  })
}

/** Full detail (metadata + current version content) for the editor. Disabled
   until a numeric template id is available. */
export function useEmailTemplateDetail(id: number | null | undefined) {
  return useQuery({
    queryKey: emailTemplateKeys.detail(id ?? 0),
    queryFn: () => fetchEmailTemplateDetail(id as number),
    enabled: id != null,
  })
}

/** Version history for a template (document service). Disabled until a numeric
   template id is available. */
export function useEmailTemplateVersions(
  id: number | null | undefined,
  q: EmailTemplateQuery = {}
) {
  return useQuery({
    queryKey: emailTemplateKeys.versions(id ?? 0, q),
    queryFn: () => fetchEmailTemplateVersions(id as number, q),
    enabled: id != null,
  })
}

/** Audit/activity feed for a template (document service). Disabled until a
   numeric template id is available. */
export function useEmailTemplateActivity(
  id: number | null | undefined,
  q: EmailTemplateQuery = {}
) {
  return useQuery({
    queryKey: emailTemplateKeys.activity(id ?? 0, q),
    queryFn: () => fetchEmailTemplateActivity(id as number, q),
    enabled: id != null,
  })
}

/** Word-by-word diff between two versions of a template. Disabled unless a valid
   distinct (from, to) pair is available (so v1 with no predecessor won't fire). */
export function useEmailTemplateCompare(
  id: number | null | undefined,
  from: number | null | undefined,
  to: number | null | undefined
) {
  return useQuery({
    queryKey: emailTemplateKeys.compare(id ?? 0, from ?? 0, to ?? 0),
    queryFn: () =>
      fetchEmailTemplateCompare(id as number, from as number, to as number),
    enabled: id != null && from != null && to != null && from !== to,
  })
}

/** POST a new email template; refetches the library on success. */
export function useCreateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Edit a template via PUT (creates a new version, same body as create), then
   optionally publish it. Refetches the library + this template's detail/versions. */
export function useUpdateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      body,
      publish,
    }: {
      id: number
      body: CreateEmailTemplateBody
      publish?: boolean
    }) => {
      const res = await updateEmailTemplate(id, body)
      if (publish) await publishEmailTemplate(id)
      return res
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Roll back to an old version (creates a new draft version); refetches. */
export function useRollbackEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      versionNumber,
    }: {
      id: number
      versionNumber: number
    }) => rollbackEmailTemplate(id, versionNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Publish a template (its latest version goes live); refetches the library. */
export function usePublishEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => publishEmailTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Enable/disable a template (activate/deactivate); refetches the library. */
export function useSetEmailTemplateActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setEmailTemplateActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Archive / unarchive a template (moves it in/out of the Archived view). */
export function useSetEmailTemplateArchived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) =>
      setEmailTemplateArchived(id, archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}

/** Queue a test email via the notification service (POST /email/send). */
export function useSendTestEmail() {
  return useMutation({
    mutationFn: (body: SendTestEmailBody) => sendTestEmail(body),
  })
}

/** Duplicate a template (recreate as a new draft); refetches the library. */
export function useDuplicateEmailTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => duplicateEmailTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: emailTemplateKeys.all }),
  })
}
