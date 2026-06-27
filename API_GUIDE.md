# Ginja Platform Console — API Guide (end-to-end)

Covers every endpoint across **Access & Control** (auth, module registry, roles, members, audit),
**Pricing**, and **Tenant/Payer onboarding**. Each entry lists method, path, required role, request
body, the `result` payload, and status codes, followed by a full copy-paste walkthrough.

> **Companion docs:** for the step-by-step ordering of all flows and their dependencies see
> [`PLATFORM_FLOWS.md`](PLATFORM_FLOWS.md); for the provisioning + technical-review + approval
> deep-dive see [`PROVISIONING_APPROVAL_FLOW.md`](PROVISIONING_APPROVAL_FLOW.md). This guide remains
> the canonical request/response reference.

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
  **GET** endpoints (members, roles, permissions, modules, audit) but no writes.
- **Status codes:** `200` OK · `201` Created · `400` validation/bad input · `401` unauthenticated /
  revoked session · `403` wrong role or separation-of-duties · `404` not found · `409` conflict
  (duplicate / illegal state transition) · `500` unexpected.
- **Business identifiers:** every entity has a numeric `id` (used in paths/FKs) and a human-readable
  code (`MBR…`, `ROL…`, `MRC…` (module), `SMD…` (sub-module), `PAY…`, `TNT…`, `SUB…`, `PRC…`, `DOC…`, `REV…`, `AUD…`).

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
  "member_id":1, "email":"admin@ginja.ai", "roles":["PLATFORM_ADMIN"],
  "accessible_modules":["TENANT_MANAGEMENT","APPROVALS","CONFIG_LIBRARY","ACCESS_SECURITY","OBSERVABILITY"] }
```
- `200` on success; `400` invalid credentials / inactive member / **account locked** / **password expired**
  (per the security policy — §10B.1). Session lifetime + idle timeout come from the policy.
- **MFA:** when MFA applies, the `result` is an **`MfaChallengeResponse`** (message `"MFA required"`), not a
  token — complete login via §2.7. Otherwise it's the `LoginResponse` below.
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
unexpired), sets the member's password and activates them. The password must satisfy the security
policy (§10B.1) — complexity + no-reuse — else `400`. `200`; `400` invalid/expired token or weak/reused password.

### 2.7 Multi-factor authentication (TOTP + SMS + WebAuthn)
When the security policy has MFA required (or the member has enrolled), **§2.2 login returns an
`MfaChallengeResponse` instead of an access token** — the password step succeeds but no session is opened
until the second factor is verified.

`MfaChallengeResponse`: `{ "mfa_required":true, "challenge_token":"…", "method":"TOTP"|"SMS"|"WEBAUTHN",
"type":"TOTP_LOGIN"|"TOTP_ENROLL"|"SMS_LOGIN"|"WEBAUTHN_LOGIN", "otpauth_uri":"otpauth://…"|null,
"secret":"BASE32"|null, "webauthn_options":"<JSON>"|null, "expires_at":"…" }`. **Which challenge** — the
member is challenged with an enrolled method **that the policy still enables**, strongest first: **WebAuthn**
→ **TOTP** → **SMS** (the "no authenticator" fallback; SMS code is texted, never returned); a member who
must enrol but hasn't gets a `TOTP_ENROLL` challenge carrying the `secret` + `otpauth_uri`. A
`WEBAUTHN_LOGIN` challenge carries `webauthn_options` (the `navigator.credentials.get()` JSON) and is
completed at the WebAuthn endpoint below.

> **The policy is authoritative.** A member is challenged only with a method that is still enabled in the
> security policy (§10B.1). If a Platform Admin disables a method, members are **not** asked for it — even
> ones who previously enrolled; disabling all methods (or `mfa_required=false` with no enabled method the
> member holds) means no challenge at all. `mfa_required` only governs whether a non-enrolled member is
> *forced* to enrol.

- **Complete login — `POST /platform/organization/auth/mfa/login-verify`** — _public_. Body
  `{ "challenge_token":"…", "code":"123456" }`. Verifies the code (TOTP, the texted SMS code, **or a backup
  recovery code**); on success returns a normal `LoginResponse` (token + session) and, for a `TOTP_ENROLL`,
  saves the secret + marks the member MFA-enabled. A matched backup code is consumed (single-use). `200`;
  `400` invalid/expired challenge or wrong code. Single-use, 5-min TTL.
- **Backup codes — generate — `POST …/auth/mfa/backup-codes`** — _bearer_. Generates a fresh set of 10
  single-use recovery codes for the signed-in member (**invalidating any previous set**) and returns the
  plaintext **once**: `{ codes:[…], remaining:10 }` (`BackupCodesResponse`). Codes are stored only as bcrypt
  hashes. Use one in place of TOTP/SMS at `login-verify`.
- **Backup codes — remaining — `GET …/auth/mfa/backup-codes`** — _bearer_. Returns `{ codes:null, remaining:n }`
  (count only; the codes are never returned again).
- **TOTP — begin enrolment — `POST …/auth/mfa/totp/enroll`** — _bearer_. Returns `{ secret, otpauth_uri }`
  (`TotpEnrollResponse`) for the signed-in member; not active until confirmed.
- **TOTP — confirm enrolment — `POST …/auth/mfa/totp/verify`** — _bearer_. Body `{ "code":"123456" }`; on a
  valid code the member is MFA-enabled. `200`; `400` no pending enrolment / wrong code.
- **SMS — begin enrolment — `POST …/auth/mfa/sms/enroll`** — _bearer_. Body `{ "phone":"+254712345678" }`;
  texts a verification code, returns `{ phone_masked, expires_at }` (`SmsEnrollResponse`).
- **SMS — confirm enrolment — `POST …/auth/mfa/sms/verify`** — _bearer_. Body `{ "code":"123456" }`; on a
  valid code SMS MFA is enabled. `200`; `400` no pending enrolment / wrong code.
- **WebAuthn — begin registration — `POST …/auth/mfa/webauthn/register-start`** — _bearer_. Returns
  `{ public_key_json }` (`WebAuthnOptionsResponse`) — the `navigator.credentials.create()` options (JSON
  string) for a FIDO2 security key / passkey.
- **WebAuthn — finish registration — `POST …/auth/mfa/webauthn/register-finish`** — _bearer_. Body
  `{ "response_json":"<credential JSON>", "label":"YubiKey 5C" }`; verifies the attestation, stores the
  credential, marks the member WebAuthn-enabled. `200`; `400` no pending ceremony / invalid attestation.
- **WebAuthn — complete login — `POST …/auth/mfa/webauthn/login-finish`** — _public_. Body
  `{ "challenge_token":"…", "response_json":"<assertion JSON>" }`; verifies the assertion (and bumps the
  signature counter) and returns a normal `LoginResponse`. `200`; `400` invalid/expired challenge or failed
  assertion. The Relying Party id / origin are configured via `ginja.security.webauthn.{rp-id,rp-name,origin}`.

`MFA_ENROLLED` and `MFA_LOGIN_VERIFIED` are written to the member's activity timeline. Secrets are stored
**encrypted at rest**. Platform-plane only (tenant logins are not challenged). SMS and WebAuthn are later phases.

---

## 3. Module Registry (Configuration library)
Base: `/platform/organization/modules` · **PLATFORM_ADMIN** (writes); **PLATFORM_ADMIN** or **SUPPORT**
(reads). The catalogue of platform modules (`TENANT`, `CLAIMS`, `FINANCE`, `MEMBER`, `PROVIDER`,
`EMPLOYER`, `REPORTING`, `ACCESS`, plus any you register). A module's `code` becomes the `MODULE_<code>`
authority granted to roles (§4), so the registry feeds both access control and the entitlement tree.
Each module has a numeric `id`, a business code `MRC000001`, and optional sub-modules (`SMD000001`).
**Lifecycle:** `DRAFT → PUBLISHED` (also `BETA`, `SUNSET`); **only `PUBLISHED` modules grant their
`MODULE_*` authority** (newly registered modules default to `DRAFT`).

**`ModuleResponse` shape:**
```json
{ "id":9, "module_id":"MRC000009", "code":"CLAIMS", "name":"Claims Management",
  "description":"Intake, adjudication and settlement of health claims.", "icon":"claims", "url":"/claims",
  "version":"4.2.0", "status":"PUBLISHED", "owner_team":"Claims Platform", "tenants":22,
  "sub_modules":[ { "id":21, "sub_module_id":"SMD000021", "code":"INTAKE", "name":"Claims intake",
     "description":"Capture & validate submissions", "requires":null } ],
  "created_by":"1", "updated_by":null, "created_at":"...", "updated_at":"..." }
