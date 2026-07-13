# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The **Ginja AI Platform Console** — the internal ops platform for onboarding & managing
insurer **tenant accounts** (payers): tenant lifecycle, entitlements, billing,
configuration libraries and platform policies. Single-page React app.

A **real REST backend is wired** (axios + TanStack Query + JWT auth). Domains are being
migrated off mocks **page-by-page** under `src/features/`; pages with no backend endpoint
still read typed mocks from `src/lib/console-data.ts` or route to `ComingSoonPage`. So the
codebase is a mix: assume nothing is live until you find a `src/features/<domain>/` folder for
it.

> **Before building or changing a screen, read [DESIGN-GUIDE.md](./DESIGN-GUIDE.md) — it is
> the design source of truth (the visual language: fonts, type, colour, spacing, shape, motion,
> components).** How it's _built_ lives with the code: tokens in `src/index.css`, design-system
> widgets in `src/components/console/`, and the conventions in the Architecture section below.
> `Ginja Console-v4.html` at the repo root is the hi-fi reference bundle (a self-contained
> bundle of every screen + its data). `README.md` is the entry-point overview.
> **[API_GUIDE.md](./API_GUIDE.md)** documents the backend REST contract (base path
> `/internal-platform/api/v1`, **snake_case** JSON, a `{status,success,result,error_details}`
> envelope, JWT `roles`/`modules`/`permissions` claims, payer-onboarding lifecycle).
> Match its field names, role names, and state machines when wiring a new domain.
> The maintained **Postman collection is the authoritative contract**; `API_REFERENCE.md`
> can lag behind it.

Login cred for testing

Admin: admin@ginja.ai/Admin@12345

## First-launch scope (READ THIS)

Some screens are **fully built but intentionally hidden for the first launch** — they are
NOT descoped or broken, just not shown in v1. **Do not delete their code, routes, or
feature folders.** They stay reachable directly (deep links, global search, in-app flows);
only the sidebar nav entry is suppressed.

- **The entire "Tenant management" nav group is hidden for the first launch** — all three
  items: **Tenant accounts** (`/tenant-accounts`, page + onboarding wizard +
  `src/features/payers`), **Approvals** (`/approvals`) and **Tenant provisioning**
  (`/tenant-provisioning`). Each item in that group in `navGroups`
  (`src/components/app-sidebar.tsx`) carries `hidden: true`; the sidebar filter skips items
  flagged `hidden`, and because the group then has no visible items its "Tenant management"
  label auto-drops too. **To bring the group back, remove the `hidden: true` flags from those
  items** — nothing else needs to change.

When you need to hide (not remove) another built screen from the nav, add `hidden: true` to
its `navGroups` item and record it here — never silently delete the entry.

## Commands

Package manager is **bun** (`bun.lock`), but `npm`/`pnpm` also work.

- `bun run dev` — Vite dev server (the dev proxy forwards `/internal-platform` to the real
  backend, so `dev` hits the live API — see the API layer notes below)
- `bun run build` — `tsc -b && vite build` (type-check + bundle)
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — ESLint
- `bun run format` — Prettier write for `**/*.{ts,tsx}`
- `bun run preview` — serve the production build

There is **no test runner** configured.

Add shadcn components with `npx shadcn@latest add <name>` — they land in
`src/components/ui/` per `components.json` (style: `radix-nova`, base color: `neutral`,
icons: `lucide`).

## Stack

Vite 7 · React 19 · TypeScript 5.9 · TailwindCSS 4 (`@tailwindcss/vite`) · shadcn/ui (Radix
primitives) · React Router 7 · **TanStack Query 5** · **axios** · sonner (toasts) ·
next-themes (dark mode) · lucide-react · date-fns · cmdk.

There is **no** react-hook-form or zod — don't add them without being asked. Wizard/form
state is plain React `useState` + a `set(key, value)` helper (see
`src/pages/tenant-accounts/onboard/use-onboarding-form.ts`).

## Architecture

### Provider stack (`src/main.tsx`)

Order matters: `BrowserRouter` → `QueryClientProvider` → `ThemeProvider` → `BrandProvider`
→ `AuthProvider` → `AccessProvider` → `TooltipProvider` → `App` + `Toaster`. (`AccessProvider`
sits **inside** `AuthProvider` because it derives the acting role from the live session.)

