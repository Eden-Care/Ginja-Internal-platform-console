# Control Plane API — Payer Onboarding & Lifecycle

APIs for the Tenant & Org Control Plane (Payer Account), listed **in workflow sequence**.
Reflects **Milestone 1** (PRD §5.1–5.8). Later workflows (§5.9–5.15) are marked _Planned_.

- **Base URL:** `http://localhost:8082/api/v1` (server `context-path = /api/v1`)
- **Auth:** Bearer JWT. Platform endpoints require role `PLATFORM_ADMIN` or `PLATFORM_APPROVER`
  (from the JWT `roles` claim). Tenant-scoped endpoints require a `tenant_id` claim.
- **Content type:** `application/json`
- **Response envelope:** **every** response (success and error) is wrapped in a standard
  [`Response`](#response-envelope) object — the payloads shown below appear inside its `result` field.
- **Schemas:** control-plane data lives in `public`; each tenant's business data lives in its own
  `tenant_<subdomain>` schema, provisioned on activation.

---

## Response envelope

All endpoints return the same wrapper. On success the DTO/list is under `result`; on error the
details are under `errorDetails` and `success` is `false`.

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "result": { /* the endpoint's payload — DTO, list, etc. */ },
  "errorDetails": null
}
```

| Field | Type | Notes |
| :---- | :--- | :---- |
| `status` | int | Mirrors the HTTP status code (e.g. `200`, `201`, `400`) |
| `success` | boolean | `true` for 2xx, `false` for errors |
| `message` | string | Human-readable message (error summary; may be `null` on success) |
| `result` | object/array | The endpoint payload on success; `null` on error |
| `errorDetails` | object | Error specifics (e.g. field → message map for validation); `null` on success |

> In the per-endpoint sections below, the documented JSON is the **`result`** payload. The HTTP
> status code equals the envelope's `status`.

---

## 0. Authentication (dev helper)

> Dev profile only. Mints HS256 tokens so the flows can be exercised without a real IdP. In other
> environments, obtain tokens from your identity provider; the tenant claim is `tenant_id` and roles
> are in the `roles` claim.

### 0.1 Mint a token
`POST /dev/token` — _public (dev only)_

Query params:

| Param | Required | Notes |
| :---- | :------- | :---- |
| `subject` | no (default `dev-user`) | JWT `sub` — used for audit + separation-of-duties |
| `roles` | no | Comma-separated, e.g. `PLATFORM_ADMIN` or `PLATFORM_APPROVER` |
| `tenant` | no | Sets `tenant_id` claim → resolves a tenant schema. Omit for platform tokens |

```bash
# Platform Admin and Approver (note: different subjects, no tenant claim)
curl -X POST "$B/dev/token?subject=alice&roles=PLATFORM_ADMIN"
curl -X POST "$B/dev/token?subject=bob&roles=PLATFORM_APPROVER"
# Tenant user token
curl -X POST "$B/dev/token?tenant=globex-trade-za"
```

Response (the dev helper returns this **directly**, not wrapped in the envelope):
`{ "accessToken": "...", "tenantId": null, "roles": ["PLATFORM_ADMIN"] }`

---

## Onboarding sequence (Platform Admin)

> All endpoints below require role **`PLATFORM_ADMIN`** unless noted. The Payer is built up
> incrementally in `DRAFT`; `submit` is the validating gate.

### 1. Enter primary tenant details — §5.1
`POST /platform/payers`

Creates a `DRAFT` Payer account and its **primary** tenant.

Request body:
```json
{
  "payerType": "INSURER",
  "legalEntityName": "Globex Insurance Ltd",
  "tradingName": "Globex",
  "primaryContactName": "Gil Globex",
  "primaryContactEmail": "gil@globex.io",
  "country": "ZA",
  "dataResidencyRegion": "af-south-1",
  "subdomain": "globex-trade-za",
  "tenantAdminName": "Gil",
  "tenantAdminEmail": "admin@globex.io",
  "taxVatNumber": "VAT9",
  "phone": null, "address": null, "website": null,
  "bank": {
    "accountHolder": "Globex Insurance Ltd", "bankName": "FNB",
    "accountNumber": "123456", "branchCode": "250655", "swiftBic": "FIRNZAJJ"
  }
}
```
Mandatory: `payerType`, `legalEntityName`, `primaryContactName`, `primaryContactEmail` (email),
`country` (2 chars), `dataResidencyRegion`, `subdomain`, `tenantAdminName`, `tenantAdminEmail`.
`tradingName`, `taxVatNumber`, `phone`, `address`, `website`, `bank` are optional at this step.

Behaviour / edge cases:
- Subdomain is sanitised (lowercased, invalid chars → `-`); **reserved** subdomains
  (`www, api, admin, app, mail, staging`) → `400`.
- Subdomain already taken → `409`.
- Duplicate `legalEntityName` + `country` → `409`.

Response `201`: a **Payer Summary** (see [schema](#payer-summary)).

### 2. Add secondary tenant(s) — §5.2
`POST /platform/payers/{payerId}/tenants`

Adds a secondary tenant linked via `parent_tenant_id`. `payerType` and `dataResidencyRegion`
inherit from the primary when omitted.

Request body: same shape as §5.1 minus the payer-level concerns (`payerType` optional):
```json
{
  "legalEntityName": "Globex Sub Pty",
  "primaryContactName": "Sub Contact",
  "primaryContactEmail": "sub@globex.io",
  "country": "ZA",
  "subdomain": "globex-sub",
  "tenantAdminName": "Sub Admin",
  "tenantAdminEmail": "subadmin@globex.io"
}
```
Response `201`: a **Tenant View**. Repeat for each secondary tenant.

### 3. Assign module entitlements — §5.3
`PUT /platform/payers/{payerId}/entitlements`

Entitlements apply to the primary **and all secondary tenants**. Replaces any prior selection.
Module dependencies are auto-added (e.g. `ADVANCED_REPORTING` pulls in `CORE_REPORTING`).

Request body:
```json
{ "entitlements": [
  { "moduleCode": "CLAIMS", "submoduleCode": "ADJUDICATION" },
  { "moduleCode": "ADVANCED_REPORTING", "submoduleCode": null }
] }
```
- Unknown module/sub-module → `400`.
- Catalogue available at `GET /platform/modules` (below).

Response `200`: list of **Entitlement View** `{ moduleCode, submoduleCode, enabled }`.

### 4. Select subscription & billing frequency — §5.4
`PUT /platform/payers/{payerId}/subscription`

Binds the Payer (primary tenant) to a **configured, ACTIVE [Pricing Structure](#pricing-structures-platform-admin)**
and a billing frequency. The structure's terms are **frozen as an immutable snapshot** on the
subscription, so later edits/archival of the structure don't change this Payer's agreed pricing.

Request body:
```json
{ "pricingStructureId": "uuid", "billingFrequency": "MONTHLY" }
```
- `pricingStructureId`: id of a pricing structure in **ACTIVE** status (author it first — see below).
- `billingFrequency`: `MONTHLY | QUARTERLY | ANNUALLY`
- Pricing structure not found → `404`; not `ACTIVE` → `400`.
- If the structure prices claims (has `CLAIMS_OUTPATIENT`/`CLAIMS_INPATIENT` components) the `CLAIMS`
  module must be enabled → otherwise `400`.

Response `200` (`result`):
```json
{ "pricingStructureId": "uuid", "pricingStructureName": "Transaction-Based 2026",
  "pricingModel": "TRANSACTION_BASED", "billingFrequency": "MONTHLY" }
