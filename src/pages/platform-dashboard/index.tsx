import { Link, useNavigate } from "react-router-dom"
import {
  ArrowRightIcon,
  Building2Icon,
  ChevronRightIcon,
  DatabaseIcon,
  GlobeIcon,
  HistoryIcon,
  LayersIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAccess } from "@/contexts/access-context"
import { APPROVALS, AUDIT_LOG } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { AvatarInitials } from "@/components/console/avatar-initials"
import { Donut, type DonutSegment } from "@/components/console/donut"
import { HBarList } from "@/components/console/hbar-list"
import { KpiStat, KpiStatInline } from "@/components/console/kpi-stat"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

const SEGMENTS: DonutSegment[] = [
  { k: "Active", n: 18, color: "hsl(var(--brand))" },
  { k: "Draft", n: 4, color: "hsl(var(--primary))" },
  { k: "Suspended", n: 1, color: "hsl(var(--warning))" },
  { k: "Retired", n: 1, color: "hsl(var(--muted-foreground))" },
]

const PIPELINE = [
  { label: "Details captured", n: 4, pct: 100 },
  { label: "Modules assigned", n: 4, pct: 100 },
  { label: "Billing set", n: 3, pct: 75 },
  { label: "Docs uploaded", n: 3, pct: 75 },
  { label: "Submitted for review", n: 2, pct: 50 },
]

export function ConsoleDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAccess()
  const firstName = user.fullName.split(" ")[0]
  const attention = APPROVALS.filter((a) => a.status === "pending").slice(0, 4)

  return (
    <div className="flex flex-col gap-3.5">
      <ConsolePageHeader
        title={`Good morning, ${firstName}`}
        sub="Tenant onboarding, approvals and platform health at a glance."
        actions={
          <>
            <Button variant="outline" size="sm">
              <RefreshCwIcon data-icon="inline-start" />
              Last 30 days
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/tenant-accounts/onboard")}
            >
              <PlusIcon data-icon="inline-start" />
              Onboard tenant
            </Button>
          </>
        }
      />

      {/* KPI stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiStat
          icon={<Building2Icon />}
          label="Active tenants"
          value="18"
          foot="+2 this week"
          tone="b"
        />
        <KpiStat
          icon={<UserPlusIcon />}
          label="In onboarding"
          value="4"
          foot="3 awaiting docs"
          tone="p"
        />
        <KpiStat
          icon={<ShieldCheckIcon />}
          label="Pending approvals"
          value="5"
          foot="2 high priority"
          tone="w"
        />
        <KpiStat
          icon={<UsersIcon />}
          label="Covered members"
          value="2.1M"
          foot="across 41 tenants"
          tone=""
        />
      </div>

      {/* Status donut + onboarding pipeline */}
      <div className="grid gap-3.5 xl:grid-cols-[1fr_1.35fr]">
        <Panel>
          <PanelHead
            icon={<Building2Icon />}
            title="Tenant accounts by status"
          />
          <PanelBody className="flex items-center gap-7">
            <Donut segments={SEGMENTS} total={24} />
            <div className="grid flex-1 gap-2.5">
              {SEGMENTS.map((s) => (
                <div
                  key={s.k}
                  className="flex items-center gap-2 text-[12.5px]"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: s.color }}
                  />
                  <span>{s.k}</span>
                  <b className="mono ml-auto">{s.n}</b>
                </div>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            icon={<ZapIcon />}
            title="Onboarding pipeline"
            action={<Tagpill>4 in progress</Tagpill>}
          />
          <PanelBody>
            <HBarList bars={PIPELINE} />
          </PanelBody>
        </Panel>
      </div>

      {/* Approvals + recent activity */}
      <div className="grid gap-3.5 xl:grid-cols-[1.1fr_1fr]">
        <Panel>
          <PanelHead
            icon={<ShieldCheckIcon />}
            title="Approvals needing attention"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/approvals">
                  View all
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            }
          />
          <div className="p-2">
            {attention.map((a) => (
              <Link
                key={a.id}
                to="/approvals"
                className="flex items-center gap-3 rounded-[9px] px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <AvatarInitials name={a.payer} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{a.payer}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.kind} · by {a.maker} · {a.submitted}
                  </div>
                </div>
                {a.priority === "High" ? (
                  <MiniBadge tone="warning">High</MiniBadge>
                ) : null}
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHead icon={<HistoryIcon />} title="Recent platform activity" />
          <PanelBody>
            <ol className="grid gap-3.5">
              {AUDIT_LOG.slice(0, 5).map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/40" />
                  <div className="min-w-0">
                    <div className="mono text-[11px] text-muted-foreground">
                      {a.date} · {a.when}
                    </div>
                    <div className="text-[13px] font-medium">{a.action}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.target} — {a.actor}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </PanelBody>
        </Panel>
      </div>

      {/* Platform stats */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <KpiStatInline
          icon={<GlobeIcon />}
          label="Data residency regions"
          value="6 active"
          foot="1 provisioning · Lagos"
        />
        <KpiStatInline
          icon={<LayersIcon />}
          label="Published modules"
          value="9 live"
          foot="1 beta · 1 sunset"
        />
        <KpiStatInline
          icon={<DatabaseIcon />}
          label="Tenant environments"
          value="41 live"
          foot="100% isolation verified"
        />
      </div>
    </div>
  )
}
