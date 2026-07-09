/* Deterministic faux-QR (visual only) — ported verbatim from the hi-fi
   `AuthQR`. Renders a stable 21×21 matrix with finder squares so the MFA
   setup screen looks like a real QR without encoding anything. */
export function AuthQR({
  seed = "ginja",
  size = 156,
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
