import { useMemo, useState, useEffect } from 'react'
import { useNavigate }    from 'react-router-dom'
import { Plus }           from 'lucide-react'
import { useInvoices }    from '../hooks/useFirestore'
import { useLang }        from '../context/LangContext'
import { useAuth }        from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLimitGuard }  from '../hooks/useLimitGuard'
import PaywallModal       from '../components/PaywallModal'
import { formatCurrency, formatDate, getStatusColor, isToday, getBizConfig } from '../utils/helpers'

export default function DashboardPage() {
  const { t, lang }    = useLang()
  const { profile }    = useAuth()
  const biz = getBizConfig(profile?.bizType)
  const { invoices, loading } = useInvoices(20)
  const navigate       = useNavigate()
  const { effectivePlan, isTrialActive, trialDaysLeft, invoicesCount, invoiceLimit } = useSubscription()
  const { guard, PaywallGate } = useLimitGuard()

  // Simple / Advanced mode — persisted to localStorage
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('xisaabaati_mode') || 'simple' } catch { return 'simple' }
  })
  const toggleMode = () => {
    const next = mode === 'simple' ? 'advanced' : 'simple'
    setMode(next)
    try { localStorage.setItem('xisaabaati_mode', next) } catch {}
  }

  const stats = useMemo(() => {
    const todayPaid = invoices
      .filter(inv => isToday(inv.createdAt) && inv.status === 'paid')
      .reduce((s, inv) => s + (inv.total || 0), 0)
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((s, inv) => s + (inv.total || 0), 0)
    const totalDebt = invoices
      .filter(inv => inv.status === 'unpaid' || inv.status === 'partial')
      .reduce((s, inv) => s + ((inv.total || 0) - (inv.amountPaid || 0)), 0)
    return { todayPaid, totalRevenue, totalDebt }
  }, [invoices])

  const recent = mode === 'simple' ? invoices.slice(0, 5) : invoices.slice(0, 6)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <h2>
          {biz.emoji} {profile?.businessName || t('dashboard')}
        </h2>
        {/* Mode toggle */}
        <button
          onClick={toggleMode}
          style={{
            padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
            background: mode === 'simple' ? '#f0fdf4' : '#1e293b',
            color: mode === 'simple' ? '#166534' : '#fff',
            fontSize: '.76rem', fontWeight: 700, fontFamily: 'var(--font-body)',
            transition: 'all .2s',
          }}
        >
          {mode === 'simple' ? '⊞ Advanced' : '◱ Simple'}
        </button>
      </div>

      {/* Plan badge — advanced only */}
      {mode === 'advanced' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 99,
            background: effectivePlan === 'pro' ? 'var(--green-pale)' : effectivePlan === 'basic' ? '#fffbeb' : '#f1f5f9',
            color: effectivePlan === 'pro' ? 'var(--green-dark)' : effectivePlan === 'basic' ? '#92400e' : '#475569',
            border: `1px solid ${effectivePlan === 'pro' ? 'var(--green-light)' : effectivePlan === 'basic' ? '#fde68a' : '#e2e8f0'}`,
            fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px',
          }}>
            {effectivePlan === 'pro' ? '✦' : effectivePlan === 'basic' ? '◆' : '○'} {effectivePlan}
            {isTrialActive && <span style={{ opacity: .7 }}>· Trial</span>}
          </span>
          {invoiceLimit !== null && (
            <span style={{ fontSize: '.72rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              {invoicesCount}/{invoiceLimit} invoices
            </span>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid">
        {/* Today revenue — always shown, accent uses biz.color */}
        <div className="stat-card primary" style={{ borderColor: biz.color + '44', background: biz.bg }}>
          <div className="stat-label">{t('todayRevenue')}</div>
          <div className="stat-value mono" style={{ color: biz.color }}>{formatCurrency(stats.todayPaid)}</div>
        </div>
        {mode === 'advanced' && (
          <>
            <div className="stat-card">
              <div className="stat-label" style={{ color: 'var(--ink-3)' }}>{t('totalRevenue')}</div>
              <div className="stat-value" style={{ color: 'var(--green-dark)' }}>{formatCurrency(stats.totalRevenue)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label" style={{ color: 'var(--ink-3)' }}>{t('totalDebt')}</div>
              <div className="stat-value" style={{ color: 'var(--red)' }}>{formatCurrency(stats.totalDebt)}</div>
            </div>
          </>
        )}
      </div>

      {/* Simple mode — large new doc button */}
      {mode === 'simple' && (
        <button
          className="btn btn-primary btn-full btn-lg"
          style={{ marginBottom: 16, fontSize: '1.1rem', background: biz.color, border: 'none' }}
          onClick={() => guard('invoice', () => navigate('/invoices', { state: { create: true } }))}
        >
          <Plus size={20} style={{ marginInlineEnd: 6 }} />
          + New {biz.docLabel}
        </button>
      )}

      {/* Recent invoices */}
      <div className="card-large">
        <div className="section-header">
          <span className="section-title">{t('recentInvoices')}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/invoices')}>{t('viewAll')}</button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : recent.length === 0 ? (
          <div className="empty-state"><p>{t('noInvoices')}</p></div>
        ) : (
          recent.map(inv => (
            <div key={inv.id} className="invoice-item" onClick={() => navigate('/invoices')}>
              <div className="invoice-status-dot" style={{ background: getStatusColor(inv.status) }} />
              <div className="invoice-info">
                <div className="invoice-customer">{inv.customerName || '—'}</div>
                <div className="invoice-meta">{inv.invoiceNo} · {formatDate(inv.createdAt, lang)}</div>
              </div>
              <div>
                <div className="invoice-amount">{formatCurrency(inv.total)}</div>
                <div style={{ textAlign: 'end' }}>
                  <span className={`badge badge-${inv.status}`}>{t(inv.status)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB — guarded (show in advanced mode) */}
      {mode === 'advanced' && (
        <button className="fab" onClick={() => guard('invoice', () => navigate('/invoices', { state: { create: true } }))}>
          <Plus size={26} />
        </button>
      )}

      <PaywallGate />
    </div>
  )
}
