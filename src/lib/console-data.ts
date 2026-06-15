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

export type OnbTeamKey = "profile" | "tech" | "compliance"
export type OnbTeamMember = { name: string; initials: string; role: string }

export type SecStatus = "complete" | "progress" | "empty"

export type OnbSection = {
  k: string
  l: string
  short: string
  /** The specialty that naturally owns this section (drives "suggest by specialty"). */
  specRole: StaffRole
  icon: string
}

export type OnbDraft = {
  id: string
  name: string
  country: string
  type: TenantType
  started: string
  updated: string
  /** Section key → assigned staff id (or null when no owner yet). */
  assign: Record<string, string | null>
  waiting: string
  sections: Record<string, SecStatus>
  edited: Record<string, string>
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
  modules: Record<string, string[]>
  model: string
  freq: string
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
    label: "Email & SMS templates",
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

export const ONB_TEAM: Record<OnbTeamKey, OnbTeamMember> = {
  profile: {
    name: "Amara Okeke",
    initials: "AO",
    role: "Onboarding Specialist",
  },
  tech: { name: "Lily Tesfaye", initials: "LT", role: "Platform Engineer" },
  compliance: {
    name: "David Kimani",
    initials: "DK",
    role: "Compliance Officer",
  },
}

export const ONB_TEAM_KEYS: OnbTeamKey[] = ["profile", "tech", "compliance"]

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

export const onbDone = (d: OnbDraft) =>
  ONB_SECTIONS.filter((s) => d.sections[s.k] === "complete").length

/** Unique staff assigned anywhere on a draft, in roster order. */
export const onbTeamIds = (d: OnbDraft) =>
  STAFF.map((p) => p.id).filter((id) =>
    Object.values(d.assign || {}).includes(id)
  )

/** Sections that still have no owner. */
export const onbUnassigned = (d: OnbDraft) =>
  ONB_SECTIONS.filter((s) => !(d.assign || {})[s.k])

/** Auto-distribute a team across sections by specialty (null where no match). */
export function suggestAssign(teamIds: string[]): Record<string, string | null> {
  const team = teamIds.map((id) => STAFF_BY_ID[id]).filter(Boolean)
  const out: Record<string, string | null> = {}
  ONB_SECTIONS.forEach((s) => {
    const match = team.find((p) => p.role === s.specRole)
    out[s.k] = match ? match.id : null
  })
  return out
}

/** In-progress onboarding drafts (resumable). */
export const ONB_DRAFTS: OnbDraft[] = [
  {
    id: "ONB-2041",
    name: "CIC Insurance Group",
    country: "Kenya",
    type: "Insurer",
    started: "08 Jun",
    updated: "2 min ago",
    assign: {
      primary: "amara",
      secondary: "amara",
      modules: "lily",
      billing: "amara",
      documents: "david",
    },
    waiting: "KYC & documents",
    sections: {
      primary: "complete",
      secondary: "complete",
      modules: "complete",
      billing: "progress",
      documents: "empty",
    },
    edited: {
      primary: "08 Jun 09:12",
      secondary: "08 Jun 09:20",
      modules: "08 Jun 10:40",
      billing: "2 min ago",
      documents: "—",
    },
  },
  {
    id: "ONB-2036",
    name: "Equity Afia Care",
    country: "Kenya",
    type: "Insurer",
    started: "08 Jun",
    updated: "1 hr ago",
    assign: {
      primary: "fatima",
      secondary: "fatima",
      modules: "kwame",
      billing: "fatima",
      documents: null,
    },
    waiting: "KYC owner",
    sections: {
      primary: "complete",
      secondary: "complete",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "08 Jun 08:30",
      secondary: "08 Jun 08:51",
      modules: "—",
      billing: "—",
      documents: "—",
    },
  },
  {
    id: "ONB-2033",
    name: "Strategis Insurance",
    country: "Tanzania",
    type: "Insurer",
    started: "08 Jun",
    updated: "3 hr ago",
    assign: {
      primary: "amara",
      secondary: "amara",
      modules: "amara",
      billing: "amara",
      documents: "amara",
    },
    waiting: "Secondary tenants",
    sections: {
      primary: "complete",
      secondary: "empty",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "3 hr ago",
      secondary: "—",
      modules: "—",
      billing: "—",
      documents: "—",
    },
  },
  {
    id: "ONB-2029",
    name: "Liberty Health",
    country: "Uganda",
    type: "TPA",
    started: "07 Jun",
    updated: "Yesterday",
    assign: {
      primary: "fatima",
      secondary: "fatima",
      modules: "lily",
      billing: "fatima",
      documents: "naledi",
    },
    waiting: "KYC & documents",
    sections: {
      primary: "complete",
      secondary: "complete",
      modules: "complete",
      billing: "complete",
      documents: "progress",
    },
    edited: {
      primary: "07 Jun 11:00",
      secondary: "07 Jun 11:18",
      modules: "07 Jun 15:10",
      billing: "07 Jun 16:02",
      documents: "Yesterday",
    },
  },
  {
    id: "ONB-2025",
    name: "Britam Health",
    country: "Kenya",
    type: "Insurer",
    started: "07 Jun",
    updated: "Yesterday",
    assign: {
      primary: "amara",
      secondary: "amara",
      modules: "kwame",
      billing: "amara",
      documents: null,
    },
    waiting: "KYC owner",
    sections: {
      primary: "complete",
      secondary: "complete",
      modules: "progress",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "07 Jun 09:40",
      secondary: "07 Jun 09:58",
      modules: "Yesterday",
      billing: "—",
      documents: "—",
    },
  },
  {
    id: "ONB-2018",
    name: "Jubilee Tanzania",
    country: "Tanzania",
    type: "Insurer",
    started: "05 Jun",
    updated: "3 days ago",
    assign: {
      primary: "fatima",
      secondary: "fatima",
      modules: "fatima",
      billing: "fatima",
      documents: "fatima",
    },
    waiting: "Basic profile",
    sections: {
      primary: "progress",
      secondary: "empty",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "3 days ago",
      secondary: "—",
      modules: "—",
      billing: "—",
      documents: "—",
    },
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

export const BASE_FORM: OnboardingForm = {
  legal: "CIC Insurance Group",
  trading: "CIC Health",
  contact: "Grace Achieng",
  email: "grace.a@cic.co.ke",
  country: "Kenya",
  region: "af-east-1",
  type: "Insurer",
  subdomain: "cic-health",
  isolation: "dedicated",
  sso: "None",
  customDomain: "",
  tax: "KRA-P051234567X",
  contacts: [
    {
      name: "Grace Achieng",
      email: "grace.a@cic.co.ke",
      role: "Chief Executive Officer",
      phone: "+254 711 000 111",
    },
  ],
  address: "CIC Plaza, Mara Road, Upper Hill, Nairobi, Kenya",
  website: "www.cic.co.ke",
  secondaries: [],
  modules: {
    claims: ["intake", "adjud", "preauth"],
    members: ["enroll", "elig"],
    products: ["builder", "rules"],
    finance: ["invoicing", "payments"],
    reporting: ["core"],
  },
  model: "pmpm",
  freq: "Monthly",
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
  { id: "amara", name: "Amara Okeke", initials: "AO", role: "Onboarding Specialist" },
  { id: "fatima", name: "Fatima Hassan", initials: "FH", role: "Onboarding Specialist" },
  { id: "lily", name: "Lily Tesfaye", initials: "LT", role: "Platform Engineer" },
  { id: "kwame", name: "Kwame Mensah", initials: "KM", role: "Platform Engineer" },
  { id: "tunde", name: "Tunde Adeyemi", initials: "TA", role: "Platform Engineer" },
  { id: "david", name: "David Kimani", initials: "DK", role: "Compliance Officer" },
  { id: "naledi", name: "Naledi Dube", initials: "ND", role: "Compliance Officer" },
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

export type ProvSectionStatus = "done" | "tested" | "progress" | "failed" | "todo"

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
  { k: "database", l: "Database & storage", short: "Database", icon: "database", desc: "Provider, data-storage location, connection & schema" },
  { k: "domains", l: "Domains & SSL", short: "Domains", icon: "globe", desc: "Subdomain, custom domain & certificate" },
  { k: "sms", l: "SMS provider", short: "SMS", icon: "messageSquare", desc: "Gateway, credentials & sender ID" },
  { k: "email", l: "Email provider", short: "Email", icon: "mail", desc: "Transactional email & domain auth" },
  { k: "migration", l: "Data migration", short: "Migration", icon: "rotateCcw", desc: "Import legacy data & verify counts" },
]

export const DB_PROVIDERS: ProvProvider[] = [
  { id: "rds", name: "AWS RDS (PostgreSQL)", default: true, regions: ["af-south-1 · Cape Town", "eu-west-1 · Ireland", "me-south-1 · Bahrain"] },
  { id: "aurora", name: "AWS Aurora", default: false, regions: ["af-south-1 · Cape Town", "eu-west-1 · Ireland", "me-south-1 · Bahrain"] },
  { id: "aos", name: "AOS Managed Postgres", default: false, regions: ["af-east-1 · Nairobi", "af-south-1 · Cape Town", "af-west-1 · Lagos"] },
  { id: "azuresql", name: "Azure Database", default: false, regions: ["southafricanorth · Johannesburg", "westeurope · Amsterdam"] },
  { id: "self", name: "Self-managed", default: false, regions: [] },
]

export const SMS_PROVIDERS: ProvProvider[] = [
  { id: "twilio", name: "Twilio", default: true, hint: "Global SMS — default gateway" },
  { id: "pindo", name: "Pindo", default: false, hint: "East Africa optimised" },
  { id: "at", name: "Africa's Talking", default: false, hint: "Pan-African coverage" },
  { id: "infobip", name: "Infobip", default: false, hint: "Enterprise routing" },
]

export const EMAIL_PROVIDERS: ProvProvider[] = [
  { id: "resend", name: "Resend", default: true, hint: "Default transactional email" },
  { id: "ses", name: "Amazon SES", default: false, hint: "High-volume, low cost" },
  { id: "sendgrid", name: "SendGrid", default: false, hint: "Marketing + transactional" },
  { id: "postmark", name: "Postmark", default: false, hint: "Fast transactional" },
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
export const TAKEN_SUBDOMAINS = ["jubilee", "britam", "aar", "sanlam", "old-mutual"]

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
      { id: "RMK-101", section: "domains", by: "Zola Mbeki", initials: "ZM", when: "08 Jun · 10:24", severity: "action", status: "open", text: "Custom domain health.cic.co.ke still resolves to the legacy portal. Ask the tenant to update the CNAME to cic-health.ginja.ai, then re-run verification before activation." },
      { id: "RMK-100", section: "database", by: "Zola Mbeki", initials: "ZM", when: "08 Jun · 09:50", severity: "note", status: "resolved", text: "Connection user has DDL rights on the whole cluster — consider a scoped app user. Fine for go-live; revisit post-activation." },
    ],
    sections: { database: "tested", domains: "progress", sms: "todo", email: "done", migration: "todo" },
    config: {
      database: { provider: "rds", region: "af-south-1 · Cape Town", providerName: "", host: "cic-health.cluster-xyz.af-south-1.rds.amazonaws.com", tested: true, tables: false },
      domains: { subdomain: "cic-health", custom: "health.cic.co.ke", cnameVerified: false, ssl: "pending" },
      sms: { provider: "twilio", senderId: "", tested: false },
      email: { provider: "resend", from: "no-reply@cic-health.ginja.ai", spf: true, dkim: true, tested: true },
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
    sections: { database: "todo", domains: "todo", sms: "todo", email: "todo", migration: "todo" },
    config: {
      database: { provider: "rds", region: "", providerName: "", host: "", tested: false, tables: false },
      domains: { subdomain: "equity-afia", custom: "", cnameVerified: false, ssl: "todo" },
      sms: { provider: "twilio", senderId: "", tested: false },
      email: { provider: "resend", from: "", spf: false, dkim: false, tested: false },
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
      { id: "RMK-102", section: "database", by: "Zola Mbeki", initials: "ZM", when: "07 Jun · 16:12", severity: "action", status: "open", text: "Connection test keeps failing — credentials look rotated on the tenant side. Request a fresh connection string from the Strategis DBA and re-test before any schema work." },
    ],
    sections: { database: "failed", domains: "progress", sms: "tested", email: "tested", migration: "todo" },
    config: {
      database: { provider: "aurora", region: "af-south-1 · Cape Town", providerName: "", host: "strategis.cluster-abc.af-south-1.rds.amazonaws.com", tested: false, tables: false },
      domains: { subdomain: "jubilee", custom: "", cnameVerified: false, ssl: "todo" },
      sms: { provider: "pindo", senderId: "STRATEGIS", tested: true },
      email: { provider: "ses", from: "no-reply@strategis.ginja.ai", spf: true, dkim: true, tested: true },
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
    sections: { database: "done", domains: "done", sms: "tested", email: "tested", migration: "done" },
    config: {
      database: { provider: "rds", region: "af-south-1 · Cape Town", providerName: "", host: "liberty.cluster-def.af-south-1.rds.amazonaws.com", tested: true, tables: true },
      domains: { subdomain: "liberty-health", custom: "portal.liberty.co.ug", cnameVerified: true, ssl: "active" },
      sms: { provider: "at", senderId: "LIBERTY", tested: true },
      email: { provider: "resend", from: "no-reply@liberty-health.ginja.ai", spf: true, dkim: true, tested: true },
      migration: { source: "Legacy API sync", status: "done", records: 142800 },
    },
  },
]

/** Count of open (unresolved) technical-review remarks on a record. */
export const provOpenRemarks = (p: ProvisioningRecord) =>
  (p.remarks || []).filter((r) => r.status === "open").length

/** Count of provisioning sections that are provisioned or tested. */
export const provDone = (p: ProvisioningRecord) =>
  PROV_SECTIONS.filter((s) => ["done", "tested"].includes(p.sections[s.k])).length

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
      "view:registry",
      "view:doc-templates",
      "view:email-templates",
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
      "view:provisioning",
      "view:registry",
      "view:settings",
      "view:access-users",
      "view:access-roles",
      "view:audit",
    ],
    readonly: ["payers", "access-users", "access-roles"],
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
      "view:registry",
      "view:doc-templates",
      "view:email-templates",
      "view:pricing",
      "view:access-users",
      "view:access-roles",
      "view:audit",
    ],
    readonly: [
      "payers",
      "approvals",
      "provisioning",
      "registry",
      "doc-templates",
      "email-templates",
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

/* Approval kind → icon key (mapped to a lucide icon in the Approvals page). */
export const APPROVAL_KIND_ICON: Record<string, string> = {
  "Tenant onboarding": "building",
  "Entitlement change": "layers",
  "Org details change": "fileText",
  "Secondary tenant": "gitBranch",
}