```
`tenants` is **derived** (count of payers entitled to the module); `requires` (on a sub-module) names
another sub-module code it depends on.

### 3.1 Register — `POST /platform/organization/modules`
Request (`RegisterModuleRequest`): `code` normalised to UPPER_SNAKE; `status` optional (default `DRAFT`);
`sub_modules[]` optional (each `{ code, name, description, requires }`).
```json
{ "code":"REINSURANCE", "name":"Reinsurance", "description":"Treaties, cessions and recoveries.",
  "icon":"reinsurance", "url":"/reinsurance", "version":"1.6.0", "owner_team":"Risk Platform", "status":"BETA",
  "sub_modules":[ { "code":"TREATIES", "name":"Treaties" },
                  { "code":"CESSIONS", "name":"Cessions", "requires":"TREATIES" } ] }
```
`result` (`ModuleResponse`, business id `MRC…`) · `201`. Errors: `409` duplicate `code`; `400` invalid code.

### 3.2 List (filter + paginate) — `GET /platform/organization/modules`
Query params (all optional): `status` (`DRAFT|PUBLISHED|BETA|SUNSET`), `owner_team` (case-insensitive),
and pagination `page` (0-based), `size` (default 20), `sort` (default `code,asc`).
`result` (paged envelope): `{ content:[ ModuleResponse ], page, size, total_elements, total_pages }` · `200`.

### 3.3 Search — `GET /platform/organization/modules/search?q=`
Case-insensitive substring across `code`, `name`, `description`; paginated. `result`: paged envelope · `200`.

### 3.4 Get one — `GET /platform/organization/modules/{module_id}`
By business id (e.g. `MRC000001`). `result`: `ModuleResponse` · `200`; `404` if missing.

### 3.5 Update (PATCH, publish/unpublish) — `PATCH /platform/organization/modules/{module_id}`
Request (`UpdateModuleRequest`, partial — only non-null fields applied): `name, description, icon, url,
version, owner_team, status, sub_modules[]`. Supplying `sub_modules` **replaces** the whole set; omitting
it leaves them unchanged. Setting `status` to `PUBLISHED` records a **publish**; moving off `PUBLISHED`
records an **unpublish**; otherwise a plain update. `result`: `ModuleResponse` · `200`; `404` unknown id.

### 3.6 Activity — `GET /platform/organization/modules/{module_id}/activity`
Role **PLATFORM_ADMIN** / **SUPPORT**. The module's chronological history (registered, updated,
published/unpublished — actor + timestamp), newest first; paged audit envelope (see §6.2). `404` unknown id.

> All mutations write an audit entry (`MODULE_REGISTERED/UPDATED/PUBLISHED/UNPUBLISHED`, audit module
> **Module registry**). The legacy `…/functionalities` create+list endpoints are replaced by this registry.
> Platform **roles** are now defined by permissions (§4/§4A), not modules; tenant-plane access still maps
> roles → modules internally.

---

## 4. Roles
Base: `/platform/organization/roles` · role **PLATFORM_ADMIN**. `SYSTEM` roles (e.g. `PLATFORM_ADMIN`)
are immutable; `CUSTOM` roles are admin-authored.

A role is defined by a **name**, a badge **`hex_color`**, and a set of **permissions** (grouped
capabilities — §4A). Module access is **not** part of a role anymore.

### 4.1 Create — `POST /platform/organization/roles`
Request (`CreateRoleRequest`): `name` normalised to UPPER_SNAKE; `hex_color` optional (6-digit hex, `#`
optional); `permission_codes` optional (each must exist in the catalogue).
```json
{ "name": "Onboarding Specialist", "description": "Owns onboarding", "hex_color": "#6741D9",
  "permission_codes": ["TENANT_VIEW","TENANT_ONBOARD","TENANT_EDIT","CONFIG_TEMPLATES"] }
```
`result` (`RoleResponse`): `{ id, role_id, name, role_name, description, type, status, hex_color,
permissions:[...], region_scopes:[...], created_at }` · `201`.
Errors: `409` duplicate name; `404` unknown permission code; `400` invalid name/colour.

### 4.2 Get all — `GET /platform/organization/roles`
`result`: array of `RoleResponse` · `200`. Readable by `PLATFORM_ADMIN` or `SUPPORT`.

### 4.3 Get one — `GET /platform/organization/roles/{role_id}`
`result`: `RoleResponse` · `200`; `404` if missing. Readable by `PLATFORM_ADMIN` or `SUPPORT`.

### 4.4 Edit role — `PATCH /platform/organization/roles/{role_id}`
Body (`UpdateRoleRequest`, partial — only non-null fields apply): `{ "name":"Claims Reviewer",
"description":"...", "hex_color":"#E03131", "permission_codes":["APPROVAL_VIEW","APPROVAL_DECIDE"] }`.
When `permission_codes` is supplied it **replaces** the role's whole permission set; omit it to leave
permissions unchanged. CUSTOM roles only. `result`: `RoleResponse` · `200`. Errors: `400` SYSTEM role;
`404` unknown permission code; `409` duplicate name.

### 4.5 Delete role — `DELETE /platform/organization/roles/{role_id}`
CUSTOM roles only and only when not assigned to any member. `200`; `400` SYSTEM role; `409` role
still assigned. (Mapped role→permission and region-scope rows cascade.)

### 4.6 Assign / un-assign permissions to a role
`POST /platform/organization/roles/{role_id}/permissions` — `{ "permission_codes":["APPROVAL_DECIDE","APPROVAL_VIEW"] }`
(idempotent, CUSTOM roles only). `DELETE …/roles/{role_id}/permissions/{permission_code}` un-assigns.
`result`: `RoleResponse` (with the updated `permissions` array) · `200`. (Incremental alternative to
passing `permission_codes` in create/edit.)

### 4.7 Set region scopes — `PUT /platform/organization/roles/{role_id}/region-scopes`
Body: `{ "regions":["af-west-1","af-east-1"] }` (replaces the set; empty/omitted = no region restriction;
de-duplicated). CUSTOM roles only. `result`: `RoleResponse` (with `region_scopes[]`) · `200`; `400`
SYSTEM role.

## 4A. Permissions catalogue (grouped capabilities)
Base: `/platform/organization/permissions` · role **PLATFORM_ADMIN**. The permission catalogue is a set
of **grouped capabilities**; roles are built by selecting from it. A member's effective permissions
(union across their active roles) are carried in the login JWT as a `permissions` claim → **`PERM_<code>`**
authorities. Each permission carries a `group_code`/`group_label` (for the role-editor matrix) and a
`sensitive` flag.

**Seeded catalogue — 5 groups / 14 capabilities** (`*` = sensitive):

| Group (`group_code`) | Capabilities (`code`) |
| :------------------- | :-------------------- |
| Tenant management (`TENANT_MANAGEMENT`) | `TENANT_VIEW`, `TENANT_ONBOARD`, `TENANT_EDIT`, `TENANT_LIFECYCLE`* |
| Approvals (`APPROVALS`) | `APPROVAL_VIEW`, `APPROVAL_DECIDE`* |
| Configuration library (`CONFIG_LIBRARY`) | `CONFIG_MODULES`, `CONFIG_TEMPLATES`, `CONFIG_PRICING`* |
| Access & security (`ACCESS_SECURITY`) | `ACCESS_USERS`*, `ACCESS_ROLES`*, `ACCESS_SETTINGS`* |
| Observability (`OBSERVABILITY`) | `PLATFORM_AUDIT`, `PLATFORM_EXPORT` |

The SYSTEM `PLATFORM_ADMIN` role holds all; `PLATFORM_ENGINEER` and `SUPPORT` hold curated subsets.

