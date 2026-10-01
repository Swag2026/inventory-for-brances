import { ControlPanel } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useUI } from '../context/UI'

export default function Attention() {
  const { t } = useI18n()
  const ui = useUI()
  const { assets } = useData()
  const noPhoto = assets.filter((d) => !d.photo_url)
  const noPrice = assets.filter((d) => !d.purchase_price)
  const noStatus = assets.filter((d) => !d.status?.trim())
  const byName = {}
  assets.forEach((d) => { const k = d.name.trim().toLowerCase(); if (k) (byName[k] = byName[k] || []).push(d) })
  const dupes = Object.values(byName).filter((arr) => new Set(arr.map((d) => d.branch_id)).size > 1)

  const Section = (title, icon, n, body) => (
    <section className="o-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <i className={`fa ${icon} text-muted`} />
        <h3 className="text-[15px] font-bold">{title}</h3>
        <span className={`o-badge ${n ? 'b-fix' : 'b-use'}`}>{n}</span>
      </div>
      {n ? body : <div className="text-sm text-ok"><i className="fa fa-check" /> {t('allGood')}</div>}
    </section>
  )
  const list = (arr) => (
    <div className="max-h-72 space-y-1 overflow-y-auto">
      {arr.map((d) => (
        <button key={d.id} onClick={() => ui.openDetail(d.id)} className="flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-start text-sm hover:bg-surface2">
          <span className="truncate font-medium">{d.name}</span><span className="shrink-0 text-xs text-muted">{d.branch} · #{d.id}</span>
        </button>
      ))}
    </div>
  )

  return (
    <>
      <ControlPanel title={t('attTitle')} />
      <div className="grid animate-fadeUp gap-4 p-4 md:p-5 lg:grid-cols-2">
        {Section(t('noPhoto'), 'fa-picture-o', noPhoto.length, list(noPhoto))}
        {Section(t('noPrice'), 'fa-money', noPrice.length, list(noPrice))}
        {Section(t('noStatus'), 'fa-question-circle', noStatus.length, list(noStatus))}
        {Section(t('dupes'), 'fa-clone', dupes.length, (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {dupes.map((arr) => (
              <div key={arr[0].id} className="rounded border border-line p-2.5">
                <div className="mb-1.5 text-sm font-medium">{arr[0].name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {arr.map((d) => <button key={d.id} className="o-badge b-def hover:text-primary" onClick={() => ui.openDetail(d.id)}>{d.branch} · #{d.id}</button>)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
