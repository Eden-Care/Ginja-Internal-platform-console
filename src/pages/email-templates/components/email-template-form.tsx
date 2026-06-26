import * as React from "react"
import {
  BracesIcon,
  ChevronLeftIcon,
  CodeIcon,
  EyeIcon,
  FileTextIcon,
  InfoIcon,
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  SaveIcon,
  SparklesIcon,
  TrashIcon,
  TriangleAlertIcon,
  UploadIcon,
  CheckIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { ATTACH_EXTS, RESERVED_CODES, STARTER_HTML } from "@/lib/console-data"
import {
  aiSampleFor,
  detectPlaceholders,
  globalPhValue,
  isGlobalPh,
  templateCode,
} from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { useCreateEmailTemplate } from "@/features/email-templates/use-email-templates"
import { useGlobalPlaceholders } from "@/features/global-placeholders/use-global-placeholders"
import type {
  CreateEmailTemplateBody,
  EmailAttachmentPolicyInput,
  EmailTemplateDetail,
} from "@/features/email-templates/types"
import { PlaceholderField } from "./placeholder-field"

type SampleMode = "configure" | "fallback"
type Att = {
  enabled: boolean
  requirement: "optional" | "mandatory"
  max: number | string
  size: number | string
  exts: string[]
}

/** A labelled form field with the hi-fi `.field` look + error state. */
function FormField({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  error?: string | false
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive [&>svg]:size-3">
          <TriangleAlertIcon />
          {error}
        </span>
      ) : hint ? (
        <span className="text-[11.5px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

/** A monospace inline `{{pattern}}` code chip. */
function Pat({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] bg-muted/70 px-[7px] py-0.5 align-baseline font-mono text-[11px] text-foreground">
      {children}
    </code>
  )
}

/**
 * Shared create / edit form for an email template — the rich body used both as
 * a standalone "Create email template" page and (with `embedded`) as the
 * editor's Editor tab. Mirrors the hi-fi `EmailTemplateCreate`.
 */
/** Imperative handle the editor uses to save the in-progress edit. */
export type EmailTemplateFormHandle = {
  /** Validate + return the request body, or null if there are validation errors. */
  submit: () => CreateEmailTemplateBody | null
}

type EmailTemplateFormProps = {
  detail?: EmailTemplateDetail
  embedded?: boolean
  initialErrors?: boolean
  onBack?: () => void
}

export const EmailTemplateForm = React.forwardRef<
  EmailTemplateFormHandle,
  EmailTemplateFormProps
>(function EmailTemplateForm({ detail, embedded, initialErrors, onBack }, ref) {
  const dt = detail ?? null
  const [name, setName] = React.useState(
    dt ? dt.name : initialErrors ? "Tenant Admin Invitation" : ""
  )
  const [code, setCode] = React.useState(dt ? dt.functionalCode : "")
  const [codeEdited, setCodeEdited] = React.useState(!!dt)
  const [desc, setDesc] = React.useState(dt ? dt.description : "")
  const [subject, setSubject] = React.useState(dt ? dt.subject : "")
  const [preheader, setPreheader] = React.useState(dt ? dt.preheaderText : "")
  const [trigger, setTrigger] = React.useState(dt ? dt.triggerEvent : "")
  const [scope, setScope] = React.useState<"console" | "tenant">(
    dt && dt.usedBy?.toUpperCase().includes("CONSOLE") ? "console" : "tenant"
  )
  const [tags, setTags] = React.useState<string[]>(dt ? dt.tags : [])
  const [tagDraft, setTagDraft] = React.useState("")
  const [mode, setMode] = React.useState<"paste" | "upload">("paste")
  const [html, setHtml] = React.useState(
    dt ? dt.htmlContent : initialErrors ? "" : STARTER_HTML
  )
  const [text, setText] = React.useState(dt ? dt.plainTextContent : "")
  const [fileName, setFileName] = React.useState("")
  const [sampleMode, setSampleMode] = React.useState<SampleMode>("fallback")
  // Per-placeholder value the user writes — sent to the API as the merge-field
  // `label` and used for the live preview. Prefilled from saved labels on edit.
  const [vals, setVals] = React.useState<Record<string, string>>(() => {
    if (!dt) return {}
    const init: Record<string, string> = {}
    dt.mergeFields.forEach((m) => {
      init[m.fieldKey] = m.label ?? ""
    })
    return init
  })
  const [att, setAtt] = React.useState<Att>(() =>
    dt
      ? {
          enabled: dt.attachmentPolicy.enabled,
          requirement:
            dt.attachmentPolicy.requirement.toUpperCase() === "MANDATORY"
              ? "mandatory"
              : "optional",
          max: dt.attachmentPolicy.maxAttachments ?? 3,
          size: dt.attachmentPolicy.maxSizePerFileMb ?? 10,
          exts: dt.attachmentPolicy.allowedFileTypes,
        }
      : {
          enabled: !!initialErrors,
          requirement: "optional",
          max: 3,
          size: 10,
          exts: initialErrors ? [] : ["pdf"],
        }
  )
  const [aiLoading, setAiLoading] = React.useState(false)
  const [tried, setTried] = React.useState(!!initialErrors)

  // Auto-derive a template code from the name unless the user edited it.
  const autoCode = templateCode(name)
  const effCode = codeEdited ? code : autoCode

  // Auto-detect {{placeholders}} across every field that supports them.
  const placeholders = detectPlaceholders(
    [subject, preheader, html, text].join(" ")
  )
  // Template merge fields (globals are auto-injected, so excluded). Their value
  // is optional — only used for the live preview, never required to save.
  const valuePlaceholders = placeholders.filter((p) => !isGlobalPh(p))
  const resolve = (p: string) => {
    if (isGlobalPh(p)) return globalPhValue(p) // globals always auto-injected
    if (sampleMode === "fallback") return `{{${p}}}`
    return vals[p] != null && vals[p] !== "" ? vals[p] : `{{${p}}}` // configure
  }
  const previewDoc = html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => resolve(k))

  // Validation
  const errors: Record<string, string> = {}
  // Name + code are fixed when editing (read-only), so only validate on create.
  if (!dt) {
    if (!name.trim()) errors.name = "Template name is required."
    if (!effCode) errors.code = "Template code is required."
    else if (!/^[A-Z][A-Z0-9_]*$/.test(effCode))
      errors.code = "Use uppercase letters, numbers and underscores only."
    else if (RESERVED_CODES.includes(effCode))
      errors.code = "This template code already exists — choose a unique code."
  }
  if (!html.trim()) errors.html = "HTML content cannot be empty."
  if (!subject.trim()) errors.subject = "Subject line is required."
  if (!trigger.trim()) errors.trigger = "Trigger event is required."
  if (att.enabled && att.exts.length === 0)
    errors.att = "Select at least one allowed file type."
  const errCount = Object.keys(errors).length
  const err = (k: string) => (tried && errors[k]) || false

  const createMut = useCreateEmailTemplate()

  // Live global placeholders → autocomplete suggestions for {{token}} fields.
  const globalsQuery = useGlobalPlaceholders()
  const phSuggestions = React.useMemo(
    () =>
      (globalsQuery.data ?? [])
        .filter((g) => g.active)
        .map((g) => ({
          key: g.key,
          value: g.value,
          description: g.description,
        })),
    [globalsQuery.data]
  )

  /** Build the create/update request body from the current form state.
     `publish` adds `publish: true` (Save & publish); omitted ⇒ created as DRAFT. */
  const buildBody = (publish = false): CreateEmailTemplateBody => {
    const attachment_policy: EmailAttachmentPolicyInput = att.enabled
      ? {
          enabled: true,
          requirement: att.requirement.toUpperCase(),
          max_attachments: Number(att.max),
          max_size_per_file_mb: Number(att.size),
          allowed_file_types: att.exts,
        }
      : { enabled: false }
    return {
      code: effCode,
      name: name.trim(),
      description: desc.trim() || undefined,
      channel: "EMAIL",
      trigger_event: trigger.trim(),
      used_by: scope === "console" ? "INTERNAL_CONSOLE" : "TENANT_PLATFORMS",
      preheader_text: preheader.trim() || undefined,
      tags,
      subject,
      html_content: html,
      css_content: "",
      plain_text_content: text,
      change_note: dt ? "Updated from editor" : "Initial version",
      // Global placeholders are injected centrally, so they're not template
      // merge fields. Auto-derived from the key: label = field_key, data_type
      // STRING, display_order increments — the typed value is preview-only.
      placeholders: valuePlaceholders.map((p, i) => ({
        field_key: p,
        label: p,
        data_type: "STRING",
        required: true,
        display_order: i + 1,
      })),
      attachment_policy,
      // Only sent when publishing; "Save draft" omits the key entirely.
      ...(publish ? { publish: true } : {}),
    }
  }

  // The editor (embedded mode) drives the PUT via this handle; standalone mode
  // uses onSave below to POST a new template.
  React.useImperativeHandle(ref, () => ({
    submit: () => {
      setTried(true)
      if (errCount > 0) return null
      return buildBody()
    },
  }))

  const onSave = (publish: boolean) => {
    setTried(true)
    if (errCount > 0) return
    createMut.mutate(buildBody(publish), {
      onSuccess: () => {
        toast.success(
          `${name.trim()} ${publish ? "created and published." : "created as a draft."}`
        )
        onBack?.()
      },
      onError: (e) =>
        toast.error("Couldn't create template", {
          description: e instanceof Error ? e.message : undefined,
        }),
    })
  }
  const addTag = () => {
    const v = tagDraft.trim().toLowerCase()
    if (v && !tags.includes(v)) setTags((t) => [...t, v])
    setTagDraft("")
  }
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    setFileName(f.name)
    const r = new FileReader()
    r.onload = (ev) => setHtml(String(ev.target?.result ?? ""))
    r.readAsText(f)
  }
  const aiFill = () => {
    setAiLoading(true)
    window.setTimeout(() => {
      const next: Record<string, string> = {}
      placeholders.forEach((p) => {
        next[p] = aiSampleFor(p)
      })
      setVals(next)
      setSampleMode("configure")
      setAiLoading(false)
    }, 1300)
  }
  const toggleExt = (x: string) =>
    setAtt((a) => ({
      ...a,
      exts: a.exts.includes(x) ? a.exts.filter((e) => e !== x) : [...a.exts, x],
    }))

  const sampleTag =
    sampleMode === "fallback" ? "Raw placeholders" : "Configured values"

  const formBody = (
    <div className="flex flex-col gap-4">
      {tried && errCount > 0 ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          <b>
            {errCount} {errCount === 1 ? "issue" : "issues"} to fix before
            saving.
          </b>{" "}
          Review the highlighted fields below.
        </Note>
      ) : null}

      {/* Template details */}
      <Panel>
        <PanelHead icon={<InfoIcon />} title="Template details" />
        <PanelBody className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
            <FormField
              label="Template name"
              required
              error={err("name")}
              hint={dt ? "Can't be changed after creation." : undefined}
            >
              <Input
                value={name}
                disabled={!!dt}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!err("name")}
                placeholder="e.g. Policy Confirmation Mail"
              />
            </FormField>
            <FormField
              label="Template code"
              required
              error={err("code")}
              hint={
                dt ? (
                  "Can't be changed after creation."
                ) : (
                  <>
                    Unique key used to trigger this template programmatically.
                    {!codeEdited && autoCode
                      ? " Auto-generated from the name."
                      : ""}
                  </>
                )
              }
            >
              <Input
                className="mono text-[12.5px]"
                value={effCode}
                disabled={!!dt}
                aria-invalid={!!err("code")}
                onChange={(e) => {
                  setCode(e.target.value)
                  setCodeEdited(true)
                }}
                placeholder="POLICY_CONFIRMATION_MAIL"
              />
            </FormField>
          </div>

          <FormField
            label="Subject line"
            required
            error={err("subject")}
            hint={
              <>
                Shown in the recipient's inbox. Supports{" "}
                <Pat>{"{{placeholders}}"}</Pat>.
              </>
            }
          >
            <PlaceholderField
              className="mono text-[12.5px]"
              value={subject}
              invalid={!!err("subject")}
              onChange={setSubject}
              suggestions={phSuggestions}
              placeholder="e.g. Your {{org_name}} policy is confirmed"
            />
          </FormField>

          <FormField
            label="Preheader text"
            hint="Optional. The short preview most inboxes show next to the subject. Supports placeholders."
          >
            <Input
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              placeholder="Preview snippet shown after the subject in the inbox"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
            <FormField
              label="Trigger on"
              required
              error={err("trigger")}
              hint="The platform event that sends this email."
            >
              <Input
                value={trigger}
                aria-invalid={!!err("trigger")}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g. On policy confirmation"
              />
            </FormField>
            <FormField
              label="Used by"
              hint="Which platform this template belongs to (for categorization)."
            >
              <Seg
                className="self-start"
                value={scope}
                options={[
                  { v: "console", l: "Internal console" },
                  { v: "tenant", l: "Tenant platforms" },
                ]}
                onChange={(v) => setScope(v as "console" | "tenant")}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              className="min-h-16 text-[13px]"
              value={desc}
              maxLength={100}
              onChange={(e) => setDesc(e.target.value.slice(0, 100))}
              placeholder="What is this template for and when is it sent?"
            />
            <span className="flex items-center justify-between text-[11.5px]">
              <span
                className={cn(
                  desc.length >= 100
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {desc.length >= 100
                  ? "Character limit reached (100 max)."
                  : "A short summary for the library."}
              </span>
              <span
                className={cn(
                  "mono",
                  desc.length >= 100
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {desc.length}/100
              </span>
            </span>
          </FormField>

          <FormField
            label="Tags"
            hint="Tags help organise and search the library."
          >
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Type a tag and press Enter or comma"
            />
            {tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-[5px] rounded-full bg-primary/10 py-[3px] pr-[5px] pl-[9px] text-[11.5px] font-semibold text-primary"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags((x) => x.filter((y) => y !== t))}
                      className="grid place-items-center rounded-full p-0.5 opacity-70 hover:bg-primary/20 hover:opacity-100"
                    >
                      <XIcon className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </FormField>
        </PanelBody>
      </Panel>

      {/* Attachments */}
      <Panel>
        <PanelHead
          icon={<PaperclipIcon />}
          title="Attachments"
          action={
            <Switch
              checked={att.enabled}
              onCheckedChange={(v) => setAtt((a) => ({ ...a, enabled: v }))}
            />
          }
        />
        <PanelBody>
          {!att.enabled ? (
            <p className="text-[12px] text-muted-foreground">
              This template sends no attachments. Toggle on to allow files (e.g.
              policy PDF, invoice).
            </p>
          ) : (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-3">
                <FormField label="Requirement">
                  <Seg
                    className="self-start"
                    value={att.requirement}
                    options={[
                      { v: "optional", l: "Optional" },
                      { v: "mandatory", l: "Mandatory" },
                    ]}
                    onChange={(v) =>
                      setAtt((a) => ({
                        ...a,
                        requirement: v as Att["requirement"],
                      }))
                    }
                  />
                </FormField>
                <FormField label="Max attachments">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={att.max}
                    onChange={(e) =>
                      setAtt((a) => ({ ...a, max: e.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Max size per file">
                  <div className="flex items-stretch">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="rounded-r-none"
                      value={att.size}
                      onChange={(e) =>
                        setAtt((a) => ({ ...a, size: e.target.value }))
                      }
                    />
                    <span className="inline-flex items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 text-[12.5px] font-semibold text-muted-foreground">
                      MB
                    </span>
                  </div>
                </FormField>
              </div>

              <FormField label="Allowed file types" required error={err("att")}>
                <div className="flex flex-wrap gap-2">
                  {ATTACH_EXTS.map((x) => {
                    const on = att.exts.includes(x)
                    return (
                      <button
                        key={x}
                        type="button"
                        onClick={() => toggleExt(x)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-[11px] py-1.5 text-[12px] font-semibold transition-colors [&>svg]:size-[13px]",
                          on
                            ? "border-primary bg-primary/[0.07] text-primary"
                            : "border-input bg-card text-muted-foreground"
                        )}
                      >
                        {on ? <CheckIcon /> : <PlusIcon />}
                        <span>.{x}</span>
                      </button>
                    )
                  })}
                </div>
              </FormField>

              {att.requirement === "mandatory" ? (
                <Note tone="warn" icon={<TriangleAlertIcon />}>
                  At least one attachment (
                  {att.exts.map((e) => "." + e).join(", ") ||
                    "any allowed type"}
                  ) is required before this email can be sent.
                </Note>
              ) : null}
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* Placeholders & sample data */}
      <Panel>
        <PanelHead
          icon={<BracesIcon />}
          title="Placeholders & sample data"
          action={
            <div className="flex items-center gap-2">
              <Tagpill className="text-[10.5px]">{placeholders.length}</Tagpill>
              <Seg
                value={sampleMode}
                options={[
                  { v: "configure", l: "Configure" },
                  { v: "fallback", l: "Off" },
                ]}
                onChange={(v) => setSampleMode(v as SampleMode)}
              />
            </div>
          }
        />
        <PanelBody>
          <p className="mb-3 text-[11.5px] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
            Sample values are optional — they only render the live preview and
            aren't required to save. <b>Configure</b> — set each value yourself.{" "}
            <b>Off</b> — show raw placeholders.
          </p>
          {placeholders.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              No placeholders found yet. Use <Pat>{"{{variable}}"}</Pat> syntax
              in your HTML.
            </p>
          ) : aiLoading ? (
            <AiLoading />
          ) : sampleMode === "configure" ? (
            <>
              <div className="mb-2.5 flex items-center gap-2">
                <p className="flex-1 text-[11.5px] text-muted-foreground">
                  Optional preview values — leave blank to show the raw
                  placeholder.
                </p>
                <Button variant="outline" size="sm" onClick={aiFill}>
                  <SparklesIcon data-icon="inline-start" />
                  Auto-fill with AI
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 lg:grid-cols-2">
                {placeholders.map((p) => {
                  const g = isGlobalPh(p)
                  return (
                    <div key={p} className="flex items-center gap-2.5">
                      <code
                        className={cn(
                          "min-w-[124px] shrink-0 rounded-md px-2 py-1 font-mono text-[11.5px] font-semibold whitespace-nowrap",
                          g
                            ? "bg-ph-global/10 text-ph-global"
                            : "bg-primary/[0.08] text-primary"
                        )}
                      >
                        {`{{${p}}}`}
                      </code>
                      {g ? (
                        <span className="inline-flex items-center gap-[5px] text-[12px] font-medium text-ph-global [&>svg]:size-[11px]">
                          <BracesIcon />
                          Global · {globalPhValue(p)}
                        </span>
                      ) : (
                        <Input
                          className="h-[34px]"
                          value={vals[p] || ""}
                          onChange={(e) =>
                            setVals((v) => ({ ...v, [p]: e.target.value }))
                          }
                          placeholder={aiSampleFor(p)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              {placeholders.map((p) => {
                const g = isGlobalPh(p)
                return (
                  <code
                    key={p}
                    title={
                      g ? `Global placeholder · ${globalPhValue(p)}` : undefined
                    }
                    className={cn(
                      "rounded-[7px] px-2.5 py-1 font-mono text-[12px] font-semibold",
                      g
                        ? "border border-ph-global/35 bg-ph-global/[0.12] text-ph-global"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {`{{${p}}}`}
                  </code>
                )
              })}
            </div>
          )}
          {placeholders.some(isGlobalPh) ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-ph-global/[0.06] px-[11px] py-[9px] text-[11.5px] text-muted-foreground [&_b]:text-foreground">
              <code className="rounded-[7px] border border-ph-global/35 bg-ph-global/[0.12] px-2.5 py-1 font-mono text-[12px] font-semibold text-ph-global">
                {"{{global}}"}
              </code>
              Highlighted keys are <b>global placeholders</b> — their values are
              managed centrally and auto-injected at send time.
            </div>
          ) : null}
        </PanelBody>
      </Panel>

      {/* HTML content + live preview */}
      <div className="grid grid-cols-1 items-stretch gap-4 min-[1100px]:grid-cols-2">
        <Panel>
          <PanelHead
            icon={<CodeIcon />}
            title="HTML content"
            action={
              <Seg
                value={mode}
                options={[
                  { v: "paste", l: "Paste HTML" },
                  { v: "upload", l: "Upload file" },
                ]}
                onChange={(v) => setMode(v as "paste" | "upload")}
              />
            }
          />
          <PanelBody>
            {mode === "paste" ? (
              <PlaceholderField
                multiline
                className="mono h-[460px] max-h-[460px] min-h-[460px] text-[12px] leading-[1.6]"
                value={html}
                onChange={setHtml}
                suggestions={phSuggestions}
                spellCheck={false}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <label className="block cursor-pointer rounded-[11px] border-[1.5px] border-dashed border-input p-[22px] text-center transition-colors hover:border-primary hover:bg-primary/[0.03]">
                  <input
                    type="file"
                    accept=".html,.htm,text/html"
                    className="hidden"
                    onChange={onUpload}
                  />
                  <span className="mb-1.5 block text-muted-foreground [&>svg]:mx-auto [&>svg]:size-6">
                    <UploadIcon />
                  </span>
                  <b className="block text-[13px] font-semibold text-foreground">
                    {fileName || "Drop an .html file here"}
                  </b>
                  <div className="text-[11.5px] text-muted-foreground">
                    {fileName
                      ? "Loaded — switch to Paste HTML to edit"
                      : "or click to browse · .html up to 1 MB"}
                  </div>
                </label>
                {fileName ? (
                  <div className="flex items-center gap-[11px] rounded-[11px] border border-primary/40 bg-primary/[0.04] p-[13px]">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary/[0.14] text-primary [&>svg]:size-[18px]">
                      <CodeIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="text-[13px] font-semibold">{fileName}</b>
                      <div className="text-[11.5px] text-muted-foreground">
                        {html.length.toLocaleString()} characters ·{" "}
                        {placeholders.length} placeholders detected
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileName("")
                        setHtml(STARTER_HTML)
                      }}
                      className="grid size-[30px] place-items-center rounded-lg border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-[15px]"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
            {err("html") ? (
              <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive [&>svg]:size-3">
                <TriangleAlertIcon />
                {errors.html}
              </span>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHead
            icon={<EyeIcon />}
            title="Live preview"
            action={<Tagpill className="text-[10.5px]">{sampleTag}</Tagpill>}
          />
          <PanelBody className="flex-1 p-0">
            <iframe
              title="preview"
              srcDoc={previewDoc}
              sandbox=""
              className="block h-full min-h-[460px] w-full rounded-b-xl border-0 bg-white"
            />
          </PanelBody>
        </Panel>
      </div>

      {/* Plain-text */}
      <Panel>
        <PanelHead
          icon={<FileTextIcon />}
          title="Plain-text content"
          action={<Tagpill className="text-[10.5px]">Optional</Tagpill>}
        />
        <PanelBody className="flex flex-col gap-2.5">
          <p className="text-[11.5px] leading-[1.5] text-muted-foreground">
            Fallback shown when a recipient's client can't render HTML. Leave
            blank to auto-generate from the HTML at send time. Supports the same{" "}
            <Pat>{"{{placeholders}}"}</Pat>.
          </p>
          <PlaceholderField
            multiline
            className="min-h-[150px] text-[12.5px]"
            value={text}
            onChange={setText}
            suggestions={phSuggestions}
            placeholder={
              "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. Set up your account: {{invite_link}}"
            }
          />
        </PanelBody>
      </Panel>
    </div>
  )

  if (embedded) return formBody

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary [&>svg]:size-[14px]"
      >
        <ChevronLeftIcon />
        Email templates
      </button>

      <ConsolePageHeader
        crumbs={[]}
        title="Create email template"
        sub="Add a reusable template to the library. Tenants inherit it and may override their own copy."
        actions={
          <>
            <Button variant="ghost" onClick={onBack}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={createMut.isPending}
              onClick={() => onSave(false)}
            >
              <SaveIcon data-icon="inline-start" />
              Save draft
            </Button>
            <Button disabled={createMut.isPending} onClick={() => onSave(true)}>
              <CheckIcon data-icon="inline-start" />
              {createMut.isPending ? "Saving…" : "Save & publish"}
            </Button>
          </>
        }
      />

      {formBody}
    </div>
  )
})

function AiLoading() {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-[22px] text-[13px] font-medium text-muted-foreground">
      <Loader2Icon className="size-[18px] animate-spin text-primary" />
      <span>Generating sample data with AI…</span>
    </div>
  )
}