| Method | Path | Purpose |
| :----- | :--- | :------ |
| POST | `/permissions` | create — `{ "code":"REPORTS_EXPORT", "name":"Export Reports", "description":"...", "group_code":"OBSERVABILITY", "group_label":"Observability", "sensitive":false }` (`code` → UPPER_SNAKE) |
| GET | `/permissions` `?status=&group_code=&sensitive=` | list catalogue (`PermissionResponse[]`, grouped via `group_code`) with optional filters: `status` (`ACTIVE\|INACTIVE`), `group_code`, `sensitive` (`true\|false`) |
| GET | `/permissions/search?q=` | case-insensitive search across code / name / description |
| GET | `/permissions/{id}` | get one |
| POST | `/permissions/{id}/activate` | activate (status → `ACTIVE`; idempotent) |
| POST | `/permissions/{id}/suspend` | suspend (status → `INACTIVE`; idempotent) — stays in the catalogue + keeps its role mappings but stops granting its `PERM_<code>` authority |
| DELETE | `/permissions/{id}` | delete — `409` if still assigned to any role |

`PermissionResponse`: `{ id, permission_id, code, name, description, group_code, group_label, sensitive, status }`.
`LoginResponse` and `MemberResponse` both expose `accessible_permissions` (the effective union).
> Permissions are a platform-plane concept. On **platform** logins `accessible_modules` is derived from the
> member's permission **groups** (the nav modules they can see); **tenant** logins still resolve modules via
> functionalities (tenant schemas carry no permission catalogue).

---

## 5. Members
Base: `/platform/organization/members` · role **PLATFORM_ADMIN**. A member is an internal Platform
Console user.

### 5.1 Invite a user (create) — `POST /platform/organization/members`
The **"Invite user"** form. Request (`InviteMemberRequest`): `full_name`, `email`, optional `role_ids`
(fetch options from `GET …/roles`), optional `expiry_days` (1–90, default 7). One call creates the
member `INVITED`, assigns the roles, and **sends a time-limited activation email** — the member sets
their own password when they accept (§2.6); no password is set here.
```json
{ "email":"ops@ginja.ai", "full_name":"Ops User", "role_ids":[2,3], "expiry_days":7 }
```
`result` (`MemberResponse`, `status:"INVITED"`, `invite_expires_at` populated) · `201`. Errors: `409`
duplicate email; `404` unknown role id.
> The member's **created**, **role-assigned** and **invited** events are each recorded on the activity
> timeline (`GET …/members/{member_id}/activity`, §6.2).

**`MemberResponse` shape** (returned by every member endpoint):
```json
{ "id":7, "member_id":"MBR000007", "email":"ops@ginja.ai", "full_name":"Ops User",
  "status":"INVITED", "status_reason":null, "mfa_enabled":false,
  "roles":[{"id":2,"name":"FINANCE_OPERATOR"}], "accessible_modules":[...], "accessible_permissions":[...],
  "invited_by":"Platform Administrator",
  "invite_expires_at":"2026-06-24T04:06:37Z", "invite_expired":false,
  "member_since":"...", "last_active":"...", "active_sessions":0, "created_at":"..." }
```
- `status_reason` — the reason captured on the member's last status change (e.g. the suspension reason); `null` once reactivated.
- `mfa_enabled` — whether MFA is configured (currently always `false`; toggled when the MFA module lands).
- `invited_by` — always a human-readable label: a numeric `created_by` actor id is resolved to that member's full name; a dev subject / seed (`bootstrap`) is shown as-is — never a bare id.
- `invite_expires_at` / `invite_expired` — populated only while `status=INVITED` (from the current pending invitation); `invite_expired` is `true` once past the expiry.

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
The password is validated against the security policy (§10B.1) — complexity + no-reuse of the last N —
and stamps `password_changed_at`. `result`: `MemberResponse` · `200`; `400` if it violates the policy.

### 5.6 Assign roles — `POST /platform/organization/members/{member_id}/roles`
Request (`AssignRolesRequest`): `{ "role_ids":[2,3] }` (idempotent). `result`: `MemberResponse` · `200`; `404` unknown role.

### 5.8 Resend / revoke invite — `POST /platform/organization/members/{member_id}/resend-invite|revoke-invite`
The first invite is sent by **create** (§5.1) — there is no separate "invite" endpoint. **resend-invite**
re-issues the activation email (invalidates the prior token, fresh expiry) — use it when the invite
**expired**; requires the member to still be `INVITED` (`400` otherwise). **revoke-invite** cancels the
pending invitation. Both `200`; both are recorded on the activity timeline. The member accepts via §2.6.

### 5.9 Sessions admin — `GET /platform/organization/members/{member_id}/sessions` · `POST …/sessions/revoke`
GET → the member's active sessions (`SessionResponse[]`). POST → revoke them all (`{ "revoked": n }`). `200`.

### 5.10 Delete user — `DELETE /platform/organization/members/{member_id}`
Hard-deletes the member (role assignments + sessions cascade). `200`.

> `MemberResponse` is enriched for the Users screen: `invited_by`, `member_since`, `last_active`
> (from sessions), and `active_sessions` count.

### 5.7 Un-assign a role — `DELETE /platform/organization/members/{member_id}/roles/{role_id}`
`result`: `MemberResponse` · `200`; `404` if not assigned.

> A platform member's `accessible_modules` = the union of permission **groups** (e.g.
> `TENANT_MANAGEMENT`, `CONFIG_LIBRARY`) reachable through their roles' permissions; it is encoded as
> `MODULE_*` authorities in their token (tenant members still resolve modules via functionalities).

---

## 6. Audit log
`GET /platform/organization/audit-logs` · role **PLATFORM_ADMIN** / **SUPPORT** (read-only).
Append-only compliance trail.

Query params (all optional): `entity_type`, `entity_id`, `action`, `actor`, **`module`**, `page`
(0-based), `size` (default 20), `sort` (default `created_at,desc`).

Every entry is tagged with the **functional module** it belongs to (derived from its `action`), so the
trail can be browsed per feature area. Each row carries `module` (code) + `module_label`, plus
**`actor_role`** (the actor's role(s) snapshotted at action time) and **`kind`** (UI category derived
from the action: `create | edit | publish | approve | danger | system | neutral`):
```json
{ "content":[ { "audit_id":"AUD000001","actor":"1","actor_name":"admin@ginja.ai","actor_role":"PLATFORM_ADMIN",
  "action":"ROLE_CREATED","kind":"create","module":"ROLE_MANAGEMENT","module_label":"Roles & permissions",
  "entity_type":"Role","entity_id":"ROL000002","entity_label":"FINANCE_OPERATOR",
  "before":null,"after":{...},"changes":{"status":{"from":"ACTIVE","to":"SUSPENDED"}},"reason":null,"created_at":"..." } ],
  "page":0,"size":20,"total_elements":8,"total_pages":1 }
```
Examples: all changes to one member → `?entity_type=OrgMember&entity_id=MBR000001`; all approvals →
`?action=PAYER_APPROVED`; **everything under member invites** → `?module=MEMBER_INVITATION`.

### 6.0 Export — `GET /platform/organization/audit-logs/export?format=csv|json`
Role **PLATFORM_ADMIN** / **SUPPORT**. Streams the filtered trail (same filters as above; newest first,
unpaged) as a downloadable file — `format=csv` (default) or `json`. Returns `text/csv` /
`application/json` with a `Content-Disposition: attachment` header.

### 6.1 Module catalogue — `GET /platform/organization/audit-logs/modules`
Role **PLATFORM_ADMIN** / **SUPPORT**. Returns the filter chips for the UI: each module's `code`,
`label`, and the `actions` it covers.
```json
[ { "code":"TENANT_ONBOARDING","label":"Tenant onboarding","actions":["PAYER_CREATED","SECONDARY_TENANT_ADDED", ...] },
  { "code":"TENANT_PROVISIONING","label":"Tenant provisioning","actions":["PROVISIONING_STARTED", ...] },
  { "code":"TECHNICAL_REVIEW","label":"Technical reviewer","actions":["CONFIG_REMARK_ADDED","CONFIG_REMARK_RESOLVED","CONFIG_SECTION_APPROVED"] },
  { "code":"MEMBER_INVITATION","label":"Member invite", ... }, { "code":"MEMBER_MANAGEMENT", ... },
  { "code":"ROLE_MANAGEMENT", ... }, { "code":"PERMISSION_MANAGEMENT", ... }, { "code":"MODULE_REGISTRY", ... },
  { "code":"AUTHENTICATION", ... }, { "code":"PRICING", ... }, { "code":"TENANT_APPROVAL", ... }, { "code":"TENANT_LIFECYCLE", ... } ]
```
The 13 modules: **Tenant onboarding · Tenant approval · Tenant lifecycle · Tenant provisioning ·
Technical reviewer · Member management · Member invite · Roles & permissions · Permissions ·
Module registry · Authentication & sessions · Pricing & plans · Platform settings**.
> Tenant-scoped operations write their audit rows into the **tenant** schema's `audit_log`; this
> endpoint reads the schema resolved from the caller's token (platform admin → `public`). The module
> tag is derived at read time from `action`, so it applies uniformly across platform and tenant trails.

