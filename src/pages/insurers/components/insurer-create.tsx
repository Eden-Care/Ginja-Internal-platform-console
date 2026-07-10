import * as React from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { EA_COUNTRIES, INSURER_TYPES } from "@/lib/console-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConsolePageHeader } from "@/components/console/page-header"
import { Panel, PanelBody, PanelHead } from "@/components/console/panel"
import { ConsoleSelect } from "@/components/console/form-atoms"
import { Note } from "@/components/console/note"
import { MField, fieldInput } from "@/components/hifi/field"
import { HiIcon } from "@/components/hifi/icon"
import { hifiBtn } from "@/components/hifi/button"
import { useCreateInsurer } from "@/features/insurers/use-insurers"
import type { Insurer } from "@/features/insurers/types"

const optional = (
  <span className="text-[11.5px] font-normal text-muted-foreground">
    (optional)
  </span>
)

/** Two-column form grid — hi-fi `.form-grid` (14px row / 18px column gap). */
function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-[18px] gap-y-[14px] sm:grid-cols-2">
      {children}
    </div>
  )
}

/**
 * "Add insurance company" — a single-page insurer profile form (hi-fi
 * `InsurerCreate`). Purely local state; on submit it just advances the parent
 * state machine to the "created" success screen (mock, no persistence).
 */
export function InsurerCreate({
  onBack,
  onCreated,
}: {
  onBack: () => void
  onCreated: (rec: Insurer) => void
}) {
  const createMut = useCreateInsurer()
  const [name, setName] = React.useState("")
  const [country, setCountry] = React.useState("")
  const [type, setType] = React.useState("")
  const [city, setCity] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [regulator, setRegulator] = React.useState("")
  const [license, setLicense] = React.useState("")
  const [contact, setContact] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [dial, setDial] = React.useState("+254")
  const [phone, setPhone] = React.useState("")

  const valid = Boolean(name.trim() && country && type)

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-[5px] text-[12.5px] font-semibold text-primary hover:underline [&>svg]:size-3.5"
      >
        <HiIcon name="chevronLeft" />
        Insurance companies
      </button>

      <ConsolePageHeader
        title="Add insurance company"
        sub="Create an insurer profile. A unique account ID is generated on save."
        actions={
          <>
            <Button variant="ghost" className={hifiBtn} onClick={onBack}>
              Cancel
            </Button>
            <Button
              className={hifiBtn}
              disabled={!valid || createMut.isPending}
              onClick={() => {
                createMut.mutate(
                  {
                    name,
                    country,
                    type,
                    city,
                    address,
                    regulator,
                    license,
                    contact,
                    email,
                    phone: `${dial}${phone}`,
                  },
                  {
                    onSuccess: (rec) => onCreated(rec),
                    onError: (e) =>
                      toast.error("Couldn’t create the profile", {
                        description:
                          e instanceof Error ? e.message : undefined,
                      }),
                  }
                )
              }}
            >
              {createMut.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <HiIcon name="check" />
              )}
              {createMut.isPending ? "Creating…" : "Create profile"}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Panel>
          <PanelHead icon={<HiIcon name="building" />} title="Company details" />
          <PanelBody className="flex flex-col gap-[14px]">
            <MField label="Company name" required>
              <Input
                className={fieldInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jubilee Health Insurance"
              />
            </MField>
            <FormGrid>
              <MField label="Country of operation" required>
                <ConsoleSelect
                  className={fieldInput}
                  value={country}
                  onChange={setCountry}
                  options={EA_COUNTRIES}
                  placeholder="Select a country…"
                />
              </MField>
              <MField label="Company type" required>
                <ConsoleSelect
                  className={fieldInput}
                  value={type}
                  onChange={setType}
                  options={INSURER_TYPES}
                  placeholder="Select a type…"
                />
              </MField>
            </FormGrid>
            <FormGrid>
              <MField label="City">
                <Input
                  className={fieldInput}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi"
                />
              </MField>
              <MField label={<>Registered address {optional}</>}>
                <Input
                  className={fieldInput}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, building, P.O. Box"
                />
              </MField>
            </FormGrid>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            icon={<HiIcon name="shield" />}
            title={
              <>
                Regulatory <span className="ml-1.5">{optional}</span>
              </>
            }
          />
          <PanelBody>
            <FormGrid>
              <MField label="Regulator">
                <Input
                  className={fieldInput}
                  value={regulator}
                  onChange={(e) => setRegulator(e.target.value)}
                  placeholder="e.g. IRA Kenya"
                />
              </MField>
              <MField label="Licence number">
                <Input
                  className={cn(fieldInput, "mono text-[12.5px]")}
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="e.g. IRA/07/HIC/2019"
                />
              </MField>
            </FormGrid>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead
            icon={<HiIcon name="users" />}
            title={
              <>
                Primary contact <span className="ml-1.5">{optional}</span>
              </>
            }
          />
          <PanelBody className="flex flex-col gap-[14px]">
            <FormGrid>
              <MField label="Contact name">
                <Input
                  className={fieldInput}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Full name"
                />
              </MField>
              <MField label="Contact email">
                <Input
                  className={fieldInput}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.co.ke"
                />
              </MField>
            </FormGrid>
            <MField label="Contact phone">
              <div className="grid grid-cols-[96px_1fr] gap-2">
                <ConsoleSelect
                  className={fieldInput}
                  value={dial}
                  onChange={setDial}
                  options={["+254", "+255", "+256", "+250", "+251"]}
                />
                <Input
                  className={fieldInput}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="712 345 678"
                />
              </div>
            </MField>
          </PanelBody>
        </Panel>

        <Note tone="info" icon={<HiIcon name="info" />}>
          The profile is created with status <b>Active</b> and a unique account
          ID. You can mark it Inactive later — every status change is recorded
          in the audit trail.
        </Note>
      </div>
    </div>
  )
}
