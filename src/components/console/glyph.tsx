import {
  BarChart3Icon,
  Building2Icon,
  CreditCardIcon,
  FileCheckIcon,
  InboxIcon,
  LayersIcon,
  type LucideIcon,
  NetworkIcon,
  PackageIcon,
  PercentIcon,
  ShieldIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

/** Maps the design's icon names (modules + pricing models) to lucide icons. */
const MAP: Record<string, LucideIcon> = {
  claims: FileCheckIcon,
  underwriting: ShieldIcon,
  providers: NetworkIcon,
  crm: UsersIcon,
  products: PackageIcon,
  finance: CreditCardIcon,
  analytics: BarChart3Icon,
  reinsurance: LayersIcon,
  inbox: InboxIcon,
  zap: ZapIcon,
  fileCheck: FileCheckIcon,
  percent: PercentIcon,
  creditCard: CreditCardIcon,
  layers: LayersIcon,
  building: Building2Icon,
}

/** The glyph names available to the module icon picker. */
export const GLYPH_NAMES = Object.keys(MAP)

export function Glyph({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = MAP[name] ?? Building2Icon
  return <Icon className={className} />
}