## 6C. Dashboard / overview — `GET /platform/dashboard`
Roles **PLATFORM_ADMIN / SUPPORT / PLATFORM_APPROVER / PLATFORM_ENGINEER** (read-only). One aggregate
read powering the console home: KPI tiles, tenant-status counts, the onboarding funnel, approvals
needing attention, recent activity, and platform health. Assembled from the existing
payer/tenant/onboarding/module/region/audit stores (no new tables).
```json
{ "kpis": { "active_tenants": 18, "in_onboarding": 4, "pending_approvals": 5, "covered_members": null },
  "tenant_status": { "DRAFT": 4, "PENDING_ACTIVATION": 0, "ACTIVE": 18, "SUSPENDED": 1, "RETIRED": 2 },
  "onboarding_pipeline": { "details_captured": 9, "modules_assigned": 7, "billing_set": 6,
    "docs_uploaded": 5, "submitted_for_review": 4 },
  "approvals_needing_attention": [ { "kind":"Tenant onboarding","payer":"CIC Insurance Group",
    "payer_id":"PAY000205","payer_numeric_id":205,"maker":"1","submitted_at":"...","tenants":4 } ],
  "recent_activity": [ { "actor":"admin@ginja.ai","actor_role":"PLATFORM_ADMIN","action":"PAYER_SUBMITTED",
    "entity_label":"CIC Insurance Group","when":"...","kind":"neutral" } ],
  "health": { "data_residency_regions": 6, "published_modules": 9, "tenant_environments": 18 } }
```
> `covered_members` (cross-tenant member rollup) is `null` until a source feeds it. `onboarding_pipeline`
> counts in-onboarding (DRAFT) payers reaching each step; `pending_approvals` / `approvals_needing_attention`
> reflect payers fully provisioned and awaiting the final maker-checker decision (§9.4).

### 6.2 Per-entity activity timelines (the "Activity" tab)
Each record screen has an **Activity** tab showing that one entity's chronological history, served
from the same audit trail (filtered to the entity). All are paged (`?page&size&sort`, newest first)
and return the standard `{ content[], page, size, total_elements, total_pages }` envelope; each entry
carries `action` + `module`/`module_label` (see §6). The numeric path id is resolved to the entity's
business code internally; an unknown id → **404**.

| Timeline | Endpoint | Roles | Shows |
| :-- | :-- | :-- | :-- |
| Member | `GET /platform/organization/members/{memberId}/activity` | `PLATFORM_ADMIN`, `SUPPORT` | logins, role assign/remove, status/suspension, invites, password |
| Module | `GET /platform/organization/modules/{moduleId}/activity` | `PLATFORM_ADMIN`, `SUPPORT` | registered, updated, published / unpublished |
| Pricing structure | `GET /platform/pricing-structures/{id}/activity` | `PLATFORM_ADMIN` | created, edited, activated, archived |
| Payer (onboarding) | `GET /platform/payers/{payerId}/activity` | `PLATFORM_ADMIN` | created, entitlements, subscription, documents, submit, lifecycle |
| Approval queue | `GET /platform/payers/{payerId}/approval-activity` | `PLATFORM_ADMIN`, `PLATFORM_APPROVER` | submission + approve / reject / request-info decisions only |
| Tenant | `GET /platform/payers/{payerId}/tenants/{tenantId}/activity` | `PLATFORM_ADMIN`, `PLATFORM_ENGINEER`, `PLATFORM_APPROVER` | added, provisioning config, documents, activation |

```json
{ "content":[ { "audit_id":"AUD000012","actor":"1","actor_name":"admin@ginja.ai",
  "action":"MEMBER_STATUS_CHANGED","module":"MEMBER_MANAGEMENT","module_label":"Member management",
  "entity_type":"OrgMember","entity_id":"MBR000006","entity_label":"timeline@ginja.ai",
  "before":{...},"after":{...},"changes":{"status":{"from":"ACTIVE","to":"SUSPENDED"}},
  "reason":"Policy review","created_at":"..." } ],
  "page":0,"size":20,"total_elements":3,"total_pages":1 }
```
> The approval timeline is the payer trail narrowed to the approval module + `PAYER_SUBMITTED`. The
> tenant timeline shows `Tenant`-scoped events (provisioning config, documents, activation); a payer's
> primary-tenant creation is recorded against the payer, so it appears in the payer timeline.

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

### 7.2a Picker options (minimal) — `GET /platform/pricing-structures/tenant`
Lightweight list of **ACTIVE** structures for the onboarding "Billing & terms" subscription-model picker
(§8.4) — **omits** the heavy `components[]`/`tiers[]`. `result`: array of `TenantPricingOptionResponse`:
```json
{ "id":2, "pricing_id":"PRC000002", "name":"% of Gross Premium",
  "description":"% of GWP + $500K annual platform fee + 15% savings capture", "model":"PCT_GWP",
  "status":"ACTIVE", "currency":"USD", "implementation_fee":400000.00, "platform_fee_annual":500000.00,
  "savings_capture_pct":15.00, "display_price":"4.00% of GWP" }
```
`display_price` is the precomputed headline for the card, derived from the structure's primary component
+ base-tier rate / unit (e.g. `"$0.50 / member"`, `"4.00% of GWP"`, `"$500K / year"`). Use this for the
picker; fetch full rate cards via §7.3 only when needed. Role **PLATFORM_ADMIN**.

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
secondary → 8.3 entitlements → 8.4 subscription → 8.5 documents → 8.6 submit, with
per-step assignment in 8.8. (Technical/system setup is no longer part of onboarding — it happens in
Tenant Provisioning, §10A, after submit.)

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

> **`subdomain` and `data_residency_region` are optional here** — the subdomain is collected later by the
> Support Engineer in Tenant Provisioning → Domains & SSL (§10A), not during onboarding. Optionally supply `contacts` (max 2, each
> `{name,email,role_title,receives_invite}`) and `operating_regions:[...]`; if omitted, the
> `primary_contact_*` + `tenant_admin_*` fields seed the two contacts.

### 8.1a List payers (filter · sort · paginate) — `GET /platform/payers`
Role **PLATFORM_ADMIN**. Returns payers (with nested tenants/entitlements/subscription) as a **paged
envelope**. Optional filters (each ignored when omitted):

| Query param | Meaning |
| :--- | :--- |
| `status` | `DRAFT \| ACTIVE \| SUSPENDED \| RETIRED` |
| `payer_type` | `INSURER \| TPA \| SELF_MANAGED_SCHEME` |
| `from_date` / `to_date` | created-at window (ISO `yyyy-MM-dd`); `from` inclusive, `to` inclusive through end-of-day |
| `page` / `size` / `sort` | 0-based page (default 0), size (default 20), `sort=createdAt,desc` (default). Sortable: `createdAt`, `payerId`, `status`, `payerType` |

```json
{ "status":200,"success":true,"message":null,"error_details":null,
  "result": { "content":[ { "id":1,"payer_id":"PAY000001","status":"DRAFT","payer_type":"INSURER", ... } ],
    "page":0,"size":20,"total_elements":14,"total_pages":1 } }
```
Errors: `400` unknown `status`/`payer_type` enum; `403` not PLATFORM_ADMIN. (Implemented with a JPA
`Specification` so only the supplied filters are applied.)

