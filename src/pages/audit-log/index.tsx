import * as React from "react"
import { DownloadIcon, LockIcon, SearchIcon } from "lucide-react"
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
import { AUDIT_LOG, type AuditEntry } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"
import { hifiTableHead } from "@/components/console/table"

const KIND_TONE: Record<
  AuditEntry["kind"],
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

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    return AUDIT_LOG.filter((a) =>
      (a.action + a.actor + a.target).toLowerCase().includes(q)
    )
  }, [query])

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        crumbs={["Platform", "Audit log"]}
        title="Audit log"
        sub="Append-only, attributed record of every platform action — required for compliance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast("Exporting audit log…")}
          >
            <DownloadIcon data-icon="inline-start" />
            Export
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
            {rows.map((a, i) => (
              <TableRow key={`${a.date}-${a.when}-${i}`}>
                <TableCell className="mono text-[12px] whitespace-nowrap text-muted-foreground">
                  {a.date} {a.when}
                </TableCell>
                <TableCell>
                  <div className="text-[12.5px] font-semibold">{a.actor}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.role}
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
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  )
}
