import * as React from "react"
import {
  ChevronLeftIcon,
  CheckIcon,
  InfoIcon,
  SaveIcon,
  SendIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  aiSampleFor,
  globalPhValue,
  isGlobalPh,
  templateCode,
} from "@/lib/console-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { useGlobalPlaceholders } from "@/features/global-placeholders/use-global-placeholders"
import { useCreateSmsTemplate } from "@/features/sms-templates/use-sms-templates"
import { encodingLabel, smsSegments } from "@/features/sms-templates/segments"
import type {
  CreateSmsTemplateBody,
  SmsTemplateDetail,
} from "@/features/sms-templates/types"
import { PlaceholderField } from "@/pages/email-templates/components/placeholder-field"
import { SmsBubble } from "./sms-bubble"

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

function Pat({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] bg-muted/70 px-[7px] py-0.5 align-baseline font-mono text-[11px] text-foreground">
      {children}
    </code>
  )
}

export type SmsTemplateFormHandle = {
  submit: () => CreateSmsTemplateBody | null
}

type SmsTemplateFormProps = {
  detail?: SmsTemplateDetail
  embedded?: boolean
  onBack?: () => void
}

/** Shared create / edit form for an SMS template (standalone page or embedded
   in the editor's Editor tab). Mirrors the hi-fi `SmsForm`. */
export const SmsTemplateForm = React.forwardRef<
  SmsTemplateFormHandle,
  SmsTemplateFormProps
