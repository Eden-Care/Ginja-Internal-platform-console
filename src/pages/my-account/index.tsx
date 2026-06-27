import * as React from "react"
import { useSearchParams } from "react-router-dom"
import {
  HistoryIcon,
  KeyRoundIcon,
  LockIcon,
  MonitorIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"

import { ConsolePageHeader } from "@/components/console/page-header"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { ProfileTab } from "./profile-tab"
import { PasswordTab } from "./password-tab"
import { MfaTab } from "./mfa-tab"
import { SessionsTab } from "./sessions-tab"
import { ActivityTab } from "./activity-tab"
import { RolesTab } from "./roles-tab"

const TABS: TabItem[] = [
  { k: "profile", label: "Profile", icon: <UsersIcon /> },
  { k: "password", label: "Password", icon: <LockIcon /> },
  { k: "mfa", label: "Multi-factor authentication", icon: <KeyRoundIcon /> },
  { k: "sessions", label: "Active sessions", icon: <MonitorIcon /> },
  { k: "activity", label: "Security activity", icon: <HistoryIcon /> },
  { k: "roles", label: "My roles & access", icon: <ShieldIcon /> },
]

const TAB_KEYS = TABS.map((t) => t.k)

export function MyAccountPage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get("tab")
  const [tab, setTab] = React.useState(
    initial && TAB_KEYS.includes(initial) ? initial : "profile"
  )

  const onChange = (k: string) => {
    setTab(k)
    setParams(k === "profile" ? {} : { tab: k }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={[{ label: "Account" }, "My account"]}
        title="My account"
        sub="Manage your profile, security, sessions and access."
      />

      <TabBar tabs={TABS} value={tab} onChange={onChange} />

      {tab === "profile" && <ProfileTab />}
      {tab === "password" && <PasswordTab />}
      {tab === "mfa" && <MfaTab />}
      {tab === "sessions" && <SessionsTab />}
      {tab === "activity" && <ActivityTab />}
      {tab === "roles" && <RolesTab />}
    </div>
  )
}