- **`AuthProvider`** (`src/contexts/auth-context.tsx`) owns the logged-in `Session`.
  `useAuth()` returns `{ session, isAuthenticated, applySession(session, remember), logout }`.
  The session is persisted by `src/lib/auth-storage.ts` — `localStorage` when "keep me signed
  in", else `sessionStorage` — and that storage is the single source of truth the axios client
  reads the JWT from. A 401 from any non-auth call clears the session and bounces to `/login`
  (the response interceptor calls a handler `AuthProvider` registers via
  `setUnauthorizedHandler`).
- **`BrandProvider`** (`src/contexts/brand-context.tsx`) drives white-labeling by mutating
  `document.documentElement` CSS variables (`--primary`, `--ring`, `--accent`, …) from
  `DEFAULT_BRAND.colors`. **Colors are HSL channels** (e.g. `"240 61% 60%"`) to match the
  token contract — never inject `oklch`/hex here (it becomes `hsl(oklch(...))` and breaks).
- **`AccessProvider`** (`src/contexts/access-context.tsx`) is the client-side RBAC layer.
  `useAccess()` returns `{ role, roleKey, user, isLoading, hasPermission(permId),
isReadonly(permId) }`. The acting role is **derived from the JWT** —
  `roleKeyFromApiRoles(session?.roles)` maps the backend role names to a `ConsoleRoleKey`;
  there is **no demo role switcher** anymore. Roles, their `perms`/`readonly` permIds, and the
  helpers `cHasPerm`/`cReadonly` live in `CONSOLE_ROLES` (`src/lib/console-data.ts`). **Gate UI
  with `hasPermission`/`isReadonly` by `permId`**, never by role name. `permId`s match nav
  items (`dashboard`, `payers`, `approvals`, `provisioning`, `registry`, `pricing`,
  `access-users`, `audit`, …) and mirror the backend's role/permission model in API_GUIDE.md.

### API / data layer (`src/lib/api/` + `src/features/`)

This is the part most likely to be missing from older mental models — it was added after the
initial mock-only build.

- **`src/lib/api/client.ts`** — the single configured axios instance. A **request
  interceptor** attaches `Authorization: Bearer <jwt>` from `auth-storage`. A **response
  interceptor** unwraps the `{ status, success, result, error_details }` envelope so callers
  receive `result` directly, throws a normalised **`ApiError`** (carrying `status` + the
  envelope message) on failure, and triggers logout on a 401. Use the typed helpers
  `apiGet/apiPost/apiPut/apiPatch/apiDelete` and **`apiUpload`** (multipart — clears
  `Content-Type` so the browser sets the boundary; document upload uses this). Base URL is
  `/internal-platform/api/v1` in dev (proxied), the prod host otherwise; override with
  `VITE_API_BASE_URL`.
- **`src/lib/api/query-client.ts`** — the shared `QueryClient` (retry 1, no refetch-on-focus,
  30s stale).
- **`src/lib/api/paged.ts`** — `toPaged(dto, map)` converts a Spring Data page
  (`{ content, page, size, total_elements, total_pages }`) into a camelCased `Paged<T>`. Only
  some lists (members, audit logs) are paged; most return plain arrays.

**Feature-folder pattern** — wire each domain under `src/features/<domain>/`, mirroring
`src/features/auth/`:

- `types.ts` — snake_case `*DTO` types + camelCase client types + `toX()` mappers between them.
- `api.ts` — thin service functions over the `api*` helpers, returning **mapped client types**
  (never raw DTOs to the UI).
- `queries.ts` — query-key factories (e.g. `payerKeys.all`, `.lists()`, `.detail(id)`).
- `use-*.ts` — TanStack Query hooks. Queries `useQuery`; mutations `useMutation` and
  `invalidateQueries({ queryKey: <keys>.all })` on success. **Mutations do not toast/navigate**
  — the page owns all UX (loading, error, toast, navigation).

**Pages import only hooks, never axios.** When adding a screen backed by an endpoint, build the
feature folder first, then consume its hooks from the page.

Wired so far: `auth`, `access` (roles + members/users), `audit`, `payers` (+ onboarding write
flow), `pricing`, `provisioning`, `registry`, `settings`. Pages with no backend (dashboard,
document/email templates, full module-registry CRUD, parts of platform-settings) stay on mock
or `ComingSoonPage`. **Rule from the maintainer: only wire where the API and existing UI line
up; where there's an impedance mismatch, stop and flag it rather than force a lossy/fabricated
mapping, and don't silently delete API-unsupported UI** — keep it and mark the gap.

### Routing and shell (`src/App.tsx`)

Top-level `<Routes>` splits `/login` (`LoginPage`, no shell) from everything else, which is
wrapped by a **`RequireAuth`** gate (redirects to `/login`, remembering `location` in
`state.from`, when `!isAuthenticated`) → `AppShell`. The shell is `SidebarProvider` +
`AppSidebar` + header (sidebar trigger, `GlobalSearch`, theme toggle, bell) + the inner
`<Routes>`.

