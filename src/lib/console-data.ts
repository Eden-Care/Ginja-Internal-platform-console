/**
 * Ginja AI Platform Console — mock data (typed).
 *
 * Self-contained port of the hi-fi design source — see
 * "Ginja Console - Hi-fi Screens (standalone).html" at the repo root (and
 * DESIGN-SYSTEM.md). The console is the internal ops platform for onboarding &
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
  owner: OnbTeamKey
  icon: string
}

export type OnbDraft = {
  id: string
  name: string
  country: string
  type: TenantType
  started: string
  updated: string
  team: OnbTeamKey[]
  waiting: string
  sections: Record<string, SecStatus>
  edited: Record<string, string>
}

export type WizStepKey =
  | "primary"
  | "secondary"
  | "technical"
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

/** Fillable sections (mirror the wizard, minus Review) — drive the draft cards. */
export const ONB_SECTIONS: OnbSection[] = [
  {
    k: "primary",
    l: "Basic profile",
    short: "Profile",
    owner: "profile",
    icon: "building",
  },
  {
    k: "secondary",
    l: "Secondary tenants",
    short: "Branches",
    owner: "profile",
    icon: "gitBranch",
  },
  {
    k: "technical",
    l: "Technical config",
    short: "Technical",
    owner: "tech",
    icon: "server",
  },
  {
    k: "modules",
    l: "Module entitlements",
    short: "Modules",
    owner: "tech",
    icon: "layers",
  },
  {
    k: "billing",
    l: "Subscription & billing",
    short: "Billing",
    owner: "profile",
    icon: "creditCard",
  },
  {
    k: "documents",
    l: "KYC & documents",
    short: "KYC",
    owner: "compliance",
    icon: "fileText",
  },
]

export const onbDone = (d: OnbDraft) =>
  ONB_SECTIONS.filter((s) => d.sections[s.k] === "complete").length

/** In-progress onboarding drafts (resumable). */
export const ONB_DRAFTS: OnbDraft[] = [
  {
    id: "ONB-2041",
    name: "CIC Insurance Group",
    country: "Kenya",
    type: "Insurer",
    started: "08 Jun",
    updated: "2 min ago",
    team: ["profile", "tech", "compliance"],
    waiting: "KYC & documents",
    sections: {
      primary: "complete",
      secondary: "complete",
      technical: "complete",
      modules: "complete",
      billing: "progress",
      documents: "empty",
    },
    edited: {
      primary: "08 Jun 09:12",
      secondary: "08 Jun 09:20",
      technical: "08 Jun 10:02",
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
    team: ["profile", "tech"],
    waiting: "Technical config",
    sections: {
      primary: "complete",
      secondary: "complete",
      technical: "progress",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "08 Jun 08:30",
      secondary: "08 Jun 08:51",
      technical: "1 hr ago",
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
    team: ["profile"],
    waiting: "Secondary tenants",
    sections: {
      primary: "complete",
      secondary: "empty",
      technical: "empty",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "3 hr ago",
      secondary: "—",
      technical: "—",
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
    team: ["profile", "tech", "compliance"],
    waiting: "KYC & documents",
    sections: {
      primary: "complete",
      secondary: "complete",
      technical: "complete",
      modules: "complete",
      billing: "complete",
      documents: "progress",
    },
    edited: {
      primary: "07 Jun 11:00",
      secondary: "07 Jun 11:18",
      technical: "07 Jun 14:30",
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
    team: ["profile", "tech"],
    waiting: "Module entitlements",
    sections: {
      primary: "complete",
      secondary: "complete",
      technical: "complete",
      modules: "progress",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "07 Jun 09:40",
      secondary: "07 Jun 09:58",
      technical: "07 Jun 13:12",
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
    team: ["profile"],
    waiting: "Basic profile",
    sections: {
      primary: "progress",
      secondary: "empty",
      technical: "empty",
      modules: "empty",
      billing: "empty",
      documents: "empty",
    },
    edited: {
      primary: "3 days ago",
      secondary: "—",
      technical: "—",
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
    k: "technical",
    l: "Technical config",
    d: "Subdomain & infrastructure",
    owner: "tech",
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
  technical:
    "Subdomain, data residency and infrastructure. Usually owned by a Platform Engineer — it can be filled in independently of the profile.",
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
