import { useState } from 'react'
import { ControlPanel } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useToast } from '../context/Toast'
import { useUI } from '../context/UI'
import { api } from '../lib/api'
import { brandColor } from '../lib/utils'

export default function Settings() {
  const { t } = useI18n()
  const toast = useToast()
  const ui = useUI()
  const { branches, choicesRaw, branchAgg, reload } = useData()
  const [bf, setBf] = useState({ id: null, name: '', brand: '' })
  const [newOpt, setNewOpt] = useState({ category: '', status: '', color: '' })

  const saveBranch = async () => {
    if (!bf.name.trim()) return
    try {
      await (bf.id ? api(`/branches/${bf.id}`, { method: 'PATCH', body: { name: bf.name, brand: bf.brand } })
        : api('/branches', { method: 'POST', body: { name: bf.name, brand: bf.brand } }))
      toast(t('saved'), 'success'); setBf({ id: null, name: '', brand: '' }); reload()
    } catch (e) { toast(e.message, 'error') }
  }
  const delBranch = async (b) => {
    if (!(await ui.confirm({ title: t('delete'), text: b.name, danger: true, ok: t('delete') }))) return
    try { await api(`/branches/${b.id}`, { method: 'DELETE' }); toast(t('deleted'), 'success'); reload() } catch (e) { toast(e.message, 'error') }
  }
  const addOpt = async (kind) => {
    const value = newOpt[kind].trim()
    if (!value) return
    try { await api('/choices', { method: 'POST', body: { kind, value } }); setNewOpt((x) => ({ ...x, [kind]: '' })); reload() } catch (e) { toast(e.message, 'error') }
  }
  const delOpt = async (c) => {
    try { await api(`/choices/${c.id}`, { method: 'DELETE' }); reload() } catch (e) { toast(e.message, 'error') }
  }

  return (
    <>
      <ControlPanel title={t('settings')} />
      <div className="grid animate-fadeUp gap-5 p-4 md:p-5 xl:grid-cols-2">
        <section className="o-card p-5">
          <h3 className="mb-1 text-[15px] font-bold"><i className="fa fa-building-o me-1.5 text-primary" /> {t('manageBranches')}</h3>
          <p className="mb-4 text-xs text-muted">{t('branchHint')}</p>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="min-w-[180px] flex-[2]"><span className="o-label">{t('branchName')}</span><input className="o-field" value={bf.name} onChange={(e) => setBf({ ...bf, name: e.target.value })} placeholder="لاروش - جدة" /></label>
            <label className="min-w-[120px] flex-1"><span className="o-label">{t('brandName')}</span><input className="o-field" value={bf.brand} onChange={(e) => setBf({ ...bf, brand: e.target.value })} placeholder="لاروش" /></label>
            <button className="o-btn-primary" onClick={saveBranch}><i className={`fa ${bf.id ? 'fa-check' : 'fa-plus'}`} /> {bf.id ? t('save') : t('add')}</button>
            {bf.id && <button className="o-btn-secondary" onClick={() => setBf({ id: null, name: '', brand: '' })}>{t('cancel')}</button>}
          </div>
          <div className="divide-y divide-line rounded-md border border-line">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2">
                <span className="o-badge text-white" style={{ background: brandColor(b.brand) }}>{b.brand}</span>
                <span className="flex-1 text-sm font-medium">{b.name}</span>
                <span className="text-xs text-muted">{branchAgg[b.id]?.types || 0} {t('assets').toLowerCase()}</span>
                <button className="o-btn-link" onClick={() => setBf({ id: b.id, name: b.name, brand: b.brand })}>{t('edit')}</button>
                <button className="o-btn-link !text-bad" onClick={() => delBranch(b)}><i className="fa fa-trash" /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="o-card p-5">
          <h3 className="mb-1 text-[15px] font-bold"><i className="fa fa-list-ul me-1.5 text-primary" /> {t('manageChoices')}</h3>
          <p className="mb-4 text-xs text-muted">{t('choiceHint')}</p>
          {['category', 'status', 'color'].map((kind) => (
            <div key={kind} className="mb-5 last:mb-0">
              <div className="o-label mb-2">{t('kind_' + kind)}</div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {choicesRaw.filter((c) => c.kind === kind).map((c) => (
                  <span key={c.id} className="o-badge b-def gap-1.5">{c.value}<button className="opacity-50 hover:text-bad hover:opacity-100" onClick={() => delOpt(c)}><i className="fa fa-times" /></button></span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="o-input max-w-xs" value={newOpt[kind]} onChange={(e) => setNewOpt({ ...newOpt, [kind]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addOpt(kind)} placeholder={t('addOption')} />
                <button className="o-btn-secondary" onClick={() => addOpt(kind)}><i className="fa fa-plus" /></button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
