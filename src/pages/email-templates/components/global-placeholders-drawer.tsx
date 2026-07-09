import * as React from "react"
import {
  BracesIcon,
  CheckIcon,
  InfoIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { MBadge } from "@/components/hifi/badge"
import { hifiBtn } from "@/components/hifi/button"
import { HiIcon } from "@/components/hifi/icon"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import {
  useCreateGlobalPlaceholder,
  useDeleteGlobalPlaceholder,
  useGlobalPlaceholders,
  useSetGlobalPlaceholderActive,
  useUpdateGlobalPlaceholder,
} from "@/features/global-placeholders/use-global-placeholders"

/**
 * Right side-drawer for managing global placeholders — values centrally
 * injected into every email at send time. Bound to the document-service
 * `/email/global-placeholders` API: each add / edit / toggle / delete commits
 * immediately. Mirrors the hi-fi `GlobalPlaceholdersDrawer`.
 */
export function GlobalPlaceholdersDrawer({
  open,
  readonly,
  onClose,
}: {
  open: boolean
  readonly: boolean
  onClose: () => void
}) {
  const listQuery = useGlobalPlaceholders()
  const rows = listQuery.data ?? []
  const activeCount = rows.filter((r) => r.active).length

  const createMut = useCreateGlobalPlaceholder()
  const updateMut = useUpdateGlobalPlaceholder()
  const activeMut = useSetGlobalPlaceholderActive()
  const deleteMut = useDeleteGlobalPlaceholder()

  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState({ key: "", value: "", desc: "" })
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editDraft, setEditDraft] = React.useState({ value: "", desc: "" })

  const keyTrim = draft.key.trim()
  const keyOk =
    /^[a-z][a-z0-9_]*$/.test(keyTrim) && !rows.some((r) => r.key === keyTrim)

  const resetAdd = () => {
    setAdding(false)
    setDraft({ key: "", value: "", desc: "" })
  }

  const add = () => {
    if (!keyOk || !draft.value.trim()) return
    createMut.mutate(
      {
        key: keyTrim,
        value: draft.value.trim(),
        description: draft.desc.trim(),
        active: true,
      },
      {
        onSuccess: () => {
          resetAdd()
          toast(`Global placeholder {{${keyTrim}}} added.`)
        },
        onError: (e) => toast.error((e as Error).message),
      }
    )
  }

  const saveEdit = (id: number, key: string) => {
    if (!editDraft.value.trim()) return
    updateMut.mutate(
      {
        id,
        body: {
          value: editDraft.value.trim(),
          description: editDraft.desc.trim(),
        },
      },
      {
        onSuccess: () => {
          setEditingId(null)
          toast(`Global placeholder {{${key}}} updated.`)
        },
        onError: (e) => toast.error((e as Error).message),
      }
    )
  }

  const toggle = (id: number, next: boolean) =>
    activeMut.mutate(
      { id, active: next },
      { onError: (e) => toast.error((e as Error).message) }
    )

  const remove = (id: number, key: string) =>
    deleteMut.mutate(id, {
      onSuccess: () => toast(`Global placeholder {{${key}}} removed.`),
      onError: (e) => toast.error((e as Error).message),
    })

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex flex-col gap-0 p-0 data-[side=right]:w-[600px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[600px] [&_svg]:[stroke-width:1.75]"
      >
        <div className="flex shrink-0 items-center gap-[11px] border-b px-[18px] py-4 pr-12">
          <span className="grid size-[38px] place-items-center rounded-[10px] bg-ph-global/[0.14] text-ph-global [&>svg]:size-[17px]">
            <BracesIcon />
          </span>
          <div>
            <SheetTitle className="font-heading text-[15px] font-bold text-foreground">
              Global placeholders
            </SheetTitle>
            <div className="text-[12px] text-muted-foreground">
              {activeCount} active · auto-injected into every email at send time
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-[18px] py-4">
          <Note tone="info" icon={<InfoIcon />}>
            Any template using <PatInline>{"{{key}}"}</PatInline> for an active
            global gets its value filled automatically — no per-template setup.
            Inactive keys are ignored.
          </Note>

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : listQuery.isError ? (
            <Note tone="err" icon={<TriangleAlertIcon />}>
              Couldn’t load global placeholders.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
              .
            </Note>
          ) : (
            <div className="flex flex-col overflow-hidden rounded-[11px] border border-input">
              {rows.length === 0 ? (
                <div className="px-[13px] py-8 text-center text-[12.5px] text-muted-foreground">
                  No global placeholders yet.
                </div>
              ) : (
                rows.map((r) =>
                  editingId === r.id ? (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 border-t bg-muted/30 px-[13px] py-3.5 first:border-t-0"
                    >
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-ph-global/10 px-2 py-[3px] font-mono text-[12px] font-semibold whitespace-nowrap text-ph-global">
                          {`{{${r.key}}}`}
                        </code>
                        <span className="text-[11px] text-muted-foreground">
                          Key can’t be changed
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
                          Value<span className="text-destructive">*</span>
                        </label>
                        <Input
                          value={editDraft.value}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              value: e.target.value,
                            }))
                          }
                          placeholder="e.g. https://cdn.ginja.ai/logo.png"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12.5px] font-medium">
                          Description
                        </label>
                        <Input
                          value={editDraft.desc}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              desc: e.target.value,
                            }))
                          }
                          placeholder="One-line description of this value"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          className={hifiBtn}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className={hifiBtn}
                          disabled={
                            !editDraft.value.trim() || updateMut.isPending
                          }
                          onClick={() => saveEdit(r.id, r.key)}
                        >
                          <CheckIcon data-icon="inline-start" />
                          {updateMut.isPending ? "Saving…" : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={r.id}
                      className={cn(
                        "flex items-center gap-3 border-t px-[13px] py-[11px] first:border-t-0",
                        !r.active && "opacity-60"
                      )}
                    >
                      <code className="min-w-[150px] shrink-0 rounded-md bg-ph-global/10 px-2 py-[3px] font-mono text-[12px] font-semibold whitespace-nowrap text-ph-global">
                        {`{{${r.key}}}`}
                      </code>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-medium">
                          {r.value || "—"}
                        </div>
                        <div className="mt-px text-[11px] text-muted-foreground">
                          {r.description || "—"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <MBadge
                          tone={r.active ? "success" : "neutral"}
                          className="text-[10px]"
                        >
                          {r.active ? "Active" : "Inactive"}
                        </MBadge>
                        {!readonly ? (
                          <Switch
                            checked={r.active}
                            disabled={
                              activeMut.isPending &&
                              activeMut.variables?.id === r.id
                            }
                            onCheckedChange={(c) => toggle(r.id, c)}
                          />
                        ) : null}
                        {!readonly ? (
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => {
                              setEditingId(r.id)
                              setEditDraft({
                                value: r.value,
                                desc: r.description,
                              })
                            }}
                            className="grid size-[30px] place-items-center rounded-[8px] border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground [&>svg]:size-[14px]"
                          >
                            <HiIcon name="pencil" />
                          </button>
                        ) : null}
                        {!readonly ? (
                          <button
                            type="button"
                            title="Delete"
                            disabled={
                              deleteMut.isPending &&
                              deleteMut.variables === r.id
                            }
                            onClick={() => remove(r.id, r.key)}
                            className="grid size-[30px] place-items-center rounded-[8px] border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 [&>svg]:size-[14px]"
                          >
                            <HiIcon name="trash" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}

          {!readonly && !listQuery.isLoading && !listQuery.isError ? (
            adding ? (
              <div className="rounded-[11px] border border-dashed border-input bg-muted/30 p-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
                      Key<span className="text-destructive">*</span>
                    </label>
                    <Input
                      className="mono text-[12.5px]"
                      value={draft.key}
                      aria-invalid={!!draft.key && !keyOk}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          key: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, "_"),
                        }))
                      }
                      placeholder="e.g. logo_url"
                    />
                    {draft.key && !keyOk ? (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-destructive [&>svg]:size-3">
                        <TriangleAlertIcon />
                        Unique lowercase key (letters, numbers, underscore).
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1.5 text-[12.5px] font-medium">
                      Value<span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={draft.value}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, value: e.target.value }))
                      }
                      placeholder="e.g. https://cdn.ginja.ai/logo.png"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium">
                    Description
                  </label>
                  <Input
                    value={draft.desc}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, desc: e.target.value }))
                    }
                    placeholder="One-line description of this value"
                  />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    className={hifiBtn}
                    onClick={resetAdd}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={hifiBtn}
                    disabled={
                      !keyOk || !draft.value.trim() || createMut.isPending
                    }
                    onClick={add}
                  >
                    <CheckIcon data-icon="inline-start" />
                    {createMut.isPending ? "Adding…" : "Add placeholder"}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-[7px] rounded-[11px] border border-dashed border-input bg-card p-[11px] text-[12.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/[0.04] [&>svg]:size-[15px]"
              >
                <PlusIcon />
                Add global placeholder
              </button>
            )
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t px-[18px] py-[14px]">
          <span className="flex-1 text-[11.5px] text-muted-foreground">
            {rows.length} placeholders · {activeCount} active
          </span>
          <Button variant="outline" className={hifiBtn} onClick={onClose}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PatInline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[5px] bg-muted/70 px-[7px] py-0.5 align-baseline font-mono text-[11px] text-foreground">
      {children}
    </code>
  )
}
