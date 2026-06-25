import * as React from "react"
import {
  CheckIcon,
  InfoIcon,
  LockIcon,
  MinusIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShieldIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Field, FormGrid, FormSection, ConsoleSelect } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import { fmtNum } from "@/lib/console-format"
import {
  DB_PROVIDERS,
  EMAIL_PROVIDERS,
  SMS_PROVIDERS,
  TAKEN_SUBDOMAINS,
  type DbConfig,
  type DomainsConfig,
  type EmailConfig,
  type MigrationConfig,
  type ProvSectionStatus,
  type SmsConfig,
} from "@/lib/console-data"
import {
  OkInline,
  ProviderGrid,
  SaveBar,
  SecretInput,
  TestButton,
  type Ro,
} from "./components"
import { KnowMore } from "./know-more"

type SectionProps<C> = {
  cfg: C
  set: (patch: Partial<C>) => void
  mark: (st: ProvSectionStatus) => void
  /** Real section test (the provisioning test endpoint); resolves true on pass. */
  onTest?: () => Promise<boolean>
  ro?: Ro
}

const stack = "flex flex-col gap-[22px]"

/* ----------------------------------------------- Section: Database & storage */
export function SecDatabase({ cfg, set, mark, onTest, ro }: SectionProps<DbConfig>) {
  const prov = DB_PROVIDERS.find((d) => d.id === cfg.provider) ?? DB_PROVIDERS[0]
  const isSelf = cfg.provider === "self"
  return (
    <div className={stack}>
      <Note tone="info" icon={<ShieldCheckIcon />}>
        <b>Fully isolated by default.</b> Every tenant gets a dedicated namespace,
        schema &amp; topics — no shared data paths. No configuration needed.
      </Note>

      <FormSection
        title="Database provider"
        desc="The managed service (or self-managed server) this tenant's database runs on."
      >
        <ProviderGrid
          list={DB_PROVIDERS.map((d) => ({ id: d.id, name: d.name, default: d.default }))}
          value={cfg.provider}
          onPick={(v) => set({ provider: v, region: "" })}
          ro={ro}
        />
        {isSelf && (
          <FormGrid className="mt-3.5">
            <Field
              className="sm:col-span-2"
              label="Database provider name"
              required
              hint="Which database product the tenant runs and manages themselves."
            >
              <Input
                placeholder="e.g. PostgreSQL 15 (on-prem) · Oracle 19c · MariaDB"
                value={cfg.providerName}
                disabled={!!ro}
                onChange={(e) => set({ providerName: e.target.value })}
              />
            </Field>
          </FormGrid>
        )}
      </FormSection>

      <FormSection
        title="Location"
        desc="The region this tenant's data lives in — pinned for data residency."
      >
        <FormGrid>
          <Field
            className="sm:col-span-2"
            label="Region"
            required
            hint={
              isSelf
                ? "Where the self-managed server is hosted — recorded for data-residency compliance."
                : undefined
            }
          >
            {isSelf ? (
              <Input
                placeholder="e.g. Nairobi · on-prem data centre"
                value={cfg.region}
                disabled={!!ro}
                onChange={(e) => set({ region: e.target.value })}
              />
            ) : (
              <ConsoleSelect
                value={cfg.region}
                placeholder="Select a region…"
                disabled={!!ro}
                options={prov.regions ?? []}
                onChange={(v) => set({ region: v })}
              />
            )}
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Connection"
        desc={
          <>
            Test before provisioning schema.{" "}
            <KnowMore topic="connstring" label="What's a connection string?" />
          </>
        }
      >
        <FormGrid>
          <Field
            className="sm:col-span-2"
            label="Connection string / host"
            required
            hint={
              <span className="inline-flex items-center gap-1">
                <LockIcon className="size-[11px]" /> Stored encrypted at rest —
                never shown again after saving.
              </span>
            }
          >
            <SecretInput
              placeholder="postgres://user:••••@host:5432/db"
              value={cfg.host}
              ro={ro}
              onChange={(v) => set({ host: v })}
            />
          </Field>
        </FormGrid>
        <div className="mt-3 flex items-center gap-2.5">
          <TestButton
            label="Test connection"
            okLabel="Connection OK"
            ro={ro || !cfg.host}
            onTest={onTest}
            onResult={() => set({ tested: true })}
          />
          {cfg.tested && <OkInline>Reachable · Postgres 15.4</OkInline>}
        </div>
      </FormSection>

      <FormSection
        title="Schema provisioning"
        desc="Spin up the tables required by this tenant's enabled modules."
      >
        {!cfg.tested ? (
          <Note tone="info" icon={<InfoIcon />}>
            Test the connection first, then provision the schema.
          </Note>
        ) : (
          <div className="rounded-xl border bg-muted/35 px-3.5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold">
                  {cfg.tables ? "Schema provisioned" : "Ready to provision schema"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {cfg.tables
                    ? "38 tables created across 5 module schemas."
                    : "Creates tables for Claims, Members, Products, Finance, Reporting."}
                </div>
              </div>
              {cfg.tables ? (
                <OkInline>Done</OkInline>
              ) : (
                <TestButton
                  label="Spin up tables"
                  okLabel="38 tables created"
                  kind="send"
                  ro={ro}
                  onResult={() => set({ tables: true })}
                />
              )}
            </div>
          </div>
        )}
      </FormSection>

      <SaveBar
        ro={ro}
        disabled={!cfg.tested}
        // A successful "Test connection" already configured + tested the section
        // (the test endpoint marks it DONE), so saving persists DONE — not TESTED,
        // which would downgrade the server status.
        onSave={() => mark("done")}
        label="Save database config"
      />
    </div>
  )
}

/* ------------------------------------------------- Section: Domains & SSL */
export function SecDomains({ cfg, set, mark, onTest, ro }: SectionProps<DomainsConfig>) {
  const sub = (cfg.subdomain || "").trim()
  const taken = sub.length > 0 && TAKEN_SUBDOMAINS.includes(sub)
  const suggestions = taken
    ? [`${sub}-health`, `${sub}-tz`, `${sub}-care`].filter(
        (s) => !TAKEN_SUBDOMAINS.includes(s)
      )
    : []
  return (
    <div className={stack}>
      <FormSection
        title="Ginja subdomain"
        desc="The tenant's default live URL. Lowercase & hyphens only."
      >
        <FormGrid>
          <Field
            className="sm:col-span-2"
            label="Subdomain"
            required
            hintTone={taken ? "error" : sub.length > 0 ? "success" : "muted"}
            hint={
              sub.length > 0
                ? taken
                  ? `${sub}.ginja.ai is already taken by another tenant — choose a different subdomain.`
                  : `✓ ${sub}.ginja.ai is available`
                : undefined
            }
          >
            <div
              className={cn(
                "flex items-center rounded-lg border bg-background text-[13px] focus-within:border-primary focus-within:ring-3 focus-within:ring-ring/16",
                taken ? "border-destructive" : "border-input"
              )}
            >
              <span className="pl-3 text-muted-foreground">https://</span>
              <input
                value={cfg.subdomain}
                disabled={!!ro}
                onChange={(e) =>
                  set({
                    subdomain: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
                  })
                }
                className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
              />
              <span className="pr-3 text-muted-foreground">.ginja.ai</span>
            </div>
            {taken && suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11.5px] text-muted-foreground">
                  Available:
                </span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!!ro}
                    onClick={() => set({ subdomain: s })}
                    className="mono rounded-full border border-input bg-card px-2.5 py-[3px] text-[11px] font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                    {s}.ginja.ai
                  </button>
                ))}
              </div>
            )}
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Custom domain"
        desc={
          <>
            Optional vanity domain. Verify ownership via a CNAME record.{" "}
            <KnowMore topic="customdomain" label="Setup instructions" />
          </>
        }
      >
        <FormGrid>
          <Field className="sm:col-span-2" label="Custom domain" optional>
            <Input
              placeholder="e.g. portal.insurer.co.ke"
              value={cfg.custom}
              disabled={!!ro}
              onChange={(e) => set({ custom: e.target.value })}
            />
          </Field>
        </FormGrid>
        {cfg.custom && (
          <div className="mt-3 rounded-xl border bg-muted/35 px-3.5 py-3">
            <DnsRow k="Type" v="CNAME" />
            <DnsRow k="Name" v={cfg.custom} />
            <DnsRow k="Value" v={`${cfg.subdomain}.ginja.ai`} />
            <div className="mt-2.5 flex items-center gap-2.5">
              <TestButton
                label="Verify CNAME"
                okLabel="CNAME verified"
                ro={ro}
                onTest={onTest}
                onResult={() => set({ cnameVerified: true, ssl: "active" })}
              />
              {cfg.cnameVerified && <OkInline>Verified · TLS issued</OkInline>}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="TLS certificate"
        desc={
          <>
            Encrypts all portal traffic.{" "}
            <KnowMore topic="tls" label="Why it matters" />
          </>
        }
      >
        <div className="flex items-center gap-2.5 rounded-[10px] border bg-muted/35 px-3 py-2.5">
          {cfg.ssl === "active" ? (
            <ShieldCheckIcon className="size-[18px] text-success" />
          ) : (
            <ShieldIcon className="size-[18px] text-muted-foreground" />
          )}
          <span className="text-[13px]">
            {cfg.ssl === "active"
              ? "Active · auto-renewing (Let's Encrypt)"
              : cfg.ssl === "pending"
                ? "Pending domain verification"
                : "Auto-provisioned on activation"}
          </span>
        </div>
      </FormSection>

      <SaveBar ro={ro} onSave={() => mark("done")} label="Save domains" />
    </div>
  )
}

function DnsRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 py-1 text-[12.5px]">
      <span className="w-14 text-muted-foreground">{k}</span>
      <span className="mono">{v}</span>
    </div>
  )
}

/* --------------------------------------------------- Section: SMS provider */
export function SecSms({ cfg, set, mark, onTest, ro }: SectionProps<SmsConfig>) {
  const pr = SMS_PROVIDERS.find((x) => x.id === cfg.provider)
  return (
    <div className={stack}>
      <FormSection
        title="SMS gateway"
        desc="Used for OTP, claim alerts & member notifications."
      >
        <ProviderGrid
          list={SMS_PROVIDERS}
          value={cfg.provider}
          onPick={(v) => set({ provider: v })}
          ro={ro}
        />
        <ProviderRequestHint kind="SMS" />
      </FormSection>

      <FormSection
        title={`${pr ? pr.name : "Provider"} credentials`}
        desc="Secrets are write-only & encrypted at rest."
      >
        <FormGrid>
          <Field
            label={cfg.provider === "twilio" ? "Account SID" : "API key"}
            required
          >
            <SecretInput placeholder="AC••••••••••••••••" ro={ro} />
          </Field>
          <Field
            label={cfg.provider === "twilio" ? "Auth token" : "API secret"}
            required
          >
            <SecretInput placeholder="••••••••••••••••" ro={ro} />
          </Field>
          <Field label="Sender ID">
            <Input
              placeholder="e.g. GINJA"
              value={cfg.senderId}
              disabled={!!ro}
              onChange={(e) => set({ senderId: e.target.value })}
            />
          </Field>
          <Field label="Default country">
            <ConsoleSelect
              value="Kenya (+254)"
              disabled={!!ro}
              options={["Kenya (+254)", "Tanzania (+255)", "Uganda (+256)"]}
              onChange={() => {}}
            />
          </Field>
        </FormGrid>
        <div className="mt-3 flex items-center gap-2.5">
          <TestButton
            label="Send test SMS"
            okLabel="Test SMS delivered"
            kind="send"
            ro={ro}
            onTest={onTest}
            onResult={() => set({ tested: true })}
          />
          {cfg.tested && <OkInline>Delivered to test number</OkInline>}
        </div>
      </FormSection>

      <SaveBar
        ro={ro}
        onSave={() => mark(cfg.tested ? "done" : "progress")}
        label="Save SMS config"
      />
    </div>
  )
}

