export const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

let token = null
try { token = localStorage.getItem('inv_token') } catch (_) {}
let onUnauthorized = () => {}

export const getToken = () => token
export function setToken(t) {
  token = t
  try { t ? localStorage.setItem('inv_token', t) : localStorage.removeItem('inv_token') } catch (_) {}
}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  let r
  try {
    r = await fetch(`${API}/api${path}`, { method, headers, body: payload })
  } catch (_) {
    throw new Error('Cannot reach the server')
  }
  if (r.status === 401 && path !== '/auth/login') { onUnauthorized(); throw new Error('Session expired — please sign in again') }
  const data = r.status === 204 ? null : await r.json().catch(() => null)
  if (!r.ok) {
    const d = data?.detail
    const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join(', ') : `HTTP ${r.status}`
    throw new Error(msg)
  }
  return data
}

export const fileUrl = (p) => (!p ? '' : /^https?:/.test(p) ? p : `${API}${p}`)
