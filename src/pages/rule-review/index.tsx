import { differenceInCalendarDays } from "date-fns"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { ConsolePageHeader } from "@/components/console/page-header"
import { StatTile } from "@/components/console/stat-tile"
import { MiniBadge, type BadgeTone } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"
import { LoadingSpinner } from "@/components/common/loading"
import { HiIcon } from "@/components/hifi/icon"
import { useRuleReviewDashboard } from "@/features/rule-review/use-rule-review"

const rrGrid =
  "grid items-center gap-[14px] grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_150px_128px_34px]"

/** Derive the "Due in N days" badge from the raw ISO due date; null when the
    backend hasn't set one (currently the case on dev). */
function dueBadge(dueAt: string | null): { label: string; tone: BadgeTone } | null {
  if (!dueAt) return null
  const days = differenceInCalendarDays(new Date(dueAt), new Date())
  if (Number.isNaN(days)) return null
  const label =
    days < 0
      ? `Overdue by ${-days}d`
      : days === 0
        ? "Due today"
        : `Due in ${days} day${days !== 1 ? "s" : ""}`
  return { label, tone: days <= 2 ? "warning" : "neutral" }
}

/**
 * Rule review (hi-fi `RuleReview`) — the reviewer dashboard under Claim
 * Clean-up (LAMU): contracts assigned to the signed-in member for rule review.
 * Wired to `GET /platform/rule-review/dashboard` (token-scoped — each reviewer
 * sees only their own queue). Opening a row navigates to
 * `/rule-review/:providerCode/:insurerAccountId` (see `RuleReviewRecordPage`),
 * the fully-wired per-pair review workspace (`ContractResults`).
 */
export function RuleReviewPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useRuleReviewDashboard()

  const forbidden = error instanceof ApiError && error.status === 403
  const rows = data?.assignments ?? []

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Rule review"
        sub="Contracts assigned to you for rule review. Check each extracted rule against the source contract, then approve, edit or discard."
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          tone="primary"
          icon={<HiIcon name="inbox" />}
          value={data?.assignedToMe ?? "—"}
          label="Assigned to me"
        />
        <StatTile
          tone={data?.rulesToReview ? "warning" : "neutral"}
          icon={<HiIcon name="sliders" />}
          value={data?.rulesToReview ?? "—"}
          label="Rules to review"
        />
        <StatTile
          tone="success"
          icon={<HiIcon name="checkCircle" />}
          value={data?.completed ?? "—"}
          label="Completed"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <div
          className={cn(
            rrGrid,
            "border-b bg-muted/40 px-[15px] py-[9px] text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          )}
        >
          <span>Contract</span>
          <span>Provider</span>
          <span>Insurer</span>
          <span>Progress</span>
          <span>Due</span>
          <span />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          forbidden ? (
            <Note tone="warn" icon={<HiIcon name="lock" />} className="m-4">
              <b>Access denied.</b> You don’t have permission to review rules.
              Ask an administrator to grant you the required access.
            </Note>
          ) : (
            <Note tone="err" icon={<HiIcon name="alert" />} className="m-4">
              Couldn’t load your assignments.{" "}
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => refetch()}
              >
                Try again
              </button>
              .
            </Note>
          )
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-6 py-16 text-center">
            <span className="grid size-[52px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[22px]">
              <HiIcon name="inbox" />
            </span>
            <p className="max-w-[42ch] text-[13px] leading-[1.55] text-muted-foreground [&_b]:text-foreground">
              <b>Nothing to review.</b>
              <br />
              Contracts assigned to you for rule review will appear here.
            </p>
          </div>
        ) : (
          rows.map((x) => {
            const pct = x.rulesTotal
              ? Math.round((x.rulesReviewed / x.rulesTotal) * 100)
              : 0
            const due = dueBadge(x.dueAt)
            return (
              <button
                key={`${x.providerCode}-${x.insurerAccountId}`}
                type="button"
                onClick={() =>
                  navigate(`/rule-review/${x.providerCode}/${x.insurerAccountId}`)
                }
                className={cn(
                  rrGrid,
                  "w-full cursor-pointer border-b px-[15px] py-[11px] text-left last:border-b-0 hover:bg-muted/30"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[15px]">
                    <HiIcon name="fileText" />
                  </span>
                  <span className="min-w-0">
                    <span className="mono block truncate text-[12px] font-semibold">
                      {x.providerCode} ⇄ {x.insurerAccountId}
                    </span>
                    <span className="block text-[11.5px] text-muted-foreground">
                      assigned {x.assignedAt}
                    </span>
                  </span>
                </span>
                <span className="truncate text-[12px]">{x.providerName}</span>
                <span className="truncate text-[12px] text-muted-foreground">
                  {x.insurerName}
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-[6px] w-16 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        x.completed ? "bg-success" : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {x.rulesReviewed}/{x.rulesTotal}
                  </span>
                </span>
                <span>
                  {x.completed ? (
                    <MiniBadge tone="success">Completed</MiniBadge>
                  ) : due ? (
                    <MiniBadge tone={due.tone}>{due.label}</MiniBadge>
                  ) : (
                    <span className="text-[11.5px] text-muted-foreground">—</span>
                  )}
                </span>
                <HiIcon
                  name="chevronRight"
                  className="size-4 text-muted-foreground"
                />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
