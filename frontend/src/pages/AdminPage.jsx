// AdminPage.jsx — Admin panel with Users + Payments tabs
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const PLAN_PRICE = { free: 0, basic: 12, pro: 25 }

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const ST = {
  card:     { background:'#fff', border:'1.5px solid #e4ede7', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 4px rgba(15,26,19,.07)', marginBottom:8 },
  cardTop:  { padding:'13px 14px', display:'flex', alignItems:'center', gap:11 },
  cardFoot: { padding:'9px 14px', background:'#f7faf8', borderTop:'1px solid #e4ede7', display:'flex', alignItems:'center', justifyContent:'space-between' },
  av:       { width:40, height:40, borderRadius:'50%', background:'#dcfce7', border:'2px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.82rem', color:'#166534', flexShrink:0 },
  avBl:     { width:40, height:40, borderRadius:'50%', background:'#fef2f2', border:'2px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.82rem', color:'#dc2626', flexShrink:0 },
}

const STATUS_STYLE = {
  pending:  { bg:'#fffbeb', color:'#92400e', border:'#fde68a', icon:'⏳', label:'Pending'  },
  approved: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0', icon:'✅', label:'Approved' },
  rejected: { bg:'#fef2f2', color:'#991b1b', border:'#fecaca', icon:'❌', label:'Rejected' },
}

const METHOD_ICONS = { manual:'💬', evc:'📱', zaad:'💳', sahal:'💳' }

/* ══ TAB: USERS ═════════════════════════════════════════ */
function UsersTab({ authUser }) {
  const [users, setUsers]     = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [modal, setModal]     = useState(null)
  const [flashUid, setFlashUid] = useState(null)

  useEffect(() => { fetchAll() }, [authUser])

  const fetchAll = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const h     = { Authorization: `Bearer ${token}` }
      const [uRes, sRes] = await Promise.all([
        fetch(`${API}/admin/users`, { headers: h }),
        fetch(`${API}/admin/stats`, { headers: h }),
      ])
      if (uRes.status === 403) { setError('Admin access required.'); setLoading(false); return }
      setUsers((await uRes.json()).users || [])
      setStats(await sRes.json())
    } catch { setError('Could not load admin data.') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase()
    if (filter === 'blocked' && !u.isBlocked) return false
    if (filter !== 'all' && filter !== 'blocked' && u.plan !== filter) return false
    if (filter !== 'blocked' && u.isBlocked) return false
    if (q && !u.email?.toLowerCase().includes(q) && !u.businessName?.toLowerCase().includes(q)) return false
    return true
  }), [users, search, filter])

  const doFlash = uid => { setFlashUid(uid); setTimeout(() => setFlashUid(null), 700) }

  const updatePlan = async (uid, plan) => {
    const token = await authUser.getIdToken()
    const res = await fetch(`${API}/admin/update-plan`, {
      method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ uid, plan }),
    })
    if (!res.ok) { toast.error('Failed'); return }
    setUsers(p => p.map(u => u.uid === uid ? { ...u, plan, isTrialActive: false } : u))
    doFlash(uid); toast.success(`Plan → ${plan.toUpperCase()}`); setModal(null)
  }

  const toggleBlock = async (uid, block) => {
    const token = await authUser.getIdToken()
    const res = await fetch(`${API}/admin/block-user`, {
      method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ uid, block }),
    })
    if (!res.ok) { toast.error('Action failed'); return }
    setUsers(p => p.map(u => u.uid === uid ? { ...u, isBlocked: block } : u))
    doFlash(uid); toast.success(block ? 'User blocked' : 'User unblocked', { icon: block ? '🚫' : '✅' })
    setModal(null)
  }

  if (loading) return <div className="spinner" style={{ padding:60 }} />
  if (error)   return (
    <div style={{ textAlign:'center', padding:48 }}>
      <div style={{ fontSize:'2rem', marginBottom:12 }}>🔒</div>
      <div style={{ fontWeight:700, marginBottom:8 }}>{error}</div>
    </div>
  )

  const FILTERS = [
    { id:'all',     label:'All',     count: users.filter(u=>!u.isBlocked).length },
    { id:'pro',     label:'Pro',     count: users.filter(u=>u.plan==='pro'&&!u.isBlocked).length },
    { id:'basic',   label:'Basic',   count: users.filter(u=>u.plan==='basic'&&!u.isBlocked).length },
    { id:'free',    label:'Free',    count: users.filter(u=>u.plan==='free'&&!u.isBlocked).length },
    { id:'blocked', label:'🚫',      count: users.filter(u=>u.isBlocked).length },
  ]

  return (
    <>
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[['Total',stats.total,'var(--ink)'],['Paid',stats.paid,'var(--green-dark)'],['Trial',stats.onTrial,'#2563eb'],['Blocked',stats.blocked,'var(--red)']].map(([l,v,c])=>(
            <div key={l} style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:14, padding:14 }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', color:'var(--ink-3)', marginBottom:5 }}>{l}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.7rem', fontWeight:700, color:c }}>{v||0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="search-bar" style={{ marginBottom:12 }}>
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:12, color:'var(--ink-4)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input className="form-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email…" style={{ paddingLeft:36 }} />
      </div>

      <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height:32, padding:'0 12px', borderRadius:99, border:'1.5px solid',
            borderColor: filter===f.id ? (f.id==='blocked' ? 'var(--red)' : 'var(--green-dark)') : 'var(--paper-3)',
            background:  filter===f.id ? (f.id==='blocked' ? '#fef2f2' : 'var(--green-dark)') : '#fff',
            color:       filter===f.id ? (f.id==='blocked' ? 'var(--red)' : '#fff') : 'var(--ink-3)',
            fontFamily:'var(--font-body)', fontSize:'.75rem', fontWeight:600, cursor:'pointer',
          }}>
            {f.label} <span style={{ fontFamily:'var(--font-mono)', opacity:.65, fontSize:'.62rem' }}>({f.count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No users found</p></div>
      ) : filtered.map(u => (
        <div key={u.uid} style={{ ...ST.card, opacity:u.isBlocked?.65:1, borderColor:u.isBlocked?'#fecaca':'#e4ede7', animation:flashUid===u.uid?'flashG .65s ease':'none' }}>
          <style>{`@keyframes flashG{0%{border-color:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.2)}100%{border-color:#e4ede7;box-shadow:none}}`}</style>
          <div style={ST.cardTop}>
            <div style={u.isBlocked ? ST.avBl : ST.av}>{initials(u.businessName)}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                {u.businessName}
                {u.isBlocked && <span className="badge badge-unpaid" style={{ fontSize:'.55rem' }}>blocked</span>}
              </div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'.7rem', color:'var(--ink-3)', marginTop:2 }}>{u.email}</div>
              <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}>
                <span className={`badge ${u.plan==='pro'?'badge-paid':''}`}
                  style={u.plan==='basic'?{background:'#fffbeb',color:'#92400e',border:'1px solid #fde68a'}:u.plan==='free'?{background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0'}:{}}>
                  {u.plan==='pro'?'✦':u.plan==='basic'?'◆':'○'} {u.plan}
                </span>
                {u.isTrialActive && <span className="badge" style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', fontSize:'.6rem' }}>{u.trialDaysLeft}d trial</span>}
                <span className="badge" style={{ background:'#f8fafc', color:'var(--ink-3)', border:'1px solid var(--paper-3)', fontSize:'.6rem' }}>{u.invoicesCount||0} inv</span>
              </div>
            </div>
          </div>
          <div style={ST.cardFoot}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'.65rem', color:'var(--ink-4)' }}>
              {u.createdAt?.slice(0,10)||'—'}
            </span>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal({ type:'plan', user:u })}>✎ Plan</button>
              <button className="btn btn-sm"
                style={{ background:u.isBlocked?'#f0fdf4':'#fef2f2', color:u.isBlocked?'#15803d':'#dc2626', border:`1.5px solid ${u.isBlocked?'#bbf7d0':'#fecaca'}` }}
                onClick={() => setModal({ type:'block', user:u })}>
                {u.isBlocked ? '↩ Unblock' : '🚫 Block'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Plan modal */}
      {modal?.type === 'plan' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-header"><h3>Change Plan</h3><button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ marginBottom:14, padding:'9px 11px', background:'var(--paper-2)', borderRadius:10, fontSize:'.82rem' }}>
                <strong>{modal.user.businessName}</strong>
                <div style={{ color:'var(--ink-3)', marginTop:2, fontFamily:'var(--font-mono)', fontSize:'.72rem' }}>{modal.user.email}</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
                {['free','basic','pro'].map(p => (
                  <button key={p} onClick={() => updatePlan(modal.user.uid, p)} style={{
                    padding:'12px 6px', borderRadius:12,
                    border:`1.5px solid ${modal.user.plan===p?'var(--green-dark)':'var(--paper-3)'}`,
                    background: modal.user.plan===p?'var(--green-ghost)':'#fff',
                    cursor:'pointer', textAlign:'center', fontFamily:'var(--font-body)',
                  }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'.8rem', color:modal.user.plan===p?'var(--green-dark)':'var(--ink)' }}>{p}</div>
                    <div style={{ fontSize:'.68rem', color:'var(--ink-3)', marginTop:3 }}>{PLAN_PRICE[p]===0?'Free':`$${PLAN_PRICE[p]}/mo`}</div>
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Block modal */}
      {modal?.type === 'block' && (() => {
        const blocking = !modal.user.isBlocked
        return (
          <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(null)}>
            <div className="modal-sheet">
              <div className="modal-handle" />
              <div className="modal-header">
                <h3 style={{ color:blocking?'var(--red)':'var(--green-dark)' }}>{blocking?'🚫 Block':'✅ Unblock'}</h3>
                <button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom:16, padding:'10px 12px', background:'var(--paper-2)', borderRadius:10, fontSize:'.82rem' }}>
                  <strong>{modal.user.businessName}</strong>
                  <div style={{ color:'var(--ink-3)', marginTop:2, fontFamily:'var(--font-mono)', fontSize:'.72rem' }}>{modal.user.email}</div>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
                  <button className={`btn btn-full ${blocking?'btn-danger':'btn-primary'}`} onClick={() => toggleBlock(modal.user.uid, blocking)}>
                    {blocking ? 'Block Account' : 'Unblock Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

/* ══ TAB: PAYMENTS ═══════════════════════════════════════ */
function PaymentsTab({ authUser }) {
  const [payments, setPayments]     = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('pending')
  const [modal, setModal]           = useState(null)   // { type: 'reject', payment }
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing]         = useState(null)   // paymentId being processed
  const [flashId, setFlashId]       = useState(null)

  useEffect(() => { fetchPayments() }, [authUser, filter])

  const fetchPayments = async () => {
    if (!authUser) return
    setLoading(true)
    try {
      const token = await authUser.getIdToken()
      const h     = { Authorization: `Bearer ${token}` }
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/api/payments/all?status=${filter !== 'all' ? filter : ''}`, { headers: h }),
        fetch(`${API}/api/payments/stats`, { headers: h }),
      ])
      const pData = await pRes.json()
      setPayments(pData.payments || [])
      if (sRes.ok) setStats(await sRes.json())
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }

  const doFlash = id => { setFlashId(id); setTimeout(() => setFlashId(null), 800) }

  const approve = async (payment) => {
    setActing(payment.id)
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/api/payments/approve`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ paymentId: payment.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`✅ ${data.message}`)
      doFlash(payment.id)
      await fetchPayments()
    } catch (e) {
      toast.error(e.message || 'Approval failed')
    } finally { setActing(null) }
  }

  const reject = async () => {
    if (!modal?.payment) return
    setActing(modal.payment.id)
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/api/payments/reject`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ paymentId: modal.payment.id, reason: rejectReason || 'Could not verify payment.' }),
      })
      if (!res.ok) throw new Error('Rejection failed')
      toast.success('Payment rejected')
      doFlash(modal.payment.id)
      setModal(null); setRejectReason('')
      await fetchPayments()
    } catch (e) {
      toast.error(e.message)
    } finally { setActing(null) }
  }

  const FILTERS = [
    { id:'pending',  label:'Pending',  count: stats?.pending  ?? '—' },
    { id:'approved', label:'Approved', count: stats?.approved ?? '—' },
    { id:'rejected', label:'Rejected', count: stats?.rejected ?? '—' },
    { id:'all',      label:'All',      count: stats?.total    ?? '—' },
  ]

  return (
    <>
      {/* Stats row */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            ['Pending',  stats.pending,       '#f59e0b'],
            ['Approved', stats.approved,      'var(--green-dark)'],
            ['Rejected', stats.rejected,      'var(--red)'],
            ['Revenue',  `$${stats.totalRevenue?.toFixed(0)||0}`, 'var(--ink)'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:14, padding:14 }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', color:'var(--ink-3)', marginBottom:5 }}>{l}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.5rem', fontWeight:700, color:c }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height:32, padding:'0 13px', borderRadius:99, border:'1.5px solid',
            borderColor: filter===f.id ? 'var(--green-dark)' : 'var(--paper-3)',
            background:  filter===f.id ? 'var(--green-dark)' : '#fff',
            color:       filter===f.id ? '#fff' : 'var(--ink-3)',
            fontFamily:'var(--font-body)', fontSize:'.76rem', fontWeight:600, cursor:'pointer',
          }}>
            {f.label} <span style={{ fontFamily:'var(--font-mono)', opacity:.65, fontSize:'.62rem' }}>({f.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner" style={{ padding:40 }} />
      ) : payments.length === 0 ? (
        <div className="empty-state"><p>No {filter} payments</p></div>
      ) : payments.map(p => {
        const ss  = STATUS_STYLE[p.status] || STATUS_STYLE.pending
        const isBusy = acting === p.id
        return (
          <div key={p.id} style={{
            background:'#fff', border:`1.5px solid ${p.status==='pending'?'#fde68a':p.status==='approved'?'#bbf7d0':'#fecaca'}`,
            borderRadius:16, overflow:'hidden', marginBottom:10,
            boxShadow: flashId===p.id ? '0 0 0 4px rgba(34,197,94,.2)' : 'var(--shadow-sm)',
            transition:'box-shadow .4s',
          }}>
            {/* Top row */}
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
              {/* Avatar */}
              <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--green-pale)', color:'var(--green-dark)', border:'2px solid var(--green-light)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'.82rem', flexShrink:0 }}>
                {initials(p.businessName || p.uid)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                {/* Business + plan */}
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:'.9rem' }}>{p.businessName || '—'}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'.72rem', background:'var(--paper-2)', padding:'2px 8px', borderRadius:99, color:'var(--ink-3)' }}>
                    {p.userEmail || p.uid?.slice(0,8)}
                  </span>
                </div>
                {/* Meta row */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'.74rem', fontWeight:700, color:'var(--green-dark)', background:'var(--green-ghost)', padding:'2px 9px', borderRadius:99, border:'1px solid var(--green-pale)' }}>
                    → {p.plan?.toUpperCase()}
                  </span>
                  <span style={{ fontSize:'.74rem', fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--ink)' }}>
                    ${p.totalAmount}
                  </span>
                  <span style={{ fontSize:'.72rem', color:'var(--ink-3)' }}>
                    {METHOD_ICONS[p.method]||'💰'} {p.method?.toUpperCase()}
                  </span>
                  {p.phoneUsed && (
                    <span style={{ fontSize:'.72rem', fontFamily:'var(--font-mono)', color:'var(--ink-3)' }}>
                      📞 {p.phoneUsed}
                    </span>
                  )}
                </div>
                {p.proofNote && (
                  <div style={{ marginTop:6, fontSize:'.78rem', color:'var(--ink-2)', background:'var(--paper-2)', padding:'6px 10px', borderRadius:8, fontStyle:'italic' }}>
                    "{p.proofNote}"
                  </div>
                )}
                <div style={{ marginTop:5, fontSize:'.68rem', fontFamily:'var(--font-mono)', color:'var(--ink-4)' }}>
                  {p.createdAt?.slice(0,16).replace('T',' ')} · ID: {p.id?.slice(0,8)}
                </div>
              </div>
              {/* Status badge */}
              <span style={{ flexShrink:0, fontSize:'.72rem', fontWeight:700, color:ss.color, background:ss.bg, padding:'4px 10px', borderRadius:99, border:`1px solid ${ss.border}` }}>
                {ss.icon} {ss.label}
              </span>
            </div>

            {/* Reject reason */}
            {p.status === 'rejected' && p.rejectReason && (
              <div style={{ padding:'8px 16px', background:'#fef2f2', borderTop:'1px solid #fecaca', fontSize:'.78rem', color:'#991b1b' }}>
                ⚠️ Reason: {p.rejectReason}
              </div>
            )}

            {/* Admin actions — only for pending */}
            {p.status === 'pending' && (
              <div style={{ padding:'10px 16px', background:'#f7faf8', borderTop:'1px solid #e4ede7', display:'flex', gap:10 }}>
                <button
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => approve(p)}
                  disabled={isBusy}
                  style={{ background:'var(--green-dark)' }}>
                  {isBusy ? 'Processing…' : '✅ Approve & Upgrade'}
                </button>
                <button
                  className="btn btn-sm btn-full"
                  onClick={() => setModal({ type:'reject', payment: p })}
                  disabled={isBusy}
                  style={{ background:'#fef2f2', color:'#dc2626', border:'1.5px solid #fecaca' }}>
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Reject modal */}
      {modal?.type === 'reject' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget&&setModal(null)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <div className="modal-header">
              <h3 style={{ color:'var(--red)' }}>❌ Reject Payment</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom:14, padding:'9px 11px', background:'var(--paper-2)', borderRadius:10, fontSize:'.82rem' }}>
                <strong>{modal.payment.businessName||modal.payment.uid}</strong>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:'.72rem', color:'var(--ink-3)', marginTop:2 }}>
                  {modal.payment.plan?.toUpperCase()} — ${modal.payment.totalAmount}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for rejection (shown to user)</label>
                <input className="form-input" value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                  placeholder="e.g. Payment amount incorrect, transaction not found…" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-ghost btn-full" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-danger btn-full" onClick={reject} disabled={acting===modal.payment.id}>
                  {acting===modal.payment.id ? 'Rejecting…' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ══ TAB: PLANS ═══════════════════════════════════════════ */
const DEFAULT_PLANS = [
  { key:'free',  name:'Free',  price:0,  invoiceLimit:20,   features:['20 invoices/mo'] },
  { key:'basic', name:'Basic', price:12, invoiceLimit:null, features:['Unlimited invoices'] },
  { key:'pro',   name:'Pro',   price:25, invoiceLimit:null, features:['Unlimited','Reports','Multi-user'] },
]

function PlansTab({ authUser, allUsers }) {
  const [plans, setPlans]       = useState(DEFAULT_PLANS)
  const [loading, setLoading]   = useState(true)
  const [editKey, setEditKey]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => { fetchPlans() }, [authUser])

  const fetchPlans = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/plans`, { headers:{ Authorization:`Bearer ${token}` } })
      if (res.ok) setPlans(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  const openEdit = (plan) => {
    setEditKey(plan.key)
    setEditForm({ price: plan.price, invoiceLimit: plan.invoiceLimit ?? '' })
  }

  const savePlan = async () => {
    setSaving(true)
    try {
      const token = await authUser.getIdToken()
      const body = {
        price: Number(editForm.price),
        invoiceLimit: editForm.invoiceLimit === '' ? null : Number(editForm.invoiceLimit),
      }
      const res = await fetch(`${API}/admin/plans/${editKey}`, {
        method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      const updated = await res.json()
      setPlans(p => p.map(pl => pl.key === editKey ? { ...pl, ...updated } : pl))
      toast.success('Plan updated')
      setEditKey(null)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  const countByPlan = (key) => (allUsers || []).filter(u => u.plan === key).length

  if (loading) return <div className="spinner" style={{ padding:60 }} />

  return (
    <div style={{ display:'grid', gap:14 }}>
      {plans.map(plan => (
        <div key={plan.key} style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'16px 16px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <span style={{ fontWeight:800, fontSize:'1rem' }}>{plan.name}</span>
                <span style={{ marginLeft:10, fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'.9rem', color:'var(--green-dark)' }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                </span>
              </div>
              <div style={{ background:'var(--paper-2)', padding:'4px 12px', borderRadius:99, fontSize:'.72rem', fontFamily:'var(--font-mono)', color:'var(--ink-3)' }}>
                {countByPlan(plan.key)} users
              </div>
            </div>
            <div style={{ fontSize:'.78rem', color:'var(--ink-3)', marginBottom:8 }}>
              {plan.invoiceLimit ? `${plan.invoiceLimit} invoices/mo` : 'Unlimited invoices'}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {(plan.features || []).map(f => (
                <span key={f} style={{ background:'var(--green-ghost)', color:'var(--green-dark)', border:'1px solid var(--green-light)', padding:'2px 9px', borderRadius:99, fontSize:'.7rem', fontWeight:600 }}>
                  {f}
                </span>
              ))}
            </div>
          </div>

          {editKey === plan.key ? (
            <div style={{ padding:'12px 16px', background:'var(--paper-2)', borderTop:'1px solid var(--paper-3)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--ink-3)', display:'block', marginBottom:4 }}>Price ($/mo)</label>
                  <input className="form-input" type="number" value={editForm.price}
                    onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--ink-3)', display:'block', marginBottom:4 }}>Invoice Limit (blank = unlimited)</label>
                  <input className="form-input" type="number" value={editForm.invoiceLimit}
                    onChange={e => setEditForm(f => ({ ...f, invoiceLimit: e.target.value }))} placeholder="∞" />
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditKey(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={savePlan} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding:'9px 16px', background:'var(--paper-2)', borderTop:'1px solid var(--paper-3)' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(plan)}>✎ Edit Pricing</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ══ TAB: MESSAGES ════════════════════════════════════════ */
function MessagesTab({ authUser }) {
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { fetchMessages() }, [authUser])

  const fetchMessages = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/messages`, { headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      const msgs = data.messages || []
      setMessages(msgs)
      setUnreadCount(msgs.filter(m => !m.read).length)
    } catch { toast.error('Failed to load messages') }
    finally { setLoading(false) }
  }

  const expand = async (msg) => {
    setExpanded(expanded === msg.id ? null : msg.id)
    if (!msg.read) {
      try {
        const token = await authUser.getIdToken()
        await fetch(`${API}/admin/messages/${msg.id}`, {
          method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body: JSON.stringify({ read: true }),
        })
        setMessages(p => p.map(m => m.id === msg.id ? { ...m, read: true } : m))
        setUnreadCount(c => Math.max(0, c - 1))
      } catch {}
    }
  }

  if (loading) return <div className="spinner" style={{ padding:60 }} />
  if (messages.length === 0) return <div className="empty-state"><p>No messages yet</p></div>

  return (
    <div style={{ display:'grid', gap:8 }}>
      {messages.map(msg => (
        <div key={msg.id} style={{
          background:'#fff', border:`1.5px solid ${msg.read ? 'var(--paper-3)' : 'var(--green-light)'}`,
          borderRadius:14, overflow:'hidden', boxShadow: msg.read ? 'none' : '0 0 0 3px var(--green-ghost)',
        }}>
          <div style={{ padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}
            onClick={() => expand(msg)}>
            {!msg.read && (
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green-dark)', flexShrink:0 }} />
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'.88rem' }}>{msg.name || '—'}</div>
              <div style={{ fontSize:'.73rem', color:'var(--ink-3)', fontFamily:'var(--font-mono)' }}>
                {msg.phone || msg.email || '—'} · {msg.createdAt?.slice(0,10) || '—'}
              </div>
              {msg.subject && (
                <div style={{ fontSize:'.78rem', color:'var(--ink-2)', marginTop:3 }}>{msg.subject}</div>
              )}
            </div>
            <div style={{ color:'var(--ink-4)', fontSize:'1rem' }}>{expanded === msg.id ? '▲' : '▼'}</div>
          </div>

          {expanded === msg.id && (
            <div style={{ padding:'12px 14px', background:'var(--paper-2)', borderTop:'1px solid var(--paper-3)' }}>
              <p style={{ fontSize:'.84rem', color:'var(--ink)', marginBottom:12, whiteSpace:'pre-wrap' }}>{msg.body}</p>
              {msg.phone && (
                <a
                  href={`https://wa.me/${msg.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`مرحباً ${msg.name}، `)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ background:'#22c55e', textDecoration:'none', display:'inline-block' }}
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

/* ══ TAB: PAGES (CMS) ═════════════════════════════════════ */
const DEFAULT_SLUGS = ['about', 'privacy', 'terms']

function PagesTab({ authUser }) {
  const [pages, setPages]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)  // slug
  const [editForm, setEditForm]   = useState({ title:'', body:'' })
  const [saving, setSaving]       = useState(false)

  useEffect(() => { fetchPages() }, [authUser])

  const fetchPages = async () => {
    if (!authUser) return
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/pages`, { headers:{ Authorization:`Bearer ${token}` } })
      const data = await res.json()
      const existing = data.pages || []
      // Merge with defaults so all 3 slugs always appear
      const slugMap = Object.fromEntries(existing.map(p => [p.slug, p]))
      const merged = DEFAULT_SLUGS.map(s => slugMap[s] || { slug: s, title: '', body: '' })
      // Add any extra pages from DB
      existing.forEach(p => { if (!DEFAULT_SLUGS.includes(p.slug)) merged.push(p) })
      setPages(merged)
    } catch { toast.error('Failed to load pages') }
    finally { setLoading(false) }
  }

  const openEdit = (page) => {
    setEditing(page.slug)
    setEditForm({ title: page.title || '', body: page.body || '' })
  }

  const savePage = async () => {
    setSaving(true)
    try {
      const token = await authUser.getIdToken()
      const res = await fetch(`${API}/admin/pages/${editing}`, {
        method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error('Failed')
      const saved = await res.json()
      setPages(p => p.map(pg => pg.slug === editing ? { ...pg, ...saved } : pg))
      toast.success('Page saved')
      setEditing(null)
    } catch { toast.error('Save failed') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner" style={{ padding:60 }} />

  return (
    <div style={{ display:'grid', gap:12 }}>
      {pages.map(page => (
        <div key={page.slug} style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:'.9rem', fontFamily:'var(--font-mono)' }}>/{page.slug}</div>
              {page.title && <div style={{ fontSize:'.8rem', color:'var(--ink-2)', marginTop:2 }}>{page.title}</div>}
              {page.updatedAt && <div style={{ fontSize:'.68rem', color:'var(--ink-4)', marginTop:2 }}>Updated: {page.updatedAt?.slice(0,10)}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(page)}>✎ Edit</button>
          </div>

          {editing === page.slug && (
            <div style={{ padding:'12px 14px', background:'var(--paper-2)', borderTop:'1px solid var(--paper-3)' }}>
              <div className="form-group" style={{ marginBottom:10 }}>
                <label className="form-label">Title</label>
                <input className="form-input" value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom:10 }}>
                <label className="form-label">Body</label>
                <textarea className="form-textarea" rows={8} value={editForm.body}
                  onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={savePage} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Page'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ══ Main AdminPage ══════════════════════════════════════ */
export default function AdminPage() {
  const { user }  = useAuth()
  const [tab, setTab] = useState('payments')   // start on payments — most action
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    if (!user) return
    user.getIdToken().then(token =>
      fetch(`${API}/admin/users`, { headers:{ Authorization:`Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setAllUsers(d.users || []))
        .catch(() => {})
    )
  }, [user])

  const TABS = [
    { id:'payments', label:'💳 Payments' },
    { id:'users',    label:'👥 Users' },
    { id:'plans',    label:'📋 Plans' },
    { id:'messages', label:'✉️ Messages' },
    { id:'pages',    label:'📄 Pages' },
  ]

  return (
    <div>
      <div className="page-header"><h2>Admin Panel</h2></div>

      {/* Tab switcher — scrollable on mobile */}
      <div style={{ display:'flex', gap:0, marginBottom:20, background:'var(--paper-2)', borderRadius:12, padding:4, border:'1.5px solid var(--paper-3)', overflowX:'auto' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex:'0 0 auto', padding:'9px 14px', borderRadius:9, border:'none',
            background: tab===id ? '#fff' : 'transparent',
            color: tab===id ? 'var(--green-dark)' : 'var(--ink-3)',
            fontFamily:'var(--font-body)', fontWeight:700, fontSize:'.82rem', cursor:'pointer',
            boxShadow: tab===id ? 'var(--shadow-sm)' : 'none',
            transition:'all .2s', whiteSpace:'nowrap',
          }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'payments' && <PaymentsTab authUser={user} />}
      {tab === 'users'    && <UsersTab    authUser={user} />}
      {tab === 'plans'    && <PlansTab    authUser={user} allUsers={allUsers} />}
      {tab === 'messages' && <MessagesTab authUser={user} />}
      {tab === 'pages'    && <PagesTab    authUser={user} />}
    </div>
  )
}
