import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './context/Auth'
import { DataProvider, useData } from './context/Data'
import { I18nProvider } from './context/I18n'
import { ThemeProvider } from './context/Theme'
import { ToastProvider } from './context/Toast'
import { UIProvider, useUI } from './context/UI'
import Assets from './pages/Assets'
import Attention from './pages/Attention'
import { BranchDetail, Branches } from './pages/Branches'
import Overview from './pages/Overview'
import Requests from './pages/Requests'
import Settings from './pages/Settings'
import Users from './pages/Users'

const Analytics = lazy(() => import('./pages/Analytics'))
const Login = lazy(() => import('./pages/Login'))

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Gate />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

function Gate() {
  const { user, ready } = useAuth()
  if (!ready) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>
  if (!user) return <Suspense fallback={null}><Login /></Suspense>
  return (
    <DataProvider>
      <UIProvider>
        <Shell />
      </UIProvider>
    </DataProvider>
  )
}

function Shell() {
  const { loading, isAdmin } = useData()
  return (
    <div className="min-h-screen">
      <Navbar />
      {loading ? <div className="py-24"><Spinner /></div> : (
        <main>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/branches/:id" element={<BranchDetail />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/attention" element={<Attention />} />
            <Route path="/analytics" element={<Suspense fallback={<div className="py-24"><Spinner /></div>}><Analytics /></Suspense>} />
            <Route path="/a/:id" element={<OpenAsset />} />
            {isAdmin && <Route path="/users" element={<Users />} />}
            {isAdmin && <Route path="/settings" element={<Settings />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      )}
    </div>
  )
}

/* QR labels encode /a/<id> so a phone camera opens the asset directly */
function OpenAsset() {
  const { id } = useParams()
  const nav = useNavigate()
  const ui = useUI()
  useEffect(() => {
    nav('/assets', { replace: true })
    ui.openDetail(Number(id))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
