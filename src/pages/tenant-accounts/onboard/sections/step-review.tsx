import * as React from "react"
import {
  AlertTriangleIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  CheckIcon,
  MinusIcon,
  PencilIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ONB_TEAM,
  PRICING_MODELS,
  REGISTRY,
  type OnbTeamKey,
  type OnboardingForm,
  type WizStepKey,
} from "@/lib/console-data"
import type { WizStatus } from "@/lib/console-format"
import { Glyph } from "@/components/console/glyph"
import { MiniAvatar } from "@/components/console/avatar-initials"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

const STEP_BY_KEY: Record<string, number> = {
  primary: 0,
  secondary: 1,
  modules: 2,
  billing: 3,
  documents: 4,
}

const STATUS_BADGE: Record<
  WizStatus,
  { tone: "success" | "warning" | "neutral"; label: string }
> = {
  complete: { tone: "success", label: "Complete" },
  progress: { tone: "warning", label: "In progress" },
  todo: { tone: "neutral", label: "Not started" },
}

function ReviewSection({
  title,
  sectionKey,
  status,
  assignees,
  setStep,
  children,
}: {
  title: string
  sectionKey: WizStepKey
  status: Record<WizStepKey, WizStatus>
  assignees: Record<WizStepKey, OnbTeamKey>
  setStep: (n: number) => void
  children: React.ReactNode
}) {
  const a = ONB_TEAM[assignees[sectionKey]]
  const badge = STATUS_BADGE[status[sectionKey]]
  return (
    <div className="rounded-xl border">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <h4 className="text-[13.5px] font-semibold">{title}</h4>
        <MiniBadge tone={badge.tone}>{badge.label}</MiniBadge>
        <Tagpill className="text-[10.5px]">
          <MiniAvatar
            initials={a.initials}
            className="size-[15px] text-[9px]"
          />
          {a.name}
        </Tagpill>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => setStep(STEP_BY_KEY[sectionKey])}
        >
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] text-muted-foreground">{k}</div>
          <div className="text-[13px]">{v}</div>
        </div>
      ))}
    </div>
  )
}

export function StepReview({
  form,
  status,
  assignees,
  setStep,
}: {
  form: OnboardingForm
  status: Record<WizStepKey, WizStatus>
  assignees: Record<WizStepKey, OnbTeamKey>
  setStep: (n: number) => void
}) {
  const enabled = REGISTRY.filter((m) => form.modules[m.id])
  const allDone = (Object.values(status) as WizStatus[]).every(
    (v) => v === "complete"
  )
  const sectionProps = { status, assignees, setStep }

  return (
    <div className="flex flex-col gap-4">
      <Note
        tone={allDone ? "ok" : "warn"}
        icon={allDone ? <CheckCircle2Icon /> : <AlertTriangleIcon />}
      >
        {allDone ? (
          <span>
            Everything looks complete. On submit,{" "}
            <b>
              {1 + form.secondaries.length} tenant{" "}
              {form.secondaries.length === 0 ? "record" : "records"}
            </b>{" "}
            {form.secondaries.length === 0 ? "is" : "are"} created in a single
            transaction in <b>Draft</b> status and routed to the Platform
            Approver.
          </span>
        ) : (
          <span>
            Some sections are still in progress. You can submit once every
            section is complete, or <b>save the draft</b> and let the assigned
            owners finish their parts.
          </span>
        )}
      </Note>

      <ReviewSection
        title="Basic profile"
        sectionKey="primary"
        {...sectionProps}
      >
        <Meta
          items={[
            ["Legal entity", form.legal],
            ["Tenant type", form.type],
            ["Country", form.country],
            ["Tax / VAT", form.tax || "—"],
            ["Primary contact", form.contacts[0]?.name || "—"],
            ["Contact email", form.contacts[0]?.email || "—"],
            [
              "Contacts",
              `${form.contacts.length} ${form.contacts.length === 1 ? "contact" : "contacts"}`,
            ],
            ["Website", form.website || "—"],
            ["Address", form.address || "—"],
          ]}
        />
      </ReviewSection>

      <ReviewSection
        title={`Secondary tenants (${form.secondaries.length})`}
        sectionKey="secondary"
        {...sectionProps}
      >
        {form.secondaries.length === 0 ? (
          <div className="text-[13px] text-muted-foreground">
            None — single-tenant account. Entitlements &amp; billing apply to
            the primary tenant only.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {form.secondaries.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[13px]">
                <BriefcaseIcon className="size-[15px] text-muted-foreground" />
                <b>{s.name || `Secondary ${i + 1}`}</b>
                <span className="mono text-muted-foreground">
                  {s.subdomain}.ginja.ai · {s.region}
                </span>
              </div>
            ))}
          </div>
        )}
      </ReviewSection>

      <ReviewSection
        title={`Module entitlements (${enabled.length})`}
        sectionKey="modules"
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-2">
          {enabled.map((m) => (
            <Tagpill key={m.id}>
              <Glyph name={m.icon} className="size-[11px]" />
              {m.name} · {form.modules[m.id].length}
            </Tagpill>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Subscription & billing"
        sectionKey="billing"
        {...sectionProps}
      >
        <div className="flex flex-wrap gap-6 text-[13px]">
          <div>
            <span className="text-muted-foreground">Model</span>
            <div className="font-semibold">
              {PRICING_MODELS.find((m) => m.id === form.model)?.name}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Frequency</span>
            <div className="font-semibold">{form.freq}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Tied to</span>
            <div className="font-semibold">{form.legal} (primary)</div>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection
        title="KYC & documents"
        sectionKey="documents"
        {...sectionProps}
      >
        <div className="flex flex-col gap-2">
          {(
            [
              ["Signed Contract", true],
              ["Company Registration", true],
              ["Proof of Address", true],
              ["Director / Shareholder IDs", false],
            ] as [string, boolean][]
          ).map(([d, ok]) => (
            <div key={d} className="flex items-center gap-2.5 text-[13px]">
              <span
                className={
                  ok
                    ? "grid size-5 place-items-center rounded-full bg-success-subtle text-success-subtle-foreground"
                    : "grid size-5 place-items-center rounded-full bg-muted text-muted-foreground"
                }
              >
                {ok ? (
                  <CheckIcon className="size-3" />
                ) : (
                  <MinusIcon className="size-3" />
                )}
              </span>
              {d}
            </div>
          ))}
        </div>
      </ReviewSection>
    </div>
  )
}
