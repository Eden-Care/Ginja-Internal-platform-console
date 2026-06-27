import * as React from "react"

type UseInfiniteScrollOptions = {
  /** When false the observer is torn down — pass `hasNextPage && !isFetching`
     so we never queue a second page while one is in flight or after the last. */
  enabled?: boolean
  /** Prefetch margin: fire before the sentinel actually reaches the viewport. */
  rootMargin?: string
}

/**
 * Calls `onLoadMore` when the returned sentinel ref scrolls within `rootMargin`
 * of the viewport bottom. The callback is held in a ref so the observer
 * re-subscribes only when `enabled`/`rootMargin` change — not on every render
 * (pages re-render constantly while rows stream in). The app uses window scroll
 * (no overflow container), so the observer roots on the viewport (`root: null`).
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  { enabled = true, rootMargin = "300px" }: UseInfiniteScrollOptions = {}
) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)

  const cbRef = React.useRef(onLoadMore)
  React.useEffect(() => {
    cbRef.current = onLoadMore
  }, [onLoadMore])

  React.useEffect(() => {
    const node = sentinelRef.current
    if (!node || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) cbRef.current()
      },
      { root: null, rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
