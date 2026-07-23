/**
 * EXPERIMENT — self-contained mock data for the "service-provider detail, but
 * routed" prototype. Deliberately decoupled from `src/features/*` so the whole
 * `experiments/` tree can be deleted in one go. Mirrors the real DTO shapes
 * closely enough that porting the winning IA back onto the live page is a
 * mechanical swap (mock lookups → TanStack Query hooks).
 */

export type ExpStatus = "Active" | "Pending review" | "Inactive" | "Draft"

export type ExpAuditTone = "success" | "warning" | "neutral"
export type ExpAudit = {
  id: string
  action: string
  detail: string
  by: string
  when: string
  initials: string
  tone: ExpAuditTone
}

export type ExpProvider = {
  code: string
  displayId: string
  name: string
  type: string
  cls: string
  tier: string
  ownership: string
  town: string
  county: string
  country: string
  status: ExpStatus
  hims: string
  claimsMonth: string
  integration: "Done" | "In progress" | "—"
  reg: string
  kra: string
  shif: string
  contact: string
  role: string
  email: string
  phone: string
  created: string
  createdBy: string
  approvedOn?: string
  approvedBy?: string
  services: string[]
  audit: ExpAudit[]
}

export type ExpInsurer = {
  accountId: string
  name: string
  companyTypeLabel: string
  country: string
  city: string
  regulator: string
  status: "Active" | "Inactive"
}

export type ExpRuleStatus = "APPROVED" | "PENDING" | "DISCARDED" | "ARCHIVED"
export type ExpSeverity = "HIGH" | "MEDIUM" | "LOW"

export type ExpRule = {
  ruleId: string
  category: string
  title: string
  description: string
  severity: ExpSeverity
  status: ExpRuleStatus
  confidence: number
  clause: string
  checkRef: string
  service: string
  type: string
}

export type ExpExtractionStatus = "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED"
export type ExpReviewStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "COMPLETED"

export type ExpExtraction = {
  jobId: string
  providerCode: string
  insurerAccountId: string
  contractFilename: string
  status: ExpExtractionStatus
  reviewStatus: ExpReviewStatus
  assigneeName?: string
  assignedBy?: string
  createdBy: string
  created: string
  completed: string
  model: string
  current: boolean
  rules: ExpRule[]
  coverage: { name: string; status: "EXTRACTED" | "MISSING_FLAGGED" | "RECORDED_ABSENT" }[]
}

/* ------------------------------------------------------------------ data */

