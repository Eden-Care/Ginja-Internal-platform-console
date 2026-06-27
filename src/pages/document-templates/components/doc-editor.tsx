import { CopyIcon, EyeIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type DocStatus, type DocTemplate } from "@/lib/console-data"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { MiniBadge, Tagpill } from "@/components/console/tagpill"

const TPL_TONE: Record<DocStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
}

const MERGE_FIELDS = [
  { n: "org_name", d: "Organisation" },
  { n: "org_address", d: "Address" },
  { n: "member_name", d: "Member" },
  { n: "document_date", d: "Date" },
  { n: "policy_no", d: "Policy" },
]

export function DocEditor({
  tpl,
  onBack,
}: {
  tpl: DocTemplate
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Document templates
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium text-foreground">{tpl.name}</span>
      </button>

      <ConsolePageHeader
        title={
          <span className="flex items-center gap-2.5">
            {tpl.name}
            <MiniBadge tone={TPL_TONE[tpl.status]}>{tpl.status}</MiniBadge>
          </span>
        }
        sub={`${tpl.cat} · ${tpl.format} · ${tpl.version} · last edited ${tpl.updated} by ${tpl.by}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast(`${tpl.name} duplicated.`)}
            >
              <CopyIcon data-icon="inline-start" />
              Duplicate
            </Button>
            <Button size="sm" onClick={() => toast(`${tpl.name} published.`)}>
              Save &amp; publish
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel>
          <PanelHead
            title="Layout preview"
            action={
              <Tagpill className="text-[10.5px]">
                <EyeIcon className="size-3" />
                A4
              </Tagpill>
            }
          />
          <PanelBody>
            <div className="min-h-[380px] rounded-[10px] border bg-background p-6">
              <div className="mb-[18px] flex items-start justify-between border-b-2 border-primary pb-3.5">
                <div>
                  <div className="text-base font-bold text-primary">
                    {"{{org_name}}"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {"{{org_address}}"}
                  </div>
                </div>
                <div className="mono text-right text-[11px] text-muted-foreground">
                  {tpl.id}
                  <br />
                  {"{{document_date}}"}
                </div>
              </div>
              <div className="mb-3.5 text-lg font-bold">{tpl.name}</div>
              {[100, 92, 96, 70, 84].map((w, i) => (
                <div
                  key={i}
                  className="mb-[9px] h-[9px] rounded-[5px] bg-muted"
                  style={{ width: `${w}%` }}
                />
              ))}
              <div className="mt-5 mb-[9px] h-[9px] w-2/5 rounded-[5px] bg-primary/25" />
              {[88, 64].map((w, i) => (
                <div
                  key={i}
                  className="mb-[9px] h-[9px] rounded-[5px] bg-muted"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </PanelBody>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHead title="Properties" />
            <PanelBody className="py-1 text-[13px]">
              {(
                [
                  ["Category", tpl.cat, false],
                  ["Format", tpl.format, false],
                  ["Version", tpl.version, false],
                  [
                    "Tenant overrides",
                    tpl.overrides == null ? "—" : String(tpl.overrides),
                    true,
                  ],
                ] as const
              ).map(([k, v, mono]) => (
                <div
                  key={k}
                  className="grid grid-cols-[130px_1fr] items-center border-b py-[9px] last:border-0"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span
                    className={cn("text-right font-medium", mono && "mono")}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Merge fields" />
            <PanelBody className="flex flex-col gap-1.5">
              {MERGE_FIELDS.map((v) => (
                <div
                  key={v.n}
                  className="flex items-center gap-2 rounded-lg border px-2.5 py-[7px] text-[11.5px] transition-colors hover:border-primary hover:bg-primary/[0.04]"
                >
                  <span className="mono font-semibold text-primary">
                    {`{{${v.n}}}`}
                  </span>
                  <span className="ml-auto text-muted-foreground">{v.d}</span>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}
