# Ginja Platform Console — API Guide (end-to-end)

Covers every endpoint across **Access & Control** (auth, functionalities, roles, members, audit),
**Pricing**, and **Tenant/Payer onboarding**. Each entry lists method, path, required role, request
body, the `result` payload, and status codes, followed by a full copy-paste walkthrough.

---

## 1. Conventions

- **Base URL:** `http://localhost:8082/api/v1` (server `port: 8082`, `context-path: /api/v1`).
  > Under the `dev` profile, if 8082 is busy the app may bind the next free port (e.g. 8083) — check
  > the startup log line `Tomcat started on port ...`.
- **Auth:** `Authorization: Bearer <JWT>`. Roles come from the token `roles` claim; module access
  from the `modules` claim. Tenant-scoped tokens carry a `tenant_id` claim.
- **Content type:** `application/json`.
- **JSON casing:** all request and response bodies use **`snake_case`** keys (e.g. `full_name`,
  `access_token`, `pricing_structure_id`). Applied globally via Jackson's `SNAKE_CASE` strategy, so
  every field — including nested objects and the `Response` envelope — is snake_case. Query-parameter
  names are snake_case too (e.g. `?entity_type=`).
- **Response envelope** — **every** response (success or error) is wrapped:

  ```json
  { "status": 200, "success": true, "message": null, "result": { }, "error_details": null }
  ```

  | Field | Meaning |
  | :---- | :------ |
  | `status` | mirrors the HTTP status code |
  | `success` | `true` for 2xx, `false` for errors |
  | `message` | human-readable note (often `null` on success) |
  | `result` | the endpoint payload (object/array) — `null` on error |
  | `error_details` | error specifics (e.g. field→message on validation) — `null` on success |

  In the sections below, the documented JSON is the **`result`** payload. The `/dev/token` helper is
  the only un-enveloped endpoint.

- **Roles:** `PLATFORM_ADMIN` (platform writes/reads), `PLATFORM_APPROVER` (payer approval),
  `TENANT_ADMIN` (within a tenant). Authorities from the token: `roles` → `ROLE_*`, `modules` →
  `MODULE_*`, `permissions` → `PERM_*` — guard with e.g. `hasAuthority('MODULE_CLAIMS')` or
  `hasAuthority('PERM_CLAIMS_APPROVE')`. A read-only **`SUPPORT`** role can call the Access & Security
  **GET** endpoints (members, roles, permissions, functionalities, audit) but no writes.
- **Status codes:** `200` OK · `201` Created · `400` validation/bad input · `401` unauthenticated /
  revoked session · `403` wrong role or separation-of-duties · `404` not found · `409` conflict
  (duplicate / illegal state transition) · `500` unexpected.
- **Business identifiers:** every entity has a numeric `id` (used in paths/FKs) and a human-readable
  code (`MBR…`, `ROL…`, `FNC…`, `PAY…`, `TNT…`, `SUB…`, `PRC…`, `DOC…`, `REV…`, `AUD…`).

---

## 2. Authentication

### 2.1 Mint a dev token (dev profile only)
`POST /dev/token` — _public_. Returns a token **directly (not enveloped)**.

| Query param | Required | Notes |
| :---------- | :------- | :---- |
| `subject` | no (default `dev-user`) | JWT `sub` (used for audit + separation of duties) |
| `roles` | no | comma-separated, e.g. `PLATFORM_ADMIN` or `PLATFORM_APPROVER` |
| `tenant` | no | sets `tenant_id` → resolves a tenant schema (omit for platform tokens) |

```bash
curl -X POST "$B/dev/token?subject=alice&roles=PLATFORM_ADMIN"
# → { "access_token":"...", "tenant_id":null, "roles":["PLATFORM_ADMIN"] }
```

### 2.2 Platform login (issues a real session-backed JWT)
`POST /platform/organization/auth/login` — _public_

Request:
```json
{ "email": "admin@ginja.ai", "password": "Admin@12345" }
```
`result` (`LoginResponse`):
```json
{ "access_token":"<jwt>", "token_type":"Bearer", "session_id":"<uuid>", "expires_at":"...",
  "member_id":1, "email":"admin@ginja.ai", "roles":["PLATFORM_ADMIN"], "accessible_modules":["CLAIMS","FINANCE",...] }
```
- `200` on success; `400` invalid credentials / inactive member.
- A dev bootstrap admin (`admin@ginja.ai` / `Admin@12345`) exists under the `dev` profile.

### 2.3 Logout (revoke current session)
`POST /platform/organization/auth/logout` — _bearer_. Revokes the session in the token's `sid` claim.
`200`, `result: null`.

### 2.4 My active sessions
`GET /platform/organization/auth/me/sessions` — _bearer_.
`result`: array of `SessionResponse` `{ session_id, member_id, status, issued_at, expires_at, last_seen_at }`.

