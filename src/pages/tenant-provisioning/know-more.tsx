import * as React from "react"
import {
  DatabaseIcon,
  GlobeIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Note } from "@/components/console/note"

/** Inline mono token used inside the explainer copy. */
function M({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-px font-mono text-[11.5px]">
      {children}
    </code>
  )
}

type Topic = { title: string; icon: LucideIcon; body: React.ReactNode }

const KNOW_MORE: Record<string, Topic> = {
  connstring: {
    title: "About the connection string",
    icon: DatabaseIcon,
    body: (
      <>
        <h5>What is it?</h5>
        <p>
          A connection string is the address + credentials your database accepts
          connections on — typically{" "}
          <M>postgres://user:password@host:port/database</M>. It tells Ginja
          exactly where the tenant&rsquo;s data lives and how to authenticate.
        </p>
        <h5>Why do we need it?</h5>
        <p>
          Ginja provisions and migrates the tenant&rsquo;s schema (tables for
          Claims, Members, Products, Finance, Reporting) directly into this
          database, and all module reads/writes run through it.
        </p>
        <h5>Where do I get it?</h5>
        <ul>
          <li>
            <b>AWS RDS / Aurora:</b> RDS Console → your cluster →{" "}
            <i>Connectivity &amp; security</i> → endpoint + port. Combine with the
            master (or app) user credentials.
          </li>
          <li>
            <b>Azure Database:</b> Resource → <i>Connection strings</i> blade.
          </li>
          <li>
            <b>Self-managed:</b> ask the tenant&rsquo;s DBA for host, port,
            database name and an app user with DDL rights.
          </li>
        </ul>
        <Note tone="ok" icon={<ShieldCheckIcon />} className="mt-3.5">
          <b>Always encrypted.</b> Connection strings are stored encrypted at rest
          (AES-256) and never shown again after saving — only a masked preview.
          Rotation re-tests automatically.
        </Note>
      </>
    ),
  },
  customdomain: {
    title: "Setting up a custom domain",
    icon: GlobeIcon,
    body: (
      <>
        <h5>What is it?</h5>
        <p>
          Instead of <M>tenant.ginja.ai</M>, the tenant&rsquo;s members and staff
          can use the insurer&rsquo;s own domain — e.g.{" "}
          <M>portal.insurer.co.ke</M>.
        </p>
        <h5>How it works</h5>
        <ul>
          <li>Enter the domain the tenant wants to use.</li>
          <li>
            The tenant&rsquo;s IT team adds a <b>CNAME record</b> at their DNS
            provider, pointing the domain at the Ginja subdomain (we show the
            exact record to copy).
          </li>
          <li>
            Click <b>Verify CNAME</b> — once DNS propagates (5 min–48 h depending
            on TTL), verification passes and a TLS certificate is issued
            automatically.
          </li>
        </ul>
        <h5>Good to know</h5>
        <ul>
          <li>The Ginja subdomain keeps working as a fallback.</li>
          <li>Changing the custom domain later re-runs verification with zero downtime.</li>
          <li>
            Apex domains (e.g. <M>insurer.co.ke</M>) need an ALIAS/ANAME record —
            most tenants use a subdomain.
          </li>
        </ul>
      </>
    ),
  },
  tls: {
    title: "About TLS certificates",
    icon: ShieldCheckIcon,
    body: (
      <>
        <h5>What is it?</h5>
        <p>
          A TLS (SSL) certificate encrypts all traffic between users and the
          tenant&rsquo;s portal — the padlock in the browser. Without it, logins,
          member data and claims would travel in plain text.
        </p>
        <h5>Why it matters here</h5>
        <ul>
          <li>
            Health-insurance data is sensitive — encryption in transit is a
            regulatory baseline (and required for HIPAA-equivalent regimes).
          </li>
          <li>Browsers block or warn on non-HTTPS sites, which would break member trust.</li>
        </ul>
        <h5>What you need to do</h5>
        <p>
          <b>Nothing, usually.</b> Certificates are auto-provisioned via
          Let&rsquo;s Encrypt when the domain verifies, and auto-renew every 60
          days. If a renewal fails (e.g. the CNAME was removed), this section
          flags it and the on-call engineer is paged.
        </p>
      </>
    ),
  },
}

/** "Know more" link that opens a side drawer explaining a provisioning topic. */
export function KnowMore({ topic, label }: { topic: string; label: string }) {
  const [open, setOpen] = React.useState(false)
  const t = KNOW_MORE[topic]
  if (!t) return null
  const Icon = t.icon
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
      >
        <Icon className="size-3.5" />
        {label}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-[18px]" />
              </span>
              {t.title}
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-5 py-4 text-[12.5px] leading-relaxed text-foreground [&_h5]:mt-[18px] [&_h5]:mb-1.5 [&_h5]:text-[13px] [&_h5]:font-bold [&_h5:first-child]:mt-0 [&_li]:leading-snug [&_p]:mb-2.5 [&_ul]:mb-2.5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-[18px]">
            {t.body}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
