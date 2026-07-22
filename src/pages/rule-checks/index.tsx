import * as React from "react"
import {
  ListChecksIcon,
  PlusIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConsolePageHeader } from "@/components/console/page-header"
import { ConsoleSelect, Seg } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { hifiTableHead } from "@/components/console/table"
import { ConfirmDialog } from "@/components/console/confirm-dialog"
import { MBadge } from "@/components/hifi/badge"
import { LoadingSpinner } from "@/components/common/loading"
import { useAccess } from "@/contexts/access-context"
import {
  useCreateRulesCheck,
  useDeleteRulesCheck,
  useRulesChecks,
  useUpdateRulesCheck,
} from "@/features/rule-checks/use-rules-checks"
import {
  CRITICALITIES,
  type CreateRulesCheckBody,
  type RulesCheck,
} from "@/features/rule-checks/types"

import {
  CheckSheet,
  criticalityTone,
  type SheetMode,
} from "./components/check-sheet"

const STATUS_FILTERS = ["All", "Active", "Inactive"]

/** First semicolon-token of a triggered-at string (the primary stage). */
function primaryStage(s: string): { first: string; rest: number } {
  const parts = s
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
  return { first: parts[0] ?? "", rest: Math.max(0, parts.length - 1) }
}

export function RuleChecksPage() {
  const { hasPermission, isReadonly } = useAccess()
  const canEdit = hasPermission("rules-checks") && !isReadonly("rules-checks")

  const checksQuery = useRulesChecks()
  const checks = React.useMemo(() => checksQuery.data ?? [], [checksQuery.data])

  const createMut = useCreateRulesCheck()
  const updateMut = useUpdateRulesCheck()
  const deleteMut = useDeleteRulesCheck()

  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [criticality, setCriticality] = React.useState("")
  const [status, setStatus] = React.useState("All")

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [sheetMode, setSheetMode] = React.useState<SheetMode>("view")
  const [activeCheck, setActiveCheck] = React.useState<RulesCheck | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState<RulesCheck | null>(
    null
  )

  // Distinct categories, for the filter dropdown + the create/edit datalist.
  const categories = React.useMemo(
    () =>
      [...new Set(checks.map((c) => c.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [checks]
  )

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return checks.filter((c) => {
      if (category && c.category !== category) return false
      if (criticality && c.criticality !== criticality) return false
      if (status === "Active" && !c.active) return false
      if (status === "Inactive" && c.active) return false
      if (!q) return true
      return [
        c.checkId,
        c.category,
        c.ruleType,
        c.extractionGuidance,
        c.triggerKeywords,
        c.triggeredAt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [checks, query, category, criticality, status])

  const openView = (c: RulesCheck) => {
    setActiveCheck(c)
    setSheetMode("view")
    setSheetOpen(true)
  }
  const openCreate = () => {
    setActiveCheck(null)
    setSheetMode("create")
    setSheetOpen(true)
  }

  const handleSave = (body: CreateRulesCheckBody) => {
    if (sheetMode === "create") {
      createMut.mutate(body, {
        onSuccess: (created) => {
          toast.success(`Created ${created.checkId}.`)
          setActiveCheck(created)
          setSheetMode("view")
        },
        onError: (e) =>
          toast.error("Couldn't create check", {
            description: e instanceof Error ? e.message : undefined,
          }),
      })
    } else if (activeCheck) {
      updateMut.mutate(
        { checkId: activeCheck.checkId, body },
        {
          onSuccess: (updated) => {
            toast.success(`Updated ${updated.checkId}.`)
            setActiveCheck(updated)
            setSheetMode("view")
          },
          onError: (e) =>
            toast.error("Couldn't update check", {
              description: e instanceof Error ? e.message : undefined,
            }),
        }
      )
    }
  }

  const handleDelete = () => {
    const target = confirmDelete
    if (!target) return
    deleteMut.mutate(target.checkId, {
      onSuccess: () => {
        toast.success(`Deleted ${target.checkId}.`)
        setConfirmDelete(null)
        setSheetOpen(false)
      },
      onError: (e) => {
        setConfirmDelete(null)
        toast.error("Couldn't delete check", {
          description: e instanceof Error ? e.message : undefined,
        })
      },
    })
  }

  const activeCount = checks.filter((c) => c.active).length

  return (
    <div className="flex flex-col [&_svg]:[stroke-width:1.75]">
      <ConsolePageHeader
        className="mb-[18px]"
        title="Rules-extraction checks"
        sub={
          <span className="text-[13px]">
            The master catalogue of checks (CHK-NNN) the document service reads
            when extracting rules from Claim Clean-up contracts.
          </span>
        }
        actions={
          canEdit ? (
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              New check
            </Button>
          ) : undefined
        }
      />

      <Note tone="info" icon={<ListChecksIcon />} className="mb-[14px]">
        Each check tells the extraction engine <b>what to look for</b> in a
        contract and <b>how to flag it</b>. Deactivate a check to exclude it from
        future runs without deleting it.
      </Note>

      <div className="flex flex-col gap-3 pt-[10px] pb-[14px] lg:flex-row lg:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-[8px] border border-input bg-background px-2.5 lg:max-w-xs lg:flex-1">
          <SearchIcon className="size-[15px] shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search checks…"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConsoleSelect
            value={category || "__all"}
            onChange={(v) => setCategory(v === "__all" ? "" : v)}
            options={[
              { value: "__all", label: "All categories" },
              ...categories.map((c) => ({ value: c, label: c })),
            ]}
            className="h-[34px] w-[170px]"
          />
          <ConsoleSelect
            value={criticality || "__all"}
            onChange={(v) => setCriticality(v === "__all" ? "" : v)}
            options={[
              { value: "__all", label: "All criticalities" },
              ...CRITICALITIES.map((c) => ({ value: c, label: c })),
            ]}
            className="h-[34px] w-[170px]"
          />
          <Seg value={status} options={STATUS_FILTERS} onChange={setStatus} />
        </div>
      </div>

      {checksQuery.isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : checksQuery.isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load the checks catalogue.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => checksQuery.refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          {checks.length === 0
            ? "No checks in the catalogue yet."
            : "No checks match these filters."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[12px] border bg-card">
          <Table>
            <TableHeader className={hifiTableHead}>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[92px]">Check</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rule type</TableHead>
                <TableHead className="w-[120px]">Criticality</TableHead>
                <TableHead>Triggered at</TableHead>
                <TableHead className="w-[70px] text-right">Sort</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => {
                const stage = primaryStage(c.triggeredAt)
                return (
                  <TableRow
                    key={c.checkId}
                    onClick={() => openView(c)}
                    className={cn(
                      "cursor-pointer",
                      !c.active && "opacity-60"
                    )}
                  >
                    <TableCell>
                      <span className="mono text-[12.5px] font-semibold">
                        {c.checkId}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] font-medium">
                      {c.category || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="mono text-[11.5px] text-muted-foreground">
                        {c.ruleType || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <MBadge tone={criticalityTone(c.criticality)}>
                        {c.criticality}
                      </MBadge>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {stage.first ? (
                        <span className="inline-flex items-center gap-1.5">
                          {stage.first}
                          {stage.rest > 0 ? (
                            <span className="rounded-[5px] bg-muted px-1.5 py-px text-[10.5px] font-medium">
                              +{stage.rest}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="mono text-right text-[12.5px] text-muted-foreground">
                      {c.sortOrder}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <span
                          className={cn(
                            "size-[7px] rounded-full",
                            c.active ? "bg-success" : "bg-muted-foreground/40"
                          )}
                        />
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!checksQuery.isLoading && !checksQuery.isError ? (
        <div className="pt-3 text-[12px] text-muted-foreground">
          {rows.length} of {checks.length} check{checks.length === 1 ? "" : "s"}
          {" · "}
          {activeCount} active
        </div>
      ) : null}

      <CheckSheet
        open={sheetOpen}
        mode={sheetMode}
        check={activeCheck}
        canEdit={canEdit}
        categories={categories}
        saving={createMut.isPending || updateMut.isPending}
        onModeChange={setSheetMode}
        onSave={handleSave}
        onDelete={() => activeCheck && setConfirmDelete(activeCheck)}
        onOpenChange={setSheetOpen}
      />

      <ConfirmDialog
        open={confirmDelete != null}
        tone="danger"
        icon={<TriangleAlertIcon />}
        title={`Delete ${confirmDelete?.checkId ?? "check"}?`}
        body={
          <>
            This permanently removes the check from the catalogue. To keep the
            row but exclude it from extraction, deactivate it instead.
          </>
        }
        confirmLabel={deleteMut.isPending ? "Deleting…" : "Delete check"}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
