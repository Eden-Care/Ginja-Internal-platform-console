import { Navigate, Route, Routes } from "react-router-dom"
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
import { ComingSoonPage } from "@/pages/coming-soon"
import { ConsoleDashboardPage } from "@/pages/platform-dashboard"
import { ApprovalsPage } from "@/pages/approvals"
import { TenantAccountsPage } from "@/pages/tenant-accounts"
import { OnboardTenantPage } from "@/pages/tenant-accounts/onboard"
import { TenantProvisioningPage } from "@/pages/tenant-provisioning"

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
            <Route path="module-registry" element={<ComingSoonPage />} />
            <Route path="document-templates" element={<ComingSoonPage />} />
            <Route path="email-templates" element={<ComingSoonPage />} />
            <Route path="pricing" element={<ComingSoonPage />} />
            <Route path="access-users" element={<ComingSoonPage />} />
            <Route path="access-roles" element={<ComingSoonPage />} />
            <Route path="platform-settings" element={<ComingSoonPage />} />
            <Route path="audit-log" element={<ComingSoonPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function App() {
  return <AppShell />
}

export default App
