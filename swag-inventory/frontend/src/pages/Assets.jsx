import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useSearchParams } from 'react-router-dom'
import { AssetCard } from '../components/cards'
import { qrPayload } from '../components/modals'
import { AssetPhoto, CatChip, ControlPanel, Empty, Pager, StatusBadge } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useToast } from '../context/Toast'
import { useUI } from '../context/UI'
import { api } from '../lib/api'
import { exportAssets, parseImportFile } from '../lib/excel'
import { catColor, colorHex, esc, fmtMoney, printHtml, statusKind } from '../lib/utils'

const PAGE = 40
const BLANK = { q: '', branch: '', cat: '', status: '', from: '', to: '', min: '', max: '', color: '' }

export default function Assets() {
  const { t } = useI18n()
  const toast = useToast()
  const ui = useUI()
  const { assets, myBranches, choices, canAdd, canEdit, isAdmin, reload } = useData()
  const [params, setParams] = useSearchParams()
  const [f, setF] = useState(() => ({ ...BLANK, q: params.get('q') || '', status: params.get('status') || '' }))
  const [adv, setAdv] = useState(false)
  const [sort, setSort] = useState({ key: 'id', dir: -1 })
  const [page, setPage] = useState(1)
  const [view, setView] = useState(() => localStorage.getItem('inv_view') || 'list')
  const [sel, setSel] = useState(new Set())
  const importRef = useRef(null)

  // navbar search / alert links update the filter
  useEffect(() => {
    const q = params.get('q'), st = params.get('status')
    if (q !== null || st !== null) {
      setF((x) => ({ ...x, q: q ?? x.q, status: st ?? x.status })); setPage(1)
      setParams({}, { replace: true })
    }
  }, [params, setParams])
  useEffect(() => { try { localStorage.setItem('inv_view', view) } catch (_) {} }, [view])

  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setPage(1) }
  const rows = useMemo(() => {
    let r = assets
    const q = f.q.toLowerCase().trim()
    if (q) r = r.filter((d) => `${d.id} ${d.name} ${d.model} ${d.category} ${d.branch} ${d.status} ${d.color} ${d.invoice} ${d.serial_number}`.toLowerCase().includes(q))
    if (f.branch) r = r.filter((d) => d.branch_id === Number(f.branch))
    if (f.cat) r = r.filter((d) => d.category === f.cat)
    if (f.status) r = r.filter((d) => statusKind(d.status) === f.status)
    if (f.from) r = r.filter((d) => d.created_at && d.created_at.slice(0, 10) >= f.from)
    if (f.to) r = r.filter((d) => d.created_at && d.created_at.slice(0, 10) <= f.to)
    if (f.min) r = r.filter((d) => d.purchase_price >= parseFloat(f.min))
    if (f.max) r = r.filter((d) => d.purchase_price <= parseFloat(f.max))
    if (f.color) r = r.filter((d) => d.color === f.color)
    const v = (d) => ({ id: d.id, name: d.name, branch: d.branch, cat: d.category, qty: d.qty, amount: d.purchase_price, status: d.status }[sort.key])
    return [...r].sort((a, b) => (v(a) < v(b) ? -1 : v(a) > v(b) ? 1 : 0) * sort.dir)
  }, [assets, f, sort])

  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE)
  const activeFilters = Object.entries(f).filter(([k, v]) => v && k !== 'q').length
  const th = (key, label) => (
    <th className="cursor-pointer select-none hover:text-primary" onClick={() => { setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 })); setPage(1) }}>
      {label} {sort.key === key ? <i className={`fa fa-caret-${sort.dir > 0 ? 'up' : 'down'}`} /> : <i className="fa fa-sort text-[10px] opacity-30" />}
    </th>
  )
  const toggleSel = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allOnPage = pageRows.length > 0 && pageRows.every((d) => sel.has(d.id))

  const del = async (d) => {
    if (!(await ui.confirm({ title: t('deleteAssetQ'), text: `"${d.name}" — ${t('cannotUndo')}`, danger: true, ok: t('delete') }))) return
    try { await api(`/assets/${d.id}`, { method: 'DELETE' }); toast(t('deleted'), 'success'); reload() } catch (e) { toast(e.message, 'error') }
  }

  const doImport = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    try {
      const parsed = await parseImportFile(file)
      if (!parsed.length) { toast(t('importEmpty'), 'warn'); return }
      if (!(await ui.confirm({ title: t('import'), text: `${parsed.length} ${t('importQ')}` }))) return
      const r = await api('/assets/import', { method: 'POST', body: { rows: parsed } })
      toast(`${r.created} ${t('imported')}${r.new_branches ? ` · +${r.new_branches} ${t('branches')}` : ''}`, 'success')
      reload()
    } catch (ex) { toast(ex.message, 'error') }
  }

  const printLabels = async () => {
    const list = assets.filter((d) => sel.has(d.id))
    const imgs = await Promise.all(list.map((d) => QRCode.toDataURL(qrPayload(d.id), { width: 220, margin: 1 })))
    printHtml(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @page{size:A4;margin:10mm}body{font-family:-apple-system,'Segoe UI',Arial,'Noto Sans Arabic',sans-serif;margin:0}
      .g{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm}.l{border:1px dashed #bbb;border-radius:6px;padding:4mm;text-align:center;break-inside:avoid}
      img{width:32mm;height:32mm}.n{font-size:11px;font-weight:700;margin-top:2mm;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.b{font-size:9px;color:#666}
      </style></head><body><div class="g">${list.map((d, i) => `<div class="l"><img src="${imgs[i]}"/><div class="n">${esc(d.name)}</div><div class="b">${esc(d.branch)} · #${d.id}</div></div>`).join('')}</div>
      <script>addEventListener('load',()=>print())<\/script></body></html>`)
  }

  return (
    <>
      <ControlPanel title={t('assets')} primary={canAdd && { label: t('addAsset'), icon: 'fa-plus', onClick: () => ui.openForm() }}
        below={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 md:max-w-md">
              <i className="fa fa-search absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
              <input className="o-input !ps-7" placeholder={t('searchAssets')} value={f.q} onChange={set('q')} />
            </div>
            <select className="o-input !w-auto" value={f.branch} onChange={set('branch')}>
              <option value="">{t('allBranches')}</option>
              {myBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="o-input !w-auto" value={f.cat} onChange={set('cat')}>
              <option value="">{t('allCategories')}</option>
              {[...new Set([...choices.category, ...assets.map((d) => d.category)])].filter(Boolean).map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="o-input !w-auto" value={f.status} onChange={set('status')}>
              <option value="">{t('allStatus')}</option>
              {['use', 'avail', 'store', 'fix', 'stop'].map((k) => <option key={k} value={k}>{t('st_' + k)}</option>)}
            </select>
            <button className={`o-btn-secondary ${adv ? '!bg-line2' : ''}`} onClick={() => setAdv(!adv)}><i className="fa fa-filter" /> {t('advFilters')}{activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{activeFilters}</span>}</button>
            {(activeFilters > 0 || f.q) && <button className="o-btn-link" onClick={() => { setF(BLANK); setPage(1) }}><i className="fa fa-times" /> {t('clear')}</button>}
            <div className="ms-auto flex items-center gap-2">
              <Pager page={page} size={PAGE} total={rows.length} onPage={setPage} />
              <div className="flex overflow-hidden rounded-[5px] border border-line2">
                {[['list', 'fa-list'], ['kanban', 'fa-th-large']].map(([v, ic]) => (
                  <button key={v} title={t(v + 'View')} onClick={() => setView(v)} className={`px-2.5 py-1.5 ${view === v ? 'bg-surface3 text-primary' : 'bg-surface text-muted hover:text-ink'}`}><i className={`fa ${ic}`} /></button>
                ))}
              </div>
            </div>
            {adv && (
              <div className="grid w-full animate-fadeUp grid-cols-2 gap-3 rounded-md border border-line2 bg-surface2 p-3 md:grid-cols-5">
                <label><span className="o-flabel">{t('dateFrom')}</span><input type="date" className="o-input" value={f.from} onChange={set('from')} /></label>
                <label><span className="o-flabel">{t('dateTo')}</span><input type="date" className="o-input" value={f.to} onChange={set('to')} /></label>
                <label><span className="o-flabel">{t('amtMin')}</span><input type="number" className="o-input" value={f.min} onChange={set('min')} placeholder="0" /></label>
                <label><span className="o-flabel">{t('amtMax')}</span><input type="number" className="o-input" value={f.max} onChange={set('max')} placeholder="99999" /></label>
                <label><span className="o-flabel">{t('color')}</span>
                  <select className="o-input" value={f.color} onChange={set('color')}><option value="">{t('all')}</option>{choices.color.map((c) => <option key={c}>{c}</option>)}</select></label>
              </div>
            )}
          </div>
        }>
        {sel.size > 0 && <>
          <span className="text-sm text-muted2">{sel.size} {t('selected')}</span>
          <button className="o-btn-secondary" onClick={printLabels}><i className="fa fa-qrcode" /> {t('printLabels')}</button>
          <button className="o-btn-secondary" onClick={() => exportAssets(assets.filter((d) => sel.has(d.id)))}><i className="fa fa-download" /> {t('export')}</button>
          <button className="o-btn-link" onClick={() => setSel(new Set())}><i className="fa fa-times" /></button>
        </>}
        {sel.size === 0 && <button className="o-btn-secondary" onClick={() => exportAssets(rows)}><i className="fa fa-download" /> {t('export')}</button>}
        {isAdmin && sel.size === 0 && <>
          <button className="o-btn-secondary" onClick={() => importRef.current.click()}><i className="fa fa-upload" /> {t('import')}</button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={doImport} />
        </>}
      </ControlPanel>

      <div className="animate-fadeUp p-4 md:p-5">
        <div className="mb-2 text-xs text-muted">{rows.length} {t('results')}</div>
        {view === 'kanban' ? (
          pageRows.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">{pageRows.map((a) => <AssetCard key={a.id} a={a} />)}</div> : <Empty text={t('noData')} />
        ) : (
          <div className="o-card overflow-x-auto">
            <table className="o-table">
              <thead><tr>
                <th className="w-8"><input type="checkbox" className="accent-[var(--primary)]" checked={allOnPage} onChange={() => setSel((s) => { const n = new Set(s); pageRows.forEach((d) => allOnPage ? n.delete(d.id) : n.add(d.id)); return n })} /></th>
                {th('id', '#')}<th>{t('photo')}</th>{th('name', t('name'))}{th('branch', t('branch'))}{th('cat', t('category'))}
                <th>{t('model')}</th>{th('qty', t('qty'))}{th('status', t('status'))}<th>{t('color')}</th>{th('amount', t('amount'))}<th className="text-end">{t('actions')}</th>
              </tr></thead>
              <tbody>
                {pageRows.map((d) => (
                  <tr key={d.id} className={sel.has(d.id) ? '!bg-[rgba(113,75,103,.06)]' : ''}>
                    <td><input type="checkbox" className="accent-[var(--primary)]" checked={sel.has(d.id)} onChange={() => toggleSel(d.id)} /></td>
                    <td className="text-muted">#{d.id}</td>
                    <td><AssetPhoto asset={d} className="h-10 w-10 rounded" iconSize="text-base" /></td>
                    <td className="cursor-pointer font-medium hover:text-primary" onClick={() => ui.openDetail(d.id)}>{d.name}</td>
                    <td className="text-[13px] text-muted2">{d.branch}</td>
                    <td><CatChip cat={d.category} color={catColor(d.category)} /></td>
                    <td className="text-xs text-muted2">{d.model || '—'}</td>
                    <td className="font-medium tabular-nums">{d.qty}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>{d.color ? <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-line2" style={{ background: colorHex(d.color) }} />{d.color}</span> : '—'}</td>
                    <td className="whitespace-nowrap text-[13px] tabular-nums">{fmtMoney(d.purchase_price)}</td>
                    <td className="whitespace-nowrap text-end">
                      <button className="o-btn-link" onClick={() => ui.openDetail(d.id)}>{t('view')}</button>
                      {canEdit(d.branch_id) && <button className="o-btn-link" onClick={() => ui.openForm(d)}>{t('edit')}</button>}
                      <button className="o-btn-link" onClick={() => ui.openQR(d)}>{t('qr')}</button>
                      {canEdit(d.branch_id) && <button className="o-btn-link !text-bad" onClick={() => del(d)}>{t('delete')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pageRows.length && <Empty text={t('noData')} />}
          </div>
        )}
        <div className="mt-3 flex justify-end"><Pager page={page} size={PAGE} total={rows.length} onPage={setPage} /></div>
      </div>
    </>
  )
}
