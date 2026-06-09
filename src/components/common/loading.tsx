// src/components/common/loading.tsx
import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return <Loader2 className="h-6 w-6 animate-spin" />
}

export function LoadingPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
