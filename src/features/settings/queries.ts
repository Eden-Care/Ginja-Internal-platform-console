/* Query-key factory for platform settings. */

export const settingsKeys = {
  all: ["platform-settings"] as const,
  securityPolicy: () => [...settingsKeys.all, "security-policy"] as const,
}
