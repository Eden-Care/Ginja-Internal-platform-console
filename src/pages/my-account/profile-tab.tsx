import * as React from "react"
import {
  CheckIcon,
  GlobeIcon,
  InfoIcon,
  MailIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { Note } from "@/components/console/note"
import { Field } from "@/components/console/form-atoms"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { Tagpill } from "@/components/console/tagpill"
import { useAccess } from "@/contexts/access-context"
import { PHOTO_GRADIENT } from "./shared"

const DIAL_CODES = [
  { value: "+254", label: "🇰🇪 +254" },
  { value: "+255", label: "🇹🇿 +255" },
  { value: "+256", label: "🇺🇬 +256" },
  { value: "+250", label: "🇷🇼 +250" },
  { value: "+251", label: "🇪🇹 +251" },
]

const TIMEZONES = [
  "Africa/Nairobi (EAT, UTC+03:00)",
  "Africa/Kigali (CAT, UTC+02:00)",
  "Africa/Addis_Ababa (EAT, UTC+03:00)",
]

const LANGUAGES = ["English", "Kiswahili", "Français"]

const BIO_MAX = 200

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AO"
  )
}

/** Error chip rendered under a field. */
function FieldErr({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 font-medium [&>svg]:size-3 [&>svg]:shrink-0">
      <TriangleAlertIcon />
      {children}
    </span>
  )
}

