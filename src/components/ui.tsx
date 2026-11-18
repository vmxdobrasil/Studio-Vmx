import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { create } from 'zustand'
import { FONT_LIST } from '../config'
import { ensureFont } from '../lib/fonts'
import { useApp } from '../store/app'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-btn text-white border border-white/30 hover:bg-accent-btn-hover',
  secondary: 'text-ink bg-white/10 border border-white/5 hover:bg-white/[0.16]',
  ghost: 'text-ink/80 hover:bg-ink/[.06]',
  danger: 'text-red-400 border border-red-400/40 hover:bg-red-500/10',
  soft: 'bg-ink/[.08] text-ink border border-ink/10 hover:bg-ink/[.14]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-full font-normal transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-4 text-sm',
        VARIANTS[variant],
        className,
      )}
    />
  )
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cx(
        'inline-grid place-items-center size-8 rounded-full text-ink/70 hover:bg-ink/[.08] hover:text-ink disabled:opacity-30 disabled:pointer-events-none',
        className,
      )}
    />
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] grid place-items-center p-4"
      onPointerDown={onClose}
    >
      <div
        className="bg-paper rounded-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-line"
        style={{ maxWidth: width }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-mute mt-1">{subtitle}</p>}
          </div>
          <IconButton onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </IconButton>
        </div>
        <div className="px-6 pb-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-line flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  )
}

export function Section({
  title,
  icon,
  defaultOpen = false,
  children,
  right,
}: {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  right?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-line">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-ink/[.03]"
        onClick={() => setOpen(!open)}
      >
        <span className="text-ink/50">{icon}</span>
        <span className="eyebrow text-ink/80 flex-1">{title}</span>
        {right}
        {open ? (
          <ChevronDown size={16} className="text-ink/40" />
        ) : (
          <ChevronRight size={16} className="text-ink/40" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  right,
}: {
  label: string
  hint?: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[12px] text-ink/60 mb-1">
        {label}
        {right}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-ink/50 mt-1">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full h-9 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 text-sm outline-none placeholder:text-white/30 hover:bg-white/[0.05] focus:border-white/30 focus:ring-2 focus:ring-accent-btn/25'
export const textareaClass =
  'w-full rounded-lg border border-line bg-field px-3 py-2 text-sm outline-none placeholder:text-mute focus:border-ink/40 focus:ring-2 focus:ring-ink/10 resize-y'

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between text-[12px] text-ink/60 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
    </div>
  )
}

export function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-8 rounded-md border border-line overflow-hidden shrink-0 cursor-pointer"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value.slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] leading-tight">{label}</div>
        {hint && <div className="text-[11px] text-ink/50 leading-tight truncate">{hint}</div>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[84px] h-7 rounded-md border border-line bg-field px-2 text-[12px] font-mono outline-none focus:border-ink/40"
      />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={cx(
          'w-9 h-5 rounded-full p-0.5 transition-colors',
          checked ? 'bg-accent-btn' : 'bg-ink/20',
        )}
      >
        <span
          className={cx(
            'block size-4 rounded-full transition-transform',
            checked ? 'bg-white translate-x-4' : 'bg-ink/80',
          )}
        />
      </span>
      {label}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: NoInfer<T>; label: ReactNode; title?: string }[]
  onChange: (v: NoInfer<T>) => void
}) {
  return (
    <div className="inline-flex rounded-full border border-line bg-field p-0.5 w-full">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 h-7 rounded-full text-[12px] inline-flex items-center justify-center gap-1',
            value === o.value ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Seletor de fonte com busca e prévia (Google Fonts + fontes enviadas). */
export function FontSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (family: string) => void
}) {
  const custom = useApp((s) => s.fonts)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const all = useMemo(
    () => [
      ...custom.map((f) => ({ family: f.family, tag: 'sua fonte' })),
      ...FONT_LIST.map((f) => ({ family: f.family, tag: f.category })),
    ],
    [custom],
  )
  const list = all.filter((f) => f.family.toLowerCase().includes(q.toLowerCase()))

  useEffect(() => {
    if (!open) return
    list.slice(0, 40).forEach((f) => void ensureFont(f.family))
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open, list])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cx(inputClass, 'flex items-center justify-between text-left')}
      >
        <span style={{ fontFamily: `"${value}"` }} className="truncate">
          {value}
        </span>
        <ChevronDown size={14} className="text-ink/40 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full min-w-[220px] bg-surface border border-line rounded-xl shadow-xl shadow-black/50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 border-b border-line">
            <Search size={14} className="text-ink/40" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ou digitar fonte do Google"
              className="w-full h-9 text-sm bg-transparent outline-none placeholder:text-mute"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim()) {
                  onChange(q.trim())
                  setOpen(false)
                }
              }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {list.map((f) => (
              <button
                key={f.family}
                type="button"
                onClick={() => {
                  onChange(f.family)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent-soft text-left"
              >
                <span style={{ fontFamily: `"${f.family}"` }} className="text-[15px]">
                  {f.family}
                </span>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink/40">
                  {f.tag}
                  {f.family === value && <Check size={13} className="text-accent" />}
                </span>
              </button>
            ))}
            {list.length === 0 && q.trim() && (
              <button
                type="button"
                onClick={() => (onChange(q.trim()), setOpen(false))}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent-soft"
              >
                Usar "{q.trim()}" do Google Fonts
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

interface Toast {
  id: number
  text: string
  kind: 'ok' | 'erro' | 'info'
}
const useToasts = create<{ items: Toast[] }>(() => ({ items: [] }))

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  const id = Date.now() + Math.random()
  useToasts.setState((s) => ({ items: [...s.items, { id, text, kind }] }))
  setTimeout(
    () => useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) })),
    kind === 'erro' ? 6000 : 3200,
  )
}

export function Toasts() {
  const items = useToasts((s) => s.items)
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={cx(
            'px-4 py-2.5 rounded-full text-sm max-w-md',
            t.kind === 'erro'
              ? 'bg-red-600 text-white'
              : t.kind === 'info'
                ? 'bg-surface text-ink border border-line'
                : 'bg-ink text-paper',
          )}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

/** Diálogo de confirmação reutilizável. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink/70">{message}</p>
    </Modal>
  )
}
