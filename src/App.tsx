import * as React from "react"
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { BellDotIcon, MoonIcon, SunIcon } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ComingSoonPage } from "@/pages/coming-soon"
import { ConsoleDashboardPage } from "@/pages/platform-dashboard"
import { TenantAccountsPage } from "@/pages/tenant-accounts"
import { OnboardTenantPage } from "@/pages/tenant-accounts/onboard"
import { ModuleRegistryPage } from "@/pages/module-registry"
import { DocumentTemplatesPage } from "@/pages/document-templates"
import { EmailTemplatesPage } from "@/pages/email-templates"
import { PricingPage } from "@/pages/pricing"
import { PlatformSettingsPage } from "@/pages/platform-settings"
import { AuditLogPage } from "@/pages/audit-log"
import { AccessUsersPage } from "@/pages/access/users"
import { AccessRolesPage } from "@/pages/access/roles"

const BREADCRUMB_LABELS: Record<string, string> = {
  "tenant-accounts": "Tenant accounts",
  onboard: "Onboard tenant",
  approvals: "Approvals",
  "module-registry": "Module registry",
  "document-templates": "Document templates",
  "email-templates": "Email & SMS templates",
  pricing: "Pricing & plans",
  "platform-settings": "Platform settings",
  "audit-log": "Audit log",
  "access-users": "Users",
  "access-roles": "Roles & permissions",
}

function formatSegment(segment: string) {
  return (
    BREADCRUMB_LABELS[segment] ??
    segment
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

function AppBreadcrumb() {
  const { pathname } = useLocation()
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = [
    { label: "Dashboard", href: "/" },
    ...segments.map((segment, index) => ({
      label: formatSegment(segment),
      href: `/${segments.slice(0, index + 1).join("/")}`,
    })),
  ]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <React.Fragment key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />
          <div className="ml-auto flex items-center gap-1">
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
            <Route path="approvals" element={<ComingSoonPage />} />
            <Route path="module-registry" element={<ModuleRegistryPage />} />
            <Route
              path="document-templates"
              element={<DocumentTemplatesPage />}
            />
            <Route path="email-templates" element={<EmailTemplatesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route
              path="platform-settings"
              element={<PlatformSettingsPage />}
            />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="access-users" element={<AccessUsersPage />} />
            <Route path="access-roles" element={<AccessRolesPage />} />
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
