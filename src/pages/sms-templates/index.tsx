import * as React from "react"
import {
  ArchiveIcon,
  BanIcon,
  BookOpenIcon,
  Building2Icon,
  CheckCheckIcon,
  CheckIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  HistoryIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  useDuplicateSmsTemplate,
  useInfiniteSmsTemplates,
  usePublishSmsTemplate,
  useSetSmsTemplateActive,
  useSetSmsTemplateArchived,
  useSmsTemplates,
} from "@/features/sms-templates/use-sms-templates"
import type { SmsTemplate } from "@/features/sms-templates/types"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { MBadge } from "@/components/hifi/badge"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { CopyId } from "@/components/console/copy-id"
import { LoadingSpinner } from "@/components/common/loading"
import { LoadMore } from "@/components/common/load-more"
import { SmsEditor } from "./components/sms-editor"
import { SmsTemplateForm } from "./components/sms-template-form"

const SCOPE_FILTERS = ["All", "Internal console", "Tenant platforms"]
const scopeLabel = (usedBy?: string) =>
  (usedBy ?? "").toUpperCase().includes("CONSOLE")
    ? "Internal console"
    : "Tenant platforms"

/** Archived / Published / Disabled (published+inactive) / Draft. */
function statusBadge(t: SmsTemplate): {
  tone: "success" | "warning" | "neutral"
  label: string
} {
  if (t.archived) return { tone: "neutral", label: "Archived" }
  if (t.status === "Published")
    return t.active === false
      ? { tone: "warning", label: "Disabled" }
      : { tone: "success", label: "Published" }
  return { tone: "neutral", label: "Draft" }
}

