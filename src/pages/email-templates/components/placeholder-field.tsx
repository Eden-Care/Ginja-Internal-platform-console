import * as React from "react"

import { cn } from "@/lib/utils"

export type PlaceholderSuggestion = {
  key: string
  value?: string
  description?: string
}

/** Render text with every completed `{{token}}` wrapped in a blue highlight.
   A trailing zero-width space keeps the backdrop's last line aligned with the
   textarea (which always reserves a final empty line). */
function highlightNodes(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /\{\{[^}]*\}\}/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      out.push(<span key={key++}>{text.slice(last, m.index)}</span>)
    out.push(
      <mark
        key={key++}
        className="rounded-[3px] bg-info-subtle text-info-subtle-foreground"
      >
        {m[0]}
      </mark>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>)
  out.push(<span key="tail">{"​"}</span>)
  return out
}

/** The open `{{partial` immediately before the caret (no closing brace yet). */
function activePartial(
  value: string,
  caret: number
): { start: number; partial: string } | null {
  const before = value.slice(0, caret)
  const m = /\{\{([^{}]*)$/.exec(before)
  if (!m) return null
  return { start: m.index, partial: m[1] }
}

type Props = {
  value: string
  onChange: (v: string) => void
  suggestions: PlaceholderSuggestion[]
  /** Render a multi-line textarea (default is a single-line input). */
  multiline?: boolean
  /** Typography + height classes, applied to both the field and the backdrop. */
  className?: string
  placeholder?: string
  invalid?: boolean
  spellCheck?: boolean
  /** Min partial length before suggestions appear (default 1). */
  minChars?: number
}

/**
 * A text field that highlights `{{placeholders}}` in blue and autocompletes
 * them from the global-placeholder list. Uses the standard "highlight backdrop"
 * technique: a styled mirror sits behind a transparent-text field so the caret
 * and native editing stay intact while tokens render in colour.
 */
export function PlaceholderField({
  value,
  onChange,
  suggestions,
  multiline,
  className,
  placeholder,
  invalid,
  spellCheck,
  minChars = 1,
}: Props) {
  const fieldRef = React.useRef<HTMLTextAreaElement | HTMLInputElement | null>(
    null
  )
  const attachRef = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    fieldRef.current = el
  }
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)
  const [matches, setMatches] = React.useState<PlaceholderSuggestion[]>([])
  const [active, setActive] = React.useState(0)
  const [tokenStart, setTokenStart] = React.useState(0)
  const pendingCaret = React.useRef<number | null>(null)

  // Restore the caret after a programmatic value change (accepting a suggestion).
  React.useEffect(() => {
    const el = fieldRef.current
    if (el && pendingCaret.current != null) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current)
      pendingCaret.current = null
    }
  }, [value])

  const syncScroll = () => {
    const el = fieldRef.current
    const bd = backdropRef.current
    if (el && bd) {
      bd.scrollTop = el.scrollTop
      bd.scrollLeft = el.scrollLeft
    }
  }

  const recompute = (el: HTMLTextAreaElement | HTMLInputElement) => {
    const caret = el.selectionStart ?? el.value.length
    const tok = activePartial(el.value, caret)
    if (!tok || tok.partial.length < minChars) {
      setOpen(false)
      return
    }
    const q = tok.partial.toLowerCase()
    const found = suggestions
      .filter((s) => s.key.toLowerCase().includes(q))
      .sort((a, b) => {
        const aw = a.key.toLowerCase().startsWith(q) ? 0 : 1
        const bw = b.key.toLowerCase().startsWith(q) ? 0 : 1
        return aw - bw || a.key.localeCompare(b.key)
      })
      .slice(0, 8)
    if (found.length === 0) {
      setOpen(false)
      return
    }
    setMatches(found)
    setTokenStart(tok.start)
    setActive(0)
    setOpen(true)
  }

  const accept = (insertKey: string) => {
    const el = fieldRef.current
    if (!el) return
    const caret = el.selectionStart ?? value.length
    const before = value.slice(0, tokenStart) + `{{${insertKey}}}`
    pendingCaret.current = before.length
    onChange(before + value.slice(caret))
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || matches.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % matches.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i - 1 + matches.length) % matches.length)
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      accept(matches[active].key)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  const pad = multiline ? "px-2.5 py-2" : "h-9 px-3 py-1"
  const backdropCls = cn(
    "pointer-events-none absolute inset-0 [scrollbar-gutter:stable] overflow-hidden text-foreground",
    multiline
      ? "break-words whitespace-pre-wrap"
      : "flex items-center overflow-x-hidden", // match the input's vertical centering
    pad,
    className
  )
  const fieldCls = cn(
    "relative z-10 block w-full [scrollbar-gutter:stable] bg-transparent text-transparent caret-foreground outline-none placeholder:text-muted-foreground",
    multiline && "field-sizing-content resize-none overflow-auto",
    pad,
    className
  )
  const wrapCls = cn(
    "relative w-full rounded-lg border bg-transparent text-sm transition-colors focus-within:ring-3",
    invalid
      ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
      : "border-input focus-within:border-ring focus-within:ring-ring/50"
  )

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    onChange(e.target.value)
    recompute(e.currentTarget)
    syncScroll()
  }
  const handleSelect = (
    e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => recompute(e.currentTarget)

  return (
    <div className={wrapCls}>
      <div ref={backdropRef} aria-hidden className={backdropCls}>
        {multiline ? (
          highlightNodes(value)
        ) : (
          <span className="whitespace-pre">{highlightNodes(value)}</span>
        )}
      </div>
      {multiline ? (
        <textarea
          ref={attachRef}
          value={value}
          placeholder={placeholder}
          spellCheck={spellCheck}
          onChange={handleChange}
          onScroll={syncScroll}
          onSelect={handleSelect}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={fieldCls}
        />
      ) : (
        <input
          type="text"
          ref={attachRef}
          value={value}
          placeholder={placeholder}
          spellCheck={spellCheck}
          onChange={handleChange}
          onScroll={syncScroll}
          onSelect={handleSelect}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className={fieldCls}
        />
      )}

      {open ? (
        <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full max-w-sm overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          {matches.map((s, i) => (
            <button
              key={s.key}
              type="button"
              // mousedown (not click) so the field doesn't blur before we insert.
              onMouseDown={(e) => {
                e.preventDefault()
                accept(s.key)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left",
                i === active ? "bg-accent" : "hover:bg-muted"
              )}
            >
              <code className="mono shrink-0 rounded bg-info-subtle px-1.5 py-0.5 text-[11px] text-info-subtle-foreground">
                {`{{${s.key}}}`}
              </code>
              {s.description || s.value ? (
                <span className="truncate text-[11.5px] text-muted-foreground">
                  {s.description || s.value}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
