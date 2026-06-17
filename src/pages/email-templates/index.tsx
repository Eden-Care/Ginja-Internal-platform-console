import * as React from "react"
import {
  BookOpenIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { EMAIL_TEMPLATES, type DocStatus } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { EmailEditor } from "./components/email-editor"

const TEMPLATE_TONE: Record<DocStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
}

const CHANNELS = ["All", "Email", "Email + SMS"]

export function EmailTemplatesPage() {
  const [open, setOpen] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")
  const [channel, setChannel] = React.useState("All")

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    return EMAIL_TEMPLATES.filter(
      (t) =>
        (channel === "All" || t.channel === channel) &&
        t.name.toLowerCase().includes(q)
    )
  }, [query, channel])

  const editing = open
    ? (EMAIL_TEMPLATES.find((t) => t.id === open) ?? null)
    : null
  if (editing)
    return (
      <EmailEditor
        key={editing.id}
        tpl={editing}
        onBack={() => setOpen(null)}
      />
    )

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Email & SMS templates"
        sub="Transactional message templates triggered by platform events."
        actions={
          <Button
            size="sm"
            onClick={() => toast("New message template created.")}
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
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={cn(
                "h-[30px] rounded-full border px-2.5 text-xs font-medium transition-colors",
                channel === c
                  ? "border-primary bg-primary/[0.08] text-primary"
                  : "border-input bg-background text-foreground hover:bg-muted"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3">
        {rows.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOpen(t.id)}
            className="flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-sm"
          >
            <div className="flex items-start gap-[11px]">
              <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground [&>svg]:size-[18px]">
                {t.channel === "Email + SMS" ? <SendIcon /> : <MailIcon />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{t.name}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {t.trigger}
                </div>
              </div>
              <MiniBadge tone={TEMPLATE_TONE[t.status]}>{t.status}</MiniBadge>
            </div>
            <div className="text-[12px] leading-[1.4] text-muted-foreground">
              {t.subject}
            </div>
            <div className="mt-auto flex items-center gap-1.5 border-t pt-3">
              <Tagpill className="text-[10.5px]">{t.channel}</Tagpill>
              <Tagpill className="text-[10.5px]">{t.version}</Tagpill>
              <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-medium text-foreground">
                <PencilIcon className="size-3.5" />
                Edit
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
