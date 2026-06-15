# Ginja AI — Design Guide - sample

The visual language of the **Ginja AI Platform Console**. This is the reference for keeping
every screen, mockup and component **consistent**: the fonts, type scale, colours, spacing,
shape, motion and component styling that define the product's look.

> Use this to design and review. It describes *what things should look like* — not how they're
> built. (Engineers: the tokens live in `src/index.css`, the design-system widgets in
> `src/components/console/`, and the build conventions in `CLAUDE.md`.)

**The feel:** light, calm and confident — a clean, airy, *2026-era* enterprise product. Indigo
as the signature, an emerald "Ginja green" for positive moments, cool near-white surfaces, soft
diffuse shadows, generous spacing. Data-dense but never cramped or noisy.

---

## 1. Design principles

These five rules resolve every trade-off, **in this order**. Ginja is a data-dense,
workflow-heavy platform with many roles — **UX matters more than UI.** A great-looking screen
that confuses is a failure.

1. **Clarity over decoration** — The user always knows where they are, what to do next, and what
   just happened. Signpost location, default the next action, confirm the result. Never trade
   comprehension for polish.
2. **Reduce complexity** — Collapse multi-step, multi-role workflows into the simplest path.
   Smart defaults, progressive disclosure, fewer clicks. Hide complexity until it's needed —
   don't delete it.
3. **Speed of comprehension** — A new user understands a screen in minutes. One concept = one
   icon, one colour, one word, used the same way everywhere. **Consistency is a feature.**
4. **One frame, role-driven** — Everything lives in a single consistent shell. What you see is
   filtered by your access. Adding a feature never reshapes the frame.
5. **Trustworthy & accessible** — This is insurance: people's money and health. WCAG AA minimum,
   keyboard-first, auditable, honest. Destructive and high-stakes actions are deliberate, never
   accidental.

> **The test:** a reviewer understands the navigation and any core workflow in under five
> minutes; a new screen can be designed using *only* the colours, type and components in this
> guide — without inventing anything new.

---

## 2. Typography

### Typefaces