### 2.5 Tenant login (tenant-scoped)
`POST /tenant/auth/login` — _public_. See [§10](#10-tenant-login).

### 2.6 Accept invitation — `POST /platform/organization/auth/accept-invite` — _public_
Body: `{ "token":"<invite token>", "password":"NewPass@123" }`. Validates the token (PENDING +
unexpired), sets the member's password and activates them. `200`; `400` invalid/expired token.

---

## 3. Functionalities (modules)
Base: `/platform/organization/functionalities` · role **PLATFORM_ADMIN**.
A functionality is a platform module (`TENANT`, `CLAIMS`, `FINANCE`, `MEMBER`, `PROVIDER`,
`EMPLOYER`, `REPORTING`, `ACCESS`, plus any you create).

### 3.1 Create — `POST /platform/organization/functionalities`
Request (`CreateFunctionalityRequest`): `code` normalised to UPPER_SNAKE; becomes `MODULE_<code>`.
```json
{ "code": "BILLING", "name": "Billing", "description": "Invoicing operations" }
```
`result` (`FunctionalityResponse`): `{ id, functionality_id, code, name, description, status }` · `201`.
Errors: `409` if `code` exists, `400` invalid code.

### 3.2 Get all — `GET /platform/organization/functionalities`
`result`: array of `FunctionalityResponse` (sorted by code) · `200`.

> Get-one / update / delete of a functionality are **not** exposed in M1 (catalogue is create + list).

---

## 4. Roles
Base: `/platform/organization/roles` · role **PLATFORM_ADMIN**. `SYSTEM` roles (e.g. `PLATFORM_ADMIN`)
are immutable; `CUSTOM` roles are admin-authored.

### 4.1 Create — `POST /platform/organization/roles`
Request (`CreateRoleRequest`): `name` normalised to UPPER_SNAKE.
```json
{ "name": "Finance Operator", "description": "Finance + claims", "functionality_codes": ["FINANCE","CLAIMS"] }
```
`result` (`RoleResponse`): `{ id, role_id, name, description, type, status, functionalities:[...], created_at }` · `201`.
Errors: `409` duplicate name; `404` unknown functionality code.

### 4.2 Get all — `GET /platform/organization/roles`
`result`: array of `RoleResponse` · `200`.

### 4.3 Get one — `GET /platform/organization/roles/{role_id}`
`result`: `RoleResponse` · `200`; `404` if missing.

### 4.4 Assign functionalities — `POST /platform/organization/roles/{role_id}/functionalities`
Request (`AssignFunctionalitiesRequest`): `{ "functionality_codes": ["BILLING","FINANCE"] }` (idempotent).
`result`: updated `RoleResponse` · `200`. Errors: `400` editing a SYSTEM role; `404` unknown code.

### 4.5 Un-assign a functionality — `DELETE /platform/organization/roles/{role_id}/functionalities/{functionality_code}`
`result`: updated `RoleResponse` · `200`. Errors: `404` not assigned; `400` SYSTEM role.

### 4.6 Edit role — `PATCH /platform/organization/roles/{role_id}`
Body (`UpdateRoleRequest`, partial): `{ "name":"Claims Reviewer", "description":"..." }`. CUSTOM roles
only. `result`: `RoleResponse` · `200`. Errors: `400` SYSTEM role; `409` duplicate name.

### 4.7 Delete role — `DELETE /platform/organization/roles/{role_id}`
CUSTOM roles only and only when not assigned to any member. `200`; `400` SYSTEM role; `409` role
still assigned. (Mapped role→functionality/permission rows cascade.)

### 4.8 Assign / un-assign permissions to a role
`POST /platform/organization/roles/{role_id}/permissions` — `{ "permission_codes":["CLAIMS_APPROVE","CLAIMS_VIEW"] }`
(idempotent, CUSTOM roles only). `DELETE …/roles/{role_id}/permissions/{permission_code}` un-assigns.
`result`: `RoleResponse` (now includes a `permissions` array alongside `functionalities`) · `200`.

### 4.9 Set region scopes — `PUT /platform/organization/roles/{role_id}/region-scopes`
Body: `{ "regions":["af-west-1","af-east-1"] }` (replaces the set; empty/omitted = no region restriction;
de-duplicated). CUSTOM roles only. `result`: `RoleResponse` (with `region_scopes[]`) · `200`; `400`
SYSTEM role.

## 4A. Permissions catalogue
Base: `/platform/organization/permissions` · role **PLATFORM_ADMIN**. Creatable permissions that are
assigned to roles; a member's effective permissions (union across their active roles) are carried in
the login JWT as a `permissions` claim → **`PERM_<code>`** authorities, enforceable with
`@PreAuthorize("hasAuthority('PERM_CLAIMS_APPROVE')")`. A baseline set is seeded
(`ACCESS_MANAGE`, `TENANT_VIEW/MANAGE`, `CLAIMS_VIEW/MANAGE/APPROVE`, `FINANCE_VIEW/MANAGE`,
`PRICING_MANAGE`, `REPORTING_VIEW`); the SYSTEM `PLATFORM_ADMIN` role holds all.

| Method | Path | Purpose |
| :----- | :--- | :------ |
| POST | `/permissions` | create — `{ "code":"REPORTS_EXPORT", "name":"Export Reports", "description":"..." }` (`code` → UPPER_SNAKE) |
| GET | `/permissions` | list catalogue (`PermissionResponse[]`) |
| GET | `/permissions/{id}` | get one |
| DELETE | `/permissions/{id}` | delete — `409` if still assigned to any role |

`PermissionResponse`: `{ id, permission_id, code, name, description, status }`. `LoginResponse` and
`MemberResponse` both expose `accessible_permissions` (the effective union).
> Permissions are a platform‑plane concept; tenant logins continue to use functionalities/modules.

---

## 5. Members
Base: `/platform/organization/members` · role **PLATFORM_ADMIN**. A member is an internal Platform
Console user.

### 5.1 Onboard (create) — `POST /platform/organization/members`
Request (`OnboardMemberRequest`): `password` optional (omit → member stays `INVITED`); `role_ids` optional.
```json
{ "email":"ops@ginja.ai", "full_name":"Ops User", "password":"Ops@12345", "role_ids":[2] }
```
`result` (`MemberResponse`): `{ id, member_id, email, full_name, status, roles:[{id,name}], accessible_modules:[...], created_at }` · `201`.
Errors: `409` duplicate email.

### 5.2 Directory (search / filter / paginate) — `GET /platform/organization/members`
Query params (all optional): `q` (case-insensitive substring of **name or email**), `status`
(`INVITED|ACTIVE|SUSPENDED|DISABLED`), and pagination `page` (0-based), `size` (default 20),
`sort` (default `createdAt,desc`; e.g. `?sort=email,asc`).
```
GET /platform/organization/members?q=snake&status=ACTIVE&page=0&size=20&sort=email,asc
```
`result` (paged envelope):
```json
{ "content":[ /* MemberResponse[] */ ], "page":0, "size":20, "total_elements":4, "total_pages":1 }
```
`200`; an invalid `status` value → `400`. Readable by `PLATFORM_ADMIN` or `SUPPORT`.

### 5.3 Get one — `GET /platform/organization/members/{member_id}`
`result`: `MemberResponse` · `200`; `404` if missing.

### 5.4 Change status — `PUT /platform/organization/members/{member_id}/status`
Request (`SetMemberStatusRequest`): `{ "status":"SUSPENDED", "reason":"Policy violation" }`
(`INVITED|ACTIVE|SUSPENDED|DISABLED`). **`reason` is mandatory when suspending** (`400` if missing) and
is recorded in the audit trail (`audit_log.reason`, surfaced via §6). `SUSPENDED`/`DISABLED` revoke
the member's active sessions. Reactivate = `{ "status":"ACTIVE" }`. `result`: `MemberResponse` · `200`.

### 5.5 Set / reset password — `PUT /platform/organization/members/{member_id}/password`
Request (`SetPasswordRequest`): `{ "password":"NewPass@123" }` (8–100). Activates an `INVITED` member.
`result`: `MemberResponse` · `200`.

### 5.6 Assign roles — `POST /platform/organization/members/{member_id}/roles`
Request (`AssignRolesRequest`): `{ "role_ids":[2,3] }` (idempotent). `result`: `MemberResponse` · `200`; `404` unknown role.

### 5.8 Invite / resend / revoke — `POST /platform/organization/members/{member_id}/invite|resend-invite|revoke-invite`
`invite` body (optional): `{ "expiry_days":7 }` (default 7). Mints a time-limited token and sends it
(via NotificationPort); resend invalidates the prior token; revoke cancels the pending invite. The
member accepts via §2.6. `200`.

### 5.9 Sessions admin — `GET /platform/organization/members/{member_id}/sessions` · `POST …/sessions/revoke`
GET → the member's active sessions (`SessionResponse[]`). POST → revoke them all (`{ "revoked": n }`). `200`.

### 5.10 Delete user — `DELETE /platform/organization/members/{member_id}`
Hard-deletes the member (role assignments + sessions cascade). `200`.

> `MemberResponse` is enriched for the Users screen: `invited_by`, `member_since`, `last_active`
> (from sessions), and `active_sessions` count.

### 5.7 Un-assign a role — `DELETE /platform/organization/members/{member_id}/roles/{role_id}`
`result`: `MemberResponse` · `200`; `404` if not assigned.

> A member's effective module access = union of enabled functionalities across the roles assigned to
> them; it appears as `accessible_modules` and is encoded as `MODULE_*` authorities in their token.

---

## 6. Audit log
`GET /platform/organization/audit-logs` · role **PLATFORM_ADMIN**. Append-only compliance trail.

Query params (all optional): `entity_type`, `entity_id`, `action`, `actor`, `page` (0-based),
`size` (default 20), `sort` (default `created_at,desc`).

`result`:
```json
{ "content":[ { "audit_id":"AUD000001","actor":"1","actor_name":"admin@ginja.ai","action":"ROLE_CREATED",
  "entity_type":"Role","entity_id":"ROL000002","entity_label":"FINANCE_OPERATOR",
  "before":null,"after":{...},"changes":{"status":{"from":"ACTIVE","to":"SUSPENDED"}},"reason":null,"created_at":"..." } ],
  "page":0,"size":20,"total_elements":8,"total_pages":1 }
```
Examples: all changes to one member → `?entity_type=OrgMember&entity_id=MBR000001`; all approvals →
`?action=PAYER_APPROVED`.
> Tenant-scoped operations write their audit rows into the **tenant** schema's `audit_log`; this
> endpoint reads the schema resolved from the caller's token (platform admin → `public`).

---

## 7. Pricing structures
Base: `/platform/pricing-structures` · role **PLATFORM_ADMIN**. Versioned commercial proposals used
when binding a Payer subscription. Two are seeded ACTIVE (**Transaction-Based**, **% of Gross
Premium**) and admins can author more dynamically.

**Lifecycle:** `DRAFT → ACTIVE → ARCHIVED`. Only **DRAFT** is editable; only **ACTIVE** is attachable
to a subscription; **ARCHIVED** is no longer attachable (frozen subscription snapshots are
unaffected). Pricing calculation/quoting is out of scope (owned by Finance).

### 7.1 Create (DRAFT) — `POST /platform/pricing-structures`
Request (`CreatePricingStructureRequest`): `model` ∈ `TRANSACTION_BASED|PCT_GWP`; `components[]`
each with a tier schedule. Fees default to 0, `currency` to USD.
```json
{
  "name": "Enterprise PMPM 2026", "description": "custom", "model": "TRANSACTION_BASED",
  "currency": "USD", "implementation_fee": 250000, "platform_fee_annual": 0, "savings_capture_pct": 12.5,
  "components": [
    { "component_type": "CORE_PLATFORM_PMPM", "unit": "PER_MEMBER_MONTH", "sort_order": 1,
      "tiers": [
        { "tier_number": 1, "volume_threshold_min": 0,      "rate": 0.55, "discount_pct": 0 },
        { "tier_number": 2, "volume_threshold_min": 100000, "rate": 0.48, "discount_pct": -12.7 }
      ] }
  ]
}
```
`result` (`PricingStructureResponse`, status `DRAFT`) · `201`. Errors: `409` duplicate name; `400`
empty components/tiers.

### 7.2 Get all — `GET /platform/pricing-structures`
Optional `?status=DRAFT|ACTIVE|ARCHIVED` filter (all statuses when omitted). `result`: array of
`PricingStructureResponse`:
```json
{ "id":1,"pricing_id":"PRC000001","name":"Transaction-Based","description":"...","model":"TRANSACTION_BASED",
  "status":"ACTIVE","currency":"USD","implementation_fee":400000,"platform_fee_annual":0,"savings_capture_pct":15.00,
  "components":[ { "component_id":"PCM000001","component_type":"CORE_PLATFORM_PMPM","unit":"PER_MEMBER_MONTH","sort_order":1,
     "tiers":[ {"tier_id":"PTR000001","tier_number":1,"volume_threshold_min":0,"rate":0.50,"discount_pct":0.0}, ... ] } ] }
```
(The onboarding subscription step `§8.4` only accepts an **ACTIVE** structure.)

### 7.3 Get one — `GET /platform/pricing-structures/{id}`
`result`: `PricingStructureResponse` · `200`; `404` if missing.

### 7.4 Update (PATCH, DRAFT only) — `PATCH /platform/pricing-structures/{id}`
Request (`UpdatePricingStructureRequest`): partial — only non-null fields are applied. If
`components` is provided, the **entire** component/tier set is replaced; if omitted, it is left as-is.
```json
{ "name": "Enterprise PMPM 2026 v2", "savings_capture_pct": 15.0,
  "components": [ { "component_type":"CORE_PLATFORM_PMPM","unit":"PER_MEMBER_MONTH",
     "tiers":[ {"tier_number":1,"volume_threshold_min":0,"rate":0.50,"discount_pct":0} ] } ] }
```
`result`: updated `PricingStructureResponse` · `200`. Errors: `409` not DRAFT / duplicate name.

### 7.5 Enable — `POST /platform/pricing-structures/{id}/activate`
`DRAFT → ACTIVE` (idempotent if already ACTIVE). `result`: `PricingStructureResponse` · `200`.
Errors: `409` not DRAFT; `400` no components.

### 7.6 Disable — `POST /platform/pricing-structures/{id}/archive`
`ACTIVE → ARCHIVED` (idempotent if already ARCHIVED). `result`: `PricingStructureResponse` · `200`.
Errors: `409` not ACTIVE.

> All four mutations write an audit entry (`PRICING_STRUCTURE_CREATED/UPDATED/ACTIVATED/ARCHIVED`).

---

## 8. Payer onboarding (DRAFT build-up)
Base: `/platform/payers` · role **PLATFORM_ADMIN**. PRD §5.1–5.6. A Payer is built incrementally in
`DRAFT`; `submit` is the validating gate. The wizard maps to: §8.0 lookups → 8.1 create → 8.2
secondary → 8.7 technical → 8.3 entitlements → 8.4 subscription → 8.5 documents → 8.6 submit, with
per-step assignment in 8.9.

### 8.0 Step-1 lookups & checks

**Duplicate lookup — `GET /platform/payers/tenant-lookup`** — find an existing tenant by legal entity
name and/or Tax/VAT number before creating (PRD §5.1 duplicate detection).

Query params (snake_case): `legal_entity_name`, `tax_vat_number` (supply at least one).
```bash
GET /platform/payers/tenant-lookup?legal_entity_name=Zenith%20Assurance%20PLC&tax_vat_number=VAT-ZEN-001
```
`result` (`TenantLookupResponse`) — match found:
```json
{ "found": true, "matched_by": ["legal_entity_name","tax_vat_number"],
  "tenant": { "tenant_id":4, "tenant_code":"TNT000004", "legal_entity_name":"Zenith Assurance PLC",
    "trading_name":"Zenith", "country":"NG", "tax_vat_number":"VAT-ZEN-001", "subdomain":null,
    "status":"DRAFT", "payer_id":3, "payer_code":"PAY000003", "payer_status":"DRAFT" } }
```
No match → `{ "found": false, "matched_by": [], "tenant": null }` (message `"No matching tenant found"`).
Matching is case-insensitive; `matched_by` lists which field(s) hit. `200`; `400` if neither param given.

**Subdomain check — `GET /platform/payers/subdomain-check?value=`** — sanitise + availability +
suggestions (Section 1 validation).
```json
{ "input":"Acme Health", "sanitised":"acme-health", "reserved":false, "valid":true,
  "available":true, "suggestions":[] }
```
(reserved/taken → `available:false` with `suggestions:["acme-health-za", ...]`.) `200`.

### 8.1 Create payer + primary tenant — `POST /platform/payers` (§5.1)
Request (`CreatePayerRequest`): `payer_type` ∈ `INSURER|TPA|SELF_MANAGED_SCHEME`; `primary_tenant` is a
`TenantDetailsRequest`.
```json
{
  "payer_type": "INSURER",
  "primary_tenant": {
    "legal_entity_name":"Globex Insurance Ltd", "trading_name":"Globex",
    "primary_contact_name":"Gil", "primary_contact_email":"gil@globex.io",
    "country":"ZA", "data_residency_region":"af-south-1", "subdomain":"globex-za",
    "tenant_admin_name":"Gil Admin", "tenant_admin_email":"admin@globex.io",
    "tax_vat_number":"VAT9", "phone":null, "address":null, "website":null,
    "bank": { "account_holder":"Globex","bank_name":"FNB","account_number":"123456","branch_code":"250655","swift_bic":"FIRNZAJJ" }
  }
}
```
`result` (`PayerResponse`):
```json
{ "id":1,"payer_id":"PAY000001","status":"DRAFT","payer_type":"INSURER","primary_tenant_id":1,
  "submitted_by":null,"submitted_at":null,"activated_at":null,
  "tenants":[ { "id":1,"tenant_code":"TNT000001","primary":true,"status":"DRAFT","subdomain":"globex-za",
     "schema_name":null,"data_residency_region":"af-south-1","legal_entity_name":"Globex Insurance Ltd",
     "trading_name":"Globex","country":"ZA","primary_contact_name":"Gil","primary_contact_email":"gil@globex.io",
     "tenant_admin_name":"Gil Admin","tenant_admin_email":"admin@globex.io","documents":[] } ],
  "entitlements":[],"subscription":null,"created_at":"..." }
```
`201`. Errors: `409` subdomain taken / duplicate `(legal_entity_name,country)`; `400` reserved/invalid
subdomain or missing mandatory fields. (Bank fields are stored **encrypted** and never returned.)

> **`subdomain` and `data_residency_region` are optional here** — the wizard collects the subdomain in
> the Technical-config step (§8.7); `submit` requires it. Optionally supply `contacts` (max 2, each
> `{name,email,role_title,receives_invite}`) and `operating_regions:[...]`; if omitted, the
> `primary_contact_*` + `tenant_admin_*` fields seed the two contacts.

### 8.2 Add secondary tenant — `POST /platform/payers/{payer_id}/tenants` (§5.2)
Request: a `TenantDetailsRequest` (same shape as `primary_tenant`). `result`: `PayerResponse` · `201`.
Errors: `409` payer not DRAFT / duplicate subdomain or entity.

### 8.3 Set entitlements — `PUT /platform/payers/{payer_id}/entitlements` (§5.3)
Request (`SetEntitlementsRequest`): replaces the entitlement set; module dependencies auto-resolve.
```json
{ "entitlements": [ { "module_code":"CLAIMS" }, { "module_code":"FINANCE", "submodule_codes":["INVOICING"] } ] }
```
`result`: `PayerResponse` (with `entitlements[]`) · `200`. Errors: `400` unknown module / payer not DRAFT.

### 8.4 Set subscription — `PUT /platform/payers/{payer_id}/subscription` (§5.4)
Request (`SetSubscriptionRequest`): pick an **ACTIVE** pricing structure + model + frequency. The
chosen structure's price is **frozen** as an immutable snapshot.
```json
{ "pricing_structure_id":1, "subscription_model":"PER_CLAIM", "billing_frequency":"MONTHLY" }
```
`subscription_model` ∈ `PMPM|PER_CLAIM|PCT_GWP`; `billing_frequency` ∈ `MONTHLY|QUARTERLY|ANNUALLY`.
`result`: `PayerResponse` (with `subscription`) · `200`. Errors: `400` no entitlements yet,
`PER_CLAIM` without CLAIMS enabled, or structure not ACTIVE; `404` unknown structure.

### 8.5 Upload a document — `POST /platform/payers/{payer_id}/tenants/{tenant_id}/documents` (§5.5)
Request (`AddDocumentRequest`): metadata only (bytes go to the document store via a port).
```json
{ "category":"SIGNED_CONTRACT", "file_name":"contract.pdf", "description":null, "expiry_date":"2027-01-01" }
```
`result`: `PayerResponse` (document under its tenant, `status:"PENDING_REVIEW"`) · `201`.

### 8.6 Submit (Review & submit) — `POST /platform/payers/{payer_id}/submit` (§5.6)
No body. **Review-flow gate:** every required onboarding section except `review` must be COMPLETE
(`technical, modules, billing, documents`, plus `primary`) — i.e. the wizard's "all sections
complete". If not, returns **`400`** listing the incomplete sections, e.g.
`"Cannot submit — incomplete required sections: [documents]"`. It also re-checks the underlying data
(every tenant has a subdomain; primary has all required KYB categories `SIGNED_CONTRACT`,
`COMPANY_REGISTRATION`, `PROOF_OF_ADDRESS`, `DIRECTOR_SHAREHOLDER_ID`). On success it stamps
`submitted_by/at` (status stays `DRAFT`), completes the `review` step, emits `PayerSubmitted`, and the
payer appears in the approver queue (§9.4). `result`: `PayerResponse` · `200`; `409` if not DRAFT.

> Drive the Review screen from `GET …/{id}/steps`: render the section tracker from `steps[]`/
> `completed_steps`/`incomplete_steps`, show `progress_pct`, and enable Submit when
> `ready_to_submit == true`.

### 8.7 Technical config (Step 3) — `PATCH /platform/payers/{payer_id}/tenants/{tenant_id}/technical`
Sets the tenant's subdomain + infrastructure config; completes the `technical` step.
```json
{ "subdomain":"acme-health", "custom_domain":"acme.health", "isolation_tier":"SCHEMA",
  "deployment_cluster":"af-1", "region_id":"af-west-1", "owner_team":"Platform",
  "priority":"HIGH", "environment":"PRODUCTION" }
```
`result`: `PayerResponse` (tenant now carries the technical fields) · `200`. Errors: `409` subdomain
taken / payer not DRAFT; `400` reserved/invalid subdomain.

### 8.8 Activate secondary tenant (§5.12.1) — `POST /platform/payers/{payer_id}/tenants/{tenant_id}/activate`
Activates a secondary tenant added to an **active** payer (`PENDING_ACTIVATION` → provisions its
schema + Tenant Admin → `ACTIVE`). `result`: `PayerResponse` · `200`.

### 8.9 Onboarding steps & assignment — `/platform/payers/{payer_id}/steps`
Seven steps per payer (`primary, secondary, technical, modules, billing, documents, review`), each
with an `owner_role` (`profile|tech|compliance`) and a `required` flag (`secondary` is optional).
**Steps are filled independently, in any order, and each is counted COMPLETE the moment its data is
saved** — `primary` on create, `technical` on technical-config, `modules` on entitlements, `billing`
on subscription, `documents` once all required KYB categories are uploaded (partial → `IN_PROGRESS`),
`secondary` on adding a secondary, `review` on submit. `completed_by`/`completed_at` capture who/when.
You can also assign or force a step manually.

| Method | Path | Purpose |
| :----- | :--- | :------ |
| GET | `/steps` | step list + progress + done/incomplete (`OnboardingProgressResponse`) |
| POST | `/steps/{step_key}/assign` | assign a step to a member — `{ "assignee":"engineer@ginja.ai" }` |
| POST | `/steps/{step_key}/complete` | mark a step complete manually |

`result` (`OnboardingProgressResponse`):
```json
{ "payer_id":2, "completed":5, "total":7, "progress_pct":71,
  "required_completed":5, "required_total":6, "all_required_complete":false, "ready_to_submit":true,
  "completed_steps":["primary","technical","modules","billing","documents"],
  "incomplete_steps":["secondary","review"],
  "steps":[ { "step_id":"OST000003","step_key":"technical","owner_role":"tech","sort_order":3,
     "required":true,"status":"COMPLETE","complete":true,"assignee":"engineer@ginja.ai",
     "assigned_by":"1","completed_by":"1","completed_at":"..." }, ... ] }
```
`completed_steps`/`incomplete_steps` give the done-vs-incomplete view; `all_required_complete` is true
when every required step is done (the optional `secondary` is excluded); **`ready_to_submit`** is true
when every required step except `review` is done — use it to enable the Review screen's Submit button.

---

## 9. Approval & auto-activation
Base: `/platform/payers/{payer_id}` · role **PLATFORM_APPROVER** (distinct from the submitter). PRD §5.7–5.8.
Request body for all three (`ApprovalActionRequest`): `{ "comment": "..." }` — optional for approve,
**mandatory** for reject / request-info.

### 9.1 Approve → activate — `POST /platform/payers/{payer_id}/approve`
Records the decision, then **auto-activates**: provisions each tenant's `tenant_<subdomain>` schema,
creates the Tenant Admin **inside that schema**, creates billing on the primary, emits
`TenantActivated`/`PayerActivated`. `result`: `PayerResponse` now `ACTIVE` with each tenant `ACTIVE`
and a populated `schema_name` · `200`.
Errors: **`403`** if the caller submitted this payer (separation of duties) or lacks
`PLATFORM_APPROVER`; `409` if not awaiting approval.

### 9.2 Reject — `POST /platform/payers/{payer_id}/reject`
Mandatory `comment`. Clears the submission marker (admin can correct & re-submit). `result`:
`PayerResponse` · `200`; `400` missing comment; `403` SoD.

### 9.3 Request information — `POST /platform/payers/{payer_id}/request-info`
Mandatory `comment`. Clears the submission marker. `result`: `PayerResponse` · `200`.

### 9.4 Approver queue — `GET /platform/approvals`
Role **PLATFORM_APPROVER**. Lists payers submitted and awaiting a decision. `result`: array of
`PayerResponse` · `200`.

## 9b. Payer lifecycle (§5.14–5.15) — role **PLATFORM_ADMIN**

| Method | Path | Body | Effect |
| :----- | :--- | :--- | :----- |
| POST | `/platform/payers/{id}/suspend` | `{ "reason":"NON_PAYMENT" }` (`NON_PAYMENT\|COMPLIANCE\|SECURITY\|OTHER`) | `ACTIVE→SUSPENDED`; revokes all tenant sessions; emits `PayerSuspended` |
| POST | `/platform/payers/{id}/reactivate` | — | `SUSPENDED→ACTIVE`; emits `PayerReactivated` |
| POST | `/platform/payers/{id}/retire` | `{ "reason":"..." }` (mandatory) | `SUSPENDED→RETIRED`; tenants RETIRED; emits `PayerRetired` |

`result`: `PayerResponse` · `200`. Errors: `409` illegal transition; `400` missing retire reason.

---

## 10. Tenant login
`POST /tenant/auth/login` — _public_. Off the `/platform/**` prefix so it runs in the tenant schema.

Request (`TenantLoginRequest`):
```json
{ "subdomain":"globex-za", "email":"admin@globex.io", "password":"<set on first login>" }
```
Resolves the tenant by subdomain (must be `ACTIVE`), authenticates against `tenant_<subdomain>`, opens
the session **in that schema**, and issues a JWT with the `tenant_id` claim — so the holder's later
requests (and their audit) route to their tenant schema. `result`: `LoginResponse` · `200`; `400`
unknown/inactive tenant or bad credentials (uniform error).
> Tenant Admins are created `INVITED` at activation; setting their first password (and MFA) is the
> deferred first-login flow (PRD §5.10).

---

## 11. End-to-end walkthrough (copy-paste, dev profile)

```bash
B=http://localhost:8082/api/v1            # adjust port if the log shows another
tok(){ python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])"; }
res(){ python3 -c "import sys,json;print(json.load(sys.stdin)['result'])"; }

# --- tokens ---------------------------------------------------------------
ADMIN=$(curl -s -X POST "$B/dev/token?subject=alice&roles=PLATFORM_ADMIN" | tok)
APPROVER=$(curl -s -X POST "$B/dev/token?subject=bob&roles=PLATFORM_APPROVER" | tok)
AH="Authorization: Bearer $ADMIN"; PH="Authorization: Bearer $APPROVER"; J="Content-Type: application/json"

# --- Access & Control -----------------------------------------------------
curl -s -X POST "$B/platform/organization/functionalities" -H "$AH" -H "$J" \
  -d '{"code":"BILLING","name":"Billing"}'
curl -s -X POST "$B/platform/organization/roles" -H "$AH" -H "$J" \
  -d '{"name":"Finance Operator","functionality_codes":["FINANCE","BILLING"]}'        # → role_id in result.id
curl -s -X POST "$B/platform/organization/members" -H "$AH" -H "$J" \
  -d '{"email":"ops@ginja.ai","full_name":"Ops User","password":"Ops@12345","role_ids":[2]}'
curl -s "$B/platform/organization/members" -H "$AH"
curl -s -X DELETE "$B/platform/organization/roles/2/functionalities/BILLING" -H "$AH"

# --- Pricing --------------------------------------------------------------
curl -s "$B/platform/pricing-structures" -H "$AH"                                     # pick result[].id

# --- Payer onboarding -----------------------------------------------------
PAYER=$(curl -s -X POST "$B/platform/payers" -H "$AH" -H "$J" -d '{
  "payer_type":"INSURER",
  "primary_tenant":{"legal_entity_name":"Globex Insurance Ltd","trading_name":"Globex","primary_contact_name":"Gil",
   "primary_contact_email":"gil@globex.io","country":"ZA","data_residency_region":"af-south-1","subdomain":"globex-za",
   "tenant_admin_name":"Gil Admin","tenant_admin_email":"admin@globex.io"}}' | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['id'])")
curl -s -X PUT "$B/platform/payers/$PAYER/entitlements" -H "$AH" -H "$J" \
  -d '{"entitlements":[{"module_code":"CLAIMS"},{"module_code":"FINANCE"}]}'
curl -s -X PUT "$B/platform/payers/$PAYER/subscription" -H "$AH" -H "$J" \
  -d '{"pricing_structure_id":1,"subscription_model":"PER_CLAIM","billing_frequency":"MONTHLY"}'
curl -s -X POST "$B/platform/payers/$PAYER/tenants/1/documents" -H "$AH" -H "$J" \
  -d '{"category":"SIGNED_CONTRACT","file_name":"contract.pdf"}'
curl -s -X POST "$B/platform/payers/$PAYER/submit" -H "$AH"

# --- Approval → auto-activation (must be a DIFFERENT user) -----------------
curl -s -X POST "$B/platform/payers/$PAYER/approve" -H "$PH" -H "$J" -d '{"comment":"verified"}'
curl -s "$B/platform/payers/$PAYER" -H "$AH"          # status ACTIVE, tenant schema_name populated
```

---

## 12. Endpoint matrix (CRUD coverage)

| Resource | Create | Get all | Get one | Update | Delete |
| :------- | :----- | :------ | :------ | :----- | :----- |
| Functionality | `POST /platform/organization/functionalities` | `GET …/functionalities` | — | — | — |
| Role | `POST …/roles` | `GET …/roles` | `GET …/roles/{id}` | `PATCH …/roles/{id}`, `POST …/roles/{id}/functionalities`, `POST …/roles/{id}/permissions` | `DELETE …/roles/{id}` (custom), `DELETE …/roles/{id}/functionalities/{code}`, `DELETE …/roles/{id}/permissions/{code}` |
| Permission | `POST …/permissions` | `GET …/permissions` | `GET …/permissions/{id}` | (assign via role) | `DELETE …/permissions/{id}` |
| Member / User | `POST …/members` | `GET …/members` | `GET …/members/{id}` | `PUT …/{id}/status\|password`, `POST …/{id}/roles\|invite\|resend-invite\|revoke-invite` | `DELETE …/members/{id}`, `DELETE …/{id}/roles/{role_id}` |
| Invitation | `POST …/members/{id}/invite` | — | — | `POST …/{id}/resend-invite`, accept `POST /auth/accept-invite` | `POST …/{id}/revoke-invite` |
| Session | (via login) | `GET …/auth/me/sessions`, `GET …/members/{id}/sessions` | — | — | `POST …/auth/logout`, `POST …/members/{id}/sessions/revoke` |
| Audit log | (system-written) | `GET …/audit-logs` | — | — | — |
| Pricing structure | `POST /platform/pricing-structures` | `GET /platform/pricing-structures` (`?status=`) | `GET …/{id}` | `PATCH …/{id}` (DRAFT), `POST …/{id}/activate` (enable), `POST …/{id}/archive` (disable) | — |
| Payer | `POST /platform/payers` | `GET /platform/payers`, `GET /platform/approvals` | `GET /platform/payers/{id}`, lookup `GET …/tenant-lookup`, `GET …/subdomain-check` | `PUT …/entitlements`, `PUT …/subscription`, `POST …/submit`, `POST …/approve\|reject\|request-info`, `POST …/suspend\|reactivate\|retire` | — |
| Tenant | `POST /platform/payers/{id}/tenants` | (within `PayerResponse.tenants`) | (within payer) | `PATCH …/tenants/{tid}/technical`, `POST …/tenants/{tid}/activate` | — |
| Onboarding step | (seeded on payer create) | `GET …/{id}/steps` | (within steps) | `POST …/steps/{key}/assign`, `POST …/steps/{key}/complete` | — |
| Document | `POST /platform/payers/{id}/tenants/{tid}/documents` | (within `TenantResponse.documents`) | — | — | — |

**Still pending (planned P3–P7):** payer/tenant **org-detail edits** + entitlement changes on active
payers + **maker-checker** (§5.11–5.13); **tenant first-login** (set password/MFA) + platform MFA/
password/session **policies** (§5.9–5.10.1); **module registry** CRUD (sub-modules/dependencies);
**notification templates**; **dashboard** aggregates; functionality/role rename & delete. See
`docs/SCREEN_API_GAP_ANALYSIS.md` (§8) and `docs/PAYER_CONTROL_PLANE.md`.

_(Done since M1: pricing CRUD; lifecycle suspend/reactivate/retire; approvals queue;
add-secondary-to-active; subscription FLAT/HYBRID + overrides; onboarding technical-config,
subdomain-check, tenant-lookup, contacts, required-doc gate, and per-step assignment.)_