/* ------------------------------------------------- Section: Email provider */
export function SecEmail({ cfg, set, mark, onTest, ro }: SectionProps<EmailConfig>) {
  const pr = EMAIL_PROVIDERS.find((x) => x.id === cfg.provider)
  const domain = cfg.from ? cfg.from.split("@")[1] : "tenant.ginja.ai"
  return (
    <div className={stack}>
      <FormSection
        title="Email provider"
        desc="Transactional email for invites, activations & notifications."
      >
        <ProviderGrid
          list={EMAIL_PROVIDERS}
          value={cfg.provider}
          onPick={(v) => set({ provider: v })}
          ro={ro}
        />
        <ProviderRequestHint kind="email" />
      </FormSection>

      <FormSection title={`${pr ? pr.name : "Provider"} credentials`}>
        <FormGrid>
          <Field label="API key" required>
            <SecretInput placeholder="re_••••••••••••" ro={ro} />
          </Field>
          <Field label="From address" required>
            <Input
              placeholder="no-reply@tenant.ginja.ai"
              value={cfg.from}
              disabled={!!ro}
              onChange={(e) => set({ from: e.target.value })}
            />
          </Field>
        </FormGrid>
      </FormSection>

      <FormSection
        title="Domain authentication"
        desc="SPF & DKIM ensure deliverability and prevent spoofing."
      >
        <AuthRow
          on={cfg.spf}
          name="SPF record"
          value={`v=spf1 include:_spf.${pr ? pr.id : "resend"}.com ~all`}
        />
        <AuthRow
          on={cfg.dkim}
          name="DKIM record"
          value={`ginja._domainkey.${domain}`}
        />
        <div className="mt-3 flex items-center gap-2.5">
          <TestButton
            label="Send test email"
            okLabel="Test email sent"
            kind="send"
            ro={ro}
            onTest={onTest}
            onResult={() => set({ tested: true, spf: true, dkim: true })}
          />
          {cfg.tested && <OkInline>Delivered · auth passed</OkInline>}
        </div>
      </FormSection>

      <SaveBar
        ro={ro}
        onSave={() => mark(cfg.tested ? "done" : "progress")}
        label="Save email config"
      />
    </div>
  )
}

