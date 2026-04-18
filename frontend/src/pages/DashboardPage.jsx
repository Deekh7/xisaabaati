import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSales, useExpenses, useProducts } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const GL = '#f0fdf4'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`
const today = () => new Date().toISOString().split('T')[0]

function WeekChart({ data, labels, height = 90 }) {
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

function DonutChart({ profit, expenses }) {
  const total = profit + expenses || 1
  const angle = (profit / total) * 283
  const pct = Math.round((profit / total) * 100)
  return (
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <circle
        cx="50" cy="50" r="45" fill="none" stroke={G} strokeWidth="10"
        strokeDasharray={`${angle} ${283 - angle}`}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray .8s' }}
      />
      <text x="50" y="56" textAnchor="middle" fontSize="16" fontWeight="800" fill={G}>
        {pct}%
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { businessType } = useAuth()
  const { effectivePlan, salesCount, invoiceLimit } = useSubscription()
  const { t } = useLang()
  const { sales, loading: sLoading } = useSales()
  const { expenses } = useExpenses()
  const { products } = useProducts()

  const todaySales    = useMemo(() => sales.filter((s) => s.date === today()), [sales])
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today()), [expenses])

  const todayProfit   = todaySales.reduce((a, s) => a + (s.profit || 0), 0)
  const todayRevenue  = todaySales.reduce((a, s) => a + (s.price || 0) * (s.qty || 1), 0)
  const todayExpTotal = todayExpenses.reduce((a, e) => a + (e.amount || 0), 0)
  const net           = todayProfit - todayExpTotal

  // Weekly chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekData   = []
  const weekLabels = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    weekData.push(sales.filter((s) => s.date === ds).reduce((a, s) => a + (s.profit || 0), 0))
    weekLabels.push(i === 0 ? '•' : dayNames[d.getDay()])
  }

  // Best products
  const bestProducts = useMemo(() =>
    products.map((p) => {
      const ps = todaySales.filter((s) => s.productId === p.id)
      return { ...p, profit: ps.reduce((a, s) => a + (s.profit || 0), 0) }
    }).sort((a, b) => b.profit - a.profit).slice(0, 4)
  , [products, todaySales])

  const isPlanFree = effectivePlan === 'free'
  const limit = invoiceLimit || 30
  const usedCount = salesCount || todaySales.length

  if (sLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      {/* Upgrade banner */}
      {isPlanFree && usedCount >= limit * 0.75 && (
        <div className="upgrade-banner">
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{t('upgradeMsg')}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {limit - usedCount} {t('invoicesLeft')}
            </div>
            <div style={{ marginTop: 8, height: 5, background: 'rgba(255,255,255,.25)', borderRadius: 3, overflow: 'hidden', maxWidth: 200 }}>
              <div style={{ height: '100%', background: '#fff', borderRadius: 3, width: `${Math.min((usedCount / limit) * 100, 100)}%` }} />
            </div>
          </div>
          <button className="upgrade-banner-btn" onClick={() => navigate('/app/payment')}>
            {t('upgrade')} →
          </button>
        </div>
      )}

      {/* Hero profit card */}
      <div className="hero-profit">
        <div className="hero-profit-label">{t('todayProfit')}</div>
        <div className="hero-profit-value">{fm(net)}</div>
        <div className="hero-profit-pills">
          {[
            { l: t('salesCount'), v: todaySales.length },
            { l: t('totalSales'), v: fm(todayRevenue) },
            { l: t('expenses_today'), v: fm(todayExpTotal) },
          ].map((s) => (
            <div key={s.l} className="hero-profit-pill">
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick add sale button */}
      <button
        onClick={() => navigate('/app/sales')}
        style={{
          width: '100%', background: G, color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px 0', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', marginBottom: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {businessType === 'restaurant' ? t('quickSale') : t('addSale')}
      </button>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: '#374151' }}>
            {t('weeklyProfit')}
          </div>
          <WeekChart data={weekData} labels={weekLabels} />
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>{t('profitMargin')}</span>
          <DonutChart profit={Math.max(net, 0)} expenses={todayExpTotal} />
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: G, borderRadius: 2, display: 'inline-block' }} />
              {t('profit')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, background: '#f1f5f9', borderRadius: 2, display: 'inline-block' }} />
              {t('expenses')}
            </span>
          </div>
        </div>
      </div>

      {/* Best products */}
      {bestProducts.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: '#374151' }}>
            {t('bestProducts')}
          </div>
          {bestProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
              <div style={{
                width: 26, height: 26,
                background: i === 0 ? '#fef3c7' : GL,
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: i === 0 ? '#92400e' : G, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: G }}>{fm(p.profit)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent sales */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f8fafc' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>{t('recentSales')}</span>
          <span className="badge badge-green">{t('daily')}</span>
        </div>
        {todaySales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
            </div>
            <p className="empty-text">{t('noData')}</p>
            <p className="empty-hint">{t('startSelling')}</p>
          </div>
        ) : (
          todaySales.slice(0, 8).map((s) => (
            <div key={s.id} className="list-item">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.product}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {s.time} · ×{s.qty || 1}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: G, fontSize: 14 }}>{fm(s.profit)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
