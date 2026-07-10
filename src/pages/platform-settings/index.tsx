import * as React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowRightIcon, GlobeIcon, ShieldIcon, UsersIcon } from "lucide-react"

import { useAccess } from "@/contexts/access-context"
import { ConsolePageHeader } from "@/components/console/page-header"
import { SecurityPolicies } from "./security"
import { UserAccessSecurity } from "./user-access"
import { LocaleRules } from "./locale-rules"

type Section = "security" | "user-access" | "locale"

type Category = {
  k: Section
  icon: React.ReactNode
  title: string
  desc: string
  items: string[]
  tag: string
}

/* settings categories — add more cards here as the platform grows */
const CATEGORIES: Category[] = [
  {
    k: "security",
    icon: <ShieldIcon />,
    title: "Security policies",
    desc: "Authentication, passwords, lockout & sessions enforced across the platform.",
    items: [
      "Multi-factor authentication",
      "Password policy",
      "Lockout",
      "Sessions",
    ],
    tag: "Admin only",
  },
  {
    k: "user-access",
    icon: <UsersIcon />,
    title: "User access & security",
    desc: "Monitor active sessions, MFA enrolment and password status for every user.",
    items: ["Active sessions", "MFA status", "Password status"],
    tag: "Admin only",
  },
  {
    k: "locale",
    icon: <GlobeIcon />,
    title: "Localization & data rules",
    desc: "Default formats, currency, languages and the versioned validation-rule library tenants inherit.",
    items: ["Formatting & locale", "Validation rules", "Versioned"],
    tag: "Versioned",
  },
]

const SECTIONS: Section[] = ["security", "user-access", "locale"]

export function PlatformSettingsPage() {
  const { isReadonly, role } = useAccess()
  const readonly = isReadonly("settings")
  const navigate = useNavigate()
  // Section lives in the URL (`/platform-settings/:section`) so it survives a
  // refresh / is deep-linkable; absent → landing grid.
  const { section } = useParams<{ section: string }>()
  const back = () => navigate("/platform-settings")

  if (section && !SECTIONS.includes(section as Section)) {
    return <Navigate to="/platform-settings" replace />
  }

  if (section === "security") {
    return <SecurityPolicies readonly={readonly} onBack={back} />
  }
  if (section === "user-access") {
    return (
      <UserAccessSecurity
        readonly={readonly}
        roleName={role.label}
        onBack={back}
      />
    )
  }
  if (section === "locale") {
    return <LocaleRules readonly={readonly} onBack={back} />
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={[{ label: "Platform" }, "Settings"]}
        title="Platform settings"
        sub="Global policies & configuration inherited by every tenant. Per-tenant overrides are a future release."
      />

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
        {CATEGORIES.map((c) => (
          <div
            key={c.k}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/platform-settings/${c.k}`)}
            onKeyDown={(e) =>
              e.key === "Enter" && navigate(`/platform-settings/${c.k}`)
            }
            className="flex cursor-pointer flex-col gap-3.5 rounded-[14px] border bg-card p-4 transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex gap-[11px]">
              <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-violet/14 text-violet [&>svg]:size-4">
                {c.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-[7px] text-sm font-semibold">
                  {c.title}
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold tracking-[0.02em] text-muted-foreground [&>svg]:size-[11px]">
                    <ShieldIcon />
                    {c.tag}
                  </span>
                </div>
                <div className="mt-[3px] text-xs leading-[1.45] text-muted-foreground">
                  {c.desc}
                </div>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {c.items.map((it) => (
                  <span
                    key={it}
                    className="rounded-full bg-muted px-[9px] py-[3px] text-[11px] font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {it}
                  </span>
                ))}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap text-primary [&>svg]:size-[13px]">
                Configure
                <ArrowRightIcon />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
