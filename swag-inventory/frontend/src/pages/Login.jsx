import { lazy, Suspense, useState } from 'react'
import logo from '../assets/swag-logo.png'
import { Magnet } from '../components/ui'
import { useAuth } from '../context/Auth'
import { useI18n } from '../context/I18n'
import { useTheme } from '../context/Theme'

const LoginBackground = lazy(() => import('../components/LoginBackground'))

export default function Login() {
  const { t, lang, toggleLang } = useI18n()
  const { dark, toggle } = useTheme()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try { await login(email, password) } catch (ex) { setErr(ex.message) } finally { setBusy(false) }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}><LoginBackground dark={dark} /></Suspense>
      <form onSubmit={submit} className="relative z-10 w-full max-w-[380px] animate-loginFade rounded-lg border border-line2 bg-surface px-8 pb-8 pt-9 text-center shadow-[0_8px_24px_rgba(0,0,0,.08)] dark:shadow-[0_0_90px_rgba(255,60,80,.12),0_40px_80px_rgba(0,0,0,.45)]">
        <Magnet count={12} range={70} color="#B98D2F" className="mx-auto mb-4 inline-flex px-6 py-3">
          <img src={logo} alt="SWAG" className="h-14 w-auto invert dark:invert-0" />
        </Magnet>
        <div className="mb-1 text-[13px] text-muted">{t('brand')}</div>
        <h1 className="mb-1 text-xl font-medium">{t('loginTitle')}</h1>
        <p className="mb-6 text-sm text-muted2">{t('loginSub')}</p>

        <div className="space-y-4 text-start">
          <label className="block">
            <span className="o-label">{t('email')}</span>
            <input className="o-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@swag.sa" autoComplete="username" required autoFocus />
          </label>
          <label className="block">
            <span className="o-label">{t('password')}</span>
            <div className="relative">
              <input className="o-field pe-8" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" onClick={() => setShow(!show)} className="absolute end-1 top-1/2 -translate-y-1/2 text-muted hover:text-ink"><i className={`fa ${show ? 'fa-eye-slash' : 'fa-eye'}`} /></button>
            </div>
          </label>
        </div>

        {err && <div className="mt-4 rounded-md bg-[rgba(212,76,89,.1)] px-3 py-2 text-start text-sm text-bad"><i className="fa fa-exclamation-circle" /> {err}</div>}

        <Magnet as="button" type="submit" disabled={busy} count={14} range={90} color="var(--primary)"
          className="login-btn o-btn-primary mt-6 w-full !py-2.5 !text-[15px] hover:!translate-y-0">
          {busy ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-sign-in" />} {busy ? t('signingIn') : t('signIn')}
        </Magnet>

        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="o-btn-secondary !px-3 !py-1 text-[13px]" onClick={toggleLang}>{lang === 'ar' ? 'English' : 'العربية'}</button>
          <button type="button" className="o-btn-secondary !px-3 !py-1" onClick={toggle}><i className={`fa ${dark ? 'fa-sun-o' : 'fa-moon-o'}`} /></button>
        </div>
      </form>
    </div>
  )
}
