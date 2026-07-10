import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom"
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
import { AuthLoginPage } from "@/pages/authentication/login"
import { ForgotPasswordPage } from "@/pages/authentication/forgot-password"
import { MfaEnrollPage } from "@/pages/authentication/mfa-enroll"
import { AcceptInvitePage } from "@/pages/accept-invite"
import { ConsoleDashboardPage } from "@/pages/platform-dashboard"
import { ApprovalsPage } from "@/pages/approvals"
import { ApprovalReviewPage } from "@/pages/approvals/review"
import { TenantAccountsPage } from "@/pages/tenant-accounts"
import { OnboardTenantPage } from "@/pages/tenant-accounts/onboard"
import { PayerRecordPage } from "@/pages/tenant-accounts/record"
import { TenantProvisioningPage } from "@/pages/tenant-provisioning"
import { ProvisioningDetailPage } from "@/pages/tenant-provisioning/detail"
import { InsurersPage } from "@/pages/insurers"
import { ServiceProvidersPage } from "@/pages/service-providers"
import { ModuleRegistryPage } from "@/pages/module-registry"
import { ModuleRecordPage } from "@/pages/module-registry/record"
import { ModuleFormPage } from "@/pages/module-registry/form-page"
import { DocumentTemplatesPage } from "@/pages/document-templates"
import { EmailTemplatesPage } from "@/pages/email-templates"
import { EmailEditorPage } from "@/pages/email-templates/record"
import { EmailTemplateFormPage } from "@/pages/email-templates/form-page"
import { SmsTemplatesPage } from "@/pages/sms-templates"
import { SmsEditorPage } from "@/pages/sms-templates/record"
import { SmsTemplateFormPage } from "@/pages/sms-templates/form-page"
import { PricingPage } from "@/pages/pricing"
import { AccessUsersPage } from "@/pages/access/users"
import { AccessRolesPage } from "@/pages/access/roles"
import { PlatformSettingsPage } from "@/pages/platform-settings"
import { AuditLogPage } from "@/pages/audit-log"
import { MyAccountPage } from "@/pages/my-account"

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
            <Route
              path="tenant-accounts/:payerId"
              element={<PayerRecordPage />}
            />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route
              path="approvals/:payerId"
              element={<ApprovalReviewPage />}
            />
            <Route
              path="tenant-provisioning"
              element={<TenantProvisioningPage />}
            />
            <Route
              path="tenant-provisioning/:tenantId"
              element={<ProvisioningDetailPage />}
            />
            <Route path="insurers" element={<InsurersPage />} />
            <Route
              path="service-providers"
              element={<ServiceProvidersPage />}
            />
            <Route path="module-registry" element={<ModuleRegistryPage />} />
            <Route
              path="module-registry/new"
              element={<ModuleFormPage />}
            />
            <Route
              path="module-registry/:moduleId"
              element={<ModuleRecordPage />}
            />
            <Route
              path="module-registry/:moduleId/edit"
              element={<ModuleFormPage />}
            />
            <Route
              path="document-templates"
              element={<DocumentTemplatesPage />}
            />
            <Route path="email-templates" element={<EmailTemplatesPage />} />
            <Route
              path="email-templates/new"
              element={<EmailTemplateFormPage />}
            />
            <Route
              path="email-templates/:templateId"
              element={<EmailEditorPage />}
            />
            <Route path="sms-templates" element={<SmsTemplatesPage />} />
            <Route
              path="sms-templates/new"
              element={<SmsTemplateFormPage />}
            />
            <Route
              path="sms-templates/:templateId"
              element={<SmsEditorPage />}
            />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="access-users" element={<AccessUsersPage />} />
            <Route path="access-roles" element={<AccessRolesPage />} />
            <Route
              path="platform-settings"
              element={<PlatformSettingsPage />}
            />
            <Route
              path="platform-settings/:section"
              element={<PlatformSettingsPage />}
            />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="my-account" element={<MyAccountPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Gate for the authenticated shell — bounces to /auth/login (remembering where the
   user was headed) when there's no live session. */
function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* New full-screen auth pages (pre-shell, no auth gate). The old /login
         above is kept as-is for backup. */}
      <Route path="/auth/login" element={<AuthLoginPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/mfa" element={<MfaEnrollPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route element={<RequireAuth />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  )
}

export default App
