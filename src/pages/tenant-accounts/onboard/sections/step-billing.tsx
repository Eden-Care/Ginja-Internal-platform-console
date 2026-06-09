import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  BILLING_FREQ,
  PRICING_MODELS,
  type OnboardingForm,
} from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Glyph } from "@/components/console/glyph"
import {
  Field,
  FormGrid,
  FormSection,
  Seg,
} from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"

export function StepBilling({
  form,
  set,
  modCount,
}: {
  form: OnboardingForm
  set: SetField
  modCount: number
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Subscription model">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PRICING_MODELS.map((pm) => {
            const on = form.model === pm.id
            return (
              <button
                type="button"
                key={pm.id}
                onClick={() => set("model", pm.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-all",
                  on
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-4">
                    <Glyph name={pm.icon} />
                  </span>
                  <div className="flex-1">
                    <h4 className="text-[13px] font-semibold">{pm.name}</h4>
                    <div className="text-[11.5px] text-muted-foreground">
                      {pm.sub}
                    </div>
                  </div>
                  {on ? (
                    <CheckCircle2Icon className="size-[17px] text-primary" />
                  ) : null}
                </div>
                <div className="text-lg font-bold">
                  {pm.headline}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    {pm.unit}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </FormSection>

      <FormGrid>
        <Field label="Billing frequency" required>
          <div>
            <Seg
              value={form.freq}
              options={BILLING_FREQ}
              onChange={(v) => set("freq", v)}
            />
          </div>
        </Field>
        <Field label="Free-trial period" optional>
          <div className="flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-ring/50">
            <input
              defaultValue="0"
              className="h-8 min-w-0 flex-1 rounded-l-lg bg-transparent px-3 text-sm outline-none"
            />
            <span className="shrink-0 px-2.5 text-[13px] text-muted-foreground">
              days
            </span>
          </div>
        </Field>
        <Field label="Contract start" required>
          <Input type="text" defaultValue="01 Jul 2026" />
        </Field>
        <Field label="Contract end" required>
          <Input type="text" defaultValue="30 Jun 2031" />
        </Field>
      </FormGrid>

      {form.model === "perclaim" && modCount < 1 ? (
        <Note tone="warn" icon={<AlertTriangleIcon />}>
          The <b>Per Claim</b> model requires the <b>Claims</b> module to be
          enabled.
        </Note>
      ) : null}

      <Note tone="info" icon={<InfoIcon />}>
        Contract-specific overrides (custom rates, volume discounts, promotional
        pricing) can be added after creation from the Pricing library. Billing
        is tied to the primary tenant only.
      </Note>
    </div>
  )
}
