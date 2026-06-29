import {
  AlertTriangleIcon,
  BriefcaseIcon,
  GitBranchIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  REGIONS,
  type OnboardingForm,
  type Secondary,
} from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { ConsoleSelect, Field, FormGrid } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { Tagpill } from "@/components/console/tagpill"

const SECONDARY_COUNTRIES = [
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Ethiopia",
]
const REGION_OPTS = REGIONS.filter((r) => r.status === "Active").map((r) => ({
  value: r.id,
  label: `${r.id} · ${r.city}`,
}))

export function StepSecondary({
  form,
  set,
  onRemove,
  onClear,
  busy = false,
  showErrors = false,
}: {
  form: OnboardingForm
  set: SetField
  /** Remove one secondary — the page DELETEs server-backed rows; falls back to a
     local drop when not provided (e.g. before the draft is saved). */
  onRemove?: (i: number) => void
  /** Clear all secondaries — the page DELETEs server-backed rows. */
  onClear?: () => void
  /** A save/delete is in flight — disable mutating controls. */
  busy?: boolean
  /** Reveal field-level validation on added rows (set once Continue is tried).
     Secondary tenants are optional, so an empty list is never an error. */
  showErrors?: boolean
}) {
  const list = form.secondaries
  // A row is incomplete if it's missing the two fields that gate completion
  // (name + subdomain). Country/region default from the primary.
  const rowInvalid = (s: Secondary) => !s.name.trim() || !s.subdomain.trim()
  const anyInvalid = showErrors && list.some(rowInvalid)
  const add = () =>
    set("secondaries", [
      ...list,
      { name: "", country: form.country, region: form.region, subdomain: "" },
    ])
  const remove = (i: number) =>
    onRemove
      ? onRemove(i)
      : set(
          "secondaries",
          list.filter((_, x) => x !== i)
        )
  const clear = () => (onClear ? onClear() : set("secondaries", []))
  const edit = (i: number, k: keyof Secondary, v: string) =>
    set(
      "secondaries",
      list.map((s, x) => (x === i ? { ...s, [k]: v } : s))
    )

  return (
    <div className="flex flex-col gap-4">
      {anyInvalid ? (
        <Note tone="err" icon={<AlertTriangleIcon />}>
          <b>Finish the secondary tenants below.</b> Each one needs a legal entity
          name and subdomain — or remove it to continue.
        </Note>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <GitBranchIcon className="size-[18px]" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <b className="text-[13.5px]">Secondary tenants are optional</b>
            <Tagpill className="text-[10px]">This step can be skipped</Tagpill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add branches, subsidiaries or divisions that share{" "}
            <b>{form.legal}</b>'s subscription &amp; billing but run isolated
            environments — each with its own subdomain, data-residency region
            and Tenant Admin. If {form.legal} operates as a single entity, leave
            this empty and continue; you can add secondary tenants later from
            the tenant record.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <GitBranchIcon className="size-6" />
          </span>
          <h4 className="text-sm font-semibold">No secondary tenants added</h4>
          <p className="max-w-md text-xs text-muted-foreground">
            This will be onboarded as a <b>single-tenant account</b>.
            Entitlements and billing will apply to the primary tenant only.
          </p>
          <Button onClick={add} disabled={busy}>
            <PlusIcon data-icon="inline-start" />
            Add a secondary tenant
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="eyebrow text-[10.5px]">
              {list.length} secondary {list.length === 1 ? "tenant" : "tenants"}
            </span>
            <Button variant="ghost" size="sm" onClick={clear} disabled={busy}>
              <XIcon data-icon="inline-start" />
              Clear all
            </Button>
          </div>

          {list.map((s, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <BriefcaseIcon className="size-[15px]" />
                  </span>
                  <b className="text-[13px]">Secondary tenant {i + 1}</b>
                  {s.tenantId ? (
                    <Tagpill className="text-[10px]">Saved</Tagpill>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={s.tenantId ? "Remove (deletes from server)" : "Remove"}
                  onClick={() => remove(i)}
                  disabled={busy}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <FormGrid>
                <Field
                  label="Legal entity name"
                  required
                  hint={
                    showErrors && !s.name.trim()
                      ? "Legal entity name is required."
                      : undefined
                  }
                  hintTone="error"
                >
                  <Input
                    value={s.name}
                    placeholder="e.g. CIC Tanzania"
                    aria-invalid={showErrors && !s.name.trim()}
                    onChange={(e) => edit(i, "name", e.target.value)}
                  />
                </Field>
                <Field label="Country" required>
                  <ConsoleSelect
                    value={s.country}
                    onChange={(v) => edit(i, "country", v)}
                    options={SECONDARY_COUNTRIES}
                  />
                </Field>
                <Field label="Data residency" required>
                  <ConsoleSelect
                    value={s.region}
                    onChange={(v) => edit(i, "region", v)}
                    options={REGION_OPTS}
                  />
                </Field>
                <Field
                  label="Subdomain"
                  required
                  hint={
                    showErrors && !s.subdomain.trim()
                      ? "Subdomain is required."
                      : undefined
                  }
                  hintTone="error"
                >
                  <div
                    className={cn(
                      "flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-ring/50",
                      showErrors && !s.subdomain.trim() && "border-destructive"
                    )}
                  >
                    <input
                      value={s.subdomain}
                      onChange={(e) =>
                        edit(i, "subdomain", e.target.value.toLowerCase())
                      }
                      className="h-8 min-w-0 flex-1 rounded-l-lg bg-transparent px-3 text-sm outline-none"
                    />
                    <span className="shrink-0 px-2.5 text-[13px] text-muted-foreground">
                      .ginja.ai
                    </span>
                  </div>
                </Field>
              </FormGrid>
            </div>
          ))}

          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="flex flex-col items-center gap-1 rounded-xl border border-dashed p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <PlusIcon className="size-5 text-muted-foreground" />
            <b className="text-[13px]">Add another secondary tenant</b>
            <span className="text-[11.5px] text-muted-foreground">
              KYB documents for secondary tenants are optional if covered by the
              primary's contract
            </span>
          </button>
        </>
      )}
    </div>
  )
}
