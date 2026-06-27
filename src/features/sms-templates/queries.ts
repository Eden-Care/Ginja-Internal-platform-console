/* Query-key factory for SMS templates. */

import type { SmsTemplateQuery } from "./api"

export const smsTemplateKeys = {
  all: ["sms-templates"] as const,
  list: (q: SmsTemplateQuery) => [...smsTemplateKeys.all, "list", q] as const,
  infinite: (q: SmsTemplateQuery) =>
    [...smsTemplateKeys.all, "infinite", q] as const,
  detail: (id: number) => [...smsTemplateKeys.all, "detail", id] as const,
  versions: (id: number, q: SmsTemplateQuery) =>
    [...smsTemplateKeys.all, "versions", id, q] as const,
  compare: (id: number, from: number, to: number) =>
    [...smsTemplateKeys.all, "compare", id, from, to] as const,
  activity: (id: number, q: SmsTemplateQuery) =>
    [...smsTemplateKeys.all, "activity", id, q] as const,
}
