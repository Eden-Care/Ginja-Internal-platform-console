/* Email global placeholders (document service) — values centrally injected into
   every email at send time. Snake_case DTO ↔ camelCase client item. */

export type GlobalPlaceholderDTO = {
  id?: number
  placeholder_id?: number
  key: string
  value: string | null
  description: string | null
  active?: boolean
  is_active?: boolean
}

export type GlobalPlaceholderItem = {
  id: number
  key: string
  value: string
  description: string
  active: boolean
}

/** Maps a placeholder DTO to the client shape, tolerating the two likely field
   spellings for id (`id`/`placeholder_id`) and active (`active`/`is_active`). */
export function toGlobalPlaceholder(
  d: GlobalPlaceholderDTO
): GlobalPlaceholderItem {
  return {
    id: d.id ?? d.placeholder_id ?? 0,
    key: d.key,
    value: d.value ?? "",
    description: d.description ?? "",
    active: d.active ?? d.is_active ?? false,
  }
}

export type CreateGlobalPlaceholderBody = {
  key: string
  value: string
  description?: string
  active?: boolean
}

export type UpdateGlobalPlaceholderBody = {
  value?: string
  description?: string
  active?: boolean
}
