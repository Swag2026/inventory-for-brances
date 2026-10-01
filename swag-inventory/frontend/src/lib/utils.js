export const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0))
export const fmtMoney = (n) => (n ? `${fmt(n)} SAR` : '—')
export function fmtDate(d) {
  if (!d) return '—'
  const x = new Date(d)
  return isNaN(x) ? String(d) : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
export function fmtDateTime(d) {
  if (!d) return '—'
  const x = new Date(d)
  return isNaN(x) ? String(d) : x.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const BRAND_COLOR = {
  'سواج': '#d4322c', swag: '#d4322c', 'لاروش': '#2f9aa3', laroche: '#2f9aa3', larouche: '#2f9aa3',
  'جولد': '#c9a227', gold: '#c9a227', 'اوتفيت': '#7c5cff', 'أوتفيت': '#7c5cff', outfit: '#7c5cff',
}
export function brandColor(b) {
  const bl = (b || '').toLowerCase()
  for (const [k, v] of Object.entries(BRAND_COLOR)) if (bl.includes(k)) return v
  return '#017E84'
}

const CAT_COLORS = {
  'كمبيوتر': '#3fb9c4', 'لابتوب': '#60A5FA', 'شاشة': '#8B5CF6', 'طابعة': '#E99D00', 'كاميرات': '#e2626b',
  'كراسي': '#B98D2F', 'أثاث': '#b07a3a', 'اثاث': '#b07a3a', 'شبكات': '#28A745', 'أخرى': '#8a97a8', 'اخرى': '#8a97a8',
}
export function catColor(c) {
  if (CAT_COLORS[c]) return CAT_COLORS[c]
  let h = 0
  for (const ch of c || '') h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h} 50% 50%)`
}

const COLOR_HEX = {
  'أسود': '#1c1c1e', 'اسود': '#1c1c1e', 'رمادي': '#8a8f98', 'أبيض': '#f3f4f6', 'ابيض': '#f3f4f6', 'فضي': '#cfd4d9',
  'بني': '#6b4a2b', 'ذهبي': '#c9a227', 'أزرق': '#2f6fed', 'ازرق': '#2f6fed', 'أحمر': '#d6473e', 'احمر': '#d6473e',
  'أخضر': '#1f9e6a', 'اخضر': '#1f9e6a', 'سماوي': '#0ec7e8', 'وردي': '#e879a0', 'بنفسجي': '#8B5CF6',
  'برتقالي': '#f97316', 'اصفر': '#eab308',
}
export const colorHex = (c) => COLOR_HEX[c] || '#9CA3AF'

export function statusKind(s) {
  const v = s || ''
  if (!v.trim()) return 'none'
  if (v.includes('استخدام')) return 'use'
  if (v.includes('تالف') || v.includes('متوقف')) return 'stop'
  if (v.includes('صيان')) return 'fix'
  if (v.includes('مخزن')) return 'store'
  if (v.includes('متاح')) return 'avail'
  return 'def'
}
export const STATUS_HEX = { use: '#28A745', avail: '#017E84', stop: '#D44C59', fix: '#E99D00', store: '#3B82C4', def: '#714B67', none: '#9CA3AF' }

export function assetIcon(cat, name) {
  const n = (name || '') + (cat || '')
  if (n.includes('لابتوب')) return 'fa-laptop'
  if (n.includes('كاشير') || n.includes('كمبيوتر') || n.includes('شاشة')) return 'fa-desktop'
  if (n.includes('طابعة')) return 'fa-print'
  if (n.includes('كرسي') || n.includes('كراسي')) return 'fa-wheelchair-alt'
  if (n.includes('كاميرا') || n.includes('كاميرات')) return 'fa-video-camera'
  if (n.includes('جوال') || n.includes('هاتف')) return 'fa-mobile'
  if (n.includes('طاول') || n.includes('أثاث') || n.includes('اثاث') || n.includes('مكتب')) return 'fa-archive'
  if (n.includes('الكترونيات')) return 'fa-plug'
  if (n.includes('ديكور')) return 'fa-paint-brush'
  if (n.includes('طيور')) return 'fa-twitter'
  return 'fa-cube'
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function printHtml(html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
  if (!w) alert('Allow pop-ups to print')
}

/** Resize + compress a photo in the browser before upload (phone photos are 4–8 MB). */
export function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve(file)
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      c.toBlob((b) => resolve(b && b.size < file.size ? new File([b], 'photo.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
