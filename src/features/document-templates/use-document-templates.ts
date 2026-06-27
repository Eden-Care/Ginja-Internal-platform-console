import { useQuery } from "@tanstack/react-query"

import { fetchDocumentTemplates, type DocumentTemplateQuery } from "./api"
import { documentTemplateKeys } from "./queries"

/** Fires GET {document-service}/templates. For now it only logs the response to
   the console (see fetchDocumentTemplates) — the UI is not bound yet. */
export function useDocumentTemplates(q: DocumentTemplateQuery = {}) {
  return useQuery({
    queryKey: documentTemplateKeys.list(q),
    queryFn: () => fetchDocumentTemplates(q),
  })
}
