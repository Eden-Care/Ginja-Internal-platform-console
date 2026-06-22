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

## 🟡 Tenant accounts (Payers) — `src/pages/tenant-accounts/index.tsx`  — WIRED, blocked by backend 500

The list page is **fully wired** to `GET /platform/payers` (feature folder `src/features/payers/`:
`types`/`api`/`queries`/`use-payers`). Search, status filter, sort, and pagination run client-side
over the returned array; loading + error states are in place. **No frontend change is needed once
the backend is fixed.**

| Column / element | API source | Status |
| :--------------- | :--------- | :----- |
| Tenant name | primary tenant `legal_entity_name` | ✅ wired |
| ID · type | `payer_id` · `payer_type` (mapped to display strings) | ✅ wired |
| Status | `status` (mapped DRAFT/ACTIVE/… → display) | ✅ wired |
| Region | primary tenant `data_residency_region` | ✅ wired |
| Sub-tenants | `tenants.length` | ✅ wired |
| Subscription | `subscription` (structure name / model, defensive) | ✅ wired |
| Updated | `activated_at ?? submitted_at ?? created_at` | ✅ wired |
| **Members** count | — no field on `PayerResponse` | 🚧 column kept, renders "—" + flagged |
| **MRR** | — no field on `PayerResponse` | 🚧 column kept, renders "—" + flagged |

### 🔴 BLOCKER — backend 500 (verified live 2026-06-16, as `admin@ginja.ai` / PLATFORM_ADMIN)
- `GET /platform/payers` → **500** `{"message":"Internal server error","error_details":null}`
- `GET /platform/payers/{id}` → **500** (same) — and `/payers/1` 500s rather than 404, so a payer
  row likely exists but **fails to serialize** server-side.
- Control check: `GET /platform/approvals` → **403 Access denied** (expected — that's the
  PLATFORM_APPROVER role), which proves the token is attached and the server is authorising
  requests. Members/roles/sessions reads all work with the same token. **So the 500 is specific to
  the payer read endpoints — a backend bug, not a client issue.**

> **→ Point for the backend dev:** `GET /platform/payers` and `GET /platform/payers/{id}` return a
> generic 500 (no `error_details`) for a valid PLATFORM_ADMIN. Needs server logs — likely a
> serialization/mapping error on the `PayerResponse` (e.g. a null `subscription`/`entitlements`,
> the encrypted bank fields, or an empty-tenants edge). Until fixed, the Tenant accounts table shows
> its error state.

**Still on mock (deferred to the onboarding pass):**
- **Onboarding-drafts strip + team-assignment drawer** — depends on DRAFT payers + the `…/{id}/steps`
  API (step list + per-step assign). Left on `ONB_DRAFTS` mock for now; will wire with onboarding.
- Row **"More"** menu is a no-op placeholder; lifecycle actions (`POST …/suspend|reactivate|retire`)
  exist in the API and can populate it later (not in the current list design's scope).

---

## ✅ Tenant onboarding wizard — `src/pages/tenant-accounts/onboard/`

The 6-step wizard is **fully wired** (was pure local state before). Feature layer:
`src/features/payers/` (`api`, `onboarding` orchestration, `use-onboarding`) + `src/features/pricing/`.
The whole create→submit spine was **verified live end-to-end** as `admin@ginja.ai` (created
`PAY000019`, submitted OK). Step 3 (real module catalogue) and Step 4 (real ACTIVE pricing structure)
**render live data in the UI**.

| Wizard step | Endpoint(s) | Status |
| :---------- | :---------- | :----- |
| 1 · Basic profile (incl. subdomain/region) | `GET …/subdomain-check`, `GET …/tenant-lookup` → `POST /payers` → `PATCH …/tenants/{id}/technical` | ✅ |
| 2 · Secondary tenants | `POST …/{id}/tenants` | ✅ (see gap) |
| 3 · Module access | `GET …/functionalities` → `PUT …/entitlements` | ✅ (modules-only) |
| 4 · Billing | `GET /pricing-structures?status=ACTIVE` → `PUT …/subscription` | ✅ |
| 5 · KYC & documents | `POST …/tenants/{tid}/documents` (metadata) | 🟡 metadata-only |
| 6 · Review & submit | `POST …/submit` | ✅ |

**Persistence model:** the wizard stays local and runs the full sequence on **Submit** (resumable
from the failed step on retry). Chosen over create-a-draft-per-step because the API has **no endpoint
to edit a primary tenant's org details after creation** (only `technical`), which would strand
back-navigation.

### → UX/UI changed from the hi-fi design (for the backend/design conversation)

These are deliberate deviations driven by the API. **In-UI notes flag each one** so nothing is lost:
- **Step 3 sub-modules removed** → modules-only. The API has a module catalogue (`/functionalities`)
  but **no sub-module catalogue**, so the rich submodule tree (claims→intake/adjudication/…) is gone.
  In-UI note: "Sub-module selection is pending backend." *Backend ask: expose a submodule catalogue.*
- **Step 3 shows test-junk modules** (`BILLING_X`, `BILLING_6267155`, `FUNC_8737063`) because they're
  ACTIVE in `/functionalities`. *Backend ask: clean up test functionalities.*
- **Step 4 billing reshaped** — was abstract model cards (incl. **`flat`/`hybrid`**, which aren't in
  the API enum) + **free-trial** + **contract-start/end** fields. Now: pick a real **pricing
  structure** + `subscription_model` (PMPM/PER_CLAIM/PCT_GWP) + frequency. Removed fields flagged
  in-UI. *Backend ask: confirm whether free-trial/contract dates belong on the subscription.*
- **Step 5 documents = metadata only** — the upload dropzone + mock "uploaded" rows were replaced
  with a **filename-per-category** capture and a banner: "File upload isn't available yet… metadata
  only." Optional + per-secondary documents aren't wired (category codes unconfirmed).
  *Backend ask: expose a document-bytes upload + the optional category codes.*
- **Step 1 gained Subdomain + Data-residency inputs** (the design had no control for them, but the
  API requires both to submit). *Confirm placement with design.*
- **Step 2 secondary contact/admin details** aren't collected (design only has name/country/region/
  subdomain) but the API needs the full `TenantDetailsRequest`. They **default to the primary's**
  contact so the request validates. *Backend/design ask: add secondary contact fields, or confirm
  the default.*
