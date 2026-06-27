/* Query-key factory for email & SMS templates. */

import type { EmailTemplateQuery } from "./api"

export const emailTemplateKeys = {
  all: ["email-templates"] as const,
  list: (q: EmailTemplateQuery) =>
    [...emailTemplateKeys.all, "list", q] as const,
  infinite: (q: EmailTemplateQuery) =>
    [...emailTemplateKeys.all, "infinite", q] as const,
  detail: (id: number) => [...emailTemplateKeys.all, "detail", id] as const,
  versions: (id: number, q: EmailTemplateQuery) =>
    [...emailTemplateKeys.all, "versions", id, q] as const,
  activity: (id: number, q: EmailTemplateQuery) =>
    [...emailTemplateKeys.all, "activity", id, q] as const,
  compare: (id: number, from: number, to: number) =>
    [...emailTemplateKeys.all, "compare", id, from, to] as const,
}
