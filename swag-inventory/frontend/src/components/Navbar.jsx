import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/swag-logo.png'
import { useAuth } from '../context/Auth'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useTheme } from '../context/Theme'
import { useUI } from '../context/UI'

export default function Navbar() {
  const { t, lang, toggleLang } = useI18n()
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const { alerts, pendingIncoming, reload, lastSync, isAdmin } = useData()
  const ui = useUI()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null) // 'bell' | 'user' | null

  const menus = [
    ['/', 'overview'], ['/branches', 'branches'], ['/assets', 'assets'],
    ['/requests', 'requests', pendingIncoming.length], ['/attention', 'attention'], ['/analytics', 'analytics'],
    ...(isAdmin ? [['/users', 'users'], ['/settings', 'settings']] : []),
  ]
  const roleLabel = t('role_' + user.role)

  return (
    <header className="no-print sticky top-0 z-50 border-b border-line2 bg-surface">
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />}
      <div className="flex flex-wrap items-center md:h-[46px] md:flex-nowrap">
        <button className="o-icon-btn" title="Apps" onClick={() => nav('/')}><i className="fa fa-th text-lg" /></button>
        <img src={logo} alt="SWAG" className="mx-1 h-6 w-auto invert dark:invert-0" />
        <span className="px-2 text-base font-semibold">{t('appName')}</span>

        <nav className="no-scrollbar order-last flex h-[42px] w-full overflow-x-auto border-t border-line md:order-none md:h-[46px] md:w-auto md:flex-1 md:border-0">
          {menus.map(([to, key, badge]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `o-menu ${isActive ? 'active' : ''}`}>
              {t(key)}
              {!!badge && <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-white">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center">
          <form className="me-1 hidden lg:block" onSubmit={(e) => { e.preventDefault(); nav(`/assets?q=${encodeURIComponent(q)}`); setQ('') }}>
            <div className="relative">
              <i className="fa fa-search absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
              <input className="o-input h-[30px] w-44 !py-1 !ps-7 text-[13px]" placeholder={t('searchAssets')} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </form>
          <span className="hidden items-center gap-1.5 px-2 text-[11px] text-muted xl:flex" title={t('lastSync')}>
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-ok" />
            {lastSync ? lastSync.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '…'}
          </span>

          <div className="relative z-50">
            <button className="o-icon-btn relative" title={t('alerts')} onClick={() => setOpen(open === 'bell' ? null : 'bell')}>
              <i className="fa fa-bell text-base" />
              {alerts.length > 0 && <span className="absolute end-1 top-2 min-w-[16px] rounded-full bg-bad px-1 text-center text-[10px] font-bold leading-4 text-white">{alerts.length}</span>}
            </button>
            {open === 'bell' && (
              <div className="absolute end-0 top-full w-80 max-w-[calc(100vw-1rem)] animate-pop overflow-hidden rounded-md border border-line2 bg-surface shadow-[0_8px_20px_rgba(0,0,0,.12)]">
                <div className="border-b border-line px-4 py-2.5 text-sm font-semibold">{t('alerts')}</div>
                {alerts.length === 0 ? <div className="px-4 py-6 text-center text-sm text-muted">{t('noAlerts')}</div> :
                  alerts.map((a) => (
                    <button key={a.key} onClick={() => { setOpen(null); nav(a.to) }} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-start text-sm last:border-0 hover:bg-surface2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.color }} />
                      <span><b>{a.n}</b> {t(a.key)}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
          <button className="o-icon-btn" title={t('scan')} onClick={ui.openScanner}><i className="fa fa-barcode text-base" /></button>
          <button className="o-icon-btn" title={t('refresh')} onClick={() => reload(false)}><i className="fa fa-refresh text-base" /></button>
          <button className="o-icon-btn" title={t('theme')} onClick={toggle}><i className={`fa ${dark ? 'fa-sun-o' : 'fa-moon-o'} text-base`} /></button>
          <button className="o-icon-btn text-[13px]" onClick={toggleLang}>{lang === 'ar' ? 'EN' : 'ع'}</button>

          <div className="relative z-50">
            <button className="o-icon-btn" onClick={() => setOpen(open === 'user' ? null : 'user')} title={user.name}>
              <span className="flex h-7 w-7 items-center justify-center rounded bg-link text-[13px] font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
            </button>
            {open === 'user' && (
              <div className="absolute end-0 top-full w-64 animate-pop overflow-hidden rounded-md border border-line2 bg-surface py-1 shadow-[0_8px_20px_rgba(0,0,0,.12)]">
                <div className="border-b border-line px-4 py-3">
                  <div className="font-semibold">{user.name}</div>
                  <div className="truncate text-xs text-muted">{user.email}</div>
                  <span className="o-badge b-avail mt-1.5">{roleLabel}</span>
                </div>
                <button className="flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm hover:bg-surface2" onClick={() => { setOpen(null); ui.openPassword() }}><i className="fa fa-key w-4 text-muted" /> {t('changePassword')}</button>
                <button className="flex w-full items-center gap-2.5 px-4 py-2 text-start text-sm hover:bg-surface2" onClick={logout}><i className="fa fa-sign-out w-4 text-muted" /> {t('signout')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
