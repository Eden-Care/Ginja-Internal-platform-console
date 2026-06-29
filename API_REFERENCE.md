# Ginja Platform Console API

> Auto-generated reference for the Ginja Platform Console backend (OpenAPI `3.1.0`, API version `v1`).
> Source spec: `https://dev-api.ginja.ai/internal-platform/api/v1/v3/api-docs` · Swagger UI: `/internal-platform/api/v1/swagger-ui/index.html`

Backend API for the **Ginja AI Internal Ops Platform** (Platform Console) — used by Ginja staff to
onboard and operate payer/tenant customers, manage internal access, and maintain a compliant audit trail.

### Conventions
- **Base URL:** `/api/v1` (server port `8082`, context-path `/api/v1`).
- **Auth:** send `Authorization: Bearer <JWT>`. Click **Authorize** and paste a token. Under the `dev`
  profile mint one via `POST /dev/token?roles=PLATFORM_ADMIN`, or log in via
  `POST /platform/organization/auth/login`. Roles → `ROLE_*`, modules → `MODULE_*`, permissions → `PERM_*`.
- **JSON casing:** every request and response field is **snake_case** (global Jackson `SNAKE_CASE`).
- **Response envelope:** every response (success or error) is wrapped in a `Response`:
  `{ "status", "success", "message", "result", "error_details" }`. The documented payload is what appears
  under `result`. The `/dev/token` helper is the only un-enveloped endpoint.
- **Identifiers:** every entity has a numeric `id` (used in paths/FKs) and a human business code
  (`MBR…`, `ROL…`, `FNC…`, `PAY…`, `TNT…`, `PRC…`, `AUD…`).
- **Status codes:** `200` OK · `201` Created · `400` validation/bad input · `401` unauthenticated/revoked
  session · `403` wrong role or separation-of-duties · `404` not found · `409` conflict (duplicate /
  illegal state transition) · `500` unexpected.

Many control-plane operations are **sequential** — e.g. a payer must be created before entitlements,
entitlements before a subscription, and the payer submitted before it can be approved. Each endpoint's
description calls out the data it depends on.

## Servers

| URL | Description |
|---|---|
| `/api/v1` | Dev server (context-path /api/v1) |

## Authentication

- **`bearerAuth`** · type `http` · scheme `bearer` · format `JWT`
  - Paste a JWT (no 'Bearer ' prefix). Mint via POST /dev/token in the dev profile.

All endpoints require this scheme unless noted otherwise (the `/dev/token` helper is open in the dev profile).

## Contents

