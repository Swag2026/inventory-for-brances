import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AssetDetailModal, AssetFormModal, ConfirmModal, PasswordModal, QRModal, RequestModal, ScannerModal, useOpenFromScan } from '../components/modals'

const UICtx = createContext(null)

export function UIProvider({ children }) {
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(null)
  const [qr, setQr] = useState(null)
  const [scan, setScan] = useState(false)
  const [req, setReq] = useState(null)
  const [pwd, setPwd] = useState(false)
  const [confirmState, setConfirmState] = useState(null)

  const confirm = useCallback((opts) => new Promise((res) => setConfirmState({ ...opts, res })), [])
  const ui = useMemo(() => ({
    openDetail: setDetail,
    openForm: (asset = null, defaults = {}) => setForm({ asset, defaults }),
    openQR: setQr,
    openScanner: () => setScan(true),
    openRequest: setReq,
    openPassword: () => setPwd(true),
    confirm,
  }), [confirm])

  return (
    <UICtx.Provider value={ui}>
      {children}
      {detail != null && <AssetDetailModal id={detail} ui={ui} onClose={() => setDetail(null)} />}
      {form && <AssetFormModal asset={form.asset} defaults={form.defaults} onClose={() => setForm(null)} />}
      {qr && <QRModal asset={qr} onClose={() => setQr(null)} />}
      {req && <RequestModal asset={req} onClose={() => setReq(null)} />}
      {scan && <ScanHost ui={ui} onClose={() => setScan(false)} />}
      {pwd && <PasswordModal onClose={() => setPwd(false)} />}
      {confirmState && <ConfirmModal {...confirmState} onDone={(v) => { confirmState.res(v); setConfirmState(null) }} />}
    </UICtx.Provider>
  )
}

function ScanHost({ ui, onClose }) {
  const open = useOpenFromScan(ui)
  return <ScannerModal onClose={onClose} onFound={(id) => { onClose(); open(id) }} />
}

export const useUI = () => useContext(UICtx)
