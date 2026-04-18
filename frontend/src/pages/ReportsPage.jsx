import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSales, useExpenses, useProducts } from '../hooks/useFirestore'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const GL = '#f0fdf4'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`

function WeekChart({ data, labels, height = 110 }) {
  const max = Math.max(...data, 1)
  return (
    <div className="week-chart" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="week-bar-wrap">
          {i === data.length - 1 && (
            <span className="week-bar-today-label">${v.toFixed(0)}</span>
          )}
          <div
            className={`week-bar${i === data.length - 1 ? ' today' : ''}`}
            style={{ height: `${Math.max((v / max) * (height - 24), 4)}px` }}
          />
          <span className="week-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { canViewReports, effectivePlan } = useSubscription()
  const { sales, loading: sLoading } = useSales()
  const { expenses } = useExpenses()
  const { products } = useProducts()

  if (!canViewReports) {
    return (
      <div className="lock-screen">
        <div className="lock-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>{t('reports')}</h3>
        <p style={{ color: '#64748b', marginBottom: 22, maxWidth: 280, margin: '0 auto 22px', lineHeight: 1.6 }}>
          {t('upgradeMsg')}
        </p>
        <button
          className="btn-primary"
          style={{ padding: '11px 28px' }}
          onClick={() => navigate('/app/payment')}
        >
          {t('upgrade')}
        </button>
      </div>
    )
  }

  const totS = sales.reduce((a, s) => a + (s.price || 0) * (s.qty || 1), 0)
  const totP = sales.reduce((a, s) => a + (s.profit || 0), 0)
  const totE = expenses.reduce((a, e) => a + (e.amount || 0), 0)
  const net  = totP - totE

  // Weekly chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekData   = []
  const weekLabels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    weekData.push(sales.filter((s) => s.date === ds).reduce((a, s) => a + (s.profit || 0), 0))
    weekLabels.push(i === 0 ? 'Today' : dayNames[d.getDay()])
  }

  // Product stats
  const prodStats = useMemo(() =>
    products.map((p) => {
      const ps = sales.filter((s) => s.productId === p.id)
      return {
        ...p,
        soldQty: ps.reduce((a, s) => a + (s.qty || 1), 0),
        revenue: ps.reduce((a, s) => a + (s.price || 0) * (s.qty || 1), 0),
        profit: ps.reduce((a, s) => a + (s.profit || 0), 0),
      }
    }).sort((a, b) => b.profit - a.profit)
  , [products, sales])

  const medals = ['🥇', '🥈', '🥉']

  if (sLoading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 18 }}>{t('reports')}</h2>

      {/* Stats grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        {[
          { l: t('totalSales'),    v: fm(totS),  c: '#0f172a', hi: false },
          { l: t('totalProfit'),   v: fm(totP),  c: G,         hi: false },
          { l: t('totalExpenses'), v: fm(totE),  c: '#c2410c', hi: false },
          { l: t('netProfit'),     v: fm(net),   c: net >= 0 ? G : '#dc2626', hi: true },
        ].map((x) => (
          <div
            key={x.l}
            className={`stat-card${x.hi ? (net >= 0 ? ' green' : '') : ''}`}
            style={x.hi && net < 0 ? { background: '#fff1f2', border: '1.5px solid #fca5a5' } : {}}
          >
            <div className="stat-label">{x.l}</div>
            <div className="stat-value" style={{ color: x.c }}>{x.v}</div>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>{t('weeklyProfit')}</div>
        <WeekChart data={weekData} labels={weekLabels} />
      </div>

      {/* Best products */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8fafc', fontWeight: 700, fontSize: 14 }}>
          {t('bestProducts')}
        </div>
        {prodStats.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">{t('noData')}</p>
          </div>
        ) : (
          prodStats.map((p, i) => (
            <div key={p.id} className="list-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 26, height: 26,
                  background: i < 3 ? '#fef3c7' : '#f8fafc',
                  borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                }}>
                  {medals[i] ?? i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.soldQty} {t('qty').toLowerCase()}</div>
                </div>
              </div>
              <span style={{ fontWeight: 700, color: G }}>{fm(p.profit)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
