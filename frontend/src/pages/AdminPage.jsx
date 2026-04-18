// AdminPage.jsx — Admin panel with new design
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import toast from 'react-hot-toast'

const G = '#16a34a'
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const initials = (name) =>
  (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

const inp = {
  width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 12, fontSize: 14, outline: 'none', background: '#fff',
  fontFamily: 'inherit', color: '#1e293b',
}

/* ══ UsersTab ═══════════════════════════════════════════════ */
function UsersTab({ authUser, t }) {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal]   = useState(null)

  useEffect(() => { fetchAll() }, [authUser])

  const fetchAll = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 403) { setError('Admin access required.'); return }
      const data = await res.json()
      setUsers(data.users || [])
    } catch { setError('Could not load users.') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() =>
    users.filter((u) => {
      const q = search.toLowerCase()
      if (filter === 'blocked' && !u.isBlocked) return false
      if (filter !== 'all' && filter !== 'blocked' && u.plan !== filter) return false
      if (filter !== 'blocked' && u.isBlocked) return false
      return !q || u.email?.toLowerCase().includes(q) || u.businessName?.toLowerCase().includes(q)
    })
  , [users, search, filter])

  const updatePlan = async (uid, plan) => {
    try {
      const token = await authUser.getIdToken()
      await fetch(`${API}/admin/update-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, plan }),
      })
      setUsers((p) => p.map((u) => u.uid === uid ? { ...u, plan, isTrialActive: false } : u))
      toast.success(`Plan → ${plan.toUpperCase()}`)
      setModal(null)
    } catch { toast.error('Failed') }
  }

  const toggleBlock = async (uid, block) => {
    try {
      const token = await authUser.getIdToken()
      await fetch(`${API}/admin/block-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, block }),
      })
      setUsers((p) => p.map((u) => u.uid === uid ? { ...u, isBlocked: block } : u))
      toast.success(block ? 'User blocked' : 'User unblocked')
      setModal(null)
    } catch { toast.error('Action failed') }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (error) return <div style={{ textAlign: 'center', padding: 48 }}><div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div><div style={{ fontWeight: 700 }}>{error}</div></div>

  const FILTERS = [
    { id: 'all', label: 'All', count: users.filter((u) => !u.isBlocked).length },
    { id: 'pro', label: 'Pro', count: users.filter((u) => u.plan === 'pro' && !u.isBlocked).length },
    { id: 'free', label: 'Free', count: users.filter((u) => u.plan === 'free' && !u.isBlocked).length },
    { id: 'blocked', label: '🚫', count: users.filter((u) => u.isBlocked).length },
  ]

  return (
    <>
      <div className="search-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input className="search-input" style={inp} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f.id} className={`admin-tab${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p className="empty-text">No users found</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((u) => (
            <div key={u.uid} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: u.isBlocked ? '#fef2f2' : '#f0fdf4',
                  color: u.isBlocked ? '#dc2626' : G,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '.85rem', flexShrink: 0,
                }}>
                  {initials(u.businessName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.businessName}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className="badge badge-gray">{u.plan}</span>
                    {u.isBlocked && <span className="badge badge-red">blocked</span>}
                    {u.isTrialActive && <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>trial</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => setModal({ type: 'plan', user: u })} title="Change Plan">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setModal({ type: 'block', user: u })}
                    style={{
                      background: u.isBlocked ? '#f0fdf4' : '#fef2f2',
                      color: u.isBlocked ? G : '#dc2626',
                      border: 'none', borderRadius: 10, width: 34, height: 34,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {u.isBlocked ? '✓' : '🚫'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan modal */}
      {modal?.type === 'plan' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-header">
              <span className="modal-title">Change Plan</span>
              <button className="btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>{modal.user.businessName} — {modal.user.email}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {['free', 'starter', 'pro'].map((p) => (
                  <button
                    key={p}
                    onClick={() => updatePlan(modal.user.uid, p)}
                    style={{
                      padding: '12px 6px', borderRadius: 12,
                      border: `1.5px solid ${modal.user.plan === p ? G : '#e2e8f0'}`,
                      background: modal.user.plan === p ? '#f0fdf4' : '#fff',
                      cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
                      fontWeight: 700, color: modal.user.plan === p ? G : '#374151',
                    }}
                  >{p}</button>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 12, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }} onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Block modal */}
      {modal?.type === 'block' && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              {modal.user.isBlocked ? 'Unblock' : 'Block'} {modal.user.businessName}?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button
                onClick={() => toggleBlock(modal.user.uid, !modal.user.isBlocked)}
                style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: modal.user.isBlocked ? G : '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                {modal.user.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ══ PaymentsTab ════════════════════════════════════════════ */
function PaymentsTab({ authUser, t }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [acting, setActing]     = useState(null)
  const [modal, setModal]       = useState(null)
  const [reason, setReason]     = useState('')

  useEffect(() => { fetchPayments() }, [authUser, filter])

  const fetchPayments = async () => {
    if (!authUser) return
    setLoading(true)
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/api/payments/all?status=${filter !== 'all' ? filter : ''}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setPayments(data.payments || [])
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }

  const approve = async (p) => {
    setActing(p.id)
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId: p.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('✅ Payment approved!')
      fetchPayments()
    } catch (e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  const reject = async () => {
    if (!modal?.payment) return
    setActing(modal.payment.id)
    try {
      const token = await authUser.getIdToken()
      await fetch(`${API}/api/payments/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId: modal.payment.id, reason: reason || 'Could not verify payment.' }),
      })
      toast.success('Payment rejected')
      setModal(null); setReason('')
      fetchPayments()
    } catch (e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  const FILTERS = ['pending', 'approved', 'rejected', 'all']
  const statusColor = { pending: '#f59e0b', approved: G, rejected: '#dc2626' }

  return (
    <>
      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f} className={`admin-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state"><p className="empty-text">No {filter} payments</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {payments.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.businessName || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{p.userEmail || p.uid?.slice(0, 8)}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    → {p.plan?.toUpperCase()} · ${p.totalAmount} · {p.method?.toUpperCase()}
                  </div>
                </div>
                <span className="badge" style={{ background: (statusColor[p.status] || '#94a3b8') + '18', color: statusColor[p.status] || '#94a3b8' }}>
                  {p.status}
                </span>
              </div>
              {p.proofNote && (
                <div style={{ fontSize: 13, color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: 10, marginBottom: 10, fontStyle: 'italic' }}>
                  "{p.proofNote}"
                </div>
              )}
              {p.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => approve(p)}
                    disabled={acting === p.id}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: G, color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: acting === p.id ? 0.7 : 1 }}
                  >
                    ✅ {t('approve')}
                  </button>
                  <button
                    onClick={() => setModal({ type: 'reject', payment: p })}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ❌ {t('reject')}
                  </button>
                </div>
              )}
              {p.status === 'rejected' && p.rejectReason && (
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>Reason: {p.rejectReason}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'reject' && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-header">
              <span className="modal-title" style={{ color: '#dc2626' }}>Reject Payment</span>
              <button className="btn-icon" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, marginBottom: 14 }}>{modal.payment.businessName} — ${modal.payment.totalAmount}</p>
              <div className="form-group">
                <label className="form-label">Reason (shown to user)</label>
                <input style={inp} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payment not found..." />
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ flex: 2, padding: '13px 0', justifyContent: 'center', background: '#dc2626' }}
                  onClick={reject}
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ══ MessagesTab ════════════════════════════════════════════ */
function MessagesTab({ authUser }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchMessages() }, [authUser])

  const fetchMessages = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/messages`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (messages.length === 0) return <div className="empty-state"><p className="empty-text">No messages yet</p></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {messages.map((msg) => (
        <div key={msg.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {!msg.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: G, display: 'inline-block', marginRight: 6 }} />}
              <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.name || '—'}</span>
              <div style={{ fontSize: 12, color: '#64748b' }}>{msg.phone || msg.email} · {msg.createdAt?.slice(0, 10)}</div>
            </div>
            <span style={{ color: '#94a3b8' }}>{expanded === msg.id ? '▲' : '▼'}</span>
          </div>
          {expanded === msg.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
              <p style={{ fontSize: 14, color: '#374151', marginBottom: 12, whiteSpace: 'pre-wrap' }}>{msg.body}</p>
              {msg.phone && (
                <a
                  href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${msg.name}، `)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#22c55e', color: '#fff', borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}
                >
                  💬 Reply via WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ══ Main AdminPage ═════════════════════════════════════════ */
export default function AdminPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const [tab, setTab] = useState('payments')

  const TABS = [
    { id: 'payments', label: '💳 ' + t('payments') },
    { id: 'users',    label: '👥 ' + t('users') },
    { id: 'messages', label: '✉️ ' + t('messages') },
  ]

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 18 }}>{t('admin')}</h2>

      <div className="admin-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'payments' && <PaymentsTab authUser={user} t={t} />}
      {tab === 'users'    && <UsersTab    authUser={user} t={t} />}
      {tab === 'messages' && <MessagesTab authUser={user} t={t} />}
    </div>
  )
}