### 8.2 Add secondary tenant — `POST /platform/payers/{payer_id}/tenants` (§5.2)
Request: a `TenantDetailsRequest` (same shape as `primary_tenant`). `result`: `PayerResponse` · `201`.
Errors: `409` payer not DRAFT / duplicate subdomain or entity.

### 8.2a Update a tenant (partial) — `PATCH /platform/payers/{payer_id}/tenants/{tenant_id}`
Role **PLATFORM_ADMIN**. True PATCH of a tenant (primary or secondary) on a **DRAFT** payer — body is a
partial `UpdateTenantRequest`; only supplied (non-null) fields are applied. Editable: `legal_entity_name,
trading_name, country, tax_vat_number, subdomain, data_residency_region, primary_contact_name,
primary_contact_email, tenant_admin_name, tenant_admin_email, phone, address, website, contacts[],
operating_regions[], bank` (bank write-only). Changed `subdomain` and `(legal_entity_name, country)` are
re-validated for uniqueness (excluding this tenant). Supplying `contacts` **replaces** the contact set.
`result`: refreshed `PayerResponse` · `200`. Errors: `400` reserved/invalid subdomain; `409` payer not
DRAFT / duplicate subdomain or (legal entity, country); `404` payer/tenant not found.

### 8.2b Delete a secondary tenant — `DELETE /platform/payers/{payer_id}/tenants/{tenant_id}`
Role **PLATFORM_ADMIN**. Removes a **secondary** tenant (and its contacts/documents) from a **DRAFT**
payer. `result`: refreshed `PayerResponse` · `200`. Errors: `409` payer not DRAFT **or** attempt to
delete the **primary** tenant; `404` not found.

> Each tenant object in `tenants[]` (on every payer response) now also round-trips
> `tax_vat_number, phone, address, website` (so the edit form can pre-populate). `bank` stays
> **excluded** (write-only/encrypted).

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
`multipart/form-data` (**not** JSON): the `file` part carries the bytes — ops proxies them to the
document service (`ginja-ai-document-service`) and stores the returned `file_id`/`s3_key` against the
tenant. The caller's bearer token is forwarded, so both services must trust the same JWT.

| Part | Required | Notes |
|------|----------|-------|
| `file` | yes | the document bytes (the file name is taken from this part) |
| `category` | yes | KYB category, ≤64 chars |
| `description` | no | ≤512 chars |
| `expiry_date` | no | `yyyy-MM-dd` |

```bash
curl -X POST "$B/platform/payers/1/tenants/1/documents" -H "$AH" \
  -F 'category=SIGNED_CONTRACT' \
  -F 'expiry_date=2027-01-01' \
  -F 'description=Signed master agreement' \
  -F 'file=@contract.pdf'
```
`result`: `PayerResponse` (document under its tenant, `status:"PENDING_REVIEW"`, with `file_id`) · `201`.
`400` if the file is missing/empty or the category is blank/too long.

### 8.5.1 Download a document — `GET /platform/payers/{payer_id}/tenants/{tenant_id}/documents/{document_id}` (§5.5)
Returns the document's metadata plus a **freshly issued, time-limited** pre-signed download URL fetched
from the document service. The path id may be **either** the ops business id (`DOC...`) **or** the
document service file id (`FIL...`); either way the document must belong to the tenant, which must
belong to the payer (ops only serves documents it has a record of). The caller's bearer token is
forwarded downstream.
```bash
curl "$B/platform/payers/1/tenants/1/documents/DOC000001" -H "$AH"
```
`result`: `DocumentDownloadResponse` —
```json
{ "document_id":"DOC000001", "file_id":"FIL000002IYDK84O87PYP", "category":"DIRECTOR_SHAREHOLDER_ID",
  "status":"PENDING_REVIEW", "file_name":"56979362.jpg", "content_type":"image/jpeg", "file_size":58282,
  "version_number":1, "expiry_date":"2027-01-01", "file_url":"https://...s3...X-Amz-Signature=..." }
```
`200` on success · `404` if the payer, tenant, or document is unknown (or the document has no stored file).

### 8.6 Submit (Review & submit) — `POST /platform/payers/{payer_id}/submit` (§5.6)
No body. **Review-flow gate:** every required onboarding section except `review` must be COMPLETE
(`modules, billing, documents`, plus `primary`) — i.e. the wizard's "all sections complete". If not,
returns **`400`** listing the incomplete sections, e.g.
`"Cannot submit — incomplete required sections: [documents]"`. It also re-checks the underlying data
(primary has all required KYB categories `SIGNED_CONTRACT`, `COMPANY_REGISTRATION`, `PROOF_OF_ADDRESS`,
`DIRECTOR_SHAREHOLDER_ID`). **Subdomain is NOT required at submit** — it is captured later in Tenant
Provisioning → Domains & SSL (§10A). On success it stamps `submitted_by/at` (status stays `DRAFT`),
completes the `review` step, emits `PayerSubmitted`, and **enters every tenant into the Tenant
Provisioning queue** (§10A). The payer only reaches the approver queue (§9.4) once provisioning is
complete (all tenants `READY_TO_ACTIVATE`). `result`: `PayerResponse` · `200`; `409` if not DRAFT.

> **Lifecycle:** Onboarding (6 sections) → Submit → **Provisioning** (Support Engineer) → final
> maker-checker **Approval** → **auto-Activate**. Approval is the last gate and triggers go-live.

> Drive the Review screen from `GET …/{id}/steps`: render the section tracker from `steps[]`/
> `completed_steps`/`incomplete_steps`, show `progress_pct`, and enable Submit when
> `ready_to_submit == true`.

> **Technical config moved out of onboarding.** The former Step 3 (`PATCH …/tenants/{tenant_id}/technical`)
> is **removed**. Subdomain, database, domains/SSL, SMS, email and data-migration setup are now done by a
> Support Engineer in Tenant Provisioning (§10A), after submit and before approval.

### 8.7 Activate secondary tenant (§5.12.1) — `POST /platform/payers/{payer_id}/tenants/{tenant_id}/activate`
Activates a secondary tenant added to an **active** payer (`PENDING_ACTIVATION` → provisions its
schema + Tenant Admin → `ACTIVE`). `result`: `PayerResponse` · `200`.

### 8.8 Onboarding steps & assignment — `/platform/payers/{payer_id}/steps`
Six steps per payer (`primary, secondary, modules, billing, documents, review`), each
with an `owner_role` (`profile|compliance`) and a `required` flag (`secondary` is optional).
**Steps are filled independently, in any order, and each is counted COMPLETE the moment its data is
saved** — `primary` on create, `modules` on entitlements, `billing`
on subscription, `documents` once all required KYB categories are uploaded (partial → `IN_PROGRESS`),
`secondary` on adding a secondary, `review` on submit. `completed_by`/`completed_at` capture who/when.
You can also assign or force a step manually.

| Method | Path | Purpose |
| :----- | :--- | :------ |
| GET | `/platform/payers/{payer_id}/steps` | one payer's step list + progress (`OnboardingProgressResponse`) |
| GET | `/platform/payers/onboarding-drafts` `?assignee=` | **drafts-in-progress panel** — a **list** of `OnboardingProgressResponse`, one per in-progress draft (DRAFT, not submitted), newest first |
| POST | `/platform/payers/{payer_id}/steps/{step_key}/assign` | assign a step to a member — `{ "assignee":"engineer@ginja.ai" }` |
| POST | `/platform/payers/{payer_id}/steps/{step_key}/complete` | mark a step complete manually |

> **Directory panel:** `GET /platform/payers/onboarding-drafts` returns a JSON **array** of
> self-sufficient draft summaries — payer **identity** (`id`, `payer_id` code, `payer_type`,
> `legal_entity_name`, `country`, `created_at`, `updated_at`, aligned with `GET /platform/payers`) **plus**
> the full onboarding progress (same fields as `…/{payer_id}/steps`: `completed/total/progress_pct/
> completed_steps/incomplete_steps/steps[]`). So the cards render title, type badge, progress bar and
> "waiting on" (= `incomplete_steps[0]`) without a second call. `?assignee=` = "By teammate". PLATFORM_ADMIN.

