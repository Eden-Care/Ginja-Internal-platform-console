/**
 * EXPERIMENT — self-contained mock data for the routed service-provider detail
 * prototype. The extraction shape mirrors the REAL API payload
 * (`GET …/rule-extraction/{insurerAccountId}` / `…/jobs/{jobId}`) 1:1 so the
 * UI is validated against real data — rules carry source_quote / rule_logic /
 * check_field / unit_of_application / scheme / payer / manual + per-rule review
 * trail; the extraction carries metadata (contract summary + missing_fields),
 * the coverage matrix (criticality + 4 statuses + notes), flags, review due
 * date and the publish workflow. Client types are camelCase (the mapper the
 * live feature folder would apply is baked into the fixtures).
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

export type ExpRuleStatus = "PENDING" | "APPROVED" | "DISCARDED" | "ARCHIVED"
export type ExpSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"

/** Mirrors the API rule object (camelCased). */
export type ExpRule = {
  ruleId: string
  payer: string
  schemeCategory: string
  category: string // rule_category
  ruleType: string // rule_type enum
  description: string
  checkField: string
  serviceCategory: string
  ruleLogic: string
  unitOfApplication: string
  severity: ExpSeverity
  source: string // clause reference
  checkRef: string
  confidence: number // 0..1
  sourceQuote: string
  status: ExpRuleStatus // review_status
  reviewComment: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  manual: boolean
}

export type ExpCoverageStatus =
  | "EXTRACTED"
  | "RECORDED_ABSENT"
  | "MISSING_FLAGGED"
  | "SKIPPED"
export type ExpCriticality = "MANDATORY" | "EXPECTED" | "OPTIONAL"
export type ExpCoverage = {
  checkId: string
  category: string
  criticality: ExpCriticality
  status: ExpCoverageStatus
  ruleCount: number
  note: string
}

export type ExpContractMeta = {
  documentType: string
  payerName: string
  healthcareProvider: string
  signedDate: string
  effectiveDate: string
  durationTerm: string
  servicesCovered: string
  supersedes: string
  linkedMasterAgreement: string
  missingFields: string[]
}

export type ExpExtractionStatus = "COMPLETED" | "RUNNING" | "QUEUED" | "FAILED"
export type ExpReviewStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "COMPLETED"

export type ExpExtraction = {
  id: number
  jobId: string
  providerCode: string // account_id
  providerName: string
  contractCode: string
  insurerAccountId: string
  insurerName: string
  status: ExpExtractionStatus
  current: boolean
  published: boolean
  publishedAt: string | null
  publishedByName: string | null
  reviewStatus: ExpReviewStatus
  assigneeId: number | null
  assigneeName: string | null
  assignedByName: string | null
  assignedAt: string | null
  reviewDueAt: string | null
  reviewCompletedAt: string | null
  contractFileId: string
  contractFilename: string
  model: string
  metadata: ExpContractMeta
  rules: ExpRule[]
  coverage: ExpCoverage[]
  flags: string[]
  createdByName: string
  createdAt: string
  completedAt: string
}

/* ------------------------------------------------------------------ data */

export const EXP_INSURERS: ExpInsurer[] = [
  { accountId: "INS-BR-001", name: "Britam Health", companyTypeLabel: "Health insurer", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-CIC-002", name: "CIC Insurance Group", companyTypeLabel: "Composite insurer", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-JB-003", name: "Jubilee Health Insurance", companyTypeLabel: "Third-party administrator (TPA)", country: "Kenya", city: "Nairobi", regulator: "IRA", status: "Active" },
  { accountId: "INS-JBL-004", name: "Jubli Ltd", companyTypeLabel: "Composite insurer", country: "Tanzania", city: "Dar es Salaam", regulator: "TIRA", status: "Active" },
  { accountId: "INS-RAD-005", name: "Radiant Insurance", companyTypeLabel: "Health insurer", country: "Rwanda", city: "Kigali", regulator: "NBR", status: "Active" },
]

/** The real LCT contract rules (from the live API sample). A few are pre-decided
    so the review meter / filters show variety. */
const rule = (r: Omit<ExpRule, "payer" | "schemeCategory" | "reviewComment" | "reviewedByName" | "reviewedAt" | "manual"> & Partial<ExpRule>): ExpRule => ({
  payer: "LCT Africa Limited",
  schemeCategory: "Capitation",
  reviewComment: null,
  reviewedByName: null,
  reviewedAt: null,
  manual: false,
  ...r,
})

