import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"
import { BellDotIcon, MoonIcon, SunIcon } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { GlobalSearch } from "@/components/global-search"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { LoginPage } from "@/pages/login"
import { ConsoleDashboardPage } from "@/pages/platform-dashboard"
import { ApprovalsPage } from "@/pages/approvals"
import { TenantAccountsPage } from "@/pages/tenant-accounts"
import { OnboardTenantPage } from "@/pages/tenant-accounts/onboard"
import { TenantProvisioningPage } from "@/pages/tenant-provisioning"
import { ModuleRegistryPage } from "@/pages/module-registry"
import { DocumentTemplatesPage } from "@/pages/document-templates"
import { EmailTemplatesPage } from "@/pages/email-templates"
import { PricingPage } from "@/pages/pricing"
import { AccessUsersPage } from "@/pages/access/users"
import { AccessRolesPage } from "@/pages/access/roles"
import { PlatformSettingsPage } from "@/pages/platform-settings"
import { AuditLogPage } from "@/pages/audit-log"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function AppShell() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <BellDotIcon />
              <span className="sr-only">Notifications</span>
            </Button>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col bg-muted/40 p-4 md:p-6">
          <Routes>
            <Route index element={<ConsoleDashboardPage />} />
            <Route path="tenant-accounts" element={<TenantAccountsPage />} />
            <Route
              path="tenant-accounts/onboard"
              element={<OnboardTenantPage />}
            />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route
              path="tenant-provisioning"
              element={<TenantProvisioningPage />}
            />
            <Route path="module-registry" element={<ModuleRegistryPage />} />
            <Route
              path="document-templates"
              element={<DocumentTemplatesPage />}
            />
            <Route path="email-templates" element={<EmailTemplatesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="access-users" element={<AccessUsersPage />} />
            <Route path="access-roles" element={<AccessRolesPage />} />
            <Route path="platform-settings" element={<PlatformSettingsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Gate for the authenticated shell — bounces to /login (remembering where the
   user was headed) when there's no live session. */
function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  )
}

export default App
