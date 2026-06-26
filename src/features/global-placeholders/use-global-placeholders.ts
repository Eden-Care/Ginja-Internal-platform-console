import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createGlobalPlaceholder,
  deleteGlobalPlaceholder,
  fetchGlobalPlaceholders,
  setGlobalPlaceholderActive,
  updateGlobalPlaceholder,
} from "./api"
import { globalPlaceholderKeys } from "./queries"
import type {
  CreateGlobalPlaceholderBody,
  GlobalPlaceholderItem,
  UpdateGlobalPlaceholderBody,
} from "./types"

/** List of global placeholders (document service). */
export function useGlobalPlaceholders() {
  return useQuery({
    queryKey: globalPlaceholderKeys.all,
    queryFn: fetchGlobalPlaceholders,
  })
}

/** Create a placeholder; refetches the list on success. */
export function useCreateGlobalPlaceholder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateGlobalPlaceholderBody) =>
      createGlobalPlaceholder(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: globalPlaceholderKeys.all }),
  })
}

/** Update a placeholder's value/description/active; refetches on success. */
export function useUpdateGlobalPlaceholder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number
      body: UpdateGlobalPlaceholderBody
    }) => updateGlobalPlaceholder(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: globalPlaceholderKeys.all }),
  })
}

/** Activate/deactivate a placeholder — optimistic so the switch flips instantly,
   rolling back if the request fails. */
export function useSetGlobalPlaceholderActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setGlobalPlaceholderActive(id, active),
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: globalPlaceholderKeys.all })
      const prev = qc.getQueryData<GlobalPlaceholderItem[]>(
        globalPlaceholderKeys.all
      )
      qc.setQueryData<GlobalPlaceholderItem[]>(
        globalPlaceholderKeys.all,
        (old) => (old ?? []).map((r) => (r.id === id ? { ...r, active } : r))
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(globalPlaceholderKeys.all, ctx.prev)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: globalPlaceholderKeys.all }),
  })
}

/** Delete a placeholder — optimistic so the row disappears instantly, restored
   if the request fails. */
export function useDeleteGlobalPlaceholder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteGlobalPlaceholder(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: globalPlaceholderKeys.all })
      const prev = qc.getQueryData<GlobalPlaceholderItem[]>(
        globalPlaceholderKeys.all
      )
      qc.setQueryData<GlobalPlaceholderItem[]>(
        globalPlaceholderKeys.all,
        (old) => (old ?? []).filter((r) => r.id !== id)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(globalPlaceholderKeys.all, ctx.prev)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: globalPlaceholderKeys.all }),
  })
}
