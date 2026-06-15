# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this is

The **Ginja AI Platform Console** — the internal ops platform for onboarding & managing
insurer **tenant accounts** (payers): tenant lifecycle, entitlements, billing,
configuration libraries and platform policies. Single-page React app. **All data is mock**
(in `src/lib/console-data.ts`) — there is no backend, API client, or data fetching wired.

> **Before building or changing a screen, read [DESIGN-GUIDE.md](./DESIGN-GUIDE.md) — it is
> the design source of truth (the visual language: fonts, type, colour, spacing, shape, motion,
> components).** How it's *built* lives with the code: tokens in `src/index.css`, design-system
> widgets in `src/components/console/`, and the conventions in the Architecture section below.
> `Ginja Console-v2.html` at the repo root is the hi-fi reference bundle (a self-contained
> bundle of every screen + its data). `README.md` is the entry-point overview.
> **[API_GUIDE.md](./API_GUIDE.md)** documents the real backend REST contract (base
> `http://localhost:8082/api/v1`, **snake_case** JSON, a `{status,success,result,error_details}`
> envelope, JWT `roles`/`modules`/`permissions` claims, payer-onboarding lifecycle). No HTTP layer
> is wired yet — but match its field names, role names, and state machines when wiring one.

## Commands

Package manager is **bun** (`bun.lock`), but `npm`/`pnpm` also work.

- `bun run dev` — Vite dev server
- `bun run build` — `tsc -b && vite build` (type-check + bundle)
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — ESLint
- `bun run format` — Prettier write for `**/*.{ts,tsx}`
- `bun run preview` — serve the production build

Add shadcn components with `npx shadcn@latest add <name>` — they land in
`src/components/ui/` per `components.json` (style: `radix-nova`, base color: `neutral`,
icons: `lucide`).

## Stack

Vite 7 · React 19 · TypeScript 5.9 · TailwindCSS 4 (`@tailwindcss/vite`) · shadcn/ui (Radix
primitives) · React Router 7 · sonner (toasts) · next-themes (dark mode) · lucide-react ·
date-fns · cmdk.

There is **no** TanStack Query, react-hook-form, zod, or HTTP layer — don't assume them or
add them without being asked. Wizard/form state is plain React `useState` + a `set(key,
value)` helper (see `src/pages/tenant-accounts/onboard/use-onboarding-form.ts`). No test
runner is configured.

## Architecture

### Provider stack (`src/main.tsx`)

Order matters: `BrowserRouter` → `ThemeProvider` → `BrandProvider` → `AccessProvider` →
`TooltipProvider` → `App` + `Toaster`.

- **`BrandProvider`** (`src/contexts/brand-context.tsx`) drives white-labeling by mutating
  `document.documentElement` CSS variables (`--primary`, `--ring`, `--accent`, …) from
  `DEFAULT_BRAND.colors`. **Colors are HSL channels** (e.g. `"240 61% 60%"`) to match the
  token contract — never inject `oklch`/hex here (it becomes `hsl(oklch(...))` and breaks).
- **`AccessProvider`** (`src/contexts/access-context.tsx`) is the client-side RBAC layer.
  `useAccess()` returns `{ role, roleKey, setRoleKey, user, hasPermission(permId),
  isReadonly(permId) }`. Roles are defined in `CONSOLE_ROLES` (`src/lib/console-data.ts`) —
  each has `perms` (`["*"]` or `view:<permId>`), `readonly` permIds, and
  `maker`/`checker`/`techReviewer` separation-of-duties flags. The acting role is switchable
  from the sidebar footer ("Viewing as", demo only) and persisted to `localStorage`
  (`ginja:roleKey`). **Gate UI with `hasPermission`/`isReadonly` by `permId`**, never by role
  name. `permId`s match nav items (`dashboard`, `payers`, `approvals`, `provisioning`,
  `registry`, `pricing`, `access-users`, `audit`, …) and mirror the backend's role/permission
  model in API_GUIDE.md.

### Routing and shell (`src/App.tsx`)

Top-level `<Routes>` splits `/login` (`LoginPage`, no shell) from `/*` → `AppShell`. The
shell is `SidebarProvider` + `AppSidebar` + header (sidebar trigger, `GlobalSearch`, theme
toggle, bell) + the inner `<Routes>`.

Routes mirror `src/pages/<area>/index.tsx` (list) and `src/pages/<area>/<step>/` (sub-steps,
e.g. the onboarding wizard under `tenant-accounts/onboard/`). Built: dashboard,
`tenant-accounts` (+ `/onboard`), `approvals`, `tenant-provisioning`. Unbuilt nav items route
to `ComingSoonPage`. Catch-all `*` redirects to `/`.

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
  `{ title, url, icon, permId, exact?, count? }`. **`permId` gates visibility** — the sidebar
  only renders items the acting role's `hasPermission(permId)` passes (and hides empty groups).
  Add new top-level pages here, and add the matching route in `App.tsx`, a `ROUTE_NODES` entry,
  and (if needed) the `permId` to roles in `CONSOLE_ROLES`.

### Styling

Tailwind 4. Design tokens are CSS custom properties in `src/index.css` as **HSL channels**
(iris/indigo primary + emerald brand, Geist font), exposed to Tailwind via the
`@theme inline` block wrapped in `hsl(var(--token))`. **Read semantic tokens only — never
hardcode hex/oklch in components** (this is what keeps white-label + dark mode working). See
DESIGN-GUIDE.md §3 for the palette + status→tone mappings; the tokens themselves are defined
in `src/index.css`. Prettier sorts class lists
(`prettier-plugin-tailwindcss`, with `cn`/`cva` registered).

### Build chunking

`vite.config.ts` manually splits vendor chunks (`vendor-react`, `vendor-radix`,
`vendor-ui`, `vendor-dates`). When adding a heavy dependency, consider which chunk it
belongs to.

### Data / mocks

`src/lib/console-data.ts` holds all typed mock data (`PAYERS`, `REGISTRY`, `APPROVALS`,
`AUDIT_LOG`, `ONB_*`, `WIZ_STEPS`, `BASE_FORM`, …). `src/lib/console-format.ts` holds pure
helpers (`fmtUSD`, `fmtNum`, `initials2`, `emailOk`, `findDuplicates`, `sectionStatuses`).
When a new screen needs data, port it from the standalone HTML's data block into these
files. Path alias: `@/* → src/*`.
