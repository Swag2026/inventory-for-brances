import { fmtDate } from './utils'

export async function exportAssets(rows, name = 'Swag_Inventory') {
  const XLSX = await import('xlsx')
  const data = rows.map((d) => ({
    ID: d.id, Name: d.name, Branch: d.branch, Brand: d.brand, Category: d.category, Model: d.model,
    'Serial Number': d.serial_number, Qty: d.qty, Status: d.status, Color: d.color,
    'Amount SAR': d.purchase_price, 'Total SAR': d.purchase_price * d.qty, Invoice: d.invoice,
    'Purchase Date': d.purchase_date || '', Notes: d.notes, Created: fmtDate(d.created_at),
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
  XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// Accepts the old SharePoint dashboard export + Arabic headers
const MAP = {
  name: ['Name', 'Asset', 'Asset Name', 'Title', 'الاسم', 'اسم الأصل'],
  branch: ['Branch', 'الفرع'],
  category: ['Category', 'AssetType', 'الفئة'],
  model: ['Model', 'الموديل'],
  serial_number: ['Serial Number', 'Serial', 'الرقم التسلسلي'],
  qty: ['Qty', 'Quantity', 'الكمية'],
  status: ['Status', 'الحالة'],
  color: ['Color', 'اللون'],
  purchase_price: ['Amount SAR', 'Amount', 'PurchasePrice', 'Price', 'المبلغ'],
  invoice: ['Invoice', 'OrderNumber', 'الفاتورة'],
  purchase_date: ['Purchase Date', 'PurchaseDate', 'تاريخ الشراء'],
  notes: ['Notes', 'ConditionNotes', 'ملاحظات'],
}

export async function parseImportFile(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  return raw.map((r) => {
    const out = {}
    for (const [key, headers] of Object.entries(MAP)) {
      const h = headers.find((x) => r[x] !== undefined && r[x] !== '')
      let v = h ? r[h] : ''
      if (v instanceof Date) v = v.toISOString().slice(0, 10)
      out[key] = v
    }
    out.qty = parseInt(out.qty, 10) || 1
    out.purchase_price = parseFloat(String(out.purchase_price).replace(/[^\d.]/g, '')) || 0
    for (const k of Object.keys(out)) if (typeof out[k] !== 'number') out[k] = String(out[k] ?? '').trim()
    return out
  }).filter((r) => r.name || r.branch)
}
