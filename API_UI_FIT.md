# API ↔ UI Fit & Roadblocks

How each page (that **has** real endpoints in Swagger / the Postman collection) lines up
with the live API, what's been wired, and where the existing hi-fi UI carries data the API
does not provide. Backend-less pages (dashboard, document/email templates, full module-registry
CRUD, platform settings) are out of scope and not covered here.

Verified live against `https://…northeurope.azurecontainerapps.io/api/v1` as `admin@ginja.ai`
(PLATFORM_ADMIN) on 2026-06-15.

**Legend** — ✅ wired & verified · 🟡 partial (clean core wireable; some UI has no API source) ·
🚧 roadblock (UI models a different resource than the API; needs redesign, not a wire-up).

---

## ✅ Roles & permissions — `src/pages/access/roles.tsx`

Fully wired and **verified end-to-end in the UI** (create → edit → delete, each confirmed on
the backend; list auto-refreshes via query invalidation).

| Action | Endpoint | Status |
| :----- | :------- | :----- |
| List roles | `GET /platform/organization/roles` | ✅ |
| Module catalogue (matrix) | `GET /platform/organization/functionalities` | ✅ |
| Create role | `POST /platform/organization/roles` (`functionality_codes`) | ✅ |
| Edit role | `PATCH …/roles/{id}` + diff `POST/DELETE …/{id}/functionalities` | ✅ |
| Delete role | `DELETE …/roles/{id}` (409 if still assigned → toast) | ✅ |

**Dropped (no API source — not fabricated):** role **colour** (icon tint is derived from the
role code), per-role **user counts / avatar stacks**.

**Deferred (clean endpoints exist, but need net-new UI — not blocked, just unbuilt):**
- **Fine-grained permissions** — `GET /permissions` + `POST/DELETE …/roles/{id}/permissions`.
  The role matrix is **modules-only** for now; a permissions section is a follow-up.
- **Region scopes** — `PUT …/roles/{id}/region-scopes`. No UI surface exists.

> The original mock matrix was driven by a fictional `PERM_CATALOG` (14 invented perms like
> `tenants.view`) that does not exist in the API. It was replaced by the live functionalities.

---

## ✅ Audit log — `src/pages/audit-log/index.tsx`

Fully wired and **verified live** (real entries render, including the role actions performed
during testing).

| Action | Endpoint | Status |
| :----- | :------- | :----- |
| List entries (paged) | `GET /platform/organization/audit-logs` | ✅ |

**Adapted (no fabrication):** the API has no actor **role** (the old subtitle was dropped — actor
shown alone), and no `kind` — the tone badge is **derived** from the action code
(`*_CREATED`→create, `*_DELETED/REJECTED`→danger, etc.). Action codes are prettified for display
(`ROLE_CREATED` → "Role created"). Free-text search filters the loaded page client-side (the API
filters are structured: `entity_type` / `action` / `actor`).

**Deferred:** server-side pagination controls + structured filters (`GET …/audit-logs/modules`
for the entity-type filter). Currently fetches the latest 100 and searches client-side.

---

## 🚧 Pricing & plans — `src/pages/pricing/index.tsx`  — ROADBLOCK

The page and the API model **different things**.

- **UI:** toggle 4 fixed *subscription-model types* (PMPM / Outpatient / Inpatient / % of GWP)
  on/off, a static list of billing frequencies, and 4 fixed volume-discount rate-card tabs.
- **API (`pricing-controller`):** a CRUD list of named **PricingStructure** records
  (`GET/POST /pricing-structures`, `PATCH`, `…/activate`, `…/archive`) with a DRAFT→ACTIVE→ARCHIVED
  lifecycle, each holding `components[]` → `tiers[]`.

There is **no endpoint** to "enable/disable a model type" and **no UI** for listing / creating /
versioning pricing structures. Wiring this means rebuilding the page around the PricingStructure
resource (cards per structure, create/edit form, activate/archive). **UI redesign, not a wire-up.**

---

## 🟡 Approvals — `src/pages/approvals/index.tsx`  — PARTIAL

The pending queue + the decision actions are clean; the surrounding UI carries extras the API
can't back.

| Maps cleanly | Endpoint |
| :----------- | :------- |
| Pending queue (payer name, submitted-by, submitted-at) | `GET /platform/approvals` → `PayerResponse[]` |
| Approve / Reject / Request-info (in `review.tsx`) | `POST …/payers/{id}/approve\|reject\|request-info` |

