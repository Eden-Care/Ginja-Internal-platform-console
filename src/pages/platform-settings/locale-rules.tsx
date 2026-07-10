import * as React from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  CoinsIcon,
  CreditCardIcon,
  FingerprintIcon,
  GlobeIcon,
  HistoryIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  SmartphoneIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { fmtDate } from "@/lib/console-format"
import {
  useLocalization,
  useValidationRules,
} from "@/features/settings/use-localization"
import type { ValidationRule } from "@/features/settings/types"

/* Option lists for the locale selects (the choices; the selected value is the
   live API value). The current value is always merged in so it shows. */
const TIMEZONE_OPTS = [
  "Africa/Nairobi (EAT, UTC+03:00)",
  "Africa/Kampala (EAT, UTC+03:00)",
  "Africa/Lagos (WAT, UTC+01:00)",
  "Africa/Cairo (EET, UTC+02:00)",
  "UTC (UTC+00:00)",
]
const WEEK_OPTS = ["Monday", "Sunday", "Saturday"]
const DATE_FMT_OPTS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD MMM YYYY"]
const TIME_FMT_OPTS = ["24-hour (14:30)", "12-hour (2:30 PM)"]
const CURRENCY_OPTS = [
  "KES — Kenyan Shilling",
  "UGX — Ugandan Shilling",
  "TZS — Tanzanian Shilling",
  "RWF — Rwandan Franc",
  "USD — US Dollar",
  "EUR — Euro",
]
const SYMBOL_OPTS = ["Prefix (KES 1,234.56)", "Suffix (1,234.56 KES)"]
const DECIMALS_OPTS = ["0", "2", "3"]
const GROUPING_OPTS = [
  "Comma (1,234.56)",
  "Space (1 234,56)",
  "Period (1.234,56)",
]
const NORMALIZE_OPTS = [
  "Trim spaces",
  "Uppercase",
  "Lowercase",
  "Strip spaces",
  "Add country code",
]

// Languages list has no API yet (only `default_language`) — static for now.
const LANGUAGES = [
  "English",
  "Kiswahili",
  "Français",
  "አማርኛ Amharic",
  "Kinyarwanda",
  "Soomaali",
]

/** Group-icon name → lucide icon. */
const GROUP_ICON: Record<string, React.ReactNode> = {
  fingerprint: <FingerprintIcon />,
  shield: <ShieldIcon />,
  phone: <SmartphoneIcon />,
  smartphone: <SmartphoneIcon />,
  creditCard: <CreditCardIcon />,
  coins: <CoinsIcon />,
  globe: <GlobeIcon />,
}
const groupIcon = (name: string) => GROUP_ICON[name] ?? <FingerprintIcon />

/* ------------------------------------------------------------------ helpers --- */

function LocaleSelect({
  label,
  value,
  options,
  hint,
  disabled,
}: {
  label: string
  value: string
  options: string[]
  hint?: string
  disabled?: boolean
}) {
  const [v, setV] = React.useState(value)
  const opts = v && !options.includes(v) ? [v, ...options] : options
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium">{label}</label>
      <ConsoleSelect
        value={v}
        onChange={setV}
        options={opts}
        disabled={disabled}
      />
      {hint ? (
        <span className="text-[11.5px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  )
}

function ChipToggle({
  on,
  label,
  badge,
}: {
  on: boolean
  label: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[12px] font-medium [&>svg]:size-[13px]",
        on
          ? "border-primary/40 bg-primary/[0.08] text-primary"
          : "border-input text-muted-foreground"
      )}
    >
      {on ? <CheckIcon /> : <PlusIcon />}
      {label}
      {badge}
    </span>
  )
}

/** Live regex tester used in the rule editor drawer. */
function RuleTester({
  pattern,
  example,
}: {
  pattern: string
  example: string
}) {
  const isRegex = pattern.startsWith("^")
  const [val, setVal] = React.useState(example)
  let ok: boolean | null = null
  if (isRegex) {
    try {
      ok = new RegExp(pattern).test(val)
    } catch {
      ok = null
    }
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium">Test a value</label>
      {isRegex ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-2.5",
            ok === null
              ? "border-input"
              : ok
                ? "border-success/50 bg-success-subtle/40"
                : "border-destructive/50 bg-destructive-subtle/40"
          )}
        >
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Type to test against the pattern…"
            className="mono h-9 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-[11.5px] font-semibold [&>svg]:size-[14px]",
              ok ? "text-success" : "text-destructive"
            )}
          >
            {ok ? <CheckCircle2Icon /> : <XIcon />}
            {ok ? "Valid" : "Invalid"}
          </span>
        </div>
      ) : (
        <span className="text-[11.5px] text-muted-foreground">
          This rule uses a structured constraint ({pattern}); test it in
          staging.
        </span>
      )}
    </div>
  )
}

