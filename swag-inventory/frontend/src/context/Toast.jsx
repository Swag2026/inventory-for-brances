import { createContext, useCallback, useContext, useState } from 'react'

const ToastCtx = createContext(null)
const ICONS = { success: 'fa-check-circle text-ok', error: 'fa-times-circle text-bad', info: 'fa-info-circle text-link', warn: 'fa-exclamation-triangle text-warn' }
const BORDER = { success: 'border-ok', error: 'border-bad', info: 'border-link', warn: 'border-warn' }

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const toast = useCallback((msg, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setItems((x) => [...x, { id, msg, type }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="no-print fixed end-4 top-[58px] z-[300] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className={`flex animate-toastIn items-start gap-2.5 rounded-md border-s-4 ${BORDER[t.type]} bg-surface px-4 py-3 text-sm shadow-[0_4px_14px_rgba(0,0,0,.15)]`}>
            <i className={`fa ${ICONS[t.type] || ICONS.info} mt-0.5 text-base`} />
            <span className="leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)
