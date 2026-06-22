import * as React from "react"
import {
  BanIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  KeyRoundIcon,
  LockIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import {
  useSecurityPolicy,
  useUpdateSecurityPolicy,
} from "@/features/settings/use-security-policy"
import type { SecurityPolicy } from "@/features/settings/types"
import { SetRow } from "./components/set-row"

/** "Admin only" tag shown beside section headings. */
function AdminTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-[0.02em] text-muted-foreground [&>svg]:size-[11px]">
      <ShieldIcon />
      Admin only
    </span>
  )
}

/** A panel footer note (hairline-topped, info-icon hint). */
function PanelNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[7px] border-t px-[18px] py-2.5 text-[11.5px] leading-[1.5] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
      <InfoIcon className="mt-px size-[13px] shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </div>
  )
}

/* ----- value ⇆ display-label converters for the select controls ----- */
/** Ensure the live value is always selectable even if it's off the standard list. */
const withCurrent = (opts: string[], cur: string) =>
  opts.includes(cur) ? opts : [cur, ...opts]

const expiryLabel = (days: number) => (days <= 0 ? "Never" : `${days} days`)
const expiryDays = (label: string) =>
  label === "Never" ? 0 : parseInt(label, 10) || 0

const durLabel = (min: number) => (min === 60 ? "1 hour" : `${min} min`)
const durMin = (label: string) =>
  label === "1 hour" ? 60 : parseInt(label, 10) || 0

const hoursLabel = (min: number) =>
  min % 60 === 0 ? `${min / 60} hours` : `${min} min`
const hoursMin = (label: string) =>
  /hour/.test(label)
    ? (parseInt(label, 10) || 0) * 60
    : parseInt(label, 10) || 0

const minsLabel = (min: number) => `${min} min`
const minsMin = (label: string) => parseInt(label, 10) || 0

const CX: { key: string; label: string; field: keyof SecurityPolicy }[] = [
  { key: "upper", label: "A-Z", field: "requireUpper" },
  { key: "lower", label: "a-z", field: "requireLower" },
  { key: "number", label: "0-9", field: "requireNumber" },
  { key: "special", label: "!@#", field: "requireSpecial" },
]