export const EXP_INSURERS: ExpInsurer[] = [
  { accountId: "INS-BR-001", name: "Britam Health", companyTypeLabel: "Health insurer", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-CIC-002", name: "CIC Insurance Group", companyTypeLabel: "Composite insurer", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-JB-003", name: "Jubilee Health Insurance", companyTypeLabel: "Third-party administrator (TPA)", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-JBL-004", name: "Jubli Ltd", companyTypeLabel: "Composite insurer", country: "Tanzania", city: "Dar es Salaam", regulator: "TIRA", status: "Active" },
  { accountId: "INS-RAD-005", name: "Radiant Insurance", companyTypeLabel: "Health insurer", country: "Rwanda", city: "Kigali", regulator: "NBR", status: "Active" },
]

const RULES_BRITAM: ExpRule[] = [
  { ruleId: "LCT-CLAI-001", category: "Claim submission", title: "Submission Deadline", description: "LCT may at its discretion decline to pay invoices submitted more than 30 days after the date of service.", severity: "HIGH", status: "APPROVED", confidence: 97, clause: "Clause 6(iii)", checkRef: "CHK-019", service: "All services", type: "Deadline" },
  { ruleId: "LCT-CLAI-002", category: "Claim submission", title: "Pre-authorisation required", description: "Inpatient admissions must be pre-authorised at least 24 hours in advance except in emergencies.", severity: "HIGH", status: "PENDING", confidence: 91, clause: "Clause 4(i)", checkRef: "CHK-004", service: "Inpatient", type: "Authorisation" },
  { ruleId: "LCT-CLAI-003", category: "Claim submission", title: "Itemised invoice", description: "Every claim must be accompanied by an itemised invoice referencing the applicable benefit code.", severity: "MEDIUM", status: "PENDING", confidence: 88, clause: "Clause 6(i)", checkRef: "CHK-011", service: "All services", type: "Documentation" },
  { ruleId: "LCT-COVR-001", category: "Coverage & limits", title: "Outpatient annual limit", description: "Outpatient benefit is capped at KES 150,000 per member per annum.", severity: "MEDIUM", status: "APPROVED", confidence: 95, clause: "Schedule A", checkRef: "CHK-031", service: "Outpatient", type: "Limit" },
  { ruleId: "LCT-COVR-002", category: "Coverage & limits", title: "Exclusion — cosmetic", description: "Cosmetic and aesthetic procedures are excluded unless medically necessary and pre-approved.", severity: "LOW", status: "APPROVED", confidence: 93, clause: "Schedule B", checkRef: "CHK-052", service: "All services", type: "Exclusion" },
  { ruleId: "LCT-PAY-001", category: "Payment terms", title: "Net settlement window", description: "Approved invoices are settled within 45 days of a clean claim submission.", severity: "MEDIUM", status: "PENDING", confidence: 84, clause: "Clause 9", checkRef: "CHK-070", service: "All services", type: "Payment" },
  { ruleId: "LCT-PAY-002", category: "Payment terms", title: "Co-payment", description: "A KES 500 co-payment applies to each outpatient consultation.", severity: "LOW", status: "DISCARDED", confidence: 62, clause: "Clause 9(ii)", checkRef: "CHK-072", service: "Outpatient", type: "Co-pay" },
]

const RULES_CIC: ExpRule[] = [
  { ruleId: "CIC-CLAI-001", category: "Claim submission", title: "Submission Deadline", description: "Claims must be lodged within 60 days of discharge or the date of the last service rendered.", severity: "HIGH", status: "PENDING", confidence: 90, clause: "Art. 5", checkRef: "CHK-019", service: "All services", type: "Deadline" },
  { ruleId: "CIC-COVR-001", category: "Coverage & limits", title: "Maternity waiting period", description: "Maternity benefits are subject to a 10-month waiting period from policy inception.", severity: "MEDIUM", status: "PENDING", confidence: 87, clause: "Art. 8", checkRef: "CHK-040", service: "Maternity", type: "Waiting period" },
  { ruleId: "CIC-PAY-001", category: "Payment terms", title: "Settlement window", description: "Clean claims are paid within 30 days.", severity: "MEDIUM", status: "APPROVED", confidence: 92, clause: "Art. 12", checkRef: "CHK-070", service: "All services", type: "Payment" },
]

const COVERAGE = [
  { name: "Submission deadline", status: "EXTRACTED" as const },
  { name: "Pre-authorisation", status: "EXTRACTED" as const },
  { name: "Benefit limits", status: "EXTRACTED" as const },
  { name: "Exclusions", status: "EXTRACTED" as const },
  { name: "Payment terms", status: "EXTRACTED" as const },
  { name: "Fraud / abuse clauses", status: "MISSING_FLAGGED" as const },
  { name: "Tariff schedule", status: "RECORDED_ABSENT" as const },
]

export const EXP_EXTRACTIONS: ExpExtraction[] = [
  {
    jobId: "aaeac46d",
    providerCode: "SP-2026-0004",
    insurerAccountId: "INS-BR-001",
    contractFilename: "LCT -THE NAIROBI WOMENS HOSPITAL 2025.pdf",
    status: "COMPLETED",
    reviewStatus: "IN_REVIEW",
    assigneeName: "Harshad Patel",
    assignedBy: "Platform Administrator",
    createdBy: "Platform Administrator",
    created: "21 Jul 2026 · 10:16",
    completed: "21 Jul 2026 · 10:19",
    model: "claude-opus-4-8",
    current: true,
    rules: RULES_BRITAM,
    coverage: COVERAGE,
  },
  {
    jobId: "9f2b7711",
    providerCode: "SP-2026-0004",
    insurerAccountId: "INS-BR-001",
    contractFilename: "LCT -THE NAIROBI WOMENS HOSPITAL 2024.pdf",
    status: "COMPLETED",
    reviewStatus: "COMPLETED",
    assigneeName: "James Otieno",
    assignedBy: "Platform Administrator",
    createdBy: "Platform Administrator",
    created: "03 Jan 2026 · 09:02",
    completed: "03 Jan 2026 · 09:05",
    model: "claude-sonnet-5",
    current: false,
    rules: RULES_BRITAM.map((r) => ({ ...r, status: "APPROVED" as ExpRuleStatus })),
    coverage: COVERAGE,
  },
  {
    jobId: "cic1122a",
    providerCode: "SP-2026-0004",
    insurerAccountId: "INS-CIC-002",
    contractFilename: "CIC-ABC-HOSPITAL-2025.pdf",
    status: "COMPLETED",
    reviewStatus: "IN_REVIEW",
    assigneeName: "Harshad Patel",
    assignedBy: "Platform Administrator",
    createdBy: "Platform Administrator",
    created: "18 Jul 2026 · 14:40",
    completed: "18 Jul 2026 · 14:44",
    model: "claude-opus-4-8",
    current: true,
    rules: RULES_CIC,
    coverage: COVERAGE.slice(0, 5),
  },
]

export const EXP_PROVIDERS: ExpProvider[] = [
  {
    code: "SPO-1200",
    displayId: "SPO-1200",
    name: "Meditest Diagnostics",
    type: "Imaging Services",
    cls: "Diagnostic centre",
    tier: "36–100",
    ownership: "Private limited company",
    town: "Westlands",
    county: "Nairobi",
    country: "Kenya",
    status: "Active",
    hims: "Custom / in-house",
    claimsMonth: "1200",
    integration: "In progress",
    reg: "BN-2019-44821",
    kra: "P051234567X",
    shif: "—",
    contact: "Dr. Aisha Njeri",
    role: "Medical Director",
    email: "aisha@meditest.co.ke",
    phone: "+254 712 000 200",
    created: "02 Jun 2026",
    createdBy: "Platform Administrator",
    approvedOn: "04 Jun 2026",
    approvedBy: "Approver One",
    services: ["Radiology", "CT & MRI", "Ultrasound", "Pathology", "Mammography"],
    audit: [
      { id: "a1", action: "Provider activated", detail: "Approved & activated by the platform approver.", by: "Approver One", when: "04 Jun 2026 · 11:02", initials: "AO", tone: "success" },
      { id: "a2", action: "Submitted for review", detail: "Onboarding wizard completed and submitted.", by: "Platform Administrator", when: "02 Jun 2026 · 16:20", initials: "PA", tone: "neutral" },
      { id: "a3", action: "Draft created", detail: "New provider draft started.", by: "Platform Administrator", when: "02 Jun 2026 · 15:44", initials: "PA", tone: "neutral" },
    ],
  },
  {
    code: "SP-2026-0004",
    displayId: "SP-2026-0004",
    name: "ABC",
    type: "Hospital",
    cls: "Level 5 hospital",
    tier: "Top 35",
    ownership: "Faith-based organisation",
    town: "Parklands",
    county: "Nairobi",
    country: "Kenya",
    status: "Active",
    hims: "AfyaPro",
    claimsMonth: "8400",
    integration: "Done",
    reg: "CPR/2011/55123",
    kra: "P098765432Y",
    shif: "SHA-114-2200",
    contact: "Grace Wambui",
    role: "Claims Manager",
    email: "grace@abchospital.co.ke",
    phone: "+254 733 555 010",
    created: "11 Jan 2026",
    createdBy: "Platform Administrator",
    approvedOn: "13 Jan 2026",
    approvedBy: "Approver One",
    services: ["Inpatient", "Outpatient", "Maternity", "Surgery", "ICU", "Pharmacy", "Laboratory"],
    audit: [
      { id: "b1", action: "Contract extracted", detail: "Britam Health — 33 rules extracted from LCT 2025 contract.", by: "Platform Administrator", when: "21 Jul 2026 · 10:19", initials: "PA", tone: "success" },
      { id: "b2", action: "Reviewer assigned", detail: "Harshad Patel assigned to review CIC extraction.", by: "Platform Administrator", when: "18 Jul 2026 · 14:45", initials: "PA", tone: "neutral" },
      { id: "b3", action: "Provider activated", detail: "Approved & activated.", by: "Approver One", when: "13 Jan 2026 · 09:30", initials: "AO", tone: "success" },
    ],
  },
  {
    code: "SPO-1202",
    displayId: "SP-2026-0003",
    name: "Nairobi Test Hospital",
    type: "Hospital",
    cls: "Level 4 hospital",
    tier: "101–300",
    ownership: "Private limited company",
    town: "Karen",
    county: "Nairobi",
    country: "Kenya",
    status: "Pending review",
    hims: "MediLink",
    claimsMonth: "3100",
    integration: "In progress",
    reg: "CPR/2024/99001",
    kra: "P076543210Z",
    shif: "—",
    contact: "Peter Kamau",
    role: "Administrator",
    email: "peter@nairobitest.co.ke",
    phone: "+254 722 100 100",
    created: "20 Jul 2026",
    createdBy: "Platform Administrator",
    services: ["Inpatient", "Outpatient", "Laboratory"],
    audit: [
      { id: "c1", action: "Submitted for review", detail: "Awaiting approver.", by: "Platform Administrator", when: "20 Jul 2026 · 12:10", initials: "PA", tone: "neutral" },
    ],
  },
  {
    code: "SPO-1188",
    displayId: "SP-2025-0088",
    name: "Coast General Clinic",
    type: "Clinic",
    cls: "Outpatient clinic",
    tier: "≤35",
    ownership: "Sole proprietorship",
    town: "Nyali",
    county: "Mombasa",
    country: "Kenya",
    status: "Inactive",
    hims: "None",
    claimsMonth: "420",
    integration: "—",
    reg: "BN-2015-11002",
    kra: "P012345678A",
    shif: "—",
    contact: "Fatuma Ali",
    role: "Owner",
    email: "fatuma@coastgeneral.co.ke",
    phone: "+254 700 900 900",
    created: "09 Sep 2025",
    createdBy: "Platform Administrator",
    approvedOn: "11 Sep 2025",
    approvedBy: "Approver One",
    services: ["Outpatient", "Minor procedures"],
    audit: [
      { id: "d1", action: "Marked inactive", detail: "Deactivated — repeated non-compliant submissions.", by: "Approver One", when: "02 May 2026 · 08:15", initials: "AO", tone: "warning" },
      { id: "d2", action: "Provider activated", detail: "Approved & activated.", by: "Approver One", when: "11 Sep 2025 · 10:00", initials: "AO", tone: "success" },
    ],
  },
]

/* --------------------------------------------------------------- lookups */

export const getProvider = (code?: string) =>
  EXP_PROVIDERS.find((p) => p.code === code || p.displayId === code)

export const getInsurer = (accountId?: string) =>
  EXP_INSURERS.find((i) => i.accountId === accountId)

/** All extractions for a provider⇆insurer pair, current first. */
export const getExtractions = (providerCode?: string, insurerAccountId?: string) =>
  EXP_EXTRACTIONS.filter(
    (x) =>
      (x.providerCode === providerCode ||
        getProvider(providerCode)?.displayId === x.providerCode) &&
      x.insurerAccountId === insurerAccountId
  ).sort((a, b) => Number(b.current) - Number(a.current))

export const getExtraction = (jobId?: string) =>
  EXP_EXTRACTIONS.find((x) => x.jobId === jobId)

/** The current extraction for a pair (what the workspace card summarises). */
export const currentExtraction = (
  providerCode?: string,
  insurerAccountId?: string
) => getExtractions(providerCode, insurerAccountId).find((x) => x.current)

export const providerSummary = () => ({
  total: EXP_PROVIDERS.length,
  active: EXP_PROVIDERS.filter((p) => p.status === "Active").length,
  pendingReview: EXP_PROVIDERS.filter((p) => p.status === "Pending review").length,
  inactive: EXP_PROVIDERS.filter((p) => p.status === "Inactive").length,
})
