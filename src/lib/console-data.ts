/**
 * Ginja AI Platform Console — mock data (typed).
 *
 * Self-contained port of the hi-fi design source — see
 * "Ginja Console-v2.html" at the repo root (and
 * DESIGN-GUIDE.md). The console is the internal ops platform for onboarding &
 * managing insurer "tenant" accounts. Everything here is demo data — no API.
 */

/* ------------------------------------------------------------------ types -- */

export type TenantStatus =
  | "Active"
  | "Draft"
  | "Suspended"
  | "Retired"
  | "Pending Activation"
  | "Pending Review"

export type StatusTone =
  | "active"
  | "draft"
  | "suspended"
  | "retired"
  | "pending"

export type TenantType = "Insurer" | "TPA" | "Self-managed Scheme"

export type Region = {
  id: string
  city: string
  country: string
  status: "Active" | "Provisioning"
  tenants: number
}

export type Payer = {
  id: string
  name: string
  type: TenantType
  country: string
  region: string
  status: TenantStatus
  members: number
  secondary: number
  modules: number
  plan: string
  mrr: number
  subdomain: string
  updated: string
  admin: string
  email: string
  suspendReason?: string
}

export type SubModule = {
  id: string
  name: string
  desc: string
  requires?: string
}

export type ModuleStatus = "Published" | "Beta" | "Sunset"

export type RegistryModule = {
  id: string
  /** Functional code, e.g. "CLAIMS". */
  code: string
  /** Module URL/route, e.g. "/claims" (may be blank). */
  url: string
  name: string
  icon: string
  version: string
  status: ModuleStatus
  owner: string
  tenants: number
  desc: string
  subs: SubModule[]
}

export type PricingModel = {
  id: string
  name: string
  icon: string
  sub: string
  desc: string
  headline: string
  unit: string
  tiered: boolean
  on: boolean
}

export type DocStatus = "Published" | "Draft"

export type DocTemplate = {
  id: string
  name: string
  cat: string
  format: string
  version: string
  status: DocStatus
  updated: string
  /** Tenant-override count — not exposed by the list API (optional). */
  overrides?: number
  by: string
  /** Short description from the API (optional; absent in legacy mock rows). */
  description?: string
}

export type EmailChannel = "Email" | "Email + SMS"

export type EmailTemplate = {
  id: string
  /** Numeric template id from the API — used to fetch full detail (get-one + version). */
  templateId?: number
  name: string
  trigger: string
  channel: EmailChannel
  status: DocStatus
  version: string
  updated: string
  /** Tenant-override count — not exposed by the list API (optional). */
  overrides?: number
  subject: string
  body: string
  /** Short description from the API (optional; absent in legacy mock rows). */
  description?: string
  /** Which platform the template belongs to, e.g. "TENANT_PLATFORMS" (optional). */
  usedBy?: string
  /** Whether the template is enabled (active) — drives the Disabled state. */
  active?: boolean
  /** Whether the template is archived (hidden from the default list). */
  archived?: boolean
}

export type EmailVar = { n: string; d: string }

/** A point-in-time version of an email template (version-history + diff). */
export type EmailVersion = {
  v: string
  status: DocStatus
  current: boolean
  note: string
  date: string
  by: string
  subject: string
  body: string
  text?: string
}

export type EmailAuditKind = "create" | "edit" | "publish" | "rollback" | "test"

/** A single audit-feed event on an email template. */
export type EmailAuditEvent = {
  id: string
  kind: EmailAuditKind
  action: string
  detail: string
  when: string
  by: string
  initials: string
}

/** A centrally-managed placeholder auto-injected into every email at send time. */
export type GlobalPlaceholder = {
  key: string
  value: string
  desc: string
  active: boolean
}

export type TierRow = {
  tier: string
  threshold: string
  rate: string
  disc: string
}
export type TierCard = { unit: string; rows: TierRow[] }

export type Approval = {
  id: string
  kind: string
  payer: string
  payerId: string
  maker: string
  submitted: string
  priority: "High" | "Normal" | "Low"
  tenants: number
  docs: number
  status: "pending" | "approved"
}

export type AuditEntry = {
  when: string
  date: string
  actor: string
  role: string
  action: string
  target: string
  kind: "create" | "system" | "approve" | "edit" | "danger" | "warn"
}

/** Onboarding step owner *category* (the `owner_role` the steps API returns).
   Actual people are real platform members now — see OwnerSelect / useMembers. */
export type OnbTeamKey = "profile" | "tech" | "compliance"

export type SecStatus = "complete" | "progress" | "empty"

export type OnbSection = {
  k: string
  l: string
  short: string
  /** The specialty that naturally owns this section (drives "suggest by specialty"). */
  specRole: StaffRole
  icon: string
}

export type WizStepKey =
  | "primary"
  | "secondary"
  | "modules"
  | "billing"
  | "documents"
  | "review"

export type WizStep = {
  k: WizStepKey
  l: string
  d: string
  owner: OnbTeamKey
}

export type Contact = {
  name: string
  email: string
  role: string
  phone: string
}

export type Secondary = {
  name: string
  country: string
  region: string
  subdomain: string
  /** Server tenant id once this secondary is saved (POSTed) under the draft.
     Present → server-backed (PATCH on edit, DELETE on remove); absent → a new,
     not-yet-saved row. */
  tenantId?: number
}

/** A KYB/contract document captured in onboarding. The API now accepts real
   file bytes (multipart) and serves a pre-signed download URL per document. */
export type OnbDocument = {
  category: string
  fileName: string
  expiryDate?: string
  /** Optional free-text note sent as the document `description`. */
  description?: string
  /** The picked File — present for a not-yet-uploaded document. */
  file?: File
  /** Server document id once uploaded (used for the pre-signed download). */
  documentId?: string
  /** True when the file is already stored on the server (e.g. on resume). */
  uploaded?: boolean
}

/** KYB categories the submit gate requires on the primary tenant (API §8.6). */
export const REQUIRED_DOC_CATEGORIES = [
  "SIGNED_CONTRACT",
  "COMPANY_REGISTRATION",
  "PROOF_OF_ADDRESS",
  "DIRECTOR_SHAREHOLDER_ID",
] as const

export const DOC_CATEGORY_LABEL: Record<string, string> = {
  SIGNED_CONTRACT: "Signed Contract",
  COMPANY_REGISTRATION: "Company Registration Certificate",
  PROOF_OF_ADDRESS: "Proof of Address",
  DIRECTOR_SHAREHOLDER_ID: "Director / Shareholder IDs",
}

export type OnboardingForm = {
  legal: string
  trading: string
  contact: string
  email: string
  country: string
  region: string
  type: TenantType
  subdomain: string
  isolation: string
  sso: string
  customDomain: string
  tax: string
  contacts: Contact[]
  address: string
  website: string
  secondaries: Secondary[]
  /** Selected module codes → submodule codes. Modules-only for now (no
     submodule catalogue API), so the arrays are empty. */
  modules: Record<string, string[]>
  /** Chosen ACTIVE pricing structure id (null until picked). */
  pricingStructureId: number | null
  /** subscription_model: PMPM | PER_CLAIM | PCT_GWP. Derived from the chosen
     structure (no separate picker). */
  model: string
  freq: string
  /** Free-trial length in days → subscription `free_trial_days` (§8.4). */
  freeTrialDays: string
  /** Contract window (ISO yyyy-mm-dd) → subscription `contract_start`/`_end`. */
  contractStart: string
  contractEnd: string
  documents: OnbDocument[]
}

/* ------------------------------------------------------------------- nav -- */

export type ConsoleModule = {
  id: string
  label: string
  icon: string
  group: string
  count?: number
}

export const C_MODULES: ConsoleModule[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", group: "Overview" },
  {
    id: "payers",
    label: "Tenant accounts",
    icon: "building",
    group: "Tenant management",
    count: 24,
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: "shieldCheck",
    group: "Tenant management",
    count: 5,
  },
  {
    id: "registry",
    label: "Module registry",
    icon: "layers",
    group: "Configuration library",
  },
  {
    id: "doc-templates",
    label: "Document templates",
    icon: "fileText",
    group: "Configuration library",
  },
  {
    id: "email-templates",
    label: "Email templates",
    icon: "mail",
    group: "Configuration library",
  },
  {
    id: "sms-templates",
    label: "SMS templates",
    icon: "mail",
    group: "Configuration library",
  },
  {
    id: "pricing",
    label: "Pricing & plans",
    icon: "pricing",
    group: "Configuration library",
  },
  {
    id: "settings",
    label: "Platform settings",
    icon: "settings",
    group: "Platform",
  },
  { id: "audit", label: "Audit log", icon: "history", group: "Platform" },
]

/* --------------------------------------------------------------- regions -- */

export const REGIONS: Region[] = [
  {
    id: "af-east-1",
    city: "Nairobi",
    country: "Kenya",
    status: "Active",
    tenants: 11,
  },
  {
    id: "af-east-2",
    city: "Dar es Salaam",
    country: "Tanzania",
    status: "Active",
    tenants: 4,
  },
  {
    id: "af-east-3",
    city: "Kampala",
    country: "Uganda",
    status: "Active",
    tenants: 3,
  },
  {
    id: "af-central-1",
    city: "Kigali",
    country: "Rwanda",
    status: "Active",
    tenants: 2,
  },
  {
    id: "af-horn-1",
    city: "Addis Ababa",
    country: "Ethiopia",
    status: "Active",
    tenants: 2,
  },
  {
    id: "af-south-1",
    city: "Johannesburg",
    country: "South Africa",
    status: "Active",
    tenants: 2,
  },
  {
    id: "af-west-1",
    city: "Lagos",
    country: "Nigeria",
    status: "Provisioning",
    tenants: 0,
  },
]

/* -------------------------------------------------------- tenant accounts -- */

export const PAYERS: Payer[] = [
  {
    id: "PYR-0192",
    name: "Jubilee Health Insurance",
    type: "Insurer",
    country: "Kenya",
    region: "af-east-1",
    status: "Active",
    members: 412000,
    secondary: 2,
    modules: 7,
    plan: "Per Member Per Month",
    mrr: 185400,
    subdomain: "jubilee",
    updated: "04 Jun 2026",
    admin: "Faith Wanjiru",
    email: "faith.wanjiru@jubilee.co.ke",
  },
  {
    id: "PYR-0188",
    name: "Britam Health",
    type: "Insurer",
    country: "Kenya",
    region: "af-east-1",
    status: "Active",
    members: 286500,
    secondary: 1,
    modules: 6,
    plan: "% of Gross Written Premium",
    mrr: 142000,
    subdomain: "britam",
    updated: "03 Jun 2026",
    admin: "Daniel Mwangi",
    email: "d.mwangi@britam.com",
  },
  {
    id: "PYR-0205",
    name: "CIC Insurance Group",
    type: "Insurer",
    country: "Kenya",
    region: "af-east-1",
    status: "Draft",
    members: 0,
    secondary: 3,
    modules: 5,
    plan: "Per Member Per Month",
    mrr: 0,
    subdomain: "cic-health",
    updated: "06 Jun 2026",
    admin: "Grace Achieng",
    email: "grace.a@cic.co.ke",
  },
  {
    id: "PYR-0177",
    name: "UAP Old Mutual",
    type: "Insurer",
    country: "Uganda",
    region: "af-east-3",
    status: "Active",
    members: 198000,
    secondary: 4,
    modules: 8,
    plan: "Hybrid",
    mrr: 121800,
    subdomain: "uap-om",
    updated: "01 Jun 2026",
    admin: "Samuel Okello",
    email: "s.okello@uap.co.ug",
  },
  {
    id: "PYR-0210",
    name: "Strategis Insurance",
    type: "TPA",
    country: "Tanzania",
    region: "af-east-2",
    status: "Draft",
    members: 0,
    secondary: 0,
    modules: 4,
    plan: "Per Claim Processed",
    mrr: 0,
    subdomain: "strategis",
    updated: "06 Jun 2026",
    admin: "Neema Mushi",
    email: "neema@strategis.co.tz",
  },
  {
    id: "PYR-0161",
    name: "AAR Insurance",
    type: "Insurer",
    country: "Kenya",
    region: "af-east-1",
    status: "Active",
    members: 224700,
    secondary: 2,
    modules: 7,
    plan: "Per Member Per Month",
    mrr: 98200,
    subdomain: "aar",
    updated: "29 May 2026",
    admin: "Peter Njoroge",
    email: "p.njoroge@aar.co.ke",
  },
  {
    id: "PYR-0154",
    name: "Radiant Insurance",
    type: "Insurer",
    country: "Rwanda",
    region: "af-central-1",
    status: "Suspended",
    members: 64000,
    secondary: 0,
    modules: 4,
    plan: "Flat Platform Fee",
    mrr: 0,
    subdomain: "radiant",
    updated: "22 May 2026",
    admin: "Claudine Uwase",
    email: "c.uwase@radiant.rw",
    suspendReason: "Non-Payment",
  },
  {
    id: "PYR-0143",
    name: "Nile Insurance",
    type: "Insurer",
    country: "Ethiopia",
    region: "af-horn-1",
    status: "Active",
    members: 152300,
    secondary: 1,
    modules: 6,
    plan: "% of Gross Written Premium",
    mrr: 88600,
    subdomain: "nile",
    updated: "18 May 2026",
    admin: "Selam Bekele",
    email: "selam.b@nileinsurance.et",
  },
  {
    id: "PYR-0131",
    name: "Sanlam Health Solutions",
    type: "Insurer",
    country: "South Africa",
    region: "af-south-1",
    status: "Active",
    members: 318900,
    secondary: 5,
    modules: 9,
    plan: "Hybrid",
    mrr: 241500,
    subdomain: "sanlam-health",
    updated: "12 May 2026",
    admin: "Thabo Molefe",
    email: "t.molefe@sanlam.co.za",
  },
  {
    id: "PYR-0120",
    name: "Prudential Uganda",
    type: "TPA",
    country: "Uganda",
    region: "af-east-3",
    status: "Active",
    members: 73400,
    secondary: 0,
    modules: 5,
    plan: "Per Claim Processed",
    mrr: 41200,
    subdomain: "prudential-ug",
    updated: "08 May 2026",
    admin: "Esther Nakato",
    email: "e.nakato@prudential.ug",
  },
  {
    id: "PYR-0098",
    name: "Madison Health",
    type: "Self-managed Scheme",
    country: "Zambia",
    region: "af-south-1",
    status: "Retired",
    members: 0,
    secondary: 0,
    modules: 3,
    plan: "Flat Platform Fee",
    mrr: 0,
    subdomain: "madison",
    updated: "02 Apr 2026",
    admin: "—",
    email: "—",
  },
  {
    id: "PYR-0212",
    name: "Equity Afia Care",
    type: "Insurer",
    country: "Kenya",
    region: "af-east-1",
    status: "Draft",
    members: 0,
    secondary: 1,
    modules: 6,
    plan: "Per Member Per Month",
    mrr: 0,
    subdomain: "equity-afia",
    updated: "07 Jun 2026",
    admin: "Mercy Kamau",
    email: "mercy.k@equityafia.co.ke",
  },
]

