import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { HiIcon } from "@/components/hifi/icon"
import { MiniBadge } from "@/components/console/tagpill"
import { Breadcrumbs } from "@/components/console/breadcrumbs"
import type { Crumb } from "@/lib/navigation"
import { TabBar, type TabItem } from "@/components/console/tab-bar"
import type {
  ExpExtractionStatus,
  ExpReviewStatus,
  ExpRuleStatus,
  ExpSeverity,
  ExpStatus,
} from "./mock"

/** Root of the experiment tree — every route sits under this prefix. */
export const EXP_ROOT = "/experiments/sp"

/* -------------------------------------------------------------- tone maps */

const SP_TONE: Record<ExpStatus, "success" | "warning" | "neutral" | "info"> = {
  Active: "success",
  "Pending review": "warning",
  Inactive: "neutral",
  Draft: "info",
}
export const EXTRACT_TONE: Record<
  ExpExtractionStatus,
  "success" | "warning" | "info" | "neutral"
> = { COMPLETED: "success", RUNNING: "info", QUEUED: "neutral", FAILED: "warning" }

export const REVIEW_TONE: Record<
  ExpReviewStatus,
  "success" | "warning" | "info" | "neutral"
> = {
  UNASSIGNED: "neutral",
  ASSIGNED: "info",
  IN_REVIEW: "warning",
  COMPLETED: "success",
}
export const REVIEW_LABEL: Record<ExpReviewStatus, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In review",
  COMPLETED: "Review complete",
}
export const RULE_TONE: Record<
  ExpRuleStatus,
  "success" | "warning" | "neutral" | "info"
> = {
  APPROVED: "success",
  PENDING: "warning",
  DISCARDED: "neutral",
  ARCHIVED: "info",
}
export const SEV_TONE: Record<ExpSeverity, "warning" | "info" | "neutral"> = {
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "neutral",
}

export function SpStatusBadge({ status }: { status: ExpStatus }) {
  return <MiniBadge tone={SP_TONE[status]}>{status}</MiniBadge>
}

/* ------------------------------------------------------------- primitives */

export function spInitials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string
  size?: "md" | "lg" | "xl"
}) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[9px] bg-primary/10 font-bold text-primary",
        size === "xl"
          ? "size-14 rounded-[14px] text-[18px]"
          : size === "lg"
            ? "size-12 rounded-[12px] text-[15px]"
            : "size-9 text-[12px]"
      )}
    >
      {spInitials(name)}
    </span>
  )
}

/** One key→value line of a detail sheet. */
export function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-2.5 text-[13px] last:border-b-0">
      <span className="shrink-0 text-[12px] text-muted-foreground">{k}</span>
      <span className="min-w-0 text-right text-foreground">{v}</span>
    </div>
  )
}

/* ------------------------------------------------------------ breadcrumbs */

/**
 * The single breadcrumb trail that replaces the stacked hand-rolled BackLinks.
 * Because the experiment routes aren't in ROUTE_NODES, each page passes an
 * explicit trail — on the live page these would be route-derived.
 */
export function ExpCrumbs({ items }: { items: Crumb[] }) {
  return <Breadcrumbs items={items} />
}

/* ------------------------------------------------------- routed tab bar */

export type RoutedTab = TabItem & { href: string; end?: boolean }

/**
 * TabBar wired to the router: the active tab is derived from the URL (so a
 * refresh or deep-link restores it) and selecting a tab navigates instead of
 * setting local state. `end` marks the index/default tab (exact-match only).
 */
export function RoutedTabBar({ tabs }: { tabs: RoutedTab[] }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Longest matching prefix wins so `/insurers` doesn't shadow the index tab.
  const matches = tabs
    .filter((t) => (t.end ? pathname === t.href : pathname.startsWith(t.href)))
    .sort((a, b) => b.href.length - a.href.length)
  const activeKey = (matches[0] ?? tabs[0])?.k ?? ""

  return (
    <TabBar
      value={activeKey}
      onChange={(k) => {
        const t = tabs.find((x) => x.k === k)
        if (t) navigate(t.href)
      }}
      tabs={tabs}
    />
  )
}

/** Small dashed "coming soon" / empty panel used by unbuilt sub-tabs. */
export function SoonPanel({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/25 px-5 py-[34px] text-center">
      <span className="grid size-[54px] place-items-center rounded-[14px] border bg-card text-muted-foreground [&>svg]:size-[26px]">
        <HiIcon name={icon} />
      </span>
      <div className="text-[14px] font-bold">{title}</div>
      <p className="m-0 max-w-[42ch] text-[12.5px] leading-[1.55] text-muted-foreground">
        {body}
      </p>
      <MiniBadge tone="neutral" className="mt-1">
        Coming soon
      </MiniBadge>
    </div>
  )
}

/** Non-obtrusive banner marking these screens as the routed prototype. */
export function ExperimentBanner() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-[11.5px] text-muted-foreground">
      <MiniBadge tone="info">Experiment</MiniBadge>
      <span className="[&_b]:font-semibold [&_b]:text-foreground">
        Routed detail-page prototype — every drill-down is a real URL.{" "}
        <b>Refresh at any depth</b> and you land on the same screen; the browser
        back button and breadcrumbs replace the stacked back-links.
      </span>
    </div>
  )
}
