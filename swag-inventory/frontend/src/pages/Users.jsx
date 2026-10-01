import { useEffect, useState } from 'react'
import { ControlPanel, Empty, Modal, Spinner } from '../components/ui'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useToast } from '../context/Toast'
import { useUI } from '../context/UI'
import { api } from '../lib/api'
import { fmtDate } from '../lib/utils'

const ROLE_BADGE = { admin: 'b-stop', editor: 'b-avail', viewer: 'b-def' }

export default function Users() {
  const { t } = useI18n()
  const toast = useToast()
  const ui = useUI()
  const { user: me } = useAuth()
  const { branches } = useData()
  const [users, setUsers] = useState(null)
  const [edit, setEdit] = useState(null) // {} for new, user for edit
  const [q, setQ] = useState('')

  const load = () => api('/users').then(setUsers).catch((e) => toast(e.message, 'error'))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const bName = (id) => branches.find((b) => b.id === id)?.name || `#${id}`

  const remove = async (u) => {
    if (!(await ui.confirm({ title: t('deleteUserQ'), text: `${u.name} (${u.email})`, danger: true, ok: t('delete') }))) return
    try { await api(`/users/${u.id}`, { method: 'DELETE' }); toast(t('deleted'), 'success'); load() } catch (e) { toast(e.message, 'error') }
  }

  const list = (users || []).filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <ControlPanel title={t('users')} primary={{ label: t('newUser'), icon: 'fa-user-plus', onClick: () => setEdit({}) }}>
        <div className="relative w-56">
          <i className="fa fa-search absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
          <input className="o-input !ps-7" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </ControlPanel>
      <div className="animate-fadeUp p-4 md:p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {['admin', 'editor', 'viewer'].map((r) => (
            <div key={r} className="o-card px-4 py-3">
              <div className="flex items-center gap-2"><span className={`o-badge ${ROLE_BADGE[r]}`}>{t('role_' + r)}</span><span className="text-sm text-muted">{(users || []).filter((u) => u.role === r).length}</span></div>
              <p className="mt-1.5 text-xs text-muted2">{t('roleDesc_' + r)}</p>
            </div>
          ))}
        </div>
        <div className="o-card overflow-x-auto">
          {users === null ? <div className="py-10"><Spinner /></div> : (
            <table className="o-table">
              <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('role')}</th><th>{t('branchesAccess')}</th><th>{t('status')}</th><th>{t('created')}</th><th /></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded bg-link text-sm text-white">{u.name.charAt(0).toUpperCase()}</span>
                        <span className="font-medium">{u.name}{u.id === me.id && <span className="ms-1.5 text-xs text-muted">({t('you')})</span>}</span>
                      </div>
                    </td>
                    <td className="text-[13px] text-muted2">{u.email}</td>
                    <td><span className={`o-badge ${ROLE_BADGE[u.role]}`}>{t('role_' + u.role)}</span></td>
                    <td className="max-w-[320px]">
                      {u.role === 'admin' || u.all_branches ? <span className="o-badge b-use">{t('allBranches')}</span> :
                        u.branch_ids.length ? <div className="flex flex-wrap gap-1">{u.branch_ids.map((id) => <span key={id} className="o-badge b-def">{bName(id)}</span>)}</div> :
                          <span className="text-xs text-bad">{t('noBranches')}</span>}
                    </td>
                    <td>{u.is_active ? <span className="o-badge b-use">{t('active')}</span> : <span className="o-badge b-def">{t('inactive')}</span>}</td>
                    <td className="text-xs text-muted">{fmtDate(u.created_at)}</td>
                    <td className="whitespace-nowrap text-end">
                      <button className="o-btn-link" onClick={() => setEdit(u)}>{t('edit')}</button>
                      {u.id !== me.id && <button className="o-btn-link !text-bad" onClick={() => remove(u)}>{t('delete')}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {users && !list.length && <Empty icon="fa-users" text={t('noData')} />}
        </div>
      </div>
      {edit && <UserModal u={edit} me={me} branches={branches} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </>
  )
}

function UserModal({ u, me, branches, onClose, onSaved }) {
  const { t } = useI18n()
  const toast = useToast()
  const { refreshMe } = useAuth()
  const isNew = !u.id
  const [f, setF] = useState({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'viewer', all_branches: !!u.all_branches, branch_ids: u.branch_ids || [], is_active: u.is_active ?? true })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const toggleB = (id) => set('branch_ids', f.branch_ids.includes(id) ? f.branch_ids.filter((x) => x !== id) : [...f.branch_ids, id])
  const self = u.id === me.id

  const save = async () => {
    if (!f.name.trim() || !f.email.trim() || (isNew && f.password.length < 6)) { toast(t('fillRequired'), 'error'); return }
    setBusy(true)
    const body = { ...f }
    if (!body.password) delete body.password
    try {
      await (isNew ? api('/users', { method: 'POST', body }) : api(`/users/${u.id}`, { method: 'PATCH', body }))
      toast(isNew ? t('userCreated') : t('saved'), 'success')
      if (self) refreshMe()
      onSaved()
    } catch (e) { toast(e.message, 'error') } finally { setBusy(false) }
  }

  return (
    <Modal title={isNew ? t('newUser') : `${t('edit')}: ${u.name}`} icon={isNew ? 'fa-user-plus' : 'fa-user'} onClose={onClose}
      footer={<><button className="o-btn-primary" onClick={save} disabled={busy}><i className="fa fa-check" /> {t('save')}</button><button className="o-btn-secondary" onClick={onClose}>{t('cancel')}</button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <label><span className="o-label">{t('name')} <span className="text-bad">*</span></span><input className="o-field" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus /></label>
        <label><span className="o-label">{t('email')} <span className="text-bad">*</span></span><input className="o-field" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className="md:col-span-2"><span className="o-label">{isNew ? <>{t('password')} <span className="text-bad">*</span></> : t('resetPassword')}</span>
          <input className="o-field" type="text" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder={isNew ? t('min6') : t('keepPassword')} autoComplete="new-password" /></label>
      </div>

      <div className="mt-5">
        <span className="o-label">{t('role')}</span>
        <div className="mt-1.5 grid gap-2 md:grid-cols-3">
          {['viewer', 'editor', 'admin'].map((r) => (
            <button key={r} type="button" disabled={self && r !== 'admin' && u.role === 'admin'} onClick={() => set('role', r)}
              className={`rounded-md border p-3 text-start transition disabled:opacity-40 ${f.role === r ? 'border-primary bg-[rgba(113,75,103,.07)] ring-1 ring-primary' : 'border-line2 hover:border-primary'}`}>
              <div className="flex items-center gap-2 text-sm font-medium"><i className={`fa ${r === 'admin' ? 'fa-shield' : r === 'editor' ? 'fa-pencil' : 'fa-eye'} text-primary`} /> {t('role_' + r)}</div>
              <div className="mt-1 text-xs text-muted">{t('roleDesc_' + r)}</div>
            </button>
          ))}
        </div>
      </div>

      {f.role !== 'admin' && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="o-label">{t('branchesAccess')}</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="accent-[var(--primary)]" checked={f.all_branches} onChange={(e) => set('all_branches', e.target.checked)} /> {t('allBranchesAccess')}
            </label>
          </div>
          {!f.all_branches && (
            <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto rounded-md border border-line p-2 sm:grid-cols-2">
              {branches.map((b) => (
                <label key={b.id} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface2 ${f.branch_ids.includes(b.id) ? 'font-medium text-primary' : ''}`}>
                  <input type="checkbox" className="accent-[var(--primary)]" checked={f.branch_ids.includes(b.id)} onChange={() => toggleB(b.id)} /> {b.name}
                </label>
              ))}
            </div>
          )}
          {!f.all_branches && !f.branch_ids.length && <p className="mt-1.5 text-xs text-warn"><i className="fa fa-exclamation-triangle" /> {t('noBranchesWarn')}</p>}
        </div>
      )}

      {!self && (
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="accent-[var(--primary)]" checked={f.is_active} onChange={(e) => set('is_active', e.target.checked)} /> {t('activeDesc')}
        </label>
      )}
    </Modal>
  )
}