/* ------------------------------------------------------- module registry -- */

export const REGISTRY: RegistryModule[] = [
  {
    id: "claims",
    code: "CLAIMS",
    url: "/claims",
    name: "Claims Management",
    icon: "claims",
    version: "4.2.0",
    status: "Published",
    owner: "Claims Platform",
    tenants: 22,
    desc: "Intake, adjudication and settlement of health claims.",
    subs: [
      {
        id: "intake",
        name: "Claims intake",
        desc: "Capture & validate submissions",
      },
      {
        id: "adjud",
        name: "Adjudication engine",
        desc: "Auto + manual decisioning",
      },
      {
        id: "preauth",
        name: "Pre-authorisation",
        desc: "Approvals before service",
      },
      {
        id: "appeals",
        name: "Appeals & disputes",
        desc: "Re-assessment workflow",
      },
    ],
  },
  {
    id: "underwriting",
    code: "UNDERWRITING",
    url: "/underwriting",
    name: "Underwriting",
    icon: "underwriting",
    version: "3.1.4",
    status: "Published",
    owner: "Risk Platform",
    tenants: 18,
    desc: "Risk scoring, policy issuance and renewals.",
    subs: [
      { id: "risk", name: "Risk scoring", desc: "Member & group rating" },
      { id: "issue", name: "Policy issuance", desc: "Bind & activate cover" },
      { id: "renew", name: "Renewals", desc: "Renewal cycle automation" },
    ],
  },
  {
    id: "providers",
    code: "PROVIDERS",
    url: "/providers",
    name: "Provider Network",
    icon: "providers",
    version: "2.8.1",
    status: "Published",
    owner: "Network Platform",
    tenants: 20,
    desc: "Provider directory, contracting and credentialing.",
    subs: [
      {
        id: "directory",
        name: "Provider directory",
        desc: "Searchable network",
      },
      { id: "contracting", name: "Contracting", desc: "Tariffs & agreements" },
      { id: "cred", name: "Credentialing", desc: "Verification & re-cred" },
    ],
  },
  {
    id: "members",
    code: "MEMBERS",
    url: "/members",
    name: "Member Management",
    icon: "crm",
    version: "3.5.0",
    status: "Published",
    owner: "Member Platform",
    tenants: 24,
    desc: "Enrollment, eligibility and the member app.",
    subs: [
      {
        id: "enroll",
        name: "Enrollment",
        desc: "Onboard members & dependants",
      },
      { id: "elig", name: "Eligibility", desc: "Real-time benefit checks" },
      { id: "app", name: "Member app", desc: "Self-service mobile" },
    ],
  },
  {
    id: "products",
    code: "PRODUCTS",
    url: "/products",
    name: "Products & Benefits",
    icon: "products",
    version: "4.0.2",
    status: "Published",
    owner: "Product Platform",
    tenants: 21,
    desc: "Plan builder, benefit rules and formulary.",
    subs: [
      { id: "builder", name: "Plan builder", desc: "Zero-code product config" },
      {
        id: "rules",
        name: "Benefit rules",
        desc: "Limits, co-pays, exclusions",
      },
      { id: "formulary", name: "Formulary", desc: "Drug & tariff lists" },
    ],
  },
  {
    id: "finance",
    code: "FINANCE",
    url: "/finance",
    name: "Finance & Billing",
    icon: "finance",
    version: "3.9.1",
    status: "Published",
    owner: "Finance Platform",
    tenants: 24,
    desc: "Invoicing, payments and reconciliation.",
    subs: [
      { id: "invoicing", name: "Invoicing", desc: "Premium & fee invoices" },
      { id: "payments", name: "Payments", desc: "Disbursements & receipts" },
      { id: "recon", name: "Reconciliation", desc: "Ledger matching" },
    ],
  },
  {
    id: "reporting",
    code: "REPORTING",
    url: "/reporting",
    name: "Reporting & Analytics",
    icon: "analytics",
    version: "2.4.0",
    status: "Published",
    owner: "Data Platform",
    tenants: 19,
    desc: "Operational and advanced analytics.",
    subs: [
      {
        id: "core",
        name: "Core reporting",
        desc: "Standard operational reports",
      },
      {
        id: "advanced",
        name: "Advanced reporting",
        desc: "Custom analytics",
        requires: "core",
      },
      { id: "dash", name: "Dashboards", desc: "Live KPI boards" },
    ],
  },
  {
    id: "reinsurance",
    code: "REINSURANCE",
    url: "/reinsurance",
    name: "Reinsurance",
    icon: "reinsurance",
    version: "1.6.0",
    status: "Beta",
    owner: "Risk Platform",
    tenants: 6,
    desc: "Treaties, cessions and recoveries.",
    subs: [
      { id: "treaties", name: "Treaties", desc: "Treaty configuration" },
      { id: "cessions", name: "Cessions", desc: "Risk cession ledger" },
    ],
  },
  {
    id: "cases",
    code: "CASES",
    url: "/cases",
    name: "Case Management",
    icon: "inbox",
    version: "2.0.5",
    status: "Published",
    owner: "Service Platform",
    tenants: 14,
    desc: "Queries, complaints and care coordination.",
    subs: [
      {
        id: "queries",
        name: "Queries & complaints",
        desc: "Member service tickets",
      },
      { id: "care", name: "Care coordination", desc: "Chronic & case mgmt" },
    ],
  },
  {
    id: "wellness",
    code: "WELLNESS",
    url: "/wellness",
    name: "Wellness & Prevention",
    icon: "zap",
    version: "0.9.0",
    status: "Sunset",
    owner: "Member Platform",
    tenants: 2,
    desc: "Legacy wellness programs — being retired.",
    subs: [{ id: "programs", name: "Programs", desc: "Wellness campaigns" }],
  },
]

/* ------------------------------------------------------- pricing models -- */

export const PRICING_MODELS: PricingModel[] = [
  {
    id: "pmpm",
    name: "Per Member Per Month",
    icon: "crm",
    sub: "PMPM",
    desc: "Fixed amount per enrolled member each calendar month.",
    headline: "$0.37",
    unit: "/ member / mo",
    tiered: true,
    on: true,
  },
  {
    id: "perclaim",
    name: "Per Claim Processed",
    icon: "fileCheck",
    sub: "Transaction",
    desc: "Per claim adjudicated, split by outpatient & inpatient.",
    headline: "$0.85",
    unit: "/ outpatient claim",
    tiered: true,
    on: true,
  },
  {
    id: "gwp",
    name: "% of Gross Written Premium",
    icon: "percent",
    sub: "% of GWP",
    desc: "A percentage of the tenant's total gross written premium.",
    headline: "3.10%",
    unit: "of GWP",
    tiered: true,
    on: true,
  },
  {
    id: "flat",
    name: "Flat Platform Fee",
    icon: "creditCard",
    sub: "Subscription",
    desc: "Fixed annual platform fee, independent of volume.",
    headline: "$500K",
    unit: "/ year",
    tiered: false,
    on: true,
  },
  {
    id: "hybrid",
    name: "Hybrid",
    icon: "layers",
    sub: "Blended",
    desc: "% of GWP + flat platform fee + savings capture.",
    headline: "Custom",
    unit: "blended",
    tiered: false,
    on: true,
  },
]

export const BILLING_FREQ = ["Monthly", "Quarterly", "Annually"]

/* ----------------------------------------- pricing: volume discount tiers -- */

export const TIERS: Record<string, TierCard> = {
  pmpm: {
    unit: "PMPM rate",
    rows: [
      {
        tier: "Tier 1",
        threshold: "< 50,000 members",
        rate: "$0.50",
        disc: "Base",
      },
      { tier: "Tier 2", threshold: "≥ 50,000", rate: "$0.45", disc: "−10.0%" },
      { tier: "Tier 3", threshold: "≥ 150,000", rate: "$0.42", disc: "−16.0%" },
      { tier: "Tier 4", threshold: "≥ 300,000", rate: "$0.37", disc: "−26.0%" },
      { tier: "Tier 5", threshold: "≥ 500,000", rate: "$0.33", disc: "−34.0%" },
    ],
  },
  outpatient: {
    unit: "Per outpatient claim",
    rows: [
      {
        tier: "Tier 1",
        threshold: "< 100,000 claims",
        rate: "$1.20",
        disc: "Base",
      },
      { tier: "Tier 2", threshold: "≥ 100,000", rate: "$1.10", disc: "−8.3%" },
      { tier: "Tier 3", threshold: "≥ 400,000", rate: "$1.05", disc: "−12.5%" },
      { tier: "Tier 4", threshold: "≥ 800,000", rate: "$0.90", disc: "−25.0%" },
      {
        tier: "Tier 5",
        threshold: "≥ 1,500,000",
        rate: "$0.85",
        disc: "−29.2%",
      },
    ],
  },
  inpatient: {
    unit: "Per inpatient claim",
    rows: [
      {
        tier: "Tier 1",
        threshold: "< 25,000 claims",
        rate: "$11.15",
        disc: "Base",
      },
      { tier: "Tier 2", threshold: "≥ 25,000", rate: "$11.00", disc: "−1.3%" },
      { tier: "Tier 3", threshold: "≥ 100,000", rate: "$10.50", disc: "−5.8%" },
      { tier: "Tier 4", threshold: "≥ 200,000", rate: "$9.00", disc: "−19.3%" },
      { tier: "Tier 5", threshold: "≥ 400,000", rate: "$8.50", disc: "−23.8%" },
    ],
  },
  gwp: {
    unit: "% of GWP",
    rows: [
      { tier: "Tier 1", threshold: "< $50M GWP", rate: "4.00%", disc: "Base" },
      {
        tier: "Tier 2",
        threshold: "$50M – $100M",
        rate: "3.50%",
        disc: "−12.5%",
      },
      { tier: "Tier 3", threshold: "> $100M", rate: "3.10%", disc: "−22.5%" },
      { tier: "Tier 4", threshold: "> $200M", rate: "2.85%", disc: "−28.8%" },
    ],
  },
}