**Roadblocks (no API source):**
- **Priority** column — no field on `PayerResponse`.
- **Request "kind"** variety (Entitlement change / Org-details change / Secondary tenant) —
  only onboarding submissions exist; maker-checker on active payers is backend-pending.
- **Approved / All tabs** — `GET /approvals` returns only payers *awaiting* a decision; approved
  ones leave the queue. No approval-history endpoint, so those tabs have no source.

**To wire:** show the pending queue + wire the review actions; drop priority, the kind variety,
and the Approved/All tabs.

---

## 🟡 Tenant accounts (Payers) — `src/pages/tenant-accounts/index.tsx`  — PARTIAL

The list table mostly maps; a couple of columns and the drafts strip don't.

| Maps cleanly (from `GET /platform/payers` → `PayerResponse[]`) |
| :------------------------------------------------------------- |
| Name (primary tenant legal entity), payer code/id, type, status, region (data residency), sub-tenant count (`tenants.length − 1`), subscription model |

**Roadblocks (no API source):**
- **Members** count and **MRR** columns — no such fields on `PayerResponse`.
- **Onboarding-drafts strip + team-assignment drawer** — a curated concept; loosely relates to
  DRAFT payers + `…/{id}/steps`, but the per-section staff-assignment UI doesn't match the
  steps API 1:1.
- Hardcoded "Showing X of 24" / "Page 1 of 2" footer (no server pagination wired).

**To wire:** the table from `GET /payers` (drop Members + MRR columns); detail view via
`GET /payers/{id}`; leave the drafts strip for a dedicated pass.

---

## ✅ Users (Members) — `src/pages/access/users.tsx`

Fully wired and **verified live** (directory render, invite → edit-roles → delete, each confirmed
on the backend; test member cleaned up).

| Action | Endpoint | Status |
| :----- | :------- | :----- |
| Directory (paged, search + status filter client-side) | `GET /platform/organization/members` | ✅ |
| Invite (onboard, then send link) | `POST /members` + `POST …/{id}/invite` | ✅ |
| Edit roles | diff `POST …/{id}/roles` + `DELETE …/{id}/roles/{roleId}` | ✅ |
| Suspend / reactivate | `PUT …/{id}/status` (reason required to suspend) | ✅ |
| Resend / revoke invite | `POST …/{id}/resend-invite\|revoke-invite` | ✅ |
| Delete | `DELETE …/members/{id}` | ✅ |

**Dropped (no API source — not fabricated):** the **activity timeline** tab (no per-member history
endpoint — the system-wide Audit log covers this), the **MFA / two-factor** status (replaced the
stat with the real `active_sessions` count), and the invite **expiry countdown / "Expired" badge**.
The per-role breakdown now shows the role's real **modules** (functionalities), not the old
fictional permission catalogue.

**Deferred (clean, unbuilt):** sessions admin (`GET …/{id}/sessions`, `POST …/{id}/sessions/revoke`),
set-password (`PUT …/{id}/password`) — no UI surface yet.

---

## 🟡 Tenant provisioning — `src/pages/tenant-provisioning/`  — PARTIAL (needs detailed pass)

The API (`provisioning-controller`) is well-structured and likely a good fit: queue
(`GET /provisioning`, `/mine`), one tenant (`GET /provisioning/{tenant_id}`), assign, save
section, test, stage. `ProvisioningResponse` carries `stage`, `assignee`, `sections[]`
(`section`, `status`, `config`, `last_result`). Not yet wired or field-by-field assessed — flagged
as the next candidate after the partials above are confirmed.

---

## Shared infrastructure added this pass

- `src/lib/api/paged.ts` — `Paged<T>` + `toPaged` mapper for the Spring page envelope
  (`{ content, page, size, total_elements, total_pages }`) used by members & audit.
- `src/features/access/` and `src/features/audit/` — the per-domain pattern
  (`types` → `api` → `queries` → `use-*` hooks), mirroring `src/features/auth/`.

## Minor issue noted

- The shared `ConfirmDialog` (`src/pages/access/access-shared.tsx`) logs a Radix a11y warning
  (`DialogContent requires a DialogTitle`). Pre-existing, non-functional; fix by wrapping its
  `<h3>` title in Radix `DialogTitle` (optionally visually-hidden).
