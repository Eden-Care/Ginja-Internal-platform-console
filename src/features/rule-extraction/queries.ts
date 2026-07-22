/* Query-key factory for the rule-extraction domain. */

export const rxKeys = {
  all: ["rule-extraction"] as const,
  overview: (code: string) => [...rxKeys.all, "overview", code] as const,
  current: (code: string, ins: string) =>
    [...rxKeys.all, "current", code, ins] as const,
  history: (code: string, ins: string) =>
    [...rxKeys.all, "history", code, ins] as const,
  job: (code: string, jobId: string) =>
    [...rxKeys.all, "job", code, jobId] as const,
}
