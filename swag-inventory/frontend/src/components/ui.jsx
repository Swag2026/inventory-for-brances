import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../context/I18n'
import { fileUrl } from '../lib/api'
import { assetIcon, statusKind } from '../lib/utils'

/* ---------- Odoo dialog ---------- */
export function Modal({ title, icon, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  const w = { sm: 'max-w-[420px]', md: 'max-w-[580px]', lg: 'max-w-[760px]' }[size]
  return (
    <div className="no-print fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`flex max-h-[92vh] w-full ${w} animate-pop flex-col rounded-lg bg-surface shadow-[0_10px_30px_rgba(0,0,0,.25)]`}>
        <div className="flex items-center gap-2.5 border-b border-line2 px-5 py-3.5">
          {icon && <i className={`fa ${icon} text-primary`} />}
          <h3 className="flex-1 truncate text-lg font-medium">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted hover:text-ink" aria-label="Close"><i className="fa fa-times text-lg" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-line2 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- control panel (breadcrumb + New + actions) ---------- */
export function ControlPanel({ title, crumbs, primary, children, below }) {
  return (
    <div className="no-print border-b border-line2 bg-surface px-4 py-2.5 md:px-5">
      <div className="flex flex-wrap items-center gap-2">
        {primary && (
          <button className="o-btn-primary" onClick={primary.onClick}>
            {primary.icon && <i className={`fa ${primary.icon}`} />} {primary.label}
          </button>
        )}
        <div className="me-auto flex min-w-0 items-center gap-1.5 text-lg">
          {crumbs?.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <button className="truncate text-link hover:underline" onClick={c.onClick}>{c.label}</button>
              <i className="fa fa-angle-right text-sm text-muted rtl:rotate-180" />
            </span>
          ))}
          <span className="truncate font-medium">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      {below && <div className="mt-2.5">{below}</div>}
    </div>
  )
}

/* ---------- status pill ---------- */
export function StatusBadge({ status }) {
  const k = statusKind(status)
  if (k === 'none') return <span className="o-badge b-def">—</span>
  return <span className={`o-badge b-${k}`}>{status}</span>
}

export function CatChip({ cat, color }) {
  return <span className="o-badge" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{cat}</span>
}

/* ---------- count-up number ---------- */
export function CountUp({ to, className }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf, start
    const step = (t) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / 650)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <span className={className}>{new Intl.NumberFormat('en-US').format(v)}</span>
}

/* ---------- asset photo with icon fallback ---------- */
export function AssetPhoto({ asset, className = '', iconSize = 'text-4xl', onClick }) {
  const [bad, setBad] = useState(false)
  useEffect(() => setBad(false), [asset.photo_url])
  if (asset.photo_url && !bad)
    return <img src={fileUrl(asset.photo_url)} alt="" loading="lazy" onError={() => setBad(true)} onClick={onClick} className={`object-cover ${onClick ? 'cursor-zoom-in' : ''} ${className}`} />
  return (
    <div className={`flex items-center justify-center bg-surface2 ${className}`}>
      <i className={`fa ${assetIcon(asset.category, asset.name)} ${iconSize} text-muted`} />
    </div>
  )
}

/* ---------- Odoo pager:  1-30 / 120  < > ---------- */
export function Pager({ page, size, total, onPage }) {
  if (!total) return null
  const pages = Math.ceil(total / size)
  const from = (page - 1) * size + 1
  const to = Math.min(total, page * size)
  return (
    <div className="flex items-center gap-1 text-sm text-muted2">
      <span className="px-1 tabular-nums">{from}-{to} / {total}</span>
      <button className="o-btn-secondary !px-2 !py-1" disabled={page <= 1} onClick={() => onPage(page - 1)}><i className="fa fa-chevron-left rtl:rotate-180" /></button>
      <button className="o-btn-secondary !px-2 !py-1" disabled={page >= pages} onClick={() => onPage(page + 1)}><i className="fa fa-chevron-right rtl:rotate-180" /></button>
    </div>
  )
}

export function Empty({ icon = 'fa-inbox', text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted">
      <i className={`fa ${icon} text-4xl opacity-60`} />
      <span>{text}</span>
    </div>
  )
}

export function Spinner() {
  return <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-line2 border-t-primary" />
}

/* ---------- magnet particles (login logo + button) ---------- */
export function Magnet({ children, count = 12, range = 80, color = 'var(--primary)', className = '', as: Tag = 'div', ...rest }) {
  const [on, setOn] = useState(false)
  const parts = useRef(Array.from({ length: count }, () => [Math.random() * range * 2 - range, Math.random() * range * 2 - range]))
  return (
    <Tag {...rest} className={`relative ${on ? 'magnet-on' : ''} ${className}`}
      onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}
      onTouchStart={() => setOn(true)} onTouchEnd={() => setOn(false)}>
      {parts.current.map(([x, y], i) => (
        <span key={i} className="magnet-p" style={{ background: color, boxShadow: `0 0 6px ${color}`, transform: on ? 'translate(0,0)' : `translate(${x}px,${y}px)` }} />
      ))}
      <span className="relative z-[1] inline-flex items-center justify-center gap-3">{children}</span>
    </Tag>
  )
}

/* ---------- lightbox ---------- */
export function Lightbox({ src, onClose }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-[400] flex cursor-zoom-out items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <img src={src} alt="" className="max-h-[92vh] max-w-[94vw] animate-pop rounded-lg object-contain shadow-2xl" />
    </div>
  )
}

export function useT() { return useI18n().t }
