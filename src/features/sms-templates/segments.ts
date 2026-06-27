/* Client-side SMS segmentation, encoding-aware to mirror the API's
   `segment_info` (GSM_7 → 160/153 chars per segment, UCS_2 → 70/67). Used for
   the live counter while typing; saved values come from the API. */

const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
const GSM7_EXT = "^{}\\[~]|€"

export type SmsSegments = {
  charCount: number
  segmentCount: number
  encoding: "GSM_7" | "UCS_2"
}

export function smsSegments(text: string): SmsSegments {
  const chars = [...text]
  const isGsm = chars.every(
    (c) => GSM7_BASIC.includes(c) || GSM7_EXT.includes(c)
  )
  const encoding = isGsm ? "GSM_7" : "UCS_2"
  // Extended GSM characters occupy two units.
  let units = 0
  for (const c of chars) units += isGsm && GSM7_EXT.includes(c) ? 2 : 1
  const single = isGsm ? 160 : 70
  const multi = isGsm ? 153 : 67
  const segmentCount = units <= single ? 1 : Math.ceil(units / multi)
  return {
    charCount: chars.length,
    segmentCount: Math.max(1, segmentCount),
    encoding,
  }
}

/** "GSM_7" → "GSM-7", "UCS_2" → "Unicode". */
export function encodingLabel(encoding: string): string {
  if (!encoding) return ""
  if (encoding.toUpperCase().startsWith("GSM")) return "GSM-7"
  if (encoding.toUpperCase().startsWith("UCS")) return "Unicode"
  return encoding
}
