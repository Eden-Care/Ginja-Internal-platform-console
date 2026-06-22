import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BILLING_FREQ, type OnboardingForm } from "@/lib/console-data"
import type { SetField } from "../use-onboarding-form"
import { Field, FormGrid, FormSection, Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { usePricingStructures } from "@/features/pricing/use-pricing-structures"

/** subscription_model — the only values the API accepts (§8.4). */
const MODELS: { v: string; name: string; sub: string }[] = [
  { v: "PMPM", name: "Per Member / Month", sub: "Billed on covered members" },
  { v: "PER_CLAIM", name: "Per Claim", sub: "Billed per processed claim" },
  { v: "PCT_GWP", name: "% of Gross Written Premium", sub: "Billed as a % of GWP" },
]

export function StepBilling({
  form,
  set,
}: {
  form: OnboardingForm
  set: SetField
}) {
  const { data, isLoading, isError, refetch } = usePricingStructures("ACTIVE")
  const structures = data ?? []
  const hasClaims = !!form.modules["CLAIMS"]

  return (
    <div className="flex flex-col gap-6">
      <FormSection
        title="Pricing structure"
        desc="Pick an active commercial structure. The chosen structure's price is frozen onto the subscription."
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
          <div className="grid gap-3 sm:grid-cols-2">
            {structures.map((s) => {
              const on = form.pricingStructureId === s.id
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => set("pricingStructureId", s.id)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all",
                    on
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[13px] font-semibold">{s.name}</h4>
                      <div className="mono text-[11px] text-muted-foreground">
                        {s.code} · {s.model} · {s.currency}
                      </div>
                    </div>
                    {on ? (
                      <CheckCircle2Icon className="size-[17px] shrink-0 text-primary" />
                    ) : null}
                  </div>
                  {s.description ? (
                    <p className="line-clamp-2 text-[11.5px] text-muted-foreground">
                      {s.description}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </FormSection>

      <FormSection title="Subscription model">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODELS.map((m) => {
            const on = form.model === m.v
            return (
              <button
                type="button"
                key={m.v}
                onClick={() => set("model", m.v)}
                className={cn(
                  "flex flex-col gap-1 rounded-xl border p-3.5 text-left transition-all",
                  on
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[13px] font-semibold">{m.name}</h4>
                  {on ? <CheckCircle2Icon className="size-[17px] text-primary" /> : null}
                </div>
                <div className="text-[11.5px] text-muted-foreground">{m.sub}</div>
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
      </FormGrid>

      {form.model === "PER_CLAIM" && !hasClaims ? (
        <Note tone="warn" icon={<AlertTriangleIcon />}>
          The <b>Per Claim</b> model requires the <b>CLAIMS</b> module to be
          enabled (Step 3).
        </Note>
      ) : null}

      <Note tone="info" icon={<InfoIcon />}>
        <b>Free-trial and contract-date fields were removed</b> — the subscription
        API only accepts a pricing structure, model and frequency. Billing is tied
        to the primary tenant. (Flagged for the backend: see API_UI_FIT.md.)
      </Note>
    </div>
  )
}
