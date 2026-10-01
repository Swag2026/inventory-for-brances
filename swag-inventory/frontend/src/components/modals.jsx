import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useToast } from '../context/Toast'
import { api, fileUrl } from '../lib/api'
import { colorHex, compressImage, esc, fmtDate, fmtDateTime, fmtMoney, printHtml } from '../lib/utils'
import { AssetPhoto, Lightbox, Modal, Spinner, StatusBadge } from './ui'

export const qrPayload = (id) => `${window.location.origin}/a/${id}`

/* ====================== DETAIL ====================== */
export function AssetDetailModal({ id, onClose, ui }) {
  const { t } = useI18n()
  const toast = useToast()
  const { assets, canEdit, reservedIds, reload } = useData()
  const a = assets.find((x) => x.id === id)
  const [history, setHistory] = useState(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!a) return
    api(`/assets/${id}/history`).then(setHistory).catch(() => setHistory([]))
  }, [id, a?.updated_at, a?.branch_id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!a) return null
  const editable = canEdit(a.branch_id)
  const rows = [
    [t('branch'), a.branch], [t('category'), a.category], [t('model'), a.model || '—'],
    [t('status'), <StatusBadge key="s" status={a.status} />],
    [t('color'), a.color ? <span key="c" className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-line2" style={{ background: colorHex(a.color) }} />{a.color}</span> : '—'],
    [t('qty'), a.qty], ...(a.serial_number ? [[t('serial'), a.serial_number]] : []),
    [t('amount'), fmtMoney(a.purchase_price)], [t('total'), fmtMoney(a.purchase_price * a.qty)],
    [t('invoice'), a.invoice || '—'], [t('purchaseDate'), fmtDate(a.purchase_date)], [t('created'), fmtDate(a.created_at)],
  ]

  const del = async () => {
    if (!(await ui.confirm({ title: t('deleteAssetQ'), text: `"${a.name}" — ${t('cannotUndo')}`, danger: true, ok: t('delete') }))) return
    try {
      await api(`/assets/${a.id}`, { method: 'DELETE' })
      toast(t('deleted'), 'success'); onClose(); reload()
    } catch (e) { toast(e.message, 'error') }
  }

  const print = () => printHtml(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{font-family:-apple-system,'Segoe UI',Arial,'Noto Sans Arabic',sans-serif;padding:32px;color:#111}
    h2{margin:0 0 4px}.sub{color:#666;font-size:13px;margin-bottom:16px}table{width:100%;border-collapse:collapse}
    td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}td:first-child{color:#555;font-weight:600;width:38%}
    </style></head><body><h2>${esc(a.name)}</h2><div class="sub">#${a.id} · ${esc(a.branch)}</div><table>
    ${[['Branch', a.branch], ['Category', a.category], ['Model', a.model], ['Status', a.status], ['Color', a.color], ['Quantity', a.qty],
      ['Serial', a.serial_number], ['Amount', fmtMoney(a.purchase_price)], ['Total', fmtMoney(a.purchase_price * a.qty)],
      ['Invoice', a.invoice], ['Purchase date', fmtDate(a.purchase_date)], ['Notes', a.notes]]
      .map(([k, v]) => `<tr><td>${k}</td><td>${esc(v || '—')}</td></tr>`).join('')}
    </table><p style="color:#aaa;font-size:11px;margin-top:20px">Printed ${new Date().toLocaleString()}</p>
    <script>addEventListener('load',()=>print())<\/script></body></html>`)

  return (
    <Modal title={t('assetDetails')} icon="fa-cubes" onClose={onClose} size="lg"
      footer={<>
        <button className="o-btn-primary" onClick={() => ui.openRequest(a)} disabled={reservedIds.has(a.id)}><i className="fa fa-exchange" /> {t('request')}</button>
        {editable && <button className="o-btn-secondary" onClick={() => { onClose(); ui.openForm(a) }}><i className="fa fa-pencil" /> {t('edit')}</button>}
        <button className="o-btn-secondary" onClick={() => ui.openQR(a)}><i className="fa fa-qrcode" /> {t('qr')}</button>
        <button className="o-btn-secondary" onClick={print}><i className="fa fa-print" /> {t('print')}</button>
        {editable && <button className="o-btn-danger ms-auto" onClick={del}><i className="fa fa-trash" /> {t('delete')}</button>}
      </>}>
      {reservedIds.has(a.id) && (
        <div className="mb-3 rounded-md bg-[rgba(233,157,0,.12)] px-3 py-2 text-sm font-medium text-warn"><i className="fa fa-exclamation-triangle" /> {t('reserved')}</div>
      )}
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <AssetPhoto asset={a} className="h-48 w-full rounded-md md:h-52" iconSize="text-6xl" onClick={a.photo_url ? () => setZoom(fileUrl(a.photo_url)) : undefined} />
          <div className="mt-3 text-xl font-medium leading-tight">{a.name}</div>
          <div className="mt-1 text-sm text-muted">#{a.id}</div>
        </div>
        <div>
          {rows.map(([k, v], i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-line py-1.5 text-sm">
              <span className="font-bold">{k}</span><span className="text-end">{v}</span>
            </div>
          ))}
          {a.notes && <div className="mt-3"><div className="o-label">{t('notes')}</div><div className="whitespace-pre-wrap rounded-md bg-surface2 p-3 text-sm">{a.notes}</div></div>}
        </div>
      </div>
      {/* Odoo-style chatter */}
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><i className="fa fa-history text-muted" /> {t('history')}</div>
        {history === null ? <Spinner /> : history.length === 0 ? <div className="text-sm text-muted">{t('noHistory')}</div> : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-link text-sm font-medium text-white">{(h.user || '?').charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1 text-sm">
                  <div><span className="font-bold">{h.user}</span> <span className="text-xs text-muted">· {fmtDateTime(h.created_at)}</span></div>
                  <div className="whitespace-pre-wrap text-muted2">{t('h_' + h.action)}{h.details ? ` — ${h.details}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Lightbox src={zoom} onClose={() => setZoom(null)} />
    </Modal>
  )
}

/* ====================== ADD / EDIT ====================== */
const EMPTY = { name: '', branch_id: '', category: '', model: '', status: '', color: '', qty: 1, serial_number: '', purchase_price: '', purchase_date: '', invoice: '', notes: '' }

export function AssetFormModal({ asset, defaults, onClose }) {
  const { t } = useI18n()
  const toast = useToast()
  const { editableBranches, choices, reload } = useData()
  const [f, setF] = useState(() => asset
    ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, asset[k] ?? ''])) }
    : { ...EMPTY, status: choices.status[0] || '', branch_id: defaults?.branch_id || (editableBranches.length === 1 ? editableBranches[0].id : ''), ...defaults })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(asset?.photo_url ? fileUrl(asset.photo_url) : '')
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null), camInput = useRef(null)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const opts = (list, cur) => [...new Set([...(cur ? [cur] : []), ...list])]

  const pick = async (e) => {
    const raw = e.target.files?.[0]
    e.target.value = ''
    if (!raw) return
    const c = await compressImage(raw)
    setFile(c); setRemovePhoto(false); setPreview(URL.createObjectURL(c))
  }

  const save = async () => {
    if (!f.name.trim() || !f.branch_id || !f.category) { toast(t('fillRequired'), 'error'); return }
    setSaving(true)
    const body = { ...f, branch_id: Number(f.branch_id), qty: Math.max(1, parseInt(f.qty, 10) || 1),
      purchase_price: parseFloat(f.purchase_price) || 0, purchase_date: f.purchase_date || null, name: f.name.trim() }
    try {
      const saved = asset ? await api(`/assets/${asset.id}`, { method: 'PATCH', body }) : await api('/assets', { method: 'POST', body })
      if (file) {
        const fd = new FormData(); fd.append('file', file)
        await api(`/assets/${saved.id}/photo`, { method: 'POST', form: fd })
      } else if (removePhoto && asset?.photo_url) {
        await api(`/assets/${saved.id}/photo`, { method: 'DELETE' })
      }
      toast(`#${saved.id} ${t('saved')}`, 'success')
      onClose(); reload()
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  const Field = ({ label, children, req }) => <label className="block"><span className="o-label">{label}{req && <span className="text-bad"> *</span>}</span>{children}</label>

  return (
    <Modal title={asset ? `${t('editAsset')} #${asset.id}` : t('newAsset')} icon={asset ? 'fa-pencil' : 'fa-plus'} onClose={onClose} size="lg"
      footer={<>
        <button className="o-btn-primary" onClick={save} disabled={saving}>{saving ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-check" />} {t('save')}</button>
        <button className="o-btn-secondary" onClick={onClose}>{t('cancel')}</button>
      </>}>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="md:col-span-2">{Field({ label: t('name'), req: true, children: <input className="o-field text-lg" value={f.name} onChange={set('name')} placeholder={t('namePh')} autoFocus /> })}</div>
        {Field({ label: t('branch'), req: true, children: (
          <select className="o-field" value={f.branch_id} onChange={set('branch_id')}>
            <option value="">{t('select')}</option>
            {editableBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>) })}
        {Field({ label: t('category'), req: true, children: (
          <select className="o-field" value={f.category} onChange={set('category')}>
            <option value="">{t('select')}</option>
            {opts(choices.category, f.category).map((c) => <option key={c}>{c}</option>)}
          </select>) })}
        {Field({ label: t('status'), children: (
          <select className="o-field" value={f.status} onChange={set('status')}>
            <option value="">—</option>
            {opts(choices.status, f.status).map((c) => <option key={c}>{c}</option>)}
          </select>) })}
        {Field({ label: t('color'), children: (
          <select className="o-field" value={f.color} onChange={set('color')}>
            <option value="">—</option>
            {opts(choices.color, f.color).map((c) => <option key={c}>{c}</option>)}
          </select>) })}
        {Field({ label: t('model'), children: <input className="o-field" value={f.model} onChange={set('model')} /> })}
        {Field({ label: t('qty'), req: true, children: <input className="o-field" type="number" min="1" value={f.qty} onChange={set('qty')} /> })}
        {Field({ label: t('serial'), children: <input className="o-field" value={f.serial_number} onChange={set('serial_number')} /> })}
        {Field({ label: t('amount'), children: <input className="o-field" type="number" min="0" step="0.01" value={f.purchase_price} onChange={set('purchase_price')} placeholder="0" /> })}
        {Field({ label: t('invoice'), children: <input className="o-field" value={f.invoice} onChange={set('invoice')} placeholder="INV-001" /> })}
        {Field({ label: t('purchaseDate'), children: <input className="o-field" type="date" value={f.purchase_date || ''} onChange={set('purchase_date')} /> })}
        <div className="md:col-span-2">
          <span className="o-label">{t('photo')}</span>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <div onClick={() => fileInput.current.click()} className="flex h-28 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-line2 bg-surface2 transition hover:border-primary">
              {preview && !removePhoto ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <div className="text-center text-xs text-muted"><i className="fa fa-picture-o mb-1 block text-2xl" />{t('uploadPhoto')}</div>}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className="o-btn-secondary" onClick={() => camInput.current.click()}><i className="fa fa-camera" /> {t('takePhoto')}</button>
              {preview && !removePhoto && <button type="button" className="o-btn-link !text-bad" onClick={() => { setFile(null); setRemovePhoto(true) }}><i className="fa fa-trash" /> {t('removePhoto')}</button>}
            </div>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={pick} />
            <input ref={camInput} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
          </div>
        </div>
        <div className="md:col-span-2">{Field({ label: t('notes'), children: <textarea className="o-input mt-1 h-20 resize-none" value={f.notes} onChange={set('notes')} /> })}</div>
      </div>
    </Modal>
  )
}

/* ====================== QR ====================== */
export function QRModal({ asset, onClose }) {
  const { t } = useI18n()
  const [url, setUrl] = useState('')
  useEffect(() => { QRCode.toDataURL(qrPayload(asset.id), { width: 260, margin: 1, color: { dark: '#111827' } }).then(setUrl) }, [asset.id])
  const download = () => { const a = document.createElement('a'); a.href = url; a.download = `asset-${asset.id}.png`; a.click() }
  const print = () => printHtml(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:-apple-system,'Segoe UI',Arial,'Noto Sans Arabic',sans-serif;text-align:center;padding:40px}img{width:200px}h2{margin:12px 0 4px}p{color:#666;margin:0}</style></head>
    <body><img src="${url}"/><h2>${esc(asset.name)}</h2><p>${esc(asset.branch)} · #${asset.id}</p><script>addEventListener('load',()=>print())<\/script></body></html>`)
  return (
    <Modal title="QR Code" icon="fa-qrcode" size="sm" onClose={onClose}
      footer={<><button className="o-btn-primary" onClick={download} disabled={!url}><i className="fa fa-download" /> {t('download')}</button>
        <button className="o-btn-secondary" onClick={print} disabled={!url}><i className="fa fa-print" /> {t('print')}</button>
        <button className="o-btn-secondary ms-auto" onClick={onClose}>{t('close')}</button></>}>
      <div className="text-center">
        {url ? <img src={url} alt="QR" className="mx-auto w-52 rounded-lg bg-white p-2 shadow" /> : <Spinner />}
        <div className="mt-3 font-medium">{asset.name}</div>
        <div className="text-sm text-muted">{asset.branch} · #{asset.id}</div>
      </div>
    </Modal>
  )
}

/* ====================== SCANNER ====================== */
export function ScannerModal({ onClose, onFound }) {
  const { t } = useI18n()
  const [msg, setMsg] = useState(t('scanHint'))
  const done = useRef(false)
  useEffect(() => {
    let scanner, stopped = false
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped) return
      scanner = new Html5Qrcode('qr-reader')
      scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 230, height: 230 } }, (text) => {
        if (done.current) return
        done.current = true
        const m = String(text).match(/(\d+)\s*\/?\s*$/)
        onFound(m ? parseInt(m[1], 10) : NaN)
      }, () => {}).catch((e) => setMsg(`${t('cameraError')} (${e?.message || e})`))
    })
    return () => {
      stopped = true
      if (scanner?.isScanning) scanner.stop().then(() => scanner.clear()).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal title={t('scanTitle')} icon="fa-barcode" size="sm" onClose={onClose} footer={<button className="o-btn-secondary" onClick={onClose}>{t('close')}</button>}>
      <div id="qr-reader" className="min-h-[240px] overflow-hidden rounded-lg bg-black" />
      <p className="mt-3 text-center text-sm text-muted2">{msg}</p>
    </Modal>
  )
}