export function ProfileTab() {
  const { user, role } = useAccess()

  const fallbackName = user.fullName || "Amara Okeke"
  const fallbackEmail = user.email || "amara.okeke@ginja.ai"

  const [photo, setPhoto] = React.useState(false)
  const [tried, setTried] = React.useState(false)
  const [f, setF] = React.useState({
    name: fallbackName,
    email: fallbackEmail,
    dialCode: "+254",
    phone: "712 345 678",
    title: role.label || "Platform Admin",
    roles: [role.label || "Platform Admin", "Platform Operations"],
    tz: TIMEZONES[0],
    lang: "English",
    bio: "Platform operations at Ginja AI — onboarding and managing health-insurer tenants across East Africa.",
  })
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))

  const perr: Record<string, string> = {}
  if (!f.name.trim()) perr.name = "Full name is required."
  else if (f.name.trim().length < 2) perr.name = "Enter your full name."
  if (!/^[0-9\s]{7,}$/.test(f.phone.trim()))
    perr.phone = "Enter a valid phone number."
  if (!f.title.trim()) perr.title = "Job title is required."
  const pe = (k: string) => tried && perr[k]
  const perrCount = Object.keys(perr).length

  const [avatarOpen, setAvatarOpen] = React.useState(false)
  const [zoom, setZoom] = React.useState(20)
  const [rot, setRot] = React.useState(0)

  const subRoles = f.roles.slice(0, 2).join(" · ")

  return (
    <>
      {/* hero */}
      <div className="mb-4 flex items-center gap-4 rounded-[14px] border bg-card p-[18px] shadow-xs">
        <div
          className="relative grid size-16 shrink-0 place-items-center rounded-full font-sans text-[22px] font-bold"
          style={
            photo
              ? { background: PHOTO_GRADIENT, color: "transparent" }
              : {
                  background: "hsl(var(--primary) / 0.14)",
                  color: "hsl(var(--primary))",
                }
          }
        >
          {!photo && initials(f.name)}
          <button
            type="button"
            title="Change photo"
            onClick={() => setAvatarOpen(true)}
            className="absolute -right-0.5 -bottom-0.5 grid size-6 cursor-pointer place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground [&>svg]:size-3"
          >
            <PencilIcon />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold">{f.name}</div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">
            {subRoles}
            {f.roles.length > 2 && (
              <span title={f.roles.slice(2).join(", ")}>
                {" "}
                · +{f.roles.length - 2} more
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-[7px]">
            <Tagpill>
              <MailIcon />
              {f.email}
            </Tagpill>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAvatarOpen(true)}>
          <UploadIcon data-icon="inline-start" />
          Change photo
        </Button>
      </div>

      {/* personal details */}
      <Panel>
        <PanelHead
          icon={<InfoIcon />}
          title="Personal details"
        />
        <PanelBody className="flex flex-col gap-3.5">
          {tried && perrCount > 0 && (
            <Note tone="err" icon={<TriangleAlertIcon />}>
              <b>
                {perrCount} {perrCount === 1 ? "field needs" : "fields need"}{" "}
                attention.
              </b>{" "}
              Fix the highlighted fields and save again.
            </Note>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              hint={pe("name") ? <FieldErr>{perr.name}</FieldErr> : undefined}
              hintTone="error"
            >
              <Input
                value={f.name}
                onChange={(e) => set({ name: e.target.value })}
                aria-invalid={!!pe("name")}
              />
            </Field>
            <Field
              label="Work email"
              hint="Managed by your administrator — contact IT to change."
            >
              <Input value={f.email} disabled />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Phone"
              hint={pe("phone") ? <FieldErr>{perr.phone}</FieldErr> : undefined}
              hintTone="error"
            >
              <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-2">
                <ConsoleSelect
                  value={f.dialCode}
                  onChange={(v) => set({ dialCode: v })}
                  options={DIAL_CODES}
                />
                <Input
                  value={f.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="712 345 678"
                  inputMode="tel"
                  aria-invalid={!!pe("phone")}
                />
              </div>
            </Field>
            <Field
              label="Job title"
              hint={pe("title") ? <FieldErr>{perr.title}</FieldErr> : undefined}
              hintTone="error"
            >
              <Input
                value={f.title}
                onChange={(e) => set({ title: e.target.value })}
                aria-invalid={!!pe("title")}
              />
            </Field>
          </div>
          <Field label="Bio">
            <Textarea
              value={f.bio}
              maxLength={BIO_MAX}
              onChange={(e) => set({ bio: e.target.value.slice(0, BIO_MAX) })}
              className="min-h-16"
            />
            <span className="flex justify-between text-[11.5px]">
              <span
                className={cn(
                  "text-muted-foreground",
                  f.bio.length >= BIO_MAX && "text-destructive"
                )}
              >
                {f.bio.length >= BIO_MAX
                  ? "Character limit reached."
                  : "A short summary shown on your profile."}
              </span>
              <span
                className={cn(
                  "text-muted-foreground",
                  f.bio.length >= BIO_MAX && "text-destructive"
                )}
              >
                {f.bio.length}/{BIO_MAX}
              </span>
            </span>
          </Field>
        </PanelBody>
      </Panel>

      {/* preferences */}
      <Panel className="mt-4">
        <PanelHead icon={<GlobeIcon />} title="Preferences" />
        <PanelBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Timezone">
            <ConsoleSelect
              value={f.tz}
              onChange={(v) => set({ tz: v })}
              options={TIMEZONES}
            />
          </Field>
          <Field label="Language">
            <ConsoleSelect
              value={f.lang}
              onChange={(v) => set({ lang: v })}
              options={LANGUAGES}
            />
          </Field>
        </PanelBody>
      </Panel>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost">Discard</Button>
        <Button
          onClick={() => {
            setTried(true)
            if (perrCount === 0) toast("Profile updated.")
          }}
        >
          <CheckIcon data-icon="inline-start" />
          Save changes
        </Button>
      </div>

      {/* avatar cropper */}
      <Dialog open={avatarOpen} onOpenChange={(o) => !o && setAvatarOpen(false)}>
        <DialogContent showCloseButton={false} className="max-w-[460px] gap-3 p-5">
          <span className="grid size-[42px] place-items-center rounded-[11px] bg-primary/12 text-primary [&>svg]:size-5">
            <UsersIcon />
          </span>
          <DialogTitle className="font-heading text-base font-bold">
            Update profile photo
          </DialogTitle>

          <div className="grid place-items-center pt-1 pb-3.5">
            <div className="relative size-[248px] cursor-grab overflow-hidden rounded-xl bg-[#1a1a1f]">
              <div
                className="absolute inset-0 origin-center transition-transform"
                style={{
                  background: PHOTO_GRADIENT,
                  transform: `scale(${1 + zoom / 100}) rotate(${rot}deg)`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] outline-2 -outline-offset-2 outline-white">
                <span
                  className="absolute inset-0 overflow-hidden rounded-full opacity-60"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
                    backgroundSize: "33.33% 33.33%",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2.5">
            <button
              type="button"
              title="Zoom out"
              onClick={() => setZoom((z) => Math.max(0, z - 10))}
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-[7px] border border-input bg-card hover:bg-muted [&>svg]:size-[15px]"
            >
              <MinusIcon />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
              aria-label="Zoom"
              className="flex-1 accent-primary"
            />
            <button
              type="button"
              title="Zoom in"
              onClick={() => setZoom((z) => Math.min(100, z + 10))}
              className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-[7px] border border-input bg-card hover:bg-muted [&>svg]:size-[15px]"
            >
              <PlusIcon />
            </button>
          </div>

          <div className="mb-3.5 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm">
              <UploadIcon data-icon="inline-start" />
              Choose file
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRot((r) => r - 90)}>
              <RotateCcwIcon data-icon="inline-start" />
              Rotate
            </Button>
          </div>

          <div className="rounded-[10px] border bg-muted/45 px-[13px] py-3 text-[11.5px] text-muted-foreground">
            <div className="mb-[7px] flex items-center gap-[7px] text-xs font-semibold text-foreground [&>svg]:size-[13px]">
              <InfoIcon />
              Guidelines
            </div>
            <ul className="flex list-disc flex-col gap-1 pl-[17px] leading-[1.45]">
              <li>
                Drag the photo to reposition; use the slider to zoom and Rotate
                to straighten.
              </li>
              <li>JPG or PNG, at least 200×200px, up to 5&nbsp;MB.</li>
              <li>
                A square, well-lit headshot works best — avoid text-heavy or
                low-contrast images.
              </li>
            </ul>
          </div>

          <DialogFooter className="mx-0 mt-2 mb-0 items-center gap-2 border-0 bg-transparent p-0 sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setPhoto(false)
                setAvatarOpen(false)
                toast("Profile photo removed.")
              }}
              className="mr-auto inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline [&>svg]:size-[13px]"
            >
              <Trash2Icon />
              Remove photo
            </button>
            <Button variant="ghost" onClick={() => setAvatarOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPhoto(true)
                setAvatarOpen(false)
                toast("Profile photo updated.")
              }}
            >
              <CheckIcon data-icon="inline-start" />
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