const reviewed = (by: string): Pick<ExpRule, "reviewedByName" | "reviewedAt"> => ({
  reviewedByName: by,
  reviewedAt: "23 Jul 2026 · 13:10",
})

const LCT_RULES: ExpRule[] = [
  rule({ ruleId: "LCT-CLAI-001", category: "Claim Submission", ruleType: "SUBMISSION_DEADLINE", description: "LCT may at its discretion decline to pay invoices submitted more than 30 days after the date of service.", checkField: "days_since_service", serviceCategory: "All", ruleLogic: "<= 30DAYS from date of service (else discretionary decline)", unitOfApplication: "per claim/invoice", severity: "HIGH", source: "Clause 6.iii", checkRef: "CHK-019", confidence: 0.95, sourceQuote: "LCT may at own discretion decline to pay invoices submitted after thirty (30) days from the date of service.", status: "APPROVED", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-CLAI-002", category: "Claim Submission", ruleType: "SUBMISSION_DEADLINE", description: "No late charges will be allowed after 30 days from date of discharge; supplementary/late invoices must be accompanied by a letter of clarification.", checkField: "days_since_discharge", serviceCategory: "All", ruleLogic: "<= 30DAYS from date of discharge for late charges (else not allowed)", unitOfApplication: "per late charge", severity: "HIGH", source: "Clause 6.ii", checkRef: "CHK-019", confidence: 0.9, sourceQuote: "A letter of clarification detailing the services given must accompany all late charges. No late charges will be allowed after 30 days from date of discharge.", status: "PENDING" }),
  rule({ ruleId: "LCT-CLAI-003", category: "Claim Submission", ruleType: "SUBMISSION_DEADLINE", description: "Any claim generated off the system must have Proof of Authorization from LCT and copies must be submitted via email not later than 24 hours from the time of approval, else it is unpayable.", checkField: "hours_since_approval", serviceCategory: "All", ruleLogic: "<= 24HOURS from time of approval (else automatically unpayable)", unitOfApplication: "per off-system claim", severity: "CRITICAL", source: "Clause 6.vii", checkRef: "CHK-019", confidence: 0.85, sourceQuote: "Any claim generated off the system must have a Proof of Authorization from LCT. Copies of such a claim must be submitted through email not later than 24-hours from the time of approval. Any claim submitted after this time shall be declared unpayable and as such shall not form part of LCT's liability.", status: "PENDING" }),
  rule({ ruleId: "LCT-DOCU-001", category: "Documentation", ruleType: "ELIGIBILITY_VERIFICATION", description: "Scheme members must be identified using the LCT Healthcare Passport or any other method chosen by LCT before provision of services; LCT indemnifies the provider for claims arising from compliance with the identification/pre-authorization procedures.", checkField: "verification_artifact", serviceCategory: "All", ruleLogic: "REQUIRED (LCT Healthcare Passport OR LCT-chosen method)", unitOfApplication: "per visit / per member", severity: "HIGH", source: "Clause 1.3", checkRef: "CHK-013", confidence: 0.9, sourceQuote: "The mode of identification shall be limited to the LCT Healthcare Passport or any other method chosen by LCT. LCT shall indemnify the Healthcare Service Provider for any claims arising out of compliance with the said identification and pre-authorization procedures and requirements.", status: "APPROVED", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-DOCU-002", category: "Documentation", ruleType: "ELIGIBILITY_VERIFICATION", description: "Before provision of any services, correct and accurate member identification and benefits management must be verified using LCT Solutions, and members must authorize service provision using biometric features (e.g. fingerprints) where possible; where biometric identification is not possible, explicit authorization of the insurer/corporate must be sought.", checkField: "verification_artifact", serviceCategory: "All", ruleLogic: "REQUIRED (biometric verification; fallback explicit insurer/corporate authorization)", unitOfApplication: "per visit / per member", severity: "HIGH", source: "Clause 19 – Schedule of Service Level Agreements", checkRef: "CHK-013", confidence: 0.85, sourceQuote: "To ensure that members authorize the provision of services using immediate biometric features including but not limited to fingerprints and in all cases where possible.", status: "PENDING" }),
  rule({ ruleId: "LCT-DOCU-003", category: "Documentation", ruleType: "DOCUMENT_COMPLETION", description: "The provider must process claims to ensure they are valid and properly completed, attaching the discharge summary and medical report before discharge at no extra cost.", checkField: "document_name", serviceCategory: "Inpatient", ruleLogic: "REQUIRED before discharge (discharge summary + medical report)", unitOfApplication: "per claim / per admission", severity: "MEDIUM", source: "Clause 6.i", checkRef: "CHK-014", confidence: 0.9, sourceQuote: "The Healthcare Service Provider will process claims to ensure they are valid and properly completed, attaching the discharge summary and medical report before discharge at no extra cost.", status: "APPROVED", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-DOCU-004", category: "Documentation", ruleType: "DOCUMENT_COMPLETION", description: "The claim must include a fully documented claim form, invoice (with an ETIMS receipt against the IAX KRA PIN) and a system generated LCT report; all services requiring preauthorization must be processed through the LCT system with approval evidence submitted alongside the claim.", checkField: "document_name", serviceCategory: "All", ruleLogic: "REQUIRED (fully documented claim form + invoice + ETIMS receipt + LCT report + preauth evidence)", unitOfApplication: "per claim", severity: "HIGH", source: "Clause 6.i", checkRef: "CHK-014", confidence: 0.85, sourceQuote: "The claim must include fully documented claim form, invoice, including an ETIMS receipt generated against the Insurance Administration Exchange (Africa) Limited (IAX) KRA PIN and a system generated LCT report.", status: "PENDING" }),
  rule({ ruleId: "LCT-DOCU-005", category: "Documentation", ruleType: "INVOICE_FORMAT", description: "Billing must include correct invoice details, namely Amount and Invoice Number; the diagnosis details must be included when uploading claim documents.", checkField: "required_granularity", serviceCategory: "All", ruleLogic: "REQUIRED (Amount + Invoice Number + diagnosis details)", unitOfApplication: "per invoice", severity: "MEDIUM", source: "Clause 19 – Schedule of Service Level Agreements", checkRef: "CHK-015", confidence: 0.75, sourceQuote: "Include the correct invoice details when billing that is Amount and Invoice Number.", status: "PENDING" }),
  rule({ ruleId: "LCT-DOCU-006", category: "Documentation", ruleType: "INVOICE_FORMAT", description: "Surgical cases are billed as all-inclusive packages per the surgical packages schedule (package rate exception to per-item billing).", checkField: "package_exception", serviceCategory: "Inpatient / Surgical", ruleLogic: "billed_as_package == TRUE (<= SCHEDULE_RATE(item))", unitOfApplication: "per surgical package", severity: "MEDIUM", source: "Annexure 3 – Surgical Packages", checkRef: "CHK-015", confidence: 0.7, sourceQuote: "For surgical cases, refer to the surgical packages (all inclusive)", status: "DISCARDED", reviewComment: "Duplicate of the tariff schedule rule — not a distinct clean-up rule.", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-EXCL-001", schemeCategory: "Capitation schemes", category: "Exclusions", ruleType: "EXCLUSION_NOT_PAYABLE", description: "Provider must manage key exclusions based on the exclusion list provided by LCT as an appendix, amended from time to time in writing. The exclusion schedule itself is not enumerated in this agreement and must be obtained separately.", checkField: "excluded_service_list; scheme_scope", serviceCategory: "All services", ruleLogic: "service IN not_payable_list (per LCT-provided exclusion appendix)", unitOfApplication: "per service", severity: "HIGH", source: "Clause 1.2", checkRef: "CHK-012", confidence: 0.75, sourceQuote: "…to manage key exclusions based on the list provided by LCT as an appendix to this Agreement and as amended from time to time in writing.", status: "PENDING" }),
  rule({ ruleId: "LCT-EXCL-002", schemeCategory: "Capitation schemes", category: "Exclusions", ruleType: "EXCLUSION_NOT_PAYABLE", description: "Invoices without an eTIMS receipt linked to the Insurance Administration Exchange (Africa) Limited (IAX) KRA PIN are not payable.", checkField: "excluded_service_list; scheme_scope", serviceCategory: "All claims/invoices", ruleLogic: "invoice WITHOUT eTIMS_receipt_linked_to_IAX_PIN => NOT_PAYABLE", unitOfApplication: "per invoice", severity: "CRITICAL", source: "Annexure 4", checkRef: "CHK-012", confidence: 0.7, sourceQuote: "Invoices without an eTIMS receipt linked to the Insurance Administration Exchange (Africa) Limited (IAX) PIN will not be payable.", status: "PENDING" }),
  rule({ ruleId: "LCT-EXCL-003", schemeCategory: "Capitation schemes", category: "Exclusions", ruleType: "EXCLUSION_NOT_PAYABLE", description: "Any claim generated off the system and submitted through email later than 24 hours from the time of approval shall be declared unpayable and shall not form part of LCT's liability.", checkField: "excluded_service_list; scheme_scope", serviceCategory: "Off-system claims", ruleLogic: "off_system_claim submitted > 24H after approval => UNPAYABLE", unitOfApplication: "per claim", severity: "HIGH", source: "Clause 6(vii)", checkRef: "CHK-012", confidence: 0.6, sourceQuote: "Any claim submitted after this time shall be declared unpayable and as such shall not form part of LCT's liability.", status: "PENDING" }),
  rule({ ruleId: "LCT-PREA-001", category: "Preauthorization", ruleType: "PREAUTH_CATEGORY", description: "All services requiring preauthorization must be processed through the LCT system, with approval evidence submitted alongside the claim.", checkField: "preauth_reference", serviceCategory: "All preauth-required services", ruleLogic: "REQUIRED (approval evidence submitted with claim)", unitOfApplication: "per service/claim", severity: "CRITICAL", source: "Clause 6.i", checkRef: "CHK-009", confidence: 0.95, sourceQuote: "Additionally, all services requiring preauthorization must be processed through the LCT system, with approval evidence submitted alongside the claim.", status: "APPROVED", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-PREA-002", category: "Preauthorization", ruleType: "PREAUTH_CATEGORY", description: "External appliances and assistive devices (hearing aids, crutches, clubfoot brace, walking frames) require preauthorization.", checkField: "preauth_reference", serviceCategory: "External Appliances & Assistive Devices", ruleLogic: "REQUIRED", unitOfApplication: "per service", severity: "HIGH", source: "Annexure 1 – Tariffs & Access Rules", checkRef: "CHK-009", confidence: 0.93, sourceQuote: "Will need preauthorization", status: "PENDING" }),
  rule({ ruleId: "LCT-PREA-003", category: "Preauthorization", ruleType: "PREAUTH_CATEGORY", description: "Oncology services are accessible on preauthorization and are co-insured by SHIF.", checkField: "preauth_reference", serviceCategory: "Oncology Services", ruleLogic: "REQUIRED", unitOfApplication: "per service", severity: "HIGH", source: "Annexure 1 – Tariffs & Access Rules (Oncology)", checkRef: "CHK-009", confidence: 0.94, sourceQuote: "Services are accessible on preauthorization.", status: "PENDING" }),
  rule({ ruleId: "LCT-UTIL-007", category: "Utilization", ruleType: "LENGTH_OF_STAY_LIMIT", description: "Normal delivery maternity admission has a maximum hospital stay of 48 hours; complications beyond this require preauthorization.", checkField: "length_of_stay_hours", serviceCategory: "Maternity - Normal Delivery", ruleLogic: "<= 48 HOURS", unitOfApplication: "per admission", severity: "HIGH", source: "Annexure 1 - Maternity, Neonate and Child Health Services", checkRef: "CHK-016", confidence: 0.93, sourceQuote: "Normal delivery – maximum hospital stay of 48 hours", status: "APPROVED", ...reviewed("Harshad") }),
  rule({ ruleId: "LCT-UTIL-008", category: "Utilization", ruleType: "LENGTH_OF_STAY_LIMIT", description: "C-section maternity admission has a maximum hospital stay of 72 hours; complications beyond this require preauthorization.", checkField: "length_of_stay_hours", serviceCategory: "Maternity - Caesarean Section", ruleLogic: "<= 72 HOURS", unitOfApplication: "per admission", severity: "HIGH", source: "Annexure 1 - Maternity, Neonate and Child Health Services", checkRef: "CHK-016", confidence: 0.93, sourceQuote: "C-section - maximum stay of 72 hours", status: "PENDING" }),
]

const LCT_COVERAGE: ExpCoverage[] = [
  { checkId: "CHK-001", category: "Pricing", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 1, note: "1 rule(s) extracted" },
  { checkId: "CHK-002", category: "Pricing", criticality: "EXPECTED", status: "RECORDED_ABSENT", ruleCount: 0, note: "Record as no-average-model" },
  { checkId: "CHK-003", category: "Pricing", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 3, note: "3 rule(s) extracted" },
  { checkId: "CHK-004", category: "Pricing", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 3, note: "3 rule(s) extracted" },
  { checkId: "CHK-005", category: "Pricing", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 1, note: "1 rule(s) extracted" },
  { checkId: "CHK-006", category: "Pricing", criticality: "OPTIONAL", status: "SKIPPED", ruleCount: 0, note: "Optional check, no rule found" },
  { checkId: "CHK-007", category: "Pricing", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 1, note: "1 rule(s) extracted" },
  { checkId: "CHK-008", category: "Preauthorization", criticality: "MANDATORY", status: "MISSING_FLAGGED", ruleCount: 0, note: "Flag: no monetary preauth threshold found - confirm with payer" },
  { checkId: "CHK-009", category: "Preauthorization", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 5, note: "5 rule(s) extracted" },
  { checkId: "CHK-010", category: "Preauthorization", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 1, note: "1 rule(s) extracted" },
  { checkId: "CHK-011", category: "Preauthorization", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 3, note: "3 rule(s) extracted" },
  { checkId: "CHK-012", category: "Exclusions", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 3, note: "3 rule(s) extracted" },
  { checkId: "CHK-013", category: "Documentation", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 2, note: "2 rule(s) extracted" },
  { checkId: "CHK-014", category: "Documentation", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 2, note: "2 rule(s) extracted" },
  { checkId: "CHK-015", category: "Documentation", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 2, note: "2 rule(s) extracted" },
  { checkId: "CHK-016", category: "Utilization", criticality: "EXPECTED", status: "EXTRACTED", ruleCount: 8, note: "8 rule(s) extracted" },
  { checkId: "CHK-017", category: "Utilization", criticality: "EXPECTED", status: "RECORDED_ABSENT", ruleCount: 0, note: "Record as no revisit-window rule" },
  { checkId: "CHK-018", category: "Utilization", criticality: "OPTIONAL", status: "SKIPPED", ruleCount: 0, note: "Optional check, no rule found" },
  { checkId: "CHK-019", category: "Claim Submission", criticality: "MANDATORY", status: "EXTRACTED", ruleCount: 3, note: "3 rule(s) extracted" },
  { checkId: "CHK-020", category: "Pharmacy", criticality: "EXPECTED", status: "RECORDED_ABSENT", ruleCount: 0, note: "Record as no substitution policy" },
]

const LCT_META: ExpContractMeta = {
  documentType: "Payer Contract",
  payerName: "LCT AFRICA LIMITED",
  healthcareProvider: "[Healthcare Service Provider - blank/to be filled]",
  signedDate: "",
  effectiveDate: "",
  durationTerm: "2 Year(s)",
  servicesCovered:
    "Outpatient healthcare services, psychiatry and mental health, accident & emergency services, chronic/preexisting conditions, congenital conditions, external appliances & assistive devices, oncology services, radiology and imaging services, inpatient services, critical conditions, maternity/neonate and child health services, surgical packages (co-insured with SHIF)",
  supersedes: "",
  linkedMasterAgreement: "",
  missingFields: ["signed_date", "effective_date", "healthcare_provider", "supersedes", "linked_master_agreement"],
}

const LCT_FLAGS = [
  "CHK-008 · PREAUTH_THRESHOLD — no monetary preauth threshold found; confirm with payer.",
]

export const EXP_EXTRACTIONS: ExpExtraction[] = [
  {
    id: 14,
    jobId: "fd5fcd80",
    providerCode: "SP-2026-0004",
    providerName: "ABC",
    contractCode: "CTR-0002",
    insurerAccountId: "INS-BR-001",
    insurerName: "Britam Health",
    status: "COMPLETED",
    current: true,
    published: false,
    publishedAt: null,
    publishedByName: null,
    reviewStatus: "IN_REVIEW",
    assigneeId: 37,
    assigneeName: "Harshad Patel",
    assignedByName: "Platform Administrator",
    assignedAt: "23 Jul 2026 · 12:39",
    reviewDueAt: "28 Jul 2026",
    reviewCompletedAt: null,
    contractFileId: "FIL000092QQJQ4AUDEA5T",
    contractFilename: "LCT -THE NAIROBI WOMENS HOSPITAL 2025.pdf",
    model: "claude-opus-4-8",
    metadata: LCT_META,
    rules: LCT_RULES,
    coverage: LCT_COVERAGE,
    flags: LCT_FLAGS,
    createdByName: "Platform Administrator",
    createdAt: "23 Jul 2026 · 07:29",
    completedAt: "23 Jul 2026 · 07:37",
  },
  {
    id: 9,
    jobId: "9f2b7711",
    providerCode: "SP-2026-0004",
    providerName: "ABC",
    contractCode: "CTR-0001",
    insurerAccountId: "INS-BR-001",
    insurerName: "Britam Health",
    status: "COMPLETED",
    current: false,
    published: true,
    publishedAt: "05 Jan 2026 · 09:12",
    publishedByName: "Approver One",
    reviewStatus: "COMPLETED",
    assigneeId: 40,
    assigneeName: "James Otieno",
    assignedByName: "Platform Administrator",
    assignedAt: "03 Jan 2026 · 09:10",
    reviewDueAt: "08 Jan 2026",
    reviewCompletedAt: "04 Jan 2026 · 16:40",
    contractFileId: "FIL000041AA",
    contractFilename: "LCT -THE NAIROBI WOMENS HOSPITAL 2024.pdf",
    model: "claude-sonnet-5",
    metadata: { ...LCT_META, durationTerm: "1 Year(s)" },
    rules: LCT_RULES.slice(0, 10).map((r) => ({ ...r, status: "APPROVED" as ExpRuleStatus, reviewedByName: "James Otieno", reviewedAt: "04 Jan 2026 · 16:40" })),
    coverage: LCT_COVERAGE,
    flags: [],
    createdByName: "Platform Administrator",
    createdAt: "03 Jan 2026 · 09:02",
    completedAt: "03 Jan 2026 · 09:05",
  },
  {
    id: 22,
    jobId: "cic1122a",
    providerCode: "SP-2026-0004",
    providerName: "ABC",
    contractCode: "CTR-0007",
    insurerAccountId: "INS-CIC-002",
    insurerName: "CIC Insurance Group",
    status: "COMPLETED",
    current: true,
    published: false,
    publishedAt: null,
    publishedByName: null,
    reviewStatus: "ASSIGNED",
    assigneeId: 37,
    assigneeName: "Harshad Patel",
    assignedByName: "Platform Administrator",
    assignedAt: "18 Jul 2026 · 14:40",
    reviewDueAt: "25 Jul 2026",
    reviewCompletedAt: null,
    contractFileId: "FIL00007CIC",
    contractFilename: "CIC-ABC-HOSPITAL-2025.pdf",
    model: "claude-opus-4-8",
    metadata: { ...LCT_META, payerName: "CIC INSURANCE GROUP", durationTerm: "3 Year(s)" },
    rules: LCT_RULES.slice(0, 6).map((r) => ({ ...r, status: "PENDING" as ExpRuleStatus, reviewedByName: null, reviewedAt: null })),
    coverage: LCT_COVERAGE.slice(0, 12),
    flags: [],
    createdByName: "Platform Administrator",
    createdAt: "18 Jul 2026 · 14:40",
    completedAt: "18 Jul 2026 · 14:44",
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
      { id: "b1", action: "Contract extracted", detail: "Britam Health — 17 rules extracted from the LCT 2025 contract.", by: "Platform Administrator", when: "23 Jul 2026 · 07:37", initials: "PA", tone: "success" },
      { id: "b2", action: "Reviewer assigned", detail: "Harshad Patel assigned to review the Britam extraction.", by: "Platform Administrator", when: "23 Jul 2026 · 12:39", initials: "PA", tone: "neutral" },
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

export const getExtractions = (providerCode?: string, insurerAccountId?: string) =>
  EXP_EXTRACTIONS.filter(
    (x) =>
      (x.providerCode === providerCode ||
        getProvider(providerCode)?.displayId === x.providerCode) &&
      x.insurerAccountId === insurerAccountId
  ).sort((a, b) => Number(b.current) - Number(a.current))

export const getExtraction = (jobId?: string) =>
  EXP_EXTRACTIONS.find((x) => x.jobId === jobId)

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
