/** Password strength score 0–4, mirroring the hi-fi `pwScore`. */
export function pwScore(s: string): number {
  let n = 0
  if (s.length >= 8) n++
  if (s.length >= 12) n++
  if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++
  if (/\d/.test(s)) n++
  if (/[^A-Za-z0-9]/.test(s)) n++
  return Math.min(n, 4)
}

export const PW_LABEL = ["Too weak", "Weak", "Fair", "Good", "Strong"]

/** The avatar/crop preview gradient — a faux headshot used until a real photo
 *  is uploaded (matches the hi-fi `.prof-av.has-photo` / `.crop-photo`). */
export const PHOTO_GRADIENT =
  "radial-gradient(120px 120px at 50% 38%, #f2c9a0 0%, #e6a877 45%, transparent 70%)," +
  "radial-gradient(180px 150px at 50% 96%, #3b4a6b 0%, #2a3550 60%, transparent 100%)," +
  "linear-gradient(160deg, #8fa6c4, #5b6b88)"

/** Deterministic faux QR (visual only) — ported from the hi-fi `FakeQR`. */
export function FakeQR({
  seed = "ginja",
  size = 150,
}: {
  seed?: string
  size?: number
}) {
  const n = 21
  const cells: number[] = []
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const rnd = (i: number) => {
    const x = Math.sin(h + i * 12.9898) * 43758.5453
    return x - Math.floor(x) > 0.5
  }
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const finder =
        (r < 7 && c < 7) ||
        (r < 7 && c >= n - 7) ||
        (r >= n - 7 && c < 7)
      cells.push(
        finder
          ? r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
            (r < 7 &&
              c >= n - 7 &&
              (r === 0 ||
                r === 6 ||
                c === n - 7 ||
                c === n - 1 ||
                (r >= 2 && r <= 4 && c >= n - 5 && c <= n - 3))) ||
            (r >= n - 7 &&
              c < 7 &&
              (r === n - 7 ||
                r === n - 1 ||
                c === 0 ||
                c === 6 ||
                (r >= n - 5 && r <= n - 3 && c >= 2 && c <= 4)))
            ? 1
            : 0
          : rnd(r * n + c)
            ? 1
            : 0
      )
    }
  const px = size / n
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block rounded"
    >
      <rect width={size} height={size} fill="#fff" />
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % n) * px}
            y={Math.floor(i / n) * px}
            width={px}
            height={px}
            fill="#111"
          />
        ) : null
      )}
    </svg>
  )
}
