# Tenant & Org Control Plane — Technical Design Document

|               |                                                                                                                                     |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Service**   | `ginja-user-services` (`ai.ginja:ginja-user-services`)                                                                              |
| **Component** | Tenant & Org Control Plane — Payer Account                                                                                          |
| **Scope**     | Milestone 1 — onboarding → activation (PRD §5.1–5.8) + configurable pricing                                                         |
| **Status**    | Implemented (backend only)                                                                                                          |
| **Related**   | [`CONTROL_PLANE_API.md`](./CONTROL_PLANE_API.md) (endpoint reference), PRD _Tenant and Org Control Plane v1.1_, _Pricing Structure_ |

> This document describes the architecture and design of the control plane. For the request/response
> contract of each endpoint, see the companion **API reference**.

---

## 1. Purpose & context

The control plane owns **tenant identity, lifecycle, entitlements, commercial terms, and isolation**
— "the first service any other service calls, and the last to be bypassed." It is the authority that
downstream modules (Claims, Finance, Service-Provider/Employer/Member portals) rely on for tenant
context.

Milestone 1 delivers the **Payer onboarding-to-activation spine** for the **Insurer** payer type:
capture a Payer + its tenants, assign module entitlements, bind a pricing subscription, collect KYB
documents, submit, get a second-person approval, and **auto-provision** isolated tenant
environments. External systems (IAM, Notification, Document store, Billing, Module Registry, message
broker) are integrated through **ports with local stub adapters**, so the flow runs end-to-end now
and real adapters slot in later without touching domain logic.

---

## 2. Technology stack

| Concern             | Choice                                                                       |
| :------------------ | :--------------------------------------------------------------------------- |
| Language / platform | Java 25, Spring Boot 4.0.6                                                   |
| Web                 | Spring MVC (`spring-boot-starter-webmvc`)                                    |
| Persistence         | Spring Data JPA / Hibernate ORM, PostgreSQL                                  |
| Migrations          | Flyway (`spring-boot-flyway` + `flyway-core` + `flyway-database-postgresql`) |
| Security            | Spring Security OAuth2 Resource Server (JWT)                                 |
| Boilerplate         | Lombok (entities)                                                            |
| API docs            | springdoc-openapi (Swagger UI)                                               |
| Server              | port `8082`, context path `/api/v1`                                          |

---

## 3. Architecture overview

### 3.1 Layering (feature / vertical-slice)

Code is organised by **feature slice** with shared cross-cutting packages:

```
ai.ginja.user
├── feature
│   ├── tenant                  Payer/tenant control plane (onboarding, approval, activation)
│   │   ├── controller          REST controllers (+ request/, response/ DTOs)
│   │   ├── service             OnboardingService, ApprovalService, ActivationService,
│   │   │                       PayerLifecycle, PayerQueryService, SubdomainPolicy
│   │   ├── repository          Spring Data repositories
│   │   ├── mapper              entity → DTO mapping (PayerMapper)
│   │   └── modal               JPA entities + enums
│   └── pricing                 Configurable pricing catalogue (same sub-layer layout)
├── common                      cross-cutting, used module-wide
│   ├── audit                   AuditLog, AuditRecorder
│   ├── outbox                  OutboxEvent, DomainEvents, OutboxPublisher
│   └── port (+ port.stub)      integration interfaces + dev stub adapters
├── infrastructure              Response (uniform API envelope)
├── exception                   typed exceptions + GlobalExceptionHandler
├── config                      SecurityConfig, DevJwtConfig
├── multitenancy                Hibernate schema-per-tenant plumbing
├── dev                         DevTokenController (dev-profile token minting)
├── user                        sample tenant-scoped entity (AppUser)
└── utility                     shared helpers (CurrentUser)
```

**Dependency direction:** `feature.tenant` → `feature.pricing` (subscription references pricing) →
`common`/`exception`/`utility`/`infrastructure`. Features never depend on each other's controllers.

### 3.2 Request pipeline

