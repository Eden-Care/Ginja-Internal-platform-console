import * as React from "react"
import {
  DownloadIcon,
  LockIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { hifiTableHead } from "@/components/console/table"
import { LoadingSpinner } from "@/components/common/loading"
import { LoadMore } from "@/components/common/load-more"
import {
  useExportAuditLogs,
  useInfiniteAuditLogs,
} from "@/features/audit/use-audit-logs"
import type { AuditKind } from "@/features/audit/types"

/** Trigger a browser download for a fetched file Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const KIND_TONE: Record<
  AuditKind,
  "info" | "success" | "neutral" | "warning" | "error"
> = {
  create: "info",
  approve: "success",
  edit: "neutral",
  danger: "error",
  warn: "warning",
  system: "neutral",
}

export function AuditLogPage() {
  const [query, setQuery] = React.useState("")
  // Infinite scroll: append 20/page as the user reaches the bottom.
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteAuditLogs()
  const exportMut = useExportAuditLogs()

  const onExport = () =>
    exportMut.mutate(
      { format: "csv" },
      {
        onSuccess: (blob) => {
          const stamp = new Date().toISOString().slice(0, 10)
          downloadBlob(blob, `audit-log-${stamp}.csv`)
          toast.success("Audit log exported.")
        },
        onError: (e) =>
          toast.error("Couldn’t export the audit log", {
            description: e instanceof Error ? e.message : undefined,
          }),
      }
    )

  const rows = React.useMemo(() => {
    const items = data?.pages.flatMap((p) => p.items) ?? []
    const q = query.toLowerCase()
    if (!q) return items
    return items.filter((a) =>
      (a.action + a.actor + a.target).toLowerCase().includes(q)
    )
  }, [data, query])

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Audit log"
        sub="Append-only, attributed record of every platform action — required for compliance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={exportMut.isPending}
          >
            <DownloadIcon data-icon="inline-start" />
            {exportMut.isPending ? "Exporting…" : "Export"}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="max-w-xs min-w-[200px] flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions, actors, targets…"
          />
        </InputGroup>
        <Tagpill>
          <LockIcon />
          Immutable
        </Tagpill>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <Note tone="err" icon={<TriangleAlertIcon />}>
          Couldn’t load the audit log.{" "}
          <button
            className="font-semibold underline underline-offset-2"
            onClick={() => refetch()}
          >
            Try again
          </button>
          .
        </Note>
      ) : (
        <Panel className="overflow-hidden">
          <Table>
            <TableHeader className={hifiTableHead}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-[13px] text-muted-foreground"
                  >
                    {query
                      ? "No entries match your search."
                      : "No audit entries yet."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="mono text-[12px] whitespace-nowrap text-muted-foreground">
                      {a.date} {a.time}
                    </TableCell>
                    <TableCell>
                      <div className="text-[12.5px] font-semibold">
                        {a.actor}
                      </div>
                    </TableCell>
                    <TableCell className="text-[12.5px]">{a.action}</TableCell>
                    <TableCell className="mono text-[11.5px] text-muted-foreground">
                      {a.target}
                    </TableCell>
                    <TableCell>
                      <MiniBadge tone={KIND_TONE[a.kind]}>{a.kind}</MiniBadge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Panel>
      )}

      {!isLoading && !isError ? (
        <LoadMore
          hasMore={hasNextPage}
          loading={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      ) : null}
    </div>
  )
}
