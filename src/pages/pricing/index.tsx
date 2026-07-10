import * as React from "react"
import {
  CalendarIcon,
  InfoIcon,
  LayersIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { BILLING_FREQ } from "@/lib/console-data"
import { fmtNum, fmtUSD } from "@/lib/console-format"
import { ConsolePageHeader } from "@/components/console/page-header"
import { FormSection } from "@/components/console/form-atoms"
import { Tagpill } from "@/components/console/tagpill"
import { MBadge } from "@/components/hifi/badge"
import { HiIcon } from "@/components/hifi/icon"
import { Note } from "@/components/console/note"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { hifiTableHead } from "@/components/console/table"
import { LoadingSpinner } from "@/components/common/loading"
import { usePricingStructures } from "@/features/pricing/use-pricing-structures"
import {
  PRICING_MODEL_LABEL,
  pricingHeadline,
  type PricingComponent,
} from "@/features/pricing/types"

/** Acronyms kept upper-case when humanising API codes. */
const ACRONYMS = new Set(["PMPM", "GWP", "SMS", "API", "SSL", "PMPY"])

/** "CORE_PLATFORM_PMPM" → "Core Platform PMPM"; "PER_MEMBER_MONTH" → "Per Member Month". */
function humanizeLabel(code: string): string {
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) =>
      ACRONYMS.has(w.toUpperCase())
        ? w.toUpperCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ")
}

/** Money respecting the structure's currency ($ for USD, code suffix otherwise). */
const money = (n: number, currency: string) =>
  currency === "USD" ? fmtUSD(n) : `${fmtNum(n)} ${currency}`

const fmtRate = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 4 })

/** Pricing model → a fitting hi-fi glyph name. */
const modelGlyph = (model: string) =>
  /PCT|GWP|PERCENT/i.test(model) ? "percent" : "creditCard"

/** Volume-discount component → its hi-fi rate-tab glyph (matches Ginja Console.html:
   PMPM→crm, outpatient→fileCheck, inpatient→fileText, % of GWP→percent). */
function componentGlyph(c: PricingComponent): string {
  const s = `${c.componentType} ${c.unit}`.toUpperCase()
  if (/GWP|PERCENT|PCT/.test(s)) return "percent"
  if (/OUTPATIENT/.test(s)) return "fileCheck"
  if (/INPATIENT/.test(s)) return "fileText"
  if (/PMPM|MEMBER/.test(s)) return "crm"
  return "layers"
}

