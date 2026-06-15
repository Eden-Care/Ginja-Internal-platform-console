import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  CreditCardIcon,
  EyeIcon,
  FileCheck2Icon,
  GitBranchIcon,
  LayersIcon,
  LockIcon,
  MinusIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAccess } from "@/contexts/access-context"
import { REGISTRY, type Approval } from "@/lib/console-data"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { Glyph } from "@/components/console/glyph"

type Decision = "ok" | "info" | "no"
type Section = { k: string; icon: LucideIcon; title: string; body: React.ReactNode }

function Meta({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="text-[11.5px] text-muted-foreground">{k}</div>
          <div className="text-[13px]">{v}</div>
        </div>
      ))}
    </div>
  )
}

function sectionsFor(a: Approval): Section[] {
  const base: Section[] = [
    {
      k: "details",
      icon: Building2Icon,
      title: "Primary tenant details",
      body: (
        <Meta
          items={[
            ["Legal entity", a.payer],
            ["Tenant type", "Insurer"],
            ["Country", "Kenya"],
            ["Data residency", "af-east-1"],
            ["Subdomain", a.payerId.toLowerCase()],
            ["Tenant Admin", a.maker],
          ]}
        />
      ),
    },
    {
      k: "modules",
      icon: LayersIcon,
      title: "Module entitlements",
      body: (
        <div className="flex flex-wrap gap-2">
          {REGISTRY.slice(0, 5).map((m) => (
            <Tagpill key={m.id}>
              <Glyph name={m.icon} className="size-3" />
              {m.name}
            </Tagpill>
          ))}
        </div>
      ),
    },
    {
      k: "billing",
      icon: CreditCardIcon,
      title: "Subscription & billing",
      body: (
        <Meta
          items={[
            ["Model", "Per Member Per Month"],
            ["Frequency", "Monthly"],
            ["Tied to", "Primary tenant"],
          ]}
        />
      ),
    },
  ]
  if (a.tenants > 1) {
    base.splice(1, 0, {
      k: "secondary",
      icon: GitBranchIcon,
      title: `Secondary tenants (${a.tenants - 1})`,
      body: (
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: a.tenants - 1 }, (_, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <GitBranchIcon className="size-[15px] text-muted-foreground" />
              <b>
                {a.payer} — entity {i + 2}
              </b>
            </div>
          ))}
        </div>
      ),
    })
  }
  if (a.docs > 0) {
    base.push({
      k: "docs",
      icon: FileCheck2Icon,
      title: `KYB documents (${a.docs})`,
      body: (
        <div className="flex flex-col gap-1.5">
          {[
            "Signed Contract",
            "Company Registration",
            "Proof of Address",
            "Director / Shareholder IDs",
          ]
            .slice(0, Math.min(4, a.docs))
            .map((d) => (
              <div
                key={d}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
              >
                <span className="grid size-4 place-items-center rounded-full bg-success text-white">
                  <CheckIcon className="size-2.5" />
                </span>
                {d}
                <Button variant="ghost" size="sm" className="ml-auto">
                  <EyeIcon data-icon="inline-start" />
                  View
                </Button>
              </div>
            ))}
        </div>
      ),
    })
  }
  return base
}

const DECISION_BTN: Record<Decision, string> = {
  ok: "data-[on=true]:border-success data-[on=true]:bg-success-subtle data-[on=true]:text-success-subtle-foreground",
  info: "data-[on=true]:border-warning data-[on=true]:bg-warning-subtle data-[on=true]:text-warning-subtle-foreground",
  no: "data-[on=true]:border-destructive data-[on=true]:bg-destructive-subtle data-[on=true]:text-destructive-subtle-foreground",
}