/* ------------------------------------------------- document template library -- */

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "DOC-WEL",
    name: "Member Welcome Pack",
    cat: "Membership",
    format: "PDF",
    version: "v3.2",
    status: "Published",
    updated: "02 Jun 2026",
    overrides: 7,
    by: "Amara Okeke",
  },
  {
    id: "DOC-CARD",
    name: "Membership Card",
    cat: "Membership",
    format: "PDF",
    version: "v2.0",
    status: "Published",
    updated: "28 May 2026",
    overrides: 11,
    by: "Lily Tesfaye",
  },
  {
    id: "DOC-SCH",
    name: "Policy Schedule",
    cat: "Policy",
    format: "PDF",
    version: "v4.1",
    status: "Published",
    updated: "20 May 2026",
    overrides: 9,
    by: "Amara Okeke",
  },
  {
    id: "DOC-SOB",
    name: "Statement of Benefits",
    cat: "Policy",
    format: "PDF",
    version: "v1.8",
    status: "Published",
    updated: "15 May 2026",
    overrides: 5,
    by: "David Kimani",
  },
  {
    id: "DOC-CLS",
    name: "Claim Settlement Letter",
    cat: "Claims",
    format: "PDF / DOCX",
    version: "v2.5",
    status: "Published",
    updated: "30 May 2026",
    overrides: 14,
    by: "Amara Okeke",
  },
  {
    id: "DOC-PAA",
    name: "Pre-authorisation Approval",
    cat: "Claims",
    format: "PDF",
    version: "v1.3",
    status: "Published",
    updated: "12 May 2026",
    overrides: 6,
    by: "Lily Tesfaye",
  },
  {
    id: "DOC-PAR",
    name: "Pre-authorisation Rejection",
    cat: "Claims",
    format: "PDF",
    version: "v1.3",
    status: "Published",
    updated: "12 May 2026",
    overrides: 6,
    by: "Lily Tesfaye",
  },
  {
    id: "DOC-INV",
    name: "Tax Invoice",
    cat: "Finance",
    format: "PDF",
    version: "v5.0",
    status: "Published",
    updated: "04 Jun 2026",
    overrides: 3,
    by: "Amara Okeke",
  },
  {
    id: "DOC-KYB",
    name: "KYB Document Checklist",
    cat: "Onboarding",
    format: "PDF",
    version: "v2.1",
    status: "Draft",
    updated: "06 Jun 2026",
    overrides: 0,
    by: "David Kimani",
  },
]

/* ----------------------------------------------- email / SMS template library -- */

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "EML-INV",
    name: "Tenant Admin Invitation",
    trigger: "On account activation",
    channel: "Email",
    status: "Published",
    version: "v3.0",
    updated: "04 Jun 2026",
    overrides: 2,
    subject: "You're invited to administer {{org_name}} on Ginja",
    body: "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. You have been assigned as Tenant Administrator.\n\nSet up your account using the secure link below. This link expires in {{expiry_hours}} hours.\n\n{{invite_link}}\n\nWelcome aboard,\nThe Ginja Team",
  },
  {
    id: "EML-ACT",
    name: "Activation Confirmation",
    trigger: "On Tenant activation",
    channel: "Email",
    status: "Published",
    version: "v2.1",
    updated: "01 Jun 2026",
    overrides: 1,
    subject: "{{org_name}} is now live on Ginja",
    body: "Hi {{admin_name}},\n\nGreat news — {{org_name}} has been activated. Your tenant URL is now live:\n\nhttps://{{subdomain}}.ginja.ai\n\nModules enabled: {{module_list}}.",
  },
  {
    id: "EML-SUS",
    name: "Suspension Notice",
    trigger: "On account suspension",
    channel: "Email",
    status: "Published",
    version: "v1.4",
    updated: "22 May 2026",
    overrides: 0,
    subject: "Important: {{org_name}} access has been suspended",
    body: "Hi {{admin_name}},\n\nAccess to {{org_name}} has been suspended. Reason: {{suspend_reason}}.\n\nPlease contact your account manager to resolve this.",
  },
  {
    id: "EML-PWD",
    name: "Password Reset",
    trigger: "On user request",
    channel: "Email",
    status: "Published",
    version: "v4.2",
    updated: "18 May 2026",
    overrides: 4,
    subject: "Reset your Ginja password",
    body: "Hi {{user_name}},\n\nUse the link below to reset your password. It expires in {{expiry_minutes}} minutes.\n\n{{reset_link}}",
  },
  {
    id: "EML-MFA",
    name: "MFA Enrollment",
    trigger: "On first login",
    channel: "Email",
    status: "Published",
    version: "v1.1",
    updated: "10 May 2026",
    overrides: 0,
    subject: "Secure your account — set up MFA",
    body: "Hi {{user_name}},\n\nMulti-factor authentication is required. Complete enrollment here:\n\n{{mfa_link}}",
  },
  {
    id: "EML-CLA",
    name: "Claim Approved (Member)",
    trigger: "On claim approval",
    channel: "Email + SMS",
    status: "Published",
    version: "v2.0",
    updated: "30 May 2026",
    overrides: 8,
    subject: "Your claim {{claim_id}} has been approved",
    body: "Hi {{member_name}},\n\nYour claim {{claim_id}} for {{provider_name}} has been approved. Amount: {{claim_amount}}.",
  },
  {
    id: "EML-CLR",
    name: "Claim Rejected (Member)",
    trigger: "On claim rejection",
    channel: "Email",
    status: "Published",
    version: "v2.0",
    updated: "30 May 2026",
    overrides: 8,
    subject: "Update on your claim {{claim_id}}",
    body: "Hi {{member_name}},\n\nYour claim {{claim_id}} could not be approved. Reason: {{reject_reason}}.",
  },
  {
    id: "EML-INVO",
    name: "Invoice Issued",
    trigger: "On invoice generation",
    channel: "Email",
    status: "Draft",
    version: "v1.0",
    updated: "07 Jun 2026",
    overrides: 0,
    subject: "Invoice {{invoice_no}} for {{org_name}}",
    body: "Hi {{admin_name}},\n\nInvoice {{invoice_no}} for {{billing_period}} is now available. Amount due: {{amount_due}}.",
  },
]

export const EMAIL_VARS: EmailVar[] = [
  { n: "org_name", d: "Organisation" },
  { n: "admin_name", d: "Tenant admin" },
  { n: "subdomain", d: "Tenant subdomain" },
  { n: "invite_link", d: "Secure link" },
  { n: "expiry_hours", d: "Link expiry" },
  { n: "module_list", d: "Enabled modules" },
  { n: "member_name", d: "Member" },
  { n: "claim_id", d: "Claim ref" },
  { n: "claim_amount", d: "Amount" },
  { n: "provider_name", d: "Provider" },
]

/** Sample merge values used by the live template preview (renderTpl). */
export const SAMPLE: Record<string, string> = {
  org_name: "Jubilee Health Insurance",
  org_address: "Jubilee Centre, Mama Ngina St, Nairobi",
  admin_name: "Faith Wanjiru",
  subdomain: "jubilee",
  invite_link: "https://jubilee.ginja.ai/setup/8f2a…",
  expiry_hours: "72",
  module_list: "Claims, Members, Finance",
  member_name: "Achieng O.",
  claim_id: "CLM-48213",
  claim_amount: "$420.00",
  provider_name: "Aga Khan Hospital",
  user_name: "Faith Wanjiru",
  reset_link: "https://…/reset",
  expiry_minutes: "30",
  mfa_link: "https://…/mfa",
  suspend_reason: "Non-Payment",
  invoice_no: "INV-20260",
  billing_period: "June 2026",
  amount_due: "$185,400",
  reject_reason: "Out of benefit",
  document_date: "08 Jun 2026",
  policy_no: "POL-99231",
}

/* ----------------------------------------- email editor — rich mock data -- */

/** Allowed attachment file extensions offered in the create form. */
export const ATTACH_EXTS = ["pdf", "png", "jpg", "docx", "xlsx", "csv"]

/** Branded HTML starter shell shown when creating a fresh email template. */
export const STARTER_HTML = `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
          <tr><td style="background:#5B5BD6; padding:20px 28px;">
            <span style="color:#fff; font-size:18px; font-weight:700;">{{org_name}}</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="font-size:20px; margin:0 0 12px;">Hi {{admin_name}},</h1>
            <p style="font-size:14px; line-height:1.6; color:#374151;">
              Your Ginja workspace for <strong>{{org_name}}</strong> is ready. Click below to set up your account.
            </p>
            <a href="{{invite_link}}" style="display:inline-block; margin:18px 0; background:#5B5BD6; color:#fff; text-decoration:none; padding:11px 22px; border-radius:8px; font-weight:600;">Set up your account</a>
            <p style="font-size:12px; color:#6b7280;">This link expires in {{expiry_hours}} hours.</p>
          </td></tr>
          <tr><td style="padding:16px 28px; border-top:1px solid #eee; font-size:11px; color:#9ca3af;">
            Sent by Ginja on behalf of {{org_name}}.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

/** Wrap an existing template's plain body into the branded HTML shell for editing. */
export const htmlFromTemplate = (t: EmailTemplate) => `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f5f7; padding:24px; margin:0;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:10px; overflow:hidden;">
        <tr><td style="background:#5B5BD6; padding:20px 28px;"><img src="{{logo_url}}" alt="{{org_name}}" height="24" style="display:inline-block;vertical-align:middle" /></td></tr>
        <tr><td style="padding:28px; font-size:14px; line-height:1.6; color:#374151; white-space:pre-line;">${t.body}</td></tr>
        <tr><td style="padding:16px 28px; border-top:1px solid #eee; font-size:11px; color:#9ca3af;">Need help? Contact {{support_email}}.<br/>&copy; {{current_year}} Ginja · <a href="{{unsubscribe_url}}">Unsubscribe</a></td></tr>
      </table>
    </td></tr></table>
  </body>
