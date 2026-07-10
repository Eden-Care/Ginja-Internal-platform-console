import { useSearchParams } from "react-router-dom"
import {
  ChevronLeftIcon,
  KeyRoundIcon,
  LockIcon,
  MonitorIcon,
} from "lucide-react"

import { ConsolePageHeader } from "@/components/console/page-header"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import { SessionsTab } from "./components/sessions-tab"
import { MfaTab } from "./components/mfa-tab"
import { PasswordTab } from "./components/password-tab"

const UA_TABS: TabItem[] = [
  { k: "sessions", label: "Active sessions", icon: <MonitorIcon /> },
  { k: "mfa", label: "MFA status", icon: <KeyRoundIcon /> },
  { k: "password", label: "Password status", icon: <LockIcon /> },
]
const UA_TAB_KEYS = new Set(UA_TABS.map((t) => t.k))

export function UserAccessSecurity({
  readonly,
  roleName,
  onBack,
}: {
  readonly: boolean
  roleName: string
  onBack: () => void
}) {
  // Active tab lives in `?tab=` so it survives a refresh; default "sessions"
  // (kept out of the URL to keep it clean).
  const [params, setParams] = useSearchParams()
  const tabParam = params.get("tab") ?? "sessions"
  const tab = UA_TAB_KEYS.has(tabParam) ? tabParam : "sessions"
  const setTab = (t: string) =>
    setParams(t === "sessions" ? {} : { tab: t }, { replace: true })

  return (
    <div className="flex flex-col gap-4">
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
          "User access & security",
        ]}
        title="User access & security"
        sub="Monitor active sessions, MFA enrolment and password status for every Platform Console user."
      />

      <TabBar tabs={UA_TABS} value={tab} onChange={setTab} />

      {tab === "sessions" && (
        <SessionsTab readonly={readonly} roleName={roleName} />
      )}
      {tab === "mfa" && <MfaTab readonly={readonly} />}
      {tab === "password" && <PasswordTab readonly={readonly} />}
    </div>
  )
}
