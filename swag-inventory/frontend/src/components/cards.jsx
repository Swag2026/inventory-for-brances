import { useNavigate } from 'react-router-dom'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useUI } from '../context/UI'
import { brandColor, colorHex, fmt } from '../lib/utils'
import { AssetPhoto, CountUp, StatusBadge } from './ui'

const TONES = {
  primary: ['rgba(113,75,103,.12)', 'var(--primary)'], amber: ['rgba(233,157,0,.14)', 'var(--amber)'],
  teal: ['rgba(1,126,132,.12)', 'var(--link)'], green: ['rgba(40,167,69,.12)', 'var(--green)'],
  gold: ['rgba(185,141,47,.14)', '#B98D2F'], red: ['rgba(212,76,89,.12)', 'var(--red)'],
}

export function StatCard({ icon, value, label, tone = 'primary', onClick }) {
  const [bg, fg] = TONES[tone]
  return (
    <button onClick={onClick} className="o-card o-lift relative flex items-center gap-3 overflow-hidden px-4 py-3.5 text-start">
      <span className="absolute inset-y-0 start-0 w-[3px]" style={{ background: fg }} />
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg" style={{ background: bg, color: fg }}><i className={`fa ${icon}`} /></span>
      <span className="min-w-0">
        <CountUp to={value} className="block text-2xl font-medium leading-tight" />
        <span className="block truncate text-[13px] text-muted">{label}</span>
      </span>
    </button>
  )
}

export function BranchCard({ g }) {
  const { t } = useI18n()
  const nav = useNavigate()
  const cats = Object.entries(g.cats).sort((a, b) => b[1] - a[1]).slice(0, 3)
  return (
    <button onClick={() => nav(`/branches/${g.id}`)} className="o-card o-lift relative p-4 text-start">
      <div className="absolute end-4 top-4 text-end">
        <CountUp to={g.units} className="block text-2xl font-medium leading-none text-primary" />
        <span className="text-[11px] text-muted">{t('units')}</span>
      </div>
      <span className="o-badge text-white" style={{ background: brandColor(g.brand) }}>{g.brand}</span>
      <h3 className="mb-1 mt-2.5 pe-16 text-base font-medium">{g.name}</h3>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex flex-wrap gap-1.5">
          {cats.length ? cats.map(([c, k]) => <span key={c} className="o-badge b-def">{c} · {k}</span>) : <span className="text-xs text-muted">{t('noData')}</span>}
        </div>
        <span className="text-xs text-muted">{g.types} {t('types')}</span>
      </div>
    </button>
  )
}

export function AssetCard({ a }) {
  const ui = useUI()
  const { reservedIds } = useData()
  const { t } = useI18n()
  return (
    <button onClick={() => ui.openDetail(a.id)} className="o-card o-lift overflow-hidden text-start">
      <div className="relative h-32">
        <span className="absolute start-2 top-2 z-[1] rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">×{a.qty}</span>
        <AssetPhoto asset={a} className="h-full w-full" />
      </div>
      <div className="p-3">
        <div className="truncate text-[15px] font-medium">{a.name}</div>
        <div className="mb-2 truncate text-xs text-muted">{a.model || '—'} · #{a.id}</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {reservedIds.has(a.id) && <span className="o-badge b-fix">{t('reserved')}</span>}
          {a.color && <span className="h-3 w-3 rounded-full border border-line2" style={{ background: colorHex(a.color) }} title={a.color} />}
          <StatusBadge status={a.status} />
        </div>
      </div>
    </button>
  )
}

export const sumUnits = (rows) => rows.reduce((s, d) => s + d.qty, 0)
export const sumValue = (rows) => rows.reduce((s, d) => s + d.purchase_price * d.qty, 0)
export { fmt }