/* ====================== TRANSFER REQUEST ====================== */
export function RequestModal({ asset, onClose }) {
  const { t } = useI18n()
  const toast = useToast()
  const { myBranches, reload } = useData()
  const targets = useMemo(() => myBranches.filter((b) => b.id !== asset.branch_id), [myBranches, asset.branch_id])
  const [to, setTo] = useState(targets[0]?.id || '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const send = async () => {
    if (!to) return
    setBusy(true)
    try {
      await api('/requests', { method: 'POST', body: { asset_id: asset.id, to_branch_id: Number(to), note } })
      toast(t('reqSent'), 'success'); onClose(); reload()
    } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }
  return (
    <Modal title={t('request')} icon="fa-exchange" size="sm" onClose={onClose}
      footer={<><button className="o-btn-primary" onClick={send} disabled={!to || busy}><i className="fa fa-paper-plane" /> {t('sendRequest')}</button>
        <button className="o-btn-secondary" onClick={onClose}>{t('cancel')}</button></>}>
      <div className="mb-4 font-medium">{asset.name} <span className="text-sm text-muted">— {asset.branch} (×{asset.qty})</span></div>
      {targets.length === 0 ? <div className="text-sm text-muted">{t('noTargetBranch')}</div> : <>
        <label className="o-label">{t('toBranch')}</label>
        <select className="o-field mb-4" value={to} onChange={(e) => setTo(e.target.value)}>
          {targets.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <label className="o-label">{t('note')}</label>
        <textarea className="o-input mt-1 h-20 resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
      </>}
    </Modal>
  )
}

/* ====================== CONFIRM ====================== */
export function ConfirmModal({ title, text, danger, ok, onDone }) {
  const { t } = useI18n()
  return (
    <Modal title={title} icon={danger ? 'fa-exclamation-triangle' : 'fa-question-circle'} size="sm" onClose={() => onDone(false)}
      footer={<><button className={danger ? 'o-btn-danger' : 'o-btn-primary'} onClick={() => onDone(true)} autoFocus>{ok || t('confirm')}</button>
        <button className="o-btn-secondary" onClick={() => onDone(false)}>{t('cancel')}</button></>}>
      <p className="text-sm leading-relaxed text-muted2">{text}</p>
    </Modal>
  )
}

/* ====================== CHANGE PASSWORD ====================== */
export function PasswordModal({ onClose }) {
  const { t } = useI18n()
  const toast = useToast()
  const [cur, setCur] = useState(''), [nw, setNw] = useState('')
  const save = async () => {
    try {
      await api('/auth/change-password', { method: 'POST', body: { current: cur, new: nw } })
      toast(t('passwordChanged'), 'success'); onClose()
    } catch (e) { toast(e.message, 'error') }
  }
  return (
    <Modal title={t('changePassword')} icon="fa-key" size="sm" onClose={onClose}
      footer={<><button className="o-btn-primary" onClick={save} disabled={!cur || nw.length < 6}>{t('save')}</button><button className="o-btn-secondary" onClick={onClose}>{t('cancel')}</button></>}>
      <label className="o-label">{t('currentPassword')}</label>
      <input type="password" className="o-field mb-4" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
      <label className="o-label">{t('newPassword')}</label>
      <input type="password" className="o-field" value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" />
      <p className="mt-2 text-xs text-muted">{t('min6')}</p>
    </Modal>
  )
}

/* deep-link helper for /a/:id */
export function useOpenFromScan(ui) {
  const nav = useNavigate()
  const toast = useToast()
  const { t } = useI18n()
  const { assets } = useData()
  return (id) => {
    if (isNaN(id)) { toast(t('notRecognized'), 'error'); return }
    if (assets.some((a) => a.id === id)) { nav('/assets'); ui.openDetail(id) } else toast(t('notFound'), 'error')
  }
}
