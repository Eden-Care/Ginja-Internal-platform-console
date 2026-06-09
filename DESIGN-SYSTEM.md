# Ginja Platform Console — Design System & Contributor Guide

This is the single reference for keeping the **Ginja AI Platform Console** visually and
structurally consistent. Read this before building a new screen.

The console is the internal ops platform for onboarding & managing insurer **tenant
accounts** (payers). Everything is currently mock data — there is no backend wired.

---

## 1. Design source of truth

The hi-fi design lives in one file at the repo root:

```
Ginja Console - Hi-fi Screens (standalone).html
```

Open it directly in a browser. It is a self-contained React (Babel-standalone) bundle of
**every** console screen and its mock data. When building a new page, this file is the
spec — match its layout, copy, fields, and data shapes.

Screens bundled inside it (component → what it is):

| Component in the HTML | Screen | Status in `src/` |
|---|---|---|
| `ConsoleDashboard` | Dashboard | ✅ built |
| `PayersDirectory` | Tenant accounts (list) | ✅ built |
| `Onboarding` | Onboard tenant (wizard) | ✅ built |
| `PayerRecord` | Tenant/payer detail record | ⬜ coming soon |
| `ApprovalsQueue` / `ApprovalReview` | Approvals queue + review | ⬜ coming soon |
| `ModuleRegistry` | Module registry | ⬜ coming soon |
| `DocTemplates` | Document templates | ⬜ coming soon |
| `EmailTemplates` | Email & SMS templates | ⬜ coming soon |
| `Pricing` | Pricing & plans | ⬜ coming soon |
| `Settings` | Platform settings | ⬜ coming soon |
| `AuditLog` | Audit log | ⬜ coming soon |

> The console's own top bar / role switcher / ⌘K palette from the HTML are intentionally
> **not** reproduced — we use the app's existing shadcn sidebar + header shell instead.

---

## 2. Theme & tokens

**Palette:** iris/indigo **primary** (`#5B5BD6`) + emerald **brand/accent** (`#10B981`)
on a near-white slate. **Font:** Geist (sans) + Geist Mono.

### How tokens work (read this — it's load-bearing)

Tokens are defined in `src/index.css` as **HSL channels** (e.g. `--primary: 240 61% 60%`)
and exposed to Tailwind through the `@theme inline` block wrapped in `hsl(...)`:

```css
--color-primary: hsl(var(--primary));   /* → bg-primary, text-primary, ring-primary */
```

This is the standard shadcn-with-HSL contract. Opacity modifiers work via color-mix
(`bg-primary/10`, `bg-brand/12`). **Never** store an `oklch(...)` or hex value in a token
that's consumed through `hsl(var(--…))` — it produces `hsl(oklch(...))` and breaks.

### The rule: use semantic tokens, never hardcode colors

Every console color resolves through a semantic token so white-labeling and dark mode work
for free. Do **not** write hex/oklch in components.

| Token (Tailwind utility) | Use for |
|---|---|
| `bg-primary` / `text-primary` | iris — buttons, active nav, focus, links, selected states |
| `bg-brand` / `text-brand` | emerald — positive/“Ginja green” accents, completed progress, submit |
| `bg-card`, `bg-background`, `bg-muted`, `text-muted-foreground` | surfaces & secondary text |
| `bg-secondary` | neutral chips (`Tagpill`) |
| `success` / `warning` / `info` / `destructive` (+ each `-foreground`) | solid status colors |
| `*-subtle` + `*-subtle-foreground` (success/warning/info/destructive) | tinted status backgrounds (pills, badges, notes) |
| `border`, `input`, `ring` | hairlines, field borders, focus rings |
| `sidebar*` | the nav rail (iris-tinted hover/active) |

Numbers & IDs use mono + tabular figures: `className="mono"` or `font-mono tabular-nums`.
Small uppercase labels use the `eyebrow` class.

### Status → tone mappings (keep consistent)

- **Tenant status pill** (`StatusPill`): `Active → success-subtle`, `Draft → muted`,
  `Suspended`/`Pending* → warning-subtle`, `Retired → destructive-subtle`. LED dot is `bg-current`.
