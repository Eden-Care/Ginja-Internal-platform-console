import * as React from "react"
import {
  BanIcon,
  CheckIcon,
  ClockIcon,
  GlobeIcon,
  InfoIcon,
  KeyRoundIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  ServerIcon,
  ShieldIcon,
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
import { REGIONS } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { hifiTableHead } from "@/components/console/table"
import { LoadingSpinner } from "@/components/common/loading"
import { useRoles } from "@/features/access/use-roles"
import { useProvisioning } from "@/features/provisioning/use-provisioning"

const TABS: TabItem[] = [
  { k: "security", label: "Security policies", icon: <ShieldIcon /> },
  { k: "roles", label: "Roles & permissions", icon: <KeyRoundIcon /> },
  { k: "regions", label: "Data residency", icon: <GlobeIcon /> },
  { k: "provisioning", label: "Provisioning", icon: <ServerIcon /> },
]

const ISOLATION = [
  {
    n: "Isolated by default",
    t: "All tenants",
    icon: <ShieldIcon />,
    d: "Dedicated namespace, schema & topics for every tenant. Full compliance isolation — no shared data paths.",
    on: true,
  },
  {
    n: "Pinned data residency",
    t: "Per tenant",
    icon: <GlobeIcon />,
    d: "Tenant data stays in the storage region chosen at provisioning. Cross-region replication is opt-in.",
  },
  {
    n: "Encrypted everywhere",
    t: "Platform-wide",
    icon: <LockIcon />,
    d: "AES-256 at rest, TLS in transit. Connection secrets are write-only after saving.",
  },
]

/** A single labelled setting row (title + description on the left, control right). */
function SetRow({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-[15px] last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{title}</div>
        <div className="max-w-[60ch] text-xs text-muted-foreground">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function PlatformSettingsPage() {
  const [tab, setTab] = React.useState("security")
  const [s, setS] = React.useState({
    totp: true,
    sms: true,
    hwkey: false,
    reuse: true,
    minLen: "12",
    expiry: "90 days",
    maxFail: "5",
    lockoutDur: "30 min",
    sessionTimeout: "8 hours",
    idleTimeout: "30 min",
  })
  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) =>
    setS((x) => ({ ...x, [k]: v }))

  // Roles & permissions tab — live platform roles (shared with the /access-roles
  // page). The provisioning query fires only to log its response to the console
  // (see fetchProvisioning); the Provisioning tab UI stays static.
  const rolesQuery = useRoles()
  useProvisioning()

  React.useEffect(() => {
    if (rolesQuery.data) {
      console.log("[GET /platform/organization/roles]", rolesQuery.data)
    }
  }, [rolesQuery.data])

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Platform settings"
        sub="Global policies inherited by every tenant. Per-tenant overrides are a future release."
      />

      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      {/* ---- Security policies ---- */}
      {tab === "security" && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHead
                icon={<KeyRoundIcon />}
                title="Multi-factor authentication"
              />
              <PanelBody className="py-1">
                <SetRow
                  title="MFA required"
                  desc="Mandatory for all Tenant Admins on first login and every session."
                >
                  <Switch checked aria-readonly onCheckedChange={() => {}} />
                </SetRow>
                <SetRow
                  title="TOTP authenticator app"
                  desc="Google Authenticator, Authy, 1Password."
                >
                  <Switch
                    checked={s.totp}
                    onCheckedChange={(v) => set("totp", v)}
                  />
                </SetRow>
                <SetRow
                  title="SMS one-time passcode"
                  desc="Fallback for users without an authenticator."
                >
                  <Switch
                    checked={s.sms}
                    onCheckedChange={(v) => set("sms", v)}
                  />
                </SetRow>
                <SetRow
                  title="Hardware security key"
                  desc="FIDO2 / WebAuthn for high-privilege roles."
                >
                  <Switch
                    checked={s.hwkey}
                    onCheckedChange={(v) => set("hwkey", v)}
                  />
                </SetRow>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={<LockIcon />} title="Password policy" />
              <PanelBody className="py-1">
                <SetRow title="Minimum length" desc="Characters required.">
                  <ConsoleSelect
                    className="w-[90px]"
                    value={s.minLen}
                    onChange={(v) => set("minLen", v)}
                    options={["8", "10", "12", "14", "16"]}
                  />
                </SetRow>
                <SetRow
                  title="Complexity"
                  desc="Upper, lower, number & special character."
                >
                  <Tagpill>All required</Tagpill>
                </SetRow>
                <SetRow
                  title="Expiry interval"
                  desc="Force rotation periodically."
                >
                  <ConsoleSelect
                    className="w-[120px]"
                    value={s.expiry}
                    onChange={(v) => set("expiry", v)}
                    options={["Never", "60 days", "90 days", "180 days"]}
                  />
                </SetRow>
                <SetRow
                  title="Re-use restriction"
                  desc="Block last 5 passwords."
                >
                  <Switch
                    checked={s.reuse}
                    onCheckedChange={(v) => set("reuse", v)}
                  />
                </SetRow>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={<BanIcon />} title="Lockout" />
              <PanelBody className="py-1">
                <SetRow
                  title="Max failed attempts"
                  desc="Before the account is locked."
                >
                  <ConsoleSelect
                    className="w-[80px]"
                    value={s.maxFail}
                    onChange={(v) => set("maxFail", v)}
                    options={["3", "5", "10"]}
                  />
                </SetRow>
                <SetRow title="Lockout duration" desc="Auto-unlock window.">
                  <ConsoleSelect
                    className="w-[120px]"
                    value={s.lockoutDur}
                    onChange={(v) => set("lockoutDur", v)}
                    options={["15 min", "30 min", "1 hour"]}
                  />
                </SetRow>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHead icon={<ClockIcon />} title="Sessions" />
              <PanelBody className="py-1">
                <SetRow
                  title="Session timeout"
                  desc="Absolute maximum session length."
                >
                  <ConsoleSelect
                    className="w-[120px]"
                    value={s.sessionTimeout}
                    onChange={(v) => set("sessionTimeout", v)}
                    options={["4 hours", "8 hours", "12 hours"]}
                  />
                </SetRow>
                <SetRow
                  title="Idle timeout"
                  desc="Inactivity before auto-logout."
                >
                  <ConsoleSelect
                    className="w-[120px]"
                    value={s.idleTimeout}
                    onChange={(v) => set("idleTimeout", v)}
                    options={["15 min", "30 min", "60 min"]}
                  />
                </SetRow>
              </PanelBody>
            </Panel>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => toast("Policies reset.")}>
              Reset
            </Button>
            <Button onClick={() => toast("Security policies saved.")}>
              <CheckIcon data-icon="inline-start" />
              Save policies
            </Button>
          </div>
        </div>
      )}

      {/* ---- Roles & permissions ---- */}
      {tab === "roles" && (
        <div className="flex flex-col gap-3">
          <Note tone="info" icon={<InfoIcon />}>
            Platform roles and the modules each one grants. System roles are
            built-in and immutable; custom roles are authored by your team.
          </Note>
          {rolesQuery.isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <LoadingSpinner />
            </div>
          ) : rolesQuery.isError ? (
            <Note tone="err" icon={<TriangleAlertIcon />}>
              Couldn’t load roles.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => rolesQuery.refetch()}
              >
                Try again
              </button>
              .
            </Note>
          ) : (rolesQuery.data ?? []).length === 0 ? (
            <Note tone="info">No roles found.</Note>
          ) : (
            (rolesQuery.data ?? []).map((r) => (
              <Panel key={r.id} className="p-4">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary [&>svg]:size-4">
                      <KeyRoundIcon />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                        {r.name}
                        <Tagpill className="text-[10px]">
                          {r.system ? "System" : "Custom"}
                        </Tagpill>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.description || "—"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast(`Editing ${r.name}.`)}
                  >
                    <PencilIcon data-icon="inline-start" />
                    Edit template
                  </Button>
                </div>
                {r.functionalities.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {r.functionalities.map((f) => (
                      <Tagpill key={f.code} className="text-[11px]">
                        <CheckIcon className="size-2.5" />
                        {f.name}
                      </Tagpill>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-muted-foreground">
                    No modules assigned.
                  </div>
                )}
              </Panel>
            ))
          )}
        </div>
      )}

      {/* ---- Data residency ---- */}
      {tab === "regions" && (
        <div className="flex flex-col gap-3">
          <Note tone="info" icon={<GlobeIcon />}>
            Data residency regions populate the onboarding dropdowns. Each
            tenant's data is provisioned and validated to its selected region.
          </Note>
          <Panel className="overflow-hidden">
            <Table>
              <TableHeader className={hifiTableHead}>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Region ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tenants</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {REGIONS.map((r) => (
                  <TableRow key={r.id} className="hover:bg-transparent">
                    <TableCell className="mono text-[12.5px] font-medium">
                      {r.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GlobeIcon className="size-[15px] text-muted-foreground" />
                        <span className="font-medium">
                          {r.city}, {r.country}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MiniBadge
                        tone={r.status === "Active" ? "success" : "warning"}
                      >
                        {r.status}
                      </MiniBadge>
                    </TableCell>
                    <TableCell className="mono text-right">
                      {r.tenants}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast(`Editing region ${r.id}.`)}
                      >
                        <PencilIcon data-icon="inline-start" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <div>
            <Button
              variant="outline"
              onClick={() => toast("Add a data residency region.")}
            >
              <PlusIcon data-icon="inline-start" />
              Add region
            </Button>
          </div>
        </div>
      )}

      {/* ---- Provisioning ---- */}
      {tab === "provisioning" && (
        <div className="flex flex-col gap-3">
          <Note tone="info" icon={<ServerIcon />}>
            <b>Every tenant is fully isolated.</b> Ginja provisions a dedicated
            namespace, database schema & event-bus topics per tenant at
            activation — there is no shared-infrastructure tier.
          </Note>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {ISOLATION.map((x) => (
              <div
                key={x.n}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border bg-card p-[18px] shadow-xs transition-all",
                  x.on && "border-primary ring-1 ring-primary"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                    {x.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{x.n}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {x.t}
                    </div>
                  </div>
                  {x.on ? <MiniBadge tone="success">Standard</MiniBadge> : null}
                </div>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {x.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
