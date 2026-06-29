import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BILLING_FREQ, type OnboardingForm } from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Field, FormGrid, FormSection, Seg } from "@/components/console/form-atoms"
import { Input } from "@/components/ui/input"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { useTenantPricingOptions } from "@/features/pricing/use-pricing-structures"
import {
  PRICING_MODEL_SHORT,
  pricingHeadline,
  subscriptionModelFor,
} from "@/features/pricing/types"

export function StepBilling({
  form,
  set,
  showErrors = false,
}: {
  form: OnboardingForm
  set: SetField
  /** Reveal the "select a pricing structure" error (set once Continue is tried). */
  showErrors?: boolean
}) {
  const { data, isLoading, isError, refetch } = useTenantPricingOptions()
  const structures = data ?? []
  const hasClaims = !!form.modules["CLAIMS"]

  return (
    <div className="flex flex-col gap-6">
      {showErrors && structures.length > 0 && !form.pricingStructureId ? (
        <Note tone="err" icon={<AlertTriangleIcon />}>
          <b>Select a pricing structure.</b> A subscription must be chosen before
          you can continue.
        </Note>
      ) : null}

      <FormSection
        title="Subscription model"
        desc="Pick an active commercial structure — its price is frozen onto the subscription. The billing model is set from your choice."
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <Note tone="err" icon={<TriangleAlertIcon />}>
            Couldn’t load pricing structures.{" "}
            <button
              className="font-semibold underline underline-offset-2"
              onClick={() => refetch()}
            >
              Try again
            </button>
            .
          </Note>
        ) : structures.length === 0 ? (
          <Note tone="warn" icon={<AlertTriangleIcon />}>
            <b>No active pricing structures.</b> A structure must be activated in
            Pricing &amp; plans before a subscription can be set. Onboarding can’t
            complete billing until one exists.
          </Note>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {structures.map((s) => {
              const on = form.pricingStructureId === s.id
              const head = pricingHeadline(s)
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    set("pricingStructureId", s.id)
                    set("model", subscriptionModelFor(s))
                  }}
                  className={cn(
                    "flex flex-col gap-2.5 rounded-xl border p-4 text-left transition-all",
                    on
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Placeholder icon for every structure — per-model icons TBD. */}
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[18px]">
                      <CircleDollarSignIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[13.5px] font-semibold">
                        {s.name}
                      </h4>
                      <div className="text-[11.5px] text-muted-foreground">
                        {PRICING_MODEL_SHORT[s.model] ?? s.model}
                      </div>
                    </div>
                    {on ? (
                      <CheckCircle2Icon className="size-[17px] shrink-0 text-primary" />
                    ) : null}
                  </div>
                  {head ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold tracking-tight">
                        {head.amount}
                      </span>
                      {head.suffix ? (
                        <span className="text-[11.5px] text-muted-foreground">
                          {head.suffix}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </FormSection>

      {form.model === "PER_CLAIM" && !hasClaims ? (
        <Note tone="warn" icon={<AlertTriangleIcon />}>
          This structure bills <b>per claim</b> but the <b>CLAIMS</b> module isn’t
          enabled (Step 3).
        </Note>
      ) : null}

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
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={form.freeTrialDays}
              placeholder="0"
              onChange={(e) => set("freeTrialDays", e.target.value)}
            />
            <span className="text-[13px] text-muted-foreground">days</span>
          </div>
        </Field>
      </FormGrid>

      <FormGrid>
        <Field label="Contract start" optional>
          <Input
            type="date"
            value={form.contractStart}
            onChange={(e) => set("contractStart", e.target.value)}
          />
        </Field>
        <Field label="Contract end" optional>
          <Input
            type="date"
            value={form.contractEnd}
            onChange={(e) => set("contractEnd", e.target.value)}
          />
        </Field>
      </FormGrid>

      <Note tone="info" icon={<InfoIcon />}>
        Contract-specific overrides (custom rates, volume discounts, promotional
        pricing) can be added after creation from the Pricing library. Billing is
        tied to the primary tenant only.
      </Note>
    </div>
  )
}