function AuthRow({
  on,
  name,
  value,
}: {
  on: boolean
  name: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5 border-b py-2.5 last:border-b-0">
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          on ? "bg-success text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {on ? <CheckIcon className="size-3" /> : <MinusIcon className="size-3" />}
      </span>
      <div className="flex-1">
        <b className="text-[13px]">{name}</b>
        <div className="mono text-[11px] text-muted-foreground">{value}</div>
      </div>
      <MiniBadge tone={on ? "success" : "neutral"}>
        {on ? "Verified" : "Pending"}
      </MiniBadge>
    </div>
  )
}

function ProviderRequestHint({ kind }: { kind: string }) {
  return (
    <p className="mt-2.5 text-[11.5px] text-muted-foreground">
      <InfoIcon className="mr-1 inline size-3 align-[-2px]" />
      These are the {kind} integrations Ginja currently supports. Need another{" "}
      {kind === "SMS" ? "gateway" : "provider"}? Raise a request with the platform
      team.
    </p>
  )
}

/* ------------------------------------------------- Section: Data migration */
export function SecMigration({ cfg, set, mark, ro }: SectionProps<MigrationConfig>) {
  const [running, setRunning] = React.useState(false)
  const [progress, setProgress] = React.useState(cfg.status === "done" ? 100 : 0)
  const isDone = cfg.status === "done" || progress >= 100
  const run = () => {
    if (ro) return
    setRunning(true)
    setProgress(0)
    let pct = 0
    const t = setInterval(() => {
      pct += 12
      setProgress(Math.min(pct, 100))
      if (pct >= 100) {
        clearInterval(t)
        setRunning(false)
        set({ status: "done", records: 142800 })
      }
    }, 220)
  }
  return (
    <div className={stack}>
      <Note tone="info" icon={<InfoIcon />}>
        Data migration is <b>optional</b> — skip for greenfield tenants with no
        legacy data.
      </Note>

      <FormSection
        title="Source"
        desc="Where legacy member, policy & claims data is imported from."
      >
        <FormGrid>
          <Field className="sm:col-span-2" label="Migration source">
            <ConsoleSelect
              value={cfg.source === "" ? "none" : cfg.source}
              disabled={!!ro}
              options={[
                { value: "none", label: "No migration (greenfield)" },
                "Legacy SQL export",
                "CSV bundle",
                "Legacy API sync",
              ]}
              onChange={(v) => set({ source: v === "none" ? "" : v })}
            />
          </Field>
        </FormGrid>
      </FormSection>

      {cfg.source && (
        <FormSection title="Run migration">
          <div className="rounded-xl border bg-muted/35 px-3.5 py-3">
            <div
              className={cn(
                "flex items-center justify-between gap-3",
                (running || isDone) && "mb-2.5"
              )}
            >
              <div>
                <div className="text-[13px] font-semibold">
                  {isDone
                    ? "Migration complete"
                    : running
                      ? "Migrating…"
                      : "Ready to import"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {isDone
                    ? `${fmtNum(cfg.records || 142800)} records imported & verified.`
                    : `Source: ${cfg.source}`}
                </div>
              </div>
              {isDone ? (
                <OkInline>Verified</OkInline>
              ) : (
                <button
                  type="button"
                  disabled={!!ro || running}
                  onClick={run}
                  className="inline-flex h-[34px] items-center gap-[7px] rounded-lg border border-input bg-card px-3.5 text-[12.5px] font-semibold hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {running ? (
                    <>
                      <span className="size-3.5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                      {progress}%
                    </>
                  ) : (
                    <>
                      <RotateCcwIcon className="size-3.5" />
                      Start migration
                    </>
                  )}
                </button>
              )}
            </div>
            {(running || isDone) && (
              <div className="h-[7px] overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </FormSection>
      )}

      <SaveBar
        ro={ro}
        onSave={() => mark(isDone || !cfg.source ? "done" : "progress")}
        label="Save migration"
      />
    </div>
  )
}
