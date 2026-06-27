/* PDF document templates (document service). DTO is snake_case as the API
   returns it; mapped onto the existing DocTemplate UI type. The tenant-override
   count isn't exposed by the list API, so it's left undefined (renders "—"). */

import { fmtDate } from "@/lib/console-format"
import type { DocTemplate } from "@/lib/console-data"

export type DocumentTemplateDTO = {
  id: number
  template_code: string
  tenant_id: number | null
  code: string
  name: string
  description: string | null
  category: string | null
  status: string
  active: boolean
  format: string | null
  orientation: string | null
  current_version_id: number | null
  latest_version_number: number | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

const toStatus = (s: string | null) =>
  (s ?? "").toUpperCase() === "PUBLISHED" ? "Published" : "Draft"

export function toDocumentTemplate(d: DocumentTemplateDTO): DocTemplate {
  return {
    id: d.template_code,
    name: d.name,
    cat: d.category ?? "",
    format: d.format ?? "",
    version:
      d.latest_version_number != null ? `v${d.latest_version_number}` : "",
    status: toStatus(d.status),
    updated: fmtDate(d.updated_at),
    by: d.updated_by ?? "",
    description: d.description ?? "",
    // Not provided by the list endpoint:
    overrides: undefined,
  }
}
