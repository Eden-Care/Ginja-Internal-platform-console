import * as React from "react"
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  GitBranchIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  ZapIcon,
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
import { REGISTRY } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel } from "@/components/console/panel"
import { MiniBadge } from "@/components/console/tagpill"
import { Glyph } from "@/components/console/glyph"
import { hifiTableHead } from "@/components/console/table"
import { MODULE_TONE, ModuleDrawer } from "./components/module-drawer"

/** Compact KPI tile: icon left, big mono value over an uppercase label. */
function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex items-center gap-[13px] rounded-xl border bg-card p-3.5 shadow-xs">
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[9px] bg-primary/12 text-primary [&>svg]:size-[18px]">
        {icon}
      </span>
      <div>
        <div className="mono text-[22px] leading-none font-bold">{value}</div>
        <div className="mt-0.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {label}
        </div>
      </div>
    </div>
  )
}

export function ModuleRegistryPage() {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState<string | null>(null)

  const rows = React.useMemo(() => {
    const q = query.toLowerCase()
    return REGISTRY.filter((m) => m.name.toLowerCase().includes(q))
  }, [query])

  const total = REGISTRY.length
  const published = REGISTRY.filter((m) => m.status === "Published").length
  const beta = REGISTRY.filter((m) => m.status === "Beta").length
  const subs = REGISTRY.reduce((n, m) => n + m.subs.length, 0)

  const selected = REGISTRY.find((m) => m.id === open) ?? null

  return (
    <div className="flex flex-col gap-5">
      <ConsolePageHeader
        title="Module registry"
        sub="The platform catalogue of modules and sub-modules. Everything here is selectable during tenant onboarding — nothing is hard-coded."
        actions={
          <Button size="sm" onClick={() => toast("Register a new module.")}>
            <PlusIcon data-icon="inline-start" />
            Register module
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<LayersIcon />}
          value={String(total)}
          label="Total modules"
        />
        <StatTile
          icon={<CheckCircle2Icon />}
          value={String(published)}
          label="Published"
        />
        <StatTile icon={<ZapIcon />} value={String(beta)} label="In beta" />
        <StatTile
          icon={<GitBranchIcon />}
          value={String(subs)}
          label="Sub-modules"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <InputGroup className="max-w-xs min-w-[200px] flex-1">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules…"
          />
        </InputGroup>
      </div>

      <Panel className="overflow-hidden">
        <Table>
          <TableHeader className={hifiTableHead}>
            <TableRow className="hover:bg-transparent">
              <TableHead>Module</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner team</TableHead>
              <TableHead>Sub-modules</TableHead>
              <TableHead className="text-right">Tenants</TableHead>
              <TableHead className="w-11" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer"
                onClick={() => setOpen(m.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-primary/10 text-primary [&>svg]:size-[15px]">
                      <Glyph name={m.icon} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{m.name}</div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {m.desc}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="mono text-[12.5px]">
                  {m.version}
                </TableCell>
                <TableCell>
                  <MiniBadge tone={MODULE_TONE[m.status]}>{m.status}</MiniBadge>
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {m.owner}
                </TableCell>
                <TableCell className="text-[12.5px] text-muted-foreground">
                  {m.subs.length}
                </TableCell>
                <TableCell className="mono text-right">{m.tenants}</TableCell>
                <TableCell>
                  <span className="grid size-[30px] place-items-center rounded-lg border bg-card text-muted-foreground [&>svg]:size-[15px]">
                    <ChevronRightIcon />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <ModuleDrawer module={selected} onClose={() => setOpen(null)} />
    </div>
  )
}
