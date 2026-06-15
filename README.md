# Ginja AI — Platform Console

The internal ops console for onboarding & managing insurer **tenant accounts** (payers):
tenant lifecycle, entitlements, billing, configuration libraries and platform policies.

Built with **Vite 7 · React 19 · TypeScript · Tailwind 4 · shadcn/ui · React Router 7**.
All data is currently mock (no backend wired).

> **Designing or adding a screen?** Read **[DESIGN-GUIDE.md](./DESIGN-GUIDE.md)** first — the
> design source of truth (fonts, type, colour, spacing, shape, motion, components). Build
> details live with the code: tokens in `src/index.css`, console widgets in
> `src/components/console/`, and conventions in `CLAUDE.md`.

## Design source of truth

`Ginja Console-v2.html` (repo root) is a self-contained bundle of
**every** console screen + its mock data. Open it in a browser; it is the spec to match
when implementing a screen.

## Getting started

```bash
bun install      # or npm / pnpm
bun run dev      # Vite dev server
bun run build    # tsc -b && vite build (type-check + bundle)
bun run lint     # ESLint
bun run typecheck
bun run format   # Prettier
```

## Routes

| Path | Screen | Status |
|---|---|---|
| `/` | Dashboard | ✅ |
| `/tenant-accounts` | Tenant accounts (list + drafts drawer) | ✅ |
| `/tenant-accounts/onboard` | Onboard tenant (7-section wizard) | ✅ |
| `/approvals` | Approvals | ⬜ coming soon |
| `/module-registry` | Module registry | ⬜ coming soon |
| `/document-templates` | Document templates | ⬜ coming soon |
| `/email-templates` | Email & SMS templates | ⬜ coming soon |
| `/pricing` | Pricing & plans | ⬜ coming soon |
| `/platform-settings` | Platform settings | ⬜ coming soon |
| `/audit-log` | Audit log | ⬜ coming soon |

The remaining screens are specced in the hi-fi bundle (`Ginja Console-v2.html`) — match it
when implementing one.

## Structure

```
src/
  App.tsx                      # shell: sidebar + header + routes + breadcrumb labels
  components/
    app-sidebar.tsx            # grouped nav (Overview / Tenant mgmt / Config / Platform)
    console/                   # design-system widgets (Panel, StatusPill, KpiStat, …)
    ui/                        # vendored shadcn primitives — treat as vendored
  contexts/                    # brand (white-label) + access (current user) providers
  lib/
    console-data.ts            # all typed mock data
    console-format.ts          # formatting + validation + derived-status helpers
    utils.ts                   # cn()
  pages/
    platform-dashboard/        # Dashboard
    tenant-accounts/           # list + components/ (drafts) + onboard/ (wizard + sections/)
    coming-soon/               # placeholder for unbuilt nav items
  index.css                    # design tokens (iris/emerald, Geist) + @theme mapping
```

## Theming

The iris/indigo + emerald palette and Geist fonts are defined as tokens in `src/index.css`
and driven at runtime by `BrandProvider`. Components read semantic tokens only (never
hardcoded colors), so white-label and dark mode work everywhere. The palette and semantic
roles are documented in [DESIGN-GUIDE.md §3](./DESIGN-GUIDE.md#3-colour); the token
definitions live in `src/index.css`.
# Ginja-Internal-platform-console