```

> **Prerequisite:** a Pricing Structure must be authored and activated first. See
> [Pricing Structures](#pricing-structures-platform-admin).

### 5. Upload contract & KYB documents — §5.5
`POST /platform/payers/{payerId}/tenants/{tenantId}/documents`

Captures document metadata per tenant (bytes go to the document store; M1 stores a reference).

Request body:
```json
{
  "category": "SIGNED_CONTRACT",
  "filename": "contract.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 1024,
  "description": "Master services agreement",
  "expiryDate": "2027-01-01"
}
```
- Allowed `contentType`: `application/pdf, image/jpeg, image/png`. Otherwise → `400`.
- `sizeBytes` > 25 MB → `400`.
- Document is stored with status `PENDING_REVIEW`.

Response `201`: a **Document View** `{ id, category, filename, status, expiryDate }`.

**Checklist** for a tenant: `GET /platform/payers/{payerId}/tenants/{tenantId}/documents`
(role `PLATFORM_ADMIN` or `PLATFORM_APPROVER`) → list of Document Views.

### 6. Review & submit — §5.6
`GET /platform/payers/{payerId}` → read-only **Payer Summary** for review (admin or approver).

`POST /platform/payers/{payerId}/submit`

Validates completeness (subscription set, ≥1 entitlement, ≥1 document per tenant), stamps
`submittedBy` + `submittedAt`, emits `PayerSubmitted`. Payer stays `DRAFT` and enters the approver
queue.

- Incomplete submission → `400`.

Response `200`: **Payer Summary** with `submittedBy`/`submittedAt` populated.

---

## Verification & activation (Platform Approver)

> Require role **`PLATFORM_APPROVER`**. **Separation of duties:** the submitting admin cannot
> approve their own submission (→ `403`).

### 7. Verify & approve / reject — §5.7
`POST /platform/payers/{payerId}/approve`

Body (optional): `{ "comment": "looks good" }`
Approves every tenant + its documents and **auto-triggers activation (§5.8)** in the same
transaction.
- Submitter approving own payer → `403`.
- Payer not submitted / not `DRAFT` → `409`.

Response `200`: **Payer Summary** now `ACTIVE` with tenant `schemaName`s populated.

`POST /platform/payers/{payerId}/reject` — Body `{ "comment": "reason (required)" }` → records
rejection; emits `PayerRejected`. `400` if comment blank.

`POST /platform/payers/{payerId}/request-info` — Body `{ "comment": "what's needed (required)" }` →
records `INFORMATION_REQUIRED`, clears the submission marker so the admin can correct and re-submit;
emits `PayerInformationRequired`.

### 8. System auto-activates — §5.8 (automatic — no endpoint)
Triggered by step 7 approval. For each tenant: provisions a `tenant_<subdomain>` schema and runs
tenant migrations, creates the Tenant Admin (IAM), sends the activation invite. Creates the billing
account against the primary. Transitions Payer + all tenants `DRAFT → ACTIVE`. Emits
`TenantActivated` (per tenant) and `PayerActivated`. On failure the transaction rolls back to
`DRAFT` (schema provisioning is idempotent).

---

## Pricing Structures (Platform Admin)

Configurable, **platform-global** pricing catalogue (per the *Pricing Structure* commercial doc):
a top-level model, flat fees, savings-capture %, and a **tiered volume-discount schedule** per
component. Authored once and referenced by any Payer's subscription (step 4). Lifecycle:
`DRAFT → ACTIVE → ARCHIVED`. Only **ACTIVE** structures can be attached to a subscription; only
**DRAFT** structures can be edited.

| Method & path | Role | Purpose |
| :------------ | :--- | :------ |
| `POST /platform/pricing-structures` | ADMIN | Create a structure (starts `DRAFT`) |
| `PUT /platform/pricing-structures/{id}` | ADMIN | Update (only while `DRAFT`) |
| `POST /platform/pricing-structures/{id}/activate` | ADMIN | `DRAFT → ACTIVE` (≥1 component required) |
| `POST /platform/pricing-structures/{id}/archive` | ADMIN | → `ARCHIVED` |
| `GET /platform/pricing-structures` | ADMIN/APPROVER | List (optional `?status=DRAFT\|ACTIVE\|ARCHIVED`) |
| `GET /platform/pricing-structures/{id}` | ADMIN/APPROVER | Single structure |

Create/update body:
```json
{
  "name": "Transaction-Based 2026",
  "description": "PMPM + per-claim, transaction based",
  "currency": "USD",
  "model": "TRANSACTION_BASED",
  "platformAnnualFee": null,
  "implementationFee": 400000,
  "savingsCapturePct": 15,
  "growthRatePct": 5,
  "notes": null,
  "components": [
    { "componentType": "CORE_PLATFORM_PMPM", "unit": "PER_MEMBER_PER_MONTH", "tiers": [
        { "tierNumber": 1, "volumeThresholdMin": 0,      "rate": 0.50, "discountPct": 0 },
        { "tierNumber": 2, "volumeThresholdMin": 50000,  "rate": 0.45, "discountPct": -10.0 },
        { "tierNumber": 4, "volumeThresholdMin": 300000, "rate": 0.37, "discountPct": -26.0 } ] },
    { "componentType": "CLAIMS_OUTPATIENT", "unit": "PER_CLAIM", "tiers": [
        { "tierNumber": 1, "volumeThresholdMin": 0,      "rate": 1.20 },
        { "tierNumber": 2, "volumeThresholdMin": 100000, "rate": 1.10, "discountPct": -8.3 } ] },
    { "componentType": "CLAIMS_INPATIENT", "unit": "PER_CLAIM", "tiers": [
        { "tierNumber": 1, "volumeThresholdMin": 0, "rate": 11.15 } ] }
  ]
}
```

Enums:
- `model`: `TRANSACTION_BASED | PCT_GWP`
- `componentType`: `CORE_PLATFORM_PMPM | CLAIMS_OUTPATIENT | CLAIMS_INPATIENT | GWP_PERCENTAGE`
- `unit`: `PER_MEMBER_PER_MONTH | PER_CLAIM | PERCENT_OF_GWP`
- `volumeThresholdMin` is the **inclusive lower bound** of the tier; `rate` is `$` (PMPM/per-claim)
  or `%` (GWP); `discountPct` is informational.

Edge cases: duplicate `name` → `409`; editing a non-`DRAFT` structure → `409`; activating with no
components → `400`.

> **Note (v1):** this configures and stores the pricing definition. Tier resolution / invoice
> amounts (given member & claim volumes) are computed downstream by the Finance module — no
> calculation endpoint is exposed yet.

---

## Read / utility endpoints

| Method & path | Role | Purpose |
| :------------ | :--- | :------ |
| `GET /platform/payers` | ADMIN or APPROVER | List all Payer summaries |
| `GET /platform/payers/{payerId}` | ADMIN or APPROVER | Single Payer summary (review view) |
| `GET /platform/payers/{payerId}/tenants/{tenantId}/documents` | ADMIN or APPROVER | Per-tenant document checklist |
| `GET /platform/modules` | ADMIN or APPROVER | Module catalogue (code, name, submodules, dependsOn) |

---

## Tenant-scoped data (post-activation, illustrative)

> Require a tenant token (`tenant_id` claim). Demonstrates that data lands in the tenant's schema.

| Method & path | Purpose |
| :------------ | :------ |
| `POST /users` | Create a user in the caller's tenant schema |
| `GET /users` | List users in the caller's tenant schema |

---

## Planned (not yet implemented)

| Workflow | Endpoint (proposed) | Milestone |
| :------- | :------------------ | :-------- |
| §5.9 Tenant Admin receives invite | `POST /platform/payers/{id}/tenants/{tid}/invitations:resend` | M2 |
| §5.10 Tenant Admin first login | `POST /tenant/account-setup` (token-based) | M2 |
| §5.11 Tenant Admin updates org | `PATCH /tenant/organisation` | M3 |
| §5.12 Platform Admin updates org | `PATCH /platform/payers/{id}/tenants/{tid}` (maker-checker) | M3/M4 |
| §5.12.1 Add secondary to active Payer | `POST /platform/payers/{id}/tenants` (PENDING_ACTIVATION path) | M5 |
| §5.13 Update entitlements (active) | `PUT /platform/payers/{id}/entitlements` (maker-checker) | M4 |
| §5.12.1/5.13.1 Maker-checker queue | `GET /platform/changes`, `POST /platform/changes/{id}/approve` | M4 |
| §5.14 Suspend | `POST /platform/payers/{id}/suspend` | M5 |
| §5.15 Retire | `POST /platform/payers/{id}/retire` | M5 |

---

## Schemas

### Payer Summary
```json
{
  "id": "uuid",
  "status": "DRAFT | ACTIVE | SUSPENDED | RETIRED",
  "payerType": "INSURER",
  "primaryTenantId": "uuid",
  "submittedBy": "alice",
  "submittedAt": "2026-06-03T15:12:18Z",
  "activatedAt": "2026-06-03T15:12:18Z",
  "tenants": [ /* Tenant View */ ],
  "entitlements": [ { "moduleCode": "CLAIMS", "submoduleCode": "ADJUDICATION", "enabled": true } ],
  "subscription": { "pricingStructureId": "uuid", "pricingStructureName": "Transaction-Based 2026", "pricingModel": "TRANSACTION_BASED", "billingFrequency": "MONTHLY" }
}
```

### Tenant View
```json
{
  "id": "uuid",
  "primary": true,
  "status": "DRAFT | PENDING_ACTIVATION | ACTIVE | SUSPENDED | RETIRED",
  "legalEntityName": "Globex Insurance Ltd",
  "tradingName": "Globex",
  "subdomain": "globex-trade-za",
  "schemaName": "tenant_globex_trade_za",
  "country": "ZA",
  "dataResidencyRegion": "af-south-1",
  "tenantAdminEmail": "admin@globex.io",
  "documents": [ { "id": "uuid", "category": "SIGNED_CONTRACT", "filename": "contract.pdf", "status": "APPROVED", "expiryDate": null } ]
}
```

---

## Error model

Errors are returned in the same [`Response` envelope](#response-envelope) with `success: false`,
handled centrally by `GlobalExceptionHandler`:

```json
{
  "status": 400,
  "success": false,
  "message": "Validation failed",
  "result": null,
  "errorDetails": { "primaryContactEmail": "must be a well-formed email address" }
}
```
(`errorDetails` carries a field → message map for bean-validation failures; it is `null` for the
domain errors below, whose `message` describes the problem.)

| Status | When |
| :----- | :--- |
| `400` | Validation failure (bad fields, reserved/invalid subdomain, incompatible subscription, unknown module, incomplete submission) |
| `403` | Separation of duties (submitter approving own Payer); missing role |
| `404` | Payer/tenant not found |
| `409` | Duplicate subdomain or legal-entity+country; illegal state transition; payer not in expected status |

---

## End-to-end example (sequence)

```bash
B=http://localhost:8082/api/v1
tok() { curl -s -X POST "$B/dev/token?$1" | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])"; }
ADMIN=$(tok "subject=alice&roles=PLATFORM_ADMIN");    HADM=(-H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json')
APPROVER=$(tok "subject=bob&roles=PLATFORM_APPROVER"); HAPP=(-H "Authorization: Bearer $APPROVER" -H 'Content-Type: application/json')
# platform responses are wrapped: the payload is under .result
id() { python3 -c "import sys,json;print(json.load(sys.stdin)['result']['$1'])"; }

# 1. primary
PJ=$(curl -s -X POST "$B/platform/payers" "${HADM[@]}" -d '{"payerType":"INSURER","legalEntityName":"Globex Insurance Ltd","primaryContactName":"Gil","primaryContactEmail":"gil@globex.io","country":"ZA","dataResidencyRegion":"af-south-1","subdomain":"globex-trade-za","tenantAdminName":"Gil","tenantAdminEmail":"admin@globex.io"}')
PID=$(echo "$PJ" | id id); PRIMARY=$(echo "$PJ" | id primaryTenantId)
# 2. secondary
SEC=$(curl -s -X POST "$B/platform/payers/$PID/tenants" "${HADM[@]}" -d '{"legalEntityName":"Globex Sub Pty","primaryContactName":"S","primaryContactEmail":"s@globex.io","country":"ZA","subdomain":"globex-sub","tenantAdminName":"S","tenantAdminEmail":"s@globex.io"}' | id id)
# (one-time) author + activate a pricing structure to reference
PSID=$(curl -s -X POST "$B/platform/pricing-structures" "${HADM[@]}" -d '{"name":"Transaction-Based 2026","model":"TRANSACTION_BASED","implementationFee":400000,"savingsCapturePct":15,"components":[{"componentType":"CLAIMS_OUTPATIENT","unit":"PER_CLAIM","tiers":[{"tierNumber":1,"volumeThresholdMin":0,"rate":1.20}]}]}' | id id)
curl -s -X POST "$B/platform/pricing-structures/$PSID/activate" "${HADM[@]}"
# 3. entitlements  4. subscription (references the ACTIVE structure)
curl -s -X PUT "$B/platform/payers/$PID/entitlements" "${HADM[@]}" -d '{"entitlements":[{"moduleCode":"CLAIMS","submoduleCode":"ADJUDICATION"},{"moduleCode":"ADVANCED_REPORTING"}]}'
curl -s -X PUT "$B/platform/payers/$PID/subscription" "${HADM[@]}" -d "{\"pricingStructureId\":\"$PSID\",\"billingFrequency\":\"MONTHLY\"}"
# 5. documents (per tenant)
curl -s -X POST "$B/platform/payers/$PID/tenants/$PRIMARY/documents" "${HADM[@]}" -d '{"category":"SIGNED_CONTRACT","filename":"c.pdf","contentType":"application/pdf","sizeBytes":1024}'
curl -s -X POST "$B/platform/payers/$PID/tenants/$SEC/documents"     "${HADM[@]}" -d '{"category":"COMPANY_REGISTRATION","filename":"r.pdf","contentType":"application/pdf","sizeBytes":2048}'
# 6. submit
curl -s -X POST "$B/platform/payers/$PID/submit" "${HADM[@]}"
# 7. approve (different user) -> 8. auto-activate
curl -s -X POST "$B/platform/payers/$PID/approve" "${HAPP[@]}" -d '{"comment":"ok"}'
```