The console ships **two typefaces, both from the Geist family** (Vercel's open-source type).
Geist does *everything* — there is no separate display or heading face — and Geist Mono is
reserved for anything numeric or technical so figures line up.

| Use | Typeface | Weights | Notes |
|---|---|---|---|
| **Everything** — body, headings, labels, UI | **Geist** (sans) | 400 · 500 · 600 · 700 | The product voice. |
| **Numbers, IDs, money, code** | **Geist Mono** | 400 · 500 · 700 | Wherever figures, money, IDs or technical strings appear. Always **tabular** (digits align in columns). |

**How they're wired.** Fonts are named once as tokens (`--font-sans` / `--font-mono`) and
every component inherits them — components never name a font family directly.

```css
--font-sans: "Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
--font-mono: "Geist Mono Variable", ui-monospace, "SF Mono", "Cascadia Code", monospace;
```

- Loaded as **variable fonts** via `@fontsource-variable/geist` and
  `@fontsource-variable/geist-mono` (hence the `Variable` suffix in the runtime family names).
  The hi-fi `Ginja Console-v2.html` embeds the same faces as static `woff2` weights to stay
  self-contained — same typefaces, only the delivery differs.
- Text renders with `-webkit-font-smoothing: antialiased` and `text-rendering: optimizeLegibility`.
- **Keep both tokens defined:** if `--font-mono` is ever lost, every ID and figure falls back
  to the system monospace and loses its tabular alignment.

### Type scale

One scale, used everywhere. Sizes in px (rem). Never go below **11px**.

| Role | Size | Weight | Line height | Use for |
|---|---|---|---|---|
| **Display** | 36px (2.25rem) | Bold 700 | 1.2 | Hero figures, marketing-weight numbers (rare in-app) |
| **H1 / Page title** | 28px (1.75rem) | Semibold 600 | 1.2 | The page heading |
| **H2 / Section** | 22px (1.375rem) | Semibold 600 | 1.35 | Major section titles |
| **H3 / Card title** | 18px (1.125rem) | Semibold 600 | 1.35 | Panel & card headers |
| **Large body / lead** | 16px (1rem) | Regular 400 | 1.5 | Intro paragraphs, lead text |
| **Body** | 14px (0.875rem) | Regular 400 | 1.5 | Default body, form fields |
| **Body small** | 13px (0.8125rem) | Regular 400 | 1.5 | Dense table rows, secondary text |
| **Caption / hint** | 12px (0.75rem) | Regular 400 | 1.35 | Field hints, captions, metadata |
| **Micro** | 11px (0.6875rem) | Regular / Medium | 1.35 | Smallest legible text — fine print, dense badges |
| **Eyebrow** | 12px | Semibold 600 | — | **UPPERCASE**, +0.04em letter-spacing, muted grey. Small section labels above a value. |

### Typography rules

- **Sentence case** everywhere ("Approve claim", not "Approve Claim"). The tracked **uppercase
  eyebrow** is the *only* all-caps text.
- **13px** is the default dense table body; **14px** is form body.
- **Tabular figures** (mono) wherever numbers, money or IDs need to align — e.g. `1,234,567`.
- Weight does the hierarchy work: Semibold for headings/labels, Regular for body. Avoid Bold for
  long text; reserve it for big display numbers.
- Keep prose to a readable measure (~68 characters wide). Don't run body text edge to edge.

---

## 3. Colour

The system is **one signature + one accent** on cool neutrals. Indigo is the workhorse; emerald
means "positive"; everything else is slate. Two colours carry meaning — don't add more.

### Primary — Iris / Indigo · the signature

Buttons, active navigation, links, focus rings, selected states. Anchor is **600 (#5B5BD6)**.

| Step | Hex | Where it's used |
|---|---|---|
| 50 | `#F5F5FE` | Faintest tint — hover wash |
| 100 | `#ECECFD` | Selected nav background, avatar tints |
| 200 | `#DCDCFB` | |
| 300 | `#C2C2F7` | |
| 400 | `#9B9BF0` | |
| 500 | `#7C7CEA` | |
| **600** | **`#5B5BD6`** | **PRIMARY** — filled buttons, active states, focus ring (white text, 5.4:1) |
| 700 | `#4A4AC0` | Hover/pressed, secondary text on tint |
| 800 | `#3C3CA0` | |
| 900 | `#323286` | Deepest |

### Brand — Emerald · the "Ginja green" (positive)

Success, completion, the single highest-emphasis positive action. Use **sparingly** — its power
comes from rarity.

| Step | Hex | Where it's used |
|---|---|---|
| 50 | `#E7FBF3` | |
| 100 | `#D0F7E6` | Success pill / tinted-positive backgrounds |
| 200 | `#A3EFCE` | |
| 300 | `#6EE7B7` | |
| 400 | `#34D399` | |
| **500** | **`#10B981`** | Vivid brand green — non-text accents, progress fill, charts |
| **700** | **`#047857`** | Text-safe brand — the emerald CTA & success text (white text, 5.3:1) |
| 800 | `#065F46` | |
| 900 | `#064E3B` | |

### Neutral — Slate · surfaces & text

Cool, very light. The canvas everything sits on.

| Step | Hex | Where it's used |
|---|---|---|
| 0 | `#FFFFFF` | Cards & panels (they pop off the page) |
| 50 | `#FBFBFD` | **Page background** — a faint tint, not pure white |
| 100 | `#F4F5F8` | Muted fills, secondary chips, segmented-control track |
| 200 | `#E9EBF1` | **Hairline borders** — the default 1px divider |
| 300 | `#D6DAE4` | Input borders |
| 400 | `#AEB4C2` | Disabled / placeholder |
| 500 | `#7B8294` | |
| 600 | `#5A6172` | **Muted text** — secondary copy, hints (5.6:1) |
| 700 | `#3E4453` | |
| 800 | `#262B36` | |
| 900 | `#161A22` | **Body text** — primary foreground (15.8:1) |
| 950 | `#0C0E14` | Dark-mode page background |

### Status colours

Each status has a **solid** colour (text/icon) and a **subtle** tinted background (pills, notes,
badges). Status is always **icon + colour + text** — never colour alone.

| Status | Meaning | Solid | Subtle background |
|---|---|---|---|
| **Success** | Done, approved, active | Emerald `#047857` | `#D0F7E6` |
| **Warning** | Needs attention, pending, in-progress | Amber `#B35909` | `#FEF0C8` |
| **Info** | Neutral system info | Sky `#0369A0` | `#E1F3FE` |
| **Error / Destructive** | Failed, rejected, retired, delete | Rose `#E21D48` | `#FFE5E8` |

### Semantic roles — the quick reference

When in doubt, pull from these — not a raw ramp step.

| Role | Light | Notes |
|---|---|---|
| Page background | `#FBFBFD` | Faint slate tint |
| Card / surface | `#FFFFFF` | White, with a hairline border |
| Body text | `#161A22` | |
| Muted text | `#5A6172` | Secondary copy, captions |
| Hairline border | `#E9EBF1` | 1px dividers and card edges |
| Primary action | `#5B5BD6` | Iris, white text |
| Brand / positive | `#047857` | Emerald, white text |
| Focus ring | `#5B5BD6` | 2px, with 2px offset |

### Colour rules

- **One primary, one accent.** Indigo is the default action colour. Reserve emerald for *the one*
  highest-emphasis positive action and for success — if it's used for routine buttons it stops
  meaning "positive."
- **Never hard-code a random colour.** Every colour on screen should come from these ramps.
- **Text needs contrast.** Body on white, muted for secondary only. Don't set body text in a
  ramp-400 grey.
- **No decorative colour.** No coloured glows, no coloured left-border accents, no gradients
  except the functional donut chart.

### Dark mode

The same language, inverted onto deep slate. Surfaces go dark (page `#0C0E14`, cards `#161A22`),
text goes light (`#E7E9F0`). **Indigo brightens** (`#8C8CF0`) so it stays legible on dark; emerald
deepens. Every status keeps its meaning with adjusted tints. Designs should be checked in both
modes.

---

## 4. Spacing & layout

### The 4px grid

All spacing is a multiple of **4px**. Use the scale — don't invent in-between values.

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

- **16px** is the default padding inside cards and the common gap between fields.
- **20–24px** separates major sections.
- Tighten to **8–12px** only inside dense, data-heavy areas.

### Density

| Mode | Row height | Padding | Body | Use for |
|---|---|---|---|---|
| **Comfortable** *(default)* | 40px | 16–24px | 14px | Dashboards, forms, records — most screens |
| **Compact** | 32px | 8–12px | 13px | Data-heavy tables & queues (user-toggleable) |

### Grid & measure

- Content area is a **12-column fluid grid** with **24px gutters**.
- Prose stays at a **~68-character** max width for readability.

### Breakpoints (desktop-first)

| Width | Behaviour |
|---|---|
| ≥1280px | Full layout |
| ≥1024px | Side rail auto-collapses to icons |
| ≥768px | Tablet — navigation moves into a drawer |
| <768px | Read-only fallback |

---

## 5. Shape, borders & elevation

### Corner radius

The system radius is **10px** — soft and modern. It scales proportionally:

| Size | ~Radius | Use for |
|---|---|---|
| Small | ~6px | Chips, small badges, segmented buttons |
| Medium | ~8px | Buttons, inputs, menu items |
| **Base** | **10px** | Cards, panels, dialogs — the default |
| Large+ | 14–26px | Pills (fully rounded), large containers |

Status pills and dot-badges are **fully rounded** (pill shape). Avatars are rounded squares;
people avatars are circles.

### Borders

- Enterprise density leans on **1px hairline borders** (`#E9EBF1`), not shadow, to separate
  content. Every card has one.
- Input borders use a slightly stronger slate (`#D6DAE4`).

### Elevation (shadows)

Soft, diffuse, low-opacity — the "floating" look. Shadows are **functional only**, signalling how
far an element is lifted off the page:

| Level | Use for |
|---|---|
| **XS / SM** | Resting cards, KPI stats, panels |
| **MD** | Popovers, dropdown menus, the active item in a segmented control |
| **LG** | Dialogs and drawers (the most lifted) |

No decorative glow. No coloured shadows. If a card needs separation, a hairline border usually
does the job before a shadow.

---

## 6. Iconography

- **Lucide** icon set. Outline style, **1.5px stroke**, drawn in `currentColor` (inherits the
  text colour around it).
- Sizes: **16px** inline / in tables · **18–20px** in nav & buttons · **24px** in page headers &
  empty states.
- **One concept = one icon**, used identically everywhere (e.g. one icon for "tenant", one for
  "approval"). Never emoji. Never colour-only status — pair the icon with a label.

---

## 7. Motion

Subtle, fast, purposeful. Motion clarifies a change; it never entertains.

- **Durations:** 80ms (instant) · 130ms (fast) · 200ms (default) · 260ms (slow).
- **Easing:** a gentle modern ease-out for most transitions. Movement is small — fades plus a
  4–8px shift.
- **Rules:** no bounce, no looping animation, no auto-advancing the user. Always honour
  *reduced-motion* preferences.

---

## 8. Components

How the recurring building blocks should look. **Compose these — don't invent new ones.**

### Buttons & actions

| Variant | Look | Use for |
|---|---|---|
| **Primary** | Filled indigo, white text | The main action on a view |
| **Brand CTA** | Filled emerald, white text | The *single* highest-emphasis positive action ("Submit", "Activate") |
| **Secondary** | Light slate fill | Supporting actions |
| **Outline** | Hairline border, transparent fill | Tertiary / toolbar actions |
| **Ghost** | No border/fill until hover | Icon buttons, low-emphasis actions |
| **Destructive** | Soft red tint, red text | Delete / remove |

- **One primary action per view.** Don't place two equal-weight filled buttons side by side.
- Verb-first, sentence case: "Approve claim", "Add tenant".
- Buttons are compact (≈32px tall by default) with a 10px-family radius.

### Status pills & badges

- **Status pill** — a rounded pill with a small **LED dot** then a label, on a subtle tinted
  background matching the status (e.g. green "Active", amber "Pending review", red "Retired").
- **Mini badge** — a smaller dot-and-label badge for inline use in tables and lists.
- **Tag pill** — a neutral slate chip for non-status metadata (region, type, count).

### Cards & panels

The primary container: **white surface, 1px hairline border, 10px radius, soft XS shadow**. A
panel has an optional header row (leading icon · title · right-aligned action) divided by a
hairline, then a padded body. Group related content into panels rather than floating it on the
page.

### KPI stat cards

Dashboard headline metrics. Each card: a small tinted icon chip (top-left), a tiny **uppercase
eyebrow label**, then the **big value in mono/tabular** (~30px bold), then a one-line footnote.
One headline metric per card. The icon chip tone hints at the metric (brand green, indigo,
amber, red, or neutral).

### Forms & fields

- A field is: **label** (medium weight) → optional `*` required marker or muted "optional" tag →
  **control** → **hint** below.
- **Inline validation on blur.** Error text sits *below* the field in red, phrased cause-then-fix
  ("Premium can't be negative. Enter 0 or more.").
- Two-column grid for forms; a field can span full width.
- **Segmented control** — a pill group on a muted track; the selected segment is a raised white
  chip. For 2–4 mutually exclusive options.
- **Radio cards** — selectable cards (icon + title + description) with a check mark and an indigo
  ring when selected. For higher-stakes choices (tenant type, isolation tier).
- **Don't** show all options at once — group, default, and progressively reveal advanced ones.

### Data tables

The workhorse. Anatomy: a toolbar (search · filters · column/density controls) above a table with
sortable headers, a **sticky header**, inline status badges, and a row click that opens a detail
drawer.

- **Right-align numbers & money**, in tabular figures, with units in the header.
- Keep the primary row action visible — don't bury a constantly-used action in a menu.
- Beyond ~7 columns, add column controls rather than forcing horizontal scroll.

### Charts

- **Donut** — a conic ring with a hollow centre showing the total; segments use the chart
  palette (indigo, emerald, amber, sky, light-indigo).
- **Horizontal bar list** — label · track-and-fill bar · count, for simple comparisons
  (e.g. pipeline stages).
- Every figure should drill down to its source. Keep charts calm — no 3D, no heavy gridlines.

### Avatars

- **Tenant** — a rounded **square**, indigo-tinted, with the first two letters of the name.
- **Person / owner** — a small **circle** with initials.
- **Stack** — overlapping circles with a thin ring, for multiple owners.

### Notes & callouts

An inline message block on a subtle tinted background with a leading icon, in one of four tones:
**info** (sky), **warning** (amber), **success** (emerald), **error** (rose). Keep them short.

### Progress track

The onboarding progress indicator is a row of equal segments — one per section — coloured
**emerald** (complete), **amber** (in progress) or **muted grey** (not started), with a small
legend.

### Notifications & feedback

- **Toast** — transient confirmation of *my* action ("Claim approved"), top-right, auto-dismiss,
  with undo where reversible.
- **Banner** — persistent, page-level state (system notice, blocked workflow); dismiss only when
  resolved.
- **Notification bell** — a popover of events assigned to me, with an unread count.
- Long-running tasks show inline progress, never a blocking spinner on the whole page.

---

## 9. Patterns

Recurring screen shapes. Pick one — don't design a bespoke frame.

- **Dashboard** — KPI cards lead, then charts, then a recent-activity list.
- **List → detail** — a master list; triage in a **drawer** (review without losing the list),
  promote to a **full page** when the task needs more than a glance and two actions.
- **Wizard / multi-step form** — a stepper, a persistent "Save draft", and a final **review**
  step. Progressive disclosure of advanced options.
- **Record page** — entity header (name · ID in mono · status pill · primary action), then tabs
  (Overview · related items · **Activity / audit trail**). The audit trail is append-only,
  timestamped and attributed.
- **Approval / maker-checker** — a maker submits, a *different* person approves. The maker's own
  approve button is **disabled with a tooltip** explaining a second approver is needed. Each
  approval shows a status on the record, a queue for the approver, and an audit entry.
- **Destructive confirmation** — high-stakes deletes use a confirm dialog, **name the object**,
  and confirm with the **verb** ("Delete product"), never "Yes".

### The four states — every screen ships all of them

| State | Looks like |
|---|---|
| **Loading** | Skeletons that mirror the final layout — no full-page spinners |
| **Empty** | One line of explanation + one clear action |
| **Error** | The cause + a retry |
| **Permission-denied** | Factual, and who to ask for access — never a dead end |

---

## 10. Accessibility

Non-negotiable — this is insurance.

- **Contrast:** ≥4.5:1 for text, ≥3:1 for UI elements & large text — in light *and* dark.
- **Focus:** always visible — a 2px indigo ring with a 2px offset on every interactive element.
- **Keyboard:** every action is reachable; nothing is mouse-only.
- **Targets:** at least 24×24px (44px on touch).
- **Status** is conveyed by **icon + colour + text** together, never colour alone.
- Respect **reduced-motion** and the user's light/dark preference. Never trap or auto-advance.

---

## 11. White-label (tenants)

Each insurer can get their own brand **without changing the design**. A tenant supplies brand
colours (a primary, an accent), an optional logo and corner radius. Those values flow into the
**primary** and **accent** slots — *the meaning of every colour stays the same, only the values
move.* Buttons are still "the primary action"; they're just now the tenant's colour.

- Map the tenant's brand onto the **primary** (indigo slot) and **accent** (emerald slot).
- A tenant theme must still pass the **contrast gate** in both light and dark — if a pale brand
  can't clear AA on white, an accessible action-shade is derived from their hue. **Accessibility
  is never sacrificed to brand.**
- Logos are tenant chrome (supply light + dark marks); everything else follows the tokens.

The bundled example tenant, **"Nimbus Health,"** remaps the system to a cyan-blue primary + lime
accent to prove this — same layout, same components, different paint.

---

## Quick checklist before shipping a design

- [ ] Colours come only from the ramps; one primary + emerald used sparingly for positive.
- [ ] Type uses the scale; sentence case; numbers in tabular mono; nothing below 11px.
- [ ] Spacing is on the 4px grid; cards have a hairline border + soft shadow + 10px corners.
- [ ] Status uses icon + colour + text, with the right tone.
- [ ] One primary action per view; destructive actions are confirmed and named.
- [ ] Loading, empty, error and permission-denied states are all designed.
- [ ] Checked in light **and** dark mode; focus states visible; contrast clears AA.
- [ ] Composed from existing components — nothing new invented.
