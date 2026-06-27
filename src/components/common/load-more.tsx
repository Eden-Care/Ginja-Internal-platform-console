import { LoadingSpinner } from "@/components/common/loading"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

type LoadMoreProps = {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}

/**
 * Bottom-of-list sentinel for infinite scroll. Renders nothing once there are
 * no more pages; while more remain, an off-screen sentinel triggers
 * `onLoadMore` ~300px before the viewport bottom and shows a spinner while a
 * page is fetching.
 */
export function LoadMore({ hasMore, loading, onLoadMore }: LoadMoreProps) {
  const sentinelRef = useInfiniteScroll(onLoadMore, {
    enabled: hasMore && !loading,
  })

  if (!hasMore) return null

  return (
    <div
      ref={sentinelRef}
      className="flex items-center justify-center py-6 text-muted-foreground"
    >
      {loading ? <LoadingSpinner /> : null}
    </div>
  )
}
