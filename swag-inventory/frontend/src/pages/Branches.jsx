import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AssetCard, BranchCard } from '../components/cards'
import { ControlPanel, Empty } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useUI } from '../context/UI'
import { brandColor, catColor, fmt, fmtDate } from '../lib/utils'

export function Branches() {
  const { t } = useI18n()
  const { branchAgg, canAdd } = useData()
  const ui = useUI()
  const [q, setQ] = useState('')
  const list = Object.values(branchAgg).filter((g) => !q || g.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.units - a.units)
  return (
    <>
      <ControlPanel title={t('branches')} primary={canAdd && { label: t('addAsset'), icon: 'fa-plus', onClick: () => ui.openForm() }}>
        <div className="relative w-56">
          <i className="fa fa-search absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
          <input className="o-input !ps-7" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </ControlPanel>
      <div className="animate-fadeUp p-4 md:p-5">
        {list.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{list.map((g) => <BranchCard key={g.id} g={g} />)}</div> : <Empty icon="fa-building-o" text={t('noData')} />}
      </div>
    </>
  )
}

export function BranchDetail() {
  const { id } = useParams()
  const bid = Number(id)
  const { t } = useI18n()
  const nav = useNavigate()
  const ui = useUI()
  const { assets, branchAgg, canEdit } = useData()
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const g = branchAgg[bid]
  const all = useMemo(() => assets.filter((d) => d.branch_id === bid), [assets, bid])
  const items = all.filter((d) => (cat === 'All' || d.category === cat) &&
    (!q || `${d.name} ${d.model} ${d.category} ${d.color} ${d.notes}`.toLowerCase().includes(q.toLowerCase())))
  const groups = {}
  items.forEach((d) => (groups[d.category] = groups[d.category] || []).push(d))

  if (!g) return <Empty icon="fa-lock" text={t('notFound')} />
  return (
    <>
      <ControlPanel title={g.name} crumbs={[{ label: t('branches'), onClick: () => nav('/branches') }]}
        primary={canEdit(bid) && { label: t('addAsset'), icon: 'fa-plus', onClick: () => ui.openForm(null, { branch_id: bid }) }}>
        <div className="relative w-56">
          <i className="fa fa-search absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
          <input className="o-input !ps-7" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </ControlPanel>
      <div className="animate-fadeUp space-y-4 p-4 md:p-5">
        <div className="o-card flex flex-wrap items-center gap-6 p-5">
          <div className="min-w-[200px] flex-1">
            <span className="o-badge text-white" style={{ background: brandColor(g.brand) }}>{g.brand}</span>
            <h2 className="mt-2 text-2xl font-medium">{g.name}</h2>
            <div className="text-xs text-muted">{t('lastEntry')}: {fmtDate(g.last)}</div>
          </div>
          {[[g.types, t('types')], [g.units, t('units')], [Object.keys(g.cats).length, t('s_cats')], [fmt(g.value), 'SAR']].map(([v, l]) => (
            <div key={l} className="text-center"><div className="text-xl font-medium text-primary">{v}</div><div className="text-xs text-muted">{l}</div></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', ...new Set(all.map((d) => d.category))].map((c) => {
            const n = c === 'All' ? all.length : all.filter((d) => d.category === c).length
            return (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-[13px] transition ${cat === c ? 'border-primary bg-primary text-white' : 'border-line2 bg-surface hover:border-primary hover:text-primary'}`}>
                {c === 'All' ? t('all') : c} <span className="opacity-60">{n}</span>
              </button>
            )
          })}
        </div>
        {Object.keys(groups).length ? Object.entries(groups).map(([c, arr]) => (
          <section key={c}>
            <div className="mb-3 flex items-center gap-2.5 border-b border-line pb-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: catColor(c) }} />
              <h4 className="text-[15px] font-medium">{c}</h4>
              <span className="ms-auto text-xs text-muted">{arr.length} {t('types')} · {arr.reduce((s, d) => s + d.qty, 0)} {t('units')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{arr.map((a) => <AssetCard key={a.id} a={a} />)}</div>
          </section>
        )) : <Empty text={t('noData')} />}
      </div>
    </>
  )
}
