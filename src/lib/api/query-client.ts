import { QueryClient } from "@tanstack/react-query"

/* Shared TanStack Query client. Conservative defaults for an internal console:
   no refetch-on-focus, a short stale window, and a single retry. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
