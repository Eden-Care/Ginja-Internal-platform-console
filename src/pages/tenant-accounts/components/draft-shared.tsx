import {
  Building2Icon,
  CreditCardIcon,
  FileTextIcon,
  GitBranchIcon,
  LayersIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ROLE_TONE,
  type RoleTone,
  type SecStatus,
  type StaffRole,
} from "@/lib/console-data"

/** Section-key icon → lucide (mirrors ONB_SECTIONS `icon` keys). */
export const SECTION_ICON: Record<string, LucideIcon> = {
  building: Building2Icon,
  gitBranch: GitBranchIcon,
  layers: LayersIcon,
  creditCard: CreditCardIcon,
  fileText: FileTextIcon,
}

/** Section completion status → badge tone + label. */
export const SEC_BADGE: Record<
  SecStatus,
  { tone: "success" | "warning" | "neutral"; label: string }
> = {
  complete: { tone: "success", label: "Complete" },
  progress: { tone: "warning", label: "In progress" },
  empty: { tone: "neutral", label: "Not started" },
}

const CHIP_TONE: Record<RoleTone, string> = {
  iris: "bg-primary/12 text-primary",
  emerald: "bg-success/14 text-success",
  amber: "bg-warning/18 text-warning-subtle-foreground",
}

/** Role chip, toned by specialty (onboarding · engineer · compliance). */
export function RoleChip({ role }: { role: StaffRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[7px] py-px text-[10px] font-semibold tracking-[0.02em]",
        CHIP_TONE[ROLE_TONE[role]]
      )}
    >
      {role}
    </span>
  )
}
