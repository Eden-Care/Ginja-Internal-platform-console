import { useNavigate } from "react-router-dom"

import { SmsTemplateForm } from "./components/sms-template-form"

/**
 * Route component for `/sms-templates/new` — the standalone create form.
 * (Editing is inline on the detail's Editor tab, so there's no edit route.)
 */
export function SmsTemplateFormPage() {
  const navigate = useNavigate()
  return <SmsTemplateForm onBack={() => navigate("/sms-templates")} />
}