Routes mirror `src/pages/<area>/index.tsx` (list) and `src/pages/<area>/<step>/` (sub-steps,
e.g. the onboarding wizard under `tenant-accounts/onboard/`). Built routes: dashboard,
`tenant-accounts` (+ `/onboard`), `approvals`, `tenant-provisioning`, `module-registry`,
`document-templates`, `email-templates`, `pricing`, `access-users`, `access-roles`,
`platform-settings`, `audit-log`. Remaining nav items route to `ComingSoonPage`. Catch-all `*`
redirects to `/`.

**Breadcrumbs** are NOT rendered in the header — pages render their own from
`src/lib/navigation.ts`: `ROUTE_NODES` declares each route's `label` + optional `parent`, and
`getBreadcrumbTrail(pathname)` walks the parent chain (top-level pages get an empty trail). Add
a node there when introducing a route with a parent.

### Components

- `src/components/ui/` — vendored shadcn primitives; treat as vendored. Don't fork them for
  one page (extend via `className`).
- `src/components/console/` — the **design-system widgets** (Panel, ConsolePageHeader,
  StatusPill, KpiStat, Donut, SegTrack, HbarList, Tagpill, MiniBadge (both in `tagpill.tsx`),
  Note, AvatarInitials, AssigneePicker, Glyph, Breadcrumbs, form atoms). **Compose these**
  instead of building new markup.
- `src/components/common/` — generic app building blocks for list/table screens:
  `custom-search`, `custom-pagination`, `filter-group`, `date-picker`, `date-range-picker`,
  `date-filter-group`, `breadcrumb`, `loading`. Reach for these before hand-rolling.
- `src/components/global-search.tsx` — the cmdk palette mounted in the header.
- `src/components/app-sidebar.tsx` — nav lives in `navGroups` (Overview / Tenant management /
  Configuration library / Access & security / Platform), each item
  `{ title, url, icon, permId, exact?, count?, hidden? }`. **`permId` gates visibility** — the
  sidebar only renders items the acting role's `hasPermission(permId)` passes (and hides empty
  groups). **`hidden: true` suppresses a built item from the nav without removing it** (route +
  page stay live and reachable); this is how the whole **Tenant management** group (Tenant
  accounts, Approvals, Tenant provisioning) is kept off the v1 nav — see "First-launch scope"
  above. Add new top-level pages here, and add the matching route in
  `App.tsx`, a `ROUTE_NODES` entry, and (if needed) the `permId` to roles in `CONSOLE_ROLES`.

### Styling

Tailwind 4. Design tokens are CSS custom properties in `src/index.css` as **HSL channels**
(iris/indigo primary + emerald brand, Geist font), exposed to Tailwind via the
`@theme inline` block wrapped in `hsl(var(--token))`. **Read semantic tokens only — never
hardcode hex/oklch in components** (this is what keeps white-label + dark mode working). See
DESIGN-GUIDE.md §3 for the palette + status→tone mappings; the tokens themselves are defined
in `src/index.css`. Prettier sorts class lists
(`prettier-plugin-tailwindcss`, with `cn`/`cva` registered).

### Build chunking

`vite.config.ts` manually splits vendor chunks (`vendor-react`, `vendor-data`
(react-query + axios), `vendor-radix`, `vendor-ui`, `vendor-dates`). When adding a heavy
dependency, consider which chunk it belongs to. The same file also configures the dev
**proxy** that forwards `/internal-platform` to the API host (keeps the browser same-origin,
avoids CORS).

### Data / mocks

`src/lib/console-data.ts` is large and serves two roles: (1) typed mock data for not-yet-wired
screens (`PAYERS`, `REGISTRY`, `APPROVALS`, `AUDIT_LOG`, `ONB_*`, `WIZ_STEPS`, `BASE_FORM`, …),
and (2) the **RBAC role model** (`CONSOLE_ROLES`, `ConsoleRoleKey`, `roleKeyFromApiRoles`,
`cHasPerm`, `cReadonly`) used by `AccessProvider`. `src/lib/console-format.ts` holds pure
helpers (`fmtUSD`, `fmtNum`, `initials2`, `emailOk`, `findDuplicates`, `sectionStatuses`).
When a screen has a real endpoint, wire it via a `src/features/<domain>/` folder rather than
porting mock data; only fall back to porting from the standalone HTML's data block when there
is no endpoint. Path alias: `@/* → src/*`.