`result` (`OnboardingProgressResponse`):
```json
{ "payer_id":2, "completed":4, "total":6, "progress_pct":67,
  "required_completed":4, "required_total":5, "all_required_complete":false, "ready_to_submit":true,
  "completed_steps":["primary","modules","billing","documents"],
  "incomplete_steps":["secondary","review"],
  "steps":[ { "step_id":"OST000003","step_key":"modules","owner_role":"profile","sort_order":3,
     "required":true,"status":"COMPLETE","complete":true,"assignee":"specialist@ginja.ai",
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

> **Approval is the final gate and runs after provisioning.** A payer becomes approvable only once
> **every** tenant's provisioning stage is `READY_TO_ACTIVATE` (§10A). Approving earlier returns
> **`409`** ("Provisioning not complete …"). Approve then auto-activates (go-live).

### 9.1 Approve → activate — `POST /platform/payers/{payer_id}/approve`
Records the decision, then **auto-activates**: provisions each tenant's `tenant_<subdomain>` schema,
creates the Tenant Admin **inside that schema**, creates billing on the primary, emits
`TenantActivated`/`PayerActivated`. `result`: `PayerResponse` now `ACTIVE` with each tenant `ACTIVE`
and a populated `schema_name` · `200`.
Errors: **`403`** if the caller submitted this payer (separation of duties) or lacks
`PLATFORM_APPROVER`; **`409`** if not awaiting approval **or provisioning is not complete** (some tenant
not yet `READY_TO_ACTIVATE`).

### 9.2 Reject — `POST /platform/payers/{payer_id}/reject`
Mandatory `comment`. Clears the submission marker (admin can correct & re-submit). `result`:
`PayerResponse` · `200`; `400` missing comment; `403` SoD.

### 9.3 Request information — `POST /platform/payers/{payer_id}/request-info`
Mandatory `comment`. Clears the submission marker. `result`: `PayerResponse` · `200`.

### 9.4 Approver queue — `GET /platform/approvals` `?status=pending|approved|all`
Role **PLATFORM_APPROVER**. The maker-checker queue as **lean rows** for the directory table. `?status=`
selects the tab: `pending` (submitted + fully provisioned, awaiting a decision), `approved` (already
approved), or omitted/`all` (both — each row carries its own `status`, so the FE renders the tabs +
counts from one call). `result`: array of `ApprovalQueueItemResponse`:
```json
{ "id":210, "request_id":"PAY000210", "type":"Tenant onboarding", "tenant":"Strategis Insurance",
  "payer_type":"INSURER", "submitted_by":"1", "submitted_at":"...", "priority":null,
  "status":"PENDING", "tenants":1, "documents":4 }
```
> `type` is currently always `Tenant onboarding` and `priority` is not yet modeled (`null`) — entitlement/
> org-detail/secondary-tenant change requests and priority are future maker-checker scope.

### 9.5 Approval review (by id) — `GET /platform/approvals/{payer_id}`
Role **PLATFORM_APPROVER**. Full payload for the "Review · as Approver" screen — request header + review
meta plus the complete payer aggregate (every section the screen renders):
```json
{ "id":210, "request_id":"PAY000210", "type":"Tenant onboarding", "tenant":"Strategis Insurance",
  "payer_type":"INSURER", "status":"PENDING_REVIEW", "submitted_by":"1", "submitted_at":"...",
  "own_submission":false, "provisioning_complete":true, "can_decide":true,
  "auto_activate_note":"On approval the system auto-activates the tenant, provisions tenants and sends admin invites.",
  "sections":[ {"key":"primary_tenant_details","label":"Primary tenant details"},
    {"key":"module_entitlements","label":"Module entitlements"},
    {"key":"subscription_billing","label":"Subscription & billing"},
    {"key":"kyb_documents","label":"KYB documents"} ],
  "payer": { /* full PayerResponse: tenants[], entitlements[], subscription, documents */ } }
```
`can_decide` enforces separation of duties (the submitter can't decide their own request) and requires
provisioning complete + still pending. The decision itself is recorded via
`POST /platform/payers/{payer_id}/approve|reject|request-info` (§9.1–9.3). `404` if the payer is unknown.

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

## 10A. Tenant provisioning / system configuration (PRD step 6)
Base: `/platform/provisioning` · roles **PLATFORM_ADMIN** (full queue + assign) and
**PLATFORM_ENGINEER** (configure + own queue). On **submit**, each tenant enters the provisioning
queue (`AWAITING_START`) with five config sections (`DATABASE, DOMAINS_SSL, EMAIL, SMS,
DATA_MIGRATION`). An engineer saves + tests each; when all are `DONE` the tenant is
`READY_TO_ACTIVATE`, which is the gate for the final maker-checker approval (§9). Stage auto-advances
`AWAITING_START → IN_PROGRESS → READY_TO_ACTIVATE` (a manual `BLOCKED` is preserved until changed).

> **Subdomain & custom domain live in the `DOMAINS_SSL` section.** When the engineer saves `DOMAINS_SSL`
> with a `subdomain` (and optional `custom_domain`), it is validated (sanitised, reserved-word checked),
> uniqueness-enforced, and **persisted onto the Tenant** (the rest — `cname_verified`, `ssl` — stays in
> the section's JSON `config`). The `DOMAINS_SSL` section cannot be tested/`DONE` until a subdomain is set
> (activation provisions the `tenant_<subdomain>` schema from it). Reuse `GET
> /platform/payers/subdomain-check?value=` for availability/suggestions on this screen.
>
> **Extending the sections:** the five sections are driven by the `ConfigSectionKey` enum — a Platform
> admin can add more (e.g. `OBJECT_STORAGE`, `WEBHOOKS`) by adding an enum constant (and a test-result
> case); they are then seeded and surfaced automatically with no other code change.

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| GET | `/platform/provisioning` `?stage=&assignee=` | admin/engineer | the queue (`ProvisioningResponse[]`) |
| GET | `/platform/provisioning/mine` | engineer | only my assignments |
| GET | `/platform/provisioning/{tenant_id}` | admin/engineer | one tenant's provisioning + sections |
| POST | `/platform/provisioning/{tenant_id}/assign` | **admin** | `{ "assignee":"erin" }` |
| PUT | `/platform/provisioning/{tenant_id}/sections/{section}` | admin/engineer | `{ "config":{…}, "status":"CONFIGURED" }` |
| POST | `/platform/provisioning/{tenant_id}/sections/{section}/test` | admin/engineer | test/verify/send-test → marks the section `DONE` |
| POST | `/platform/provisioning/{tenant_id}/stage` | admin/engineer | `{ "stage":"BLOCKED" }` |

`ProvisioningResponse`: `{ provisioning_id, tenant_id, tenant_code, subdomain, legal_entity_name,
stage, assignee, sections_done, sections_total, sections_approved, open_remarks,
sections:[ { config_id, section, status, config, last_result, last_tested_at, review_status,
configured_by, reviewed_by, open_remarks } ] }`.

### 10A.1 Technical review over configs (Hi-fi _3 reviewer flow)
A **Technical Reviewer** (`PLATFORM_APPROVER`) leaves per-section remarks, the engineer resolves them,
and the reviewer approves each section. **Maker ≠ checker** — the engineer who configured a section
cannot approve it (`403`); a section must be `DONE` to approve.

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| POST | `…/provisioning/{tenant_id}/sections/{section}/remarks` | admin/approver | add a remark — `{ "body":"…", "severity":"ACTION" }` → section `CHANGES_REQUESTED` |
| GET | `…/provisioning/{tenant_id}/remarks` | admin/engineer/approver | open + resolved remark trail (`RemarkResponse[]`) |
| POST | `…/provisioning/remarks/{remark_id}/resolve` | admin/engineer | resolve a remark |
| POST | `…/provisioning/{tenant_id}/sections/{section}/approve` | admin/approver | approve a section (SoD enforced) → `review_status=APPROVED` |

Editing/saving a section resets its `review_status` to `PENDING` (re-review required). The provisioning
queue (`GET …/provisioning`) and detail are also readable by `PLATFORM_APPROVER` for the reviewer
dashboard, and each item carries `open_remarks` + `sections_approved` counts.

---

## 10B. Platform settings
Base: `/platform/settings` · role **PLATFORM_ADMIN** (writes); reads also **SUPPORT**. The configurable,
platform-wide settings behind the **Platform settings** screen. All mutations are audited under the
**Platform settings** module.
> **Status:** settings + CRUD (Phase 1) and **live enforcement** of the password / lockout / session
> policies (Phase 2) are implemented — see the enforcement notes below. **MFA is implemented end-to-end for
> all three methods — TOTP (Phase 3), SMS OTP (Phase 4) and WebAuthn/FIDO2 (Phase 5)** — via the two-step
> login challenge + enrolment (§2.7), gated by `mfa_required` + the per-method toggles
> (`mfa_totp_enabled` / `mfa_sms_enabled` / `mfa_webauthn_enabled`).
> Enforcement is **platform-plane** (platform-console logins + member passwords); tenant-schema logins
> keep default behaviour.

### 10B.1 Security policies — `GET` / `PATCH /platform/settings/security-policy`
A **singleton** policy document. The **response is grouped into the four screen sections** (`Multi-factor
authentication`, `Password policy`, `Lockout`, `Sessions`) with `id`/`updated_by`/`updated_at` at the top
level:
```json
{ "id": 1,
  "Multi-factor authentication": { "mfa_required": false, "mfa_totp_enabled": true,
    "mfa_sms_enabled": false, "mfa_webauthn_enabled": false },
  "Password policy": { "password_min_length": 12, "password_require_upper": true,
    "password_require_lower": true, "password_require_number": true, "password_require_special": true,
    "password_expiry_days": 90, "password_history_count": 5 },
  "Lockout": { "lockout_max_attempts": 5, "lockout_duration_minutes": 30 },
  "Sessions": { "session_timeout_minutes": 480, "idle_timeout_minutes": 30, "max_concurrent_sessions": 3 },
  "updated_by": "1", "updated_at": "..." }
