import * as React from "react"
import {
  BookOpenIcon,
  FileTextIcon,
  GitBranchIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { type DocStatus } from "@/lib/console-data"
import { useDocumentTemplates } from "@/features/document-templates/use-document-templates"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { LoadingSpinner } from "@/components/common/loading"
import { DocEditor } from "./components/doc-editor"

export const TEMPLATE_TONE: Record<DocStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
}

export function DocumentTemplatesPage() {
  const [open, setOpen] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [cat, setCat] = React.useState("All")

  const tplQuery = useDocumentTemplates({ page: 0, size: 20 })
  const templates = React.useMemo(() => tplQuery.data ?? [], [tplQuery.data])

  const cats = React.useMemo(
    () => [
      "All",
      ...Array.from(new Set(templates.map((t) => t.cat).filter(Boolean))),
    ],
    [templates]
  )

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    return templates.filter(
      (t) =>
        (cat === "All" || t.cat === cat) && t.name.toLowerCase().includes(q)
    )
  }, [query, cat, templates])

  const editing = open ? (templates.find((t) => t.id === open) ?? null) : null
  if (editing) return <DocEditor tpl={editing} onBack={() => setOpen(null)} />

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Document templates"
        sub="Reusable PDF & document templates available to every tenant."
        actions={
          <Button
            size="sm"
            onClick={() => toast("New document template created.")}
          >
            <PlusIcon data-icon="inline-start" />
            New template
          </Button>
        }
      />

      <Note tone="info" icon={<BookOpenIcon />}>
        These are <b>platform-level templates</b>. Tenants inherit them
        automatically and may override their own copy without affecting the
        library.
      </Note>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <InputGroup className="lg:max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-1.5">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={cn(
                "h-[30px] rounded-full border px-2.5 text-xs font-medium transition-colors",
                cat === c
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {tplQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : tplQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load templates.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => tplQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          No templates found.
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3">
          {rows.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpen(t.id)}
              className="flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-sm"
            >
              <div className="flex items-start gap-[11px]">
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground [&>svg]:size-[19px]">
                  <FileTextIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{t.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {t.cat || "—"}
                  </div>
                </div>
                <MiniBadge tone={TEMPLATE_TONE[t.status]}>{t.status}</MiniBadge>
              </div>
              <div className="mono text-[11px] text-muted-foreground">
                {[t.format, t.version, t.updated].filter(Boolean).join(" · ") ||
                  "—"}
              </div>
              <div className="mt-auto flex items-center justify-between border-t pt-3">
                <Tagpill className="text-[10.5px]">
                  <GitBranchIcon className="size-2.5" />
                  {t.overrides ?? "—"} tenant overrides
                </Tagpill>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground">
                  <PencilIcon className="size-3.5" />
                  Edit
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