```
HTTP → Spring Security filter chain
        ├─ BearerTokenAuthenticationFilter   (validate JWT, map roles→authorities)
        └─ TenantFilter                      (resolve tenant schema from JWT, unless /platform)
     → @RestController (@PreAuthorize role check)
     → @Transactional service (domain logic, audit, outbox enqueue)
     → repository / ports
     → Response envelope (or GlobalExceptionHandler on error)
```

---

## 4. Multi-tenancy & data isolation

Two logical data planes share one PostgreSQL database:

- **Control-plane data** (Payers, tenants registry, entitlements, subscriptions, documents, reviews,
  pricing, audit, outbox) lives in the **`public`** schema. It is **not** tenant-scoped.
- **Tenant business data** lives in a dedicated **`tenant_<subdomain>`** schema per tenant,
  provisioned at activation.

**Mechanism (Hibernate `SCHEMA` multi-tenancy):**

- `SchemaMultiTenantConnectionProvider` issues `connection.setSchema(...)` per request.
- `CurrentTenantIdentifierResolverImpl` resolves the active schema from a `ThreadLocal`
  (`TenantContext`), defaulting to `public` when none is set.
- `TenantFilter` (runs after JWT auth) reads the `tenant_id` claim and sets the schema —
  **except for `/platform/**`paths**, which always run in`public` (control-plane operations),
  even if a token carries a tenant claim.
- `TenantSchemaProvisioningService` creates the schema (`create schema if not exists`) and runs the
  **tenant** Flyway migrations (`db/migration/tenant`) against it — idempotently.

**Isolation tier** is modelled (`Tenant.isolationTier`) with `SCHEMA` as the only v1 value, leaving
room for namespace/database tiers later.

---

## 5. Domain & data model

All control-plane tables are created by **master** Flyway migrations (`db/migration/master`, V1–V9)
in `public`.

### 5.1 Entities

| Table               | Purpose                                         | Key fields                                                                                                                                               |
| :------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payer_account`     | Commercial root of a Payer customer             | `status`, `payer_type`, `primary_tenant_id`, `submitted_by/at`, `activated_at`, `version`                                                                |
| `tenant`            | A tenant (primary or secondary) under a Payer   | `payer_account_id`, `parent_tenant_id`, `is_primary`, `status`, `subdomain` (unique), `schema_name`, `data_residency_region`, tenant-admin + bank fields |
| `payer_entitlement` | Module/sub-module grants (apply to all tenants) | `payer_account_id`, `module_code`, `submodule_code`, `enabled`                                                                                           |
| `subscription`      | Commercial terms (primary tenant)               | `payer_account_id` (unique), `pricing_structure_id`, `pricing_snapshot` (jsonb), `billing_frequency`                                                     |
| `tenant_document`   | KYB / contract metadata per tenant              | `tenant_id`, `category`, `storage_ref`, `status`, `expiry_date`                                                                                          |
| `payer_review`      | Per-tenant approval decision (§5.7)             | `payer_account_id`, `tenant_id`, `decision`, `approver_id`                                                                                               |
| `pricing_structure` | Configurable pricing catalogue                  | `name` (unique), `model`, `status`, fees, `savings_capture_pct`                                                                                          |
| `pricing_component` | A priced line in a structure                    | `pricing_structure_id`, `component_type`, `unit`, `sort_order`                                                                                           |
| `pricing_tier`      | Volume-discount tier of a component             | `pricing_component_id`, `tier_number`, `volume_threshold_min`, `rate`, `discount_pct`                                                                    |
| `audit_log`         | Append-only audit trail                         | `actor`, `action`, `entity_type/id`, `before/after` (jsonb), `reason`                                                                                    |
| `outbox_event`      | Transactional outbox                            | `aggregate_type/id`, `event_type`, `payload` (jsonb), `status`, `attempts`                                                                               |

### 5.2 Relationships

```
PayerAccount 1───* Tenant            (parent_tenant_id self-link: primary → secondaries)
PayerAccount 1───1 Subscription ───* (references) PricingStructure
PayerAccount 1───* PayerEntitlement
Tenant       1───* TenantDocument
PayerAccount 1───* PayerReview *───1 Tenant
PricingStructure 1───* PricingComponent 1───* PricingTier   (cascade + orphanRemoval)
```

JSON columns (`pricing_snapshot`, `before/after`, outbox `payload`) are mapped via Hibernate
`@JdbcTypeCode(SqlTypes.JSON)` on `Map<String,Object>`.

---

## 6. Lifecycle state machine

**Payer status:** `DRAFT → ACTIVE → SUSPENDED → ACTIVE/RETIRED`. Transitions are guarded by
`PayerLifecycle` (illegal transition → `409`).

**Submission marker:** a Payer stays `DRAFT` through onboarding; `submit` stamps `submitted_by/at`
(enters the approver queue) without changing status. Approval moves `DRAFT → ACTIVE`. "Information
required" clears the marker so the admin can correct and re-submit.

**Tenant status:** `DRAFT → PENDING_ACTIVATION → ACTIVE → SUSPENDED → RETIRED`. In M1 tenants move
`DRAFT → ACTIVE` together with the Payer at activation.

```
            submit                approve (≠ submitter)            auto-activate
 DRAFT ───────────────► DRAFT(submitted) ──────────────► [provision] ──────────► ACTIVE
   ▲                          │ request-info
   └──────────────────────────┘