```
**`PATCH` takes the *same grouped shape* and is partial** — read the policy, change what you need, send it
back. Every section and field is optional; only the non-null values supplied are applied, e.g.
`{ "Password policy": { "password_min_length": 12 }, "Multi-factor authentication": { "mfa_required": true } }`.
The response is the full grouped document. Notes:
**Password policy** — the four `password_require_*` flags express complexity (all true = "All required");
`password_history_count` is the re-use block (0 = none); `password_expiry_days:0` = no expiry. **Sessions** —
`session_timeout_minutes` is the absolute lifetime, `idle_timeout_minutes` the inactivity cutoff.

**How it's enforced (Phase 2, platform-plane):**
- **Password policy** — applied on **accept-invite** (§2.6) and **set/reset password** (§5.5): min length +
  required character classes, and a no-reuse check against the last `password_history_count` passwords →
  `400` with a message naming the unmet rule. `password_changed_at` is stamped on every change.
- **Lockout** — on **platform login** (§2.2): after `lockout_max_attempts` consecutive failures the account
  is locked for `lockout_duration_minutes` (login then returns `400` "temporarily locked"); a successful
  login clears the counter. (Failed-attempt counters persist even though the request fails.)
- **Password expiry** — if `password_expiry_days > 0`, a login with a password older than that is refused
  (`400` "password expired"); an admin resets it via §5.5.
- **Sessions** — `session_timeout_minutes` sets the issued token/session lifetime; `idle_timeout_minutes`
  is captured on the session and the session is expired once a request arrives after that much inactivity.
  `max_concurrent_sessions` (0 = unlimited) caps simultaneous active sessions per user: on login the
  oldest sessions are revoked so the total stays at the cap (so a 2nd login under a cap of 1 invalidates
  the first token).

### 10B.2 Data residency — `/platform/settings/data-residency`
Manage the residency regions tenants can be pinned to (also the vocabulary for role region-scopes, §4.7).

| Method | Path | Purpose |
| :----- | :--- | :------ |
| GET | `/data-residency` | list regions (`RegionResponse[]`, sorted by code) |
| POST | `/data-residency` | create — `{ "code":"af-west-2", "city":"Accra", "country":"Ghana", "status":"ACTIVE" }` (`409` duplicate code) |
| GET | `/data-residency/{code}` | get one (`404` if missing) |
| PATCH | `/data-residency/{code}` | partial update (`city`/`country`/`status`) |
| DELETE | `/data-residency/{code}` | delete |

`RegionResponse`: `{ id, code, city, country, status (ACTIVE\|PROVISIONING\|RETIRED), created_at, updated_at }`.
Seeded: `af-east-1`(Nairobi), `af-east-2`(Dar es Salaam), `af-east-3`(Kampala), `af-central-1`(Kigali),
`af-horn-1`(Addis Ababa), `af-south-1`(Johannesburg), `af-west-1`(Lagos, PROVISIONING).

### 10B.3 Provisioning tiers — `/platform/settings/provisioning-tiers`
The provisioning guarantees applied to tenants. CRUD: `GET` (list), `POST` (create —
`{ "code":"ISOLATED", "name":"...", "description":"...", "enabled":true, "sort_order":1 }`),
`GET/PATCH/DELETE /{code}`. `ProvisioningTierResponse`: `{ id, code, name, description, enabled, sort_order,
created_at, updated_at }`. Seeded: **Isolated by default**, **Pinned data residency**, **Encrypted everywhere**.

### 10B.4 User access & security · Sessions — `/platform/settings/sessions`
Platform-wide monitor of active login sessions across **all** users (the design's Sessions tab).

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| GET | `/platform/settings/sessions` | ADMIN / SUPPORT | every ACTIVE session, newest-activity first |
| POST | `/platform/settings/sessions/{sessionId}/revoke` | **ADMIN** | revoke one session (per-row "Revoke") |
| POST | `/platform/settings/sessions/revoke-all?member_id=` | **ADMIN** | revoke all of a user's sessions → `{ "revoked": n }` |

`AdminSessionResponse`: `{ session_id, user_session_id, member_id, account (email), user (name), browser,
os, device, ip_address, location, started_at, last_seen_at, expires_at, status, current }`.
`browser`/`os`/`device` are parsed from the stored `user_agent` at read time; `current` is `true` for the
caller's own session; `location` is `null` until an IP-geo source is wired. Revoking marks the session
`REVOKED` so its bearer token is rejected on the next request (verified: 2nd login under a 1-session cap,
and a revoked id → `401`).

### 10B.5 User access & security · MFA status — `/platform/settings/mfa-status`
Platform-wide MFA enrolment monitor (the design's MFA-status tab).

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| GET | `/platform/settings/mfa-status` | ADMIN / SUPPORT | adoption summary + per-user list |
| GET | `/platform/settings/mfa-status/{memberId}` | ADMIN / SUPPORT | one user's MFA detail |
| POST | `/platform/settings/mfa-status/{memberId}/remind` | **ADMIN** | send an MFA-enrolment reminder (audit-logged) |

`MfaStatusResponse`: `{ summary: { total_users, mfa_enabled, not_configured, adoption_rate },
users: [ { member_id, account, user, enabled, methods, backup_codes, enabled_on } ] }`.
`methods` are the real backend codes (`totp`, `sms`, `webauthn`); the FE filters (All / Enabled / Not
configured) and searches client-side. **`backup_codes`** is the real remaining-recovery-code count for
MFA-enabled users (`null` when MFA is off — "Not applicable"); members manage their codes via
`POST/GET /platform/organization/auth/mfa/backup-codes` (§2.7). `enabled_on` is not tracked yet (`null`).

### 10B.6 User access & security · Password status — `/platform/settings/password-status`
Platform-wide password-expiry monitor (the design's Password-status tab).

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| GET | `/platform/settings/password-status` | ADMIN / SUPPORT | summary + per-user expiry status |
| GET | `/platform/settings/password-status/{memberId}` | ADMIN / SUPPORT | one user's status |
| POST | `/platform/settings/password-status/{memberId}/force-reset` | **ADMIN** | force a reset (revokes sessions + reset notification) |

`PasswordStatusResponse`: `{ summary: { total_users, ok, expiring_soon, expired, pending },
users: [ { member_id, account, user, status, last_changed, days_left, expires_at } ] }`.
`status` ∈ `ok | soon | expired | pending`, derived from `passwordChangedAt` + policy
`password_expiry_days` (0 = no expiry → `ok`); `days_left` is negative when overdue; `pending` = no
password set yet. **Force-reset** revokes the member's active sessions and sends a reset notification
(stubbed in dev) so they must set a new password to sign in again; the reset itself is completed via the
member password-set flow (`PUT …/members/{id}/password`). A hard "must-change-on-next-login" block would
be a follow-up (needs a member flag + login enforcement).

## 10C. Localization & data rules
Platform-default locale + the versioned validation-rule library every tenant inherits.

### 10C.1 Formatting & locale — `GET` / `PATCH /platform/settings/localization`
Singleton (GET: ADMIN/SUPPORT · PATCH: ADMIN). `LocalizationResponse`: `{ id, timezone, week_start,
date_format, time_format, decimal_sep, thousands_sep, currency, currency_symbol, currency_decimals,
default_language, updated_by, updated_at }`. `PATCH` is partial (send only changed fields).

### 10C.2 Validation rules (versioned library)
Base `/platform/settings/validation-rules`. Each version is an **immutable JSONB snapshot** of the
grouped rules; exactly one is `PUBLISHED` (live), others `DRAFT`/`ARCHIVED`.

| Method | Path | Role | Purpose |
| :----- | :--- | :--- | :------ |
| GET | `/validation-rules` | ADMIN/SUPPORT | current (published) ruleset + grouped rules (the library) |
| GET | `/validation-rules/versions` | ADMIN/SUPPORT | version history (newest first) |
| POST | `/validation-rules/draft` | **ADMIN** | create/return an editable DRAFT (clones current rules) |
| PUT | `/validation-rules/draft` | **ADMIN** | save the draft's rules (rule editor) — `{ rules:[…], note }` |
| POST | `/validation-rules/draft/publish` | **ADMIN** | publish the draft (archives the prior published) |
| POST | `/validation-rules/versions/{version}/rollback` | **ADMIN** | restore a prior version as a new published version |
| POST | `/validation-rules/test` | ADMIN/SUPPORT | **live tester** — `{ pattern, value, normalize[] }` → `{ matches, normalized, … }` |

`rules` are grouped: `[{ group, icon, rules:[{ id, field, applies, pattern, example, error, normalize[],
required, status, variants[] }] }]`. `RulesetResponse` also carries `version, status, note, active_rules,
created_at, published_at`. The **live tester** applies `normalize` steps (Trim spaces / Remove spaces /
Uppercase / Lowercase) then matches the value against the Java-regex `pattern` (invalid pattern →
`pattern_error`); it is stateless and never touches the stored ruleset.

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
curl -s -X POST "$B/platform/organization/modules" -H "$AH" -H "$J" \
  -d '{"code":"BILLING","name":"Billing","status":"PUBLISHED"}'        # register + publish so it grants MODULE_BILLING
curl -s -X POST "$B/platform/organization/roles" -H "$AH" -H "$J" \
  -d '{"name":"Finance Operator","hex_color":"#6741D9","permission_codes":["TENANT_VIEW","CONFIG_PRICING"]}'  # → role_id in result.id
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
curl -s -X POST "$B/platform/payers/$PAYER/tenants/1/documents" -H "$AH" \
  -F 'category=SIGNED_CONTRACT' -F 'file=@contract.pdf'
curl -s -X POST "$B/platform/payers/$PAYER/submit" -H "$AH"

# --- Approval → auto-activation (must be a DIFFERENT user) -----------------
curl -s -X POST "$B/platform/payers/$PAYER/approve" -H "$PH" -H "$J" -d '{"comment":"verified"}'
curl -s "$B/platform/payers/$PAYER" -H "$AH"          # status ACTIVE, tenant schema_name populated
```