>(function SmsTemplateForm({ detail, embedded, onBack }, ref) {
  const dt = detail ?? null
  const [name, setName] = React.useState(dt ? dt.name : "")
  const [code, setCode] = React.useState(dt ? dt.functionalCode : "")
  const [codeEdited, setCodeEdited] = React.useState(!!dt)
  const [desc, setDesc] = React.useState(dt ? dt.description : "")
  const [trigger, setTrigger] = React.useState(dt ? dt.triggerEvent : "")
  const [scope, setScope] = React.useState<"console" | "tenant">(
    dt && dt.usedBy?.toUpperCase().includes("CONSOLE") ? "console" : "tenant"
  )
  const [tags, setTags] = React.useState<string[]>(
    dt ? dt.tags : ["sms", "transactional"]
  )
  const [tagDraft, setTagDraft] = React.useState("")
  const [message, setMessage] = React.useState(dt ? dt.messageText : "")
  const [tried, setTried] = React.useState(false)

  const autoCode = templateCode(name)
  const effCode = codeEdited ? code : autoCode

  const seg = smsSegments(message)
  const overLimit = seg.segmentCount > 1

  // Auto-detect {{placeholders}} in the message.
  const placeholders = React.useMemo(
    () => [
      ...new Set(
        (message.match(/\{\{\s*(\w+)\s*\}\}/g) ?? []).map((m) =>
          m.replace(/[{}\s]/g, "")
        )
      ),
    ],
    [message]
  )
  const previewText = message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
    isGlobalPh(k) ? globalPhValue(k) : aiSampleFor(k)
  )

  // Validation
  const errors: Record<string, string> = {}
  // Name + code are fixed when editing (read-only), so only validate on create.
  if (!dt) {
    if (!name.trim()) errors.name = "Template name is required."
    if (!effCode) errors.code = "Template code is required."
    else if (!/^[A-Z][A-Z0-9_]*$/.test(effCode))
      errors.code = "Use uppercase letters, numbers and underscores only."
  }
  if (!trigger.trim()) errors.trigger = "Trigger event is required."
  if (!message.trim()) errors.message = "Message text cannot be empty."
  const errCount = Object.keys(errors).length
  const err = (k: string) => (tried && errors[k]) || false

  const createMut = useCreateSmsTemplate()

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

  const buildBody = (): CreateSmsTemplateBody => ({
    code: effCode,
    name: name.trim(),
    description: desc.trim() || undefined,
    trigger_event: trigger.trim(),
    used_by: scope === "console" ? "INTERNAL_CONSOLE" : "TENANT_PLATFORMS",
    tags,
    message_text: message,
    change_note: dt ? "Updated from editor" : "Initial version",
    placeholders: placeholders
      .filter((p) => !isGlobalPh(p))
      .map((p, i) => ({
        field_key: p,
        label: p,
        data_type: "STRING",
        required: true,
        display_order: i + 1,
      })),
  })

  React.useImperativeHandle(ref, () => ({
    submit: () => {
      setTried(true)
      if (errCount > 0) return null
      return buildBody()
    },
  }))

  const onSave = () => {
    setTried(true)
    if (errCount > 0) return
    createMut.mutate(buildBody(), {
      onSuccess: () => {
        toast.success(`${name.trim()} created as a draft.`)
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
                placeholder="e.g. Login OTP"
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
                    Unique key used to trigger this SMS.
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
                placeholder="LOGIN_OTP"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              className="min-h-14 text-[13px]"
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

          <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
            <FormField
              label="Trigger on"
              required
              error={err("trigger")}
              hint="The platform event that sends this SMS."
            >
              <Input
                value={trigger}
                aria-invalid={!!err("trigger")}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="e.g. On login verification"
              />
            </FormField>
            <FormField
              label="Used by"
              hint="Which platform this template belongs to."
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

      {/* Message + live preview */}
      <div className="grid grid-cols-1 items-stretch gap-4 min-[1100px]:grid-cols-2">
        <Panel>
          <PanelHead
            icon={<SendIcon />}
            title="Message text"
            action={
              <Tagpill
                className={cn(
                  "text-[10.5px]",
                  overLimit && "text-warning-subtle-foreground"
                )}
              >
                {seg.charCount} chars · {seg.segmentCount}{" "}
                {seg.segmentCount === 1 ? "segment" : "segments"}
                {seg.encoding ? ` · ${encodingLabel(seg.encoding)}` : ""}
              </Tagpill>
            }
          />
          <PanelBody className="flex flex-col gap-2.5">
            <PlaceholderField
              multiline
              className="min-h-[150px] text-[13.5px]"
              value={message}
              onChange={setMessage}
              suggestions={phSuggestions}
              invalid={!!err("message")}
              placeholder={
                "Your Ginja verification code is {{otp_code}}. It expires in {{expiry_minutes}} minutes."
              }
            />
            {err("message") ? (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive [&>svg]:size-3">
                <TriangleAlertIcon />
                {errors.message}
              </span>
            ) : (
              <span className="text-[11.5px] text-muted-foreground">
                Supports <Pat>{"{{placeholders}}"}</Pat>. Each 160 characters is
                one billable segment.
              </span>
            )}
            {placeholders.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {placeholders.map((p) => (
                  <code
                    key={p}
                    className={cn(
                      "rounded-md px-2 py-[3px] font-mono text-[11.5px] font-semibold",
                      isGlobalPh(p)
                        ? "bg-ph-global/10 text-ph-global"
                        : "bg-info-subtle text-info-subtle-foreground"
                    )}
                  >
                    {`{{${p}}}`}
                  </code>
                ))}
              </div>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHead icon={<SmartphoneIcon />} title="Preview" />
          <PanelBody className="flex flex-1 items-center justify-center p-6">
            <SmsBubble>{previewText || "Your message preview…"}</SmsBubble>
          </PanelBody>
        </Panel>
      </div>
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
        SMS templates
      </button>

      <ConsolePageHeader
        crumbs={[]}
        title="Create SMS template"
        sub="Add a reusable SMS template to the library. Tenants inherit it and may override their own copy."
        actions={
          <>
            <Button variant="ghost" onClick={onBack}>
              Cancel
            </Button>
            <Button
              variant="outline"
              disabled={createMut.isPending}
              onClick={onSave}
            >
              <SaveIcon data-icon="inline-start" />
              Save draft
            </Button>
            <Button disabled={createMut.isPending} onClick={onSave}>
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