function ErrorNote({ onRetry }: { onRetry: () => void }) {
  return (
    <Note tone="err" icon={<TriangleAlertIcon />}>
      Couldn’t load this data.{" "}
      <button
        className="font-semibold underline underline-offset-2"
        onClick={onRetry}
      >
        Try again
      </button>
      .
    </Note>
  )
}

/* ------------------------------------------------------------------- page --- */

export function LocaleRules({
  readonly,
  onBack,
}: {
  readonly: boolean
  onBack: () => void
}) {
  // Active tab lives in `?tab=` so it survives a refresh; default "locale".
  const [params, setParams] = useSearchParams()
  const tabParam = params.get("tab") ?? "locale"
  const tab = ["locale", "rules", "history"].includes(tabParam)
    ? tabParam
    : "locale"
  const setTab = (t: string) =>
    setParams(t === "locale" ? {} : { tab: t }, { replace: true })
  const [open, setOpen] = React.useState<ValidationRule | null>(null)

  const locQ = useLocalization()
  const rulesQ = useValidationRules()
  const ruleset = rulesQ.data

  const TABS: TabItem[] = [
    { k: "locale", label: "Formatting & locale", icon: <GlobeIcon /> },
    { k: "rules", label: "Validation rules", icon: <FingerprintIcon /> },
    { k: "history", label: "Version history", icon: <HistoryIcon /> },
  ]

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary [&>svg]:size-[14px]"
      >
        <ChevronLeftIcon />
        All settings
      </button>

      <ConsolePageHeader
        crumbs={[
          { label: "Platform" },
          { label: "Settings" },
          "Localization & data rules",
        ]}
        title="Localization & data rules"
        sub="Default formats, currency, languages and validation rules every tenant inherits — fully versioned and override-ready."
      />

      {/* Version banner — from the live ruleset */}
      {rulesQ.isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border bg-card p-4 text-[12.5px] text-muted-foreground shadow-xs">
          <LoadingSpinner /> Loading ruleset…
        </div>
      ) : ruleset ? (
        <div className="flex flex-wrap items-center gap-3.5 rounded-xl border bg-card p-3.5 shadow-xs">
          <span className="mono grid size-[38px] shrink-0 place-items-center rounded-full bg-primary/[0.14] text-[13px] font-bold text-primary">
            {ruleset.version || "—"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              Ruleset {ruleset.version}
              <MiniBadge
                tone={ruleset.status === "PUBLISHED" ? "success" : "neutral"}
              >
                {ruleset.status === "PUBLISHED" ? "Published" : ruleset.status}
              </MiniBadge>
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {fmtDate(ruleset.publishedAt)
                ? `Effective ${fmtDate(ruleset.publishedAt)} · `
                : ""}
              {ruleset.activeRules} active rules
              {ruleset.updatedBy
                ? ` · last edited by ${ruleset.updatedBy}`
                : ""}
            </div>
          </div>
          {!readonly ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTab("history")}
              >
                <HistoryIcon data-icon="inline-start" />
                History
              </Button>
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                Create draft
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {tab === "locale" ? (
        locQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : locQ.isError || !locQ.data ? (
          <ErrorNote onRetry={() => locQ.refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <Note tone="info" icon={<InfoIcon />}>
              These are the <b>platform defaults</b>. Each tenant inherits them
              at onboarding and may override within policy.
            </Note>

            <Panel>
              <PanelHead icon={<GlobeIcon />} title="Regional defaults" />
              <PanelBody className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
                <LocaleSelect
                  label="Default timezone"
                  value={locQ.data.timezone}
                  options={TIMEZONE_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="First day of week"
                  value={locQ.data.weekStart}
                  options={WEEK_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="Date format"
                  value={locQ.data.dateFormat}
                  options={DATE_FMT_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="Time format"
                  value={locQ.data.timeFormat}
                  options={TIME_FMT_OPTS}
                  disabled={readonly}
                />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={<CoinsIcon />} title="Numbers & currency" />
              <PanelBody className="grid grid-cols-1 gap-x-[18px] gap-y-3.5 sm:grid-cols-2">
                <LocaleSelect
                  label="Default currency"
                  value={locQ.data.currency}
                  options={CURRENCY_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="Currency symbol"
                  value={locQ.data.currencySymbol}
                  options={SYMBOL_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="Decimal places"
                  value={locQ.data.currencyDecimals}
                  options={DECIMALS_OPTS}
                  disabled={readonly}
                />
                <LocaleSelect
                  label="Number grouping"
                  value={locQ.data.thousandsSep}
                  options={GROUPING_OPTS}
                  disabled={readonly}
                />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead
                icon={<GlobeIcon />}
                title="Languages"
                action={
                  <span className="text-[12px] text-muted-foreground">
                    Default: {locQ.data.defaultLanguage || "—"}
                  </span>
                }
              />
              <PanelBody className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => {
                  const isDefault =
                    !!locQ.data.defaultLanguage &&
                    l
                      .toLowerCase()
                      .includes(locQ.data.defaultLanguage.toLowerCase())
                  return (
                    <ChipToggle
                      key={l}
                      on={isDefault}
                      label={l}
                      badge={
                        isDefault ? (
                          <span className="rounded-full bg-primary/15 px-1.5 text-[9.5px] font-bold tracking-wide uppercase">
                            Default
                          </span>
                        ) : undefined
                      }
                    />
                  )
                })}
              </PanelBody>
            </Panel>
          </div>
        )
      ) : tab === "rules" ? (
        rulesQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : rulesQ.isError || !ruleset ? (
          <ErrorNote onRetry={() => rulesQ.refetch()} />
        ) : (
          <div className="flex flex-col gap-4">
            <Note tone="info" icon={<InfoIcon />}>
              <b>
                {ruleset.activeRules} active rule
                {ruleset.activeRules === 1 ? "" : "s"}
              </b>{" "}
              across {ruleset.groups.length} categories. Edits create the next
              draft version — published rules stay locked until a draft is
              promoted.
            </Note>

            {ruleset.groups.map((g) => (
              <Panel key={g.group}>
                <PanelHead
                  icon={groupIcon(g.icon)}
                  title={g.group}
                  action={
                    <Tagpill className="text-[10.5px]">
                      {g.rules.length}
                    </Tagpill>
                  }
                />
                <PanelBody className="overflow-x-auto p-0">
                  <div className="min-w-[760px]">
                    <div className="grid grid-cols-[minmax(150px,1.5fr)_minmax(120px,1fr)_minmax(140px,1.3fr)_minmax(110px,1fr)_92px_76px] items-center gap-3 border-b px-4 py-2 text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                      <span>Field</span>
                      <span>Applies to</span>
                      <span>Pattern</span>
                      <span>Example</span>
                      <span>Status</span>
                      <span />
                    </div>
                    {g.rules.map((r) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-[minmax(150px,1.5fr)_minmax(120px,1fr)_minmax(140px,1.3fr)_minmax(110px,1fr)_92px_76px] items-center gap-3 border-b px-4 py-3 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-[13px] font-medium">
                            {r.field}
                            {r.required ? (
                              <span
                                className="text-destructive"
                                title="Required"
                              >
                                *
                              </span>
                            ) : null}
                          </div>
                          {r.variants.length > 0 ? (
                            <div className="mt-px inline-flex items-center gap-1 text-[11px] text-muted-foreground [&>svg]:size-2.5">
                              <GlobeIcon />
                              {r.variants.length} country variants
                            </div>
                          ) : null}
                        </div>
                        <div className="truncate text-[12px] text-muted-foreground">
                          {r.applies}
                        </div>
                        <div className="min-w-0">
                          <code className="mono inline-block max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                            {r.pattern}
                          </code>
                        </div>
                        <div className="mono truncate text-[11.5px] text-muted-foreground">
                          {r.example}
                        </div>
                        <div>
                          <MiniBadge
                            tone={r.status === "Active" ? "success" : "neutral"}
                          >
                            {r.status}
                          </MiniBadge>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOpen(r)}
                          >
                            {readonly ? (
                              <ArrowRightIcon data-icon="inline-start" />
                            ) : (
                              <PencilIcon data-icon="inline-start" />
                            )}
                            {readonly ? "View" : "Edit"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </PanelBody>
              </Panel>
            ))}
          </div>
        )
      ) : rulesQ.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : rulesQ.isError || !ruleset ? (
        <ErrorNote onRetry={() => rulesQ.refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <Note tone="info" icon={<InfoIcon />}>
            Every published ruleset is retained. Restore re-opens a past version
            as a new draft — nothing is overwritten.
          </Note>
          <Panel>
            <PanelHead icon={<HistoryIcon />} title="Version history" />
            <PanelBody className="p-2">
              <div className="flex items-center gap-[13px] rounded-[10px] bg-primary/[0.03] px-2.5 py-3">
                <span className="mono grid size-[38px] shrink-0 place-items-center rounded-full bg-primary/[0.14] text-[12px] font-bold text-primary">
                  {ruleset.version.replace("v", "")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-[13.5px]">Ruleset {ruleset.version}</b>
                    <MiniBadge
                      tone={
                        ruleset.status === "PUBLISHED" ? "success" : "neutral"
                      }
                    >
                      {ruleset.status === "PUBLISHED"
                        ? "Published"
                        : ruleset.status}
                    </MiniBadge>
                  </div>
                  <div className="mt-[3px] text-[12px] text-muted-foreground">
                    {ruleset.note || "—"}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {fmtDate(ruleset.publishedAt) || "—"}
                    {ruleset.updatedBy ? ` · ${ruleset.updatedBy}` : ""}
                  </div>
                </div>
                <span className="inline-flex items-center gap-[5px] text-[12px] font-semibold whitespace-nowrap text-success [&>svg]:size-[13px]">
                  <CheckCircle2Icon />
                  Live
                </span>
              </div>
            </PanelBody>
          </Panel>
        </div>
      )}

      {/* Rule editor drawer */}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent
          side="right"
          showCloseButton
          className="flex flex-col gap-0 p-0 data-[side=right]:w-[480px] data-[side=right]:max-w-[92vw] data-[side=right]:sm:max-w-[480px]"
        >
          {open ? (
            <>
              <div className="shrink-0 border-b px-[18px] py-4 pr-12">
                <SheetTitle className="font-heading text-[15px] font-bold">
                  {open.field}
                </SheetTitle>
                <div className="text-[12px] text-muted-foreground">
                  Applies to {open.applies}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[18px] py-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium">
                    Validation pattern
                  </label>
                  <Input
                    className="mono text-[12px]"
                    defaultValue={open.pattern}
                    disabled={readonly}
                  />
                  <span className="text-[11.5px] text-muted-foreground">
                    {open.pattern.startsWith("^")
                      ? "Regular expression matched against the raw input."
                      : "Structured constraint applied by the platform."}
                  </span>
                </div>

                <RuleTester pattern={open.pattern} example={open.example} />

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium">
                    Error message shown to users
                  </label>
                  <Input defaultValue={open.error} disabled={readonly} />
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                    Normalization
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NORMALIZE_OPTS.map((n) => (
                      <ChipToggle
                        key={n}
                        on={open.normalize.includes(n)}
                        label={n}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <b className="text-[12.5px]">Required field</b>
                    <div className="text-[11.5px] text-muted-foreground">
                      Records can’t be saved without a valid value.
                    </div>
                  </div>
                  <Switch checked={open.required} disabled={readonly} />
                </div>

                {open.variants.length > 0 ? (
                  <div>
                    <div className="mb-2 text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                      Country variants · {open.variants.length}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {open.variants.map((v) => (
                        <div
                          key={v.country}
                          className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
                            {v.country}
                          </span>
                          <code className="mono shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px]">
                            {v.pattern}
                          </code>
                          <span className="mono ml-auto truncate text-[11.5px] text-muted-foreground">
                            {v.example}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {!readonly ? (
                <div className="flex shrink-0 items-center gap-2 border-t px-[18px] py-[14px]">
                  <span className="flex-1 text-[11.5px] text-muted-foreground">
                    Saves to the next draft.
                  </span>
                  <Button variant="ghost" onClick={() => setOpen(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setOpen(null)}>
                    <CheckIcon data-icon="inline-start" />
                    Save to draft
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