```

---

## 7. Core workflow — onboarding to activation

| Step                      | Actor             | Endpoint                               | Component                              |
| :------------------------ | :---------------- | :------------------------------------- | :------------------------------------- |
| §5.1 Enter primary tenant | Platform Admin    | `POST /platform/payers`                | `OnboardingService.createPayer`        |
| §5.2 Add secondary tenant | Platform Admin    | `POST /platform/payers/{id}/tenants`   | `OnboardingService.addSecondaryTenant` |
| §5.3 Assign entitlements  | Platform Admin    | `PUT  …/entitlements`                  | `OnboardingService.setEntitlements`    |
| §5.4 Bind subscription    | Platform Admin    | `PUT  …/subscription`                  | `OnboardingService.setSubscription`    |
| §5.5 Upload documents     | Platform Admin    | `POST …/tenants/{tid}/documents`       | `OnboardingService.addDocument`        |
| §5.6 Submit               | Platform Admin    | `POST …/submit`                        | `OnboardingService.submit`             |
| §5.7 Approve / reject     | Platform Approver | `POST …/approve\|reject\|request-info` | `ApprovalService`                      |
| §5.8 Auto-activate        | System            | (triggered by approve)                 | `ActivationService.activate`           |

**Activation sequence** (single transaction):

1. `PayerLifecycle` validates `DRAFT → ACTIVE` and a readiness check (subscription present, ≥1
   entitlement, ≥1 tenant).
2. For each tenant: provision `tenant_<subdomain>` schema + tenant migrations; create Tenant Admin
   (`IdentityPort`); send invite (`NotificationPort`); set tenant `ACTIVE`; emit `TenantActivated`.
3. Create billing account against the primary (`BillingPort`).
4. Set Payer `ACTIVE`; emit `PayerActivated`; write audit.

On failure the DB transaction rolls back to `DRAFT`; schema provisioning is idempotent so a retried
activation reuses existing schemas.

**Notable rules:** subdomains are sanitised + reserved-word blocked + uniqueness-checked
(`SubdomainPolicy`); module dependencies auto-resolve (e.g. `ADVANCED_REPORTING` pulls in
`CORE_REPORTING`); duplicate `(legalEntityName, country)` is rejected.

---

## 8. Pricing subsystem

A **platform-global, versioned** pricing catalogue (`feature.pricing`) models the commercial
proposal: a model (`TRANSACTION_BASED` / `PCT_GWP`), flat fees, savings-capture %, and a **tiered
volume-discount schedule** per component (`CORE_PLATFORM_PMPM`, `CLAIMS_OUTPATIENT`,
`CLAIMS_INPATIENT`, `GWP_PERCENTAGE`).

- **Lifecycle:** `DRAFT → ACTIVE → ARCHIVED`. Only `DRAFT` is editable; only `ACTIVE` is attachable.
- **Subscription binding:** `setSubscription` loads an **ACTIVE** structure and **freezes an
  immutable snapshot** (`pricing_snapshot` jsonb) onto the subscription — later edits/archival never
  alter an agreed price. A structure pricing claims requires the `CLAIMS` module enabled.
- **Calculation is out of scope (v1):** tier resolution / invoice amounts are computed downstream
  (Finance). No quote endpoint is exposed.

---

## 9. Security model

- **Authentication:** OAuth2 Resource Server validating JWTs. Production validates against an
  issuer's JWKS (`GINJA_JWT_ISSUER_URI`). If no decoder is configured the app boots in a permissive
  **no-auth dev mode** (with a loud warning) so local work isn't blocked.
- **Dev tokens:** under the `dev` profile, `DevJwtConfig` provides an HS256 decoder/encoder using a
  shared secret, and `DevTokenController` (`POST /dev/token`) mints test tokens with `roles` and an
  optional `tenant_id`.
- **Authorization:** `roles` claim → `ROLE_*` authorities; method-level `@PreAuthorize` enforces
  `PLATFORM_ADMIN` (writes) / `PLATFORM_APPROVER` (verification). Public paths: `/dev/**`, Swagger,
  `/actuator/health`.
- **Separation of duties:** the submitting admin (`payer.submittedBy`) cannot approve their own
  submission (`ApprovalService` → `403`).
- **Schema guard:** `/platform/**` always runs in `public`, independent of any tenant claim.
- **Data protection:** sensitive fields (bank details) are encrypted at rest via an AES-256 key
  (`GINJA_ENCRYPTION_KEY`); the default value is for local dev only and **must** be overridden.
- **Statelessness:** `SessionCreationPolicy.STATELESS`, CSRF disabled (token-based API).

---

## 10. API conventions

- **Uniform envelope** (`infrastructure.Response`): every response is
  `{ status, success, message, result, errorDetails }`; the payload is under `result`. (The
  `/dev/token` helper is the only un-enveloped endpoint.)
- **Errors** are centralised in `GlobalExceptionHandler` (`@RestControllerAdvice`) → the same
  envelope with `success:false`:

  | Exception                                                            | HTTP |
  | :------------------------------------------------------------------- | :--- |
  | `NotFoundException`                                                  | 404  |
  | `ValidationException` / bean-validation / `IllegalArgumentException` | 400  |
  | `ConflictException`                                                  | 409  |
  | `SeparationOfDutiesException`                                        | 403  |
  | any other `Exception`                                                | 500  |

- **Pagination:** list endpoints accept Spring `Pageable` (`?page&size&sort`, default size 20);
  `PayerQueryService.listAll` batch-loads related data to avoid N+1.

Full endpoint catalogue: see [`CONTROL_PLANE_API.md`](./CONTROL_PLANE_API.md).

---

## 11. Eventing — transactional outbox

Domain events are written to `outbox_event` **in the same transaction** as the state change
(`DomainEvents.publish`), guaranteeing no lost/ghost events. `OutboxPublisher` is a scheduled relay
(`@Scheduled`, default 2s) that drains `PENDING` rows through `EventPublisherPort` and marks them
`PUBLISHED` (at-least-once; consumers must be idempotent). The dev adapter logs; a Kafka/Rabbit
adapter slots in behind the port.

**Events emitted:** `PayerSubmitted`, `PayerApproved`, `PayerRejected`, `PayerInformationRequired`,
`TenantActivated` (per tenant), `PayerActivated`.

---

## 12. Integration ports (hexagonal)

| Port                 | Responsibility                                    | Dev stub                   |
| :------------------- | :------------------------------------------------ | :------------------------- |
| `ModuleRegistryPort` | Module catalogue + dependency resolution          | static in-memory catalogue |
| `NotificationPort`   | Tenant-admin activation invites + delivery status | logs                       |
| `DocumentStorePort`  | Persist document bytes, return a storage ref      | fabricates a ref           |
| `BillingPort`        | Create billing account on activation              | logs                       |
| `IdentityPort`       | Provision Tenant Admin identity (IAM)             | synthetic ref              |
| `EventPublisherPort` | Relay outbox events to a broker                   | logs                       |

Stubs are plain beans (active in `dev` and `test`); real adapters can be added as profile-gated /
`@Primary` beans without changing domain code.

---

## 13. Cross-cutting concerns

- **Audit:** `AuditRecorder` writes one `audit_log` row per mutation, within the mutation's
  transaction (consistent with committed state).
- **Validation:** Bean Validation on request records (`@Valid`, `@NotBlank`, `@Email`, `@Size`, …);
  domain invariants in services throw typed exceptions.
- **Transactions:** services are `@Transactional`; query service is `@Transactional(readOnly = true)`.

---

## 14. Configuration & deployment

| Env var                                               | Default                                       | Purpose                                                 |
| :---------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------------ |
| `GINJA_USER_DB`                                       | `jdbc:postgresql://localhost:5432/ginja-user` | datasource URL                                          |
| `GINJA_USER_USERNAME` / `GINJA_USER_PASS`             | `postgres` / `root`                           | DB credentials                                          |
| `SPRING_PROFILES_ACTIVE`                              | `dev`                                         | active profile                                          |
| `GINJA_FLYWAY_ENABLED`                                | `true`                                        | run master migrations on boot                           |
| `GINJA_JWT_ISSUER_URI`                                | _(empty)_                                     | JWKS issuer (enables JWT validation; required for prod) |
| `GINJA_DEV_JWT_SECRET`                                | dev default                                   | HS256 secret (dev profile only)                         |
| `GINJA_ENCRYPTION_KEY`                                | dev default                                   | AES-256 key for field encryption (**override in prod**) |
| `GINJA_TENANT_CLAIM`                                  | `tenant_id`                                   | JWT claim carrying the tenant                           |
| `GINJA_DEFAULT_SCHEMA` / `GINJA_TENANT_SCHEMA_PREFIX` | `public` / `tenant_`                          | schema config                                           |

- **Master Flyway** runs at boot (`public`). **Tenant Flyway** runs per-tenant at activation.
- JPA `ddl-auto=none` (schema owned by Flyway); `open-in-view=false`.

---

## 15. Build, test & verification

- Build / unit-context test: `./mvnw clean test` (context-load test under the `test` profile, which
  supplies a dummy JWKS so the resource server initialises without a real IdP).
- Manual end-to-end (dev profile): mint admin + approver tokens via `/dev/token`, then walk the
  onboarding → approve → auto-activate sequence; confirm `tenant_<subdomain>` schemas, stub logs,
  and `outbox_event` rows. A ready-to-run script is in the API reference.

---

## 16. Roadmap (designed for, not yet built)

| Milestone | Scope                                                                                      |
| :-------- | :----------------------------------------------------------------------------------------- |
| M2        | Tenant-admin invite + first-login (set password/SSO, MFA, ToS) via `IdentityPort`          |
| M3        | Org-detail edits (tenant & platform) with field-level audit + events                       |
| M4        | Maker-checker approval queue (maker ≠ checker) + entitlement changes on active payers      |
| M5        | Add-secondary-to-active (`PENDING_ACTIVATION`), suspend (session kill), retire (retention) |
| M6        | Real port adapters: broker (outbox), object storage, IAM, Notification, Billing            |
| —         | Pricing **quote/calculation** endpoint (tier resolution over member/claim/GWP volumes)     |

---

## 17. Appendix — migrations

**Master (`public`):** V1 legacy registry → V2 drop legacy → V3 `payer_account` → V4 `tenant` →
V5 `payer_entitlement` + `subscription` → V6 `tenant_document` + `payer_review` →
V7 `audit_log` + `outbox_event` → V8 `payer_account` version (optimistic locking) →
V9 `pricing_structure`/`component`/`tier` + subscription ↔ pricing wiring.

**Tenant (`tenant_<id>`):** V1 `app_user` (sample tenant-scoped business table).
