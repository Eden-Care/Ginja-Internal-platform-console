import { useQuery } from "@tanstack/react-query"

import { fetchLocalization, fetchValidationRules } from "./api"
import { settingsKeys } from "./queries"

/** Platform formatting & locale defaults (GET /platform/settings/localization). */
export function useLocalization() {
  return useQuery({
    queryKey: settingsKeys.localization(),
    queryFn: fetchLocalization,
  })
}

/** The current published validation ruleset (GET /platform/settings/validation-rules). */
export function useValidationRules() {
  return useQuery({
    queryKey: settingsKeys.validationRules(),
    queryFn: fetchValidationRules,
  })
}
