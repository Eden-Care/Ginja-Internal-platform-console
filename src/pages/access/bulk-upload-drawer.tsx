import * as React from "react"
import {
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  InfoIcon,
  PencilIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { hifiTableHead } from "@/components/console/table"
import { Note } from "@/components/console/note"
import { MiniBadge } from "@/components/console/tagpill"
import type { Role } from "@/features/access/types"
import { CheckSquare, roleDotStyle } from "./access-shared"

/* The API stores no role colour on every role, so derive a stable dot tint
   (matching the Users/Roles screens). */
const PALETTE_KEYS = ["iris", "emerald", "amber", "sky", "rose", "violet"]
function roleTint(role: Role): string {
  if (role.hexColor) return role.hexColor
  if (role.system) return "iris"
  let h = 0
  for (const ch of role.code) h += ch.charCodeAt(0)
  return PALETTE_KEYS[h % PALETTE_KEYS.length]
}

type Verdict = "ok" | "warn" | "skip" | "error"
const VERDICT: Record<Verdict, { tone: "success" | "warning" | "neutral" | "error"; label: string }> = {
  ok: { tone: "success", label: "Valid" },
  warn: { tone: "warning", label: "Warning" },
  skip: { tone: "neutral", label: "Skipped" },
  error: { tone: "error", label: "Error" },
}

type RawRow = { line: number; name: string; email: string; rolesRaw: string }
type ValidatedRow = RawRow & { verdict: Verdict; msg: string }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const splitRoles = (raw: string) =>
  raw.split(";").map((s) => s.trim()).filter(Boolean)

/* ----------------------------------------------------------- CSV parsing -- */

/** Parse one CSV line, honouring double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else q = false
      } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ",") {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

/** Map flexible header names to our three columns. */
function colIndex(headers: string[]): { name: number; email: number; roles: number } {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z]/g, ""))
  const find = (...keys: string[]) =>
    norm.findIndex((h) => keys.some((k) => h.includes(k)))
  return {
    name: find("fullname", "name"),
    email: find("workemail", "email"),
    roles: find("role"),
  }
}

function parseCsv(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0])
  const idx = colIndex(headers)
  // If no recognisable header, treat every line as data in fixed order.
  const hasHeader = idx.name >= 0 || idx.email >= 0
  const dataLines = hasHeader ? lines.slice(1) : lines
  const col = hasHeader ? idx : { name: 0, email: 1, roles: 2 }
  return dataLines.map((l, i) => {
    const cells = parseCsvLine(l)
    return {
      line: i + 1,
      name: (col.name >= 0 ? cells[col.name] : "") ?? "",
      email: (col.email >= 0 ? cells[col.email] : "") ?? "",
      rolesRaw: (col.roles >= 0 ? cells[col.roles] : "") ?? "",
    }
  })
}

