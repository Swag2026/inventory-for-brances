import { useState } from 'react'
import { ControlPanel, Empty } from '../components/ui'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useToast } from '../context/Toast'
import { useUI } from '../context/UI'
import { api } from '../lib/api'
import { fmtDateTime } from '../lib/utils'

const BADGE = { Pending: 'b-fix', Completed: 'b-use', Rejected: 'b-stop', Cancelled: 'b-def' }

export default function Requests() {
  const { t } = useI18n()
  const toast = useToast()
  const ui = useUI()
  const { user } = useAuth()
  const { requests, canEdit, myBranchIds, reload, assets } = useData()
  const [tab, setTab] = useState('incoming')
  const [busy, setBusy] = useState(null)

  const incoming = requests.filter((r) => myBranchIds.includes(r.from_branch_id))
  const mine = requests.filter((r) => r.requested_by_id === user.id)
  const list = tab === 'incoming' ? incoming : mine

  const act = async (r, action) => {
    if (action === 'approve' && !(await ui.confirm({ title: t('approve'), text: `${r.asset_name}: ${r.from_branch} → ${r.to_branch}`, ok: t('approve') }))) return
    setBusy(r.id)
    try {
      await api(`/requests/${r.id}/${action}`, { method: 'POST' })
      toast(t(action === 'approve' ? 'completed' : action === 'reject' ? 'rejected' : 'cancelled'), 'success')
      reload()
    } catch (e) { toast(e.message, 'error') } finally { setBusy(null) }
  }

  return (
    <>
      <ControlPanel title={t('requests')}>
        <div className="flex overflow-hidden rounded-[5px] border border-line2">
          {[['incoming', incoming.filter((r) => r.status === 'Pending').length], ['myRequests', mine.length]].map(([k, n]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 text-sm ${tab === k ? 'bg-surface3 font-medium text-primary' : 'bg-surface text-muted2 hover:text-ink'}`}>
              {t(k)} {n > 0 && <span className="ms-1 rounded-full bg-primary px-1.5 text-[10px] text-white">{n}</span>}
            </button>
          ))}
        </div>
      </ControlPanel>
      <div className="animate-fadeUp space-y-2.5 p-4 md:p-5">
        {list.length === 0 ? <Empty icon="fa-exchange" text={t('noRequests')} /> : list.map((r) => {
          const exists = assets.some((a) => a.id === r.asset_id)
          return (
            <div key={r.id} className="o-card flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface2 text-muted"><i className="fa fa-exchange" /></div>
              <div className="min-w-[200px] flex-1">
                <button className={`font-medium ${exists ? 'hover:text-primary' : ''}`} onClick={() => exists && ui.openDetail(r.asset_id)}>{r.asset_name} <span className="text-xs text-muted">×{r.qty}</span></button>
                <div className="text-[13px] text-muted2">{r.from_branch} <i className="fa fa-long-arrow-right mx-1 rtl:rotate-180" /> {r.to_branch}</div>
                <div className="text-xs text-muted">{r.requested_by} · {fmtDateTime(r.created_at)}{r.decided_by && ` · ${t(r.status.toLowerCase())}: ${r.decided_by}`}</div>
                {r.note && <div className="mt-1 rounded bg-surface2 px-2 py-1 text-[13px]">{r.note}</div>}
              </div>
              <span className={`o-badge ${BADGE[r.status] || 'b-def'}`}>{t(r.status.toLowerCase())}</span>
              {r.status === 'Pending' && (
                <div className="flex gap-2">
                  {tab === 'incoming' && canEdit(r.from_branch_id) && <>
                    <button className="o-btn-primary" disabled={busy === r.id} onClick={() => act(r, 'approve')}><i className="fa fa-check" /> {t('approve')}</button>
                    <button className="o-btn-secondary" disabled={busy === r.id} onClick={() => act(r, 'reject')}><i className="fa fa-times" /> {t('reject')}</button>
                  </>}
                  {r.requested_by_id === user.id && <button className="o-btn-link !text-bad" disabled={busy === r.id} onClick={() => act(r, 'cancel')}>{t('cancelReq')}</button>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