- **Server-side drafts deferred** — "Save draft / Save & exit" keep progress in the browser tab only;
  the live `/steps` tracker + per-step server assignment + the drafts strip are not wired yet (the
  API supports them — this is a frontend follow-up, not a backend gap).

**Value mapping applied (no UI change):** country names → ISO-2 (Kenya→KE…), frequency → UPPERCASE,
tenant_admin_* ← the "Primary Tenant Admin" contact (contact 0).

---

## ✅ Users (Members) — `src/pages/access/users.tsx`

Wired to match the hi-fi design (`Ginja Console-v2.html`) and **verified live** (directory render,
invite → edit-roles → delete confirmed on the backend with a cleaned-up test member). Opening a row
fetches that member's detail via `GET …/members/{id}` (`200` confirmed). The drawer keeps the
design's three tabs — **Overview · Access · Activity timeline** — and a Suspend / Delete footer.

| Action | Endpoint | Status |
| :----- | :------- | :----- |
| Directory (paged, search + status filter client-side) | `GET /platform/organization/members` | ✅ |
| Member detail (on row open) | `GET …/members/{id}` | ✅ |
| Invite (onboard, then send link) | `POST /members` + `POST …/{id}/invite` | ✅ |
| Edit roles | diff `POST …/{id}/roles` + `DELETE …/{id}/roles/{roleId}` | ✅ |
| Suspend / reactivate | `PUT …/{id}/status` (reason required to suspend) | ✅ |
| Resend / revoke invite | `POST …/{id}/resend-invite\|revoke-invite` | ✅ |
| Delete | `DELETE …/members/{id}` | ✅ |

The per-role breakdown shows each role's real **modules** (functionalities), not the old fictional
permission catalogue.

**Kept as visible "pending backend" placeholders (NOT removed, NOT fabricated)** — these are
elements the **design** shows but the API can't back yet, so they render in a clear placeholder
state rather than disappearing (see the "don't silently drop" rule):
- **Two-factor** — the third Overview stat card (design shows "Enabled") renders a "Pending backend"
  badge instead, since `MemberResponse` has no MFA field.
- **Activity timeline** — the third tab shows an empty state ("per-member history isn't available
  from the API yet") that deep-links to the platform Audit log.
- **Invite expiry countdown** — the Invited banner notes expiry tracking isn't shown because the API
  doesn't return invite expiry.

**Out of design scope (endpoints exist, intentionally NOT built):** sessions admin
(`GET …/{id}/sessions`, `POST …/sessions/revoke`) and set/reset password (`PUT …/{id}/password`)
are not part of the Users design, so no UI was added for them.

### → Points to pass to the backend dev (Users)

1. **Per-member activity feed** — no per-member history endpoint. `GET /members/{id}` returns the
   same `MemberResponse` as the list (no events). Either add `GET /members/{id}/activity` (paged
   events: action, actor, timestamp, target) or confirm the system-wide audit log is the intended
   source and we drop the per-member tab.
2. **Two-factor status** — `MemberResponse` has no MFA field. Add `mfa_enabled` (and ideally method)
   if platform members can enrol in 2FA; otherwise confirm 2FA isn't in scope for members.
3. **Invite expiry** — invite mint accepts `expiry_days`, but neither `MemberResponse` nor any
   read endpoint returns the resulting expiry timestamp. Add `invite_expires_at` so the UI can show
   a countdown / "Expired" state for INVITED members.

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
