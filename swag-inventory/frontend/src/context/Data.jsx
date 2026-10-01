import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { statusKind } from '../lib/utils'
import { useAuth } from './Auth'
import { useToast } from './Toast'

const DataCtx = createContext(null)

export function DataProvider({ children }) {
  const { user, refreshMe } = useAuth()
  const toast = useToast()
  const [assets, setAssets] = useState([])
  const [branches, setBranches] = useState([])
  const [choicesRaw, setChoicesRaw] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const busy = useRef(false)

  const reload = useCallback(async (silent = true) => {
    if (busy.current) return
    busy.current = true
    try {
      const [a, b, c, r] = await Promise.all([api('/assets'), api('/branches'), api('/choices'), api('/requests')])
      setAssets(a); setBranches(b); setChoicesRaw(c); setRequests(r)
      setLastSync(new Date())
      if (!silent) toast(`${a.length} assets loaded`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      busy.current = false
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { reload() }, [reload])
  // auto refresh every 3 minutes (React keeps form state, so open dialogs are safe)
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) { reload(); refreshMe() } }, 180000)
    return () => clearInterval(id)
  }, [reload, refreshMe])

  const value = useMemo(() => {
    const isAdmin = user?.role === 'admin'
    const allAccess = isAdmin || user?.all_branches
    const myBranchIds = allAccess ? branches.map((b) => b.id) : user?.branch_ids || []
    const myBranches = branches.filter((b) => myBranchIds.includes(b.id))
    const canEdit = (branchId) => (user?.role === 'admin' || user?.role === 'editor') && myBranchIds.includes(branchId)
    const editableBranches = myBranches.filter((b) => canEdit(b.id))
    const choices = { category: [], status: [], color: [] }
    choicesRaw.forEach((c) => choices[c.kind]?.push(c.value))
    const reservedIds = new Set(requests.filter((r) => r.status === 'Pending').map((r) => r.asset_id))
    const pendingIncoming = requests.filter((r) => r.status === 'Pending' && canEdit(r.from_branch_id))

    // per-branch aggregates (every visible branch, even empty ones)
    const agg = {}
    myBranches.forEach((b) => { agg[b.id] = { id: b.id, name: b.name, brand: b.brand, types: 0, units: 0, value: 0, cats: {}, last: null } })
    assets.forEach((d) => {
      const g = agg[d.branch_id] || (agg[d.branch_id] = { id: d.branch_id, name: d.branch, brand: d.brand, types: 0, units: 0, value: 0, cats: {}, last: null })
      g.types++; g.units += d.qty; g.value += d.purchase_price * d.qty
      g.cats[d.category] = (g.cats[d.category] || 0) + 1
      if (!g.last || d.created_at > g.last) g.last = d.created_at
    })

    const alerts = []
    const count = (fn) => assets.filter(fn).length
    if (pendingIncoming.length) alerts.push({ key: 'n_requests', n: pendingIncoming.length, color: 'var(--link)', to: '/requests' })
    const damaged = count((d) => statusKind(d.status) === 'stop')
    if (damaged) alerts.push({ key: 'n_damaged', n: damaged, color: 'var(--red)', to: '/assets?status=stop' })
    const maint = count((d) => statusKind(d.status) === 'fix')
    if (maint) alerts.push({ key: 'n_maint', n: maint, color: 'var(--amber)', to: '/assets?status=fix' })
    const noStatus = count((d) => !d.status?.trim())
    if (noStatus) alerts.push({ key: 'n_nostatus', n: noStatus, color: 'var(--blue)', to: '/attention' })
    const noPhoto = count((d) => !d.photo_url)
    if (noPhoto) alerts.push({ key: 'n_nophoto', n: noPhoto, color: 'var(--primary)', to: '/attention' })

    return {
      assets, branches, choices, choicesRaw, requests, loading, lastSync, reload,
      isAdmin, myBranchIds, myBranches, editableBranches, canEdit, canAdd: editableBranches.length > 0,
      reservedIds, pendingIncoming, branchAgg: agg, alerts,
    }
  }, [assets, branches, choicesRaw, requests, loading, lastSync, reload, user])

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}
export const useData = () => useContext(DataCtx)