/** Trigger a client-side download of generated text. */
function downloadText(filename: string, text: string, mime = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ============================================================== component === */

export function BulkUploadDrawer({
  roles,
  existingEmails,
  onClose,
}: {
  roles: Role[]
  existingEmails: string[]
  onClose: () => void
}) {
  const [step, setStep] = React.useState<"upload" | "preview" | "review">("upload")
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [fileSize, setFileSize] = React.useState<string>("")
  const [rows, setRows] = React.useState<RawRow[]>([])
  const [allOrNothing, setAllOrNothing] = React.useState(false)
  const [vf, setVf] = React.useState<"all" | "valid" | "skip" | "error">("all")
  const [editLine, setEditLine] = React.useState<number | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const roleByName = React.useCallback(
    (nm: string) =>
      roles.find((r) => r.name.toLowerCase() === nm.trim().toLowerCase()),
    [roles]
  )
  const existing = React.useMemo(
    () => existingEmails.map((e) => e.toLowerCase()),
    [existingEmails]
  )

  const validate = React.useCallback(
    (r: RawRow): { verdict: Verdict; msg: string } => {
      if (!r.name.trim()) return { verdict: "error", msg: "Name is required" }
      if (!EMAIL_RE.test(r.email.trim()))
        return { verdict: "error", msg: "Invalid email format" }
      const parts = splitRoles(r.rolesRaw)
      if (parts.length === 0)
        return { verdict: "error", msg: "Role is required — none specified" }
      const unknown = parts.find((p) => !roleByName(p))
      if (unknown)
        return { verdict: "error", msg: `Role “${unknown}” is unknown` }
      if (existing.includes(r.email.trim().toLowerCase()))
        return { verdict: "skip", msg: "A user with this email already exists — skipped" }
      if (parts.some((p) => (roleByName(p)?.name ?? "").toLowerCase().includes("admin")))
        return { verdict: "warn", msg: "High-privilege role — review before creating" }
      return {
        verdict: "ok",
        msg: parts.length > 1 ? `Ready · ${parts.length} roles` : "Ready to create",
      }
    },
    [roleByName, existing]
  )

  const validated: ValidatedRow[] = rows.map((r) => ({ ...r, ...validate(r) }))
  const counts = { ok: 0, warn: 0, skip: 0, error: 0 }
  validated.forEach((r) => counts[r.verdict]++)
  const proceed = counts.ok + counts.warn

  const acceptFile = (file: File) => {
    setFileName(file.name)
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`)
    file.text().then((t) => setRows(parseCsv(t)))
  }

  const updateRow = (line: number, patch: Partial<RawRow>) =>
    setRows((rs) => rs.map((r) => (r.line === line ? { ...r, ...patch } : r)))

  const downloadTemplate = () =>
    downloadText(
      "ginja-console-users-template.csv",
      "full_name,work_email,roles\nKwame Mensah,kwame@ginja.ai,Onboarding Specialist\nAma Owusu,ama@ginja.ai,Finance Operator; Support\n"
    )

  const downloadErrors = () => {
    const bad = validated.filter((r) => r.verdict === "error" || r.verdict === "skip")
    const csv = [
      "line,full_name,work_email,roles,reason",
      ...bad.map((r) =>
        [r.line, r.name, r.email, r.rolesRaw, r.msg]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")
    downloadText("ginja-bulk-errors.csv", csv)
  }

  const STEPS = [
    { k: "upload", l: "Upload file" },
    { k: "preview", l: "Validate rows" },
    { k: "review", l: "Review & create" },
  ] as const
  const stepIdx = { upload: 0, preview: 1, review: 2 }[step]

  const VF: [typeof vf, string, number][] = [
    ["all", "All", validated.length],
    ["valid", "Valid", counts.ok + counts.warn],
    ["skip", "Skipped", counts.skip],
    ["error", "Errors", counts.error],
  ]
  const shown = validated.filter(
    (r) =>
      r.line === editLine ||
      (vf === "all"
        ? true
        : vf === "valid"
          ? r.verdict === "ok" || r.verdict === "warn"
          : r.verdict === vf)
  )

  const roleChip = (r: Role, key: React.Key) => (
    <span
      key={key}
      className="inline-flex max-w-[140px] items-center gap-1.5 overflow-hidden rounded-full border bg-muted py-[3px] pr-[9px] pl-2 text-[10.5px] font-semibold whitespace-nowrap"
    >
      <i className="size-[7px] shrink-0 rounded-full" style={roleDotStyle(roleTint(r))} />
      <span className="truncate">{r.name}</span>
    </span>
  )

  const RoleCells = ({ raw }: { raw: string }) => {
    const parts = splitRoles(raw)
    if (parts.length === 0)
      return <span className="text-[11.5px] text-muted-foreground">— none —</span>
    const vis = parts.slice(0, 2)
    const rest = parts.slice(2)
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {vis.map((p, i) => {
          const r = roleByName(p)
          return r ? (
            roleChip(r, i)
          ) : (
            <span
              key={i}
              className="rounded-full border border-destructive/40 px-2 py-[3px] text-[10.5px] font-semibold text-destructive"
            >
              {p}
            </span>
          )
        })}
        {rest.length > 0 && (
          <span
            title={rest.join(", ")}
            className="rounded-full border bg-muted px-2 py-[3px] text-[10.5px] font-semibold text-muted-foreground"
          >
            +{rest.length} more
          </span>
        )}
      </div>
    )
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ width: "100%", maxWidth: 780 }}
        className="gap-0 p-0"
      >
        {/* header + stepper */}
        <div className="border-b p-[18px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-[11px]">
              <span className="grid size-[34px] place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[18px]">
                <UsersIcon />
              </span>
              <div>
                <SheetTitle className="text-base font-bold">Bulk-create users</SheetTitle>
                <SheetDescription className="mt-0.5 text-xs">
                  Onboard many Ginja staff at once from a spreadsheet.
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="outline" size="icon-sm">
                <XIcon />
              </Button>
            </SheetClose>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.k}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[11.5px] font-semibold",
                    i === stepIdx
                      ? "text-primary"
                      : i < stepIdx
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-[18px] place-items-center rounded-full text-[10px] [&>svg]:size-3",
                      i === stepIdx
                        ? "bg-primary text-primary-foreground"
                        : i < stepIdx
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i < stepIdx ? <CheckIcon /> : i + 1}
                  </span>
                  {s.l}
                </div>
                {i < STEPS.length - 1 && (
                  <span
                    className={cn(
                      "h-px flex-1",
                      i < stepIdx ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ---------------- STEP 1 · UPLOAD ---------------- */}
        {step === "upload" && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
            <Note tone="info" icon={<InfoIcon />}>
              <b>Platform Console users only.</b> This creates Ginja AI staff
              identities. Tenant or member identities are rejected during validation.
            </Note>

            <div className="flex items-center gap-[11px] rounded-xl border bg-muted/30 p-3.5">
              <span className="grid size-[34px] place-items-center rounded-[9px] bg-primary/10 text-primary [&>svg]:size-[17px]">
                <FileSpreadsheetIcon />
              </span>
              <div className="min-w-0 flex-1">
                <b className="text-[13px]">Start from the template</b>
                <div className="text-[11.5px] text-muted-foreground">
                  Columns: <span className="mono">full_name</span>,{" "}
                  <span className="mono">work_email</span>,{" "}
                  <span className="mono">roles</span> (semicolon-separated).
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <DownloadIcon data-icon="inline-start" />
                Template
              </Button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) acceptFile(f)
              }}
            />
            {!fileName ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) acceptFile(f)
                }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-muted/20 px-6 py-10 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 [&>svg]:size-6"
              >
                <UploadIcon />
                <b className="text-[13px] text-foreground">Drop your CSV here</b>
                <div className="text-xs">or click to browse · CSV up to 5 MB</div>
              </button>
            ) : (
              <div className="flex items-center gap-[11px] rounded-xl border p-3.5">
                <span className="grid size-[34px] place-items-center rounded-[9px] bg-primary/10 text-primary [&>svg]:size-[18px]">
                  <FileSpreadsheetIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="text-[13px]">{fileName}</b>
                  <div className="text-[11.5px] text-muted-foreground">
                    {fileSize} · {rows.length} data rows detected
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => {
                    setFileName(null)
                    setRows([])
                  }}
                >
                  <Trash2Icon />
                </Button>
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-[11px] rounded-xl border p-3.5">
              <input
                type="checkbox"
                className="hidden"
                checked={allOrNothing}
                onChange={(e) => setAllOrNothing(e.target.checked)}
              />
              <CheckSquare on={allOrNothing} />
              <div>
                <b className="text-[12.5px]">All-or-nothing</b>
                <div className="text-[11.5px] text-muted-foreground">
                  If any row is invalid, commit none. Off: valid rows proceed and
                  invalid rows are reported.
                </div>
              </div>
            </label>
          </div>
        )}

        {/* ---------------- STEP 2 · VALIDATION ---------------- */}
        {step === "preview" && (
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-[18px]">
            <div className="grid grid-cols-4 gap-2.5">
              {(
                [
                  ["Total rows", rows.length, "neutral"],
                  ["Valid", counts.ok + counts.warn, "success"],
                  ["Skipped", counts.skip, "neutral"],
                  ["Errors", counts.error, "error"],
                ] as const
              ).map(([l, n, tone]) => (
                <div key={l} className="rounded-xl border bg-card p-3">
                  <div
                    className={cn(
                      "text-[19px] font-bold tabular-nums",
                      tone === "success" && "text-success",
                      tone === "error" && n > 0 && "text-destructive"
                    )}
                  >
                    {n}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>

            {allOrNothing && counts.error > 0 ? (
              <Note tone="warn" icon={<TriangleAlertIcon />}>
                <b>All-or-nothing is on.</b> {counts.error} error
                {counts.error > 1 ? "s" : ""} present — nothing will be committed
                until every row is valid.
              </Note>
            ) : (
              <Note tone="info" icon={<InfoIcon />}>
                <b>
                  {proceed} user{proceed === 1 ? "" : "s"} ready
                </b>{" "}
                · {counts.skip} duplicate skipped, {counts.error} error
                {counts.error === 1 ? "" : "s"} excluded. Errors don’t block valid
                rows.
              </Note>
            )}

            <div className="flex flex-wrap gap-1.5">
              {VF.map(([k, l, n]) => (
                <button
                  key={k}
                  onClick={() => setVf(k)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors",
                    vf === k
                      ? "border-primary/55 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:border-primary/40",
                    k === "error" && n > 0 && vf !== k && "text-destructive"
                  )}
                >
                  {l}
                  <span className="mono text-[10.5px]">{n}</span>
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader className={hifiTableHead}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-9">#</TableHead>
                    <TableHead>Name &amp; email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((r) => {
                    const v = VERDICT[r.verdict]
                    const editing = editLine === r.line
                    const fixable = r.verdict === "error" || r.verdict === "skip"
                    return (
                      <React.Fragment key={r.line}>
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="mono align-top text-[11px] text-muted-foreground">
                            {r.line}
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="text-[12.5px] font-semibold">
                              {r.name || (
                                <span className="text-muted-foreground">— missing —</span>
                              )}
                            </div>
                            <div className="mono text-[11px] text-muted-foreground">
                              {r.email}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <RoleCells raw={r.rolesRaw} />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-col items-start gap-1">
                              <MiniBadge tone={v.tone}>{v.label}</MiniBadge>
                              <span
                                className={cn(
                                  "text-[11px]",
                                  r.verdict === "error"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                )}
                              >
                                {r.msg}
                              </span>
                              {fixable && !editing && (
                                <button
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary underline-offset-2 hover:underline [&>svg]:size-[11px]"
                                  onClick={() => setEditLine(r.line)}
                                >
                                  <PencilIcon />
                                  Fix inline
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {editing && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={4} className="bg-muted/30">
                              <RowEditor
                                row={r}
                                roles={roles}
                                roleByName={roleByName}
                                onChange={(patch) => updateRow(r.line, patch)}
                                onDone={() => setEditLine(null)}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              {shown.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted-foreground [&>svg]:size-[18px]">
                  <CheckCircle2Icon />
                  No rows with this status.
                </div>
              )}
            </div>

            {counts.error + counts.skip > 0 && (
              <button
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-primary underline-offset-2 hover:underline [&>svg]:size-[13px]"
                onClick={downloadErrors}
              >
                <DownloadIcon />
                Download error report ({counts.error + counts.skip} rows)
              </button>
            )}
          </div>
        )}

        {/* ---------------- STEP 3 · REVIEW ---------------- */}
        {step === "review" && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-[18px]">
            <div className="flex items-center gap-3.5 rounded-xl border bg-muted/30 p-4">
              <span className="text-[34px] font-bold tabular-nums text-primary">
                {proceed}
              </span>
              <div>
                <b className="text-[13.5px]">Pending users to create</b>
                <div className="text-xs text-muted-foreground">
                  from {fileName} · {counts.skip} skipped, {counts.error} excluded
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                Role distribution
              </div>
              <div className="flex flex-col gap-1.5">
                {(() => {
                  const dist = new Map<number, number>()
                  validated
                    .filter((r) => r.verdict === "ok" || r.verdict === "warn")
                    .forEach((r) =>
                      splitRoles(r.rolesRaw).forEach((p) => {
                        const ro = roleByName(p)
                        if (ro) dist.set(ro.id, (dist.get(ro.id) ?? 0) + 1)
                      })
                    )
                  const entries = [...dist.entries()].sort((a, b) => b[1] - a[1])
                  if (entries.length === 0)
                    return (
                      <span className="text-[12.5px] text-muted-foreground">
                        No valid rows yet.
                      </span>
                    )
                  return entries.map(([id, n]) => {
                    const ro = roles.find((r) => r.id === id)!
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-[10px] border p-[8px_11px]"
                      >
                        {roleChip(ro, id)}
                        <span className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {n} user{n > 1 ? "s" : ""}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            <Note tone="warn" icon={<ClockIcon />}>
              <b>Bulk create isn’t available yet — pending backend.</b> There’s no
              batch endpoint on the API ({" "}
              <span className="mono">POST /members/bulk</span>) yet, so this won’t
              create anyone. Validation and review above are fully functional. For
              now, invite users one at a time from <b>Invite user</b>.
            </Note>
          </div>
        )}

        {/* ---------------- FOOTER ---------------- */}
        <div className="flex items-center gap-2 border-t p-3.5">
          {step === "upload" && (
            <>
              <span className="flex-1 text-[11.5px] text-muted-foreground">
                Validation runs before anything is committed.
              </span>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!fileName || rows.length === 0} onClick={() => setStep("preview")}>
                <CheckIcon data-icon="inline-start" />
                Validate file
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                <ChevronLeftIcon data-icon="inline-start" />
                Back
              </Button>
              <span className="flex-1" />
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={proceed === 0 || (allOrNothing && counts.error > 0)}
                onClick={() => setStep("review")}
              >
                <UserPlusIcon data-icon="inline-start" />
                Continue · {proceed} {proceed === 1 ? "user" : "users"}
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep("preview")}>
                <ChevronLeftIcon data-icon="inline-start" />
                Back
              </Button>
              <span className="flex-1" />
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              {/* Create is intentionally disabled — no bulk endpoint yet (pending backend). */}
              <Button disabled title="Bulk create endpoint not available yet">
                <UserPlusIcon data-icon="inline-start" />
                Create {proceed} {proceed === 1 ? "user" : "users"}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* --------------------------------------------------------- inline editor -- */

function RowEditor({
  row,
  roles,
  roleByName,
  onChange,
  onDone,
}: {
  row: ValidatedRow
  roles: Role[]
  roleByName: (nm: string) => Role | undefined
  onChange: (patch: Partial<RawRow>) => void
  onDone: () => void
}) {
  const parts = splitRoles(row.rolesRaw)
  const addRole = (name: string) => {
    if (!name) return
    onChange({ rolesRaw: [...parts, name].join("; ") })
  }
  const removeRole = (idx: number) =>
    onChange({ rolesRaw: parts.filter((_, i) => i !== idx).join("; ") })
  const available = roles.filter(
    (ro) => !parts.some((p) => p.toLowerCase() === ro.name.toLowerCase())
  )
  const fixed = row.verdict === "ok" || row.verdict === "warn"
  const emailBad = !!row.email && !EMAIL_RE.test(row.email.trim())

  return (
    <div className="flex flex-col gap-2.5 py-1">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Name
          </label>
          <Input
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Work email
          </label>
          <Input
            value={row.email}
            aria-invalid={emailBad}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="name@ginja.ai"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
          Roles
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {parts.map((p, i) => {
            const ro = roleByName(p)
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border py-[3px] pr-1 pl-2 text-[11px] font-semibold",
                  ro ? "bg-muted" : "border-destructive/40 text-destructive"
                )}
              >
                {ro ? ro.name : p}
                <button
                  className="grid size-4 place-items-center rounded-full hover:bg-foreground/10 [&>svg]:size-2.5"
                  onClick={() => removeRole(i)}
                  title="Remove"
                >
                  <XIcon />
                </button>
              </span>
            )
          })}
          {available.length > 0 && (
            <select
              value=""
              onChange={(e) => addRole(e.target.value)}
              className="h-7 rounded-md border bg-card px-2 text-[11.5px]"
            >
              <option value="">+ Add role</option>
              {available.map((ro) => (
                <option key={ro.id} value={ro.name}>
                  {ro.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11.5px] font-medium [&>svg]:size-[13px]",
            fixed ? "text-success" : "text-destructive"
          )}
        >
          {fixed ? <CheckCircle2Icon /> : <TriangleAlertIcon />}
          {row.msg}
        </span>
        <span className="flex-1" />
        <Button variant={fixed ? "default" : "ghost"} size="sm" onClick={onDone}>
          {fixed && <CheckIcon data-icon="inline-start" />}
          {fixed ? "Done" : "Close"}
        </Button>
      </div>
    </div>
  )
}
