/* Audit log — read-only compliance trail. See API_GUIDE.md §6.

   Gaps vs the old mock (no fabrication): the API carries no actor *role* (so the
   row shows the actor only), and no `kind` — the tone badge is derived from the
   action code. `action` is a raw enum (e.g. ROLE_CREATED) we prettify for display. */

import { format } from "date-fns"

export type AuditLogDTO = {
  audit_id: string
  actor: string
  actor_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  before: unknown
  after: unknown
  changes: unknown
  reason: string | null
  created_at: string
}

export type AuditKind =
  | "create"
  | "approve"
  | "edit"
  | "danger"
  | "warn"
  | "system"

export type AuditRow = {
  id: string
  date: string
  time: string
  actor: string
  action: string
  target: string
  kind: AuditKind
}

/** Categorise an action code into a tone bucket (presentation only). */
function kindFromAction(action: string): AuditKind {
  const a = action.toUpperCase()
  if (/(REJECT|DELETE|SUSPEND|RETIRE|REVOKE|DISABLE)/.test(a)) return "danger"
  if (/(APPROVE|ACTIVAT|REACTIVAT)/.test(a)) return "approve"
  if (/(CREATE|SUBMIT|ADD|INVIT|PROVISION)/.test(a)) return "create"
  if (/(UPDATE|EDIT|SET|ASSIGN|CHANGE)/.test(a)) return "edit"
  if (/(WARN|FAIL|BLOCK)/.test(a)) return "warn"
  return "system"
}

/** "ROLE_CREATED" → "Role created". */
function prettyAction(action: string): string {
  const s = action.replace(/_/g, " ").toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function toAuditRow(d: AuditLogDTO): AuditRow {
  const when = d.created_at ? new Date(d.created_at) : null
  const target =
    d.entity_label ||
    [d.entity_type, d.entity_id].filter(Boolean).join(" · ") ||
    "—"
  return {
    id: d.audit_id,
    date: when ? format(when, "dd MMM") : "",
    time: when ? format(when, "HH:mm") : "",
    actor: d.actor_name || d.actor || "—",
    action: prettyAction(d.action),
    target,
    kind: kindFromAction(d.action),
  }
}