---

## 12. Endpoint matrix (CRUD coverage)

| Resource | Create | Get all | Get one | Update | Delete |
| :------- | :----- | :------ | :------ | :----- | :----- |
| Module (registry) | `POST /platform/organization/modules` | `GET …/modules` (`?status=&owner_team=`), search `GET …/modules/search?q=` | `GET …/modules/{module_id}`, activity `GET …/modules/{module_id}/activity` | `PATCH …/modules/{module_id}` (incl. publish/unpublish) | — |
| Role | `POST …/roles` (name + hex_color + permission_codes) | `GET …/roles` | `GET …/roles/{id}` | `PATCH …/roles/{id}` (name/desc/colour/permissions), `POST …/roles/{id}/permissions`, `PUT …/roles/{id}/region-scopes` | `DELETE …/roles/{id}` (custom), `DELETE …/roles/{id}/permissions/{code}` |
| Permission | `POST …/permissions` | `GET …/permissions` (`?status=&group_code=&sensitive=`), search `GET …/permissions/search?q=` | `GET …/permissions/{id}` | `POST …/permissions/{id}/activate`, `POST …/permissions/{id}/suspend` (assign via role) | `DELETE …/permissions/{id}` |
| Member / User | `POST …/members` (invite user) | `GET …/members` | `GET …/members/{id}` | `PUT …/{id}/status\|password`, `POST …/{id}/roles\|resend-invite\|revoke-invite` | `DELETE …/members/{id}`, `DELETE …/{id}/roles/{role_id}` |
| Invitation | `POST …/members` (sent on create) | — | — | `POST …/{id}/resend-invite`, accept `POST /auth/accept-invite` | `POST …/{id}/revoke-invite` |
| Session | (via login) | `GET …/auth/me/sessions`, `GET …/members/{id}/sessions` | — | — | `POST …/auth/logout`, `POST …/members/{id}/sessions/revoke` |
| Audit log | (system-written) | `GET …/audit-logs` | — | — | — |
| Pricing structure | `POST /platform/pricing-structures` | `GET /platform/pricing-structures` (`?status=`) | `GET …/{id}` | `PATCH …/{id}` (DRAFT), `POST …/{id}/activate` (enable), `POST …/{id}/archive` (disable) | — |
| Payer | `POST /platform/payers` | `GET /platform/payers`, `GET /platform/approvals` | `GET /platform/payers/{id}`, lookup `GET …/tenant-lookup`, `GET …/subdomain-check` | `PUT …/entitlements`, `PUT …/subscription`, `POST …/submit`, `POST …/approve\|reject\|request-info`, `POST …/suspend\|reactivate\|retire` | — |
| Tenant | `POST /platform/payers/{id}/tenants` | (within `PayerResponse.tenants`) | (within payer) | `POST …/tenants/{tid}/activate` (secondary); technical setup via Provisioning (§10A) | — |
| Onboarding step | (seeded on payer create) | `GET …/{id}/steps` | (within steps) | `POST …/steps/{key}/assign`, `POST …/steps/{key}/complete` | — |
| Document | `POST /platform/payers/{id}/tenants/{tid}/documents` | (within `TenantResponse.documents`) | — | — | — |
| Security policy | (singleton, seeded) | `GET /platform/settings/security-policy` | (same) | `PATCH /platform/settings/security-policy` | — |
| Data residency region | `POST /platform/settings/data-residency` | `GET /platform/settings/data-residency` | `GET …/{code}` | `PATCH …/{code}` | `DELETE …/{code}` |
| Provisioning tier | `POST /platform/settings/provisioning-tiers` | `GET /platform/settings/provisioning-tiers` | `GET …/{code}` | `PATCH …/{code}` | `DELETE …/{code}` |

**Still pending (planned P3–P7):** payer/tenant **org-detail edits** + entitlement changes on active
payers + **maker-checker** (§5.11–5.13); **tenant first-login** (set password/MFA) + platform MFA/
password/session **policies** (§5.9–5.10.1); **module registry** CRUD (sub-modules/dependencies);
**notification templates**; **dashboard** aggregates; role rename & delete; module delete. See
`docs/SCREEN_API_GAP_ANALYSIS.md` (§8) and `docs/PAYER_CONTROL_PLANE.md`.

_(Done since M1: pricing CRUD; lifecycle suspend/reactivate/retire; approvals queue (now gated on
provisioning complete); add-secondary-to-active; subscription FLAT/HYBRID + overrides; onboarding
(6 steps; technical setup moved to Provisioning), subdomain-check, tenant-lookup, contacts,
required-doc gate, and per-step assignment; Access &
Security — invitations, sessions admin, role edit/delete, permissions catalogue + role permission
matrix + region scopes, read-only SUPPORT, member suspend reason, users directory search/filter/
pagination; **tenant provisioning / system configuration + queue (PRD step 6)**.)_
