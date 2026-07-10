import * as React from "react"

import { cn } from "@/lib/utils"
import { useBrand } from "@/contexts/brand-context"
import { HiIcon } from "@/components/hifi/icon"

/** Input styled to the hi-fi `.field input` (38px tall, 8px radius, 13px,
   background fill, primary focus ring). Bespoke — the app's `Input` uses a
   different height/radius, and the auth screens must match the reference. */
export const authInput =
  "h-[38px] w-full rounded-[8px] border border-input bg-background px-[11px] text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-ring/[0.16]"

/** Label styled to the hi-fi `.field > label` (500 / 12.5px). */
export const authLabel = "text-[12.5px] font-medium text-foreground"

/* Left brand panel — shared across every auth screen (mirrors the hi-fi
   `.auth-brand`). Hidden below `lg` so the card takes the full width on small
   screens (the only addition over the desktop-only reference). */
/** The "Ginja.AI" wordmark used by the hi-fi auth screens. Falls back to the
   brand icon mark if the file is missing. */
const AUTH_WORDMARK = "/ginja-logo.png"

function AuthBrand() {
  const { brand } = useBrand()
  const [logoSrc, setLogoSrc] = React.useState(AUTH_WORDMARK)
  return (
    <div className="relative hidden flex-col overflow-hidden bg-[linear-gradient(160deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.82)_55%,oklch(0.32_0.12_275)_100%)] px-[42px] py-[44px] text-white after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.16),transparent_42%)] after:content-[''] lg:flex">
      {/* top: logo + badge */}
      <div className="relative z-[1] flex items-center justify-between">
        <img
          src={logoSrc}
          alt={brand.brandName}
          onError={() => {
            if (brand.logoUrl && logoSrc !== brand.logoUrl)
              setLogoSrc(brand.logoUrl)
          }}
          className="h-[30px] [filter:brightness(0)_invert(1)]"
        />
        <span className="inline-flex items-center gap-[5px] rounded-full bg-white/[0.16] px-2.5 py-1 text-[11px] font-semibold text-white [&>svg]:size-[11px]">
          <HiIcon name="shield" />
          Internal Ops
        </span>
      </div>

      {/* middle: headline + points */}
      <div className="relative z-[1] my-auto">
        <h1 className="mb-[14px] text-[30px] leading-[1.15] font-bold tracking-[-0.02em]">
          Platform Console
        </h1>
        <p className="mb-[26px] max-w-[34ch] text-[14px] leading-[1.6] text-white/[0.86]">
          The internal operations platform for onboarding and managing
          health-insurance tenants across East Africa.
        </p>
        <ul className="grid list-none gap-3">
          {[
            "Tenant onboarding & lifecycle",
            "Configurable modules & templates",
            "Maker-checker governance",
          ].map((t) => (
            <li
              key={t}
              className="flex items-center gap-2.5 text-[13.5px] text-white/[0.92] [&>svg]:size-[15px] [&>svg]:shrink-0 [&>svg]:text-white [&>svg]:opacity-90"
            >
              <HiIcon name="checkCircle" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* footer */}
      <div className="relative z-[1] flex items-center gap-[7px] text-[11.5px] text-white/[0.72] [&>svg]:size-3">
        <HiIcon name="lock" />
        Authorized Ginja staff only · access is logged
      </div>
    </div>
  )
}

/**
 * Full-viewport auth layout: brand panel (left) + centered card (right).
 * `wide` widens the card to 560px (MFA enrolment); default 400px.
 */
export function AuthShell({
  wide = false,
  children,
}: {
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[480px_1fr] [&_svg]:[stroke-width:1.75]">
      <AuthBrand />
      <div className="flex items-center justify-center overflow-y-auto p-10">
        <div className={cn("w-full", wide ? "max-w-[560px]" : "max-w-[400px]")}>
          {children}
        </div>
      </div>
    </div>
  )
}
