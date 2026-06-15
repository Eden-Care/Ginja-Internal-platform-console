import * as React from "react"
import { EyeIcon, InfoIcon, SendIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  EMAIL_VARS,
  type DocStatus,
  type EmailTemplate,
} from "@/lib/console-data"
import { renderTpl } from "@/lib/console-format"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Field } from "@/components/console/form-atoms"
import { MiniBadge } from "@/components/console/tagpill"
import { Note } from "@/components/console/note"

const TPL_TONE: Record<DocStatus, "success" | "neutral"> = {
  Published: "success",
  Draft: "neutral",
}

export function EmailEditor({
  tpl,
  onBack,
}: {
  tpl: EmailTemplate
  onBack: () => void
}) {
  const [subject, setSubject] = React.useState(tpl.subject)
  const [body, setBody] = React.useState(tpl.body)

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Email &amp; SMS templates
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
        sub={`Trigger: ${tpl.trigger} · ${tpl.channel} · ${tpl.version}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Test message sent.")}
            >
              <SendIcon data-icon="inline-start" />
              Send test
            </Button>
            <Button size="sm" onClick={() => toast(`${tpl.name} published.`)}>
              Save &amp; publish
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Field label="Subject line">
            <Input
              className="mono text-[12.5px]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Message body">
            <Textarea
              className="mono min-h-[240px] text-[12.5px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>

          <Panel>
            <PanelHead
              icon={<EyeIcon />}
              title="Live preview"
              action={
                <span className="text-[11px] text-muted-foreground">
                  Sample: Jubilee Health
                </span>
              }
            />
            <PanelBody>
              <div className="rounded-[10px] border bg-white p-6">
                <div className="text-[15px] font-bold text-slate-900">
                  {renderTpl(subject)}
                </div>
                <div className="mt-0.5 mb-4 border-b border-slate-200 pb-3 text-[11.5px] text-slate-500">
                  from notifications@ginja.ai
                </div>
                <div className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-slate-800">
                  {renderTpl(body)}
                </div>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHead title="Merge variables" />
            <PanelBody className="flex flex-col gap-2.5">
              <p className="text-[11.5px] text-muted-foreground">
                Click to insert at the cursor.
              </p>
              <div className="flex flex-col gap-1.5">
                {EMAIL_VARS.map((v) => (
                  <button
                    key={v.n}
                    type="button"
                    onClick={() => setBody((b) => `${b} {{${v.n}}}`)}
                    className="flex items-center gap-2 rounded-lg border px-2.5 py-[7px] text-[11.5px] transition-colors hover:border-primary hover:bg-primary/[0.04]"
                  >
                    <span className="mono font-semibold text-primary">
                      {`{{${v.n}}}`}
                    </span>
                    <span className="ml-auto text-muted-foreground">{v.d}</span>
                  </button>
                ))}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHead title="Delivery" />
            <PanelBody className="flex flex-col gap-2.5 text-[13px]">
              {(
                [
                  ["Channel", tpl.channel],
                  ["Trigger", tpl.trigger],
                  ["Tenant overrides", String(tpl.overrides)],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right text-[12.5px] font-medium">
                    {v}
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>

          <Note tone="info" icon={<InfoIcon />}>
            Tenants inherit this template and can override the copy in their own
            admin settings.
          </Note>
        </div>
      </div>
    </div>
  )
}
