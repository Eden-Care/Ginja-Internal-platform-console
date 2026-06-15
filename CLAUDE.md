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
- **`AccessProvider`** (`src/contexts/access-context.tsx`) exposes the current user via
  `useAccess()`.

### Routing and shell (`src/App.tsx`)

Owns the shell: `SidebarProvider` + `AppSidebar` + header (sidebar trigger, breadcrumb,
theme toggle, bell) + `<Routes>`. The breadcrumb derives friendly labels from
`BREADCRUMB_LABELS` keyed by URL segment — add an entry when introducing a new segment.

Routes mirror `src/pages/<area>/index.tsx` (list) and `src/pages/<area>/<step>/` (sub-steps,
e.g. the onboarding wizard under `tenant-accounts/onboard/`). Unbuilt nav items route to
`ComingSoonPage`. Catch-all `*` redirects to `/`.

### Components

- `src/components/ui/` — vendored shadcn primitives; treat as vendored. Don't fork them for
  one page (extend via `className`).
- `src/components/console/` — the **design-system widgets** (Panel, ConsolePageHeader,
  StatusPill, KpiStat, Donut, SegTrack, Tagpill, MiniBadge, Note, AvatarInitials,
  AssigneePicker, Glyph, form atoms). **Compose these** instead of building new markup.
- `src/components/app-sidebar.tsx` — nav lives in `navGroups` (Overview / Tenant management /
  Configuration library / Platform), each item `{ title, url, icon, exact?, count? }`. Add
  new top-level pages there.

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
