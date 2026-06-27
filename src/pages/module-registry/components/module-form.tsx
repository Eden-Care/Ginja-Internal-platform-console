import * as React from "react"
import {
  CheckIcon,
  ChevronLeftIcon,
  GitBranchIcon,
  InfoIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { templateCode } from "@/lib/console-format"
import type { RegistryModule } from "@/lib/console-data"
import {
  useCreateModule,
  useUpdateModule,
} from "@/features/registry/use-module-mutations"
import type { CreateModuleBody } from "@/features/registry/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Field, ConsoleSelect } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"
import { IconPicker } from "./icon-picker"

const MODULE_OWNERS = [
  "Claims Platform",
  "Risk Platform",
  "Member Services",
  "Finance & Billing",
  "Provider Network",
  "Underwriting",
  "Data & Reporting",
  "Platform Core",
  "Integrations",
]

type SubRow = { name: string; code: string; codeEdited: boolean; desc: string }

/** Create / edit a registry module. Mirrors the hi-fi `ModuleCreate`. */
export function ModuleForm({
  existing,
  onBack,
}: {
  existing?: RegistryModule
  onBack: () => void
}) {
  const ex = existing ?? null
  const [name, setName] = React.useState(ex ? ex.name : "")
  const [code, setCode] = React.useState(ex ? ex.code : "")
  const [codeEdited, setCodeEdited] = React.useState(!!ex)
  const [desc, setDesc] = React.useState(ex ? ex.desc : "")
  const [icon, setIcon] = React.useState(ex ? ex.icon : "layers")
  const [url, setUrl] = React.useState(ex ? ex.url : "")
  const [version, setVersion] = React.useState(
    ex && ex.version && ex.version !== "—" ? ex.version : "1.0.0"
  )
  const [owner, setOwner] = React.useState(ex ? ex.owner : MODULE_OWNERS[0])
  const [published, setPublished] = React.useState(ex?.status === "Published")
  const [subs, setSubs] = React.useState<SubRow[]>(() =>
    ex && ex.subs.length
      ? ex.subs.map((s) => ({
          name: s.name,
          code: s.id.toUpperCase(),
          codeEdited: true,
          desc: s.desc,
        }))
      : [{ name: "", code: "", codeEdited: false, desc: "" }]
  )
  const [tried, setTried] = React.useState(false)

  const autoCode = templateCode(name)
  const effCode = codeEdited ? code : autoCode

  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = "Module name is required."
  if (!ex) {
    if (!effCode) errors.code = "Module code is required."
    else if (!/^[A-Z][A-Z0-9_]*$/.test(effCode))
      errors.code = "Use uppercase letters, numbers and underscores only."
  }
  const errCount = Object.keys(errors).length
  const err = (k: string) => (tried && errors[k]) || false

  const ownerOptions = [...new Set([...MODULE_OWNERS, owner].filter(Boolean))]

  const addSub = () =>
    setSubs((s) => [...s, { name: "", code: "", codeEdited: false, desc: "" }])
  const removeSub = (i: number) => setSubs((s) => s.filter((_, j) => j !== i))
  const patchSub = (i: number, patch: Partial<SubRow>) =>
    setSubs((s) => s.map((row, j) => (j === i ? { ...row, ...patch } : row)))

  const createMut = useCreateModule()
  const updateMut = useUpdateModule()
  const saving = createMut.isPending || updateMut.isPending

  const buildBody = (publish: boolean): CreateModuleBody => ({
    code: effCode,
    name: name.trim(),
    // Always send a string (never undefined) so the description persists.
    description: desc.trim(),
    icon,
    url: url.trim() || undefined,
    version: version.trim() || undefined,
    owner_team: owner,
    status: publish ? "PUBLISHED" : "DRAFT",
    sub_modules: subs
      .filter((s) => s.name.trim())
      .map((s) => ({
        code: (s.codeEdited ? s.code : templateCode(s.name)).toUpperCase(),
        name: s.name.trim(),
        description: s.desc.trim(),
      })),
  })

  const save = (publish: boolean) => {
    setTried(true)
    if (errCount > 0) return
    const body = buildBody(publish)
    const onSuccess = () => {
      toast.success(
        `${name.trim()} ${publish ? "published" : "saved as draft"}.`
      )
      onBack()
    }
    const onError = (e: unknown) =>
      toast.error(`Couldn't ${ex ? "update" : "register"} the module`, {
        description: e instanceof Error ? e.message : undefined,
      })
    if (ex) updateMut.mutate({ moduleId: ex.id, body }, { onSuccess, onError })
    else createMut.mutate(body, { onSuccess, onError })
  }

  const namedSubs = subs.filter((s) => s.name.trim()).length

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary [&>svg]:size-[14px]"
      >
        <ChevronLeftIcon />
        {ex ? ex.name : "Module registry"}
      </button>

      <ConsolePageHeader
        crumbs={[]}
        title={ex ? "Edit module" : "Register module"}
        sub={
          ex
            ? "Update this module in the platform catalogue."
            : "Add a module to the platform catalogue. It becomes selectable during tenant onboarding once published."
        }
        actions={
          <>
            <Button variant="ghost" onClick={onBack} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => save(false)}
              disabled={saving}
            >
              <SaveIcon data-icon="inline-start" />
              Save draft
            </Button>
            <Button onClick={() => save(true)} disabled={saving}>
              <CheckIcon data-icon="inline-start" />
              {saving ? "Saving…" : "Save & publish"}
            </Button>
          </>
        }
      />

      {tried && errCount > 0 ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          <b>
            {errCount} {errCount === 1 ? "issue" : "issues"} to fix before
            saving.
          </b>{" "}
          Review the highlighted fields.
        </Note>
      ) : null}

      {/* Module details */}
      <Panel>
        <PanelHead
          icon={<InfoIcon />}
          title="Module details"
          action={
            <label className="flex items-center gap-2 text-[12.5px] font-medium">
              Published
              <Switch checked={published} onCheckedChange={setPublished} />
            </label>
          }
        />
        <PanelBody className="flex flex-col gap-3.5">
          <Note tone="info" icon={<InfoIcon />}>
            {ex ? (
              <>
                Module ID <b className="mono">{ex.id}</b> · code and ID are
                immutable once assigned.
              </>
            ) : (
              <>
                A unique <b>Module ID</b> is generated by the platform when you
                save. The module code and ID are both unique.
              </>
            )}
          </Note>

          <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
            <Field
              label="Module name"
              required
              hint={err("name") || undefined}
              hintTone="error"
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!err("name")}
                placeholder="e.g. Claims Engine"
              />
            </Field>
            <Field
              label="Module code"
              required
              hint={
                err("code") ||
                (ex
                  ? "Code is fixed once assigned."
                  : `Unique key.${!codeEdited && autoCode ? " Auto-generated from the name." : ""}`)
              }
              hintTone={err("code") ? "error" : "muted"}
            >
              <Input
                className="mono text-[12.5px]"
                value={effCode}
                disabled={!!ex}
                aria-invalid={!!err("code")}
                onChange={(e) => {
                  setCode(e.target.value)
                  setCodeEdited(true)
                }}
                placeholder="CLAIMS_ENGINE"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              className="min-h-14 text-[13px]"
              value={desc}
              maxLength={100}
              onChange={(e) => setDesc(e.target.value.slice(0, 100))}
              placeholder="What does this module do?"
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
                  : "A short summary for the catalogue."}
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
          </Field>

          <div className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Icon">
              <IconPicker value={icon} onChange={setIcon} />
            </Field>
            <Field label="Version" hint="Semver, e.g. 1.0.0">
              <Input
                className="mono text-[12.5px]"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </Field>
            <Field label="Owner team">
              <ConsoleSelect
                value={owner}
                onChange={setOwner}
                options={ownerOptions}
              />
            </Field>
            <Field label="Module URL">
              <Input
                className="mono text-[12.5px]"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/claims"
              />
            </Field>
          </div>
        </PanelBody>
      </Panel>

      {/* Sub-modules */}
      <Panel>
        <PanelHead
          icon={<GitBranchIcon />}
          title="Sub-modules"
          action={<Tagpill className="text-[10.5px]">{namedSubs}</Tagpill>}
        />
        <PanelBody className="flex flex-col gap-2.5">
          <p className="text-[11.5px] text-muted-foreground">
            Optional. Sub-modules are individually selectable during onboarding.
          </p>
          {subs.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
            >
              <Input
                value={s.name}
                onChange={(e) => patchSub(i, { name: e.target.value })}
                placeholder="Adjudication engine"
              />
              <Input
                className="mono text-[12px]"
                value={s.codeEdited ? s.code : templateCode(s.name)}
                onChange={(e) =>
                  patchSub(i, { code: e.target.value, codeEdited: true })
                }
                placeholder="ADJUDICATION_ENGINE"
              />
              <Input
                value={s.desc}
                onChange={(e) => patchSub(i, { desc: e.target.value })}
                placeholder="What it does"
              />
              {subs.length > 1 ? (
                <Button
                  variant="outline"
                  size="icon"
                  title="Remove sub-module"
                  onClick={() => removeSub(i)}
                >
                  <TrashIcon />
                </Button>
              ) : (
                <span className="hidden sm:block sm:size-9" />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSub}
            className="flex w-full items-center justify-center gap-[7px] rounded-[11px] border border-dashed border-input bg-card p-[11px] text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/[0.04] [&>svg]:size-[15px]"
          >
            <PlusIcon />
            Add sub-module
          </button>
        </PanelBody>
      </Panel>
    </div>
  )
}
