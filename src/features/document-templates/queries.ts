/* Query-key factory for document (PDF) templates. */

import type { DocumentTemplateQuery } from "./api"

export const documentTemplateKeys = {
  all: ["document-templates"] as const,
  list: (q: DocumentTemplateQuery) =>
    [...documentTemplateKeys.all, "list", q] as const,
}