- **Onboarding segments** (`SegTrack`): `complete → success`, `progress → warning`,
  `empty/todo → muted-foreground/20`.

### White-label

Theming is driven by `BrandProvider` (`src/contexts/brand-context.tsx`), which sets
`--primary`, `--ring`, `--accent`, etc. at runtime from `DEFAULT_BRAND.colors` (HSL
channels). To re-theme the whole console, change those — every component follows because
it reads tokens. (The static `[data-tenant="nimbus"]` block in `index.css` is a CSS demo
and is partially shadowed by BrandProvider's inline values.)

---

## 3. Console widget catalog (`src/components/console/`)

Compose these before reaching for raw markup. All are token-based and white-label safe.

| Component | Purpose / props |
|---|---|
| `Panel`, `PanelHead`, `PanelBody` | The standard bordered surface. `PanelHead({ icon, title, action })`, `PanelBody` = padded body. |
| `ConsolePageHeader` | Page header: `{ crumbs?: string[], title, sub?, actions? }`. |
| `KpiStat` / `KpiStatInline` | Stat cards. `{ icon, label, value, foot, tone?: "b"\|"p"\|"w"\|"e"\|"" }`. |
| `Donut` | Conic-gradient ring. `{ segments: {k,n,color}[], total, centerLabel? }` — `color` is `"hsl(var(--brand))"` etc. |
| `HBarList` | Horizontal bars. `{ bars: {label,n,pct}[] }`. |
| `StatusPill` | Tenant lifecycle pill with LED dot. `{ status }`. |
| `SegTrack`, `SegLegend` | 6-segment onboarding progress + its legend. `SegTrack({ sections })`. |
| `Tagpill` | Rounded secondary chip (inline metadata). |
| `MiniBadge` | Small status badge w/ dot. `{ tone: "success"\|"warning"\|"neutral"\|"info" }`. |
| `Note` | Callout. `{ tone: "info"\|"warn"\|"ok"\|"err", icon }`. |
| `AvatarInitials`, `MiniAvatar`, `AvatarStack` | Square tenant avatar / round owner avatar / overlapping owner stack. |
| `AssigneePicker` | "Section owner" popover. `{ value, onChange }` (onboarding team). |
| `Glyph` | Maps a design icon name (module/pricing) → a lucide icon. `{ name }`. |
| **Form atoms** (`form-atoms.tsx`) | `Field` (label/required/optional/hint), `FormSection`, `FormGrid` (2-col), `Seg` (segmented control), `RadioCards`, `ConsoleSelect`. |

For everything else use the vendored **shadcn** primitives in `src/components/ui/`
(`Button`, `Table`, `Input`, `Select`, `Sheet`, `Popover`, `Dialog`, …). Treat those as
vendored — don't fork them per-page. Button has no `primary`/`brand` variant: `default` is
primary; for the emerald submit button use
`className="bg-brand text-brand-foreground hover:bg-brand/90"`.

---

## 4. Layout, routing & shell conventions

- **Shell** (`src/App.tsx`): `SidebarProvider` + `<AppSidebar/>` + header (sidebar trigger,
  breadcrumb, theme toggle, bell). Pages render inside `<main>` via `<Routes>`.
- **Sidebar** (`src/components/app-sidebar.tsx`): nav lives in `navGroups`
  (Overview / Tenant management / Configuration library / Platform). Each item:
  `{ title, url, icon, exact?, count? }`. Counts render as `SidebarMenuBadge`.
- **Breadcrumb**: derived from the URL via `BREADCRUMB_LABELS` in `App.tsx`. Add an entry
  for any new segment that needs a friendly label.
- **Routes**: pages live at `src/pages/<area>/index.tsx`; sub-steps nest under
  `src/pages/<area>/<step>/`. Not-yet-built nav items route to `ComingSoonPage`.
- **Page shape**: `ConsolePageHeader` at top, then `Panel`/`Card` sections in a
  `flex flex-col gap-4/5` column.

---

## 5. Data conventions

- All mock data + types are in **`src/lib/console-data.ts`** (e.g. `PAYERS`, `REGISTRY`,
  `APPROVALS`, `AUDIT_LOG`, `ONB_*`, `WIZ_STEPS`, `BASE_FORM`). It is self-contained —
  never import from `ginja-2026/`.
- Pure helpers (formatting, validation, derived status) live in
  **`src/lib/console-format.ts`** (`fmtUSD`, `fmtNum`, `initials2`, `emailOk`,
  `findDuplicates`, `sectionStatuses`).
- When a new page needs data that isn't ported yet, copy it from the data block inside the
  standalone HTML and add typed exports here. Still-needed datasets: `SECONDARY_TENANTS`,
  `DOC_TEMPLATES`, `EMAIL_TEMPLATES`, `EMAIL_VARS`, `TIERS`, `C_ROLES`.

---

## 6. How to build a new page (recipe)

1. **Read the spec** — open the standalone HTML, find the screen's component, note layout,
   copy, fields, columns, and data shapes.
2. **Port data** — add any missing arrays/types to `console-data.ts` and helpers to
   `console-format.ts`.
3. **Build** — `src/pages/<area>/index.tsx`. Compose console widgets + shadcn ui. Semantic
   tokens only; `mono` for numbers/IDs; reuse `Panel`, `ConsolePageHeader`, `StatusPill`,
   `Tagpill`, `MiniBadge`, `Note`, etc.
4. **Register** — in `App.tsx` replace the screen's `ComingSoonPage` route with the real
   page; confirm its `BREADCRUMB_LABELS` entry; the sidebar item already points to it.
5. **Verify** — `bun run typecheck && bun run lint && bun run build`, then run `bun run dev`
   and eyeball against the HTML.

---

## 7. Remaining-pages roadmap

Each row: the screen, its component in the standalone HTML, the data it needs, and the main
pieces to reuse.

| Screen | HTML component | Data | Reuse |
|---|---|---|---|
| **Approvals** (queue + review) | `ApprovalsQueue`, `ApprovalReview` | `APPROVALS` ✅ | `Panel`, `Table`, `AvatarInitials`, `MiniBadge`, `Note` |
| **Tenant record** (`/tenant-accounts/:id`) | `PayerRecord` (+ `SuspendDialog`, `RetireDialog`) | `PAYERS` ✅, `SECONDARY_TENANTS` ⬜ | `Tabs`, `Panel`, `StatusPill`, `Dialog`, `Seg` |
| **Module registry** | `ModuleRegistry` | `REGISTRY` ✅ | `Panel`, `Glyph`, `MiniBadge`, cards/table |
| **Document templates** | `DocTemplates` | `DOC_TEMPLATES` ⬜ | `Table`, `Tagpill`, `MiniBadge` |
| **Email & SMS templates** | `EmailTemplates` | `EMAIL_TEMPLATES`, `EMAIL_VARS` ⬜ | `Table`, `Tagpill`, `Textarea`, split preview |
| **Pricing & plans** | `Pricing` | `PRICING_MODELS` ✅, `TIERS` ⬜, `BILLING_FREQ` ✅ | model cards, `Table`, `Seg` |
| **Platform settings** | `Settings` | `C_ROLES` ⬜ | `Panel`, `Switch`, `RadioCards`, `Field` |
| **Audit log** | `AuditLog` | `AUDIT_LOG` ✅ | timeline, `Table`, `MiniBadge` (by `kind`) |

Suggested order: **Approvals** and **Tenant record** first (both are linked from screens
that already exist), then the configuration-library pages, then settings/audit.

---

## 8. Gotchas

- **Token format**: HSL channels + `hsl()` wrap in `@theme` (see §2). Don't mix in oklch/hex.
- **BrandProvider pins `--primary`** inline at mount — white-label via `setBrand`, not the
  `[data-tenant]` CSS hook.
- **Fonts**: Geist via `@fontsource-variable/geist` (+ `-mono`); `--font-mono` must stay
  defined or IDs/numbers fall back.
- **Don't fork shadcn primitives** in `src/components/ui/` for one page — extend via
  `className` or add a `console/` widget.
