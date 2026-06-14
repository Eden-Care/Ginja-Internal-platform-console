# Ginja AI — Platform Console

The internal ops console for onboarding & managing insurer **tenant accounts** (payers):
tenant lifecycle, entitlements, billing, configuration libraries and platform policies.

Built with **Vite 7 · React 19 · TypeScript · Tailwind 4 · shadcn/ui · React Router 7**.
All data is currently mock (no backend wired).

> **Designing or adding a screen?** Read **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** first —
> it covers the tokens, the console widget catalog, page conventions, and a step-by-step
> recipe for building new pages consistently.

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

The roadmap for the remaining screens is in
[DESIGN-SYSTEM.md §7](./DESIGN-SYSTEM.md#7-remaining-pages-roadmap).

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
hardcoded colors), so white-label and dark mode work everywhere. See
[DESIGN-SYSTEM.md §2](./DESIGN-SYSTEM.md#2-theme--tokens).
# Ginja-Internal-platform-console
