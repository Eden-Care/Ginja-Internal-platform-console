import { useLocation } from "react-router-dom"
import { ConstructionIcon } from "lucide-react"

const TITLES: Record<string, string> = {
  approvals: "Approvals",
  "module-registry": "Module registry",
  "document-templates": "Document templates",
  "email-templates": "Email & SMS templates",
  pricing: "Pricing & plans",
  "platform-settings": "Platform settings",
  "audit-log": "Audit log",
}

export function ComingSoonPage() {
  const { pathname } = useLocation()
  const segment = pathname.split("/").filter(Boolean).pop() ?? ""
  const title = TITLES[segment] ?? "This area"

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <ConstructionIcon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This part of the Platform Console isn’t built yet. It’s on the roadmap
          — check back soon.
        </p>
      </div>
    </div>
  )
}
