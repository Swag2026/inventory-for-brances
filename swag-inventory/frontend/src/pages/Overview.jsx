import { useNavigate } from 'react-router-dom'
import { BranchCard, StatCard, sumUnits, sumValue } from '../components/cards'
import { AssetPhoto, CatChip, ControlPanel, Empty, StatusBadge } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useUI } from '../context/UI'
import { exportAssets } from '../lib/excel'
import { catColor, statusKind } from '../lib/utils'

export default function Overview() {
  const { t } = useI18n()
  const { assets, branchAgg, canAdd } = useData()
  const ui = useUI()
  const nav = useNavigate()
  const by = (k) => assets.filter((d) => statusKind(d.status) === k)
  const units = sumUnits(assets)
  const inUse = sumUnits(by('use'))
  const groups = Object.values(branchAgg)
  const top = [...groups].sort((a, b) => b.units - a.units).slice(0, 6)

  return (
    <>
      <ControlPanel title={t('overview')} primary={canAdd && { label: t('addAsset'), icon: 'fa-plus', onClick: () => ui.openForm() }}>
        <button className="o-btn-secondary" onClick={() => exportAssets(assets)}><i className="fa fa-download" /> {t('export')}</button>
      </ControlPanel>
      <div className="animate-fadeUp space-y-5 p-4 md:p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard icon="fa-building-o" value={groups.length} label={t('s_branches')} tone="primary" onClick={() => nav('/branches')} />
          <StatCard icon="fa-tags" value={assets.length} label={t('s_types')} tone="amber" onClick={() => nav('/assets')} />
          <StatCard icon="fa-cubes" value={units} label={t('s_units')} tone="teal" onClick={() => nav('/assets')} />
          <StatCard icon="fa-check-circle" value={inUse} label={t('s_inuse')} tone="green" onClick={() => nav('/assets?status=use')} />
          <StatCard icon="fa-money" value={sumValue(assets)} label={t('s_value')} tone="gold" onClick={() => nav('/analytics')} />
          <StatCard icon="fa-th-list" value={new Set(assets.map((d) => d.category)).size} label={t('s_cats')} tone="red" onClick={() => nav('/analytics')} />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[[t('k_maint'), sumUnits(by('fix')), 'fix'], [t('k_damaged'), sumUnits(by('stop')), 'stop'], [t('k_storage'), sumUnits(by('store')), 'store'], [t('k_util'), `${Math.round((inUse / (units || 1)) * 100)}%`]].map(([l, v, k]) => (
            <button key={l} onClick={() => k && nav(`/assets?status=${k}`)} className="o-card o-lift px-4 py-3 text-start">
              <div className="text-2xl font-medium text-primary">{v}</div>
              <div className="mt-1 text-[13px] text-muted">{l}</div>
            </button>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold">{t('topBranches')}</h2>
            <button className="o-btn-link" onClick={() => nav('/branches')}>{t('viewAll')} <i className="fa fa-angle-right rtl:rotate-180" /></button>
          </div>
          {top.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{top.map((g) => <BranchCard key={g.id} g={g} />)}</div> : <Empty text={t('noData')} />}
        </div>

        <div className="o-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line2 px-4 py-2.5">
            <h2 className="text-[15px] font-medium">{t('recent')}</h2>
            <span className="o-badge b-def">{Math.min(assets.length, 10)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="o-table">
              <thead><tr><th>#</th><th>{t('photo')}</th><th>{t('name')}</th><th>{t('branch')}</th><th>{t('category')}</th><th>{t('qty')}</th><th>{t('status')}</th></tr></thead>
              <tbody>
                {assets.slice(0, 10).map((d) => (
                  <tr key={d.id} className="cursor-pointer" onClick={() => ui.openDetail(d.id)}>
                    <td className="text-muted">#{d.id}</td>
                    <td><AssetPhoto asset={d} className="h-10 w-10 rounded" iconSize="text-base" /></td>
                    <td className="font-medium">{d.name}</td>
                    <td className="text-[13px] text-muted2">{d.branch}</td>
                    <td><CatChip cat={d.category} color={catColor(d.category)} /></td>
                    <td className="tabular-nums">{d.qty}</td>
                    <td><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!assets.length && <Empty text={t('noData')} />}
          </div>
        </div>
      </div>
    </>
  )
}