export function SecurityPolicies({
  readonly,
  onBack,
}: {
  readonly: boolean
  onBack: () => void
}) {
  const isAdmin = !readonly
  const policyQuery = useSecurityPolicy()
  const updateMut = useUpdateSecurityPolicy()

  // Editable copy seeded from the API. Synced during render (not an effect) when
  // a fresh payload arrives — the React "adjust state while rendering" pattern.
  const [form, setForm] = React.useState<SecurityPolicy | null>(null)
  const [synced, setSynced] = React.useState<SecurityPolicy | undefined>(
    undefined
  )
  if (policyQuery.data && policyQuery.data !== synced) {
    setSynced(policyQuery.data)
    setForm(policyQuery.data)
  }

  const set = <K extends keyof SecurityPolicy>(k: K, v: SecurityPolicy[K]) =>
    !readonly && setForm((f) => (f ? { ...f, [k]: v } : f))

  const header = (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-mb-1 inline-flex w-fit items-center gap-1.5 text-[12.5px] font-semibold text-primary [&>svg]:size-[14px]"
      >
        <ChevronLeftIcon />
        All settings
      </button>

      <ConsolePageHeader
        crumbs={[
          { label: "Platform" },
          { label: "Settings" },
          "Security policies",
        ]}
        title="Security policies"
        sub="Authentication, passwords, lockout & sessions enforced across the platform."
      />
    </>
  )

  if (policyQuery.isLoading || !form) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (policyQuery.isError) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load the security policy.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => policyQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      </div>
    )
  }

  const methods = [
    form.mfaTotp && "an authenticator app",
    form.mfaSms && "SMS one-time passcodes",
    form.mfaWebauthn && "security keys",
  ].filter(Boolean) as string[]
  const methodList =
    methods.length <= 1
      ? methods[0]
      : methods.slice(0, -1).join(", ") + " or " + methods[methods.length - 1]

  const mfaNote = form.mfaRequired ? (
    methods.length ? (
      <span>
        MFA is <b>required</b> — users verify with {methodList}.
      </span>
    ) : (
      <span>
        MFA is required but <b>no methods are enabled</b> — enable at least one
        for sign-in to work.
      </span>
    )
  ) : (
    <span>
      MFA is optional — users may enable it themselves. Turn on{" "}
      <b>MFA required</b> to enforce it platform-wide.
    </span>
  )

  return (
    <div className="flex flex-col gap-4">
      {header}

      <Note
        tone={isAdmin ? "info" : "warn"}
        icon={isAdmin ? <ShieldCheckIcon /> : <LockIcon />}
      >
        {isAdmin ? (
          <>
            <b>Admin-only settings.</b> MFA, password policy, lockout &amp;
            sessions can only be configured by a <b>Platform Admin</b>. Changes
            apply platform-wide and are written to the audit log.
          </>
        ) : (
          <>
            <b>View-only.</b> These security policies can only be changed by a{" "}
            <b>Platform Admin</b>. You can review the current configuration but
            not edit it.
          </>
        )}
      </Note>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Multi-factor authentication */}
        <Panel className="flex flex-col">
          <PanelHead
            icon={<KeyRoundIcon />}
            title="Multi-factor authentication"
            action={<AdminTag />}
          />
          <PanelBody className="grow py-1">
            <SetRow
              title="MFA required"
              desc="Mandatory for all Tenant Admins on first login and every session."
            >
              <Switch
                checked={form.mfaRequired}
                disabled={readonly}
                onCheckedChange={(v) => set("mfaRequired", v)}
              />
            </SetRow>
            <SetRow
              title="Authenticator app (TOTP)"
              desc="Google Authenticator, Authy, 1Password."
            >
              <Switch
                checked={form.mfaTotp}
                disabled={readonly}
                onCheckedChange={(v) => set("mfaTotp", v)}
              />
            </SetRow>
            <SetRow
              title="SMS one-time passcode"
              desc="Code sent by text message."
            >
              <Switch
                checked={form.mfaSms}
                disabled={readonly}
                onCheckedChange={(v) => set("mfaSms", v)}
              />
            </SetRow>
            <SetRow
              title="Security key (WebAuthn)"
              desc="FIDO2 hardware key or device passkey."
            >
              <Switch
                checked={form.mfaWebauthn}
                disabled={readonly}
                onCheckedChange={(v) => set("mfaWebauthn", v)}
              />
            </SetRow>
          </PanelBody>
          <PanelNote>{mfaNote}</PanelNote>
        </Panel>

        {/* Password policy */}
        <Panel className="flex flex-col">
          <PanelHead
            icon={<LockIcon />}
            title="Password policy"
            action={<AdminTag />}
          />
          <PanelBody className="grow py-1">
            <SetRow title="Minimum length" desc="Characters required.">
              <ConsoleSelect
                className="w-[90px]"
                value={String(form.minLength)}
                disabled={readonly}
                onChange={(v) => set("minLength", parseInt(v, 10) || 0)}
                options={withCurrent(
                  ["8", "10", "12", "14", "16"],
                  String(form.minLength)
                )}
              />
            </SetRow>
            <SetRow title="Complexity" desc="Required character classes.">
              <div className="flex flex-wrap justify-end gap-1.5">
                {CX.map(({ key, label, field }) => {
                  const on = form[field] as boolean
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={readonly}
                      aria-pressed={on}
                      onClick={() =>
                        set(field, !on as SecurityPolicy[typeof field])
                      }
                      className={cn(
                        "mono inline-flex items-center gap-1 rounded-full border px-[9px] py-1 text-[11.5px] font-semibold transition-colors [&>svg]:size-[11px]",
                        on
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input text-muted-foreground",
                        !readonly && !on && "hover:border-primary/50",
                        readonly && "cursor-default opacity-65"
                      )}
                    >
                      {on ? <CheckIcon /> : <PlusIcon />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </SetRow>
            <SetRow title="Expiry interval" desc="Force rotation periodically.">
              <ConsoleSelect
                className="w-[120px]"
                value={expiryLabel(form.expiryDays)}
                disabled={readonly}
                onChange={(v) => set("expiryDays", expiryDays(v))}
                options={withCurrent(
                  ["Never", "60 days", "90 days", "180 days"],
                  expiryLabel(form.expiryDays)
                )}
              />
            </SetRow>
            <SetRow
              title="Re-use restriction"
              desc={
                form.historyCount > 0
                  ? `Block the last ${form.historyCount} passwords.`
                  : "Allow re-using previous passwords."
              }
            >
              <Switch
                checked={form.historyCount > 0}
                disabled={readonly}
                onCheckedChange={(v) =>
                  set("historyCount", v ? form.historyCount || 5 : 0)
                }
              />
            </SetRow>
          </PanelBody>
          <PanelNote>
            Applies to every Platform Console user. Existing users are prompted
            to update at next login if their password doesn't meet the policy.
          </PanelNote>
        </Panel>

        {/* Lockout */}
        <Panel className="flex flex-col">
          <PanelHead icon={<BanIcon />} title="Lockout" action={<AdminTag />} />
          <PanelBody className="grow py-1">
            <SetRow
              title="Max failed attempts"
              desc="Before the account is locked."
            >
              <ConsoleSelect
                className="w-20"
                value={String(form.lockoutMaxAttempts)}
                disabled={readonly}
                onChange={(v) =>
                  set("lockoutMaxAttempts", parseInt(v, 10) || 0)
                }
                options={withCurrent(
                  ["3", "5", "10"],
                  String(form.lockoutMaxAttempts)
                )}
              />
            </SetRow>
            <SetRow title="Lockout duration" desc="Auto-unlock window.">
              <ConsoleSelect
                className="w-[120px]"
                value={durLabel(form.lockoutDurationMinutes)}
                disabled={readonly}
                onChange={(v) => set("lockoutDurationMinutes", durMin(v))}
                options={withCurrent(
                  ["15 min", "30 min", "1 hour"],
                  durLabel(form.lockoutDurationMinutes)
                )}
              />
            </SetRow>
          </PanelBody>
          <PanelNote>
            After the limit, the account locks and auto-unlocks once the
            duration passes. An admin can unlock sooner from the user's record.
          </PanelNote>
        </Panel>

        {/* Sessions */}
        <Panel className="flex flex-col">
          <PanelHead
            icon={<ClockIcon />}
            title="Sessions"
            action={<AdminTag />}
          />
          <PanelBody className="grow py-1">
            <SetRow
              title="Session timeout"
              desc="Absolute maximum session length."
            >
              <ConsoleSelect
                className="w-[120px]"
                value={hoursLabel(form.sessionTimeoutMinutes)}
                disabled={readonly}
                onChange={(v) => set("sessionTimeoutMinutes", hoursMin(v))}
                options={withCurrent(
                  ["4 hours", "8 hours", "12 hours"],
                  hoursLabel(form.sessionTimeoutMinutes)
                )}
              />
            </SetRow>
            <SetRow title="Idle timeout" desc="Inactivity before auto-logout.">
              <ConsoleSelect
                className="w-[120px]"
                value={minsLabel(form.idleTimeoutMinutes)}
                disabled={readonly}
                onChange={(v) => set("idleTimeoutMinutes", minsMin(v))}
                options={withCurrent(
                  ["15 min", "30 min", "60 min"],
                  minsLabel(form.idleTimeoutMinutes)
                )}
              />
            </SetRow>
          </PanelBody>
          <PanelNote>
            Users are signed out at the absolute timeout regardless of activity,
            or earlier after the idle period.
          </PanelNote>
        </Panel>
      </div>

      {!readonly && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            disabled={updateMut.isPending}
            onClick={() => {
              if (policyQuery.data) setForm(policyQuery.data)
              toast("Changes reset.")
            }}
          >
            Reset
          </Button>
          <Button
            disabled={updateMut.isPending}
            onClick={() =>
              updateMut.mutate(form, {
                onSuccess: () => toast.success("Security policies saved."),
                onError: (e) =>
                  toast.error("Couldn’t save policies", {
                    description: e instanceof Error ? e.message : undefined,
                  }),
              })
            }
          >
            <CheckIcon data-icon="inline-start" />
            {updateMut.isPending ? "Saving…" : "Save policies"}
          </Button>
        </div>
      )}
    </div>
  )
}
