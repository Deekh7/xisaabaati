// ReportsPage.jsx — gated behind Pro plan
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useInvoices }     from '../hooks/useFirestore'
import { useLang }         from '../context/LangContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLimitGuard }   from '../hooks/useLimitGuard'
import { formatCurrency, isThisWeek, isThisMonth, groupByDay } from '../utils/helpers'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--green-dark)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: '.8rem' }}>
        <div style={{ fontWeight: 700 }}>{formatCurrency(payload[0].value)}</div>
        <div style={{ opacity: .7 }}>{label}</div>
      </div>
    )
  }
  return null
}

export default function ReportsPage() {
  const { t }             = useLang()
  const { invoices, loading } = useInvoices()
  const { canViewReports } = useSubscription()
  const { openPaywall }   = useLimitGuard()
  const [period, setPeriod] = useState('week')

  // If no access — show upgrade prompt
  if (!canViewReports) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>📈</div>
        <h2 style={{ marginBottom: 8, color: 'var(--green-dark)' }}>Reports — Pro Only</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: '.88rem', marginBottom: 28 }}>
          Upgrade to Pro to unlock weekly and monthly revenue reports, charts, and analytics.
        </p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => openPaywall('reports')}>
          ✦ Upgrade to Pro — $25/mo
        </button>
      </div>
    )
  }

  const stats = useMemo(() => {
    const filterFn = period === 'week' ? isThisWeek : isThisMonth
    const periodInvoices = invoices.filter(inv => filterFn(inv.createdAt))
    const revenue = periodInvoices.filter(inv => inv.status === 'paid').reduce((s, inv) => s + (inv.total || 0), 0)
    const paid    = periodInvoices.filter(inv => inv.status === 'paid').length
    const unpaid  = periodInvoices.filter(inv => inv.status !== 'paid').length
    return { revenue, paid, unpaid, total: periodInvoices.length }
  }, [invoices, period])

  const chartData = useMemo(() => groupByDay(invoices, period === 'week' ? 7 : 30), [invoices, period])

  if (loading) return <div className="spinner" />

  return (
    <div>
      <div className="page-header"><h2>{t('reports')}</h2></div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['week', t('thisWeek')], ['month', t('thisMonth')]].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{
            flex: 1, padding: 10, borderRadius: 'var(--radius)',
            border: '1.5px solid',
            borderColor: period === k ? 'var(--green-dark)' : 'var(--paper-3)',
            background: period === k ? 'var(--green-dark)' : '#fff',
            color: period === k ? '#fff' : 'var(--ink-3)',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.9rem',
          }}>{l}</button>
        ))}
      </div>

      {/* Hero stat */}
      <div className="stat-card primary" style={{ borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
        <div className="stat-label">{t('revenue')}</div>
        <div className="stat-value mono" style={{ fontSize: 'clamp(2rem,9vw,3rem)' }}>
          {formatCurrency(stats.revenue)}
        </div>
      </div>

      {/* Count row */}
      <div className="report-stat-grid">
        {[
          { label: t('invoiceCount'), value: stats.total, color: 'var(--ink)' },
          { label: t('paidCount'),    value: stats.paid,  color: 'var(--green-dark)' },
          { label: t('unpaidCount'),  value: stats.unpaid, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="report-stat">
            <div className="value" style={{ color: s.color }}>{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card-large">
        <div className="section-title" style={{ marginBottom: 16 }}>
          {t('revenue')} ({period === 'week' ? '7d' : '30d'})
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-3)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--ink-4)' }} tickFormatter={v => v.split(',')[0]} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--ink-4)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--green-ghost)' }} />
              <Bar dataKey="revenue" fill="var(--green-light)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