/** Volume-discount tier table for one component's `tiers`. */
function TierTable({ component }: { component: PricingComponent | null }) {
  if (!component) return null
  const tiers = [...component.tiers].sort((a, b) => a.tierNumber - b.tierNumber)
  return (
    <div className="overflow-hidden rounded-[10px] border">
      <Table>
        <TableHeader className={hifiTableHead}>
          <TableRow className="hover:bg-transparent">
            <TableHead>Tier</TableHead>
            <TableHead>Volume threshold</TableHead>
            <TableHead className="text-right">
              {humanizeLabel(component.unit)}
            </TableHead>
            <TableHead className="text-right">Discount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiers.map((t) => {
            const isBase = t.discountPct === 0
            return (
              <TableRow key={t.tierNumber} className="hover:bg-transparent">
                <TableCell>
                  <span className="mono inline-flex items-center rounded-[5px] bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">
                    {t.tierNumber}
                  </span>
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {fmtNum(t.volumeThresholdMin)}+
                </TableCell>
                <TableCell className="mono text-right font-semibold">
                  {fmtRate(t.rate)}
                </TableCell>
                <TableCell
                  className={cn(
                    "mono text-right font-semibold",
                    isBase ? "text-muted-foreground" : "text-brand"
                  )}
                >
                  {isBase ? "Base" : `${t.discountPct}%`}
                </TableCell>
              </TableRow>
            )
          })}
          {tiers.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={4}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No tiers for this component.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function PricingPage() {
  const pricingQuery = usePricingStructures()
  const structures = pricingQuery.data ?? []

  const [structureId, setStructureId] = React.useState<number | null>(null)
  const [componentKey, setComponentKey] = React.useState<string | null>(null)
  // Local, client-side on/off per model — mirrors the hi-fi toggle (the API is
  // read-only). Defaults to on for Active structures; overrides live here.
  const [enabled, setEnabled] = React.useState<Record<number, boolean>>({})

  // Derive the active structure/component with a fallback to the first item so
  // selection survives async load + structure switches without an effect.
  const activeStructure =
    structures.find((s) => s.id === structureId) ?? structures[0] ?? null
  const components = [...(activeStructure?.components ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )
  const activeComponent =
    components.find((c) => c.componentType === componentKey) ??
    components[0] ??
    null

  const tabs: TabItem[] = components.map((c) => ({
    k: c.componentType,
    // Tab text comes from the API `label`; fall back to the humanized code.
    label: c.label || humanizeLabel(c.componentType),
    icon: <HiIcon name={componentGlyph(c)} />,
  }))

  // Log the exact API-sourced data feeding the "Volume discount schedules"
  // section whenever the selected plan or component tab changes.
  React.useEffect(() => {
    if (!activeStructure) return
    console.log("[Pricing] Volume discount schedules — data in use:", {
      structure: `${activeStructure.code} · ${activeStructure.name}`,
      status: activeStructure.status,
      selectedComponent: activeComponent?.componentType ?? "(none)",
      unit: activeComponent?.unit,
      tiers: activeComponent?.tiers ?? [],
      allComponents: activeStructure.components,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStructure?.id, activeComponent?.componentType])

  return (
    <div className="flex flex-col gap-5 [&_svg]:[stroke-width:1.75]">
      <ConsolePageHeader
        title="Pricing & plans"
        sub="Subscription models, tiered volume-discount schedules and billing frequencies available during onboarding."
        actions={
          <Button size="sm" onClick={() => toast("Create a new plan.")}>
            <PlusIcon data-icon="inline-start" />
            New plan
          </Button>
        }
      />

      {pricingQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : pricingQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load pricing structures.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => pricingQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : structures.length === 0 ? (
        <Note tone="info" icon={<InfoIcon />}>
          No pricing structures defined yet.
        </Note>
      ) : (
        <>
          <FormSection
            title="Subscription models"
            desc="Commercial models that can be selected when onboarding a tenant. Select one to view its volume-discount tiers."
          >
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
              {structures.map((s) => {
                const on = enabled[s.id] ?? s.status === "ACTIVE"
                const selected = activeStructure?.id === s.id
                const headline = pricingHeadline(s)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStructureId(s.id)
                      setComponentKey(null)
                    }}
                    className={cn(
                      "flex flex-col gap-3 rounded-[12px] border bg-card p-[18px] text-left shadow-xs transition-all",
                      selected
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                        : "hover:border-primary/40 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-[11px]">
                      <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                        <HiIcon name={modelGlyph(s.model)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{s.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">
                          {PRICING_MODEL_LABEL[s.model] ?? s.model}
                        </div>
                      </div>
                      <Switch
                        checked={on}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={(v) =>
                          setEnabled((m) => ({ ...m, [s.id]: v }))
                        }
                      />
                    </div>
                    {s.description ? (
                      <p className="text-xs leading-[1.5] text-muted-foreground">
                        {s.description}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between">
                      {headline ? (
                        <div className="mono text-2xl font-bold tracking-[-0.02em]">
                          {headline.amount}{" "}
                          <span className="font-sans text-xs font-medium text-muted-foreground">
                            {headline.suffix}
                          </span>
                        </div>
                      ) : (
                        <span />
                      )}
                      {s.tierCount > 0 ? (
                        <Tagpill className="text-[10.5px]">
                          <LayersIcon className="size-2.5" />
                          Tiered
                        </Tagpill>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </FormSection>

          <FormSection title="Billing frequencies">
            <div className="flex flex-wrap gap-2.5">
              {BILLING_FREQ.map((f) => (
                <div
                  key={f}
                  className="flex min-w-[150px] items-center gap-[13px] rounded-[11px] border bg-card px-[15px] py-[13px]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-muted text-muted-foreground [&>svg]:size-[15px]">
                    <CalendarIcon />
                  </span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{f}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      Invoiced {f.toLowerCase()}
                    </div>
                  </div>
                  <MBadge tone="success">On</MBadge>
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection
            title="Volume discount schedules"
            desc={
              activeStructure
                ? `Tiered rate cards for ${activeStructure.name}, applied automatically by enrolled volume.`
                : "Rate cards applied automatically by enrolled volume."
            }
          >
            {tabs.length > 0 ? (
              <>
                <TabBar
                  tabs={tabs}
                  value={activeComponent?.componentType ?? ""}
                  onChange={setComponentKey}
                />
                <div className="mt-4">
                  <TierTable component={activeComponent} />
                </div>
              </>
            ) : (
              <div className="rounded-[10px] border px-6 py-10 text-center text-sm text-muted-foreground">
                This structure has no components.
              </div>
            )}
          </FormSection>

          {activeStructure ? (
            <Note tone="info" icon={<InfoIcon />}>
              Combined-ratio savings capture (
              {activeStructure.savingsCapturePct}
              %) is billed as a separate performance invoice. Implementation fee
              (
              {money(
                activeStructure.implementationFee,
                activeStructure.currency
              )}
              ) and applicable taxes are configured per contract.
            </Note>
          ) : null}
        </>
      )}
    </div>
  )
}