export function SmsTemplatesPage() {
  const [open, setOpen] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [scope, setScope] = React.useState("All")
  const [showArchived, setShowArchived] = React.useState(false)

  // Active vs archived is a server-side filter (?archived=); infinite scroll
  // appends pages as the user reaches the bottom.
  const tplQuery = useInfiniteSmsTemplates({ archived: showArchived })
  const templates = React.useMemo(
    () => tplQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [tplQuery.data]
  )

  // Count-only query for the "Archived (N)" badge while viewing active.
  const archivedCountQuery = useSmsTemplates({
    page: 0,
    size: 1,
    archived: true,
  })
  const archivedCount = archivedCountQuery.data?.totalElements ?? 0

  const activeMut = useSetSmsTemplateActive()
  const archiveMut = useSetSmsTemplateArchived()
  const publishMut = usePublishSmsTemplate()
  const dupMut = useDuplicateSmsTemplate()

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    return templates.filter(
      (t) =>
        (scope === "All" || scopeLabel(t.usedBy) === scope) &&
        t.name.toLowerCase().includes(q)
    )
  }, [query, scope, templates])

  const toggleActive = (t: SmsTemplate) => {
    const next = t.active === false
    activeMut.mutate(
      { id: t.templateId, active: next },
      {
        onSuccess: () => toast(`${t.name} ${next ? "enabled" : "disabled"}.`),
        onError: (e) =>
          toast.error("Couldn't update template", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }
  const publish = (t: SmsTemplate) => {
    publishMut.mutate(t.templateId, {
      onSuccess: () => toast.success(`${t.name} published.`),
      onError: (e) =>
        toast.error("Couldn't publish template", {
          description: e instanceof Error ? e.message : undefined,
        }),
    })
  }
  const duplicate = (t: SmsTemplate) => {
    dupMut.mutate(t.templateId, {
      onSuccess: (copy) => toast.success(`Created “${copy.name}”.`),
      onError: (e) =>
        toast.error("Couldn't duplicate template", {
          description: e instanceof Error ? e.message : undefined,
        }),
    })
  }
  const setArchived = (t: SmsTemplate, archived: boolean) => {
    archiveMut.mutate(
      { id: t.templateId, archived },
      {
        onSuccess: () =>
          toast(`${t.name} ${archived ? "archived" : "restored"}.`),
        onError: (e) =>
          toast.error("Couldn't update template", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )
  }

  if (creating) return <SmsTemplateForm onBack={() => setCreating(false)} />

  const editing = open ? (templates.find((t) => t.id === open) ?? null) : null
  if (editing)
    return (
      <SmsEditor key={editing.id} tpl={editing} onBack={() => setOpen(null)} />
    )

  return (
    // Explicit v3 spacing (no uniform gap): page-head mb 18, note mb 14, search
    // toolbar pt 10 / pb 14 — matches Ginja Console-v3.html around the search.
    <div className="flex flex-col [&_svg]:[stroke-width:1.75]">
      <ConsolePageHeader
        className="mb-[18px]"
        title="SMS templates"
        sub={
          <span className="text-[13px]">
            Short text-message templates triggered by platform events.
          </span>
        }
        actions={
          <>
            <Button
              variant="ghost"
              className={hifiBtn}
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? (
                <SendIcon data-icon="inline-start" />
              ) : (
                <ArchiveIcon data-icon="inline-start" />
              )}
              {showArchived
                ? "Active templates"
                : `Archived${archivedCount ? ` (${archivedCount})` : ""}`}
            </Button>
            <Button className={hifiBtn} onClick={() => setCreating(true)}>
              <PlusIcon data-icon="inline-start" />
              New template
            </Button>
          </>
        }
      />

      <Note tone="info" icon={<BookOpenIcon />} className="mb-[14px]">
        These are <b>platform-level SMS templates</b>. Tenants inherit them and
        may override their own copy. Keep messages within 160-character
        segments.
      </Note>

      <div className="flex flex-col gap-3 pt-[10px] pb-[14px] lg:flex-row lg:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-[8px] border border-input bg-background px-2.5 lg:max-w-xs lg:flex-1">
          <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SCOPE_FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setScope(c)}
              className={cn(
                "h-[30px] rounded-full border px-2.5 text-xs font-medium transition-colors",
                scope === c
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
        <div className="rounded-[12px] border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {showArchived ? "No archived templates." : "No templates found."}
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          {rows.map((t) => {
            const badge = statusBadge(t)
            const isConsole = scopeLabel(t.usedBy) === "Internal console"
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpen(t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setOpen(t.id)
                  }
                }}
                className={cn(
                  "flex cursor-pointer flex-col gap-2.5 rounded-[12px] border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-sm",
                  t.active === false && !t.archived && "opacity-60"
                )}
              >
                <div className="flex items-start gap-[11px]">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground [&>svg]:size-[18px]">
                    <HiIcon name="smartphone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{t.name}</div>
                    <div className="mt-px text-[11.5px] text-muted-foreground">
                      {t.trigger || "—"}
                    </div>
                  </div>
                  <MBadge tone={badge.tone}>{badge.label}</MBadge>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Template actions"
                          className="-mr-1 grid size-[30px] shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-4"
                        >
                          <EllipsisVerticalIcon />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!t.archived && t.status !== "Published" ? (
                          <DropdownMenuItem onClick={() => publish(t)}>
                            <CheckCheckIcon />
                            Publish
                          </DropdownMenuItem>
                        ) : null}
                        {!t.archived ? (
                          <DropdownMenuItem onClick={() => toggleActive(t)}>
                            {t.active === false ? <CheckIcon /> : <BanIcon />}
                            {t.active === false ? "Enable" : "Disable"}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => duplicate(t)}>
                          <CopyIcon />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {t.archived ? (
                          <DropdownMenuItem
                            onClick={() => setArchived(t, false)}
                          >
                            <HistoryIcon />
                            Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setArchived(t, true)}
                          >
                            <ArchiveIcon />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="text-[12px] leading-[1.45] text-muted-foreground">
                  {t.message || "—"}
                </div>
                <div className="mt-auto flex items-center gap-2 pt-1">
                  <CopyId value={t.id} />
                  <Tagpill className="ml-auto text-[10.5px]">
                    {isConsole ? <ShieldIcon /> : <Building2Icon />}
                    {isConsole ? "Internal console" : "Tenant"} · {t.charCount}{" "}
                    chars
                  </Tagpill>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!tplQuery.isLoading && !tplQuery.isError ? (
        <div className="mt-4">
          <LoadMore
            hasMore={tplQuery.hasNextPage}
            loading={tplQuery.isFetchingNextPage}
            onLoadMore={() => tplQuery.fetchNextPage()}
          />
        </div>
      ) : null}
    </div>
  )
}
