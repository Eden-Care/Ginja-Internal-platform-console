/* Query-key factory for platform settings. */

export const settingsKeys = {
  all: ["platform-settings"] as const,
  securityPolicy: () => [...settingsKeys.all, "security-policy"] as const,
  localization: () => [...settingsKeys.all, "localization"] as const,
  validationRules: () => [...settingsKeys.all, "validation-rules"] as const,
  sessions: () => [...settingsKeys.all, "sessions"] as const,
  mfaDetail: (memberId: number) =>
    [...settingsKeys.all, "mfa-detail", memberId] as const,
}
