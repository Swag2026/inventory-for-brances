import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { ControlPanel, Empty } from '../components/ui'
import { useData } from '../context/Data'
import { useI18n } from '../context/I18n'
import { useTheme } from '../context/Theme'
import { brandColor, catColor, fmt, STATUS_HEX, statusKind } from '../lib/utils'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const group = (rows, keyFn, valFn = (d) => d.qty) => {
  const m = {}
  rows.forEach((d) => { const k = keyFn(d) || '—'; m[k] = (m[k] || 0) + valFn(d) })
  return Object.entries(m).sort((a, b) => b[1] - a[1])
}

export default function Analytics() {
  const { t } = useI18n()
  const { dark } = useTheme()
  const { assets, branchAgg } = useData()
  const css = getComputedStyle(document.documentElement)
  const tick = css.getPropertyValue('--muted2').trim() || '#4B5563'
  const grid = css.getPropertyValue('--border').trim() || '#E7E9ED'
  ChartJS.defaults.color = tick
  ChartJS.defaults.font.family = "-apple-system,'Segoe UI','Noto Sans',Arial,'Noto Sans Arabic',sans-serif"

  if (!assets.length) return <><ControlPanel title={t('analytics')} /><Empty text={t('noData')} /></>

  const branches = Object.values(branchAgg).sort((a, b) => b.units - a.units)
  const cats = group(assets, (d) => d.category)
  const sts = group(assets, (d) => d.status)
  const brands = group(assets, (d) => d.brand)
  const value = group(assets, (d) => d.branch, (d) => d.purchase_price * d.qty).slice(0, 10)
  const axes = { x: { grid: { color: grid } }, y: { grid: { color: grid }, beginAtZero: true } }
  const base = { maintainAspectRatio: false, plugins: { legend: { display: false } } }
  const donut = { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } } }

  const Card = ({ title, children, wide }) => (
    <div className={`o-card p-4 ${wide ? 'lg:col-span-2' : ''}`}>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="relative h-64">{children}</div>
    </div>
  )

  return (
    <>
      <ControlPanel title={t('analytics')} />
      <div key={dark ? 'd' : 'l'} className="grid animate-fadeUp gap-4 p-4 md:p-5 lg:grid-cols-2">
        <Card title={t('c_branch')}>
          <Bar data={{ labels: branches.map((g) => g.name), datasets: [{ data: branches.map((g) => g.units), backgroundColor: branches.map((g) => brandColor(g.brand)), borderRadius: 5 }] }} options={{ ...base, scales: axes }} />
        </Card>
        <Card title={t('c_cat')}>
          <Doughnut data={{ labels: cats.map((c) => c[0]), datasets: [{ data: cats.map((c) => c[1]), backgroundColor: cats.map((c) => catColor(c[0])), borderWidth: 0 }] }} options={donut} />
        </Card>
        <Card title={t('c_status')}>
          <Doughnut data={{ labels: sts.map((s) => s[0]), datasets: [{ data: sts.map((s) => s[1]), backgroundColor: sts.map((s) => STATUS_HEX[statusKind(s[0] === '—' ? '' : s[0])]), borderWidth: 0 }] }} options={donut} />
        </Card>
        <Card title={t('c_brand')}>
          <Bar data={{ labels: brands.map((b) => b[0]), datasets: [{ data: brands.map((b) => b[1]), backgroundColor: brands.map((b) => brandColor(b[0])), borderRadius: 5 }] }} options={{ ...base, indexAxis: 'y', scales: axes }} />
        </Card>
        <Card title={t('c_value')} wide>
          <Bar data={{ labels: value.map((v) => v[0]), datasets: [{ data: value.map((v) => v[1]), backgroundColor: 'rgba(113,75,103,.75)', borderRadius: 5 }] }}
            options={{ ...base, scales: axes, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${fmt(c.raw)} SAR` } } } }} />
        </Card>
      </div>
    </>
  )
}
