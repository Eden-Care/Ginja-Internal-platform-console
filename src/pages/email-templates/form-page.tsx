import { useNavigate } from "react-router-dom"

import { EmailTemplateForm } from "./components/email-template-form"

/**
 * Route component for `/email-templates/new` — the standalone create form.
 * (Editing is inline on the detail's Editor tab, so there's no edit route.)
 */
export function EmailTemplateFormPage() {
  const navigate = useNavigate()
  return <EmailTemplateForm onBack={() => navigate("/email-templates")} />
}
