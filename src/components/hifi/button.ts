/**
 * hi-fi `.btn` sizing applied over the shared shadcn `Button`: 36px tall, 8px
 * radius, 14px horizontal padding, 13px/500 text, 7px gap (the shared Button's
 * `default`/`sm` sizes are smaller and more rounded). Pass as `className` (keeps
 * the variant colours). The `has-data-[icon=…]` overrides re-assert 14px padding
 * on the icon side, which the shared size variants otherwise tighten to 8px.
 */
export const hifiBtn =
  "h-9 gap-[7px] rounded-[8px] px-[14px] text-[13px] has-data-[icon=inline-start]:pl-[14px] has-data-[icon=inline-end]:pr-[14px]"