- [Authentication & Sessions](#authentication-sessions) (15)
- [Dev Tools](#dev-tools) (1)
- [Members](#members) (13)
- [Roles](#roles) (8)
- [Permissions](#permissions) (7)
- [Module Registry](#module-registry) (10)
- [Audit Log](#audit-log) (3)
- [Activity Timelines](#activity-timelines) (5)
- [Pricing Structures](#pricing-structures) (7)
- [Payer Onboarding](#payer-onboarding) (14)
- [Onboarding Steps](#onboarding-steps) (4)
- [Approvals](#approvals) (8)
- [Payer Lifecycle](#payer-lifecycle) (6)
- [Tenant Provisioning & Technical Review](#tenant-provisioning-technical-review) (11)
- [Platform Settings · Localization](#platform-settings-localization) (9)
- [Platform Settings · Security](#platform-settings-security) (14)
- [Platform Settings · Provisioning Tiers](#platform-settings-provisioning-tiers) (5)
- [Platform Settings · Data Residency](#platform-settings-data-residency) (5)
- [Dashboard](#dashboard) (1)
- [Schemas](#schemas)

---

## Authentication & Sessions

_Login, logout, accept-invite, and the caller's active sessions._

| Method | Path | Summary |
|---|---|---|
| `POST` | `/tenant/auth/login` | Tenant login (tenant-scoped, session-backed JWT) |
| `POST` | `/platform/organization/auth/mfa/webauthn/register-start` | Begin WebAuthn registration |
| `POST` | `/platform/organization/auth/mfa/webauthn/register-finish` | Finish WebAuthn registration |
| `POST` | `/platform/organization/auth/mfa/webauthn/login-finish` | Complete login (WebAuthn assertion) |
| `POST` | `/platform/organization/auth/mfa/totp/verify` | Confirm TOTP enrolment |
| `POST` | `/platform/organization/auth/mfa/totp/enroll` | Begin TOTP enrolment |
| `POST` | `/platform/organization/auth/mfa/sms/verify` | Confirm SMS enrolment |
| `POST` | `/platform/organization/auth/mfa/sms/enroll` | Begin SMS enrolment |
| `POST` | `/platform/organization/auth/mfa/login-verify` | Complete login (verify MFA) |
| `GET` | `/platform/organization/auth/mfa/backup-codes` | Remaining MFA backup codes (count only) |
| `POST` | `/platform/organization/auth/mfa/backup-codes` | Generate MFA backup codes |
| `POST` | `/platform/organization/auth/logout` | Logout (revoke the current session) |
| `POST` | `/platform/organization/auth/login` | Platform login (issue a session-backed JWT) |
| `POST` | `/platform/organization/auth/accept-invite` | Accept an invitation (set password + activate) |
| `GET` | `/platform/organization/auth/me/sessions` | List my active sessions |

### `POST` `/tenant/auth/login`

**Tenant login (tenant-scoped, session-backed JWT)**

`operationId: login`

Resolves the tenant by `subdomain` (which must be `ACTIVE` with a provisioned schema), authenticates
the user against that tenant's schema, opens the session in that schema and issues a JWT carrying the
`tenant_id` claim — so the holder's later requests and audit rows route to their tenant schema.

**Role:** public (no authentication). **Dependencies:** an active tenant with the given subdomain and
a matching member in that schema; unknown/inactive tenant or bad credentials both return a uniform
`400` to avoid tenant enumeration.

**Request body** (required): [`TenantLoginRequest`](#schema-tenantloginrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `subdomain` | string | ✓ | The tenant's subdomain (resolves the tenant schema); must be an ACTIVE tenant. _(e.g. `globex-za`)_ |
| `email` | string (email) | ✓ | User's email address within the tenant. _(e.g. `admin@globex.io`)_ |
| `password` | string | ✓ | User's password (set on first login). _(e.g. `TenantPass@123`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Login successful. |
| `400` | Unknown/inactive tenant or invalid credentials (uniform error). |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Login successful",
  "error_details": null,
  "result": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "session_id": "1a2b...",
    "expires_at": "2026-06-17T12:00:00Z",
    "member_id": 12,
    "email": "admin@globex.io",
    "roles": [
      "TENANT_ADMIN"
    ],
    "accessible_modules": [
      "CLAIMS",
      "FINANCE"
    ],
    "accessible_permissions": []
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/webauthn/register-start`

**Begin WebAuthn registration**

`operationId: webauthnRegisterStart`

Starts FIDO2/WebAuthn credential registration for the signed-in member and returns the
`navigator.credentials.create()` options (JSON-encoded). High-privilege second factor.

**Auth:** bearer.

**Responses**

| Status | Description |
|---|---|
| `200` | Creation options issued. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "WebAuthn registration started",
  "error_details": null,
  "result": {
    "public_key_json": "{\"rp\":{...},\"user\":{...},\"challenge\":\"\u2026\",\"pubKeyCredParams\":[...]}"
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/webauthn/register-finish`

**Finish WebAuthn registration**

`operationId: webauthnRegisterFinish`

Completes registration by verifying the attestation the authenticator produced; on success the
credential is stored and the member is WebAuthn-enabled.

**Auth:** bearer. **Dependencies:** a prior `/auth/mfa/webauthn/register-start`.

**Request body** (required): [`WebAuthnRegisterFinishRequest`](#schema-webauthnregisterfinishrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `response_json` | string | ✓ | The PublicKeyCredential JSON returned by the browser (stringified). |
| `label` | string |  | Optional friendly label for the security key. _(e.g. `YubiKey 5C`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | WebAuthn key registered. |
| `400` | No pending registration or invalid attestation. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "WebAuthn key registered",
  "error_details": null,
  "result": null
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/webauthn/login-finish`

**Complete login (WebAuthn assertion)**

`operationId: webauthnLoginFinish`

Finishes a two-step login whose challenge was `WEBAUTHN_LOGIN`: present the `challenge_token` from
`/auth/login` plus the `navigator.credentials.get()` assertion. On success a normal `LoginResponse`
(access token + session) is returned.

**Public.** **Dependencies:** a pending, unexpired WEBAUTHN_LOGIN challenge.

**Request body** (required): [`WebAuthnLoginFinishRequest`](#schema-webauthnloginfinishrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `challenge_token` | string | ✓ | The challenge_token from /auth/login (the WEBAUTHN_LOGIN challenge). |
| `response_json` | string | ✓ | The PublicKeyCredential JSON returned by navigator.credentials.get() (stringified). |

**Responses**

| Status | Description |
|---|---|
| `200` | Login complete (access token issued). |
| `400` | Invalid/expired challenge or failed assertion. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Login successful",
  "error_details": null,
  "result": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "session_id": "<uuid>",
    "member_id": 7,
    "email": "ops@ginja.ai"
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/totp/verify`

**Confirm TOTP enrolment**

`operationId: verifyTotp`

Confirms enrolment by verifying a current code from the authenticator against the pending secret;
on success the member is MFA-enabled and will be challenged on subsequent logins.

**Auth:** bearer. **Dependencies:** a prior `/auth/mfa/totp/enroll`.

**Request body** (required): [`TotpVerifyRequest`](#schema-totpverifyrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | The 6-digit code from the authenticator app. _(e.g. `123456`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | MFA enabled. |
| `400` | No pending enrolment or wrong code. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "MFA enabled",
  "error_details": null,
  "result": null
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/totp/enroll`

**Begin TOTP enrolment**

`operationId: enrollTotp`

Generates a TOTP secret for the signed-in member and returns the `otpauth://` URI (render as a QR
code) + the Base32 secret for manual entry. Enrolment is not active until confirmed via
`/auth/mfa/totp/verify`.

**Auth:** bearer (the signed-in member enrols themselves).

**Responses**

| Status | Description |
|---|---|
| `200` | Enrolment started. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "TOTP enrolment started",
  "error_details": null,
  "result": {
    "secret": "JBSWY3DPEHPK3PXP",
    "otpauth_uri": "otpauth://totp/Ginja%20Platform%20Console:ops@ginja.ai?secret=JBSWY3DPEHPK3PXP&issuer=Ginja%20Platform%20Console&algorithm=SHA1&digits=6&period=30"
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/sms/verify`

**Confirm SMS enrolment**

`operationId: verifySms`

Confirms SMS enrolment by verifying the texted code; on success the member is SMS-MFA-enabled and
will receive a code on subsequent logins (when they have no authenticator).

**Auth:** bearer. **Dependencies:** a prior `/auth/mfa/sms/enroll`.

**Request body** (required): [`SmsVerifyRequest`](#schema-smsverifyrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | The 6-digit code from the SMS. _(e.g. `123456`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | SMS MFA enabled. |
| `400` | No pending enrolment or wrong code. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "SMS MFA enabled",
  "error_details": null,
  "result": null
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/sms/enroll`

**Begin SMS enrolment**

`operationId: enrollSms`

Registers a phone number for SMS-OTP MFA (the fallback for members without an authenticator) and
texts it a verification code. Not active until confirmed via `/auth/mfa/sms/verify`.

**Auth:** bearer.

**Request body** (required): [`SmsEnrollRequest`](#schema-smsenrollrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `phone` | string | ✓ | Phone number in E.164 form. _(e.g. `+254712345678`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Verification code sent. |
| `400` | Missing phone number. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "SMS verification code sent",
  "error_details": null,
  "result": {
    "phone_masked": "\u2022\u2022\u2022\u2022 5678",
    "expires_at": "2026-06-18T05:10:00Z"
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/login-verify`

**Complete login (verify MFA)**

`operationId: loginVerify`

Finishes a two-step login: present the `challenge_token` from `/auth/login` plus the current
6-digit TOTP code. On success a normal `LoginResponse` (access token + session) is returned. If the
challenge was an enrolment challenge (`TOTP_ENROLL`), the verified secret is saved and the member is
marked MFA-enabled.

**Public.** **Dependencies:** a pending, unexpired challenge from `/auth/login`.

**Request body** (required): [`LoginVerifyRequest`](#schema-loginverifyrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `challenge_token` | string | ✓ | The challenge_token returned by /auth/login. _(e.g. `0428a10b14e94e98ab3047573d294365`)_ |
| `code` | string | ✓ | The 6-digit code from the authenticator app. _(e.g. `123456`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Login complete (access token issued). |
| `400` | Invalid/expired challenge or wrong code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Login successful",
  "error_details": null,
  "result": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "session_id": "<uuid>",
    "expires_at": "...",
    "member_id": 7,
    "email": "ops@ginja.ai",
    "roles": [
      "FINANCE_OPERATOR"
    ],
    "accessible_modules": [
      "TENANT_MANAGEMENT"
    ],
    "accessible_permissions": [
      "TENANT_VIEW"
    ]
  }
}
```

</details>

---

### `GET` `/platform/organization/auth/mfa/backup-codes`

**Remaining MFA backup codes (count only)**

`operationId: remainingBackupCodes`

Returns how many unused backup codes the signed-in member has left. The codes themselves are never
returned again after generation.

**Auth:** bearer.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "codes": null,
    "remaining": 7
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/mfa/backup-codes`

**Generate MFA backup codes**

`operationId: generateBackupCodes`

Generates a fresh set of single-use recovery codes for the signed-in member, **invalidating any
previous codes**. The plaintext codes are returned **once** here (store them securely); thereafter
only the remaining count is available. A backup code can be used in place of TOTP/SMS at
`/auth/mfa/login-verify`.

**Auth:** bearer (members manage their own codes).

**Responses**

| Status | Description |
|---|---|
| `200` | Codes generated (shown once). |
| `401` | Not authenticated. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Backup codes generated",
  "error_details": null,
  "result": {
    "codes": [
      "ABCDE-FGHJK",
      "KMNPQ-RSTUV",
      "..."
    ],
    "remaining": 10
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/logout`

**Logout (revoke the current session)**

`operationId: logout`

Revokes the session identified by the token's `sid` claim, so the bearer token can no longer be used.

**Role:** any authenticated member (bearer token). **Dependencies:** a valid bearer token carrying
a `sid`; the call is idempotent if the session is already revoked.

**Responses**

| Status | Description |
|---|---|
| `200` | Logout successful. |
| `401` | Missing, invalid or already-revoked bearer token/session. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Logout successful",
  "error_details": null,
  "result": null
}
```

</details>

---

### `POST` `/platform/organization/auth/login`

**Platform login (issue a session-backed JWT)**

`operationId: login_1`

Authenticates a member by email + password, mints an HS256 JWT and opens a server-side session.
The token carries `roles`, `modules`, `member_id` and a session id (`sid`); later requests are
rejected with `401` once that session is revoked or expires.

**Role:** public (no authentication). **Dependencies:** the member must exist and be active
(an `INVITED` member must first accept their invite or have a password set). The returned
`accessible_modules`/`accessible_permissions` are the union across the member's assigned roles.

**Request body** (required): [`LoginRequest`](#schema-loginrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | Member's email address. _(e.g. `admin@ginja.ai`)_ |
| `password` | string | ✓ | Member's password. _(e.g. `Admin@12345`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Login successful. |
| `400` | Invalid credentials or inactive member. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Login successful",
  "error_details": null,
  "result": {
    "access_token": "<jwt>",
    "token_type": "Bearer",
    "session_id": "8f3c...",
    "expires_at": "2026-06-17T12:00:00Z",
    "member_id": 1,
    "email": "admin@ginja.ai",
    "roles": [
      "PLATFORM_ADMIN"
    ],
    "accessible_modules": [
      "CLAIMS",
      "FINANCE"
    ],
    "accessible_permissions": [
      "ACCESS_MANAGE"
    ]
  }
}
```

</details>

---

### `POST` `/platform/organization/auth/accept-invite`

**Accept an invitation (set password + activate)**

`operationId: acceptInvite`

Validates an invitation token, sets the member's password and activates them.

**Role:** public (no authentication). **Dependencies:** requires a pending, unexpired invite
token previously minted by `POST /platform/organization/members/{member_id}/invite` (or by
onboarding with `send_invite:true`). After success the member can log in via
`POST /platform/organization/auth/login`.

**Request body** (required): [`AcceptInviteRequest`](#schema-acceptinviterequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `token` | string | ✓ | The pending, unexpired invite token e-mailed to the user when they were invited (POST /platform/organization/members) or re-invited (resend-invite). _(e.g. `f47ac10b58cc4372a5670e02b2c3d479`)_ |
| `password` | string | ✓ | The member's chosen password. _(e.g. `NewPass@123`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Invitation accepted; the member can now log in. |
| `400` | Invalid, expired or already-used invite token, or weak password. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Invitation accepted \u2014 you can now log in",
  "error_details": null,
  "result": null
}
```

</details>

---

### `GET` `/platform/organization/auth/me/sessions`

**List my active sessions**

`operationId: mySessions`

Returns the caller's own currently-active sessions (resolved from the token's `member_id`),
for the "my sessions" view.

**Role:** any authenticated member (bearer token). **Dependencies:** a valid bearer token; the
member id is read from the token, so callers only ever see their own sessions.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `401` | Missing, invalid or revoked bearer token/session. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "session_id": "8f3c...",
      "user_session_id": "SES000001",
      "member_id": 1,
      "status": "ACTIVE",
      "issued_at": "2026-06-17T04:00:00Z",
      "expires_at": "2026-06-17T12:00:00Z",
      "last_seen_at": "2026-06-17T04:30:00Z"
    }
  ]
}
```

</details>

---

## Dev Tools

_Dev-profile-only helpers (HS256 token minting). Not available in production._

| Method | Path | Summary |
|---|---|---|
| `POST` | `/dev/token` | Mint a dev test token (dev profile only) |

### `POST` `/dev/token`

**Mint a dev test token (dev profile only)**

`operationId: token`

Mints an HS256 test JWT for exercising secured endpoints with `Authorization: Bearer <token>`.
Provide `tenant` for a tenant-scoped token (sets the `tenant_id` claim), and/or `roles`
(comma-separated) for a platform token; omit `tenant` for control-plane calls so they resolve to
the default schema.

**Role:** public, but only registered under the `dev` profile — never exposed in production.
**Dependencies:** none.

**Response shape:** this is the ONLY endpoint that is NOT wrapped in the standard `Response`
envelope — it returns the token JSON directly.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenant` | query |  | string | Tenant id for a tenant-scoped token; omit for a platform token. |
| `subject` | query |  | string | JWT subject (`sub`); used for audit + separation of duties. |
| `roles` | query |  | string | Comma-separated roles, e.g. `PLATFORM_ADMIN` or `PLATFORM_ADMIN,PLATFORM_APPROVER`. |

**Responses**

| Status | Description |
|---|---|
| `200` | Token minted (un-enveloped). |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "access_token": "<jwt>",
  "tenant_id": null,
  "roles": [
    "PLATFORM_ADMIN"
  ]
}
```

</details>

---

## Members

_Internal Platform Console users: onboard, search, status, password, roles, invites, sessions._

| Method | Path | Summary |
|---|---|---|
| `PUT` | `/platform/organization/members/{memberId}/status` | Change member status |
| `PUT` | `/platform/organization/members/{memberId}/password` | Set / reset member password |
| `GET` | `/platform/organization/members` | List members (directory) |
| `POST` | `/platform/organization/members` | Invite a user |
| `POST` | `/platform/organization/members/{memberId}/unlock` | Unlock a member |
| `POST` | `/platform/organization/members/{memberId}/sessions/revoke` | Revoke member sessions |
| `POST` | `/platform/organization/members/{memberId}/roles` | Assign roles to a member |
| `POST` | `/platform/organization/members/{memberId}/revoke-invite` | Revoke a member invite |
| `POST` | `/platform/organization/members/{memberId}/resend-invite` | Resend a member invite |
| `GET` | `/platform/organization/members/{memberId}` | Get a member |
| `DELETE` | `/platform/organization/members/{memberId}` | Delete a member |
| `GET` | `/platform/organization/members/{memberId}/sessions` | List member sessions |
| `DELETE` | `/platform/organization/members/{memberId}/roles/{roleId}` | Un-assign a role from a member |

### `PUT` `/platform/organization/members/{memberId}/status`

**Change member status**

`operationId: setStatus`

Changes a member's lifecycle status (`INVITED|ACTIVE|SUSPENDED|DISABLED`). `reason` is **mandatory when
suspending** (`400` if missing) and is recorded in the audit trail. `SUSPENDED`/`DISABLED` revoke the
member's active sessions; reactivate with `{ "status": "ACTIVE" }`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`SetMemberStatusRequest`](#schema-setmemberstatusrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `status` | string enum: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED` | ✓ | Target status (INVITED\|ACTIVE\|SUSPENDED\|DISABLED). _(e.g. `SUSPENDED`)_ |
| `reason` | string |  | Reason for the change; mandatory when suspending. Recorded in the audit trail. _(e.g. `Policy violation`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Missing reason when suspending, or invalid status. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Member status updated",
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "SUSPENDED",
    "status_reason": "Policy violation",
    "mfa_enabled": false,
    "roles": [
      {
        "id": 2,
        "name": "FINANCE_OPERATOR"
      }
    ],
    "accessible_modules": [
      "FINANCE"
    ],
    "accessible_permissions": [
      "CLAIMS_VIEW"
    ],
    "invited_by": "Platform Administrator",
    "invite_expires_at": null,
    "invite_expired": false,
    "member_since": "2026-06-17T04:06:37Z",
    "last_active": "2026-06-17T09:15:00Z",
    "active_sessions": 0,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `PUT` `/platform/organization/members/{memberId}/password`

**Set / reset member password**

`operationId: setPassword`

Sets or resets a member's password (8–100 chars). Activates an `INVITED` member.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`SetPasswordRequest`](#schema-setpasswordrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `password` | string | ✓ | New password (8-100 chars). Activates an INVITED member. _(e.g. `NewPass@123`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Password fails validation (length 8–100). |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Password updated",
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "ACTIVE",
    "status_reason": null,
    "mfa_enabled": false,
    "roles": [
      {
        "id": 2,
        "name": "FINANCE_OPERATOR"
      }
    ],
    "accessible_modules": [
      "FINANCE"
    ],
    "accessible_permissions": [
      "CLAIMS_VIEW"
    ],
    "invited_by": "Platform Administrator",
    "invite_expires_at": null,
    "invite_expired": false,
    "member_since": "2026-06-17T04:06:37Z",
    "last_active": null,
    "active_sessions": 0,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `GET` `/platform/organization/members`

**List members (directory)**

`operationId: listMembers`

Users directory: optional case-insensitive substring search on name or email (`q`), optional `status`
filter (`INVITED|ACTIVE|SUSPENDED|DISABLED`), and pagination (`page` 0-based, `size` default 20,
`sort` default `createdAt,desc`). The `result` is a paged envelope.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `q` | query |  | string |  |
| `status` | query |  | string enum: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED` |  |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Invalid status value. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "id": 7,
        "member_id": "MBR000007",
        "email": "ops@ginja.ai",
        "full_name": "Ops User",
        "status": "ACTIVE",
        "status_reason": null,
        "mfa_enabled": false,
        "roles": [
          {
            "id": 2,
            "name": "FINANCE_OPERATOR"
          }
        ],
        "accessible_modules": [
          "FINANCE"
        ],
        "accessible_permissions": [
          "CLAIMS_VIEW"
        ],
        "invited_by": "Platform Administrator",
        "invite_expires_at": null,
        "invite_expired": false,
        "member_since": "2026-06-17T04:06:37Z",
        "last_active": "2026-06-17T09:15:00Z",
        "active_sessions": 1,
        "created_at": "2026-06-17T04:06:37Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 4,
    "total_pages": 1
  }
}
```

</details>

---

### `POST` `/platform/organization/members`

**Invite a user**

`operationId: inviteUser`

The "Invite user" form (Access & Security → Users). Creates a new member as `INVITED`, assigns the
selected roles, and sends a time-limited activation email — all in one call. The member does **not**
get a password here; they set their own when they accept the invite
(`POST /platform/organization/auth/accept-invite`). Fetch the role options from
`GET /platform/organization/roles`.

The created member, the role assignment(s) and the invitation are each recorded on the member's
activity timeline (`GET /platform/organization/members/{member_id}/activity`).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** any `role_ids` supplied must already exist.

**Request body** (required): [`InviteMemberRequest`](#schema-invitememberrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | Member email (login identifier); must be unique. The invite is sent here. _(e.g. `ops@ginja.ai`)_ |
| `full_name` | string | ✓ | Member's full display name. _(e.g. `Ops User`)_ |
| `role_ids` | array&lt;integer (int64)&gt; |  | Role ids to assign to the member (fetch options from GET /platform/organization/roles). |
| `expiry_days` | integer (int32) |  | Invite validity in days (1-90, default 7). _(e.g. `7`)_ |

**Responses**

| Status | Description |
|---|---|
| `201` | Member created + invited. |
| `400` | Invalid or missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A member with this email already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "INVITED",
    "status_reason": null,
    "mfa_enabled": false,
    "roles": [
      {
        "id": 2,
        "name": "FINANCE_OPERATOR"
      }
    ],
    "accessible_modules": [],
    "accessible_permissions": [],
    "invited_by": "Platform Administrator",
    "invite_expires_at": "2026-06-24T04:06:37Z",
    "invite_expired": false,
    "member_since": null,
    "last_active": null,
    "active_sessions": 0,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `POST` `/platform/organization/members/{memberId}/unlock`

**Unlock a member**

`operationId: unlock`

Clears a member's failed-login lockout (resets the failed-attempt counter and the lock window), so
they can sign in again immediately without waiting for the lockout to expire. A password reset
(`PUT …/{memberId}/password`) also clears the lock.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Member unlocked. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Member unlocked",
  "error_details": null,
  "result": {
    "id": 22,
    "member_id": "MBR000022",
    "email": "approver@ginja.ai",
    "status": "ACTIVE"
  }
}
```

</details>

---

### `POST` `/platform/organization/members/{memberId}/sessions/revoke`

**Revoke member sessions**

`operationId: revokeSessions`

Revokes all of the member's active sessions and returns the count revoked.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Revoked 2 session(s)",
  "error_details": null,
  "result": {
    "revoked": 2
  }
}
```

</details>

---

### `POST` `/platform/organization/members/{memberId}/roles`

**Assign roles to a member**

`operationId: assignRoles`

Assigns one or more roles (by id) to a member (idempotent). The member's effective
`accessible_modules`/`accessible_permissions` update accordingly.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist; each role must already exist
(`POST /platform/organization/roles`) before it can be assigned (unknown role → `404`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`AssignRolesRequest`](#schema-assignrolesrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `role_ids` | array&lt;integer (int64)&gt; | ✓ | Role ids to assign (idempotent). Each role must already exist. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Empty role id list. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member not found or an unknown role id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Roles assigned",
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "ACTIVE",
    "status_reason": null,
    "mfa_enabled": false,
    "roles": [
      {
        "id": 2,
        "name": "FINANCE_OPERATOR"
      },
      {
        "id": 3,
        "name": "CLAIMS_REVIEWER"
      }
    ],
    "accessible_modules": [
      "FINANCE",
      "CLAIMS"
    ],
    "accessible_permissions": [
      "CLAIMS_VIEW"
    ],
    "invited_by": "Platform Administrator",
    "invite_expires_at": null,
    "invite_expired": false,
    "member_since": "2026-06-17T04:06:37Z",
    "last_active": null,
    "active_sessions": 0,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `POST` `/platform/organization/members/{memberId}/revoke-invite`

**Revoke a member invite**

`operationId: revokeInvite`

Cancels the member's pending invitation (invalidates the token).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist and have a pending invitation.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Invitation revoked. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member or pending invitation not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Invitation revoked",
  "error_details": null,
  "result": null
}
```

</details>

---

### `POST` `/platform/organization/members/{memberId}/resend-invite`

**Resend a member invite**

`operationId: resendInvite`

Re-issues the activation invite — invalidates any prior token and sends a fresh one with a new
expiry. Use this when the original invite **expired** (or was lost) so the user can accept again.
Recorded on the member's activity timeline.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist and still be `INVITED` (an
already-active member cannot be re-invited).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Invitation resent. |
| `400` | Member is not awaiting an invitation (already active). |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Invitation resent",
  "error_details": null,
  "result": null
}
```

</details>

---

### `GET` `/platform/organization/members/{memberId}`

**Get a member**

`operationId: getMember`

Returns a single member by their numeric id, enriched with roles, effective modules/permissions and
session info.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "ACTIVE",
    "status_reason": null,
    "mfa_enabled": false,
    "roles": [
      {
        "id": 2,
        "name": "FINANCE_OPERATOR"
      }
    ],
    "accessible_modules": [
      "FINANCE"
    ],
    "accessible_permissions": [
      "CLAIMS_VIEW"
    ],
    "invited_by": "Platform Administrator",
    "invite_expires_at": null,
    "invite_expired": false,
    "member_since": "2026-06-17T04:06:37Z",
    "last_active": "2026-06-17T09:15:00Z",
    "active_sessions": 1,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `DELETE` `/platform/organization/members/{memberId}`

**Delete a member**

`operationId: deleteMember`

Hard-deletes the member; their role assignments and sessions cascade.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Deleted. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "User deleted",
  "error_details": null,
  "result": null
}
```

</details>

---

### `GET` `/platform/organization/members/{memberId}/sessions`

**List member sessions**

`operationId: listSessions_1`

Returns the member's currently active sessions (Users → Sessions tab).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** the member must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": "SES000001",
      "ip_address": "41.90.0.1",
      "user_agent": "Mozilla/5.0",
      "created_at": "2026-06-17T09:00:00Z",
      "last_active": "2026-06-17T09:15:00Z"
    }
  ]
}
```

</details>

---

### `DELETE` `/platform/organization/members/{memberId}/roles/{roleId}`

**Un-assign a role from a member**

`operationId: unassignRole`

Removes a role assignment from a member; their effective module/permission access updates accordingly.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the member must exist and the role must currently be
assigned to them (`404` if not).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) |  |
| `roleId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member not found or role not assigned. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Role un-assigned",
  "error_details": null,
  "result": {
    "id": 7,
    "member_id": "MBR000007",
    "email": "ops@ginja.ai",
    "full_name": "Ops User",
    "status": "ACTIVE",
    "status_reason": null,
    "mfa_enabled": false,
    "roles": [],
    "accessible_modules": [],
    "accessible_permissions": [],
    "invited_by": "Platform Administrator",
    "invite_expires_at": null,
    "invite_expired": false,
    "member_since": "2026-06-17T04:06:37Z",
    "last_active": null,
    "active_sessions": 0,
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

## Roles

_SYSTEM (immutable) and CUSTOM roles; map functionalities, permissions, and region scopes._

| Method | Path | Summary |
|---|---|---|
| `PUT` | `/platform/organization/roles/{roleId}/region-scopes` | Set region scopes on a role |
| `GET` | `/platform/organization/roles` | List roles |
| `POST` | `/platform/organization/roles` | Create a role |
| `POST` | `/platform/organization/roles/{roleId}/permissions` | Assign permissions to a role |
| `GET` | `/platform/organization/roles/{roleId}` | Get a role |
| `PATCH` | `/platform/organization/roles/{roleId}` | Edit a role |
| `DELETE` | `/platform/organization/roles/{roleId}` | Delete a role |
| `DELETE` | `/platform/organization/roles/{roleId}/permissions/{permissionCode}` | Un-assign a permission from a role |

### `PUT` `/platform/organization/roles/{roleId}/region-scopes`

**Set region scopes on a role**

`operationId: setRegionScopes`

Replaces the role's region-scope set (de-duplicated; empty/omitted = no region restriction).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the role must exist and be CUSTOM (`400` for SYSTEM roles).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`SetRegionScopesRequest`](#schema-setregionscopesrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `regions` | array&lt;string&gt; |  | Region codes to scope the role to (de-duplicated; replaces the existing set). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Editing a SYSTEM role. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No role with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Region scopes updated",
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "FINANCE_OPERATOR",
    "role_name": "FINANCE_OPERATOR",
    "description": "Finance + claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#6741D9",
    "permissions": [],
    "region_scopes": [
      "af-west-1",
      "af-east-1"
    ],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `GET` `/platform/organization/roles`

**List roles**

`operationId: listRoles`

Returns all roles (SYSTEM and CUSTOM) with their colour, assigned permissions and region scopes.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 2,
      "role_id": "ROL000002",
      "name": "FINANCE_OPERATOR",
      "role_name": "FINANCE_OPERATOR",
      "description": "Finance + claims",
      "type": "CUSTOM",
      "status": "ACTIVE",
      "hex_color": "#6741D9",
      "permissions": [],
      "region_scopes": [],
      "created_at": "2026-06-17T04:06:37Z"
    }
  ]
}
```

</details>

---

### `POST` `/platform/organization/roles`

**Create a role**

`operationId: createRole`

Creates a CUSTOM role. The `name` is normalised to UPPER_SNAKE and used as the JWT role authority;
`hex_color` sets the badge colour and `permission_codes` defines the role's capabilities.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** any `permission_codes` supplied must already exist in
the permission catalogue (`GET /platform/organization/permissions`).

**Request body** (required): [`CreateRoleRequest`](#schema-createrolerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string | ✓ | Role name; normalised to UPPER_SNAKE and used as the JWT role authority. _(e.g. `Finance Operator`)_ |
| `description` | string |  | Optional longer description of the role. _(e.g. `Finance + claims`)_ |
| `hex_color` | string |  | Accent colour for the role badge, as a hex string. _(e.g. `#6741D9`)_ |
| `permission_codes` | array&lt;string&gt; |  | Permission codes that define this role (each must exist in the catalogue). |

**Responses**

| Status | Description |
|---|---|
| `201` | Created. |
| `400` | Invalid name/colour or missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | An unknown permission code was supplied. |
| `409` | A role with this name already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "FINANCE_OPERATOR",
    "role_name": "FINANCE_OPERATOR",
    "description": "Finance + claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#6741D9",
    "permissions": [
      {
        "id": 9,
        "permission_id": "PRM000009",
        "code": "CONFIG_PRICING",
        "name": "Manage pricing & plans",
        "description": "Edit subscription models and tiers.",
        "group_code": "CONFIG_LIBRARY",
        "group_label": "Configuration library",
        "sensitive": true,
        "status": "ACTIVE"
      }
    ],
    "region_scopes": [],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `POST` `/platform/organization/roles/{roleId}/permissions`

**Assign permissions to a role**

`operationId: assignPermissions`

Assigns one or more permissions (by code) to a role (idempotent). The role's `permissions` array is
returned. Use this for incremental edits; full create/edit can pass `permission_codes` directly.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the role must exist and be CUSTOM; each permission code must
already exist in the permission catalogue.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`AssignPermissionsRequest`](#schema-assignpermissionsrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `permission_codes` | array&lt;string&gt; | ✓ | Permission codes to assign (idempotent). Each must exist in the permission catalogue. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Editing a SYSTEM role. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Unknown role or permission code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Permissions assigned",
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "FINANCE_OPERATOR",
    "role_name": "FINANCE_OPERATOR",
    "description": "Finance + claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#6741D9",
    "permissions": [
      {
        "id": 6,
        "permission_id": "PRM000006",
        "code": "APPROVAL_DECIDE",
        "name": "Approve / reject",
        "description": "Make checker decisions on submissions.",
        "group_code": "APPROVALS",
        "group_label": "Approvals",
        "sensitive": true,
        "status": "ACTIVE"
      }
    ],
    "region_scopes": [],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `GET` `/platform/organization/roles/{roleId}`

**Get a role**

`operationId: getRole`

Returns a single role by its numeric id, including colour, assigned permissions and region scopes.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** the role must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No role with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "FINANCE_OPERATOR",
    "role_name": "FINANCE_OPERATOR",
    "description": "Finance + claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#6741D9",
    "permissions": [],
    "region_scopes": [],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `PATCH` `/platform/organization/roles/{roleId}`

**Edit a role**

`operationId: updateRole`

Partially updates a CUSTOM role's name, description and/or colour (only non-null fields apply). When
`permission_codes` is supplied it **replaces** the role's whole permission set; omit it to leave
permissions unchanged.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the role must exist and be CUSTOM — SYSTEM roles are
immutable (`400`); supplied permission codes must exist (`404`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |

**Request body** (required): [`UpdateRoleRequest`](#schema-updaterolerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New role name; normalised to UPPER_SNAKE. Null to leave unchanged. _(e.g. `Claims Reviewer`)_ |
| `description` | string |  | New description. Null to leave unchanged. _(e.g. `Reviews submitted claims`)_ |
| `hex_color` | string |  | New accent colour (hex). Null to leave unchanged. _(e.g. `#E03131`)_ |
| `permission_codes` | array&lt;string&gt; |  | Replacement permission set (codes). When provided, replaces the role's whole permission set; null leaves it unchanged. |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `400` | Attempt to edit a SYSTEM role. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No role with this id, or unknown permission code. |
| `409` | A role with this name already exists. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Role updated",
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "CLAIMS_REVIEWER",
    "role_name": "CLAIMS_REVIEWER",
    "description": "Reviews submitted claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#E03131",
    "permissions": [],
    "region_scopes": [],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

### `DELETE` `/platform/organization/roles/{roleId}`

**Delete a role**

`operationId: deleteRole`

Deletes a CUSTOM role. Mapped role→permission and region-scope rows cascade.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the role must exist, be CUSTOM (SYSTEM roles are protected,
`400`), and must NOT be assigned to any member (`409`) — un-assign it from all members first.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Deleted. |
| `400` | Attempt to delete a SYSTEM role. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No role with this id. |
| `409` | Role is still assigned to one or more members. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Role deleted",
  "error_details": null,
  "result": null
}
```

</details>

---

### `DELETE` `/platform/organization/roles/{roleId}/permissions/{permissionCode}`

**Un-assign a permission from a role**

`operationId: unassignPermission`

Removes a permission from a role.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the role must exist and be CUSTOM (`400` for SYSTEM roles);
the permission must currently be assigned to the role (`404` if not).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `roleId` | path | ✓ | integer (int64) |  |
| `permissionCode` | path | ✓ | string |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Editing a SYSTEM role. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Role not found or permission not assigned. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Permission un-assigned",
  "error_details": null,
  "result": {
    "id": 2,
    "role_id": "ROL000002",
    "name": "FINANCE_OPERATOR",
    "role_name": "FINANCE_OPERATOR",
    "description": "Finance + claims",
    "type": "CUSTOM",
    "status": "ACTIVE",
    "hex_color": "#6741D9",
    "permissions": [],
    "region_scopes": [],
    "created_at": "2026-06-17T04:06:37Z"
  }
}
```

</details>

---

## Permissions

_Creatable permission catalogue assigned to roles; surfaced as PERM_* authorities._

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/organization/permissions` | List permissions (filter) |
| `POST` | `/platform/organization/permissions` | Create a permission |
| `POST` | `/platform/organization/permissions/{id}/suspend` | Suspend a permission |
| `POST` | `/platform/organization/permissions/{id}/activate` | Activate a permission |
| `GET` | `/platform/organization/permissions/{id}` | Get a permission |
| `DELETE` | `/platform/organization/permissions/{id}` | Delete a permission |
| `GET` | `/platform/organization/permissions/search` | Search permissions |

### `GET` `/platform/organization/permissions`

**List permissions (filter)**

`operationId: list_3`

Returns the permission catalogue, with optional filters: `status` (`ACTIVE`/`INACTIVE`),
`group_code` (e.g. `TENANT_MANAGEMENT`), and `sensitive` (`true`/`false`). Sorted by code.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `status` | query |  | string enum: `ACTIVE`, `INACTIVE` | Filter by lifecycle status. |
| `groupCode` | query |  | string | Filter by capability group code. |
| `sensitive` | query |  | boolean | Filter by sensitivity. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 6,
      "permission_id": "PRM000006",
      "code": "APPROVAL_DECIDE",
      "name": "Approve / reject",
      "description": "Make checker decisions on submissions.",
      "group_code": "APPROVALS",
      "group_label": "Approvals",
      "sensitive": true,
      "status": "ACTIVE"
    }
  ]
}
```

</details>

---

### `POST` `/platform/organization/permissions`

**Create a permission**

`operationId: create_3`

Registers a new permission in the catalogue. The `code` is normalised to UPPER_SNAKE and becomes the
`PERM_<code>` authority carried in a member's login JWT (via the roles they hold).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none — this is the start of the chain
(create permission → assign to a role via `POST /platform/organization/roles/{role_id}/permissions`
→ assign the role to a member). A baseline set is already seeded.

**Request body** (required): [`CreatePermissionRequest`](#schema-createpermissionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Permission code; normalised to UPPER_SNAKE and exposed as the PERM_<code> authority. _(e.g. `REPORTS_EXPORT`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Export Reports`)_ |
| `description` | string |  | Optional longer description of what the permission grants. _(e.g. `Allows exporting reports`)_ |
| `group_code` | string |  | Capability group code this permission belongs to. _(e.g. `OBSERVABILITY`)_ |
| `group_label` | string |  | Human-readable group label. _(e.g. `Observability`)_ |
| `sensitive` | boolean |  | Whether this is a sensitive capability. _(e.g. `False`)_ |

**Responses**

| Status | Description |
|---|---|
| `201` | Created. |
| `400` | Invalid code or missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A permission with this code already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 11,
    "permission_id": "PRM000011",
    "code": "REPORTS_EXPORT",
    "name": "Export Reports",
    "description": "Allows exporting reports",
    "status": "ACTIVE"
  }
}
```

</details>

---

### `POST` `/platform/organization/permissions/{id}/suspend`

**Suspend a permission**

`operationId: suspend_1`

Suspends a permission (status → `INACTIVE`; idempotent). A suspended permission stays in the
catalogue and its role mappings are retained, but it no longer grants its `PERM_<code>` authority
(effective from the member's next login).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the permission must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Suspended. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No permission with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Permission suspended",
  "error_details": null,
  "result": {
    "id": 9,
    "permission_id": "PRM000009",
    "code": "CONFIG_PRICING",
    "name": "Manage pricing & plans",
    "group_code": "CONFIG_LIBRARY",
    "group_label": "Configuration library",
    "sensitive": true,
    "status": "INACTIVE"
  }
}
```

</details>

---

### `POST` `/platform/organization/permissions/{id}/activate`

**Activate a permission**

`operationId: activate_1`

Activates a permission (status → `ACTIVE`; idempotent). Roles holding it grant its `PERM_<code>`
authority again on the member's next login.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the permission must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Activated. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No permission with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Permission activated",
  "error_details": null,
  "result": {
    "id": 9,
    "permission_id": "PRM000009",
    "code": "CONFIG_PRICING",
    "name": "Manage pricing & plans",
    "group_code": "CONFIG_LIBRARY",
    "group_label": "Configuration library",
    "sensitive": true,
    "status": "ACTIVE"
  }
}
```

</details>

---

### `GET` `/platform/organization/permissions/{id}`

**Get a permission**

`operationId: get_8`

Returns a single permission by its numeric id.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** the permission must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No permission with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 11,
    "permission_id": "PRM000011",
    "code": "CLAIMS_APPROVE",
    "name": "Approve Claims",
    "description": "Allows approving submitted claims",
    "status": "ACTIVE"
  }
}
```

</details>

---

### `DELETE` `/platform/organization/permissions/{id}`

**Delete a permission**

`operationId: delete_2`

Removes a permission from the catalogue.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the permission must exist and must NOT be assigned to any
role — un-assign it from all roles first (`DELETE /platform/organization/roles/{role_id}/permissions/{permission_code}`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Deleted. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No permission with this id. |
| `409` | Permission is still assigned to one or more roles. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Permission deleted",
  "error_details": null,
  "result": null
}
```

</details>

---

### `GET` `/platform/organization/permissions/search`

**Search permissions**

`operationId: search`

Case-insensitive substring search across permission `code`, `name` and `description`. Sorted by code.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `q` | query | ✓ | string | Search term matched against code / name / description. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 9,
      "permission_id": "PRM000009",
      "code": "CONFIG_PRICING",
      "name": "Manage pricing & plans",
      "description": "Edit subscription models and tiers.",
      "group_code": "CONFIG_LIBRARY",
      "group_label": "Configuration library",
      "sensitive": true,
      "status": "ACTIVE"
    }
  ]
}
```

</details>

---

## Module Registry

_The Configuration-library module catalogue (register, list/filter, search, update with publish/unpublish, activity). Module codes drive the MODULE_* authorities granted to roles._

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/organization/modules` | List modules (filter + pagination) |
| `POST` | `/platform/organization/modules` | Register a module |
| `POST` | `/platform/organization/modules/{moduleId}/versions/{version}/rollback` | Roll back to a prior module version |
| `GET` | `/platform/organization/modules/{moduleId}` | Get a module by business id |
| `PATCH` | `/platform/organization/modules/{moduleId}` | Update a module (PATCH, publish/unpublish) |
| `GET` | `/platform/organization/modules/{moduleId}/versions` | Module version history |
| `GET` | `/platform/organization/modules/{moduleId}/versions/compare` | Compare two module versions |
| `GET` | `/platform/organization/modules/{moduleId}/activity` | Module activity timeline |
| `GET` | `/platform/organization/modules/search` | Search modules |
| `GET` | `/platform/organization/modules/availability` | Check module name / code availability (real-time duplicate check) |

### `GET` `/platform/organization/modules`

**List modules (filter + pagination)**

`operationId: list_4`

Returns the module catalogue as a paged envelope, with optional `status` and `owner_team` filters.
Each row carries the module's metadata, its sub-modules, and the derived `tenants` count (number of
payers entitled to the module).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `status` | query |  | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` | Filter by lifecycle status. |
| `ownerTeam` | query |  | string | Filter by owner team (case-insensitive). |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `code,asc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "id": 1,
        "module_id": "MRC000001",
        "code": "CLAIMS",
        "name": "Claims Management",
        "version": "4.2.0",
        "status": "PUBLISHED",
        "owner_team": "Claims Platform",
        "tenants": 22,
        "sub_modules": []
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 9,
    "total_pages": 1
  }
}
```

</details>

---

### `POST` `/platform/organization/modules`

**Register a module**

`operationId: register`

Registers a new module in the catalogue (with optional sub-modules). The `code` is normalised to
UPPER_SNAKE and becomes the `MODULE_<code>` authority used to guard that module's operations; the
module is assigned a sequential business id `MRC000001`. Modules start in `DRAFT` unless a `status`
is supplied.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none — a module can later be mapped to a role
(`POST /platform/organization/roles/{role_id}/functionalities`) and entitled to payers.

**Request body** (required): [`RegisterModuleRequest`](#schema-registermodulerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Module code; normalised to UPPER_SNAKE and exposed as the MODULE_<code> authority. _(e.g. `CLAIMS`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Claims`)_ |
| `description` | string |  | Optional longer description of what the module does. _(e.g. `End-to-end claims management and processing.`)_ |
| `icon` | string |  | Icon identifier or URL for the module in the UI. _(e.g. `icon-claims`)_ |
| `url` | string |  | URL to the module's documentation or landing page. _(e.g. `https://docs.ginja.ai/claims`)_ |
| `version` | string |  | Semantic version of this module definition. _(e.g. `1.0.0`)_ |
| `owner_team` | string |  | Team responsible for this module. _(e.g. `Claims Engineering`)_ |
| `status` | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` |  | Initial lifecycle status; defaults to DRAFT if omitted. _(e.g. `DRAFT`)_ |
| `sub_modules` | array&lt;[`SubModuleRequest`](#schema-submodulerequest)&gt; |  | Sub-modules to create together with the parent module. |
| `note` | string |  | Change note recorded on the initial version (v1.0). _(e.g. `Initial registry import.`)_ |

**Responses**

| Status | Description |
|---|---|
| `201` | Created. |
| `400` | Invalid code or missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A module with this code already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 9,
    "module_id": "MRC000009",
    "code": "CLAIMS",
    "name": "Claims Management",
    "description": "Intake, adjudication and settlement of health claims.",
    "icon": "claims",
    "url": "/claims",
    "version": "4.2.0",
    "status": "DRAFT",
    "owner_team": "Claims Platform",
    "tenants": 0,
    "sub_modules": [
      {
        "id": 21,
        "sub_module_id": "SMD000021",
        "code": "INTAKE",
        "name": "Claims intake",
        "description": "Capture & validate submissions",
        "requires": null
      }
    ],
    "created_by": "1",
    "updated_by": null,
    "created_at": "2026-06-17T04:00:00Z",
    "updated_at": "2026-06-17T04:00:00Z"
  }
}
```

</details>

---

### `POST` `/platform/organization/modules/{moduleId}/versions/{version}/rollback`

**Roll back to a prior module version**

`operationId: rollback_1`

Restores a previous version's snapshot onto the live module (fields + sub-modules) and
publishes it as a NEW current version with an auto-incremented minor — nothing is overwritten,
the prior current version is simply archived and remains in the history.

**Roles:** `PLATFORM_ADMIN`. **Dependencies:** the module and target version must exist (`404`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |
| `version` | path | ✓ | string | Version to roll back to. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — refreshed module under `result`. |
| `404` | No such module or version. |

---

### `GET` `/platform/organization/modules/{moduleId}`

**Get a module by business id**

`operationId: get_6`

Returns one module by its business id (e.g. `MRC000001`), including sub-modules and the derived
`tenants` count.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT`. **Dependencies:** none; unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No module with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "module_id": "MRC000001",
    "code": "CLAIMS",
    "name": "Claims Management",
    "version": "4.2.0",
    "status": "PUBLISHED",
    "owner_team": "Claims Platform",
    "tenants": 22,
    "sub_modules": [],
    "created_by": "system",
    "updated_by": "1",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-06-17T04:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/organization/modules/{moduleId}`

**Update a module (PATCH, publish/unpublish)**

`operationId: update_6`

Partially updates a module — only the non-null fields are applied. Supplying `sub_modules` replaces
the whole set; omitting it leaves them unchanged. Setting `status` to `PUBLISHED` (from another
state) is recorded as a publish; moving away from `PUBLISHED` is recorded as an unpublish; any other
change is a plain update. Every update writes an audit entry visible on the module's activity timeline.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the module must exist (`404` otherwise).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |

**Request body** (required): [`UpdateModuleRequest`](#schema-updatemodulerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New display name. _(e.g. `Claims Management`)_ |
| `description` | string |  | New description. _(e.g. `End-to-end claims management and processing.`)_ |
| `icon` | string |  | Icon identifier or URL. _(e.g. `icon-claims-v2`)_ |
| `url` | string |  | Documentation URL. _(e.g. `https://docs.ginja.ai/claims/v2`)_ |
| `version` | string |  | Semantic version. _(e.g. `1.1.0`)_ |
| `owner_team` | string |  | Responsible team. _(e.g. `Claims Engineering`)_ |
| `status` | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` |  | New lifecycle status; PUBLISHED publishes, anything else from PUBLISHED unpublishes. _(e.g. `PUBLISHED`)_ |
| `sub_modules` | array&lt;[`SubModuleRequest`](#schema-submodulerequest)&gt; |  | Replaces the full sub-module set when non-null (existing sub-modules are deleted first). |
| `note` | string |  | Change note recorded on the new version this update creates. _(e.g. `Added Appeals & disputes sub-module.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `400` | Invalid field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No module with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "module_id": "MRC000001",
    "code": "CLAIMS",
    "name": "Claims Management",
    "version": "4.3.0",
    "status": "PUBLISHED",
    "owner_team": "Claims Platform",
    "tenants": 22,
    "sub_modules": [],
    "updated_by": "1",
    "updated_at": "2026-06-17T05:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/organization/modules/{moduleId}/versions`

**Module version history**

`operationId: versions_1`

Returns the module's version history, newest first. A new version is created automatically
when the module is registered (`1.0`) and on every update (auto-incremented minor: `1.1`,
`1.2`, …). Each row carries the change note, the user, timestamps, the `current` flag (the
single PUBLISHED version) and the immutable `snapshot` of the module at that version.

**Roles:** `PLATFORM_ADMIN`. **Dependencies:** the module must exist (`404` otherwise).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — list of versions under `result`, newest first. |
| `404` | No module with this id. |

---

### `GET` `/platform/organization/modules/{moduleId}/versions/compare`

**Compare two module versions**

`operationId: compareVersions`

The "Compare" panel: diffs two versions of a module. Returns both version snapshots plus the
computed differences — changed scalar fields (name, description, owner team, status, note) each
as `{ from, to }`, and the sub-modules added / removed between them.

**Roles:** `PLATFORM_ADMIN`. **Dependencies:** the module and both versions must exist (`404`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |
| `from` | query | ✓ | string | Baseline version. |
| `to` | query | ✓ | string | Target version. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — diff under `result`. |
| `404` | No such module or version. |

---

### `GET` `/platform/organization/modules/{moduleId}/activity`

**Module activity timeline**

`operationId: activity`

Returns one module's chronological history from the audit trail — registered, updated,
published/unpublished — with the acting user and timestamp, newest first.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT`. **Dependencies:** the module must exist (`404` otherwise).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `moduleId` | path | ✓ | string | Module business id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No module with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000050",
        "actor": "1",
        "actor_name": "admin@ginja.ai",
        "action": "MODULE_PUBLISHED",
        "module": "MODULE_REGISTRY",
        "module_label": "Module registry",
        "entity_type": "Module",
        "entity_id": "MRC000001",
        "entity_label": "CLAIMS",
        "before": {
          "status": "DRAFT"
        },
        "after": {
          "status": "PUBLISHED"
        },
        "changes": {
          "status": {
            "from": "DRAFT",
            "to": "PUBLISHED"
          }
        },
        "reason": null,
        "created_at": "2026-06-17T05:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 2,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/organization/modules/search`

**Search modules**

`operationId: search_1`

Case-insensitive substring search across module `code`, `name` and `description`, returned as a
paged envelope.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT`. **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `q` | query | ✓ | string | Search term matched against code / name / description. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `code,asc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "id": 1,
        "module_id": "MRC000001",
        "code": "CLAIMS",
        "name": "Claims Management",
        "status": "PUBLISHED",
        "tenants": 22,
        "sub_modules": []
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 1,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/organization/modules/availability`

**Check module name / code availability (real-time duplicate check)**

`operationId: availability`

Real-time validation for the module create/edit form: tells you whether a `code` and/or a
`name` is free to use, before submitting. Supply either or both. `code` is checked in its
normalised UPPER_SNAKE form and also reports that normalised value; `name` is matched
case-insensitively. When editing an existing module, pass `exclude_module_id` so the module's
own current value isn't reported as a clash.

Each field comes back as `{ value, normalized, available, reason }`; a field you didn't supply
is `null`. This mirrors the server-side guards — register/update reject duplicates with `409`.

**Roles:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | query |  | string | Module code to check (normalised to UPPER_SNAKE before comparison). |
| `name` | query |  | string | Module display name to check (case-insensitive). |
| `exclude_module_id` | query |  | string | When editing, the module's own business id to exclude from the check. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — availability under `result`. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "code": {
      "value": "Claims",
      "normalized": "CLAIMS",
      "available": false,
      "reason": "A module with this code already exists."
    },
    "name": {
      "value": "Claims X",
      "normalized": "Claims X",
      "available": true,
      "reason": null
    }
  }
}
```

</details>

---

## Audit Log

_Append-only, module-tagged compliance trail and the module filter catalogue._

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/organization/audit-logs` | List audit-log entries (paged, filterable) |
| `GET` | `/platform/organization/audit-logs/modules` | List audit-log module filters |
| `GET` | `/platform/organization/audit-logs/export` | Export the audit log (CSV or JSON) |

### `GET` `/platform/organization/audit-logs`

**List audit-log entries (paged, filterable)**

`operationId: listAuditLogs`

Returns the append-only compliance trail, newest first, with optional filtering. Each entry is
tagged with the functional `module` it belongs to (derived from its `action`), so the trail can be
browsed per feature area.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none — entries are written
by the system. Tenant-scoped operations write their rows into the tenant schema's `audit_log`; this
endpoint reads the schema resolved from the caller's token (platform admin → `public`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `entity_type` | query |  | string | Filter by entity type, e.g. `OrgMember`, `Role`, `Payer`. |
| `entity_id` | query |  | string | Filter by entity business code, e.g. `MBR000001` (usually combined with `entity_type`). |
| `action` | query |  | string | Filter by action code, e.g. `PAYER_APPROVED`, `ROLE_CREATED`. |
| `actor` | query |  | string | Filter by actor (the acting member id / subject). |
| `module` | query |  | string enum: `TENANT_ONBOARDING`, `TENANT_APPROVAL`, `TENANT_LIFECYCLE`, `TENANT_PROVISIONING`, `TECHNICAL_REVIEW`, `MEMBER_MANAGEMENT`, `MEMBER_INVITATION`, `ROLE_MANAGEMENT`, `PERMISSION_MANAGEMENT`, `MODULE_REGISTRY`, `AUTHENTICATION`, `PRICING`, `PLATFORM_SETTINGS` | Filter by functional module, e.g. `MEMBER_INVITATION` (see GET /audit-logs/modules for the catalogue). |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `400` | Invalid filter value (e.g. an unknown `module`). |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000001",
        "actor": "1",
        "actor_name": "admin@ginja.ai",
        "action": "ROLE_CREATED",
        "module": "ROLE_MANAGEMENT",
        "module_label": "Roles & permissions",
        "entity_type": "Role",
        "entity_id": "ROL000002",
        "entity_label": "FINANCE_OPERATOR",
        "before": null,
        "after": {
          "status": "ACTIVE"
        },
        "changes": null,
        "reason": null,
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 8,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/organization/audit-logs/modules`

**List audit-log module filters**

`operationId: listModules`

Returns the filter chips for the audit UI: each functional module's `code`, `label`, and the
`actions` it covers (the 12 modules span tenant onboarding/approval/lifecycle/provisioning,
technical review, member management/invite, roles, permissions, functionalities, authentication
and pricing).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none — derived from the
module enum.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "code": "ROLE_MANAGEMENT",
      "label": "Roles & permissions",
      "actions": [
        "ROLE_CREATED",
        "ROLE_UPDATED",
        "ROLE_DELETED"
      ]
    },
    {
      "code": "MEMBER_INVITATION",
      "label": "Member invite",
      "actions": [
        "MEMBER_INVITED",
        "INVITE_ACCEPTED"
      ]
    }
  ]
}
```

</details>

---

### `GET` `/platform/organization/audit-logs/export`

**Export the audit log (CSV or JSON)**

`operationId: exportAuditLogs`

Streams the filtered audit trail as a downloadable file — `format=csv` (default) or `format=json`.
Accepts the same filters as the list endpoint (entity_type/entity_id/action/actor/module). Newest
first; not paged. Use for compliance exports.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `entity_type` | query |  | string |  |
| `entity_id` | query |  | string |  |
| `action` | query |  | string |  |
| `actor` | query |  | string |  |
| `module` | query |  | string enum: `TENANT_ONBOARDING`, `TENANT_APPROVAL`, `TENANT_LIFECYCLE`, `TENANT_PROVISIONING`, `TECHNICAL_REVIEW`, `MEMBER_MANAGEMENT`, `MEMBER_INVITATION`, `ROLE_MANAGEMENT`, `PERMISSION_MANAGEMENT`, `MODULE_REGISTRY`, `AUTHENTICATION`, `PRICING`, `PLATFORM_SETTINGS` |  |
| `format` | query |  | string | Export format: `csv` (default) or `json`. |

**Responses**

| Status | Description |
|---|---|
| `200` | File stream (text/csv or application/json). |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

---

## Activity Timelines

_Per-entity chronological history (member/pricing/payer/approval/tenant), served from the audit trail._

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/pricing-structures/{id}/activity` | Pricing-structure activity timeline |
| `GET` | `/platform/payers/{payerId}/tenants/{tenantId}/activity` | Tenant activity timeline |
| `GET` | `/platform/payers/{payerId}/approval-activity` | Payer approval activity timeline |
| `GET` | `/platform/payers/{payerId}/activity` | Payer onboarding activity timeline |
| `GET` | `/platform/organization/members/{memberId}/activity` | Member activity timeline |

### `GET` `/platform/pricing-structures/{id}/activity`

**Pricing-structure activity timeline**

`operationId: pricingActivity`

Returns one pricing structure's chronological history (created, edited, activated, archived),
newest first.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the pricing structure must exist — the numeric path
id is resolved to its business code internally; an unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) | Numeric pricing-structure id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No pricing structure with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000020",
        "actor": "1",
        "actor_name": "admin@ginja.ai",
        "action": "PRICING_STRUCTURE_ACTIVATED",
        "module": "PRICING",
        "module_label": "Pricing & plans",
        "entity_type": "PricingStructure",
        "entity_id": "PRC000001",
        "entity_label": "Transaction-Based",
        "before": {
          "status": "DRAFT"
        },
        "after": {
          "status": "ACTIVE"
        },
        "changes": {
          "status": {
            "from": "DRAFT",
            "to": "ACTIVE"
          }
        },
        "reason": null,
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 4,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/payers/{payerId}/tenants/{tenantId}/activity`

**Tenant activity timeline**

`operationId: tenantActivity`

Returns one tenant's chronological history (added, technical config, documents, activation),
newest first.

**Roles:** `PLATFORM_ADMIN`, `PLATFORM_ENGINEER` or `PLATFORM_APPROVER`. **Dependencies:** the tenant
must exist — the numeric path id is resolved to its business code internally; an unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id (owning payer). |
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN, PLATFORM_ENGINEER or PLATFORM_APPROVER. |
| `404` | No tenant with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000040",
        "actor": "1",
        "actor_name": "engineer@ginja.ai",
        "action": "TENANT_ACTIVATED",
        "module": "TENANT_LIFECYCLE",
        "module_label": "Tenant lifecycle",
        "entity_type": "Tenant",
        "entity_id": "TNT000001",
        "entity_label": "Globex Insurance Ltd",
        "before": {
          "status": "PENDING_ACTIVATION"
        },
        "after": {
          "status": "ACTIVE"
        },
        "changes": {
          "status": {
            "from": "PENDING_ACTIVATION",
            "to": "ACTIVE"
          }
        },
        "reason": null,
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 5,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/payers/{payerId}/approval-activity`

**Payer approval activity timeline**

`operationId: approvalActivity`

Returns one payer's approval history — the payer trail narrowed to the approval module plus
`PAYER_SUBMITTED`: the submission and the approve / reject / request-info decisions only, newest first.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_APPROVER`. **Dependencies:** the payer must exist — the
numeric path id is resolved to its business code internally; an unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN or PLATFORM_APPROVER. |
| `404` | No payer with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000031",
        "actor": "2",
        "actor_name": "approver@ginja.ai",
        "action": "PAYER_APPROVED",
        "module": "TENANT_APPROVAL",
        "module_label": "Tenant approval",
        "entity_type": "Payer",
        "entity_id": "PAY000001",
        "entity_label": "Globex Insurance Ltd",
        "before": null,
        "after": null,
        "changes": null,
        "reason": "verified",
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 2,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/payers/{payerId}/activity`

**Payer onboarding activity timeline**

`operationId: payerActivity`

Returns one payer's chronological onboarding history (created, entitlements, subscription,
documents, submit, lifecycle), newest first. A payer's primary-tenant creation is recorded against
the payer, so it appears here.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist — the numeric path id is resolved
to its business code internally; an unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No payer with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000030",
        "actor": "1",
        "actor_name": "admin@ginja.ai",
        "action": "PAYER_SUBMITTED",
        "module": "TENANT_ONBOARDING",
        "module_label": "Tenant onboarding",
        "entity_type": "Payer",
        "entity_id": "PAY000001",
        "entity_label": "Globex Insurance Ltd",
        "before": null,
        "after": null,
        "changes": null,
        "reason": null,
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 6,
    "total_pages": 1
  }
}
```

</details>

---

### `GET` `/platform/organization/members/{memberId}/activity`

**Member activity timeline**

`operationId: memberActivity`

Returns one member's chronological history (logins, role assign/remove, status/suspension changes,
invites, password set), newest first.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT`. **Dependencies:** the member must exist — the numeric path
id is resolved to its business code internally; an unknown id → `404`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) | Numeric member id. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No member with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "audit_id": "AUD000012",
        "actor": "1",
        "actor_name": "admin@ginja.ai",
        "action": "MEMBER_STATUS_CHANGED",
        "module": "MEMBER_MANAGEMENT",
        "module_label": "Member management",
        "entity_type": "OrgMember",
        "entity_id": "MBR000006",
        "entity_label": "ops@ginja.ai",
        "before": {
          "status": "ACTIVE"
        },
        "after": {
          "status": "SUSPENDED"
        },
        "changes": {
          "status": {
            "from": "ACTIVE",
            "to": "SUSPENDED"
          }
        },
        "reason": "Policy review",
        "created_at": "2026-06-17T04:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 3,
    "total_pages": 1
  }
}
```

</details>

---

## Pricing Structures

_Versioned, tiered pricing catalogue (DRAFT → ACTIVE → ARCHIVED) bound to subscriptions._

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/pricing-structures` | List pricing structures |
| `POST` | `/platform/pricing-structures` | Create a pricing structure (DRAFT) |
| `POST` | `/platform/pricing-structures/{id}/archive` | Archive a pricing structure (ACTIVE → ARCHIVED) |
| `POST` | `/platform/pricing-structures/{id}/activate` | Activate a pricing structure (DRAFT → ACTIVE) |
| `GET` | `/platform/pricing-structures/{id}` | Get a pricing structure |
| `PATCH` | `/platform/pricing-structures/{id}` | Update a pricing structure (PATCH, DRAFT only) |
| `GET` | `/platform/pricing-structures/tenant` | List pricing options for the subscription-model picker |

### `GET` `/platform/pricing-structures`

**List pricing structures**

`operationId: list_2`

Returns all pricing structures, optionally filtered by lifecycle status. Each entry includes its
nested `components[]` and `tiers[]`. Two are seeded **ACTIVE** (Transaction-Based, % of Gross Premium).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none. Only structures with `status=ACTIVE` are attachable
to a Payer subscription (`PUT /platform/payers/{id}/subscription`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `status` | query |  | string enum: `DRAFT`, `ACTIVE`, `ARCHIVED` | Optional lifecycle filter; returns all statuses when omitted. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 1,
      "pricing_id": "PRC000001",
      "name": "Transaction-Based",
      "description": "...",
      "model": "TRANSACTION_BASED",
      "status": "ACTIVE",
      "currency": "USD",
      "implementation_fee": 400000,
      "platform_fee_annual": 0,
      "savings_capture_pct": 15.0,
      "components": [
        {
          "component_id": "PCM000001",
          "component_type": "CORE_PLATFORM_PMPM",
          "unit": "PER_MEMBER_MONTH",
          "sort_order": 1,
          "tiers": [
            {
              "tier_id": "PTR000001",
              "tier_number": 1,
              "volume_threshold_min": 0,
              "rate": 0.5,
              "discount_pct": 0.0
            }
          ]
        }
      ]
    }
  ]
}
```

</details>

---

### `POST` `/platform/pricing-structures`

**Create a pricing structure (DRAFT)**

`operationId: create_2`

Authors a new versioned commercial proposal. It is created in **DRAFT** status with its full
`components[]` (each carrying a `tiers[]` volume-discount schedule). `model` is
`TRANSACTION_BASED` or `PCT_GWP`; fees default to 0 and `currency` defaults to `USD`.

**Role:** `PLATFORM_ADMIN`. **Lifecycle / dependencies:** `DRAFT → ACTIVE → ARCHIVED`. Only a
**DRAFT** structure is editable (`PATCH /platform/pricing-structures/{id}`); `activate` moves
`DRAFT → ACTIVE`; only an **ACTIVE** structure is attachable to a subscription via
`PUT /platform/payers/{id}/subscription`; `archive` moves `ACTIVE → ARCHIVED` (no longer attachable,
frozen subscription snapshots are unaffected). Writes a `PRICING_STRUCTURE_CREATED` audit entry.

**Request body** (required): [`CreatePricingStructureRequest`](#schema-createpricingstructurerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string | ✓ | Unique display name of the pricing structure. _(e.g. `Enterprise PMPM 2026`)_ |
| `description` | string |  | Optional longer description. _(e.g. `custom`)_ |
| `model` | string enum: `TRANSACTION_BASED`, `PCT_GWP` | ✓ | Pricing model. _(e.g. `TRANSACTION_BASED`)_ |
| `currency` | string |  | ISO-4217 3-letter currency code; defaults to USD when omitted. _(e.g. `USD`)_ |
| `implementation_fee` | number |  | One-time implementation fee; defaults to 0. _(e.g. `250000`)_ |
| `platform_fee_annual` | number |  | Annual platform fee; defaults to 0. _(e.g. `0`)_ |
| `savings_capture_pct` | number |  | Savings-capture percentage. _(e.g. `12.5`)_ |
| `components` | array&lt;[`PricingComponentRequest`](#schema-pricingcomponentrequest)&gt; | ✓ | Priced lines for this structure; each component carries its own tiers[]. Must be non-empty. |

**Responses**

| Status | Description |
|---|---|
| `201` | Created in DRAFT status. |
| `400` | Empty components/tiers or missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A pricing structure with this name already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 3,
    "pricing_id": "PRC000003",
    "name": "Enterprise PMPM 2026",
    "description": "custom",
    "model": "TRANSACTION_BASED",
    "status": "DRAFT",
    "currency": "USD",
    "implementation_fee": 250000,
    "platform_fee_annual": 0,
    "savings_capture_pct": 12.5,
    "components": [
      {
        "component_id": "PCM000005",
        "component_type": "CORE_PLATFORM_PMPM",
        "unit": "PER_MEMBER_MONTH",
        "sort_order": 1,
        "tiers": [
          {
            "tier_id": "PTR000009",
            "tier_number": 1,
            "volume_threshold_min": 0,
            "rate": 0.55,
            "discount_pct": 0
          },
          {
            "tier_id": "PTR000010",
            "tier_number": 2,
            "volume_threshold_min": 100000,
            "rate": 0.48,
            "discount_pct": -12.7
          }
        ]
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/pricing-structures/{id}/archive`

**Archive a pricing structure (ACTIVE → ARCHIVED)**

`operationId: archive`

Disables the structure: `ACTIVE → ARCHIVED`. Idempotent if it is already `ARCHIVED`. An archived
structure is no longer attachable to new subscriptions; frozen subscription snapshots that already
reference it are unaffected.

**Role:** `PLATFORM_ADMIN`. **Lifecycle / dependencies:** the structure must be `ACTIVE` (or already
`ARCHIVED`). Writes a `PRICING_STRUCTURE_ARCHIVED` audit entry.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Now ARCHIVED. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No pricing structure with this id. |
| `409` | Structure is not ACTIVE. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Pricing structure archived",
  "error_details": null,
  "result": {
    "id": 3,
    "pricing_id": "PRC000003",
    "name": "Enterprise PMPM 2026",
    "description": "custom",
    "model": "TRANSACTION_BASED",
    "status": "ARCHIVED",
    "currency": "USD",
    "implementation_fee": 250000,
    "platform_fee_annual": 0,
    "savings_capture_pct": 12.5,
    "components": [
      {
        "component_id": "PCM000005",
        "component_type": "CORE_PLATFORM_PMPM",
        "unit": "PER_MEMBER_MONTH",
        "sort_order": 1,
        "tiers": [
          {
            "tier_id": "PTR000009",
            "tier_number": 1,
            "volume_threshold_min": 0,
            "rate": 0.55,
            "discount_pct": 0
          }
        ]
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/pricing-structures/{id}/activate`

**Activate a pricing structure (DRAFT → ACTIVE)**

`operationId: activate`

Enables the structure: `DRAFT → ACTIVE`. Idempotent if it is already `ACTIVE`. Once ACTIVE it becomes
attachable to a Payer subscription via `PUT /platform/payers/{id}/subscription`.

**Role:** `PLATFORM_ADMIN`. **Lifecycle / dependencies:** the structure must be `DRAFT` (or already
`ACTIVE`) and must have at least one component. Writes a `PRICING_STRUCTURE_ACTIVATED` audit entry.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Now ACTIVE. |
| `400` | Structure has no components. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No pricing structure with this id. |
| `409` | Structure is not DRAFT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Pricing structure activated",
  "error_details": null,
  "result": {
    "id": 3,
    "pricing_id": "PRC000003",
    "name": "Enterprise PMPM 2026",
    "description": "custom",
    "model": "TRANSACTION_BASED",
    "status": "ACTIVE",
    "currency": "USD",
    "implementation_fee": 250000,
    "platform_fee_annual": 0,
    "savings_capture_pct": 12.5,
    "components": [
      {
        "component_id": "PCM000005",
        "component_type": "CORE_PLATFORM_PMPM",
        "unit": "PER_MEMBER_MONTH",
        "sort_order": 1,
        "tiers": [
          {
            "tier_id": "PTR000009",
            "tier_number": 1,
            "volume_threshold_min": 0,
            "rate": 0.55,
            "discount_pct": 0
          }
        ]
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/pricing-structures/{id}`

**Get a pricing structure**

`operationId: get_5`

Fetches a single pricing structure by numeric id, including its nested `components[]` and `tiers[]`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No pricing structure with this id. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "pricing_id": "PRC000001",
    "name": "Transaction-Based",
    "description": "...",
    "model": "TRANSACTION_BASED",
    "status": "ACTIVE",
    "currency": "USD",
    "implementation_fee": 400000,
    "platform_fee_annual": 0,
    "savings_capture_pct": 15.0,
    "components": [
      {
        "component_id": "PCM000001",
        "component_type": "CORE_PLATFORM_PMPM",
        "unit": "PER_MEMBER_MONTH",
        "sort_order": 1,
        "tiers": [
          {
            "tier_id": "PTR000001",
            "tier_number": 1,
            "volume_threshold_min": 0,
            "rate": 0.5,
            "discount_pct": 0.0
          }
        ]
      }
    ]
  }
}
```

</details>

---

### `PATCH` `/platform/pricing-structures/{id}`

**Update a pricing structure (PATCH, DRAFT only)**

`operationId: update_5`

Partial update — only non-null fields are applied. If `components` is provided, the **entire**
component/tier set is replaced; if omitted, it is left unchanged.

**Role:** `PLATFORM_ADMIN`. **Lifecycle / dependencies:** only a **DRAFT** structure is editable —
attempting to PATCH an `ACTIVE` or `ARCHIVED` structure returns `409`. Writes a
`PRICING_STRUCTURE_UPDATED` audit entry.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `id` | path | ✓ | integer (int64) |  |

**Request body** (required): [`UpdatePricingStructureRequest`](#schema-updatepricingstructurerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New display name. _(e.g. `Enterprise PMPM 2026 v2`)_ |
| `description` | string |  | New description. _(e.g. `custom`)_ |
| `currency` | string |  | ISO-4217 3-letter currency code. _(e.g. `USD`)_ |
| `implementation_fee` | number |  | One-time implementation fee. _(e.g. `250000`)_ |
| `platform_fee_annual` | number |  | Annual platform fee. _(e.g. `0`)_ |
| `savings_capture_pct` | number |  | Savings-capture percentage. _(e.g. `15.0`)_ |
| `components` | array&lt;[`PricingComponentRequest`](#schema-pricingcomponentrequest)&gt; |  | If provided, fully replaces the structure's components[] (each with its tiers[]); if omitted, the existing set is left unchanged. |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `400` | Invalid payload (e.g. empty tiers in a provided component). |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No pricing structure with this id. |
| `409` | Structure is not DRAFT, or duplicate name. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Pricing structure updated",
  "error_details": null,
  "result": {
    "id": 3,
    "pricing_id": "PRC000003",
    "name": "Enterprise PMPM 2026 v2",
    "description": "custom",
    "model": "TRANSACTION_BASED",
    "status": "DRAFT",
    "currency": "USD",
    "implementation_fee": 250000,
    "platform_fee_annual": 0,
    "savings_capture_pct": 15.0,
    "components": [
      {
        "component_id": "PCM000006",
        "component_type": "CORE_PLATFORM_PMPM",
        "unit": "PER_MEMBER_MONTH",
        "sort_order": 1,
        "tiers": [
          {
            "tier_id": "PTR000011",
            "tier_number": 1,
            "volume_threshold_min": 0,
            "rate": 0.5,
            "discount_pct": 0
          }
        ]
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/pricing-structures/tenant`

**List pricing options for the subscription-model picker**

`operationId: tenantOptions`

Lightweight list of **ACTIVE** pricing structures for the onboarding "Billing & terms"
subscription-model picker (§8.4). Returns only the headline fields needed to pick a model — it
**omits** the heavy nested `components[]`/`tiers[]` that `GET /platform/pricing-structures` and
`GET /platform/pricing-structures/{id}` carry. Load full detail separately if the rate cards are needed.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Responses**

| Status | Description |
|---|---|
| `200` | OK — array of minimal ACTIVE structures. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 2,
      "pricing_id": "PRC000002",
      "name": "% of Gross Premium",
      "description": "% of GWP + $500K annual platform fee + 15% savings capture",
      "model": "PCT_GWP",
      "status": "ACTIVE",
      "currency": "USD",
      "implementation_fee": 400000.0,
      "platform_fee_annual": 500000.0,
      "savings_capture_pct": 15.0
    }
  ]
}
```

</details>

---

## Payer Onboarding

_Build a payer + its tenants incrementally in DRAFT: lookups, create, entitlements, subscription, documents, technical config, submit._

| Method | Path | Summary |
|---|---|---|
| `PUT` | `/platform/payers/{payerId}/subscription` | Set subscription |
| `PUT` | `/platform/payers/{payerId}/entitlements` | Set entitlements |
| `GET` | `/platform/payers` | List payers (filter, sort, paginate) |
| `POST` | `/platform/payers` | Create payer + primary tenant |
| `POST` | `/platform/payers/{payerId}/tenants` | Add a secondary tenant |
| `POST` | `/platform/payers/{payerId}/tenants/{tenantId}/documents` | Attach a document to a tenant |
| `POST` | `/platform/payers/{payerId}/tenants/{tenantId}/activate` | Activate a secondary tenant |
| `POST` | `/platform/payers/{payerId}/submit` | Submit payer for approval |
| `PATCH` | `/platform/payers/{payerId}/tenants/{tenantId}` | Update a tenant (partial) on a DRAFT payer |
| `DELETE` | `/platform/payers/{payerId}/tenants/{tenantId}` | Delete a secondary tenant on a DRAFT payer |
| `GET` | `/platform/payers/{payerId}` | Get a payer |
| `GET` | `/platform/payers/{payerId}/tenants/{tenantId}/documents/{documentId}` | Download a tenant document |
| `GET` | `/platform/payers/tenant-lookup` | Duplicate tenant lookup |
| `GET` | `/platform/payers/subdomain-check` | Check subdomain availability |

### `PUT` `/platform/payers/{payerId}/subscription`

**Set subscription**

`operationId: setSubscription`

Attaches a subscription to the payer (§8.4): picks an ACTIVE pricing structure, a model and a billing
frequency; the structure's price is frozen as an immutable snapshot. Completes the `billing` step.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** entitlements must already be set (§8.3) AND the chosen
pricing structure must be `ACTIVE`. A `PER_CLAIM` model additionally requires the CLAIMS module to be
enabled in the entitlements.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Request body** (required): [`SetSubscriptionRequest`](#schema-setsubscriptionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `pricing_structure_id` | integer (int64) | ✓ | Id of an ACTIVE pricing structure to select and freeze. _(e.g. `1`)_ |
| `subscription_model` | string enum: `PMPM`, `PER_CLAIM`, `PCT_GWP`, `FLAT`, `HYBRID` | ✓ | Subscription pricing model. _(e.g. `PER_CLAIM`)_ |
| `billing_frequency` | string enum: `MONTHLY`, `QUARTERLY`, `ANNUALLY` | ✓ | Billing cadence. _(e.g. `MONTHLY`)_ |
| `discount_pct` | number |  | Optional contract discount percentage. _(e.g. `10.0`)_ |
| `free_trial_days` | integer (int32) |  | Optional free-trial length in days. _(e.g. `30`)_ |
| `promotional` | boolean |  | Whether this is a promotional subscription. _(e.g. `False`)_ |
| `contract_start` | string (date) |  | Optional contract start date. _(e.g. `2026-01-01`)_ |
| `contract_end` | string (date) |  | Optional contract end date. _(e.g. `2026-12-31`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Subscription attached. |
| `400` | No entitlements yet, PER_CLAIM without CLAIMS enabled, or structure not ACTIVE. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Unknown pricing structure. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [],
    "entitlements": [],
    "subscription": {
      "subscription_id": "SUB000001",
      "pricing_structure_id": 1,
      "subscription_model": "PER_CLAIM",
      "billing_frequency": "MONTHLY",
      "discount_pct": null,
      "free_trial_days": null,
      "promotional": false,
      "contract_start": null,
      "contract_end": null,
      "pricing_snapshot": {}
    },
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `PUT` `/platform/payers/{payerId}/entitlements`

**Set entitlements**

`operationId: setEntitlements`

Replaces the payer's full module entitlement set (§8.3); module dependencies are auto-resolved.
Completes the `modules` onboarding step.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** requires an existing payer that is still `DRAFT`.
Entitlements must be set before a subscription can be attached (§8.4), and the CLAIMS module must be
enabled here for a `PER_CLAIM` subscription.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Request body** (required): [`SetEntitlementsRequest`](#schema-setentitlementsrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `entitlements` | array&lt;[`ModuleEntitlement`](#schema-moduleentitlement)&gt; | ✓ | The full set of module entitlements to apply (replaces any existing set). |

**Responses**

| Status | Description |
|---|---|
| `200` | Entitlements applied. |
| `400` | Unknown module or payer not DRAFT. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [],
    "entitlements": [
      {
        "entitlement_id": "ENT000001",
        "module_code": "CLAIMS",
        "submodule_code": null,
        "enabled": true
      },
      {
        "entitlement_id": "ENT000002",
        "module_code": "FINANCE",
        "submodule_code": "INVOICING",
        "enabled": true
      }
    ],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/payers`

**List payers (filter, sort, paginate)**

`operationId: listPayers`

Returns payers (DRAFT and beyond) with their nested tenants, entitlements and subscription, as a
**paged** envelope. Optional filters (each ignored when omitted): lifecycle `status`, `payer_type`,
and a created-at window `from_date`/`to_date` (inclusive of `from_date`, up to the end of `to_date`).
Standard pagination/sorting via `page` (0-based), `size` (default 20), `sort` (default `createdAt,desc`;
sortable properties: `createdAt`, `payerId`, `status`, `payerType`).

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `status` | query |  | string enum: `DRAFT`, `ACTIVE`, `SUSPENDED`, `RETIRED` | Filter by lifecycle status. |
| `payer_type` | query |  | string enum: `INSURER`, `TPA`, `SELF_MANAGED_SCHEME` | Filter by payer type. |
| `from_date` | query |  | string (date) | Created on/after this date (ISO yyyy-MM-dd), inclusive. |
| `to_date` | query |  | string (date) | Created on/before this date (ISO yyyy-MM-dd), inclusive. |
| `pageable` | query | ✓ | [`Pageable`](#schema-pageable) | Pagination/sorting: `page` (0-based), `size` (default 20), `sort` (default `created_at,desc`). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — paged envelope under `result`. |
| `400` | Invalid filter value (e.g. unknown status/payer_type). |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "content": [
      {
        "id": 1,
        "payer_id": "PAY000001",
        "status": "DRAFT",
        "payer_type": "INSURER",
        "primary_tenant_id": 1,
        "tenants": [],
        "entitlements": [],
        "subscription": null,
        "created_at": "2026-06-17T10:00:00Z"
      }
    ],
    "page": 0,
    "size": 20,
    "total_elements": 1,
    "total_pages": 1
  }
}
```

</details>

---

### `POST` `/platform/payers`

**Create payer + primary tenant**

`operationId: createPayer`

Creates a new payer in `DRAFT` together with its primary tenant (§8.1). This is the start of the
onboarding chain — it seeds the seven onboarding steps and immediately completes the `primary` step.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none — this is the first call. `subdomain` and
`data_residency_region` are optional here; the wizard collects the subdomain in the Technical-config
step (§8.7) and `submit` requires it. Bank details are stored encrypted and never returned. The
returned `PayerResponse` is the aggregate every subsequent step also returns.

**Request body** (required): [`CreatePayerRequest`](#schema-createpayerrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `payer_type` | string enum: `INSURER`, `TPA`, `SELF_MANAGED_SCHEME` | ✓ | Payer category. _(e.g. `INSURER`)_ |
| `primary_tenant` | [`TenantDetailsRequest`](#schema-tenantdetailsrequest) | ✓ |  |

**Responses**

| Status | Description |
|---|---|
| `201` | Created — payer in DRAFT with its primary tenant. |
| `400` | Reserved/invalid subdomain or missing mandatory fields. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | Subdomain taken or duplicate (legal_entity_name, country). |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "submitted_by": null,
    "submitted_at": null,
    "activated_at": null,
    "tenants": [
      {
        "id": 1,
        "tenant_code": "TNT000001",
        "primary": true,
        "status": "DRAFT",
        "subdomain": "globex-za",
        "schema_name": null,
        "data_residency_region": "af-south-1",
        "legal_entity_name": "Globex Insurance Ltd",
        "trading_name": "Globex",
        "country": "ZA",
        "primary_contact_name": "Gil",
        "primary_contact_email": "gil@globex.io",
        "tenant_admin_name": "Gil Admin",
        "tenant_admin_email": "admin@globex.io",
        "documents": []
      }
    ],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/tenants`

**Add a secondary tenant**

`operationId: addSecondaryTenant`

Adds a secondary tenant to a payer (§8.2), using the same `TenantDetailsRequest` shape as the
primary tenant. Completes the optional `secondary` onboarding step.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist and still be `DRAFT`. Its
subdomain and entity must not collide with an existing one.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Request body** (required): [`TenantDetailsRequest`](#schema-tenantdetailsrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `legal_entity_name` | string | ✓ | Registered legal entity name. Unique with country. _(e.g. `Globex Insurance Ltd`)_ |
| `trading_name` | string |  | Trading / brand name. _(e.g. `Globex`)_ |
| `primary_contact_name` | string | ✓ | Primary contact name. _(e.g. `Gil`)_ |
| `primary_contact_email` | string (email) | ✓ | Primary contact email. _(e.g. `gil@globex.io`)_ |
| `country` | string | ✓ | ISO-3166 alpha-2 country code. _(e.g. `ZA`)_ |
| `data_residency_region` | string |  | Data-residency region (optional here; may be set later). _(e.g. `af-south-1`)_ |
| `subdomain` | string |  | Routing subdomain (optional here; the wizard sets it in Step-3 technical config). _(e.g. `globex-za`)_ |
| `tenant_admin_name` | string | ✓ | Tenant admin name (receives the activation invite). _(e.g. `Gil Admin`)_ |
| `tenant_admin_email` | string (email) | ✓ | Tenant admin email. _(e.g. `admin@globex.io`)_ |
| `tax_vat_number` | string |  | Tax / VAT number. _(e.g. `VAT9`)_ |
| `phone` | string |  | Contact phone. _(e.g. `+27115550000`)_ |
| `address` | string |  | Postal address. _(e.g. `1 Market St, Cape Town`)_ |
| `website` | string |  | Website URL. _(e.g. `https://globex.io`)_ |
| `contacts` | array&lt;[`ContactRequest`](#schema-contactrequest)&gt; |  | Up to two contact cards; one may be flagged receives_invite. If omitted, the primary_contact_* and tenant_admin_* fields seed the contacts. |
| `operating_regions` | array&lt;string&gt; |  | Operating regions for this tenant. |
| `bank` | [`BankDetailsRequest`](#schema-bankdetailsrequest) |  |  |

**Responses**

| Status | Description |
|---|---|
| `201` | Created — secondary tenant added to the payer. |
| `400` | Reserved/invalid subdomain or missing mandatory fields. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | Payer not DRAFT, or duplicate subdomain/entity. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [
      {
        "id": 1,
        "tenant_code": "TNT000001",
        "primary": true,
        "status": "DRAFT",
        "documents": []
      },
      {
        "id": 2,
        "tenant_code": "TNT000002",
        "primary": false,
        "status": "DRAFT",
        "documents": []
      }
    ],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/tenants/{tenantId}/documents`

**Attach a document to a tenant**

`operationId: addDocument`

Uploads a KYB / contract document against a tenant under the payer (§8.5) as `multipart/form-data`:
the `file` part carries the bytes (proxied to the document service) and the remaining form fields
carry the metadata. New documents are `PENDING_REVIEW`. The `documents` step flips to COMPLETE once
all required KYB categories are present (partial uploads leave it `IN_PROGRESS`).

**Create vs replace:** omit `file_id` to create a new document (`category` is then required). To fix a
wrongly-uploaded file, pass the existing document's `file_id` together with the new `file`: the bytes
are re-uploaded and that document is re-pointed to them in place — it keeps its `document_id` and
`category`, and its status resets to `PENDING_REVIEW`. The old file is left in the document service
(which exposes no delete); only the pointer moves.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the tenant must exist under the given payer. Submit
(§8.6) requires the primary tenant to carry all required categories: SIGNED_CONTRACT,
COMPANY_REGISTRATION, PROOF_OF_ADDRESS, DIRECTOR_SHAREHOLDER_ID.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id (must belong to the payer). |
| `category` | query |  | string | KYB document category. Required when creating; optional (ignored) when replacing via file_id. |
| `description` | query |  | string | Optional description. |
| `expiry_date` | query |  | string (date) | Optional expiry date (yyyy-MM-dd). |
| `file_id` | query |  | string | To REPLACE an existing document's file, pass its document-service file_id; omit to create a new document. |

**Request body**: `object`

| Field | Type | Req | Description |
|---|---|---|---|
| `file` | string (binary) | ✓ | The document file to upload. |

**Responses**

| Status | Description |
|---|---|
| `201` | Document recorded under its tenant. |
| `400` | Invalid category, missing field, or empty file. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer or tenant not found. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [
      {
        "id": 1,
        "tenant_code": "TNT000001",
        "primary": true,
        "status": "DRAFT",
        "documents": [
          {
            "document_id": "DOC000001",
            "category": "SIGNED_CONTRACT",
            "file_name": "contract.pdf",
            "status": "PENDING_REVIEW",
            "expiry_date": "2027-01-01"
          }
        ]
      }
    ],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/tenants/{tenantId}/activate`

**Activate a secondary tenant**

`operationId: activateTenant`

Activates a secondary tenant that was added to an already-active payer (§8.8): provisions its schema
and Tenant Admin, moving it `PENDING_ACTIVATION` → `ACTIVE`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must be `ACTIVE` and the target tenant must
be in `PENDING_ACTIVATION`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id (must belong to the payer). |

**Responses**

| Status | Description |
|---|---|
| `200` | Secondary tenant activated. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer or tenant not found. |
| `409` | Payer not ACTIVE or tenant not PENDING_ACTIVATION. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Secondary tenant activated",
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "ACTIVE",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [
      {
        "id": 2,
        "tenant_code": "TNT000002",
        "primary": false,
        "status": "ACTIVE",
        "documents": []
      }
    ],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/submit`

**Submit payer for approval**

`operationId: submit`

Submits the DRAFT payer for approval (§8.6) — the validating gate. No body. On success it stamps
`submitted_by`/`submitted_at` (status stays `DRAFT`), completes the `review` step, emits
`PayerSubmitted` and the payer appears in the approver queue.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** every required onboarding section except `review` must
be COMPLETE (`technical`, `modules`, `billing`, `documents`, plus `primary`) — otherwise `400` lists
the incomplete sections. It also re-checks the underlying data: every tenant must have a subdomain,
and the primary tenant must carry all required KYB categories (SIGNED_CONTRACT, COMPANY_REGISTRATION,
PROOF_OF_ADDRESS, DIRECTOR_SHAREHOLDER_ID).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Responses**

| Status | Description |
|---|---|
| `200` | Submitted — submitted_by/at stamped, review step complete. |
| `400` | Incomplete required sections, missing subdomain, or missing required KYB categories. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |
| `409` | Payer not DRAFT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Payer submitted for approval",
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "submitted_by": "1",
    "submitted_at": "2026-06-17T10:30:00Z",
    "tenants": [],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/payers/{payerId}/tenants/{tenantId}`

**Update a tenant (partial) on a DRAFT payer**

`operationId: updateTenant`

Partially updates a tenant (primary or secondary) on a `DRAFT` payer — true PATCH: every field is
optional and only the supplied (non-null) fields are applied. Changed `subdomain` and
`(legal_entity_name, country)` are re-validated for uniqueness (excluding this tenant). Supplying
`contacts` replaces the tenant's contact cards; `bank` is write-only (accepted, never returned).
Returns the refreshed `PayerResponse`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** payer must be `DRAFT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id (must belong to the payer). |

**Request body** (required): [`UpdateTenantRequest`](#schema-updatetenantrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `legal_entity_name` | string |  | Registered legal entity name (unique with country). |
| `trading_name` | string |  | Trading / brand name. |
| `country` | string |  | ISO-3166 alpha-2 country code. |
| `tax_vat_number` | string |  | Tax / VAT number. |
| `subdomain` | string |  | Routing subdomain (validated + unique). |
| `data_residency_region` | string |  | Data-residency region. |
| `primary_contact_name` | string |  | Primary contact name. |
| `primary_contact_email` | string (email) |  | Primary contact email. |
| `tenant_admin_name` | string |  | Tenant admin name. |
| `tenant_admin_email` | string (email) |  | Tenant admin email. |
| `phone` | string |  | Contact phone. |
| `address` | string |  | Postal address. |
| `website` | string |  | Website URL. |
| `contacts` | array&lt;[`ContactRequest`](#schema-contactrequest)&gt; |  | Replacement contact cards (max 2). When provided, replaces the tenant's contacts. |
| `operating_regions` | array&lt;string&gt; |  | Operating regions for this tenant. |
| `bank` | [`BankDetailsRequest`](#schema-bankdetailsrequest) |  |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Tenant updated; refreshed payer returned. |
| `400` | Reserved/invalid subdomain or invalid field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer/tenant not found. |
| `409` | Payer not DRAFT, or duplicate subdomain / (legal entity, country). |

---

### `DELETE` `/platform/payers/{payerId}/tenants/{tenantId}`

**Delete a secondary tenant on a DRAFT payer**

`operationId: deleteTenant`

Removes a secondary tenant (and its contacts/documents) from a `DRAFT` payer. The **primary tenant
cannot be deleted**. Returns the refreshed `PayerResponse`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** payer must be `DRAFT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `tenantId` | path | ✓ | integer (int64) | Numeric secondary-tenant id. |

**Responses**

| Status | Description |
|---|---|
| `200` | Secondary tenant removed; refreshed payer returned. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer/tenant not found. |
| `409` | Payer not DRAFT, or attempt to delete the primary tenant. |

---

### `GET` `/platform/payers/{payerId}`

**Get a payer**

`operationId: getPayer`

Returns one payer's full aggregate — tenants (with documents and contacts), entitlements and
subscription.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "payer_id": "PAY000001",
    "status": "DRAFT",
    "payer_type": "INSURER",
    "primary_tenant_id": 1,
    "tenants": [],
    "entitlements": [],
    "subscription": null,
    "created_at": "2026-06-17T10:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/payers/{payerId}/tenants/{tenantId}/documents/{documentId}`

**Download a tenant document**

`operationId: getDocument`

Returns a tenant document's metadata together with a freshly issued, time-limited pre-signed
download URL fetched from the document service (§8.5). The document is identified by its business
id (`DOC...`) and must belong to the given tenant under the given payer.

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id (must belong to the payer). |
| `documentId` | path | ✓ | string | Business id of the document. |

**Responses**

| Status | Description |
|---|---|
| `200` | Document with a fresh download URL. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer, tenant, or document not found. |

---

### `GET` `/platform/payers/tenant-lookup`

**Duplicate tenant lookup**

`operationId: tenantLookup`

Step-1 duplicate detection (§8.0): finds an existing tenant by legal entity name and/or Tax/VAT
number before creating, so the admin can reuse rather than create a duplicate. Matching is
case-insensitive and `matched_by` lists which field(s) hit.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none — run this before §8.1 create. Supply at least
one of the two query params.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `legal_entity_name` | query |  | string | Legal entity name to match (case-insensitive). Supply at least one of the two params. |
| `tax_vat_number` | query |  | string | Tax / VAT number to match. Supply at least one of the two params. |

**Responses**

| Status | Description |
|---|---|
| `200` | Lookup performed (may or may not have found a match). |
| `400` | Neither query param was supplied. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Existing tenant found",
  "error_details": null,
  "result": {
    "found": true,
    "matched_by": [
      "legal_entity_name",
      "tax_vat_number"
    ],
    "tenant": {
      "tenant_id": 4,
      "tenant_code": "TNT000004",
      "legal_entity_name": "Zenith Assurance PLC",
      "trading_name": "Zenith",
      "country": "NG",
      "tax_vat_number": "VAT-ZEN-001",
      "subdomain": null,
      "status": "DRAFT",
      "payer_id": 3,
      "payer_code": "PAY000003",
      "payer_status": "DRAFT"
    }
  }
}
```

</details>

---

### `GET` `/platform/payers/subdomain-check`

**Check subdomain availability**

`operationId: checkSubdomain`

Step-1 validation (§8.0): sanitises the supplied value, checks it against the reserved list and
existing subdomains, and returns availability plus alternative suggestions when reserved/taken.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none — used in Step-1 and again in the Technical-config
step (§8.7) before persisting a subdomain.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `value` | query | ✓ | string | Raw value to sanitise and check. |

**Responses**

| Status | Description |
|---|---|
| `200` | Check performed. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "input": "Acme Health",
    "sanitised": "acme-health",
    "reserved": false,
    "valid": true,
    "available": true,
    "suggestions": []
  }
}
```

</details>

---

## Onboarding Steps

_Per-payer onboarding step tracker: progress, per-step assignment, and manual completion._

| Method | Path | Summary |
|---|---|---|
| `POST` | `/platform/payers/{payerId}/steps/{stepKey}/complete` | Mark an onboarding step complete |
| `POST` | `/platform/payers/{payerId}/steps/{stepKey}/assign` | Assign an onboarding step |
| `GET` | `/platform/payers/{payerId}/steps` | List onboarding steps & progress |
| `GET` | `/platform/payers/onboarding-drafts` | Onboarding drafts in progress (directory panel) |

### `POST` `/platform/payers/{payerId}/steps/{stepKey}/complete`

**Mark an onboarding step complete**

`operationId: complete`

Manually forces one onboarding step to COMPLETE (§8.9) and returns the refreshed progress. Steps
normally complete automatically when their data is saved; this is the manual override.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist (steps seeded on create) and the
`step_key` must be one of the six seeded keys.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `stepKey` | path | ✓ | string | Step key to complete (one of primary, secondary, modules, billing, documents, review). |

**Responses**

| Status | Description |
|---|---|
| `200` | Step completed; refreshed progress returned. |
| `400` | Unknown step key. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Step completed",
  "error_details": null,
  "result": {
    "payer_id": 2,
    "completed": 5,
    "total": 6,
    "progress_pct": 83,
    "completed_steps": [
      "primary",
      "secondary",
      "modules",
      "billing",
      "documents"
    ],
    "incomplete_steps": [
      "review"
    ],
    "steps": []
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/steps/{stepKey}/assign`

**Assign an onboarding step**

`operationId: assign_1`

Assigns one onboarding step (e.g. `documents`) to a member (by id or email) for completion (§8.9),
and returns the refreshed progress.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist (steps seeded on create) and the
`step_key` must be one of the six seeded keys.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `stepKey` | path | ✓ | string | Step key to assign (one of primary, secondary, modules, billing, documents, review). |

**Request body** (required): [`AssignStepRequest`](#schema-assignsteprequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `assignee` | string | ✓ | Member to assign the step to (id or email). _(e.g. `engineer@ginja.ai`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Step assigned; refreshed progress returned. |
| `400` | Blank assignee or unknown step key. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Step assigned",
  "error_details": null,
  "result": {
    "payer_id": 2,
    "completed": 4,
    "total": 6,
    "progress_pct": 67,
    "completed_steps": [
      "primary",
      "modules",
      "billing",
      "documents"
    ],
    "incomplete_steps": [
      "secondary",
      "review"
    ],
    "steps": []
  }
}
```

</details>

---

### `GET` `/platform/payers/{payerId}/steps`

**List onboarding steps & progress**

`operationId: listSteps`

Returns the payer's six onboarding steps plus overall progress (§8.9) — the wizard's section
tracker. The six steps (`primary, secondary, modules, billing, documents, review`) are
seeded when the payer is created (§8.1); each is counted COMPLETE the moment its data is saved. Drive
the Review screen from `completed_steps`/`incomplete_steps`/`progress_pct`, and enable Submit when
`ready_to_submit` is true.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must exist (steps are seeded on create).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "payer_id": 2,
    "completed": 4,
    "total": 6,
    "progress_pct": 67,
    "required_completed": 4,
    "required_total": 5,
    "all_required_complete": false,
    "ready_to_submit": true,
    "completed_steps": [
      "primary",
      "modules",
      "billing",
      "documents"
    ],
    "incomplete_steps": [
      "secondary",
      "review"
    ],
    "steps": [
      {
        "step_id": "OST000003",
        "step_key": "modules",
        "owner_role": "profile",
        "sort_order": 3,
        "required": true,
        "status": "COMPLETE",
        "complete": true,
        "assignee": "specialist@ginja.ai",
        "assigned_by": "1",
        "completed_by": "1",
        "completed_at": "2026-06-17T10:15:00Z"
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/payers/onboarding-drafts`

**Onboarding drafts in progress (directory panel)**

`operationId: onboardingDrafts`

Powers the "Onboarding drafts in progress" panel on the Tenant accounts directory: the list of
in-progress drafts (a `DRAFT` payer not yet submitted), newest first. Each item is **self-sufficient**
— payer identity (`id`, `payer_id` code, `payer_type`, `legal_entity_name`, `country`, `created_at`,
`updated_at`, aligned with `GET /platform/payers`) **plus** the full onboarding progress (same fields
as `GET /platform/payers/{payerId}/steps`: `completed`, `total`, `progress_pct`, `completed_steps`,
`incomplete_steps`, `steps[]`), so the panel renders each card (title, type badge, progress bar,
"waiting on" = `incomplete_steps[0]`) without an extra call. Optional `assignee` filter ("By teammate").

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `assignee` | query |  | string | Filter to drafts with a step owned by this assignee ("By teammate"). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — list of draft summaries (identity + progress). |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 14,
      "payer_id": "PAY000014",
      "payer_type": "INSURER",
      "legal_entity_name": "CIC Insurance Group",
      "country": "KE",
      "created_at": "2026-06-06T09:00:00Z",
      "updated_at": "2026-06-06T10:00:00Z",
      "completed": 3,
      "total": 6,
      "progress_pct": 50,
      "required_completed": 3,
      "required_total": 5,
      "all_required_complete": false,
      "ready_to_submit": false,
      "completed_steps": [
        "primary",
        "modules",
        "billing"
      ],
      "incomplete_steps": [
        "secondary",
        "documents",
        "review"
      ],
      "steps": [
        {
          "step_id": "OST000001",
          "step_key": "primary",
          "owner_role": "profile",
          "sort_order": 1,
          "required": true,
          "status": "COMPLETE",
          "complete": true,
          "assignee": "MBR000003",
          "assigned_by": "1",
          "completed_by": "1",
          "completed_at": "..."
        }
      ]
    }
  ]
}
```

</details>

---

## Approvals

_Approver queue and approve / reject / request-info decisions (separation of duties: submitter ≠ approver)._

| Method | Path | Summary |
|---|---|---|
| `POST` | `/platform/payers/{payerId}/sections/{sectionKey}/request-info` | Request more information on one review section |
| `POST` | `/platform/payers/{payerId}/sections/{sectionKey}/reject` | Reject one review section |
| `POST` | `/platform/payers/{payerId}/sections/{sectionKey}/approve` | Approve one review section |
| `POST` | `/platform/payers/{payerId}/request-info` | Request more information from the submitter |
| `POST` | `/platform/payers/{payerId}/reject` | Reject a payer |
| `POST` | `/platform/payers/{payerId}/approve` | Approve a payer → auto-activate |
| `GET` | `/platform/approvals` | Approval queue (Pending / Approved / All) |
| `GET` | `/platform/approvals/{payerId}` | Approval review (by id) |

### `POST` `/platform/payers/{payerId}/sections/{sectionKey}/request-info`

**Request more information on one review section**

`operationId: requestInfoSection`

Records this approver's decision on **one review section** of the request — persisted server-side so
the "Review · as Approver" checklist rehydrates from `GET /platform/approvals/{payerId}`. Returns the
refreshed review payload (its `sections[]` now carry each section's `review_status`, `decided_by`,
`comment` and `decided_at`). The decision upserts the section's latest state.

`sectionKey` ∈ `primary_tenant_details` | `module_entitlements` | `subscription_billing` |
`kyb_documents`. **Role:** `PLATFORM_APPROVER`; the payer must be **awaiting approval** and
**separation of duties** is enforced (the submitter cannot decide). Unlike the final approval, a
per-section decision does not require provisioning to be complete.

`comment` is **mandatory** (states what information is required).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer. |
| `sectionKey` | path | ✓ | string | Section key. |

**Request body** (required): [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Information requested; refreshed review payload returned. |
| `400` | Unknown section key, or missing mandatory comment. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

---

### `POST` `/platform/payers/{payerId}/sections/{sectionKey}/reject`

**Reject one review section**

`operationId: rejectSection`

Records this approver's decision on **one review section** of the request — persisted server-side so
the "Review · as Approver" checklist rehydrates from `GET /platform/approvals/{payerId}`. Returns the
refreshed review payload (its `sections[]` now carry each section's `review_status`, `decided_by`,
`comment` and `decided_at`). The decision upserts the section's latest state.

`sectionKey` ∈ `primary_tenant_details` | `module_entitlements` | `subscription_billing` |
`kyb_documents`. **Role:** `PLATFORM_APPROVER`; the payer must be **awaiting approval** and
**separation of duties** is enforced (the submitter cannot decide). Unlike the final approval, a
per-section decision does not require provisioning to be complete.

`comment` is **mandatory**.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer. |
| `sectionKey` | path | ✓ | string | Section key. |

**Request body** (required): [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Section rejected; refreshed review payload returned. |
| `400` | Unknown section key, or missing mandatory comment. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

---

### `POST` `/platform/payers/{payerId}/sections/{sectionKey}/approve`

**Approve one review section**

`operationId: approveSection_1`

Records this approver's decision on **one review section** of the request — persisted server-side so
the "Review · as Approver" checklist rehydrates from `GET /platform/approvals/{payerId}`. Returns the
refreshed review payload (its `sections[]` now carry each section's `review_status`, `decided_by`,
`comment` and `decided_at`). The decision upserts the section's latest state.

`sectionKey` ∈ `primary_tenant_details` | `module_entitlements` | `subscription_billing` |
`kyb_documents`. **Role:** `PLATFORM_APPROVER`; the payer must be **awaiting approval** and
**separation of duties** is enforced (the submitter cannot decide). Unlike the final approval, a
per-section decision does not require provisioning to be complete.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer. |
| `sectionKey` | path | ✓ | string | Section key. |

**Request body**: [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Section approved; refreshed review payload returned. |
| `400` | Unknown section key. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

---

### `POST` `/platform/payers/{payerId}/request-info`

**Request more information from the submitter**

`operationId: requestInfo`

Sends the payer back to the submitter for clarification and clears the submission marker.
`comment` is **mandatory** (states what information is required).

**Role:** `PLATFORM_APPROVER`. **Dependencies:** the payer must be **awaiting approval**;
**separation of duties** is enforced — the submitter cannot action it (`403`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer. |

**Request body** (required): [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Information requested from the submitter. |
| `400` | Missing mandatory comment. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Information requested from the submitter",
  "error_details": null,
  "result": {
    "id": 42,
    "payer_id": "PAY000042",
    "status": "DRAFT"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/reject`

**Reject a payer**

`operationId: reject`

Rejects a submitted payer and clears the submission marker so the admin can correct and
re-submit. `comment` is **mandatory** (the rejection reason shown to the submitter).

**Role:** `PLATFORM_APPROVER`. **Dependencies:** the payer must be **awaiting approval**;
**separation of duties** is enforced — the submitter cannot reject (`403`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer to reject. |

**Request body** (required): [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Payer rejected. |
| `400` | Missing mandatory comment. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Payer rejected",
  "error_details": null,
  "result": {
    "id": 42,
    "payer_id": "PAY000042",
    "status": "DRAFT"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/approve`

**Approve a payer → auto-activate**

`operationId: approve`

Records the approver's decision and then **auto-activates** the payer: provisions each
tenant's `tenant_<subdomain>` schema, creates the Tenant Admin **inside that schema**,
creates billing on the primary tenant, and emits `TenantActivated` / `PayerActivated`.
The returned `PayerResponse` is now `ACTIVE` with each tenant `ACTIVE` and a populated
`schema_name`.

**Role:** `PLATFORM_APPROVER`. **Dependencies:** the payer must have been **submitted and
be awaiting approval**; **separation of duties** is enforced — the member who submitted the
payer cannot approve it (`403`). `comment` is optional for approve.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer to approve. |

**Request body**: [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Payer approved and activated. |
| `403` | Caller is not PLATFORM_APPROVER, or submitted this payer (separation of duties). |
| `404` | Payer not found. |
| `409` | Payer is not awaiting approval. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Payer approved and activated",
  "error_details": null,
  "result": {
    "id": 42,
    "payer_id": "PAY000042",
    "status": "ACTIVE",
    "tenants": [
      {
        "id": 1,
        "subdomain": "globex-za",
        "status": "ACTIVE",
        "schema_name": "tenant_globex_za"
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/approvals`

**Approval queue (Pending / Approved / All)**

`operationId: queue_1`

The maker-checker approval queue rows for the directory table — lean by design (request reference,
type, tenant, submitted-by, when, priority, status, counts). Filter the tabs with `?status=`:
`pending` (submitted + fully provisioned, awaiting a decision), `approved` (already approved), or
omitted/`all` (both — each row carries its own `status`, so the FE can render the tabs and counts
from one call). Fetch the full review per request via `GET /platform/approvals/{payerId}`.

**Roles:** `PLATFORM_APPROVER` or `PLATFORM_ADMIN`. Note: `type` is currently always `Tenant onboarding` and `priority`
is not yet modeled (returned `null`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `status` | query |  | string | Tab filter: pending \| approved \| all (default all). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — array of queue rows. |
| `403` | Caller lacks PLATFORM_APPROVER or PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 210,
      "request_id": "PAY000210",
      "type": "Tenant onboarding",
      "tenant": "Strategis Insurance",
      "payer_type": "INSURER",
      "submitted_by": "1",
      "submitted_at": "2026-06-18T09:00:00Z",
      "priority": null,
      "status": "PENDING",
      "tenants": 1,
      "documents": 4
    }
  ]
}
```

</details>

---

### `GET` `/platform/approvals/{payerId}`

**Approval review (by id)**

`operationId: review`

Full review payload for the "Review · as Approver" screen: the request header + review meta
(`status`, `own_submission`, `provisioning_complete`, `can_decide`, `sections`, `auto_activate_note`)
plus the complete `payer` aggregate — primary/secondary tenants (with all profile fields), module
entitlements, subscription & billing, and KYB documents — so every section on the screen is covered.
`can_decide` enforces separation of duties (the submitter cannot decide their own request).
Decisions themselves use `POST /platform/payers/{payerId}/approve|reject|request-info`.

**Roles:** `PLATFORM_APPROVER` or `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id of the request. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — full review payload. |
| `403` | Caller lacks PLATFORM_APPROVER or PLATFORM_ADMIN. |
| `404` | Request (payer) not found. |

---

## Payer Lifecycle

_Post-activation transitions: suspend, reactivate, retire._

| Method | Path | Summary |
|---|---|---|
| `POST` | `/platform/payers/{payerId}/suspend` | Request payer suspension (maker step) |
| `POST` | `/platform/payers/{payerId}/retire` | Request payer retirement (maker step) |
| `POST` | `/platform/payers/{payerId}/reactivate` | Request payer reactivation (maker step) |
| `POST` | `/platform/payers/{payerId}/lifecycle-requests/{requestId}/reject` | Reject a lifecycle change request (checker step) |
| `POST` | `/platform/payers/{payerId}/lifecycle-requests/{requestId}/approve` | Approve a lifecycle change request (checker step) |
| `GET` | `/platform/payers/{payerId}/lifecycle-requests` | List a payer's lifecycle change requests |

### `POST` `/platform/payers/{payerId}/suspend`

**Request payer suspension (maker step)**

`operationId: suspend`

**Maker step of the maker-checker flow.** Raises a PENDING suspension request for an `ACTIVE`
payer — it does **not** suspend immediately. A second actor with the `APPROVAL_DECIDE`
permission must approve (see the approve/reject endpoints) before the payer is suspended and
its tenant sessions are revoked. The body carries the reason category and an optional note.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must be `ACTIVE`, with no other request
already pending. `reason` is one of `NON_PAYMENT | COMPLIANCE | SECURITY | OTHER`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer to suspend. |

**Request body** (required): [`SuspendRequest`](#schema-suspendrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `reason` | string enum: `NON_PAYMENT`, `COMPLIANCE`, `SECURITY`, `OTHER` | ✓ | Reason category for the suspension. One of NON_PAYMENT, COMPLIANCE, SECURITY, OTHER. _(e.g. `NON_PAYMENT`)_ |
| `note` | string |  | Optional note for the checker / audit trail. _(e.g. `Two invoices overdue >60 days.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Suspension request submitted for approval. |
| `400` | Missing or invalid reason. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |
| `409` | Payer is not ACTIVE, or a request is already pending. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Suspension submitted for approval",
  "error_details": null,
  "result": {
    "request_id": "LCR000001",
    "payer_id": 42,
    "payer_code": "PAY000042",
    "action": "SUSPEND",
    "reason": "NON_PAYMENT",
    "status": "PENDING"
  }
}
```

</details>

---

### `POST` `/platform/payers/{payerId}/retire`

**Request payer retirement (maker step)**

`operationId: retire`

**Maker step.** Raises a PENDING retirement request for a `SUSPENDED` payer — it does not
retire immediately. A second actor with `APPROVAL_DECIDE` must approve before the payer (and
its tenants) are moved to the terminal `RETIRED` state. The body's `reason` is **mandatory**.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must be `SUSPENDED`, no request pending.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer to retire. |

**Request body** (required): [`RetireRequest`](#schema-retirerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `reason` | string | ✓ | Mandatory reason for retiring the payer (free text). _(e.g. `Contract terminated; data export complete.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Retirement request submitted for approval. |
| `400` | Missing mandatory retire reason. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |
| `409` | Payer is not SUSPENDED, or a request is already pending. |

---

### `POST` `/platform/payers/{payerId}/reactivate`

**Request payer reactivation (maker step)**

`operationId: reactivate`

**Maker step.** Raises a PENDING reactivation request for a `SUSPENDED` payer — it does not
reactivate immediately. A second actor with `APPROVAL_DECIDE` must approve. Optional note via
`comment`.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** the payer must be `SUSPENDED`, no request pending.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric id of the payer to reactivate. |

**Request body**: [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Reactivation request submitted for approval. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Payer not found. |
| `409` | Payer is not SUSPENDED, or a request is already pending. |

---

### `POST` `/platform/payers/{payerId}/lifecycle-requests/{requestId}/reject`

**Reject a lifecycle change request (checker step)**

`operationId: rejectLifecycle`

Rejects a PENDING lifecycle request; the payer's status is unchanged. **Separation of duties:**
the requester cannot reject their own request.

**Permission:** `APPROVAL_DECIDE` (Approvals → Approve/Reject).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `requestId` | path | ✓ | string | Lifecycle request business id. |

**Request body**: [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Request rejected. |
| `403` | Caller lacks APPROVAL_DECIDE, or is the requester. |
| `404` | Payer or request not found. |
| `409` | Request is not pending. |

---

### `POST` `/platform/payers/{payerId}/lifecycle-requests/{requestId}/approve`

**Approve a lifecycle change request (checker step)**

`operationId: approveLifecycle`

Approves a PENDING lifecycle request and **executes** its transition (suspend / reactivate /
retire), revoking tenant sessions where applicable. **Separation of duties:** the requester
cannot approve their own request. The transition is re-validated against the payer's current
status, so a state drift since the request was raised fails with `409`.

**Permission:** `APPROVAL_DECIDE` (Approvals → Approve/Reject).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |
| `requestId` | path | ✓ | string | Lifecycle request business id. |

**Request body**: [`ApprovalActionRequest`](#schema-approvalactionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Request approved and executed. |
| `403` | Caller lacks APPROVAL_DECIDE, or is the requester. |
| `404` | Payer or request not found. |
| `409` | Request not pending, or transition no longer legal. |

---

### `GET` `/platform/payers/{payerId}/lifecycle-requests`

**List a payer's lifecycle change requests**

`operationId: lifecycleRequests`

The lifecycle maker-checker history for a payer (newest first): suspend / reactivate / retire
requests with their status and decision metadata.

**Access:** `PLATFORM_ADMIN`, or the `APPROVAL_VIEW` / `APPROVAL_DECIDE` permission.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `payerId` | path | ✓ | integer (int64) | Numeric payer id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — list under `result`. |

---

## Tenant Provisioning & Technical Review

_Provisioning queue + config sections (Database, Domains/SSL, Email, SMS, Data migration) and the reviewer remark → resolve → per-section approve flow._

| Method | Path | Summary |
|---|---|---|
| `PUT` | `/platform/provisioning/{tenantId}/sections/{section}` | Save a config section |
| `POST` | `/platform/provisioning/{tenantId}/stage` | Set the provisioning stage |
| `POST` | `/platform/provisioning/{tenantId}/sections/{section}/test` | Test a config section |
| `POST` | `/platform/provisioning/{tenantId}/sections/{section}/remarks` | Add a technical-review remark on a section |
| `POST` | `/platform/provisioning/{tenantId}/sections/{section}/approve` | Approve a config section (technical review) |
| `POST` | `/platform/provisioning/{tenantId}/assign` | Assign provisioning to an engineer |
| `POST` | `/platform/provisioning/remarks/{remarkId}/resolve` | Resolve a review remark |
| `GET` | `/platform/provisioning` | List the provisioning queue |
| `GET` | `/platform/provisioning/{tenantId}` | Get a tenant's provisioning detail |
| `GET` | `/platform/provisioning/{tenantId}/remarks` | List a tenant's review remarks |
| `GET` | `/platform/provisioning/mine` | List my provisioning assignments |

### `PUT` `/platform/provisioning/{tenantId}/sections/{section}`

**Save a config section**

`operationId: saveSection`

Saves a config section's settings (key/values such as provider, host, from-address). Optional
`status` lets the engineer mark it `CONFIGURED` or `DONE` (defaults to `CONFIGURED` when config
is provided). Saving a section **resets its `review_status` to `PENDING`** (re-review required),
and the overall stage auto-advances `AWAITING_START → IN_PROGRESS`.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_ENGINEER`. **Dependencies:** tenant must be in the
queue. `section` path is one of `DATABASE | DOMAINS_SSL | EMAIL | SMS | DATA_MIGRATION`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |
| `section` | path | ✓ | string enum: `DATABASE`, `DOMAINS_SSL`, `EMAIL`, `SMS`, `DATA_MIGRATION` | Config section key. |

**Request body** (required): [`SaveConfigSectionRequest`](#schema-saveconfigsectionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `config` | object |  | Section-specific key/value settings (e.g. provider, host, from-address). |
| `status` | string enum: `NOT_STARTED`, `CONFIGURED`, `TESTED`, `DONE` |  | Optional completion status. Defaults to CONFIGURED when config is provided. One of NOT_STARTED, CONFIGURED, TESTED, DONE. _(e.g. `CONFIGURED`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Configuration saved. |
| `400` | Invalid section key or status. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Configuration saved",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "stage": "IN_PROGRESS",
    "sections": [
      {
        "config_id": "CFG000003",
        "section": "EMAIL",
        "status": "CONFIGURED",
        "config": {
          "from_address": "no-reply@globex.io"
        },
        "review_status": "PENDING",
        "configured_by": "erin",
        "open_remarks": 0
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/provisioning/{tenantId}/stage`

**Set the provisioning stage**

`operationId: setStage`

Manually sets a tenant's provisioning stage — typically to mark it `BLOCKED`. A manual `BLOCKED`
is preserved until explicitly changed (it overrides the automatic
`AWAITING_START → IN_PROGRESS → READY_TO_ACTIVATE` progression).

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_ENGINEER`. **Dependencies:** tenant must be in the
queue. `stage` is one of `AWAITING_START | IN_PROGRESS | BLOCKED | READY_TO_ACTIVATE`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |

**Request body** (required): [`SetStageRequest`](#schema-setstagerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `stage` | string enum: `AWAITING_START`, `IN_PROGRESS`, `BLOCKED`, `READY_TO_ACTIVATE` | ✓ | Target provisioning stage. One of AWAITING_START, IN_PROGRESS, BLOCKED, READY_TO_ACTIVATE. _(e.g. `BLOCKED`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Stage updated. |
| `400` | Missing or invalid stage. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Stage updated",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "stage": "BLOCKED",
    "assignee": "erin",
    "sections_done": 2,
    "sections_total": 5,
    "sections_approved": 1,
    "open_remarks": 1,
    "sections": []
  }
}
```

</details>

---

### `POST` `/platform/provisioning/{tenantId}/sections/{section}/test`

**Test a config section**

`operationId: testSection`

Runs the section's test/verify action (test DB connection, verify CNAME, send a test email/SMS,
…) and on success **marks the section `DONE`**. When all five sections are `DONE` the tenant's
stage advances to `READY_TO_ACTIVATE`.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_ENGINEER`. **Dependencies:** the section should be
configured first. `section` path is one of `DATABASE | DOMAINS_SSL | EMAIL | SMS |
DATA_MIGRATION`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |
| `section` | path | ✓ | string enum: `DATABASE`, `DOMAINS_SSL`, `EMAIL`, `SMS`, `DATA_MIGRATION` | Config section key. |

**Responses**

| Status | Description |
|---|---|
| `200` | Test complete; section marked DONE. |
| `400` | Invalid section key. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Test complete",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "stage": "IN_PROGRESS",
    "sections": [
      {
        "config_id": "CFG000001",
        "section": "DATABASE",
        "status": "DONE",
        "last_result": "connection ok",
        "last_tested_at": "2026-06-17T10:00:00Z",
        "review_status": "PENDING",
        "configured_by": "erin",
        "open_remarks": 0
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/provisioning/{tenantId}/sections/{section}/remarks`

**Add a technical-review remark on a section**

`operationId: addRemark`

A Technical Reviewer leaves a remark on a config section; the section's `review_status` moves to
`CHANGES_REQUESTED` so the engineer addresses it. `severity` defaults to `ACTION`.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_APPROVER` (the Technical Reviewer). **Dependencies:**
the tenant must be in the queue. `section` is one of `DATABASE | DOMAINS_SSL | EMAIL | SMS |
DATA_MIGRATION`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |
| `section` | path | ✓ | string enum: `DATABASE`, `DOMAINS_SSL`, `EMAIL`, `SMS`, `DATA_MIGRATION` | Config section key. |

**Request body** (required): [`AddRemarkRequest`](#schema-addremarkrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `body` | string | ✓ | The remark text. _(e.g. `Point this at the read-replica host, not primary.`)_ |
| `severity` | string |  | Severity of the remark; defaults to ACTION when omitted (e.g. ACTION, INFO). _(e.g. `ACTION`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Remark added. |
| `400` | Missing remark body. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_APPROVER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Remark added",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "sections": [
      {
        "config_id": "CFG000001",
        "section": "DATABASE",
        "status": "DONE",
        "review_status": "CHANGES_REQUESTED",
        "open_remarks": 1
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/provisioning/{tenantId}/sections/{section}/approve`

**Approve a config section (technical review)**

`operationId: approveSection`

The reviewer approves a config section, setting its `review_status` to `APPROVED`. **Maker ≠
checker is enforced** — the engineer who configured the section cannot approve it (`403`), and
the section must be `DONE` before it can be approved (`409` otherwise).

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_APPROVER` (the Technical Reviewer). **Dependencies:**
section status `DONE`; configurer ≠ approver. `section` is one of `DATABASE | DOMAINS_SSL |
EMAIL | SMS | DATA_MIGRATION`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |
| `section` | path | ✓ | string enum: `DATABASE`, `DOMAINS_SSL`, `EMAIL`, `SMS`, `DATA_MIGRATION` | Config section key. |

**Responses**

| Status | Description |
|---|---|
| `200` | Section approved. |
| `400` | Invalid section key. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_APPROVER, or configured this section (maker ≠ checker). |
| `404` | Tenant provisioning not found. |
| `409` | Section is not DONE. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Section approved",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "sections_approved": 1,
    "sections": [
      {
        "config_id": "CFG000001",
        "section": "DATABASE",
        "status": "DONE",
        "review_status": "APPROVED",
        "configured_by": "erin",
        "reviewed_by": "bob",
        "open_remarks": 0
      }
    ]
  }
}
```

</details>

---

### `POST` `/platform/provisioning/{tenantId}/assign`

**Assign provisioning to an engineer**

`operationId: assign`

Assigns a tenant's provisioning to a Platform Engineer (by id/email). The tenant then appears
in that engineer's `/platform/provisioning/mine` queue.

**Role:** `PLATFORM_ADMIN` only (assignment is admin-restricted). **Dependencies:** the tenant
must be in the provisioning queue.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |

**Request body** (required): [`AssignProvisioningRequest`](#schema-assignprovisioningrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `assignee` | string | ✓ | The Platform Engineer to assign (id or email). _(e.g. `erin`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Provisioning assigned. |
| `400` | Missing assignee. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Provisioning assigned",
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "assignee": "erin",
    "stage": "IN_PROGRESS",
    "sections_done": 0,
    "sections_total": 5,
    "sections_approved": 0,
    "open_remarks": 0,
    "sections": []
  }
}
```

</details>

---

### `POST` `/platform/provisioning/remarks/{remarkId}/resolve`

**Resolve a review remark**

`operationId: resolveRemark`

Marks a review remark `RESOLVED` once the engineer has addressed it. Returns the updated
`RemarkResponse`.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_ENGINEER`. **Dependencies:** the remark must exist
(and typically be `OPEN`).

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `remarkId` | path | ✓ | string | Business id of the remark. |

**Responses**

| Status | Description |
|---|---|
| `200` | Remark resolved. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER. |
| `404` | Remark not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Remark resolved",
  "error_details": null,
  "result": {
    "remark_id": "RMK000001",
    "section": "DATABASE",
    "body": "Use the read-replica host",
    "severity": "ACTION",
    "status": "RESOLVED",
    "author": "bob",
    "resolved_by": "erin",
    "resolved_at": "2026-06-17T11:00:00Z",
    "created_at": "2026-06-17T09:30:00Z"
  }
}
```

</details>

---

### `GET` `/platform/provisioning`

**List the provisioning queue**

`operationId: queue`

Returns every tenant in the provisioning queue, each as a `ProvisioningResponse` carrying its
stage, assignee, section counts (`sections_done` / `sections_total` / `sections_approved`),
`open_remarks`, and the full `sections[]` detail. Optional filters narrow by stage or assignee.

**Roles:** `PLATFORM_ADMIN` and `PLATFORM_ENGINEER` (configure), plus `PLATFORM_APPROVER`
(reviewer dashboard). **Dependencies:** tenants enter the queue (`AWAITING_START`) automatically
on payer submit.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `stage` | query |  | string enum: `AWAITING_START`, `IN_PROGRESS`, `BLOCKED`, `READY_TO_ACTIVATE` | Filter by provisioning stage. |
| `assignee` | query |  | string | Filter by assignee (engineer id/email). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — array of ProvisioningResponse. |
| `400` | Invalid stage filter value. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER / PLATFORM_APPROVER. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "provisioning_id": "PRV000001",
      "tenant_id": 1,
      "tenant_code": "TEN000001",
      "subdomain": "globex-za",
      "legal_entity_name": "Globex Insurance Ltd",
      "stage": "IN_PROGRESS",
      "assignee": "erin",
      "sections_done": 2,
      "sections_total": 5,
      "sections_approved": 1,
      "open_remarks": 1,
      "sections": [
        {
          "config_id": "CFG000001",
          "section": "DATABASE",
          "status": "DONE",
          "config": {
            "host": "db.internal"
          },
          "last_result": "connection ok",
          "last_tested_at": "2026-06-17T10:00:00Z",
          "review_status": "APPROVED",
          "configured_by": "erin",
          "reviewed_by": "bob",
          "open_remarks": 0
        }
      ]
    }
  ]
}
```

</details>

---

### `GET` `/platform/provisioning/{tenantId}`

**Get a tenant's provisioning detail**

`operationId: get_7`

Returns one tenant's `ProvisioningResponse` including its full `sections[]` (DATABASE,
DOMAINS_SSL, EMAIL, SMS, DATA_MIGRATION) with config, test results, and review status.

**Roles:** `PLATFORM_ADMIN`, `PLATFORM_ENGINEER`, or `PLATFORM_APPROVER`. **Dependencies:**
the tenant must be in the provisioning queue.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER / PLATFORM_APPROVER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "provisioning_id": "PRV000001",
    "tenant_id": 1,
    "tenant_code": "TEN000001",
    "subdomain": "globex-za",
    "legal_entity_name": "Globex Insurance Ltd",
    "stage": "IN_PROGRESS",
    "assignee": "erin",
    "sections_done": 2,
    "sections_total": 5,
    "sections_approved": 1,
    "open_remarks": 1,
    "sections": [
      {
        "config_id": "CFG000001",
        "section": "DATABASE",
        "status": "DONE",
        "config": {
          "host": "db.internal"
        },
        "last_result": "connection ok",
        "last_tested_at": "2026-06-17T10:00:00Z",
        "review_status": "APPROVED",
        "configured_by": "erin",
        "reviewed_by": "bob",
        "open_remarks": 0
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/provisioning/{tenantId}/remarks`

**List a tenant's review remarks**

`operationId: listRemarks`

Returns the technical-review trail for a tenant — both `OPEN` and `RESOLVED` remarks — as an
array of `RemarkResponse`.

**Roles:** `PLATFORM_ADMIN`, `PLATFORM_ENGINEER`, or `PLATFORM_APPROVER`. **Dependencies:**
none — read-only.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `tenantId` | path | ✓ | integer (int64) | Numeric tenant id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK — array of RemarkResponse. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER / PLATFORM_APPROVER. |
| `404` | Tenant provisioning not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "remark_id": "RMK000001",
      "section": "DATABASE",
      "body": "Use the read-replica host",
      "severity": "ACTION",
      "status": "OPEN",
      "author": "bob",
      "resolved_by": null,
      "resolved_at": null,
      "created_at": "2026-06-17T09:30:00Z"
    }
  ]
}
```

</details>

---

### `GET` `/platform/provisioning/mine`

**List my provisioning assignments**

`operationId: mine`

Returns only the provisioning entries assigned to the caller (the engineer's own queue), as an
array of `ProvisioningResponse`.

**Roles:** `PLATFORM_ADMIN` or `PLATFORM_ENGINEER`. **Dependencies:** entries appear here once
an admin assigns them via `POST /platform/provisioning/{tenant_id}/assign`.

**Responses**

| Status | Description |
|---|---|
| `200` | OK — array of ProvisioningResponse. |
| `403` | Caller lacks PLATFORM_ADMIN / PLATFORM_ENGINEER. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "provisioning_id": "PRV000001",
      "tenant_id": 1,
      "tenant_code": "TEN000001",
      "subdomain": "globex-za",
      "legal_entity_name": "Globex Insurance Ltd",
      "stage": "IN_PROGRESS",
      "assignee": "erin",
      "sections_done": 2,
      "sections_total": 5,
      "sections_approved": 1,
      "open_remarks": 1,
      "sections": []
    }
  ]
}
```

</details>

---

## Platform Settings · Localization

| Method | Path | Summary |
|---|---|---|
| `POST` | `/platform/settings/validation-rules/draft` | Create a draft |
| `PUT` | `/platform/settings/validation-rules/draft` | Save the draft's rules (rule editor) |
| `POST` | `/platform/settings/validation-rules/versions/{version}/rollback` | Roll back to a version |
| `POST` | `/platform/settings/validation-rules/test` | Live-test a rule |
| `POST` | `/platform/settings/validation-rules/draft/publish` | Publish the draft |
| `GET` | `/platform/settings/localization` | Get localization settings |
| `PATCH` | `/platform/settings/localization` | Update localization settings |
| `GET` | `/platform/settings/validation-rules` | Current validation ruleset (library) |
| `GET` | `/platform/settings/validation-rules/versions` | Ruleset version history |

### `POST` `/platform/settings/validation-rules/draft`

**Create a draft**

`operationId: createDraft`

Creates an editable DRAFT cloning the current published rules (or returns the existing draft). **Role:** `PLATFORM_ADMIN`.

**Responses**

| Status | Description |
|---|---|
| `200` | OK |

---

### `PUT` `/platform/settings/validation-rules/draft`

**Save the draft's rules (rule editor)**

`operationId: saveDraft`

Replaces the DRAFT ruleset's grouped rules. **Role:** `PLATFORM_ADMIN`. Requires a draft.

**Request body** (required): [`SaveRulesRequest`](#schema-saverulesrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `rules` | array&lt;object&gt; | ✓ | Grouped rules: [{ group, icon, rules:[{id, field, applies, pattern, example, error, normalize[], required, status, variants[] }] }]. |
| `note` | string |  | Optional change note for this draft. |

**Responses**

| Status | Description |
|---|---|
| `200` | Saved. |
| `409` | No draft to save. |

---

### `POST` `/platform/settings/validation-rules/versions/{version}/rollback`

**Roll back to a version**

`operationId: rollback`

Restores a prior version's rules as a NEW published version (archiving the current). **Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `version` | path | ✓ | integer (int32) | Version to restore. |

**Responses**

| Status | Description |
|---|---|
| `200` | Rolled back. |
| `404` | Version not found. |

---

### `POST` `/platform/settings/validation-rules/test`

**Live-test a rule**

`operationId: test`

Applies the normalize steps to a sample value then tests it against the pattern (Java regex). Stateless. **Roles:** `PLATFORM_ADMIN` / `SUPPORT`.

**Request body** (required): [`TestRuleRequest`](#schema-testrulerequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `pattern` | string | ✓ | Java regular expression to match. _(e.g. `^\d{8}$`)_ |
| `value` | string | ✓ | Sample value to test. _(e.g. `23456789`)_ |
| `normalize` | array&lt;string&gt; |  | Normalize steps to apply first (e.g. Trim spaces, Uppercase, Lowercase, Remove spaces). |

**Responses**

| Status | Description |
|---|---|
| `200` | OK |

---

### `POST` `/platform/settings/validation-rules/draft/publish`

**Publish the draft**

`operationId: publish`

Publishes the DRAFT (archiving the current published version). **Role:** `PLATFORM_ADMIN`.

**Responses**

| Status | Description |
|---|---|
| `200` | Published. |
| `409` | No draft to publish. |

---

### `GET` `/platform/settings/localization`

**Get localization settings**

`operationId: get_3`

Returns the singleton platform-default locale/formatting (timezone, week start, date/time format,
decimal/thousands separators, currency + symbol + decimals, default language) that tenants inherit.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only).

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "timezone": "Africa/Nairobi (EAT, UTC+03:00)",
    "week_start": "Monday",
    "date_format": "DD/MM/YYYY",
    "time_format": "24-hour (14:30)",
    "decimal_sep": "Period (1,234.56)",
    "thousands_sep": "Comma (1,234.56)",
    "currency": "KES \u2014 Kenyan Shilling",
    "currency_symbol": "Prefix (KES 1,234.56)",
    "currency_decimals": 2,
    "default_language": "English",
    "updated_by": null,
    "updated_at": "2026-06-20T09:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/settings/localization`

**Update localization settings**

`operationId: update_3`

Partial update — supply only the fields to change. Enforced platform-wide as the tenant-inherited
defaults.

**Role:** `PLATFORM_ADMIN`.

**Request body** (required): [`UpdateLocalizationRequest`](#schema-updatelocalizationrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `timezone` | string |  |  |
| `week_start` | string |  |  |
| `date_format` | string |  |  |
| `time_format` | string |  |  |
| `decimal_sep` | string |  |  |
| `thousands_sep` | string |  |  |
| `currency` | string |  |  |
| `currency_symbol` | string |  |  |
| `currency_decimals` | integer (int32) |  |  |
| `default_language` | string |  |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `400` | Invalid field value. |
| `403` | Caller is not PLATFORM_ADMIN. |

---

### `GET` `/platform/settings/validation-rules`

**Current validation ruleset (library)**

`operationId: current`

The live (PUBLISHED) ruleset with its grouped rules. **Roles:** `PLATFORM_ADMIN` / `SUPPORT`.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Forbidden. |

---

### `GET` `/platform/settings/validation-rules/versions`

**Ruleset version history**

`operationId: versions`

All ruleset versions, newest first. **Roles:** `PLATFORM_ADMIN` / `SUPPORT`.

**Responses**

| Status | Description |
|---|---|
| `200` | OK |

---

## Platform Settings · Security

| Method | Path | Summary |
|---|---|---|
| `POST` | `/platform/settings/sessions/{sessionId}/revoke` | Revoke a single session |
| `POST` | `/platform/settings/sessions/revoke-all` | Revoke all sessions of a user |
| `POST` | `/platform/settings/password-status/{memberId}/force-reset` | Force a password reset |
| `POST` | `/platform/settings/mfa-status/{memberId}/remind` | Send an MFA-enrolment reminder |
| `GET` | `/platform/settings/security-policy` | Get the platform security policy |
| `PATCH` | `/platform/settings/security-policy` | Update the platform security policy |
| `GET` | `/platform/settings/notification-templates/{type}` | Get one notification template mapping |
| `PATCH` | `/platform/settings/notification-templates/{type}` | Update a notification template mapping |
| `GET` | `/platform/settings/sessions` | List all active sessions (grouped by member) |
| `GET` | `/platform/settings/password-status` | Password status — summary + per-user list |
| `GET` | `/platform/settings/password-status/{memberId}` | Password status for one user (detail panel) |
| `GET` | `/platform/settings/notification-templates` | List notification template mappings |
| `GET` | `/platform/settings/mfa-status` | MFA status — adoption summary + per-user list |
| `GET` | `/platform/settings/mfa-status/{memberId}` | MFA status for one user (detail panel) |

### `POST` `/platform/settings/sessions/{sessionId}/revoke`

**Revoke a single session**

`operationId: revokeSession`

Revokes one session by its `session_id` (the per-row "Revoke" action). The bearer token bound to
that session is rejected on its next request.

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `sessionId` | path | ✓ | string | The session id (sid) to revoke. |

**Responses**

| Status | Description |
|---|---|
| `200` | Session revoked. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Session not found. |

---

### `POST` `/platform/settings/sessions/revoke-all`

**Revoke all sessions of a user**

`operationId: revokeAll`

Revokes every active session of a member (force sign-out everywhere). Returns the count revoked.

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `member_id` | query | ✓ | integer (int64) | Numeric member id whose sessions to revoke. |

**Responses**

| Status | Description |
|---|---|
| `200` | Sessions revoked. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member not found. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Revoked 2 session(s)",
  "error_details": null,
  "result": {
    "revoked": 2
  }
}
```

</details>

---

### `POST` `/platform/settings/password-status/{memberId}/force-reset`

**Force a password reset**

`operationId: forceReset`

Forces a member to reset their password (the design's "Force password reset"): revokes the member's
active sessions and sends a reset notification (stubbed in dev), so they must set a new password to
sign in again. Audit-logged. The reset is completed via the member's password-set flow / admin reset
(`PUT /platform/organization/members/{id}/password`).

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) | Numeric member id. |

**Responses**

| Status | Description |
|---|---|
| `200` | Reset forced (sessions revoked). |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member not found. |

---

### `POST` `/platform/settings/mfa-status/{memberId}/remind`

**Send an MFA-enrolment reminder**

`operationId: remind`

Records and sends an MFA-setup reminder to a user who hasn't configured MFA (the design's
"Send reminder"). Notification delivery is stubbed in dev; the action is audit-logged.

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) | Numeric member id. |

**Responses**

| Status | Description |
|---|---|
| `200` | Reminder sent. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Member not found. |

---

### `GET` `/platform/settings/security-policy`

**Get the platform security policy**

`operationId: get`

Returns the current singleton platform-wide security policy including MFA settings, password rules,
account lockout configuration, and session timeout values.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Responses**

| Status | Description |
|---|---|
| `200` | OK — grouped by the four screen sections. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "Multi-factor authentication": {
      "mfa_required": false,
      "mfa_totp_enabled": true,
      "mfa_sms_enabled": false,
      "mfa_webauthn_enabled": false
    },
    "Password policy": {
      "password_min_length": 12,
      "password_require_upper": true,
      "password_require_lower": true,
      "password_require_number": true,
      "password_require_special": true,
      "password_expiry_days": 90,
      "password_history_count": 5
    },
    "Lockout": {
      "lockout_max_attempts": 5,
      "lockout_duration_minutes": 30
    },
    "Sessions": {
      "session_timeout_minutes": 480,
      "idle_timeout_minutes": 30,
      "max_concurrent_sessions": 3
    },
    "updated_by": "MBR000001",
    "updated_at": "2026-06-18T09:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/settings/security-policy`

**Update the platform security policy**

`operationId: update`

Configure the platform-wide security policy (MFA methods, password rules, lockout, session timeouts).
This is a PATCH endpoint — the request body is **grouped exactly like the GET response** (read it,
tweak it, send it back). Every section and field is optional; only the non-null values supplied are
applied, e.g. `{ "Password policy": { "password_min_length": 12 }, "Multi-factor authentication": {
"mfa_required": true } }`. The response is the full grouped policy.
Enforced across the platform; PLATFORM_ADMIN only.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Request body** (required): [`UpdateSecurityPolicyRequest`](#schema-updatesecuritypolicyrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `Multi-factor authentication` | [`UpdateSecurityPolicyMfa`](#schema-updatesecuritypolicymfa) |  |  |
| `Password policy` | [`UpdateSecurityPolicyPassword`](#schema-updatesecuritypolicypassword) |  |  |
| `Lockout` | [`UpdateSecurityPolicyLockout`](#schema-updatesecuritypolicylockout) |  |  |
| `Sessions` | [`UpdateSecurityPolicySessions`](#schema-updatesecuritypolicysessions) |  |  |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated (grouped response). |
| `400` | Invalid field value. |
| `403` | Caller is not PLATFORM_ADMIN. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "Multi-factor authentication": {
      "mfa_required": true,
      "mfa_totp_enabled": true,
      "mfa_sms_enabled": false,
      "mfa_webauthn_enabled": false
    },
    "Password policy": {
      "password_min_length": 12,
      "password_require_upper": true,
      "password_require_lower": true,
      "password_require_number": true,
      "password_require_special": true,
      "password_expiry_days": 90,
      "password_history_count": 5
    },
    "Lockout": {
      "lockout_max_attempts": 5,
      "lockout_duration_minutes": 30
    },
    "Sessions": {
      "session_timeout_minutes": 480,
      "idle_timeout_minutes": 30,
      "max_concurrent_sessions": 3
    },
    "updated_by": "MBR000001",
    "updated_at": "2026-06-18T10:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/settings/notification-templates/{type}`

**Get one notification template mapping**

`operationId: get_2`

Returns the template mapping for one notification type. **Roles:** `PLATFORM_ADMIN` or `SUPPORT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `type` | path | ✓ | string enum: `MEMBER_INVITE`, `TENANT_ADMIN_INVITE`, `SMS_OTP` | Notification type. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `400` | Unknown notification type. |
| `404` | Type not configured. |

---

### `PATCH` `/platform/settings/notification-templates/{type}`

**Update a notification template mapping**

`operationId: update_2`

Sets a notification type's `template_id` / `template_code` (and optional `active` toggle) at
runtime — the next send for that type uses the new values immediately. Partial: only non-null
fields are applied. Audited as `NOTIFICATION_TEMPLATE_UPDATED`.

**Role:** `PLATFORM_ADMIN`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `type` | path | ✓ | string enum: `MEMBER_INVITE`, `TENANT_ADMIN_INVITE`, `SMS_OTP` | Notification type. |

**Request body** (required): [`UpdateNotificationTemplateRequest`](#schema-updatenotificationtemplaterequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `template_id` | integer (int64) |  | New template id in the notification service. _(e.g. `42`)_ |
| `template_code` | string |  | New template code in the notification service. _(e.g. `member_invite_v2`)_ |
| `active` | boolean |  | Enable/disable sending this notification type. _(e.g. `True`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated — returns the new mapping. |
| `400` | Unknown notification type / invalid body. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | Type not configured. |

---

### `GET` `/platform/settings/sessions`

**List all active sessions (grouped by member)**

`operationId: listSessions`

Returns every ACTIVE login session across the platform **grouped by member** — one block per
user with their `session_count` and `sessions[]` (each enriched with the browser/OS/device parsed
from the user-agent). Members are ordered by most-recent activity first; sessions within a member
are newest-activity first. The caller's own session is flagged `current: true`. `location` is null
until an IP-geo source is configured. Revoke a whole member's sessions via `revoke-all`.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only).

**Responses**

| Status | Description |
|---|---|
| `200` | OK — sessions grouped by member. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "member_id": 1,
      "account": "admin@ginja.ai",
      "user": "Platform Administrator",
      "session_count": 2,
      "sessions": [
        {
          "session_id": "8f3c\u2026",
          "user_session_id": "SES000001",
          "member_id": 1,
          "account": "admin@ginja.ai",
          "user": "Platform Administrator",
          "browser": "Chrome",
          "os": "macOS",
          "device": "Desktop",
          "ip_address": "102.89.x.x",
          "location": null,
          "started_at": "2026-06-20T08:00:00Z",
          "last_seen_at": "2026-06-20T08:30:00Z",
          "expires_at": "2026-06-20T16:00:00Z",
          "status": "ACTIVE",
          "current": true
        }
      ]
    }
  ]
}
```

</details>

---

### `GET` `/platform/settings/password-status`

**Password status — summary + per-user list**

`operationId: status`

Returns password-expiry tiles (`total_users`, `ok`, `expiring_soon`, `expired`, `pending`) and a
per-user breakdown (`status`, `last_changed`, `days_left`, `expires_at`). Status is derived from each
member's last password change and the policy's `password_expiry_days` (0 = no expiry → everyone
`ok`); `days_left` is negative when overdue; `pending` = no password set yet. The UI filters/searches
client-side.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only).

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "summary": {
      "total_users": 13,
      "ok": 8,
      "expiring_soon": 2,
      "expired": 2,
      "pending": 1
    },
    "users": [
      {
        "member_id": 1,
        "account": "admin@ginja.ai",
        "user": "Platform Administrator",
        "status": "ok",
        "last_changed": "2026-04-01T09:00:00Z",
        "days_left": 57,
        "expires_at": "2026-06-30T09:00:00Z"
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/settings/password-status/{memberId}`

**Password status for one user (detail panel)**

`operationId: detail`

Single user's password status for the detail drawer. **Roles:** `PLATFORM_ADMIN` / `SUPPORT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) | Numeric member id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | Member not found. |

---

### `GET` `/platform/settings/notification-templates`

**List notification template mappings**

`operationId: list_5`

Returns every notification type and the template it currently maps to. `active:false` means the
adapter skips sending that type (per-type kill switch).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read).

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "type": "MEMBER_INVITE",
      "channel": "EMAIL",
      "template_id": 1,
      "template_code": "member_invite",
      "description": "Platform member invite / resend",
      "active": true,
      "updated_by": null,
      "updated_by_name": null,
      "updated_at": null
    }
  ]
}
```

</details>

---

### `GET` `/platform/settings/mfa-status`

**MFA status — adoption summary + per-user list**

`operationId: status_1`

Returns MFA adoption tiles (`total_users`, `mfa_enabled`, `not_configured`, `adoption_rate`) and a
per-user breakdown (`enabled`, enrolled `methods`, `backup_codes`, `enabled_on`). `methods` are the
real backend method codes (`totp`, `sms`, `webauthn`). `backup_codes` and `enabled_on` are not
modeled yet and return `null`. The UI filters (All / Enabled / Not configured) and search client-side.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only).

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "summary": {
      "total_users": 13,
      "mfa_enabled": 9,
      "not_configured": 4,
      "adoption_rate": 69
    },
    "users": [
      {
        "member_id": 1,
        "account": "admin@ginja.ai",
        "user": "Platform Administrator",
        "enabled": true,
        "methods": [
          "totp",
          "webauthn"
        ],
        "backup_codes": null,
        "enabled_on": null
      }
    ]
  }
}
```

</details>

---

### `GET` `/platform/settings/mfa-status/{memberId}`

**MFA status for one user (detail panel)**

`operationId: detail_1`

Single user's MFA enrolment for the detail drawer. **Roles:** `PLATFORM_ADMIN` / `SUPPORT`.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `memberId` | path | ✓ | integer (int64) | Numeric member id. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | Member not found. |

---

## Platform Settings · Provisioning Tiers

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/settings/provisioning-tiers` | List provisioning tiers |
| `POST` | `/platform/settings/provisioning-tiers` | Register a provisioning tier |
| `GET` | `/platform/settings/provisioning-tiers/{code}` | Get a provisioning tier |
| `PATCH` | `/platform/settings/provisioning-tiers/{code}` | Update a provisioning tier |
| `DELETE` | `/platform/settings/provisioning-tiers/{code}` | Delete a provisioning tier |

### `GET` `/platform/settings/provisioning-tiers`

**List provisioning tiers**

`operationId: list`

Returns all provisioning tiers ordered by sort_order ascending.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 1,
      "code": "ISOLATED",
      "name": "Isolated by default",
      "description": "Every tenant is provisioned in its own isolated Postgres schema.",
      "enabled": true,
      "sort_order": 1,
      "created_at": "2026-06-18T09:00:00Z",
      "updated_at": "2026-06-18T09:00:00Z"
    },
    {
      "id": 2,
      "code": "PINNED_RESIDENCY",
      "name": "Pinned data residency",
      "description": "Tenant data stays in its selected residency region.",
      "enabled": true,
      "sort_order": 2,
      "created_at": "2026-06-18T09:00:00Z",
      "updated_at": "2026-06-18T09:00:00Z"
    }
  ]
}
```

</details>

---

### `POST` `/platform/settings/provisioning-tiers`

**Register a provisioning tier**

`operationId: create`

Registers a new provisioning tier. The `code` is normalised to UPPER_SNAKE; 409 if already exists.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Request body** (required): [`CreateProvisioningTierRequest`](#schema-createprovisioningtierrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Unique tier code, e.g. ISOLATED. Normalised to UPPER_SNAKE on create. _(e.g. `ISOLATED`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Isolated by default`)_ |
| `description` | string |  | Longer description of the provisioning tier. _(e.g. `Every tenant is provisioned in its own isolated Postgres schema.`)_ |
| `enabled` | boolean |  | Whether this tier is currently enabled. Defaults to true when omitted. _(e.g. `True`)_ |
| `sort_order` | integer (int32) |  | Display sort order. Defaults to 0 when omitted. _(e.g. `1`)_ |

**Responses**

| Status | Description |
|---|---|
| `201` | Created. |
| `400` | Missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A provisioning tier with this code already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 4,
    "code": "MULTI_REGION",
    "name": "Multi-region",
    "description": "Tenant data replicated across multiple regions.",
    "enabled": true,
    "sort_order": 4,
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T09:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/settings/provisioning-tiers/{code}`

**Get a provisioning tier**

`operationId: get_1`

Returns a single provisioning tier by its code (e.g. `ISOLATED`).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** tier must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Provisioning tier code. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No provisioning tier with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "code": "ISOLATED",
    "name": "Isolated by default",
    "description": "Every tenant is provisioned in its own isolated Postgres schema.",
    "enabled": true,
    "sort_order": 1,
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T09:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/settings/provisioning-tiers/{code}`

**Update a provisioning tier**

`operationId: update_1`

Partially updates a provisioning tier — only non-null fields in the request body are applied.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** tier must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Provisioning tier code. |

**Request body** (required): [`UpdateProvisioningTierRequest`](#schema-updateprovisioningtierrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | Updated display name. _(e.g. `Isolated by default`)_ |
| `description` | string |  | Updated description. _(e.g. `Every tenant is provisioned in its own isolated Postgres schema.`)_ |
| `enabled` | boolean |  | Whether this tier is enabled. _(e.g. `True`)_ |
| `sort_order` | integer (int32) |  | Display sort order. _(e.g. `1`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No provisioning tier with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "code": "ISOLATED",
    "name": "Isolated by default",
    "description": "Updated description.",
    "enabled": true,
    "sort_order": 1,
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T11:00:00Z"
  }
}
```

</details>

---

### `DELETE` `/platform/settings/provisioning-tiers/{code}`

**Delete a provisioning tier**

`operationId: delete`

Removes a provisioning tier from the catalogue.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** tier must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Provisioning tier code. |

**Responses**

| Status | Description |
|---|---|
| `200` | Deleted. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No provisioning tier with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Provisioning tier deleted",
  "error_details": null,
  "result": null
}
```

</details>

---

## Platform Settings · Data Residency

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/settings/data-residency` | List data-residency regions |
| `POST` | `/platform/settings/data-residency` | Register a data-residency region |
| `GET` | `/platform/settings/data-residency/{code}` | Get a data-residency region |
| `PATCH` | `/platform/settings/data-residency/{code}` | Update a data-residency region |
| `DELETE` | `/platform/settings/data-residency/{code}` | Delete a data-residency region |

### `GET` `/platform/settings/data-residency`

**List data-residency regions**

`operationId: list_1`

Returns all data-residency regions in the platform catalogue, ordered by code ascending.

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** none.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": [
    {
      "id": 1,
      "code": "af-east-1",
      "city": "Nairobi",
      "country": "Kenya",
      "status": "ACTIVE",
      "created_at": "2026-06-18T09:00:00Z",
      "updated_at": "2026-06-18T09:00:00Z"
    },
    {
      "id": 2,
      "code": "af-east-2",
      "city": "Dar es Salaam",
      "country": "Tanzania",
      "status": "ACTIVE",
      "created_at": "2026-06-18T09:00:00Z",
      "updated_at": "2026-06-18T09:00:00Z"
    }
  ]
}
```

</details>

---

### `POST` `/platform/settings/data-residency`

**Register a data-residency region**

`operationId: create_1`

Registers a new data-residency region. The `code` is normalised to lower-case-trim; 409 if the code
already exists.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** none.

**Request body** (required): [`CreateRegionRequest`](#schema-createregionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Unique region code, e.g. af-east-1. Normalised to lower-case on create. _(e.g. `af-east-1`)_ |
| `city` | string | ✓ | City where the region's primary data centre is located. _(e.g. `Nairobi`)_ |
| `country` | string | ✓ | Country of the region. _(e.g. `Kenya`)_ |
| `status` | string enum: `ACTIVE`, `PROVISIONING`, `RETIRED` |  | Initial lifecycle status. Defaults to ACTIVE when omitted. _(e.g. `ACTIVE`)_ |

**Responses**

| Status | Description |
|---|---|
| `201` | Created. |
| `400` | Missing required field. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `409` | A region with this code already exists. |

<details><summary>Example <code>201</code> response</summary>

```json
{
  "status": 201,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 8,
    "code": "af-south-2",
    "city": "Cape Town",
    "country": "South Africa",
    "status": "PROVISIONING",
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T09:00:00Z"
  }
}
```

</details>

---

### `GET` `/platform/settings/data-residency/{code}`

**Get a data-residency region**

`operationId: get_4`

Returns a single data-residency region by its code (e.g. `af-east-1`).

**Roles:** `PLATFORM_ADMIN` or `SUPPORT` (read-only). **Dependencies:** region must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Region code. |

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks PLATFORM_ADMIN or SUPPORT. |
| `404` | No region with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 1,
    "code": "af-east-1",
    "city": "Nairobi",
    "country": "Kenya",
    "status": "ACTIVE",
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T09:00:00Z"
  }
}
```

</details>

---

### `PATCH` `/platform/settings/data-residency/{code}`

**Update a data-residency region**

`operationId: update_4`

Partially updates a data-residency region — only non-null fields in the request body are applied.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** region must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Region code. |

**Request body** (required): [`UpdateRegionRequest`](#schema-updateregionrequest)

| Field | Type | Req | Description |
|---|---|---|---|
| `city` | string |  | Updated city name. _(e.g. `Nairobi`)_ |
| `country` | string |  | Updated country name. _(e.g. `Kenya`)_ |
| `status` | string enum: `ACTIVE`, `PROVISIONING`, `RETIRED` |  | New lifecycle status. _(e.g. `ACTIVE`)_ |

**Responses**

| Status | Description |
|---|---|
| `200` | Updated. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No region with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "id": 7,
    "code": "af-west-1",
    "city": "Lagos",
    "country": "Nigeria",
    "status": "ACTIVE",
    "created_at": "2026-06-18T09:00:00Z",
    "updated_at": "2026-06-18T11:00:00Z"
  }
}
```

</details>

---

### `DELETE` `/platform/settings/data-residency/{code}`

**Delete a data-residency region**

`operationId: delete_1`

Removes a data-residency region from the catalogue.

**Role:** `PLATFORM_ADMIN`. **Dependencies:** region must exist.

**Parameters**

| Name | In | Req | Type | Description |
|---|---|---|---|---|
| `code` | path | ✓ | string | Region code. |

**Responses**

| Status | Description |
|---|---|
| `200` | Deleted. |
| `403` | Caller is not PLATFORM_ADMIN. |
| `404` | No region with this code. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": "Region deleted",
  "error_details": null,
  "result": null
}
```

</details>

---

## Dashboard

| Method | Path | Summary |
|---|---|---|
| `GET` | `/platform/dashboard` | Console overview aggregate |

### `GET` `/platform/dashboard`

**Console overview aggregate**

`operationId: overview`

Returns the dashboard roll-up in one call: `kpis` (active tenants, in-onboarding, pending
approvals, covered members), `tenant_status` counts, the `onboarding_pipeline` funnel,
`approvals_needing_attention`, `recent_activity`, and platform `health` metrics.

**Roles:** `PLATFORM_ADMIN`, `SUPPORT`, `PLATFORM_APPROVER`, `PLATFORM_ENGINEER` (read-only).
**Dependencies:** none — aggregated from payers/tenants/onboarding/modules/regions/audit.

**Responses**

| Status | Description |
|---|---|
| `200` | OK. |
| `403` | Caller lacks a platform staff role. |

<details><summary>Example <code>200</code> response</summary>

```json
{
  "status": 200,
  "success": true,
  "message": null,
  "error_details": null,
  "result": {
    "kpis": {
      "active_tenants": 18,
      "in_onboarding": 4,
      "pending_approvals": 5,
      "covered_members": null
    },
    "tenant_status": {
      "DRAFT": 4,
      "PENDING_ACTIVATION": 0,
      "ACTIVE": 18,
      "SUSPENDED": 1,
      "RETIRED": 2
    },
    "onboarding_pipeline": {
      "details_captured": 9,
      "modules_assigned": 7,
      "billing_set": 6,
      "docs_uploaded": 5,
      "submitted_for_review": 4
    },
    "approvals_needing_attention": [
      {
        "kind": "Tenant onboarding",
        "payer": "CIC Insurance Group",
        "payer_id": "PAY000205",
        "payer_numeric_id": 205,
        "maker": "1",
        "submitted_at": "2026-06-18T09:42:00Z",
        "tenants": 4
      }
    ],
    "recent_activity": [
      {
        "actor": "admin@ginja.ai",
        "actor_role": "PLATFORM_ADMIN",
        "action": "PAYER_SUBMITTED",
        "entity_label": "CIC Insurance Group",
        "when": "2026-06-18T09:42:00Z",
        "kind": "neutral"
      }
    ],
    "health": {
      "data_residency_regions": 6,
      "published_modules": 9,
      "tenant_environments": 18
    }
  }
}
```

</details>

---

## Schemas

### AcceptInviteRequest
<a id="schema-acceptinviterequest"></a>

Invite token + chosen password to activate a member.

| Field | Type | Req | Description |
|---|---|---|---|
| `token` | string | ✓ | The pending, unexpired invite token e-mailed to the user when they were invited (POST /platform/organization/members) or re-invited (resend-invite). _(e.g. `f47ac10b58cc4372a5670e02b2c3d479`)_ |
| `password` | string | ✓ | The member's chosen password. _(e.g. `NewPass@123`)_ |

### AddRemarkRequest
<a id="schema-addremarkrequest"></a>

A technical reviewer's remark on a config section.

| Field | Type | Req | Description |
|---|---|---|---|
| `body` | string | ✓ | The remark text. _(e.g. `Point this at the read-replica host, not primary.`)_ |
| `severity` | string |  | Severity of the remark; defaults to ACTION when omitted (e.g. ACTION, INFO). _(e.g. `ACTION`)_ |

### ApprovalActionRequest
<a id="schema-approvalactionrequest"></a>

Approver decision payload. The comment is optional for approve but mandatory for reject and request-info (enforced server-side).

| Field | Type | Req | Description |
|---|---|---|---|
| `comment` | string |  | Decision note shown to the submitter; mandatory for reject / request-info. _(e.g. `Verified — entitlements and contract are in order.`)_ |

### AssignPermissionsRequest
<a id="schema-assignpermissionsrequest"></a>

Payload to assign one or more permissions (by code) to a role.

| Field | Type | Req | Description |
|---|---|---|---|
| `permission_codes` | array&lt;string&gt; | ✓ | Permission codes to assign (idempotent). Each must exist in the permission catalogue. |

### AssignProvisioningRequest
<a id="schema-assignprovisioningrequest"></a>

Assign a tenant's provisioning to a Platform Engineer.

| Field | Type | Req | Description |
|---|---|---|---|
| `assignee` | string | ✓ | The Platform Engineer to assign (id or email). _(e.g. `erin`)_ |

### AssignRolesRequest
<a id="schema-assignrolesrequest"></a>

Payload to assign one or more roles (by id) to a member.

| Field | Type | Req | Description |
|---|---|---|---|
| `role_ids` | array&lt;integer (int64)&gt; | ✓ | Role ids to assign (idempotent). Each role must already exist. |

### AssignStepRequest
<a id="schema-assignsteprequest"></a>

§8.9 — assign an onboarding step to a member (by id or email) for completion.

| Field | Type | Req | Description |
|---|---|---|---|
| `assignee` | string | ✓ | Member to assign the step to (id or email). _(e.g. `engineer@ginja.ai`)_ |

### AuditLogResponse
<a id="schema-auditlogresponse"></a>

A single entry in the append-only audit/activity trail.

| Field | Type | Req | Description |
|---|---|---|---|
| `audit_id` | string |  | Human-readable audit entry code. _(e.g. `AUD000001`)_ |
| `actor` | string |  | The acting member id / subject. _(e.g. `1`)_ |
| `actor_name` | string |  | Resolved display name of the actor. _(e.g. `admin@ginja.ai`)_ |
| `actor_role` | string |  | The actor's role(s) at the time of the action (snapshot). _(e.g. `PLATFORM_ADMIN`)_ |
| `action` | string |  | Action code that occurred. _(e.g. `ROLE_CREATED`)_ |
| `module` | string |  | Functional module the action belongs to (derived from the action). _(e.g. `ROLE_MANAGEMENT`)_ |
| `module_label` | string |  | Human-readable label for the module. _(e.g. `Roles & permissions`)_ |
| `entity_type` | string |  | Type of the affected entity. _(e.g. `Role`)_ |
| `entity_id` | string |  | Business code of the affected entity. _(e.g. `ROL000002`)_ |
| `entity_label` | string |  | Human-readable label of the affected entity. _(e.g. `FINANCE_OPERATOR`)_ |
| `before` | object |  | Snapshot of the entity before the change (null when not applicable). |
| `after` | object |  | Snapshot of the entity after the change (null when not applicable). |
| `changes` | object |  | Field-level diff of the change, keyed by field with from/to values. |
| `reason` | string |  | Reason captured with the action (e.g. a suspension reason). |
| `created_at` | string (date-time) |  | When the entry was recorded. _(e.g. `2026-06-17T04:00:00Z`)_ |
| `kind` | string |  | UI category derived from the action: create, edit, publish, approve, danger, system or neutral (drives the icon/tone). _(e.g. `create`)_ |

### BankDetailsRequest
<a id="schema-bankdetailsrequest"></a>

Bank account details, supplied nested under a tenant. All fields are WRITE-ONLY: they are stored encrypted at rest and are NEVER returned in any response. Optional at capture; validated for completeness later.

| Field | Type | Req | Description |
|---|---|---|---|
| `account_holder` | string |  | Account holder name. Write-only/encrypted — never returned. _(e.g. `Globex`)_ |
| `bank_name` | string |  | Bank name. Write-only/encrypted — never returned. _(e.g. `FNB`)_ |
| `account_number` | string |  | Account number. Write-only/encrypted — never returned. _(e.g. `123456`)_ |
| `branch_code` | string |  | Branch / routing code. Write-only/encrypted — never returned. _(e.g. `250655`)_ |
| `swift_bic` | string |  | SWIFT / BIC. Write-only/encrypted — never returned. _(e.g. `FIRNZAJJ`)_ |

### ConfigSectionResponse
<a id="schema-configsectionresponse"></a>

A single tenant config section (e.g. DATABASE) with its settings, last test result, and technical-review state.

| Field | Type | Req | Description |
|---|---|---|---|
| `config_id` | string |  | Business id of the config section record. _(e.g. `CFG000001`)_ |
| `section` | string enum: `DATABASE`, `DOMAINS_SSL`, `EMAIL`, `SMS`, `DATA_MIGRATION` |  | Which section this is. One of DATABASE, DOMAINS_SSL, EMAIL, SMS, DATA_MIGRATION. _(e.g. `DATABASE`)_ |
| `status` | string enum: `NOT_STARTED`, `CONFIGURED`, `TESTED`, `DONE` |  | Completion status. One of NOT_STARTED, CONFIGURED, TESTED, DONE. _(e.g. `DONE`)_ |
| `config` | object |  | The section's saved key/value settings. |
| `last_result` | string |  | Outcome message from the last test/verify run. _(e.g. `connection ok`)_ |
| `last_tested_at` | string (date-time) |  | When the section was last tested (UTC). _(e.g. `2026-06-17T10:00:00Z`)_ |
| `review_status` | string enum: `PENDING`, `CHANGES_REQUESTED`, `APPROVED` |  | Technical-review state. One of PENDING, CHANGES_REQUESTED, APPROVED. _(e.g. `APPROVED`)_ |
| `configured_by` | string |  | Engineer who configured the section (the maker). _(e.g. `erin`)_ |
| `reviewed_by` | string |  | Reviewer who approved the section (the checker; must differ from configurer). _(e.g. `bob`)_ |
| `open_remarks` | integer (int64) |  | Count of open (unresolved) remarks on this section. _(e.g. `0`)_ |

### ContactRequest
<a id="schema-contactrequest"></a>

A tenant contact card (Step 1).

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string | ✓ | Contact name. _(e.g. `Gil`)_ |
| `email` | string (email) | ✓ | Contact email. _(e.g. `gil@globex.io`)_ |
| `role_title` | string |  | Contact role / title. _(e.g. `Operations Lead`)_ |
| `receives_invite` | boolean |  | True if this contact should receive the activation invite. _(e.g. `True`)_ |

### ContactResponse
<a id="schema-contactresponse"></a>

A tenant contact card.

| Field | Type | Req | Description |
|---|---|---|---|
| `contact_id` | string |  | Business id of the contact. _(e.g. `CON000001`)_ |
| `name` | string |  | Contact name. _(e.g. `Gil`)_ |
| `email` | string |  | Contact email. _(e.g. `gil@globex.io`)_ |
| `role_title` | string |  | Contact role / title. _(e.g. `Operations Lead`)_ |
| `receives_invite` | boolean |  | True if this contact receives the tenant activation invite. _(e.g. `True`)_ |

### CreatePayerRequest
<a id="schema-createpayerrequest"></a>

§8.1 — create a DRAFT payer together with its primary tenant. The nested primary_tenant is a TenantDetailsRequest (which itself may carry contacts and bank details).

| Field | Type | Req | Description |
|---|---|---|---|
| `payer_type` | string enum: `INSURER`, `TPA`, `SELF_MANAGED_SCHEME` | ✓ | Payer category. _(e.g. `INSURER`)_ |
| `primary_tenant` | [`TenantDetailsRequest`](#schema-tenantdetailsrequest) | ✓ |  |

### CreatePermissionRequest
<a id="schema-createpermissionrequest"></a>

Payload to register a new permission in the catalogue.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Permission code; normalised to UPPER_SNAKE and exposed as the PERM_<code> authority. _(e.g. `REPORTS_EXPORT`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Export Reports`)_ |
| `description` | string |  | Optional longer description of what the permission grants. _(e.g. `Allows exporting reports`)_ |
| `group_code` | string |  | Capability group code this permission belongs to. _(e.g. `OBSERVABILITY`)_ |
| `group_label` | string |  | Human-readable group label. _(e.g. `Observability`)_ |
| `sensitive` | boolean |  | Whether this is a sensitive capability. _(e.g. `False`)_ |

### CreatePricingStructureRequest
<a id="schema-createpricingstructurerequest"></a>

Payload to author a new pricing structure (created in DRAFT) with its nested components[], each carrying a tiers[] volume-discount schedule.

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string | ✓ | Unique display name of the pricing structure. _(e.g. `Enterprise PMPM 2026`)_ |
| `description` | string |  | Optional longer description. _(e.g. `custom`)_ |
| `model` | string enum: `TRANSACTION_BASED`, `PCT_GWP` | ✓ | Pricing model. _(e.g. `TRANSACTION_BASED`)_ |
| `currency` | string |  | ISO-4217 3-letter currency code; defaults to USD when omitted. _(e.g. `USD`)_ |
| `implementation_fee` | number |  | One-time implementation fee; defaults to 0. _(e.g. `250000`)_ |
| `platform_fee_annual` | number |  | Annual platform fee; defaults to 0. _(e.g. `0`)_ |
| `savings_capture_pct` | number |  | Savings-capture percentage. _(e.g. `12.5`)_ |
| `components` | array&lt;[`PricingComponentRequest`](#schema-pricingcomponentrequest)&gt; | ✓ | Priced lines for this structure; each component carries its own tiers[]. Must be non-empty. |

### CreateProvisioningTierRequest
<a id="schema-createprovisioningtierrequest"></a>

Registers a new provisioning tier in the platform catalogue.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Unique tier code, e.g. ISOLATED. Normalised to UPPER_SNAKE on create. _(e.g. `ISOLATED`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Isolated by default`)_ |
| `description` | string |  | Longer description of the provisioning tier. _(e.g. `Every tenant is provisioned in its own isolated Postgres schema.`)_ |
| `enabled` | boolean |  | Whether this tier is currently enabled. Defaults to true when omitted. _(e.g. `True`)_ |
| `sort_order` | integer (int32) |  | Display sort order. Defaults to 0 when omitted. _(e.g. `1`)_ |

### CreateRegionRequest
<a id="schema-createregionrequest"></a>

Registers a new data-residency region in the platform catalogue.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Unique region code, e.g. af-east-1. Normalised to lower-case on create. _(e.g. `af-east-1`)_ |
| `city` | string | ✓ | City where the region's primary data centre is located. _(e.g. `Nairobi`)_ |
| `country` | string | ✓ | Country of the region. _(e.g. `Kenya`)_ |
| `status` | string enum: `ACTIVE`, `PROVISIONING`, `RETIRED` |  | Initial lifecycle status. Defaults to ACTIVE when omitted. _(e.g. `ACTIVE`)_ |

### CreateRoleRequest
<a id="schema-createrolerequest"></a>

Payload to create a CUSTOM role (name, colour and permissions).

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string | ✓ | Role name; normalised to UPPER_SNAKE and used as the JWT role authority. _(e.g. `Finance Operator`)_ |
| `description` | string |  | Optional longer description of the role. _(e.g. `Finance + claims`)_ |
| `hex_color` | string |  | Accent colour for the role badge, as a hex string. _(e.g. `#6741D9`)_ |
| `permission_codes` | array&lt;string&gt; |  | Permission codes that define this role (each must exist in the catalogue). |

### DocumentResponse
<a id="schema-documentresponse"></a>

A KYB / contract document attached to a tenant (§8.5).

| Field | Type | Req | Description |
|---|---|---|---|
| `document_id` | string |  | Business id of the document. _(e.g. `DOC000001`)_ |
| `category` | string |  | KYB category. _(e.g. `SIGNED_CONTRACT`)_ |
| `file_name` | string |  | Original file name. _(e.g. `contract.pdf`)_ |
| `file_id` | string |  | Document service file id; use it to fetch a fresh download URL. _(e.g. `FIL000001HPHODQ6Y9GJD`)_ |
| `status` | string enum: `PENDING_REVIEW`, `APPROVED`, `APPROVED_WITH_CONDITIONS`, `REJECTED` |  | Review status; newly uploaded documents are PENDING_REVIEW. _(e.g. `PENDING_REVIEW`)_ |
| `expiry_date` | string (date) |  | Optional expiry date. _(e.g. `2027-01-01`)_ |

### EntitlementResponse
<a id="schema-entitlementresponse"></a>

A single module/sub-module entitlement granted to a payer.

| Field | Type | Req | Description |
|---|---|---|---|
| `entitlement_id` | string |  | Business id of the entitlement. _(e.g. `ENT000001`)_ |
| `module_code` | string |  | Module code. _(e.g. `CLAIMS`)_ |
| `submodule_code` | string |  | Sub-module code; null for a whole-module entitlement. _(e.g. `INVOICING`)_ |
| `enabled` | boolean |  | Whether the entitlement is enabled. _(e.g. `True`)_ |

### InviteMemberRequest
<a id="schema-invitememberrequest"></a>

Payload for the Invite-user form: name, email and roles to assign.

| Field | Type | Req | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | Member email (login identifier); must be unique. The invite is sent here. _(e.g. `ops@ginja.ai`)_ |
| `full_name` | string | ✓ | Member's full display name. _(e.g. `Ops User`)_ |
| `role_ids` | array&lt;integer (int64)&gt; |  | Role ids to assign to the member (fetch options from GET /platform/organization/roles). |
| `expiry_days` | integer (int32) |  | Invite validity in days (1-90, default 7). _(e.g. `7`)_ |

### LoginRequest
<a id="schema-loginrequest"></a>

Email + password credentials for a platform login.

| Field | Type | Req | Description |
|---|---|---|---|
| `email` | string (email) | ✓ | Member's email address. _(e.g. `admin@ginja.ai`)_ |
| `password` | string | ✓ | Member's password. _(e.g. `Admin@12345`)_ |

### LoginResponse
<a id="schema-loginresponse"></a>

Bearer token plus the resolved access context for a logged-in member.

| Field | Type | Req | Description |
|---|---|---|---|
| `access_token` | string |  | The issued JWT to send as a bearer token. _(e.g. `eyJhbGciOiJIUzI1NiJ9...`)_ |
| `token_type` | string |  | Token scheme to use in the Authorization header. _(e.g. `Bearer`)_ |
| `session_id` | string |  | Server-side session id backing this token (the token's sid claim). _(e.g. `8f3c1d2e-...`)_ |
| `expires_at` | string (date-time) |  | When the token/session expires. _(e.g. `2026-06-17T12:00:00Z`)_ |
| `member_id` | integer (int64) |  | Numeric id of the authenticated member. _(e.g. `1`)_ |
| `email` | string |  | Authenticated member's email. _(e.g. `admin@ginja.ai`)_ |
| `roles` | array&lt;string&gt; |  | Roles granted to the member. |
| `accessible_modules` | array&lt;string&gt; |  | Effective module access (union across the member's roles). |
| `accessible_permissions` | array&lt;string&gt; |  | Effective permissions (union across the member's roles). |

### LoginVerifyRequest
<a id="schema-loginverifyrequest"></a>

MFA challenge token + TOTP code to finish login.

| Field | Type | Req | Description |
|---|---|---|---|
| `challenge_token` | string | ✓ | The challenge_token returned by /auth/login. _(e.g. `0428a10b14e94e98ab3047573d294365`)_ |
| `code` | string | ✓ | The 6-digit code from the authenticator app. _(e.g. `123456`)_ |

### MemberResponse
<a id="schema-memberresponse"></a>

An internal Platform Console member with their roles and effective module/permission access.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in FKs). _(e.g. `7`)_ |
| `member_id` | string |  | Human-readable business code. _(e.g. `MBR000007`)_ |
| `email` | string |  | Member email (login identifier). _(e.g. `ops@ginja.ai`)_ |
| `full_name` | string |  | Member's full display name. _(e.g. `Ops User`)_ |
| `status` | string enum: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED` |  | Lifecycle status of the member. _(e.g. `INVITED`)_ |
| `status_reason` | string |  | Reason captured on the member's last status change (e.g. suspension reason); null once reactivated. _(e.g. `Policy violation`)_ |
| `mfa_enabled` | boolean |  | Whether MFA is configured (currently always false until the MFA module lands). _(e.g. `False`)_ |
| `roles` | array&lt;[`RoleSummary`](#schema-rolesummary)&gt; |  | Roles assigned to the member. |
| `accessible_modules` | array&lt;string&gt; |  | Effective module codes (union of the member's roles' enabled functionalities). |
| `accessible_permissions` | array&lt;string&gt; |  | Effective permission codes (union across the member's active roles). |
| `invited_by` | string |  | Human-readable label of who invited/created the member. _(e.g. `Platform Administrator`)_ |
| `invite_expires_at` | string (date-time) |  | Pending invite expiry (populated only while status=INVITED), UTC ISO-8601. _(e.g. `2026-06-24T04:06:37Z`)_ |
| `invite_expired` | boolean |  | Whether the pending invite has expired (populated only while status=INVITED). _(e.g. `False`)_ |
| `member_since` | string (date-time) |  | When the member first became active, UTC ISO-8601. _(e.g. `2026-06-17T04:06:37Z`)_ |
| `last_active` | string (date-time) |  | Last active timestamp derived from sessions, UTC ISO-8601. _(e.g. `2026-06-17T09:15:00Z`)_ |
| `active_sessions` | integer (int32) |  | Number of currently active sessions for the member. _(e.g. `0`)_ |
| `created_at` | string (date-time) |  | Creation timestamp (UTC, ISO-8601). _(e.g. `2026-06-17T04:06:37Z`)_ |

### ModuleEntitlement
<a id="schema-moduleentitlement"></a>

A module entitlement with optional sub-module codes.

| Field | Type | Req | Description |
|---|---|---|---|
| `module_code` | string | ✓ | Module code. _(e.g. `CLAIMS`)_ |
| `submodule_codes` | array&lt;string&gt; |  | Optional sub-module codes within the module. |

### ModuleResponse
<a id="schema-moduleresponse"></a>

A module entry in the configuration-library catalogue.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in FKs). _(e.g. `5`)_ |
| `module_id` | string |  | Human-readable business identifier. _(e.g. `MRC000005`)_ |
| `code` | string |  | Normalised module code exposed as the MODULE_<code> authority. _(e.g. `CLAIMS`)_ |
| `name` | string |  | Display name. _(e.g. `Claims`)_ |
| `description` | string |  | Longer description. _(e.g. `End-to-end claims management and processing.`)_ |
| `icon` | string |  | Icon identifier or URL. _(e.g. `icon-claims`)_ |
| `url` | string |  | Documentation URL. _(e.g. `https://docs.ginja.ai/claims`)_ |
| `version` | string |  | Semantic version of this module definition. _(e.g. `1.0.0`)_ |
| `status` | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` |  | Lifecycle status. _(e.g. `PUBLISHED`)_ |
| `owner_team` | string |  | Team responsible for this module. _(e.g. `Claims Engineering`)_ |
| `tenants` | integer (int64) |  | Number of distinct payer tenants entitled to this module. _(e.g. `12`)_ |
| `sub_modules` | array&lt;[`SubModuleResponse`](#schema-submoduleresponse)&gt; |  | Sub-modules belonging to this module. |
| `created_by` | string |  | Actor who created this module. _(e.g. `MBR000001`)_ |
| `created_by_name` | string |  | Display name of the actor who created this module. _(e.g. `Alice Admin`)_ |
| `updated_by` | string |  | Actor who last updated this module. _(e.g. `MBR000002`)_ |
| `updated_by_name` | string |  | Display name of the actor who last updated this module. _(e.g. `Bob Engineer`)_ |
| `created_at` | string (date-time) |  | ISO-8601 creation timestamp. _(e.g. `2026-06-17T08:00:00Z`)_ |
| `updated_at` | string (date-time) |  | ISO-8601 last-update timestamp. _(e.g. `2026-06-17T09:30:00Z`)_ |

### OnboardingProgressResponse
<a id="schema-onboardingprogressresponse"></a>

The wizard's section tracker for a payer: the seven steps plus overall progress. Drive the Review screen from completedSteps/incompleteSteps and progressPct, and enable Submit when readyToSubmit is true (every required step except review is complete).

| Field | Type | Req | Description |
|---|---|---|---|
| `payer_id` | integer (int64) |  | Numeric payer id. _(e.g. `2`)_ |
| `completed` | integer (int32) |  | Number of completed steps. _(e.g. `5`)_ |
| `total` | integer (int32) |  | Total number of steps (always 7). _(e.g. `7`)_ |
| `progress_pct` | integer (int32) |  | Completion percentage. _(e.g. `71`)_ |
| `required_completed` | integer (int32) |  | Number of required steps completed. _(e.g. `5`)_ |
| `required_total` | integer (int32) |  | Total number of required steps (excludes optional secondary). _(e.g. `6`)_ |
| `all_required_complete` | boolean |  | True when every required step is complete (optional secondary excluded). _(e.g. `False`)_ |
| `ready_to_submit` | boolean |  | True when every required step except review is complete; gates the Submit button. _(e.g. `True`)_ |
| `completed_steps` | array&lt;string&gt; |  | Keys of completed steps. |
| `incomplete_steps` | array&lt;string&gt; |  | Keys of incomplete steps. |
| `steps` | array&lt;[`OnboardingStepResponse`](#schema-onboardingstepresponse)&gt; |  | The full step list with per-step status and assignment. |

### OnboardingStepResponse
<a id="schema-onboardingstepresponse"></a>

One onboarding step in the wizard tracker, with its owner role, required flag, status and assignment/completion audit fields.

| Field | Type | Req | Description |
|---|---|---|---|
| `step_id` | string |  | Business id of the step. _(e.g. `OST000003`)_ |
| `step_key` | string |  | Step key: one of primary, secondary, modules, billing, documents, review. _(e.g. `modules`)_ |
| `owner_role` | string |  | Owner role responsible for the step. _(e.g. `profile`)_ |
| `sort_order` | integer (int32) |  | Display/ordering position of the step. _(e.g. `3`)_ |
| `required` | boolean |  | Whether the step is required to submit (secondary is optional). _(e.g. `True`)_ |
| `status` | string enum: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETE` |  | Step status. _(e.g. `COMPLETE`)_ |
| `complete` | boolean |  | Convenience flag: true when status is COMPLETE. _(e.g. `True`)_ |
| `assignee` | string |  | Member (id or email) the step is assigned to. _(e.g. `engineer@ginja.ai`)_ |
| `assigned_by` | string |  | Member who assigned the step. _(e.g. `1`)_ |
| `completed_by` | string |  | Member who completed the step. _(e.g. `1`)_ |
| `completed_at` | string (date-time) |  | When the step was completed. |

### Pageable
<a id="schema-pageable"></a>

| Field | Type | Req | Description |
|---|---|---|---|
| `page` | integer (int32) |  |  |
| `size` | integer (int32) |  |  |
| `sort` | array&lt;string&gt; |  |  |

### PayerResponse
<a id="schema-payerresponse"></a>

Full Payer aggregate returned by every onboarding step: the account plus its nested tenants (each with its contacts and document checklist), module entitlements and subscription. The same shape is returned by create, add-secondary, set-entitlements, set-subscription, add-document, technical-config, submit and activate.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in path params and FKs). _(e.g. `1`)_ |
| `payer_id` | string |  | Human-readable business code. _(e.g. `PAY000001`)_ |
| `status` | string enum: `DRAFT`, `ACTIVE`, `SUSPENDED`, `RETIRED` |  | Lifecycle status. Stays DRAFT through build-up and submit; flips to ACTIVE on approval. _(e.g. `DRAFT`)_ |
| `payer_type` | string enum: `INSURER`, `TPA`, `SELF_MANAGED_SCHEME` |  | Payer category. _(e.g. `INSURER`)_ |
| `primary_tenant_id` | integer (int64) |  | Numeric id of the primary tenant. _(e.g. `1`)_ |
| `submitted_by` | string |  | Member who submitted for approval; null until submit (§8.6). _(e.g. `null`)_ |
| `submitted_at` | string (date-time) |  | When the payer was submitted; null until submit (§8.6). |
| `activated_at` | string (date-time) |  | When the payer was activated; null until approval auto-activation. |
| `tenants` | array&lt;[`TenantResponse`](#schema-tenantresponse)&gt; |  | The payer's tenants (the primary plus any secondaries), each with documents/contacts. |
| `entitlements` | array&lt;[`EntitlementResponse`](#schema-entitlementresponse)&gt; |  | Module entitlements; empty until set via §8.3. |
| `subscription` | [`SubscriptionResponse`](#schema-subscriptionresponse) |  |  |
| `created_at` | string (date-time) |  | Creation timestamp. |

### PermissionResponse
<a id="schema-permissionresponse"></a>

A permission in the platform catalogue; assignable to roles and carried in the login JWT as a PERM_<code> authority.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in FKs). _(e.g. `11`)_ |
| `permission_id` | string |  | Human-readable business code. _(e.g. `PRM000011`)_ |
| `code` | string |  | Permission code; exposed as the PERM_<code> authority. _(e.g. `CLAIMS_APPROVE`)_ |
| `name` | string |  | Display name. _(e.g. `Approve Claims`)_ |
| `description` | string |  | Longer description of what the permission grants. _(e.g. `Allows approving submitted claims`)_ |
| `group_code` | string |  | Capability group code this permission belongs to. _(e.g. `APPROVALS`)_ |
| `group_label` | string |  | Human-readable group label (for the role-editor matrix). _(e.g. `Approvals`)_ |
| `sensitive` | boolean |  | Whether this is a sensitive capability (shown with a warning). _(e.g. `True`)_ |
| `status` | string enum: `ACTIVE`, `INACTIVE` |  | Lifecycle status of the catalogue entry. _(e.g. `ACTIVE`)_ |

### PricingComponentRequest
<a id="schema-pricingcomponentrequest"></a>

A priced line within a pricing structure (e.g. CORE_PLATFORM_PMPM), carrying its own tiers[] volume-discount schedule.

| Field | Type | Req | Description |
|---|---|---|---|
| `component_type` | string | ✓ | Component type identifier. _(e.g. `CORE_PLATFORM_PMPM`)_ |
| `unit` | string | ✓ | Billing unit for this component. _(e.g. `PER_MEMBER_MONTH`)_ |
| `sort_order` | integer (int32) |  | Display/order position of this component within the structure. _(e.g. `1`)_ |
| `tiers` | array&lt;[`PricingTierRequest`](#schema-pricingtierrequest)&gt; | ✓ | Volume-discount tiers for this component (nested under the component). Must be non-empty. |

### PricingComponentResponse
<a id="schema-pricingcomponentresponse"></a>

A priced line within a pricing structure, with its nested tiers[] schedule.

| Field | Type | Req | Description |
|---|---|---|---|
| `component_id` | string |  | Human-readable business code for the component. _(e.g. `PCM000001`)_ |
| `component_type` | string |  | Component type identifier. _(e.g. `CORE_PLATFORM_PMPM`)_ |
| `unit` | string |  | Billing unit. _(e.g. `PER_MEMBER_MONTH`)_ |
| `sort_order` | integer (int32) |  | Display/order position within the structure. _(e.g. `1`)_ |
| `tiers` | array&lt;[`PricingTierResponse`](#schema-pricingtierresponse)&gt; |  | Volume-discount tiers nested under this component. |

### PricingStructureResponse
<a id="schema-pricingstructureresponse"></a>

A pricing structure with its nested components[], each carrying a tiers[] schedule.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key. _(e.g. `1`)_ |
| `pricing_id` | string |  | Human-readable business code. _(e.g. `PRC000001`)_ |
| `name` | string |  | Display name. _(e.g. `Transaction-Based`)_ |
| `description` | string |  | Longer description. _(e.g. `...`)_ |
| `model` | string enum: `TRANSACTION_BASED`, `PCT_GWP` |  | Pricing model. _(e.g. `TRANSACTION_BASED`)_ |
| `status` | string enum: `DRAFT`, `ACTIVE`, `ARCHIVED` |  | Lifecycle status (DRAFT → ACTIVE → ARCHIVED). _(e.g. `ACTIVE`)_ |
| `currency` | string |  | ISO-4217 currency code. _(e.g. `USD`)_ |
| `implementation_fee` | number |  | One-time implementation fee. _(e.g. `400000`)_ |
| `platform_fee_annual` | number |  | Annual platform fee. _(e.g. `0`)_ |
| `savings_capture_pct` | number |  | Savings-capture percentage. _(e.g. `15.0`)_ |
| `components` | array&lt;[`PricingComponentResponse`](#schema-pricingcomponentresponse)&gt; |  | Priced lines for this structure; each component nests its own tiers[]. |

### PricingTierRequest
<a id="schema-pricingtierrequest"></a>

A single volume-discount tier nested within a PricingComponentRequest's tiers[].

| Field | Type | Req | Description |
|---|---|---|---|
| `tier_number` | integer (int32) | ✓ | 1-based ordinal of this tier within the component. _(e.g. `1`)_ |
| `volume_threshold_min` | number | ✓ | Inclusive lower volume bound at which this tier's rate applies. _(e.g. `0`)_ |
| `rate` | number | ✓ | Per-unit rate for this tier. _(e.g. `0.55`)_ |
| `discount_pct` | number |  | Discount percentage relative to the base tier (may be negative). _(e.g. `-12.7`)_ |

### PricingTierResponse
<a id="schema-pricingtierresponse"></a>

A single volume-discount tier nested within a PricingComponentResponse's tiers[].

| Field | Type | Req | Description |
|---|---|---|---|
| `tier_id` | string |  | Human-readable business code for the tier. _(e.g. `PTR000001`)_ |
| `tier_number` | integer (int32) |  | 1-based ordinal of this tier within the component. _(e.g. `1`)_ |
| `volume_threshold_min` | number |  | Inclusive lower volume bound at which this tier's rate applies. _(e.g. `0`)_ |
| `rate` | number |  | Per-unit rate for this tier. _(e.g. `0.5`)_ |
| `discount_pct` | number |  | Discount percentage relative to the base tier (may be negative). _(e.g. `0.0`)_ |

### ProvisioningResponse
<a id="schema-provisioningresponse"></a>

A tenant's provisioning queue entry: stage, assignee, progress counts, and the nested config sections (sections[] of ConfigSectionResponse).

| Field | Type | Req | Description |
|---|---|---|---|
| `provisioning_id` | string |  | Business id of the provisioning record. _(e.g. `PRV000001`)_ |
| `tenant_id` | integer (int64) |  | Numeric tenant id. _(e.g. `1`)_ |
| `tenant_code` | string |  | Tenant business code. _(e.g. `TEN000001`)_ |
| `subdomain` | string |  | Tenant subdomain. _(e.g. `globex-za`)_ |
| `legal_entity_name` | string |  | Tenant's legal entity name. _(e.g. `Globex Insurance Ltd`)_ |
| `stage` | string enum: `AWAITING_START`, `IN_PROGRESS`, `BLOCKED`, `READY_TO_ACTIVATE` |  | Overall provisioning stage. One of AWAITING_START, IN_PROGRESS, BLOCKED, READY_TO_ACTIVATE. _(e.g. `IN_PROGRESS`)_ |
| `assignee` | string |  | Assigned Platform Engineer (id/email); null if unassigned. _(e.g. `erin`)_ |
| `sections_done` | integer (int32) |  | Number of sections marked DONE. _(e.g. `2`)_ |
| `sections_total` | integer (int32) |  | Total number of config sections (always 5). _(e.g. `5`)_ |
| `sections_approved` | integer (int32) |  | Number of sections with review_status APPROVED. _(e.g. `1`)_ |
| `open_remarks` | integer (int64) |  | Count of open (unresolved) remarks across all sections. _(e.g. `1`)_ |
| `sections` | array&lt;[`ConfigSectionResponse`](#schema-configsectionresponse)&gt; |  | The nested config sections (one per section key); empty in queue summaries. |

### RegisterModuleRequest
<a id="schema-registermodulerequest"></a>

Payload to register a new module in the configuration-library catalogue.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Module code; normalised to UPPER_SNAKE and exposed as the MODULE_<code> authority. _(e.g. `CLAIMS`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Claims`)_ |
| `description` | string |  | Optional longer description of what the module does. _(e.g. `End-to-end claims management and processing.`)_ |
| `icon` | string |  | Icon identifier or URL for the module in the UI. _(e.g. `icon-claims`)_ |
| `url` | string |  | URL to the module's documentation or landing page. _(e.g. `https://docs.ginja.ai/claims`)_ |
| `version` | string |  | Semantic version of this module definition. _(e.g. `1.0.0`)_ |
| `owner_team` | string |  | Team responsible for this module. _(e.g. `Claims Engineering`)_ |
| `status` | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` |  | Initial lifecycle status; defaults to DRAFT if omitted. _(e.g. `DRAFT`)_ |
| `sub_modules` | array&lt;[`SubModuleRequest`](#schema-submodulerequest)&gt; |  | Sub-modules to create together with the parent module. |
| `note` | string |  | Change note recorded on the initial version (v1.0). _(e.g. `Initial registry import.`)_ |

### Response
<a id="schema-response"></a>

Uniform envelope wrapping every API response. The documented payload appears under `result`; `error_details` is populated only on failure.

| Field | Type | Req | Description |
|---|---|---|---|
| `status` | integer (int32) |  | Mirrors the HTTP status code. _(e.g. `200`)_ |
| `success` | boolean |  | `true` for 2xx, `false` for errors. _(e.g. `True`)_ |
| `message` | string |  | Human-readable note; often null on success. |
| `result` | object |  | The endpoint payload (object or array); null on error. |
| `error_details` | object |  | Error specifics (e.g. field → message on validation failures); null on success. |

### RetireRequest
<a id="schema-retirerequest"></a>

Retire a suspended payer with a mandatory free-text reason.

| Field | Type | Req | Description |
|---|---|---|---|
| `reason` | string | ✓ | Mandatory reason for retiring the payer (free text). _(e.g. `Contract terminated; data export complete.`)_ |

### RoleResponse
<a id="schema-roleresponse"></a>

A role with its assigned permissions, colour and region scopes.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in FKs). _(e.g. `2`)_ |
| `role_id` | string |  | Human-readable business code. _(e.g. `ROL000002`)_ |
| `name` | string |  | Role name; normalised to UPPER_SNAKE and used as the JWT role authority. _(e.g. `FINANCE_OPERATOR`)_ |
| `role_name` | string |  | Alias of the role name (display convenience). _(e.g. `FINANCE_OPERATOR`)_ |
| `description` | string |  | Longer description of the role. _(e.g. `Finance + claims`)_ |
| `type` | string enum: `SYSTEM`, `CUSTOM` |  | Whether the role is SYSTEM (immutable) or CUSTOM (admin-authored). _(e.g. `CUSTOM`)_ |
| `status` | string enum: `ACTIVE`, `INACTIVE` |  | Lifecycle status of the role. _(e.g. `ACTIVE`)_ |
| `hex_color` | string |  | Accent colour for the role badge, as a hex string. _(e.g. `#6741D9`)_ |
| `permissions` | array&lt;[`PermissionResponse`](#schema-permissionresponse)&gt; |  | Permissions (grouped capabilities) assigned to this role. |
| `region_scopes` | array&lt;string&gt; |  | Region scopes restricting the role; empty = no region restriction. |
| `created_at` | string (date-time) |  | Creation timestamp (UTC, ISO-8601). _(e.g. `2026-06-17T04:06:37Z`)_ |

### RoleSummary
<a id="schema-rolesummary"></a>

Lightweight role reference embedded in a member view.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric role id. _(e.g. `2`)_ |
| `name` | string |  | Role name. _(e.g. `FINANCE_OPERATOR`)_ |

### SaveConfigSectionRequest
<a id="schema-saveconfigsectionrequest"></a>

Persist a config section's settings. Saving resets the section's review_status to PENDING.

| Field | Type | Req | Description |
|---|---|---|---|
| `config` | object |  | Section-specific key/value settings (e.g. provider, host, from-address). |
| `status` | string enum: `NOT_STARTED`, `CONFIGURED`, `TESTED`, `DONE` |  | Optional completion status. Defaults to CONFIGURED when config is provided. One of NOT_STARTED, CONFIGURED, TESTED, DONE. _(e.g. `CONFIGURED`)_ |

### SaveRulesRequest
<a id="schema-saverulesrequest"></a>

Replace the draft ruleset's grouped rules.

| Field | Type | Req | Description |
|---|---|---|---|
| `rules` | array&lt;object&gt; | ✓ | Grouped rules: [{ group, icon, rules:[{id, field, applies, pattern, example, error, normalize[], required, status, variants[] }] }]. |
| `note` | string |  | Optional change note for this draft. |

### SessionResponse
<a id="schema-sessionresponse"></a>

A maintained login session backing an issued JWT.

| Field | Type | Req | Description |
|---|---|---|---|
| `session_id` | string |  | Session id (the token's sid claim). _(e.g. `8f3c1d2e-...`)_ |
| `user_session_id` | string |  | Human-readable session code. _(e.g. `SES000001`)_ |
| `member_id` | integer (int64) |  | Numeric id of the member who owns the session. _(e.g. `1`)_ |
| `status` | string enum: `ACTIVE`, `REVOKED`, `EXPIRED` |  | Current lifecycle status of the session. _(e.g. `ACTIVE`)_ |
| `issued_at` | string (date-time) |  | When the session was issued. _(e.g. `2026-06-17T04:00:00Z`)_ |
| `expires_at` | string (date-time) |  | When the session expires. _(e.g. `2026-06-17T12:00:00Z`)_ |
| `last_seen_at` | string (date-time) |  | When the session was last seen active. _(e.g. `2026-06-17T04:30:00Z`)_ |

### SetEntitlementsRequest
<a id="schema-setentitlementsrequest"></a>

§8.3 — replaces the payer's full entitlement set. Each item is a module with optional sub-modules; module dependencies are auto-resolved (e.g. ADVANCED_REPORTING implies REPORTING).

| Field | Type | Req | Description |
|---|---|---|---|
| `entitlements` | array&lt;[`ModuleEntitlement`](#schema-moduleentitlement)&gt; | ✓ | The full set of module entitlements to apply (replaces any existing set). |

### SetMemberStatusRequest
<a id="schema-setmemberstatusrequest"></a>

Payload to change a member's lifecycle status.

| Field | Type | Req | Description |
|---|---|---|---|
| `status` | string enum: `INVITED`, `ACTIVE`, `SUSPENDED`, `DISABLED` | ✓ | Target status (INVITED\|ACTIVE\|SUSPENDED\|DISABLED). _(e.g. `SUSPENDED`)_ |
| `reason` | string |  | Reason for the change; mandatory when suspending. Recorded in the audit trail. _(e.g. `Policy violation`)_ |

### SetPasswordRequest
<a id="schema-setpasswordrequest"></a>

Payload to set or reset a member's password.

| Field | Type | Req | Description |
|---|---|---|---|
| `password` | string | ✓ | New password (8-100 chars). Activates an INVITED member. _(e.g. `NewPass@123`)_ |

### SetRegionScopesRequest
<a id="schema-setregionscopesrequest"></a>

Payload to replace a role's region scopes (empty/omitted = no region restriction).

| Field | Type | Req | Description |
|---|---|---|---|
| `regions` | array&lt;string&gt; |  | Region codes to scope the role to (de-duplicated; replaces the existing set). |

### SetStageRequest
<a id="schema-setstagerequest"></a>

Manually set a tenant's provisioning stage (commonly BLOCKED).

| Field | Type | Req | Description |
|---|---|---|---|
| `stage` | string enum: `AWAITING_START`, `IN_PROGRESS`, `BLOCKED`, `READY_TO_ACTIVATE` | ✓ | Target provisioning stage. One of AWAITING_START, IN_PROGRESS, BLOCKED, READY_TO_ACTIVATE. _(e.g. `BLOCKED`)_ |

### SetSubscriptionRequest
<a id="schema-setsubscriptionrequest"></a>

§8.4 — attach a subscription: pick an ACTIVE pricing structure, a model and a frequency, plus optional contract overrides. Requires entitlements to be set first; PER_CLAIM requires the CLAIMS module enabled. The chosen structure's price is frozen as an immutable snapshot.

| Field | Type | Req | Description |
|---|---|---|---|
| `pricing_structure_id` | integer (int64) | ✓ | Id of an ACTIVE pricing structure to select and freeze. _(e.g. `1`)_ |
| `subscription_model` | string enum: `PMPM`, `PER_CLAIM`, `PCT_GWP`, `FLAT`, `HYBRID` | ✓ | Subscription pricing model. _(e.g. `PER_CLAIM`)_ |
| `billing_frequency` | string enum: `MONTHLY`, `QUARTERLY`, `ANNUALLY` | ✓ | Billing cadence. _(e.g. `MONTHLY`)_ |
| `discount_pct` | number |  | Optional contract discount percentage. _(e.g. `10.0`)_ |
| `free_trial_days` | integer (int32) |  | Optional free-trial length in days. _(e.g. `30`)_ |
| `promotional` | boolean |  | Whether this is a promotional subscription. _(e.g. `False`)_ |
| `contract_start` | string (date) |  | Optional contract start date. _(e.g. `2026-01-01`)_ |
| `contract_end` | string (date) |  | Optional contract end date. _(e.g. `2026-12-31`)_ |

### SmsEnrollRequest
<a id="schema-smsenrollrequest"></a>

Phone number to enrol for SMS one-time passcodes.

| Field | Type | Req | Description |
|---|---|---|---|
| `phone` | string | ✓ | Phone number in E.164 form. _(e.g. `+254712345678`)_ |

### SmsVerifyRequest
<a id="schema-smsverifyrequest"></a>

The one-time code texted during SMS enrolment.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | The 6-digit code from the SMS. _(e.g. `123456`)_ |

### SubModuleRequest
<a id="schema-submodulerequest"></a>

A sub-module definition nested inside a module registration or update.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | Sub-module code, unique within the parent module. _(e.g. `CLAIMS_SUBMISSION`)_ |
| `name` | string | ✓ | Human-readable display name. _(e.g. `Claims Submission`)_ |
| `description` | string |  | Optional description of what this sub-module does. _(e.g. `Handles batch and real-time claim submission workflows.`)_ |
| `requires` | string |  | Code of another sub-module this one depends on (optional). _(e.g. `CLAIMS_AUTH`)_ |

### SubModuleResponse
<a id="schema-submoduleresponse"></a>

A sub-module within a module catalogue entry.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key. _(e.g. `1`)_ |
| `sub_module_id` | string |  | Business identifier. _(e.g. `SMD000001`)_ |
| `code` | string |  | Sub-module code, unique within the parent module. _(e.g. `CLAIMS_SUBMISSION`)_ |
| `name` | string |  | Display name. _(e.g. `Claims Submission`)_ |
| `description` | string |  | Description. _(e.g. `Handles batch and real-time claim submission workflows.`)_ |
| `requires` | string |  | Code of another sub-module this one depends on. _(e.g. `CLAIMS_AUTH`)_ |

### SubdomainCheckResponse
<a id="schema-subdomaincheckresponse"></a>

Result of the Step-1 subdomain check: the sanitised value plus reserved/valid/available flags and alternative suggestions when the value is reserved or already taken.

| Field | Type | Req | Description |
|---|---|---|---|
| `input` | string |  | The raw value supplied by the caller. _(e.g. `Acme Health`)_ |
| `sanitised` | string |  | The sanitised, normalised subdomain. _(e.g. `acme-health`)_ |
| `reserved` | boolean |  | True if the sanitised value is on the reserved list. _(e.g. `False`)_ |
| `valid` | boolean |  | True if the sanitised value passes format validation. _(e.g. `True`)_ |
| `available` | boolean |  | True if the subdomain is free to use. _(e.g. `True`)_ |
| `suggestions` | array&lt;string&gt; |  | Alternative suggestions when reserved/taken; empty otherwise. |

### SubscriptionResponse
<a id="schema-subscriptionresponse"></a>

The payer's subscription (§8.4). Holds the chosen model/frequency plus a frozen, immutable snapshot of the selected pricing structure's price at the time of selection.

| Field | Type | Req | Description |
|---|---|---|---|
| `subscription_id` | string |  | Business id of the subscription. _(e.g. `SUB000001`)_ |
| `pricing_structure_id` | integer (int64) |  | Id of the ACTIVE pricing structure that was selected and frozen. _(e.g. `1`)_ |
| `subscription_model` | string enum: `PMPM`, `PER_CLAIM`, `PCT_GWP`, `FLAT`, `HYBRID` |  | Subscription pricing model. _(e.g. `PER_CLAIM`)_ |
| `billing_frequency` | string enum: `MONTHLY`, `QUARTERLY`, `ANNUALLY` |  | Billing cadence. _(e.g. `MONTHLY`)_ |
| `discount_pct` | number |  | Optional contract discount percentage. _(e.g. `10.0`)_ |
| `free_trial_days` | integer (int32) |  | Optional free-trial length in days. _(e.g. `30`)_ |
| `promotional` | boolean |  | Whether this is a promotional subscription. _(e.g. `False`)_ |
| `contract_start` | string (date) |  | Contract start date. _(e.g. `2026-01-01`)_ |
| `contract_end` | string (date) |  | Contract end date. _(e.g. `2026-12-31`)_ |
| `pricing_snapshot` | object |  | Immutable snapshot of the pricing structure's price at selection time. |

### SuspendRequest
<a id="schema-suspendrequest"></a>

Request to suspend a payer with a reason category.

| Field | Type | Req | Description |
|---|---|---|---|
| `reason` | string enum: `NON_PAYMENT`, `COMPLIANCE`, `SECURITY`, `OTHER` | ✓ | Reason category for the suspension. One of NON_PAYMENT, COMPLIANCE, SECURITY, OTHER. _(e.g. `NON_PAYMENT`)_ |
| `note` | string |  | Optional note for the checker / audit trail. _(e.g. `Two invoices overdue >60 days.`)_ |

### TenantDetailsRequest
<a id="schema-tenantdetailsrequest"></a>

Step-1 (Basic profile) details for a tenant; used both as create_payer.primary_tenant and as the body of add-secondary-tenant. subdomain and data_residency_region are optional here (the wizard sets the subdomain in Step-3 technical config; submit requires it). Optionally supply up to two nested contacts (one flagged receives_invite) and nested bank details; if contacts are omitted the primary_contact_* and tenant_admin_* fields seed them.

| Field | Type | Req | Description |
|---|---|---|---|
| `legal_entity_name` | string | ✓ | Registered legal entity name. Unique with country. _(e.g. `Globex Insurance Ltd`)_ |
| `trading_name` | string |  | Trading / brand name. _(e.g. `Globex`)_ |
| `primary_contact_name` | string | ✓ | Primary contact name. _(e.g. `Gil`)_ |
| `primary_contact_email` | string (email) | ✓ | Primary contact email. _(e.g. `gil@globex.io`)_ |
| `country` | string | ✓ | ISO-3166 alpha-2 country code. _(e.g. `ZA`)_ |
| `data_residency_region` | string |  | Data-residency region (optional here; may be set later). _(e.g. `af-south-1`)_ |
| `subdomain` | string |  | Routing subdomain (optional here; the wizard sets it in Step-3 technical config). _(e.g. `globex-za`)_ |
| `tenant_admin_name` | string | ✓ | Tenant admin name (receives the activation invite). _(e.g. `Gil Admin`)_ |
| `tenant_admin_email` | string (email) | ✓ | Tenant admin email. _(e.g. `admin@globex.io`)_ |
| `tax_vat_number` | string |  | Tax / VAT number. _(e.g. `VAT9`)_ |
| `phone` | string |  | Contact phone. _(e.g. `+27115550000`)_ |
| `address` | string |  | Postal address. _(e.g. `1 Market St, Cape Town`)_ |
| `website` | string |  | Website URL. _(e.g. `https://globex.io`)_ |
| `contacts` | array&lt;[`ContactRequest`](#schema-contactrequest)&gt; |  | Up to two contact cards; one may be flagged receives_invite. If omitted, the primary_contact_* and tenant_admin_* fields seed the contacts. |
| `operating_regions` | array&lt;string&gt; |  | Operating regions for this tenant. |
| `bank` | [`BankDetailsRequest`](#schema-bankdetailsrequest) |  |  |

### TenantLoginRequest
<a id="schema-tenantloginrequest"></a>

Subdomain + credentials for a tenant-scoped login.

| Field | Type | Req | Description |
|---|---|---|---|
| `subdomain` | string | ✓ | The tenant's subdomain (resolves the tenant schema); must be an ACTIVE tenant. _(e.g. `globex-za`)_ |
| `email` | string (email) | ✓ | User's email address within the tenant. _(e.g. `admin@globex.io`)_ |
| `password` | string | ✓ | User's password (set on first login). _(e.g. `TenantPass@123`)_ |

### TenantLookupResponse
<a id="schema-tenantlookupresponse"></a>

Result of the Step-1 duplicate lookup. When found is false the caller may proceed to create; otherwise tenant holds the existing record and matchedBy lists which field(s) matched.

| Field | Type | Req | Description |
|---|---|---|---|
| `found` | boolean |  | True if an existing tenant matched. _(e.g. `True`)_ |
| `matched_by` | array&lt;string&gt; |  | Which field(s) matched (legal_entity_name and/or tax_vat_number). |
| `tenant` | [`TenantMatch`](#schema-tenantmatch) |  |  |

### TenantMatch
<a id="schema-tenantmatch"></a>

Lightweight view of the matched tenant plus its owning payer.

| Field | Type | Req | Description |
|---|---|---|---|
| `tenant_id` | integer (int64) |  | Numeric tenant id. _(e.g. `4`)_ |
| `tenant_code` | string |  | Tenant code. _(e.g. `TNT000004`)_ |
| `legal_entity_name` | string |  | Registered legal entity name. _(e.g. `Zenith Assurance PLC`)_ |
| `trading_name` | string |  | Trading name. _(e.g. `Zenith`)_ |
| `country` | string |  | ISO-3166 alpha-2 country code. _(e.g. `NG`)_ |
| `tax_vat_number` | string |  | Tax / VAT number. _(e.g. `VAT-ZEN-001`)_ |
| `subdomain` | string |  | Routing subdomain; null if not yet set. _(e.g. `null`)_ |
| `status` | string enum: `DRAFT`, `PENDING_ACTIVATION`, `ACTIVE`, `SUSPENDED`, `RETIRED` |  | Tenant lifecycle status. _(e.g. `DRAFT`)_ |
| `payer_id` | integer (int64) |  | Numeric payer id. _(e.g. `3`)_ |
| `payer_code` | string |  | Payer code. _(e.g. `PAY000003`)_ |
| `payer_status` | string enum: `DRAFT`, `ACTIVE`, `SUSPENDED`, `RETIRED` |  | Payer lifecycle status. _(e.g. `DRAFT`)_ |

### TenantResponse
<a id="schema-tenantresponse"></a>

A tenant belonging to a payer (the primary or a secondary). Carries Step-1 profile fields, the Step-3 technical/infrastructure config, its contact cards and its document checklist.

| Field | Type | Req | Description |
|---|---|---|---|
| `id` | integer (int64) |  | Numeric primary key (used in tenant path params). _(e.g. `1`)_ |
| `tenant_code` | string |  | Human-readable tenant code. _(e.g. `TNT000001`)_ |
| `primary` | boolean |  | True for the payer's primary tenant. _(e.g. `True`)_ |
| `status` | string enum: `DRAFT`, `PENDING_ACTIVATION`, `ACTIVE`, `SUSPENDED`, `RETIRED` |  | Tenant lifecycle status. _(e.g. `DRAFT`)_ |
| `subdomain` | string |  | Routing subdomain; null until set in Step-3 technical config (§8.7). _(e.g. `globex-za`)_ |
| `schema_name` | string |  | Provisioned DB schema name; null until activation. _(e.g. `null`)_ |
| `data_residency_region` | string |  | Data-residency region. _(e.g. `af-south-1`)_ |
| `legal_entity_name` | string |  | Registered legal entity name. _(e.g. `Globex Insurance Ltd`)_ |
| `trading_name` | string |  | Trading / brand name. _(e.g. `Globex`)_ |
| `country` | string |  | ISO-3166 alpha-2 country code. _(e.g. `ZA`)_ |
| `primary_contact_name` | string |  | Primary contact name. _(e.g. `Gil`)_ |
| `primary_contact_email` | string |  | Primary contact email. _(e.g. `gil@globex.io`)_ |
| `tenant_admin_name` | string |  | Tenant admin name (receives the activation invite). _(e.g. `Gil Admin`)_ |
| `tenant_admin_email` | string |  | Tenant admin email. _(e.g. `admin@globex.io`)_ |
| `tax_vat_number` | string |  | Tax / VAT number. _(e.g. `VAT-ZEN-001`)_ |
| `phone` | string |  | Phone number. _(e.g. `+254712345678`)_ |
| `address` | string |  | Postal/physical address. _(e.g. `CIC Plaza, Upper Hill, Nairobi`)_ |
| `website` | string |  | Website URL. _(e.g. `www.globex.io`)_ |
| `custom_domain` | string |  | Optional custom domain (Step-3 technical config). _(e.g. `acme.health`)_ |
| `isolation_tier` | string |  | Tenant isolation tier (Step-3). _(e.g. `SCHEMA`)_ |
| `deployment_cluster` | string |  | Deployment cluster (Step-3). _(e.g. `af-1`)_ |
| `region_id` | string |  | Region id (Step-3). _(e.g. `af-west-1`)_ |
| `owner_team` | string |  | Owning team (Step-3). _(e.g. `Platform`)_ |
| `priority` | string |  | Provisioning priority (Step-3). _(e.g. `HIGH`)_ |
| `environment` | string |  | Target environment (Step-3). _(e.g. `PRODUCTION`)_ |
| `operating_regions` | array&lt;string&gt; |  | Operating regions for this tenant. |
| `contacts` | array&lt;[`ContactResponse`](#schema-contactresponse)&gt; |  | Tenant contact cards. |
| `documents` | array&lt;[`DocumentResponse`](#schema-documentresponse)&gt; |  | KYB / contract documents attached to this tenant (§8.5). |

### TestRuleRequest
<a id="schema-testrulerequest"></a>

Test a sample value against a rule's regex (+ normalize steps).

| Field | Type | Req | Description |
|---|---|---|---|
| `pattern` | string | ✓ | Java regular expression to match. _(e.g. `^\d{8}$`)_ |
| `value` | string | ✓ | Sample value to test. _(e.g. `23456789`)_ |
| `normalize` | array&lt;string&gt; |  | Normalize steps to apply first (e.g. Trim spaces, Uppercase, Lowercase, Remove spaces). |

### TokenResponse
<a id="schema-tokenresponse"></a>

Un-enveloped dev token payload (not wrapped in the standard Response).

| Field | Type | Req | Description |
|---|---|---|---|
| `access_token` | string |  | The minted HS256 JWT to send as a bearer token. _(e.g. `eyJhbGciOiJIUzI1NiJ9...`)_ |
| `tenant_id` | string |  | Tenant id claim for tenant-scoped tokens; null for platform tokens. _(e.g. `null`)_ |
| `roles` | array&lt;string&gt; |  | Roles encoded into the token. |

### TotpVerifyRequest
<a id="schema-totpverifyrequest"></a>

The 6-digit TOTP code to confirm enrolment.

| Field | Type | Req | Description |
|---|---|---|---|
| `code` | string | ✓ | The 6-digit code from the authenticator app. _(e.g. `123456`)_ |

### UpdateLocalizationRequest
<a id="schema-updatelocalizationrequest"></a>

Partial update for platform localization settings.

| Field | Type | Req | Description |
|---|---|---|---|
| `timezone` | string |  |  |
| `week_start` | string |  |  |
| `date_format` | string |  |  |
| `time_format` | string |  |  |
| `decimal_sep` | string |  |  |
| `thousands_sep` | string |  |  |
| `currency` | string |  |  |
| `currency_symbol` | string |  |  |
| `currency_decimals` | integer (int32) |  |  |
| `default_language` | string |  |  |

### UpdateModuleRequest
<a id="schema-updatemodulerequest"></a>

PATCH payload to update a module; all fields are optional — only non-null values are applied.

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New display name. _(e.g. `Claims Management`)_ |
| `description` | string |  | New description. _(e.g. `End-to-end claims management and processing.`)_ |
| `icon` | string |  | Icon identifier or URL. _(e.g. `icon-claims-v2`)_ |
| `url` | string |  | Documentation URL. _(e.g. `https://docs.ginja.ai/claims/v2`)_ |
| `version` | string |  | Semantic version. _(e.g. `1.1.0`)_ |
| `owner_team` | string |  | Responsible team. _(e.g. `Claims Engineering`)_ |
| `status` | string enum: `DRAFT`, `PUBLISHED`, `BETA`, `SUNSET` |  | New lifecycle status; PUBLISHED publishes, anything else from PUBLISHED unpublishes. _(e.g. `PUBLISHED`)_ |
| `sub_modules` | array&lt;[`SubModuleRequest`](#schema-submodulerequest)&gt; |  | Replaces the full sub-module set when non-null (existing sub-modules are deleted first). |
| `note` | string |  | Change note recorded on the new version this update creates. _(e.g. `Added Appeals & disputes sub-module.`)_ |

### UpdateNotificationTemplateRequest
<a id="schema-updatenotificationtemplaterequest"></a>

Partial update of a notification template; only non-null fields are applied.

| Field | Type | Req | Description |
|---|---|---|---|
| `template_id` | integer (int64) |  | New template id in the notification service. _(e.g. `42`)_ |
| `template_code` | string |  | New template code in the notification service. _(e.g. `member_invite_v2`)_ |
| `active` | boolean |  | Enable/disable sending this notification type. _(e.g. `True`)_ |

### UpdatePricingStructureRequest
<a id="schema-updatepricingstructurerequest"></a>

Partial (PATCH) update of a DRAFT pricing structure. Only non-null fields are applied; if components[] is provided the entire component/tier set is replaced, if omitted it is left unchanged.

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New display name. _(e.g. `Enterprise PMPM 2026 v2`)_ |
| `description` | string |  | New description. _(e.g. `custom`)_ |
| `currency` | string |  | ISO-4217 3-letter currency code. _(e.g. `USD`)_ |
| `implementation_fee` | number |  | One-time implementation fee. _(e.g. `250000`)_ |
| `platform_fee_annual` | number |  | Annual platform fee. _(e.g. `0`)_ |
| `savings_capture_pct` | number |  | Savings-capture percentage. _(e.g. `15.0`)_ |
| `components` | array&lt;[`PricingComponentRequest`](#schema-pricingcomponentrequest)&gt; |  | If provided, fully replaces the structure's components[] (each with its tiers[]); if omitted, the existing set is left unchanged. |

### UpdateProvisioningTierRequest
<a id="schema-updateprovisioningtierrequest"></a>

Partial update for a provisioning tier. Omit any field you do not want to change.

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | Updated display name. _(e.g. `Isolated by default`)_ |
| `description` | string |  | Updated description. _(e.g. `Every tenant is provisioned in its own isolated Postgres schema.`)_ |
| `enabled` | boolean |  | Whether this tier is enabled. _(e.g. `True`)_ |
| `sort_order` | integer (int32) |  | Display sort order. _(e.g. `1`)_ |

### UpdateRegionRequest
<a id="schema-updateregionrequest"></a>

Partial update for a data-residency region. Omit any field you do not want to change.

| Field | Type | Req | Description |
|---|---|---|---|
| `city` | string |  | Updated city name. _(e.g. `Nairobi`)_ |
| `country` | string |  | Updated country name. _(e.g. `Kenya`)_ |
| `status` | string enum: `ACTIVE`, `PROVISIONING`, `RETIRED` |  | New lifecycle status. _(e.g. `ACTIVE`)_ |

### UpdateRoleRequest
<a id="schema-updaterolerequest"></a>

Partial update of a CUSTOM role; only non-null fields apply.

| Field | Type | Req | Description |
|---|---|---|---|
| `name` | string |  | New role name; normalised to UPPER_SNAKE. Null to leave unchanged. _(e.g. `Claims Reviewer`)_ |
| `description` | string |  | New description. Null to leave unchanged. _(e.g. `Reviews submitted claims`)_ |
| `hex_color` | string |  | New accent colour (hex). Null to leave unchanged. _(e.g. `#E03131`)_ |
| `permission_codes` | array&lt;string&gt; |  | Replacement permission set (codes). When provided, replaces the role's whole permission set; null leaves it unchanged. |

### UpdateSecurityPolicyLockout
<a id="schema-updatesecuritypolicylockout"></a>

| Field | Type | Req | Description |
|---|---|---|---|
| `lockout_max_attempts` | integer (int32) |  | Max failed login attempts before lockout (1–20). _(e.g. `5`)_ |
| `lockout_duration_minutes` | integer (int32) |  | Minutes an account stays locked. _(e.g. `30`)_ |

### UpdateSecurityPolicyMfa
<a id="schema-updatesecuritypolicymfa"></a>

| Field | Type | Req | Description |
|---|---|---|---|
| `mfa_required` | boolean |  | Require MFA for all members. _(e.g. `True`)_ |
| `mfa_totp_enabled` | boolean |  | Allow TOTP-based MFA. _(e.g. `True`)_ |
| `mfa_sms_enabled` | boolean |  | Allow SMS-based MFA. _(e.g. `False`)_ |
| `mfa_webauthn_enabled` | boolean |  | Allow WebAuthn-based MFA. _(e.g. `False`)_ |

### UpdateSecurityPolicyPassword
<a id="schema-updatesecuritypolicypassword"></a>

| Field | Type | Req | Description |
|---|---|---|---|
| `password_min_length` | integer (int32) |  | Minimum password length (6–128). _(e.g. `12`)_ |
| `password_require_upper` | boolean |  | Require an uppercase letter. _(e.g. `True`)_ |
| `password_require_lower` | boolean |  | Require a lowercase letter. _(e.g. `True`)_ |
| `password_require_number` | boolean |  | Require a digit. _(e.g. `True`)_ |
| `password_require_special` | boolean |  | Require a special character. _(e.g. `True`)_ |
| `password_expiry_days` | integer (int32) |  | Days before a password must change (0 = no expiry). _(e.g. `90`)_ |
| `password_history_count` | integer (int32) |  | Previous passwords that cannot be reused (0 = no restriction). _(e.g. `5`)_ |

### UpdateSecurityPolicyRequest
<a id="schema-updatesecuritypolicyrequest"></a>

Partial update for the platform security policy, grouped by section. Omit any section or field you do not want to change.

| Field | Type | Req | Description |
|---|---|---|---|
| `Multi-factor authentication` | [`UpdateSecurityPolicyMfa`](#schema-updatesecuritypolicymfa) |  |  |
| `Password policy` | [`UpdateSecurityPolicyPassword`](#schema-updatesecuritypolicypassword) |  |  |
| `Lockout` | [`UpdateSecurityPolicyLockout`](#schema-updatesecuritypolicylockout) |  |  |
| `Sessions` | [`UpdateSecurityPolicySessions`](#schema-updatesecuritypolicysessions) |  |  |

### UpdateSecurityPolicySessions
<a id="schema-updatesecuritypolicysessions"></a>

| Field | Type | Req | Description |
|---|---|---|---|
| `session_timeout_minutes` | integer (int32) |  | Absolute session lifetime in minutes. _(e.g. `480`)_ |
| `idle_timeout_minutes` | integer (int32) |  | Inactivity (idle) timeout in minutes. _(e.g. `30`)_ |
| `max_concurrent_sessions` | integer (int32) |  | Max simultaneous active sessions per user (0 = unlimited). _(e.g. `3`)_ |

### UpdateTenantRequest
<a id="schema-updatetenantrequest"></a>

Partial update for a tenant on a DRAFT payer. Omit any field you do not want to change.

| Field | Type | Req | Description |
|---|---|---|---|
| `legal_entity_name` | string |  | Registered legal entity name (unique with country). |
| `trading_name` | string |  | Trading / brand name. |
| `country` | string |  | ISO-3166 alpha-2 country code. |
| `tax_vat_number` | string |  | Tax / VAT number. |
| `subdomain` | string |  | Routing subdomain (validated + unique). |
| `data_residency_region` | string |  | Data-residency region. |
| `primary_contact_name` | string |  | Primary contact name. |
| `primary_contact_email` | string (email) |  | Primary contact email. |
| `tenant_admin_name` | string |  | Tenant admin name. |
| `tenant_admin_email` | string (email) |  | Tenant admin email. |
| `phone` | string |  | Contact phone. |
| `address` | string |  | Postal address. |
| `website` | string |  | Website URL. |
| `contacts` | array&lt;[`ContactRequest`](#schema-contactrequest)&gt; |  | Replacement contact cards (max 2). When provided, replaces the tenant's contacts. |
| `operating_regions` | array&lt;string&gt; |  | Operating regions for this tenant. |
| `bank` | [`BankDetailsRequest`](#schema-bankdetailsrequest) |  |  |

### WebAuthnLoginFinishRequest
<a id="schema-webauthnloginfinishrequest"></a>

MFA challenge token + the browser's WebAuthn assertion.

| Field | Type | Req | Description |
|---|---|---|---|
| `challenge_token` | string | ✓ | The challenge_token from /auth/login (the WEBAUTHN_LOGIN challenge). |
| `response_json` | string | ✓ | The PublicKeyCredential JSON returned by navigator.credentials.get() (stringified). |

### WebAuthnRegisterFinishRequest
<a id="schema-webauthnregisterfinishrequest"></a>

The navigator.credentials.create() result + optional label.

| Field | Type | Req | Description |
|---|---|---|---|
| `response_json` | string | ✓ | The PublicKeyCredential JSON returned by the browser (stringified). |
| `label` | string |  | Optional friendly label for the security key. _(e.g. `YubiKey 5C`)_ |