</html>`

/** Centrally-managed placeholders auto-injected into every email at send time. */
export const GLOBAL_PLACEHOLDERS: GlobalPlaceholder[] = [
  {
    key: "logo_url",
    value: "https://cdn.ginja.ai/brand/logo.png",
    desc: "Platform logo shown in the email header.",
    active: true,
  },
  {
    key: "support_email",
    value: "support@ginja.ai",
    desc: "Support inbox shown in footers.",
    active: true,
  },
  {
    key: "current_year",
    value: "2026",
    desc: "Current calendar year for copyright lines.",
    active: true,
  },
  {
    key: "unsubscribe_url",
    value: "https://ginja.ai/unsubscribe",
    desc: "Standard unsubscribe link.",
    active: true,
  },
  {
    key: "company_address",
    value: "Ginja AI, Westlands, Nairobi",
    desc: "Registered postal address (legacy templates).",
    active: false,
  },
]

/** Version history for the editor's Versions tab (newest first; one is current). */
export const EMAIL_VERSIONS: EmailVersion[] = [
  {
    v: "v3.0",
    status: "Published",
    current: true,
    note: "Refreshed copy and added a 72-hour expiry note.",
    date: "04 Jun 2026",
    by: "Amara Okeke",
    subject: "You're invited to administer {{org_name}} on Ginja",
    body: "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. You have been assigned as Tenant Administrator.\n\nSet up your account using the secure link below. This link expires in {{expiry_hours}} hours.\n\n{{invite_link}}\n\nWelcome aboard,\nThe Ginja Team",
    text: "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. Set up your account: {{invite_link}}",
  },
  {
    v: "v2.0",
    status: "Draft",
    current: false,
    note: "Switched the CTA wording from 'Activate' to 'Set up'.",
    date: "21 May 2026",
    by: "Lily Tesfaye",
    subject: "You're invited to manage {{org_name}} on Ginja",
    body: "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. You have been assigned as Tenant Administrator.\n\nSet up your account using the link below. This link expires soon.\n\n{{invite_link}}\n\nThanks,\nThe Ginja Team",
    text: "Hi {{admin_name}},\n\nYour Ginja workspace for {{org_name}} is ready. Set up your account: {{invite_link}}",
  },
  {
    v: "v1.0",
    status: "Draft",
    current: false,
    note: "Initial invitation template.",
    date: "02 May 2026",
    by: "Amara Okeke",
    subject: "Activate your {{org_name}} workspace",
    body: "Hi {{admin_name}},\n\nA Ginja workspace for {{org_name}} has been created. Activate your account below.\n\n{{invite_link}}",
  },
]

/** Audit feed for the editor's Audit tab. */
export const EMAIL_AUDIT: EmailAuditEvent[] = [
  {
    id: "EA-08",
    kind: "publish",
    action: "Published v3.0",
    detail: "Refreshed copy and added a 72-hour expiry note.",
    when: "04 Jun 09:12",
    by: "Amara Okeke",
    initials: "AO",
  },
  {
    id: "EA-07",
    kind: "test",
    action: "Sent test email",
    detail: "Test of v3.0 sent to amara.okeke@ginja.ai.",
    when: "04 Jun 09:05",
    by: "Amara Okeke",
    initials: "AO",
  },
  {
    id: "EA-06",
    kind: "edit",
    action: "Edited subject & body",
    detail: "Reworded the call to action and footer.",
    when: "03 Jun 16:40",
    by: "Lily Tesfaye",
    initials: "LT",
  },
  {
    id: "EA-05",
    kind: "rollback",
    action: "Rolled back to v2.0",
    detail: "Restored the previous CTA wording as a new version.",
    when: "21 May 11:22",
    by: "David Kimani",
    initials: "DK",
  },
  {
    id: "EA-01",
    kind: "create",
    action: "Created template",
    detail: "Initial Tenant Admin Invitation template added to the library.",
    when: "02 May 14:08",
    by: "Amara Okeke",
    initials: "AO",
  },
]

/** Audit-feed event kind → dot tone. */
export const EMAIL_AUDIT_TONE: Record<
  EmailAuditKind,
  "success" | "warning" | "info" | "neutral"
> = {
  create: "info",
  edit: "neutral",
  publish: "success",
  rollback: "warning",
  test: "info",
}

/** Template codes already in the library — used for uniqueness validation. */
export const RESERVED_CODES = EMAIL_TEMPLATES.map((t) =>
  t.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
)

/* --------------------------------------------------------- approval queue -- */

export const APPROVALS: Approval[] = [
  {
    id: "APR-3120",
    kind: "Tenant onboarding",
    payer: "CIC Insurance Group",
    payerId: "PYR-0205",
    maker: "Amara Okeke",
    submitted: "2h ago",
    priority: "High",
    tenants: 4,
    docs: 6,
    status: "pending",
  },
  {
    id: "APR-3118",
    kind: "Tenant onboarding",
    payer: "Strategis Insurance",
    payerId: "PYR-0210",
    maker: "Amara Okeke",
    submitted: "5h ago",
    priority: "Normal",
    tenants: 1,
    docs: 4,
    status: "pending",
  },
  {
    id: "APR-3115",
    kind: "Entitlement change",
    payer: "AAR Insurance",
    payerId: "PYR-0161",
    maker: "Lily Tesfaye",
    submitted: "1d ago",
    priority: "Normal",
    tenants: 3,
    docs: 0,
    status: "pending",
  },
  {
    id: "APR-3110",
    kind: "Org details change",
    payer: "Britam Health",
    payerId: "PYR-0188",
    maker: "Amara Okeke",
    submitted: "1d ago",
    priority: "Low",
    tenants: 1,
    docs: 0,
    status: "pending",
  },
  {
    id: "APR-3104",
    kind: "Secondary tenant",
    payer: "Sanlam Health Solutions",
    payerId: "PYR-0131",
    maker: "Lily Tesfaye",
    submitted: "2d ago",
    priority: "Normal",
    tenants: 1,
    docs: 3,
    status: "pending",
  },
  {
    id: "APR-3099",
    kind: "Tenant onboarding",
    payer: "Equity Afia Care",
    payerId: "PYR-0212",
    maker: "David Kimani",
    submitted: "3d ago",
    priority: "High",
    tenants: 2,
    docs: 5,
    status: "approved",
  },
]

/* --------------------------------------------------------------- audit -- */

export const AUDIT_LOG: AuditEntry[] = [
  {
    when: "09:42",
    date: "08 Jun",
    actor: "Amara Okeke",
    role: "Platform Admin",
    action: "Submitted Tenant onboarding",
    target: "CIC Insurance Group · PYR-0205",
    kind: "create",
  },
  {
    when: "09:15",
    date: "08 Jun",
    actor: "System",
    role: "Provisioning",
    action: "Tenant resources provisioned",
    target: "jubilee-ug.ginja.ai",
    kind: "system",
  },
  {
    when: "08:58",
    date: "08 Jun",
    actor: "David Kimani",
    role: "Platform Approver",
    action: "Approved KYB documents (6/6)",
    target: "Equity Afia Care · PYR-0212",
    kind: "approve",
  },
  {
    when: "17:30",
    date: "07 Jun",
    actor: "Lily Tesfaye",
    role: "Platform Engineer",
    action: "Updated module registry — Reinsurance v1.6.0",
    target: "Module: reinsurance",
    kind: "edit",
  },
  {
    when: "16:04",
    date: "07 Jun",
    actor: "Amara Okeke",
    role: "Platform Admin",
    action: "Suspended Tenant account",
    target: "Radiant Insurance · PYR-0154",
    kind: "danger",
  },
  {
    when: "14:22",
    date: "07 Jun",
    actor: "David Kimani",
    role: "Platform Approver",
    action: "Returned submission — Information Required",
    target: "Strategis Insurance · PYR-0210",
    kind: "warn",
  },
  {
    when: "11:10",
    date: "07 Jun",
    actor: "Amara Okeke",
    role: "Platform Admin",
    action: "Edited Document template — Claim Settlement Letter v2.5",
    target: "DOC-CLS",
    kind: "edit",
  },
  {
    when: "10:01",
    date: "06 Jun",
    actor: "System",
    role: "Notification",
    action: "Tenant Admin invitation sent",
    target: "faith.wanjiru@jubilee.co.ke",
    kind: "system",
  },
]

export const STATUS_TONE: Record<string, StatusTone> = {
  Active: "active",
  Draft: "draft",
  Suspended: "suspended",
  Retired: "retired",
  "Pending Activation": "pending",
  "Pending Review": "pending",
}

/* ---------------------------------------------------------- onboarding -- */

/** Fillable sections (mirror the wizard, minus Review) — drive the draft cards.
    `specRole` is the specialty that naturally owns the section. Technical config
    moved out of onboarding into Tenant provisioning, so it's no longer here. */
export const ONB_SECTIONS: OnbSection[] = [
  {
    k: "primary",
    l: "Basic profile",
    short: "Profile",
    specRole: "Onboarding Specialist",
    icon: "building",
  },
  {
    k: "secondary",
    l: "Secondary tenants",
    short: "Branches",
    specRole: "Onboarding Specialist",
    icon: "gitBranch",
  },
  {
    k: "modules",
    l: "Module entitlements",
    short: "Modules",
    specRole: "Platform Engineer",
    icon: "layers",
  },
  {
    k: "billing",
    l: "Subscription & billing",
    short: "Billing",
    specRole: "Onboarding Specialist",
    icon: "creditCard",
  },
  {
    k: "documents",
    l: "KYC & documents",
    short: "KYC",
    specRole: "Compliance Officer",
    icon: "fileText",
  },
]

/* --------------------------------------------------------- wizard config -- */

export const RESERVED = ["www", "api", "admin", "app", "mail", "staging"]
export const SUBDOMAIN_TAKEN = ["jubilee", "britam", "aar"]

export const WIZ_STEPS: WizStep[] = [
  {
    k: "primary",
    l: "Basic profile",
    d: "Legal entity & contacts",
    owner: "profile",
  },
  {
    k: "secondary",
    l: "Secondary tenants",
    d: "Branches & subsidiaries",
    owner: "profile",
  },
  {
    k: "modules",
    l: "Module access",
    d: "Features for all tenants",
    owner: "profile",
  },
  {
    k: "billing",
    l: "Billing & terms",
    d: "Subscription model",
    owner: "profile",
  },
  {
    k: "documents",
    l: "KYC & documents",
    d: "Contract & KYB review",
    owner: "compliance",
  },
  { k: "review", l: "Review & submit", d: "Create in Draft", owner: "profile" },
]

export const STEP_INTRO: Record<WizStepKey, string> = {
  primary:
    "Capture the main legal entity that signs the commercial agreement. Subscription and billing are tied to this primary tenant.",
  secondary:
    "Add branches, subsidiaries or divisions that share this tenant's commercial arrangement but run isolated environments.",
  modules:
    "Select the modules and sub-modules this tenant is entitled to. Entitlements apply to the primary and every secondary tenant.",
  billing:
    "Set the subscription model and billing frequency. These are tied to the primary tenant only.",
  documents:
    "Upload the signed contract and KYB documents. Usually owned by Compliance. Files are stored as Pending Review on submission.",
  review:
    "Review the full submission. On submit, all records are created in a single transaction in Draft status.",
}

/* ===================================================== access & security == */
/**
 * Internal staff users, roles and the permission catalogue — ported from the
 * hi-fi "Access · Users" and "Access · Roles & permissions" screens.
 */

export type RolePaletteKey =
  | "iris"
  | "emerald"
  | "amber"
  | "sky"
  | "rose"
  | "violet"

export type Perm = {
  id: string
  label: string
  desc: string
  sensitive?: boolean
}

export type PermGroup = {
  id: string
  label: string
  icon: string
  desc: string
  perms: Perm[]
}

export type AccessRole = {
  id: string
  name: string
  system: boolean
  /** A palette key (RolePaletteKey) or a custom hex like "#E8590C". */
  color: string
  desc: string
  /** Perm ids, or `["*"]` for "every permission". */
  perms: string[]
}

export type UserStatus = "Active" | "Invited" | "Suspended" | "Deactivated"

export type AccessTone = "success" | "warning" | "info" | "neutral" | "error"

export type TimelineKind =
  | "invited"
  | "resent"
  | "accepted"
  | "revoked"
  | "role_added"
  | "role_removed"
  | "login"
  | "suspended"
  | "reactivated"
  | "scope_change"
  | "created"

export type TimelineEvent = {
  kind: TimelineKind | string
  when: string
  date: string
  by: string
  meta?: string
}

export type AccessUser = {
  id: string
  name: string
  email: string
  initials: string
  status: UserStatus
  roles: string[]
  lastActive: string
  addedBy: string
  joined: string
  mfa: boolean
  invitedAgo?: string
  expiresIn?: string
  inviteExpired?: boolean
  suspendReason?: string | null
  timeline: TimelineEvent[]
}

/** The full permission catalogue — 5 groups, 14 individual permissions. */
export const PERM_CATALOG: PermGroup[] = [
  {
    id: "tenants",
    label: "Tenant management",
    icon: "building",
    desc: "Onboarding and the lifecycle of tenant accounts.",
    perms: [
      {
        id: "tenants.view",
        label: "View tenants",
        desc: "See the directory and tenant records.",
      },
      {
        id: "tenants.create",
        label: "Onboard tenants",
        desc: "Start, fill and submit new onboarding.",
      },
      {
        id: "tenants.edit",
        label: "Edit tenant details",
        desc: "Change org details and entitlements.",
      },
      {
        id: "tenants.lifecycle",
        label: "Manage lifecycle",
        desc: "Suspend, reactivate and retire tenants.",
        sensitive: true,
      },
    ],
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: "shieldCheck",
    desc: "The maker-checker review queue.",
    perms: [
      {
        id: "approvals.view",
        label: "View approval queue",
        desc: "See pending and historical requests.",
      },
      {
        id: "approvals.decide",
        label: "Approve / reject",
        desc: "Make checker decisions on submissions.",
        sensitive: true,
      },
    ],
  },
  {
    id: "config",
    label: "Configuration library",
    icon: "layers",
    desc: "Modules, templates and pricing shared by tenants.",
    perms: [
      {
        id: "config.modules",
        label: "Manage module registry",
        desc: "Publish, version and sunset modules.",
      },
      {
        id: "config.templates",
        label: "Manage templates",
        desc: "Edit document, email & SMS templates.",
      },
      {
        id: "config.pricing",
        label: "Manage pricing & plans",
        desc: "Edit subscription models and tiers.",
        sensitive: true,
      },
    ],
  },
  {
    id: "access",
    label: "Access & security",
    icon: "key",
    desc: "Roles, users and platform-wide policy.",
    perms: [
      {
        id: "access.users",
        label: "Manage users",
        desc: "Invite, assign roles, suspend & remove.",
        sensitive: true,
      },
      {
        id: "access.roles",
        label: "Manage roles",
        desc: "Create and edit custom roles & scopes.",
        sensitive: true,
      },
      {
        id: "access.settings",
        label: "Manage platform settings",
        desc: "MFA, password, residency & provisioning.",
        sensitive: true,
      },
    ],
  },
  {
    id: "platform",
    label: "Observability",
    icon: "history",
    desc: "Read-only operational visibility.",
    perms: [
      {
        id: "platform.audit",
        label: "View audit log",
        desc: "Read the immutable platform audit trail.",
      },
      {
        id: "platform.export",
        label: "Export data",
        desc: "Export directories, logs and reports.",
      },
    ],
  },
]

export const ALL_PERMS: string[] = PERM_CATALOG.flatMap((g) =>
  g.perms.map((p) => p.id)
)
export const PERM_TOTAL = ALL_PERMS.length

export function permLabel(id: string): string {
  for (const g of PERM_CATALOG) {
    const p = g.perms.find((x) => x.id === id)
    if (p) return p.label
  }
  return id
}

/** Accent per role badge. `dot` is an HSL channel expression (or raw channels). */
export const ROLE_PALETTE: { id: RolePaletteKey; dot: string }[] = [
  { id: "iris", dot: "var(--primary)" },
  { id: "emerald", dot: "var(--success)" },
  { id: "amber", dot: "var(--warning)" },
  { id: "sky", dot: "var(--info)" },
  { id: "rose", dot: "var(--destructive)" },
  { id: "violet", dot: "262 83% 62%" },
]

/** Roles: 4 system (locked) + 4 custom (editable). */
export const ACCESS_ROLES: AccessRole[] = [
  {
    id: "platform_admin",
    name: "Platform Admin",
    system: true,
    color: "iris",
    desc: "Full administrative control of the platform. Maker in maker-checker.",
    perms: ["*"],
  },
  {
    id: "platform_approver",
    name: "Platform Approver",
    system: true,
    color: "emerald",
    desc: "Reviews and approves submissions. Checker — cannot approve own changes.",
    perms: [
      "tenants.view",
      "approvals.view",
      "approvals.decide",
      "config.modules",
      "config.templates",
      "config.pricing",
      "platform.audit",
    ],
  },
  {
    id: "platform_engineer",
    name: "Platform Engineer",
    system: true,
    color: "sky",
    desc: "Configures modules, registry and infrastructure. Tenants read-only.",
    perms: [
      "tenants.view",
      "config.modules",
      "access.settings",
      "platform.audit",
      "platform.export",
    ],
  },
  {
    id: "read_only",
    name: "Read-only (Support)",
    system: true,
    color: "amber",
    desc: "View-only access across the console for support staff.",
    perms: ["tenants.view", "approvals.view", "platform.audit"],
  },
  {
    id: "onboarding_specialist",
    name: "Onboarding Specialist",
    system: false,
    color: "violet",
    desc: "Owns tenant onboarding end-to-end without lifecycle or billing authority.",
    perms: [
      "tenants.view",
      "tenants.create",
      "tenants.edit",
      "config.templates",
      "platform.audit",
    ],
  },
  {
    id: "compliance_officer",
    name: "Compliance Officer",
    system: false,
    color: "rose",
    desc: "KYB review and document verification. Read access to audit & approvals.",
    perms: [
      "tenants.view",
      "approvals.view",
      "platform.audit",
      "platform.export",
    ],
  },
  {
    id: "billing_manager",
    name: "Billing Manager",
    system: false,
    color: "emerald",
    desc: "Manages pricing, plans and subscription configuration.",
    perms: [
      "tenants.view",
      "config.pricing",
      "platform.audit",
      "platform.export",
    ],
  },
  {
    id: "support_agent",
    name: "Support Agent",
    system: false,
    color: "#E8590C",
    desc: "Front-line support across the whole team. Read-only tenant & approval visibility.",
    perms: ["tenants.view", "approvals.view"],
  },
]

export const roleById = (id: string): AccessRole | undefined =>
  ACCESS_ROLES.find((r) => r.id === id)

export const rolePermCount = (r: AccessRole): number =>
  r.perms.includes("*") ? PERM_TOTAL : r.perms.length

/* ===================== My Account (self-service) =========================
   Mock data for the signed-in user's own profile / security center. There is
   no backend endpoint for self-service yet, so these mirror the hi-fi `MY_*`
   block verbatim (sessions, security activity, role grants). */

export type MySession = {
  id: string
  browser: string
  os: string
  device: string
  ip: string
  loc: string
  started: string
  /** "Active now" / "3 hr ago" / … */
  lastSeen: string
  /** This is the device the user is currently signed in from. */
  current: boolean
  /** Set once the session has been signed out from the UI. */
  ended?: boolean
}

export const MY_SESSIONS: MySession[] = [
  {
    id: "MSE-01",
    browser: "Chrome 126",
    os: "macOS 14.5",
    device: "MacBook Pro",
    ip: "197.232.14.8",
    loc: "Nairobi, KE",
    started: "25 Jun · 08:02",
    lastSeen: "Active now",
    current: true,
  },
  {
    id: "MSE-02",
    browser: "Safari 17",
    os: "iOS 17.5",
    device: "iPhone 15",
    ip: "197.232.61.140",
    loc: "Nairobi, KE",
    started: "24 Jun · 19:40",
    lastSeen: "3 hr ago",
    current: false,
  },
  {
    id: "MSE-03",
    browser: "Chrome 125",
    os: "Windows 11",
    device: "Office desktop",
    ip: "102.134.88.3",
    loc: "Mombasa, KE",
    started: "21 Jun · 09:12",
    lastSeen: "4 days ago",
    current: false,
  },
]

export type MyActivityKind = "login" | "mfa" | "password"

export type MyActivity = {
  kind: MyActivityKind
  /** false → a failed/denied event, rendered with an alert glyph. */
  ok: boolean
  label: string
  detail: string
  ip: string
  when: string
}

export const MY_ACTIVITY: MyActivity[] = [
  {
    kind: "login",
    ok: true,
    label: "Signed in",
    detail: "Chrome on macOS · Nairobi, KE",
    ip: "197.232.14.8",
    when: "Today · 08:02",
  },
  {
    kind: "login",
    ok: false,
    label: "Failed sign-in",
    detail: "Wrong password · Chrome on Windows",
    ip: "41.90.7.55",
    when: "Yesterday · 22:14",
  },
  {
    kind: "mfa",
    ok: true,
    label: "MFA verified",
    detail: "Authenticator app",
    ip: "197.232.14.8",
    when: "24 Jun · 19:40",
  },
  {
    kind: "password",
    ok: true,
    label: "Password changed",
    detail: "From My account → Password",
    ip: "197.232.14.8",
    when: "12 May · 09:14",
  },
  {
    kind: "login",
    ok: true,
    label: "Signed in",
    detail: "Safari on iOS · Nairobi, KE",
    ip: "197.232.61.140",
    when: "21 Jun · 07:30",
  },
  {
    kind: "mfa",
    ok: true,
    label: "Backup codes generated",
    detail: "10 new single-use codes",
    ip: "197.232.14.8",
    when: "02 Apr · 10:11",
  },
]

export const MY_ACTIVITY_KIND: Record<
  MyActivityKind,
  { icon: string; tone: AccessTone }
> = {
  login: { icon: "logOut", tone: "neutral" },
  mfa: { icon: "key", tone: "success" },
  password: { icon: "lock", tone: "success" },
}

/** A role held by the signed-in user, with grant provenance. */
export type MyRoleGrant = {
  /** AccessRole id — resolved via roleById for name/desc/perms/colour. */
  id: string
  grantedBy: string
  when: string
  note?: string
}

export const MY_ROLES: MyRoleGrant[] = [
  {
    id: "platform_admin",
    grantedBy: "System (founder)",
    when: "10 Jan 2026",
    note: "Initial platform owner",
  },
  {
    id: "compliance_officer",
    grantedBy: "Amara Okeke",
    when: "14 Mar 2026",
    note: "Added for KYB review coverage",
  },
]

export const USER_STATUS_TONE: Record<UserStatus, AccessTone> = {
  Active: "success",
  Invited: "info",
  Suspended: "warning",
  Deactivated: "error",
}

/** Timeline event kinds → icon name + tone + label. */
export const TL_KIND: Record<
  string,
  { icon: string; tone: AccessTone; label: string }
> = {
  invited: { icon: "mail", tone: "info", label: "Invitation sent" },
  resent: { icon: "rotateCcw", tone: "info", label: "Invitation resent" },
  accepted: {
    icon: "userCheck",
    tone: "success",
    label: "Invitation accepted",
  },
  revoked: { icon: "ban", tone: "error", label: "Invitation revoked" },
  role_added: { icon: "plus", tone: "success", label: "Role assigned" },
  role_removed: { icon: "minus", tone: "warning", label: "Role unassigned" },
  login: { icon: "logIn", tone: "neutral", label: "Signed in" },
  suspended: { icon: "pause", tone: "warning", label: "Account suspended" },
  reactivated: { icon: "play", tone: "success", label: "Account reactivated" },
  scope_change: { icon: "globe", tone: "neutral", label: "Scope changed" },
  created: { icon: "sparkles", tone: "neutral", label: "User created" },
}

export const ACCESS_USERS: AccessUser[] = [
  {
    id: "USR-001",
    name: "Amara Okeke",
    email: "amara.okeke@ginja.ai",
    initials: "AO",
    status: "Active",
    roles: ["platform_admin"],
    lastActive: "2 min ago",
    addedBy: "System",
    joined: "12 Jan 2026",
    mfa: true,
    timeline: [
      { kind: "login", when: "09:48", date: "08 Jun 2026", by: "Amara Okeke" },
      {
        kind: "role_added",
        when: "10:02",
        date: "12 Jan 2026",
        by: "System",
        meta: "Platform Admin",
      },
      {
        kind: "accepted",
        when: "09:58",
        date: "12 Jan 2026",
        by: "Amara Okeke",
      },
      { kind: "invited", when: "16:20", date: "11 Jan 2026", by: "System" },
    ],
  },
  {
    id: "USR-002",
    name: "David Kimani",
    email: "david.kimani@ginja.ai",
    initials: "DK",
    status: "Active",
    roles: ["platform_approver", "compliance_officer", "support_agent"],
    lastActive: "1 hr ago",
    addedBy: "Amara Okeke",
    joined: "20 Jan 2026",
    mfa: true,
    timeline: [
      { kind: "login", when: "08:30", date: "08 Jun 2026", by: "David Kimani" },
      {
        kind: "role_added",
        when: "11:15",
        date: "02 Mar 2026",
        by: "Amara Okeke",
        meta: "Compliance Officer",
      },
      {
        kind: "role_added",
        when: "09:20",
        date: "20 Jan 2026",
        by: "Amara Okeke",
        meta: "Platform Approver",
      },
      {
        kind: "accepted",
        when: "09:12",
        date: "20 Jan 2026",
        by: "David Kimani",
      },
      {
        kind: "invited",
        when: "14:40",
        date: "18 Jan 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-003",
    name: "Lily Tesfaye",
    email: "lily.tesfaye@ginja.ai",
    initials: "LT",
    status: "Active",
    roles: ["platform_engineer"],
    lastActive: "3 hr ago",
    addedBy: "Amara Okeke",
    joined: "01 Feb 2026",
    mfa: true,
    timeline: [
      { kind: "login", when: "06:50", date: "08 Jun 2026", by: "Lily Tesfaye" },
      {
        kind: "role_added",
        when: "10:30",
        date: "01 Feb 2026",
        by: "Amara Okeke",
        meta: "Platform Engineer",
      },
      {
        kind: "accepted",
        when: "10:22",
        date: "01 Feb 2026",
        by: "Lily Tesfaye",
      },
      {
        kind: "invited",
        when: "09:00",
        date: "30 Jan 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-004",
    name: "Fatima Hassan",
    email: "fatima.hassan@ginja.ai",
    initials: "FH",
    status: "Active",
    roles: ["onboarding_specialist", "support_agent"],
    lastActive: "Yesterday",
    addedBy: "Amara Okeke",
    joined: "14 Feb 2026",
    mfa: true,
    timeline: [
      {
        kind: "role_added",
        when: "11:00",
        date: "14 Feb 2026",
        by: "Amara Okeke",
        meta: "Onboarding Specialist",
      },
      {
        kind: "accepted",
        when: "10:51",
        date: "14 Feb 2026",
        by: "Fatima Hassan",
      },
      {
        kind: "invited",
        when: "15:30",
        date: "13 Feb 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-005",
    name: "Kwame Mensah",
    email: "kwame.mensah@ginja.ai",
    initials: "KM",
    status: "Invited",
    roles: ["platform_engineer"],
    lastActive: "—",
    addedBy: "Amara Okeke",
    joined: "—",
    mfa: false,
    invitedAgo: "2 days ago",
    expiresIn: "5 days",
    timeline: [
      {
        kind: "invited",
        when: "11:20",
        date: "06 Jun 2026",
        by: "Amara Okeke",
        meta: "Platform Engineer",
      },
    ],
  },
  {
    id: "USR-006",
    name: "Naledi Dube",
    email: "naledi.dube@ginja.ai",
    initials: "ND",
    status: "Invited",
    roles: ["compliance_officer"],
    lastActive: "—",
    addedBy: "David Kimani",
    joined: "—",
    mfa: false,
    invitedAgo: "9 days ago",
    expiresIn: "expired",
    inviteExpired: true,
    timeline: [
      {
        kind: "revoked",
        when: "00:00",
        date: "07 Jun 2026",
        by: "System",
        meta: "Invitation expired (not accepted in time)",
      },
      {
        kind: "resent",
        when: "09:10",
        date: "07 Jun 2026",
        by: "David Kimani",
      },
      {
        kind: "invited",
        when: "16:00",
        date: "02 Jun 2026",
        by: "David Kimani",
        meta: "Compliance Officer",
      },
    ],
  },
  {
    id: "USR-007",
    name: "Brian Nshuti",
    email: "brian.nshuti@ginja.ai",
    initials: "BN",
    status: "Suspended",
    roles: ["read_only"],
    lastActive: "12 days ago",
    addedBy: "Amara Okeke",
    joined: "05 Mar 2026",
    mfa: true,
    suspendReason: "Extended leave of absence",
    timeline: [
      {
        kind: "suspended",
        when: "14:02",
        date: "27 May 2026",
        by: "Amara Okeke",
        meta: "Extended leave of absence",
      },
      {
        kind: "login",
        when: "08:40",
        date: "27 May 2026",
        by: "Brian Nshuti",
      },
      {
        kind: "role_added",
        when: "09:30",
        date: "05 Mar 2026",
        by: "Amara Okeke",
        meta: "Read-only (Support)",
      },
      {
        kind: "accepted",
        when: "09:22",
        date: "05 Mar 2026",
        by: "Brian Nshuti",
      },
      {
        kind: "invited",
        when: "11:10",
        date: "04 Mar 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-008",
    name: "Grace Wanjiku",
    email: "grace.wanjiku@ginja.ai",
    initials: "GW",
    status: "Active",
    roles: ["billing_manager", "support_agent", "compliance_officer"],
    lastActive: "5 hr ago",
    addedBy: "Amara Okeke",
    joined: "18 Mar 2026",
    mfa: true,
    timeline: [
      {
        kind: "login",
        when: "04:30",
        date: "08 Jun 2026",
        by: "Grace Wanjiku",
      },
      {
        kind: "role_added",
        when: "10:00",
        date: "12 Apr 2026",
        by: "Amara Okeke",
        meta: "Billing Manager",
      },
      {
        kind: "role_added",
        when: "09:35",
        date: "18 Mar 2026",
        by: "Amara Okeke",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "09:30",
        date: "18 Mar 2026",
        by: "Grace Wanjiku",
      },
      {
        kind: "invited",
        when: "14:00",
        date: "17 Mar 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-009",
    name: "Joseph Otieno",
    email: "joseph.otieno@ginja.ai",
    initials: "JO",
    status: "Active",
    roles: ["support_agent"],
    lastActive: "20 min ago",
    addedBy: "David Kimani",
    joined: "02 Apr 2026",
    mfa: true,
    timeline: [
      {
        kind: "role_added",
        when: "10:10",
        date: "02 Apr 2026",
        by: "David Kimani",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "10:02",
        date: "02 Apr 2026",
        by: "Joseph Otieno",
      },
      {
        kind: "invited",
        when: "09:00",
        date: "01 Apr 2026",
        by: "David Kimani",
      },
    ],
  },
  {
    id: "USR-010",
    name: "Aisha Bello",
    email: "aisha.bello@ginja.ai",
    initials: "AB",
    status: "Active",
    roles: ["support_agent", "onboarding_specialist"],
    lastActive: "1 hr ago",
    addedBy: "Amara Okeke",
    joined: "15 Apr 2026",
    mfa: true,
    timeline: [
      {
        kind: "role_added",
        when: "11:30",
        date: "20 Apr 2026",
        by: "Amara Okeke",
        meta: "Onboarding Specialist",
      },
      {
        kind: "role_added",
        when: "09:20",
        date: "15 Apr 2026",
        by: "Amara Okeke",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "09:14",
        date: "15 Apr 2026",
        by: "Aisha Bello",
      },
      {
        kind: "invited",
        when: "16:00",
        date: "14 Apr 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-011",
    name: "Tendai Moyo",
    email: "tendai.moyo@ginja.ai",
    initials: "TM",
    status: "Active",
    roles: ["support_agent"],
    lastActive: "Yesterday",
    addedBy: "David Kimani",
    joined: "28 Apr 2026",
    mfa: false,
    timeline: [
      {
        kind: "role_added",
        when: "14:00",
        date: "28 Apr 2026",
        by: "David Kimani",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "13:52",
        date: "28 Apr 2026",
        by: "Tendai Moyo",
      },
      {
        kind: "invited",
        when: "10:00",
        date: "27 Apr 2026",
        by: "David Kimani",
      },
    ],
  },
  {
    id: "USR-012",
    name: "Sarah Mwangi",
    email: "sarah.mwangi@ginja.ai",
    initials: "SM",
    status: "Active",
    roles: ["support_agent"],
    lastActive: "4 hr ago",
    addedBy: "Amara Okeke",
    joined: "05 May 2026",
    mfa: true,
    timeline: [
      {
        kind: "role_added",
        when: "09:00",
        date: "05 May 2026",
        by: "Amara Okeke",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "08:55",
        date: "05 May 2026",
        by: "Sarah Mwangi",
      },
      {
        kind: "invited",
        when: "15:00",
        date: "04 May 2026",
        by: "Amara Okeke",
      },
    ],
  },
  {
    id: "USR-013",
    name: "Emeka Nwosu",
    email: "emeka.nwosu@ginja.ai",
    initials: "EN",
    status: "Active",
    roles: ["support_agent"],
    lastActive: "2 days ago",
    addedBy: "David Kimani",
    joined: "12 May 2026",
    mfa: true,
    timeline: [
      {
        kind: "role_added",
        when: "11:00",
        date: "12 May 2026",
        by: "David Kimani",
        meta: "Support Agent",
      },
      {
        kind: "accepted",
        when: "10:51",
        date: "12 May 2026",
        by: "Emeka Nwosu",
      },
      {
        kind: "invited",
        when: "09:30",
        date: "11 May 2026",
        by: "David Kimani",
      },
    ],
  },
]

export const usersWithRole = (roleId: string): AccessUser[] =>
  ACCESS_USERS.filter((u) => u.roles.includes(roleId))

/* ---- Active sessions per user (admin monitoring) ---------------------------
   Each session: device, browser, os, ip, location, started, lastSeen, current. */
export type UserSession = {
  id: string
  browser: string
  os: string
  device: string
  ip: string
  loc: string
  started: string
  lastSeen: string
  current: boolean
}

export const USER_SESSIONS: Record<string, UserSession[]> = {
  "USR-001": [
    {
      id: "SES-9001",
      browser: "Chrome 126",
      os: "macOS 14.5",
      device: "MacBook Pro",
      ip: "197.232.14.8",
      loc: "Nairobi, KE",
      started: "08 Jun · 08:02",
      lastSeen: "2 min ago",
      current: true,
    },
    {
      id: "SES-9002",
      browser: "Safari 17",
      os: "iOS 17.5",
      device: "iPhone 15",
      ip: "197.232.61.140",
      loc: "Nairobi, KE",
      started: "07 Jun · 19:40",
      lastSeen: "3 hr ago",
      current: false,
    },
  ],
  "USR-002": [
    {
      id: "SES-9010",
      browser: "Firefox 127",
      os: "Windows 11",
      device: "ThinkPad X1",
      ip: "102.89.34.22",
      loc: "Lagos, NG",
      started: "08 Jun · 07:15",
      lastSeen: "1 hr ago",
      current: true,
    },
  ],
  "USR-003": [
    {
      id: "SES-9020",
      browser: "Chrome 126",
      os: "Ubuntu 24.04",
      device: "Dell XPS",
      ip: "154.72.9.180",
      loc: "Addis Ababa, ET",
      started: "08 Jun · 06:30",
      lastSeen: "3 hr ago",
      current: true,
    },
    {
      id: "SES-9021",
      browser: "Chrome 125",
      os: "Android 14",
      device: "Pixel 8",
      ip: "154.72.40.61",
      loc: "Addis Ababa, ET",
      started: "05 Jun · 11:05",
      lastSeen: "2 days ago",
      current: false,
    },
  ],
  "USR-004": [
    {
      id: "SES-9030",
      browser: "Edge 126",
      os: "Windows 11",
      device: "Surface Laptop",
      ip: "41.90.7.55",
      loc: "Mombasa, KE",
      started: "07 Jun · 09:50",
      lastSeen: "Yesterday",
      current: true,
    },
  ],
  "USR-008": [
    {
      id: "SES-9040",
      browser: "Chrome 126",
      os: "macOS 14.4",
      device: "iMac",
      ip: "197.232.18.9",
      loc: "Nairobi, KE",
      started: "08 Jun · 04:25",
      lastSeen: "5 hr ago",
      current: true,
    },
    {
      id: "SES-9041",
      browser: "Safari 17",
      os: "iPadOS 17.5",
      device: "iPad Air",
      ip: "105.163.2.71",
      loc: "Nairobi, KE",
      started: "06 Jun · 20:10",
      lastSeen: "2 days ago",
      current: false,
    },
    {
      id: "SES-9042",
      browser: "Chrome 126",
      os: "Windows 10",
      device: "HP EliteBook",
      ip: "102.134.88.3",
      loc: "Kampala, UG",
      started: "04 Jun · 13:30",
      lastSeen: "4 days ago",
      current: false,
    },
  ],
  "USR-009": [
    {
      id: "SES-9050",
      browser: "Chrome 126",
      os: "Android 14",
      device: "Samsung S24",
      ip: "154.118.22.40",
      loc: "Kisumu, KE",
      started: "08 Jun · 09:40",
      lastSeen: "20 min ago",
      current: true,
    },
  ],
  "USR-010": [
    {
      id: "SES-9060",
      browser: "Chrome 126",
      os: "Windows 11",
      device: "Acer Swift",
      ip: "102.89.41.7",
      loc: "Lagos, NG",
      started: "08 Jun · 08:55",
      lastSeen: "1 hr ago",
      current: true,
    },
  ],
  "USR-012": [
    {
      id: "SES-9070",
      browser: "Safari 17",
      os: "macOS 14.5",
      device: "MacBook Air",
      ip: "197.232.90.12",
      loc: "Nairobi, KE",
      started: "08 Jun · 05:30",
      lastSeen: "4 hr ago",
      current: true,
    },
  ],
  "USR-013": [
    {
      id: "SES-9080",
      browser: "Firefox 127",
      os: "Ubuntu 22.04",
      device: "Lenovo Yoga",
      ip: "154.72.55.99",
      loc: "Dar es Salaam, TZ",
      started: "06 Jun · 10:00",
      lastSeen: "2 days ago",
      current: true,
    },
  ],
}

/** Sessions for a single user (empty when none). */
export const userSessions = (id: string): UserSession[] =>
  USER_SESSIONS[id] ?? []

/** Users that currently have at least one active session. */
export const SESSION_USERS: AccessUser[] = ACCESS_USERS.filter(
  (u) => userSessions(u.id).length > 0
)

/** The date a user first logged in (acceptance → invite → join, in that order). */
export const firstLoginOf = (u: AccessUser): string =>
  (
    u.timeline?.find((t) => t.kind === "accepted") ||
    u.timeline?.find((t) => t.kind === "invited")
  )?.date || u.joined

/* ---- MFA enrolment status per user (admin monitoring) ----------------------
   enabled: methods[] + backupCodes remaining + enabledOn. not configured: [] */
export type MfaMethod = "totp" | "email"
export type MfaRecord = {
  methods: MfaMethod[]
  backupCodes: number | null
  enabledOn: string | null
}

export const MFA_STATUS: Record<string, MfaRecord> = {
  "USR-001": {
    methods: ["totp", "email"],
    backupCodes: 8,
    enabledOn: "12 Jan 2026 · 09:14",
  },
  "USR-002": {
    methods: ["totp"],
    backupCodes: 3,
    enabledOn: "20 Jan 2026 · 11:02",
  },
  "USR-003": {
    methods: ["totp", "email"],
    backupCodes: 10,
    enabledOn: "01 Feb 2026 · 08:40",
  },
  "USR-004": {
    methods: ["email"],
    backupCodes: 0,
    enabledOn: "14 Feb 2026 · 15:50",
  },
  "USR-005": { methods: [], backupCodes: null, enabledOn: null }, // Invited
  "USR-006": { methods: [], backupCodes: null, enabledOn: null }, // Invited (expired)
  "USR-007": {
    methods: ["totp"],
    backupCodes: 5,
    enabledOn: "05 Mar 2026 · 09:30",
  }, // Suspended
  "USR-008": {
    methods: ["totp", "email"],
    backupCodes: 9,
    enabledOn: "18 Mar 2026 · 09:35",
  },
  "USR-009": {
    methods: ["totp"],
    backupCodes: 6,
    enabledOn: "02 Apr 2026 · 10:10",
  },
  "USR-010": {
    methods: ["totp", "email"],
    backupCodes: 7,
    enabledOn: "15 Apr 2026 · 09:20",
  },
  "USR-011": { methods: [], backupCodes: null, enabledOn: null }, // mfa: false
  "USR-012": {
    methods: ["email"],
    backupCodes: 2,
    enabledOn: "05 May 2026 · 09:05",
  },
  "USR-013": {
    methods: ["totp"],
    backupCodes: 10,
    enabledOn: "12 May 2026 · 11:00",
  },
}

export const MFA_METHOD_LABEL: Record<MfaMethod, string> = {
  totp: "Authenticator app",
  email: "Email OTP",
}

export const mfaOf = (id: string): MfaRecord =>
  MFA_STATUS[id] ?? { methods: [], backupCodes: null, enabledOn: null }
export const mfaEnabled = (id: string): boolean => mfaOf(id).methods.length > 0

/* ---- Password status per user (90-day rotation policy) ---------------------
   status derived from daysLeft: <0 expired · <=14 expiring soon · else ok.
   Invited users have no password yet (pending). */
export type PasswordRecord =
  | { pending: true; lastChanged?: undefined; daysLeft?: undefined }
  | { pending?: false; lastChanged: string; daysLeft: number }

export const PASSWORD_STATUS: Record<string, PasswordRecord> = {
  "USR-001": { lastChanged: "02 Apr 2026 · 09:14", daysLeft: 23 },
  "USR-002": { lastChanged: "11 Mar 2026 · 11:02", daysLeft: 1 },
  "USR-003": { lastChanged: "01 Feb 2026 · 08:40", daysLeft: 58 },
  "USR-004": { lastChanged: "20 Feb 2026 · 15:50", daysLeft: -4 },
  "USR-005": { pending: true }, // Invited — no password yet
  "USR-006": { pending: true }, // Invited (expired)
  "USR-007": { lastChanged: "05 Mar 2026 · 09:30", daysLeft: 11 },
  "USR-008": { lastChanged: "28 Mar 2026 · 09:35", daysLeft: 19 },
  "USR-009": { lastChanged: "02 Apr 2026 · 10:10", daysLeft: 24 },
  "USR-010": { lastChanged: "15 Apr 2026 · 09:20", daysLeft: 37 },
  "USR-011": { lastChanged: "10 Feb 2026 · 14:00", daysLeft: -26 },
  "USR-012": { lastChanged: "05 May 2026 · 09:05", daysLeft: 57 },
  "USR-013": { lastChanged: "12 May 2026 · 11:00", daysLeft: 64 },
}

export const PWD_POLICY_DAYS = 90
export const pwdOf = (id: string): PasswordRecord =>
  PASSWORD_STATUS[id] ?? { pending: true }

/* A blank wizard seed — "Onboard tenant" must open an empty form, not demo
   data. Only neutral UI defaults are kept (tenant type radio, billing
   frequency); every identity/contact field starts empty. One empty Primary
   Tenant Admin contact is seeded so its card renders ready to fill. */
export const BASE_FORM: OnboardingForm = {
  legal: "",
  trading: "",
  contact: "",
  email: "",
  country: "",
  region: "",
  type: "Insurer",
  subdomain: "",
  isolation: "dedicated",
  sso: "None",
  customDomain: "",
  tax: "",
  contacts: [{ name: "", email: "", role: "", phone: "" }],
  address: "",
  website: "",
  secondaries: [],
  // Start empty — Step 3 selects from the live module catalogue (real codes).
  modules: {},
  pricingStructureId: null,
  model: "",
  freq: "Monthly",
  freeTrialDays: "",
  contractStart: "",
  contractEnd: "",
  documents: [],
}

/* ===================================================================== staff */
/* Internal staff roster — shared by Tenant provisioning and (later) the      */
/* onboarding team-assignment feature. Role drives the avatar tone.           */

export type StaffRole =
  | "Onboarding Specialist"
  | "Platform Engineer"
  | "Compliance Officer"

/** Avatar tone per staff role: iris = onboarding, emerald = engineer, amber = compliance. */
export type RoleTone = "iris" | "emerald" | "amber"

export type Staff = {
  id: string
  name: string
  initials: string
  role: StaffRole
}

export const STAFF: Staff[] = [
  {
    id: "amara",
    name: "Amara Okeke",
    initials: "AO",
    role: "Onboarding Specialist",
  },
  {
    id: "fatima",
    name: "Fatima Hassan",
    initials: "FH",
    role: "Onboarding Specialist",
  },
  {
    id: "lily",
    name: "Lily Tesfaye",
    initials: "LT",
    role: "Platform Engineer",
  },
  {
    id: "kwame",
    name: "Kwame Mensah",
    initials: "KM",
    role: "Platform Engineer",
  },
  {
    id: "tunde",
    name: "Tunde Adeyemi",
    initials: "TA",
    role: "Platform Engineer",
  },
  {
    id: "david",
    name: "David Kimani",
    initials: "DK",
    role: "Compliance Officer",
  },
  {
    id: "naledi",
    name: "Naledi Dube",
    initials: "ND",
    role: "Compliance Officer",
  },
]

export const STAFF_BY_ID: Record<string, Staff> = Object.fromEntries(
  STAFF.map((p) => [p.id, p])
)

export const ROLE_TONE: Record<StaffRole, RoleTone> = {
  "Onboarding Specialist": "iris",
  "Platform Engineer": "emerald",
  "Compliance Officer": "amber",
}

/* ============================================================== provisioning */
/* Technical setup for approved tenants: database, domains, SMS, email and     */
/* data migration — configured, tested and then activated by a Platform        */
/* Engineer. (This work used to live as the onboarding wizard's "Technical     */
/* config" step; v2 promotes it to its own queue.)                             */

export type ProvSectionKey =
  | "database"
  | "domains"
  | "sms"
  | "email"
  | "migration"

export type ProvSectionStatus =
  | "done"
  | "tested"
  | "progress"
  | "failed"
  | "todo"

export type ProvStage =
  | "Awaiting start"
  | "In progress"
  | "Blocked"
  | "Ready to activate"

/** Tone used by provisioning status / stage pills (superset of StatusTone). */
export type ProvTone = "success" | "warning" | "error" | "neutral" | "info"

export type ProvRemarkSeverity = "action" | "note"

export type ProvRemark = {
  id: string
  section: ProvSectionKey
  by: string
  initials: string
  when: string
  severity: ProvRemarkSeverity
  status: "open" | "resolved"
  text: string
}

export type ProvSection = {
  k: ProvSectionKey
  l: string
  short: string
  icon: string
  desc: string
}

export type ProvProvider = {
  id: string
  name: string
  default?: boolean
  hint?: string
  regions?: string[]
}

export type DbConfig = {
  provider: string
  region: string
  providerName: string
  host: string
  tested: boolean
  tables: boolean
}
export type DomainsConfig = {
  subdomain: string
  custom: string
  cnameVerified: boolean
  ssl: "todo" | "pending" | "active"
}
export type SmsConfig = { provider: string; senderId: string; tested: boolean }
export type EmailConfig = {
  provider: string
  from: string
  spf: boolean
  dkim: boolean
  tested: boolean
}
export type MigrationConfig = {
  source: string
  status: "todo" | "done"
  records: number
}

export type ProvConfig = {
  database: DbConfig
  domains: DomainsConfig
  sms: SmsConfig
  email: EmailConfig
  migration: MigrationConfig
}

export type ProvisioningRecord = {
  id: string
  tenantId: string
  name: string
  country: string
  region: string
  type: string
  modules: number
  approvedOn: string
  engineer: string
  stage: ProvStage
  remarks?: ProvRemark[]
  sections: Record<ProvSectionKey, ProvSectionStatus>
  config: ProvConfig
}

export const PROV_SECTIONS: ProvSection[] = [
  {
    k: "database",
    l: "Database & storage",
    short: "Database",
    icon: "database",
    desc: "Provider, data-storage location, connection & schema",
  },
  {
    k: "domains",
    l: "Domains & SSL",
    short: "Domains",
    icon: "globe",
    desc: "Subdomain, custom domain & certificate",
  },
  {
    k: "sms",
    l: "SMS provider",
    short: "SMS",
    icon: "messageSquare",
    desc: "Gateway, credentials & sender ID",
  },
  {
    k: "email",
    l: "Email provider",
    short: "Email",
    icon: "mail",
    desc: "Transactional email & domain auth",
  },
  {
    k: "migration",
    l: "Data migration",
    short: "Migration",
    icon: "rotateCcw",
    desc: "Import legacy data & verify counts",
  },
]

export const DB_PROVIDERS: ProvProvider[] = [
  {
    id: "rds",
    name: "AWS RDS (PostgreSQL)",
    default: true,
    regions: [
      "af-south-1 · Cape Town",
      "eu-west-1 · Ireland",
      "me-south-1 · Bahrain",
    ],
  },
  {
    id: "aurora",
    name: "AWS Aurora",
    default: false,
    regions: [
      "af-south-1 · Cape Town",
      "eu-west-1 · Ireland",
      "me-south-1 · Bahrain",
    ],
  },
  {
    id: "aos",
    name: "AOS Managed Postgres",
    default: false,
    regions: [
      "af-east-1 · Nairobi",
      "af-south-1 · Cape Town",
      "af-west-1 · Lagos",
    ],
  },
  {
    id: "azuresql",
    name: "Azure Database",
    default: false,
    regions: ["southafricanorth · Johannesburg", "westeurope · Amsterdam"],
  },
  { id: "self", name: "Self-managed", default: false, regions: [] },
]

export const SMS_PROVIDERS: ProvProvider[] = [
  {
    id: "twilio",
    name: "Twilio",
    default: true,
    hint: "Global SMS — default gateway",
  },
  { id: "pindo", name: "Pindo", default: false, hint: "East Africa optimised" },
  {
    id: "at",
    name: "Africa's Talking",
    default: false,
    hint: "Pan-African coverage",
  },
  {
    id: "infobip",
    name: "Infobip",
    default: false,
    hint: "Enterprise routing",
  },
]

export const EMAIL_PROVIDERS: ProvProvider[] = [
  {
    id: "resend",
    name: "Resend",
    default: true,
    hint: "Default transactional email",
  },
  {
    id: "ses",
    name: "Amazon SES",
    default: false,
    hint: "High-volume, low cost",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    default: false,
    hint: "Marketing + transactional",
  },
  {
    id: "postmark",
    name: "Postmark",
    default: false,
    hint: "Fast transactional",
  },
]

/** Per-section status → label + tone. */
export const PROV_STATUS: Record<
  ProvSectionStatus,
  { lab: string; tone: ProvTone }
> = {
  done: { lab: "Provisioned", tone: "success" },
  tested: { lab: "Tested", tone: "success" },
  progress: { lab: "In progress", tone: "warning" },
  failed: { lab: "Failed", tone: "error" },
  todo: { lab: "Not started", tone: "neutral" },
}

export const PROV_STAGE_TONE: Record<ProvStage, ProvTone> = {
  "Awaiting start": "neutral",
  "In progress": "warning",
  Blocked: "error",
  "Ready to activate": "success",
}

/** Subdomains already claimed by other tenants — drives the availability check. */
export const TAKEN_SUBDOMAINS = [
  "jubilee",
  "britam",
  "aar",
  "sanlam",
  "old-mutual",
]

/** Staff ids eligible to be assigned as provisioning engineers. */
export const PROV_ENGINEERS = ["lily", "kwame", "tunde"]

export const PROVISIONING: ProvisioningRecord[] = [
  {
    id: "PRV-3041",
    tenantId: "PYR-0192",
    name: "CIC Insurance Group",
    country: "Kenya",
    region: "af-east-1",
    type: "Insurer",
    modules: 5,
    approvedOn: "08 Jun 2026",
    engineer: "lily",
    stage: "In progress",
    remarks: [
      {
        id: "RMK-101",
        section: "domains",
        by: "Zola Mbeki",
        initials: "ZM",
        when: "08 Jun · 10:24",
        severity: "action",
        status: "open",
        text: "Custom domain health.cic.co.ke still resolves to the legacy portal. Ask the tenant to update the CNAME to cic-health.ginja.ai, then re-run verification before activation.",
      },
      {
        id: "RMK-100",
        section: "database",
        by: "Zola Mbeki",
        initials: "ZM",
        when: "08 Jun · 09:50",
        severity: "note",
        status: "resolved",
        text: "Connection user has DDL rights on the whole cluster — consider a scoped app user. Fine for go-live; revisit post-activation.",
      },
    ],
    sections: {
      database: "tested",
      domains: "progress",
      sms: "todo",
      email: "done",
      migration: "todo",
    },
    config: {
      database: {
        provider: "rds",
        region: "af-south-1 · Cape Town",
        providerName: "",
        host: "cic-health.cluster-xyz.af-south-1.rds.amazonaws.com",
        tested: true,
        tables: false,
      },
      domains: {
        subdomain: "cic-health",
        custom: "health.cic.co.ke",
        cnameVerified: false,
        ssl: "pending",
      },
      sms: { provider: "twilio", senderId: "", tested: false },
      email: {
        provider: "resend",
        from: "no-reply@cic-health.ginja.ai",
        spf: true,
        dkim: true,
        tested: true,
      },
      migration: { source: "Legacy SQL export", status: "todo", records: 0 },
    },
  },
  {
    id: "PRV-3036",
    tenantId: "PYR-0212",
    name: "Equity Afia Care",
    country: "Kenya",
    region: "af-east-1",
    type: "Insurer",
    modules: 6,
    approvedOn: "08 Jun 2026",
    engineer: "kwame",
    stage: "Awaiting start",
    sections: {
      database: "todo",
      domains: "todo",
      sms: "todo",
      email: "todo",
      migration: "todo",
    },
    config: {
      database: {
        provider: "rds",
        region: "",
        providerName: "",
        host: "",
        tested: false,
        tables: false,
      },
      domains: {
        subdomain: "equity-afia",
        custom: "",
        cnameVerified: false,
        ssl: "todo",
      },
      sms: { provider: "twilio", senderId: "", tested: false },
      email: {
        provider: "resend",
        from: "",
        spf: false,
        dkim: false,
        tested: false,
      },
      migration: { source: "", status: "todo", records: 0 },
    },
  },
  {
    id: "PRV-3033",
    tenantId: "PYR-0210",
    name: "Strategis Insurance",
    country: "Tanzania",
    region: "af-east-2",
    type: "TPA",
    modules: 4,
    approvedOn: "07 Jun 2026",
    engineer: "lily",
    stage: "Blocked",
    remarks: [
      {
        id: "RMK-102",
        section: "database",
        by: "Zola Mbeki",
        initials: "ZM",
        when: "07 Jun · 16:12",
        severity: "action",
        status: "open",
        text: "Connection test keeps failing — credentials look rotated on the tenant side. Request a fresh connection string from the Strategis DBA and re-test before any schema work.",
      },
    ],
    sections: {
      database: "failed",
      domains: "progress",
      sms: "tested",
      email: "tested",
      migration: "todo",
    },
    config: {
      database: {
        provider: "aurora",
        region: "af-south-1 · Cape Town",
        providerName: "",
        host: "strategis.cluster-abc.af-south-1.rds.amazonaws.com",
        tested: false,
        tables: false,
      },
      domains: {
        subdomain: "jubilee",
        custom: "",
        cnameVerified: false,
        ssl: "todo",
      },
      sms: { provider: "pindo", senderId: "STRATEGIS", tested: true },
      email: {
        provider: "ses",
        from: "no-reply@strategis.ginja.ai",
        spf: true,
        dkim: true,
        tested: true,
      },
      migration: { source: "CSV bundle", status: "todo", records: 0 },
    },
  },
  {
    id: "PRV-3029",
    tenantId: "PYR-0188",
    name: "Liberty Health",
    country: "Uganda",
    region: "af-east-3",
    type: "TPA",
    modules: 7,
    approvedOn: "06 Jun 2026",
    engineer: "lily",
    stage: "Ready to activate",
    sections: {
      database: "done",
      domains: "done",
      sms: "tested",
      email: "tested",
      migration: "done",
    },
    config: {
      database: {
        provider: "rds",
        region: "af-south-1 · Cape Town",
        providerName: "",
        host: "liberty.cluster-def.af-south-1.rds.amazonaws.com",
        tested: true,
        tables: true,
      },
      domains: {
        subdomain: "liberty-health",
        custom: "portal.liberty.co.ug",
        cnameVerified: true,
        ssl: "active",
      },
      sms: { provider: "at", senderId: "LIBERTY", tested: true },
      email: {
        provider: "resend",
        from: "no-reply@liberty-health.ginja.ai",
        spf: true,
        dkim: true,
        tested: true,
      },
      migration: { source: "Legacy API sync", status: "done", records: 142800 },
    },
  },
]

/** Count of open (unresolved) technical-review remarks on a record. */
export const provOpenRemarks = (p: ProvisioningRecord) =>
  (p.remarks || []).filter((r) => r.status === "open").length

/** Count of provisioning sections that are provisioned or tested. */
export const provDone = (p: ProvisioningRecord) =>
  PROV_SECTIONS.filter((s) => ["done", "tested"].includes(p.sections[s.k]))
    .length

/* ========================================================= insurers (LAMU) */
/* Mock-only "Claim Clean-up (LAMU)" → Insurers module. No backend endpoint yet,
   so the directory is ported verbatim from the hi-fi (`Ginja Console.html`
   `InsurersDirectory`) rather than wired via a `src/features/` folder. */

/** East-African countries an insurer can operate in (create-form select). */
export const EA_COUNTRIES = [
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Burundi",
  "South Sudan",
  "Ethiopia",
  "Somalia",
  "DR Congo",
]

/** Insurer company types (create-form select). */
export const INSURER_TYPES = [
  "Health insurer",
  "Composite insurer",
  "Third-party administrator (TPA)",
  "Reinsurer",
  "Micro-insurer",
]

export type InsurerStatusValue = "Active" | "Inactive"

export type Insurer = {
  id: string
  name: string
  country: string
  city: string
  regulator: string
  type: string
  license: string
  contact: string
  email: string
  phone: string
  status: InsurerStatusValue
  created: string
  createdBy: string
  /** Set once the profile is marked Inactive. */
  deactivatedBy?: string
  deactivatedOn?: string
  deactivateReason?: string
}

export const INSURERS: Insurer[] = [
  { id: "INS-2026-0001", name: "Jubilee Health Insurance", country: "Kenya", type: "Health insurer", regulator: "IRA Kenya", license: "IRA/07/HIC/2019", city: "Nairobi", contact: "Faith Wanjiru", email: "faith.wanjiru@jubilee.co.ke", phone: "+254712345678", status: "Active", created: "12 Jan 2026", createdBy: "Amara Okeke" },
  { id: "INS-2026-0002", name: "CIC Insurance Group", country: "Kenya", type: "Composite insurer", regulator: "IRA Kenya", license: "IRA/03/CIG/2018", city: "Nairobi", contact: "Peter Otieno", email: "p.otieno@cic.co.ke", phone: "+254722004455", status: "Active", created: "03 Feb 2026", createdBy: "Daniel Achieng" },
  { id: "INS-2026-0003", name: "Britam Health", country: "Kenya", type: "Health insurer", regulator: "IRA Kenya", license: "IRA/11/BRH/2020", city: "Nairobi", contact: "Mary Njoki", email: "mary.njoki@britam.com", phone: "+254733889900", status: "Active", created: "20 Feb 2026", createdBy: "Amara Okeke" },
  { id: "INS-2026-0004", name: "Strategis Insurance Tanzania", country: "Tanzania", type: "Health insurer", regulator: "TIRA", license: "TIRA/HIC/0442", city: "Dar es Salaam", contact: "Joseph Massawe", email: "j.massawe@strategis.co.tz", phone: "+255712009988", status: "Active", created: "28 Feb 2026", createdBy: "Fatima Hassan" },
  { id: "INS-2026-0005", name: "UAP Old Mutual Uganda", country: "Uganda", type: "Composite insurer", regulator: "IRA Uganda", license: "IRAU/COMP/0231", city: "Kampala", contact: "Grace Nakato", email: "grace.n@uapoldmutual.ug", phone: "+256772334455", status: "Active", created: "06 Mar 2026", createdBy: "Daniel Achieng" },
  { id: "INS-2026-0006", name: "Radiant Insurance Rwanda", country: "Rwanda", type: "Health insurer", regulator: "BNR", license: "BNR/INS/0087", city: "Kigali", contact: "Eric Mugisha", email: "eric.m@radiant.rw", phone: "+250788112233", status: "Active", created: "15 Mar 2026", createdBy: "Amara Okeke" },
  { id: "INS-2026-0007", name: "Nyala Insurance Ethiopia", country: "Ethiopia", type: "Composite insurer", regulator: "NBE", license: "NBE/INS/0451", city: "Addis Ababa", contact: "Selam Bekele", email: "s.bekele@nyala.et", phone: "+251911223344", status: "Inactive", created: "22 Jan 2026", createdBy: "Fatima Hassan", deactivatedBy: "Amara Okeke", deactivatedOn: "18 Apr 2026", deactivateReason: "Regulatory licence under renewal — paused at insurer request." },
  { id: "INS-2026-0008", name: "Sanlam General Tanzania", country: "Tanzania", type: "Health insurer", regulator: "TIRA", license: "TIRA/HIC/0511", city: "Dar es Salaam", contact: "Neema Kileo", email: "neema.k@sanlam.co.tz", phone: "+255755667788", status: "Active", created: "02 Apr 2026", createdBy: "Daniel Achieng" },
]

export type InsurerAuditTone = "success" | "warning" | "neutral"

export type InsurerAudit = {
  id: string
  /** Insurer account id this entry belongs to. */
  ins: string
  action: string
  by: string
  initials: string
  when: string
  tone: InsurerAuditTone
  detail: string
}

export const INSURER_AUDIT: InsurerAudit[] = [
  { id: "IA-1", ins: "INS-2026-0007", action: "Marked Inactive", by: "Amara Okeke", initials: "AO", when: "18 Apr 2026 · 14:22", tone: "warning", detail: "Reason: Regulatory licence under renewal — paused at insurer request." },
  { id: "IA-2", ins: "INS-2026-0007", action: "Profile updated", by: "Fatima Hassan", initials: "FH", when: "10 Feb 2026 · 09:40", tone: "neutral", detail: "Primary contact email changed." },
  { id: "IA-3", ins: "INS-2026-0007", action: "Profile created", by: "Fatima Hassan", initials: "FH", when: "22 Jan 2026 · 11:05", tone: "success", detail: "Account INS-2026-0007 generated. Status: Active." },
]

/* ============================================================ access roles */
/* The internal staff roles you can act as (demo: switch via the header). Each
   role grants `view:<permId>` permissions (permId matches a nav item) plus
   maker/checker/techReviewer flags that gate separation-of-duties behaviour.   */

export type ConsoleRoleKey =
  | "platform_admin"
  | "platform_approver"
  | "platform_engineer"
  | "read_only"
  | "tech_reviewer"

export type ConsoleRole = {
  key: ConsoleRoleKey
  label: string
  name: string
  email: string
  initials: string
  /** ["*"] for all, or ["view:<permId>", …]. */
  perms: string[]
  /** permIds the role may see but not edit. */
  readonly: string[]
  maker: boolean
  checker: boolean
  techReviewer: boolean
}

export const CONSOLE_ROLES: Record<ConsoleRoleKey, ConsoleRole> = {
  platform_admin: {
    key: "platform_admin",
    label: "Platform Admin",
    name: "Amara Okeke",
    email: "amara.okeke@ginja.ai",
    initials: "AO",
    perms: ["*"],
    readonly: [],
    maker: true,
    checker: false,
    techReviewer: false,
  },
  platform_approver: {
    key: "platform_approver",
    label: "Platform Approver",
    name: "David Kimani",
    email: "david.kimani@ginja.ai",
    initials: "DK",
    perms: [
      "view:dashboard",
      "view:payers",
      "view:approvals",
      "view:provisioning",
      "view:providers",
      "view:insurers",
      "view:registry",
      "view:doc-templates",
      "view:email-templates",
      "view:sms-templates",
      "view:pricing",
      "view:audit",
    ],
    readonly: ["provisioning"],
    maker: false,
    checker: true,
    techReviewer: false,
  },
  platform_engineer: {
    key: "platform_engineer",
    label: "Platform Engineer",
    name: "Lily Tesfaye",
    email: "lily.tesfaye@ginja.ai",
    initials: "LT",
    perms: [
      "view:dashboard",
      "view:payers",
      "view:providers",
      "view:insurers",
      "view:provisioning",
      "view:registry",
      "view:settings",
      "view:access-users",
      "view:access-roles",
      "view:audit",
    ],
    readonly: [
      "payers",
      "providers",
      "insurers",
      "access-users",
      "access-roles",
    ],
    maker: false,
    checker: false,
    techReviewer: false,
  },
  read_only: {
    key: "read_only",
    label: "Read-only (Support)",
    name: "Brian Nshuti",
    email: "brian.nshuti@ginja.ai",
    initials: "BN",
    perms: [
      "view:dashboard",
      "view:payers",
      "view:approvals",
      "view:provisioning",
      "view:providers",
      "view:insurers",
      "view:registry",
      "view:doc-templates",
      "view:email-templates",
      "view:sms-templates",
      "view:pricing",
      "view:access-users",
      "view:access-roles",
      "view:audit",
    ],
    readonly: [
      "payers",
      "approvals",
      "provisioning",
      "providers",
      "insurers",
      "registry",
      "doc-templates",
      "email-templates",
      "sms-templates",
      "pricing",
      "access-users",
      "access-roles",
    ],
    maker: false,
    checker: false,
    techReviewer: false,
  },
  tech_reviewer: {
    key: "tech_reviewer",
    label: "Technical Reviewer",
    name: "Zola Mbeki",
    email: "zola.mbeki@ginja.ai",
    initials: "ZM",
    perms: ["view:dashboard", "view:provisioning", "view:audit"],
    readonly: ["provisioning"],
    maker: false,
    checker: false,
    techReviewer: true,
  },
}

export const CONSOLE_ROLE_KEYS = Object.keys(CONSOLE_ROLES) as ConsoleRoleKey[]

/** Can this role see a module (by permId)? */
export const cHasPerm = (role: ConsoleRole, permId: string) =>
  role.perms.includes("*") || role.perms.includes("view:" + permId)

/** Can this role see-but-not-edit a module (by permId)? */
export const cReadonly = (role: ConsoleRole, permId: string) =>
  role.readonly.includes(permId) && !role.perms.includes("*")

/* Maps a backend role (JWT `roles` claim, e.g. "PLATFORM_ADMIN") to the console
   role that drives nav-gating + separation-of-duties. See API_GUIDE.md §1. */
const API_ROLE_TO_KEY: Record<string, ConsoleRoleKey> = {
  PLATFORM_ADMIN: "platform_admin",
  PLATFORM_APPROVER: "platform_approver",
  PLATFORM_ENGINEER: "platform_engineer",
  SUPPORT: "read_only",
}

/** Resolve the acting console role from the login token's roles (least-privilege fallback). */
export function roleKeyFromApiRoles(roles?: string[] | null): ConsoleRoleKey {
  for (const r of roles ?? []) {
    const key = API_ROLE_TO_KEY[r]
    if (key) return key
  }
  return "read_only"
}

/* Approval kind → icon key (mapped to a lucide icon in the Approvals page). */
export const APPROVAL_KIND_ICON: Record<string, string> = {
  "Tenant onboarding": "building",
  "Entitlement change": "layers",
  "Org details change": "fileText",
  "Secondary tenant": "gitBranch",
}
