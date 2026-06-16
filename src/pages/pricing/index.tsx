import * as React from "react"
import {
  CalendarIcon,
  FileCheckIcon,
  FileTextIcon,
  InfoIcon,
  LayersIcon,
  PercentIcon,
  PlusIcon,
  UsersIcon,
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
import {
  BILLING_FREQ,
  PRICING_MODELS,
  TIERS,
  type TierCard,
} from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { FormSection } from "@/components/console/form-atoms"
import { Glyph } from "@/components/console/glyph"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { hifiTableHead } from "@/components/console/table"

const RATE_TABS: TabItem[] = [
  { k: "pmpm", label: "PMPM", icon: <UsersIcon /> },
  { k: "outpatient", label: "Outpatient claim", icon: <FileCheckIcon /> },
  { k: "inpatient", label: "Inpatient claim", icon: <FileTextIcon /> },
  { k: "gwp", label: "% of GWP", icon: <PercentIcon /> },
]

function TierTable({ card }: { card: TierCard }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className={hifiTableHead}>
          <TableRow className="hover:bg-transparent">
            <TableHead>Tier</TableHead>
            <TableHead>Volume threshold</TableHead>
            <TableHead className="text-right">{card.unit}</TableHead>
            <TableHead className="text-right">Discount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {card.rows.map((r) => (
            <TableRow key={r.tier} className="hover:bg-transparent">
              <TableCell>
                <span className="mono inline-flex items-center rounded-[5px] bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">
                  {r.tier}
                </span>
              </TableCell>
              <TableCell className="text-[12.5px] text-muted-foreground">
                {r.threshold}
              </TableCell>
              <TableCell className="mono text-right font-semibold">
                {r.rate}
              </TableCell>
              <TableCell
                className={cn(
                  "mono text-right font-semibold",
                  r.disc === "Base" ? "text-muted-foreground" : "text-brand"
                )}
              >
                {r.disc}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PricingPage() {
  const [on, setOn] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(PRICING_MODELS.map((m) => [m.id, m.on]))
  )
  const [tier, setTier] = React.useState("pmpm")

  return (
    <div className="flex flex-col gap-5">
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

      <FormSection
        title="Subscription models"
        desc="Toggle which commercial models can be selected when onboarding a tenant."
      >
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          {PRICING_MODELS.map((m) => {
            const enabled = on[m.id]
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-[18px] shadow-xs transition-all",
                  enabled && "border-primary ring-1 ring-primary"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                    <Glyph name={m.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{m.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {m.sub}
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => setOn((s) => ({ ...s, [m.id]: v }))}
                  />
                </div>
                <p className="text-xs leading-normal text-muted-foreground">
                  {m.desc}
                </p>
                <div className="flex items-end justify-between">
                  <div className="mono text-2xl font-bold tracking-[-0.02em]">
                    {m.headline}
                    <span className="ml-1 font-sans text-xs font-medium text-muted-foreground">
                      {m.unit}
                    </span>
                  </div>
                  {m.tiered ? (
                    <Tagpill className="text-[10.5px]">
                      <LayersIcon className="size-2.5" />
                      Tiered
                    </Tagpill>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </FormSection>

      <FormSection title="Billing frequencies">
        <div className="flex flex-wrap gap-3">
          {BILLING_FREQ.map((f) => (
            <div
              key={f}
              className="flex min-w-[150px] items-center gap-2.5 rounded-[11px] border bg-card px-3.5 py-2.5"
            >
              <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CalendarIcon className="size-[15px]" />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{f}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  Invoiced {f.toLowerCase()}
                </div>
              </div>
              <MiniBadge tone="success">On</MiniBadge>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Volume discount schedules"
        desc="Rate cards applied automatically by enrolled volume. From the standard commercial proposal."
      >
        <TabBar tabs={RATE_TABS} value={tier} onChange={setTier} />
        <div className="mt-4">
          <TierTable card={TIERS[tier]} />
        </div>
      </FormSection>

      <Note tone="info" icon={<InfoIcon />}>
        Combined-ratio savings capture (15%) is billed as a separate performance
        invoice. Implementation fee ($400K, 70/30) and applicable taxes are
        configured per contract.
      </Note>
    </div>
  )
}
