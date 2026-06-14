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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAccess } from "@/contexts/access-context"
import {
  CONSOLE_ROLES,
  CONSOLE_ROLE_KEYS,
  type ConsoleRoleKey,
} from "@/lib/console-data"
import { ComingSoonPage } from "@/pages/coming-soon"
import { ConsoleDashboardPage } from "@/pages/platform-dashboard"
import { ApprovalsPage } from "@/pages/approvals"
import { TenantAccountsPage } from "@/pages/tenant-accounts"
import { OnboardTenantPage } from "@/pages/tenant-accounts/onboard"
import { TenantProvisioningPage } from "@/pages/tenant-provisioning"

const BREADCRUMB_LABELS: Record<string, string> = {
  "tenant-accounts": "Tenant accounts",
  onboard: "Onboard tenant",
  approvals: "Approvals",
  "tenant-provisioning": "Tenant provisioning",
  "module-registry": "Module registry",
  "document-templates": "Document templates",
  "email-templates": "Email & SMS templates",
  pricing: "Pricing & plans",
  "access-users": "Users",
  "access-roles": "Roles & permissions",
  "platform-settings": "Platform settings",
  "audit-log": "Audit log",
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

function RoleSwitcher() {
  const { roleKey, setRoleKey, role } = useAccess()
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground lg:inline">
        Viewing as
      </span>
      <Select
        value={roleKey}
        onValueChange={(v) => setRoleKey(v as ConsoleRoleKey)}
      >
        <SelectTrigger className="h-8 gap-2" aria-label="Acting role (demo)">
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-[9px] font-bold text-primary">
            {role.initials}
          </span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {CONSOLE_ROLE_KEYS.map((k) => (
            <SelectItem key={k} value={k}>
              {CONSOLE_ROLES[k].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher />
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