export function ApprovalReview({
  approval,
  onBack,
}: {
  approval: Approval
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { role, isReadonly } = useAccess()
  const a = approval
  const readonly = isReadonly("approvals")
  const isOwnSubmission = a.maker === role.name
  const canApprove = role.checker && !isOwnSubmission && !readonly

  const sections = React.useMemo(() => sectionsFor(a), [a])
  const [decisions, setDecisions] = React.useState<Record<string, Decision>>({})
  const [reject, setReject] = React.useState("")
  const setDec = (k: string, v: Decision) =>
    setDecisions((d) => ({ ...d, [k]: v }))

  const allDecided = sections.every((s) => decisions[s.k])
  const anyReject = Object.values(decisions).includes("no")
  const lockTip = isOwnSubmission
    ? "You submitted this — a different approver is required"
    : !role.checker
      ? "Only a Platform Approver can decide"
      : ""

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-foreground"
        >
          Approvals
        </button>
        <span className="text-muted-foreground/50">/</span>
        <span className="mono font-medium text-foreground">{a.id}</span>
      </nav>

      <Button
        variant="ghost"
        size="sm"
        className="-mb-1 self-start pl-1.5"
        onClick={onBack}
      >
        <ChevronLeftIcon data-icon="inline-start" />
        All approvals
      </Button>

      {/* record header */}
      <div className="flex items-start gap-3.5">
        <span className="grid size-[52px] shrink-0 place-items-center rounded-[13px] border border-primary/20 bg-primary/10 text-[19px] font-bold text-primary">
          {a.payer.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold">{a.payer}</h2>
            <MiniBadge tone={a.status === "pending" ? "warning" : "success"}>
              {a.status === "pending" ? "Pending review" : "Approved"}
            </MiniBadge>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
            <span className="mono">{a.id}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>{a.kind}</span>
            <span className="text-muted-foreground/50">·</span>
            <span>
              Submitted by{" "}
              <b className="text-foreground">{a.maker}</b> · {a.submitted}
            </span>
          </div>
        </div>
      </div>

      {!canApprove && (
        <Note tone="warn" icon={<LockIcon />}>
          {isOwnSubmission ? (
            <span>
              You submitted this request. <b>Separation of duties</b> means a
              different Platform Approver must review it — the decision controls
              are disabled for you.
            </span>
          ) : readonly ? (
            <span>
              Your role can view this submission but cannot decide.
            </span>
          ) : (
            <span>
              Your role can view this submission but cannot decide. Switch to{" "}
              <b>Platform Approver</b> (top-right) to action it.
            </span>
          )}
        </Note>
      )}

      <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-[1fr_300px]">
        {/* review sections */}
        <div className="flex flex-col gap-3">
          {sections.map((s) => {
            const Ico = s.icon
            return (
              <Panel key={s.k} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                  <Ico className="size-4 text-muted-foreground" />
                  <h4 className="text-[13.5px] font-semibold">{s.title}</h4>
                  <div className="ml-auto flex items-center gap-1.5">
                    {(
                      [
                        { v: "ok", label: "Approve" },
                        { v: "info", label: "Info needed" },
                        { v: "no", label: "Reject" },
                      ] as { v: Decision; label: string }[]
                    ).map((b) => (
                      <button
                        key={b.v}
                        type="button"
                        disabled={!canApprove}
                        title={lockTip || undefined}
                        data-on={decisions[s.k] === b.v}
                        onClick={() => setDec(s.k, b.v)}
                        className={cn(
                          "inline-flex h-7 items-center gap-1 rounded-md border border-input bg-card px-2.5 text-[11.5px] font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
                          DECISION_BTN[b.v]
                        )}
                      >
                        {b.v === "ok" && <CheckIcon className="size-3" />}
                        {b.v === "no" && <XIcon className="size-3" />}
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <PanelBody>{s.body}</PanelBody>
              </Panel>
            )
          })}
          {anyReject && (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1 text-[13px] font-medium">
                Reason for rejection / information required
                <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Required when any section is rejected or returned…"
                value={reject}
                onChange={(e) => setReject(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* decision panel */}
        <div className="lg:sticky lg:top-3">
          <Panel className="overflow-hidden">
            <PanelHead title="Decision" />
            <PanelBody className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                {sections.map((s) => {
                  const d = decisions[s.k]
                  const Ico =
                    d === "ok"
                      ? CheckIcon
                      : d === "no"
                        ? XIcon
                        : d === "info"
                          ? AlertTriangleIcon
                          : MinusIcon
                  return (
                    <div key={s.k} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-[18px] shrink-0 place-items-center rounded-full",
                          d === "ok"
                            ? "bg-success text-white"
                            : d === "no"
                              ? "bg-destructive text-white"
                              : d === "info"
                                ? "bg-warning text-white"
                                : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Ico className="size-3" />
                      </span>
                      <span className="text-[12.5px]">{s.title}</span>
                    </div>
                  )
                })}
              </div>
              <hr className="border-border" />
              <Button
                className="w-full justify-center bg-brand text-brand-foreground hover:bg-brand/90"
                disabled={!canApprove || !allDecided || anyReject}
                title={lockTip || undefined}
                onClick={() => {
                  toast.success(
                    `${a.payer} approved — auto-activation triggered.`
                  )
                  navigate("/tenant-accounts")
                }}
              >
                <CheckCircle2Icon data-icon="inline-start" />
                Approve &amp; activate
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                disabled={!canApprove || !anyReject || !reject.trim()}
                title={lockTip || undefined}
                onClick={() => {
                  toast("Returned to maker — Information Required.")
                  onBack()
                }}
              >
                <AlertTriangleIcon data-icon="inline-start" />
                Return for info
              </Button>
              <Button
                variant="destructive"
                className="w-full justify-center"
                disabled={!canApprove || !anyReject || !reject.trim()}
                title={lockTip || undefined}
                onClick={() => {
                  toast("Submission rejected. Maker notified.")
                  onBack()
                }}
              >
                <XIcon data-icon="inline-start" />
                Reject
              </Button>
              <Note tone="info" className="text-[11.5px]">
                On approval the system auto-activates the tenant, provisions
                tenants and sends admin invites.
              </Note>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}
