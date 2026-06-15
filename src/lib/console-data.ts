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

export type DocStatus = "Published" | "Draft"

export type DocTemplate = {
  id: string
  name: string
  cat: string
  format: string
  version: string
  status: DocStatus
  updated: string
  overrides: number
  by: string
}

export type EmailChannel = "Email" | "Email + SMS"

export type EmailTemplate = {
  id: string
  name: string
  trigger: string
  channel: EmailChannel
  status: DocStatus
  version: string
  updated: string
  overrides: number
  subject: string
  body: string
}

export type EmailVar = { n: string; d: string }

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
