/* Spring Data page envelope. Members and audit-logs return this shape
   (`{ content, page, size, total_elements, total_pages }`); most other lists
   are plain arrays. `toPaged` maps the rows and camel-cases the meta. */

export type PagedDTO<T> = {
  content: T[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export type Paged<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function toPaged<S, T>(dto: PagedDTO<S>, map: (s: S) => T): Paged<T> {
  return {
    items: (dto.content ?? []).map(map),
    page: dto.page ?? 0,
    size: dto.size ?? 0,
    totalElements: dto.total_elements ?? 0,
    totalPages: dto.total_pages ?? 0,
  }
}
