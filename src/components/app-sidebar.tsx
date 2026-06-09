import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Building2Icon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  FileTextIcon,
  GalleryVerticalEndIcon,
  HistoryIcon,
  LayersIcon,
  type LucideIcon,
  LayoutDashboardIcon,
  MailIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAccess } from "@/contexts/access-context"
import { useBrand } from "@/contexts/brand-context"

type NavItem = {
  title: string
  url: string
  icon: LucideIcon
  exact?: boolean
  count?: number
}

type NavGroup = { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboardIcon, exact: true },
    ],
  },
  {
    label: "Tenant management",
    items: [
      {
        title: "Tenant accounts",
        url: "/tenant-accounts",
        icon: Building2Icon,
        count: 24,
      },
      {
        title: "Approvals",
        url: "/approvals",
        icon: ShieldCheckIcon,
        count: 5,
      },
    ],
  },
  {
    label: "Configuration library",
    items: [
      { title: "Module registry", url: "/module-registry", icon: LayersIcon },
      {
        title: "Document templates",
        url: "/document-templates",
        icon: FileTextIcon,
      },
      {
        title: "Email & SMS templates",
        url: "/email-templates",
        icon: MailIcon,
      },
      { title: "Pricing & plans", url: "/pricing", icon: CreditCardIcon },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "Platform settings",
        url: "/platform-settings",
        icon: SettingsIcon,
      },
      { title: "Audit log", url: "/audit-log", icon: HistoryIcon },
    ],
  },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function isActivePath(pathname: string, url: string, exact?: boolean) {
  if (exact) return pathname === url
  return pathname === url || pathname.startsWith(`${url}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const { brand } = useBrand()
  const { user } = useAccess()
  const [failedLogoUrl, setFailedLogoUrl] = React.useState<string | null>(null)
  const showLogo = Boolean(brand.logoUrl && failedLogoUrl !== brand.logoUrl)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {showLogo ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.brandName}
                        className="size-8 rounded-md object-contain"
                        referrerPolicy="no-referrer"
                        onError={() => setFailedLogoUrl(brand.logoUrl ?? null)}
                      />
                    ) : (
                      <GalleryVerticalEndIcon />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {brand.brandName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {brand.tagline}
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspace
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-3 p-2">
                    <div className="flex size-7 items-center justify-center rounded-md border bg-muted">
                      <GalleryVerticalEndIcon />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm">{brand.brandName}</span>
                      <span className="text-xs text-muted-foreground">
                        Default workspace
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = isActivePath(
                  location.pathname,
                  item.url,
                  item.exact
                )

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      asChild
                    >
                      <NavLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {typeof item.count === "number" ? (
                      <SidebarMenuBadge>{item.count}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 shrink-0 rounded-lg">
                    <AvatarImage src="" alt={user.fullName} />
                    <AvatarFallback className="rounded-lg">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {user.fullName}
                    </span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src="" alt={user.fullName} />
                      <AvatarFallback className="rounded-lg">
                        {initials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user.fullName}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <UserIcon data-icon="inline-start" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SettingsIcon data-icon="inline-start" />
                    Preferences
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
