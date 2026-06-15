/**
 * Tailwind override that restyles a shadcn <TableHeader> to the hi-fi `.tbl`
 * look: uppercase, 11px, semibold, muted-foreground header cells on the card
 * background (instead of the default tall, normal-case, grey header).
 *
 * The `[&_th]:` descendant selectors out-specify the base <TableHead> utility
 * classes, so they win regardless of source order — apply on the header:
 *   <TableHeader className={hifiTableHead}>
 */
export const hifiTableHead =
  "bg-transparent [&_th]:h-auto [&_th]:py-2.5 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.03em] [&_th]:text-muted-foreground"
