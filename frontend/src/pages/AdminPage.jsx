// AdminPage.jsx — Full Firestore-based admin dashboard
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import {
  collection, query, onSnapshot, doc, updateDoc,
  orderBy, addDoc, serverTimestamp, getDoc, getDocs,
  where, limit,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import toast from 'react-hot-toast'

const G = '#16a34a'
const fm = n => `$${Number(n||0).toFixed(2)}`
const initials = n => (n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = G, bg = '#f0fdf4' }) {
  return (
    <div style={{
      background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16,
      padding:'18px 16px', display:'flex', alignItems:'center', gap:14,
    }}>
      <div style={{
        width:46, height:46, borderRadius:14, background:bg,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:12, color:'#94a3b8', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending:  { bg:'#fffbeb', color:'#92400e' },
  approved: { bg:'#f0fdf4', color:'#166534' },
  rejected: { bg:'#fef2f2', color:'#991b1b' },
  free:     { bg:'#f8fafc', color:'#475569' },
  starter:  { bg:'#eff6ff', color:'#1d4ed8' },
  basic:    { bg:'#eff6ff', color:'#1d4ed8' },
  pro:      { bg:'#f0fdf4', color:'#15803d' },
  blocked:  { bg:'#fef2f2', color:'#dc2626' },
}
function Badge({ label }) {
  const s = STATUS_COLOR[label?.toLowerCase()] || { bg:'#f1f5f9', color:'#475569' }
  return (
    <span style={{
      background:s.bg, color:s.color, fontSize:11, fontWeight:700,
      padding:'3px 10px', borderRadius:20, textTransform:'capitalize',
    }}>{label}</span>
  )
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, count, children }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <h2 style={{ fontWeight:800, fontSize:18, margin:0 }}>{title}</h2>
        {count !== undefined && <div style={{ fontSize:12, color:'#94a3b8' }}>{count} total</div>}
      </div>
      <div style={{ display:'flex', gap:8 }}>{children}</div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
function Empty({ msg }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 16px', color:'#94a3b8' }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🗂️</div>
      <div style={{ fontWeight:600 }}>{msg}</div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  STATS TAB
// ════════════════════════════════════════════════════════════
function StatsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const users = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      const now = new Date()
      let totalUsers=0, paying=0, onTrial=0, blocked=0, mrr=0
      const PRICES = { free:0, starter:9, basic:19, pro:39 }
      users.forEach(u => {
        totalUsers++
        if (u.isBlocked) { blocked++; return }
        const plan = u.plan || 'free'
        if (['starter','basic','pro'].includes(plan)) { paying++; mrr += PRICES[plan]||0 }
        if (u.trialEndsAt && new Date(u.trialEndsAt) > now && plan === 'free') onTrial++
      })
      setStats({ totalUsers, paying, onTrial, blocked, mrr })
      setLoading(false)
    })
    return unsub
  }, [])

  const [pendingPay, setPendingPay] = useState(0)
  const [unreadMsg, setUnreadMsg]   = useState(0)

  useEffect(() => {
    const q = query(collection(db,'payments'), where('status','==','pending'))
    const unsub = onSnapshot(q, snap => setPendingPay(snap.size))
    return unsub
  }, [])

  useEffect(() => {
    const q = query(collection(db,'messages'))
    const unsub = onSnapshot(q, snap => {
      const unread = snap.docs.filter(d => !d.data().read).length
      setUnreadMsg(unread)
    })
    return unsub
  }, [])

  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>

  return (
    <div>
      <SectionHeader title="📊 لوحة الإحصائيات" />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        <StatCard icon="👥" label="إجمالي المستخدمين" value={stats?.totalUsers || 0} color="#0f172a" bg="#f8fafc" />
        <StatCard icon="💳" label="مشتركين مدفوعين"  value={stats?.paying || 0}     color={G}        bg="#f0fdf4" />
        <StatCard icon="🎁" label="في فترة التجربة"  value={stats?.onTrial || 0}    color="#1d4ed8"  bg="#eff6ff" />
        <StatCard icon="💰" label="MRR المتوقع"       value={fm(stats?.mrr||0)}      color="#15803d"  bg="#f0fdf4" />
        <StatCard icon="⏳" label="طلبات دفع معلقة"  value={pendingPay}             color="#92400e"  bg="#fffbeb" />
        <StatCard icon="✉️" label="رسائل جديدة"       value={unreadMsg}              color="#7c3aed"  bg="#f5f3ff" />
      </div>
      {stats?.blocked > 0 && (
        <div style={{
          background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:12,
          padding:'12px 16px', fontSize:13, color:'#dc2626', fontWeight:600,
        }}>
          🚫 {stats.blocked} حساب محجوب حالياً
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  PAYMENTS TAB
// ════════════════════════════════════════════════════════════
function PaymentsTab() {
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending')
  const [acting,   setActing]   = useState(null)
  const [rejModal, setRejModal] = useState(null)
  const [reason,   setReason]   = useState('')
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)
    const q = filter === 'all'
      ? query(collection(db,'payments'), orderBy('createdAt','desc'))
      : query(collection(db,'payments'), where('status','==',filter), orderBy('createdAt','desc'))
    const unsub = onSnapshot(q, snap => {
      setPayments(snap.docs.map(d => ({ id:d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [filter])

  const approve = async p => {
    setActing(p.id)
    try {
      // Update payment status
      await updateDoc(doc(db,'payments',p.id), {
        status:'approved', reviewedAt:new Date().toISOString(), reviewedBy: user?.uid,
      })
      // Upgrade user plan
      await updateDoc(doc(db,'users',p.uid), {
        plan: p.plan || 'pro',
        planKey: p.plan || 'pro',
        upgradedAt: new Date().toISOString(),
        isTrialActive: false,
      })
      toast.success('✅ تمت الموافقة وترقية الحساب!')
    } catch(e) { toast.error('فشل: ' + e.message) }
    finally { setActing(null) }
  }

  const reject = async () => {
    if (!rejModal) return
    setActing(rejModal.id)
    try {
      await updateDoc(doc(db,'payments',rejModal.id), {
        status:'rejected',
        rejectReason: reason || 'لم يتم التحقق من الدفع.',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.uid,
      })
      toast.success('تم رفض الطلب')
      setRejModal(null); setReason('')
    } catch(e) { toast.error(e.message) }
    finally { setActing(null) }
  }

  const FILTERS = ['pending','approved','rejected','all']

  return (
    <div>
      <SectionHeader title="💳 المدفوعات" count={payments.length}>
        <div style={{ display:'flex', gap:6 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
              border:'1.5px solid', cursor:'pointer',
              background: filter===f ? G : '#fff',
              color: filter===f ? '#fff' : '#64748b',
              borderColor: filter===f ? G : '#e2e8f0',
            }}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
      </SectionHeader>

      {loading ? <div className="loading-spinner"><div className="spinner"/></div>
        : payments.length===0 ? <Empty msg={`لا توجد طلبات ${filter}`} />
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {payments.map(p => (
              <div key={p.id} style={{
                background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16, padding:16,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{p.businessName || '—'}</div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{p.userEmail || p.uid?.slice(0,8)}</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>
                      {p.plan?.toUpperCase()} · {fm(p.totalAmount)} · {p.method?.toUpperCase()} ·{' '}
                      {p.billing === 'annual' ? '📅 سنوي' : '📆 شهري'}
                    </div>
                    <div style={{ fontSize:11, color:'#cbd5e1', marginTop:2 }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString('ar') : ''}
                    </div>
                  </div>
                  <Badge label={p.status} />
                </div>
                {p.proofNote && (
                  <div style={{
                    fontSize:13, color:'#64748b', background:'#f8fafc',
                    padding:'8px 12px', borderRadius:10, marginBottom:10, fontStyle:'italic',
                  }}>"{p.proofNote}"</div>
                )}
                {p.phoneUsed && (
                  <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>
                    📱 {p.phoneUsed}
                  </div>
                )}
                {p.status === 'pending' && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={() => approve(p)}
                      disabled={acting===p.id}
                      style={{
                        flex:1, padding:'10px 0', borderRadius:12, border:'none',
                        background:G, color:'#fff', fontWeight:700, cursor:'pointer',
                        opacity:acting===p.id ? 0.7 : 1,
                      }}
                    >✅ قبول وترقية</button>
                    <button
                      onClick={() => setRejModal(p)}
                      style={{
                        flex:1, padding:'10px 0', borderRadius:12,
                        border:'1.5px solid #fecaca', background:'#fef2f2',
                        color:'#dc2626', fontWeight:700, cursor:'pointer',
                      }}
                    >❌ رفض</button>
                  </div>
                )}
                {p.status==='rejected' && p.rejectReason && (
                  <div style={{ fontSize:12, color:'#dc2626', marginTop:6 }}>
                    سبب الرفض: {p.rejectReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      {/* Reject modal */}
      {rejModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000,
        }} onClick={e => e.target===e.currentTarget && setRejModal(null)}>
          <div style={{
            background:'#fff', borderRadius:'20px 20px 0 0',
            padding:24, width:'100%', maxWidth:480,
          }}>
            <h3 style={{ fontWeight:700, color:'#dc2626', marginBottom:8 }}>رفض الطلب</h3>
            <p style={{ fontSize:14, color:'#64748b', marginBottom:16 }}>
              {rejModal.businessName} — {fm(rejModal.totalAmount)}
            </p>
            <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>
              سبب الرفض (يُرسَل للمستخدم)
            </label>
            <input
              value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="مثال: لم يتم التحقق من الدفع..."
              style={{
                width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0',
                borderRadius:12, fontSize:14, outline:'none', marginBottom:16,
              }}
            />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setRejModal(null)} style={{
                flex:1, padding:12, borderRadius:12, border:'1.5px solid #e2e8f0',
                background:'#fff', cursor:'pointer', fontWeight:600,
              }}>إلغاء</button>
              <button onClick={reject} disabled={acting===rejModal?.id} style={{
                flex:2, padding:12, borderRadius:12, border:'none',
                background:'#dc2626', color:'#fff', cursor:'pointer', fontWeight:700,
                opacity:acting===rejModal?.id ? 0.7 : 1,
              }}>تأكيد الرفض</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  USERS TAB
// ════════════════════════════════════════════════════════════
function UsersTab() {
  const [users,    setUsers]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [search,   setSearch]  = useState('')
  const [filter,   setFilter]  = useState('all')
  const [modal,    setModal]   = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,'users'), orderBy('createdAt','desc')),
      snap => {
        setUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })))
        setLoading(false)
      }, () => setLoading(false)
    )
    return unsub
  }, [])

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase()
    if (filter==='blocked'  && !u.isBlocked) return false
    if (filter==='paid'     && !['starter','basic','pro'].includes(u.plan) && !u.isBlocked) return false
    if (filter==='free'     && u.plan !== 'free' && !u.isBlocked) return false
    if (filter!=='all' && filter!=='blocked' && u.isBlocked) return false
    return !q || u.email?.toLowerCase().includes(q) || u.businessName?.toLowerCase().includes(q)
  }), [users, search, filter])

  const PLAN_OPTS = ['free','starter','basic','pro']

  const updatePlan = async (uid, plan) => {
    try {
      await updateDoc(doc(db,'users',uid), {
        plan, planKey:plan, upgradedAt:new Date().toISOString(), isTrialActive:false,
      })
      setUsers(p => p.map(u => u.id===uid ? {...u, plan} : u))
      toast.success(`الخطة → ${plan.toUpperCase()}`)
      setModal(null)
    } catch { toast.error('فشل التحديث') }
  }

  const toggleBlock = async (uid, block) => {
    try {
      await updateDoc(doc(db,'users',uid), { isBlocked:block })
      setUsers(p => p.map(u => u.id===uid ? {...u, isBlocked:block} : u))
      toast.success(block ? '🚫 تم الحجب' : '✅ تم رفع الحجب')
      setModal(null)
    } catch { toast.error('فشل الحجب') }
  }

  const FILTER_OPTS = [
    { id:'all',     label:'الكل',      count: users.filter(u=>!u.isBlocked).length },
    { id:'paid',    label:'مدفوع',     count: users.filter(u=>['starter','basic','pro'].includes(u.plan)&&!u.isBlocked).length },
    { id:'free',    label:'مجاني',     count: users.filter(u=>u.plan==='free'&&!u.isBlocked).length },
    { id:'blocked', label:'🚫 محجوب', count: users.filter(u=>u.isBlocked).length },
  ]

  return (
    <div>
      <SectionHeader title="👥 المستخدمون" count={users.length}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 بحث..."
          style={{
            padding:'8px 14px', border:'1.5px solid #e2e8f0', borderRadius:20,
            fontSize:13, outline:'none', width:160,
          }}
        />
      </SectionHeader>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {FILTER_OPTS.map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600,
            border:'1.5px solid', cursor:'pointer',
            background:filter===f.id ? G : '#fff',
            color:filter===f.id ? '#fff' : '#64748b',
            borderColor:filter===f.id ? G : '#e2e8f0',
          }}>{f.label} ({f.count})</button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"/></div>
        : filtered.length===0 ? <Empty msg="لا توجد نتائج" />
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(u => (
              <div key={u.id} style={{
                background:'#fff', border:'1.5px solid #f1f5f9',
                borderRadius:16, padding:'14px 16px',
                display:'flex', alignItems:'center', gap:12,
                opacity: u.isBlocked ? 0.65 : 1,
              }}>
                <div style={{
                  width:42, height:42, borderRadius:'50%',
                  background:u.isBlocked ? '#fef2f2' : '#f0fdf4',
                  color:u.isBlocked ? '#dc2626' : G,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:14, flexShrink:0,
                }}>{initials(u.businessName)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{u.businessName || '—'}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{u.email}</div>
                  <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                    <Badge label={u.plan||'free'} />
                    {u.isBlocked && <Badge label="blocked" />}
                    {u.isTrialActive && <span style={{
                      background:'#eff6ff', color:'#1d4ed8', fontSize:11, fontWeight:700,
                      padding:'3px 10px', borderRadius:20,
                    }}>trial</span>}
                  </div>
                  <div style={{ fontSize:10, color:'#cbd5e1', marginTop:2 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar') : ''}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>setModal({type:'plan',user:u})} style={{
                    background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:10,
                    width:34, height:34, cursor:'pointer', fontSize:14,
                  }}>✏️</button>
                  <button onClick={()=>setModal({type:'block',user:u})} style={{
                    background:u.isBlocked ? '#f0fdf4' : '#fef2f2',
                    color:u.isBlocked ? G : '#dc2626',
                    border:'none', borderRadius:10, width:34, height:34,
                    cursor:'pointer', fontSize:14, fontWeight:700,
                  }}>{u.isBlocked ? '✓' : '🚫'}</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Plan modal */}
      {modal?.type==='plan' && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000,
        }} onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div style={{
            background:'#fff', borderRadius:'20px 20px 0 0',
            padding:24, width:'100%', maxWidth:480,
          }}>
            <h3 style={{ fontWeight:700, marginBottom:6 }}>تغيير الخطة</h3>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>
              {modal.user.businessName} — {modal.user.email}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8, marginBottom:16 }}>
              {PLAN_OPTS.map(p => (
                <button key={p} onClick={()=>updatePlan(modal.user.id, p)} style={{
                  padding:'12px 8px', borderRadius:12, cursor:'pointer',
                  border:`1.5px solid ${modal.user.plan===p ? G : '#e2e8f0'}`,
                  background:modal.user.plan===p ? '#f0fdf4' : '#fff',
                  fontWeight:700, color:modal.user.plan===p ? G : '#374151',
                  textTransform:'capitalize',
                }}>{p}</button>
              ))}
            </div>
            <button onClick={()=>setModal(null)} style={{
              width:'100%', padding:12, borderRadius:12,
              border:'1.5px solid #e2e8f0', background:'#fff',
              cursor:'pointer', fontWeight:600, color:'#64748b',
            }}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Block modal */}
      {modal?.type==='block' && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24,
        }}>
          <div style={{
            background:'#fff', borderRadius:20, padding:24, width:'100%', maxWidth:360,
          }}>
            <p style={{ fontSize:15, fontWeight:600, marginBottom:20, textAlign:'center' }}>
              {modal.user.isBlocked ? 'رفع الحجب عن' : 'حجب'} {modal.user.businessName}؟
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setModal(null)} style={{
                flex:1, padding:12, borderRadius:12,
                border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontWeight:600,
              }}>إلغاء</button>
              <button onClick={()=>toggleBlock(modal.user.id,!modal.user.isBlocked)} style={{
                flex:1, padding:12, borderRadius:12, border:'none',
                background:modal.user.isBlocked ? G : '#dc2626',
                color:'#fff', cursor:'pointer', fontWeight:700,
              }}>{modal.user.isBlocked ? '✅ رفع الحجب' : '🚫 حجب'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  MESSAGES TAB
// ════════════════════════════════════════════════════════════
function MessagesTab() {
  const [messages,  setMessages]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db,'messages'), orderBy('createdAt','desc')),
      snap => {
        setMessages(snap.docs.map(d => ({ id:d.id, ...d.data() })))
        setLoading(false)
      }, () => setLoading(false)
    )
    return unsub
  }, [])

  const markRead = async id => {
    await updateDoc(doc(db,'messages',id), { read:true })
  }

  const toggleExpand = async msg => {
    if (expanded === msg.id) { setExpanded(null); return }
    setExpanded(msg.id)
    if (!msg.read) await markRead(msg.id)
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>

  return (
    <div>
      <SectionHeader title="✉️ الرسائل" count={messages.length} />
      {messages.length===0 ? <Empty msg="لا توجد رسائل بعد" /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16,
                padding:16, cursor:'pointer',
                borderLeft: !msg.read ? `4px solid ${G}` : '1.5px solid #f1f5f9',
              }}
              onClick={() => toggleExpand(msg)}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  {!msg.read && (
                    <span style={{
                      background:G, color:'#fff', fontSize:10, fontWeight:700,
                      padding:'2px 8px', borderRadius:20, marginLeft:6,
                    }}>جديد</span>
                  )}
                  <span style={{ fontWeight:700, fontSize:14 }}>{msg.name || '—'}</span>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                    {msg.phone || msg.email} · {msg.createdAt?.toDate?.()?.toLocaleDateString('ar') || msg.createdAt?.slice?.(0,10) || ''}
                  </div>
                  {msg.subject && (
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:2, fontStyle:'italic' }}>
                      {msg.subject}
                    </div>
                  )}
                </div>
                <span style={{ color:'#94a3b8', fontSize:18 }}>{expanded===msg.id ? '▲' : '▼'}</span>
              </div>
              {expanded===msg.id && (
                <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:12 }}>
                  <p style={{ fontSize:14, color:'#374151', marginBottom:12, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                    {msg.body}
                  </p>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {msg.phone && (
                      <a
                        href={`https://wa.me/${msg.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`مرحباً ${msg.name}، `)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          background:'#22c55e', color:'#fff', borderRadius:10,
                          padding:'8px 16px', fontWeight:700, fontSize:13, textDecoration:'none',
                        }}
                        onClick={e => e.stopPropagation()}
                      >💬 رد عبر واتساب</a>
                    )}
                    {msg.email && (
                      <a
                        href={`mailto:${msg.email}`}
                        style={{
                          background:'#3b82f6', color:'#fff', borderRadius:10,
                          padding:'8px 16px', fontWeight:700, fontSize:13, textDecoration:'none',
                        }}
                        onClick={e => e.stopPropagation()}
                      >📧 رد بالبريد</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  SETTINGS TAB  (Payment Numbers + CMS)
// ════════════════════════════════════════════════════════════
const PAGES_CONFIG = [
  { slug:'about',   title:'من نحن',        icon:'🏢' },
  { slug:'vision',  title:'رؤيتنا',         icon:'🎯' },
  { slug:'privacy', title:'سياسة الخصوصية', icon:'🔒' },
  { slug:'terms',   title:'الشروط والأحكام', icon:'📋' },
]

const DEFAULT_PAYMENT = {
  manual: '+252 61 000 0000',
  evc:    '252610000000',
  zaad:   '252630000000',
  sahal:  '252680000000',
  bankName:    '',
  bankAccount: '',
  bankHolder:  '',
  whatsappAdmin: '+252 61 000 0000',
}

function PaymentSettingsPanel() {
  const [nums, setNums]   = useState(DEFAULT_PAYMENT)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db,'settings','payment'), snap => {
      if (snap.exists()) setNums({ ...DEFAULT_PAYMENT, ...snap.data() })
      setLoaded(true)
    }, () => setLoaded(true))
    return unsub
  }, [])

  const inp = {
    width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:12,
    fontSize:14, outline:'none', fontFamily:'inherit', color:'#1e293b', background:'#fff',
  }

  const save = async () => {
    setSaving(true)
    try {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(doc(db,'settings','payment'), { ...nums, updatedAt: new Date().toISOString() })
      toast.success('✅ تم حفظ أرقام الدفع!')
    } catch(e) { toast.error('فشل الحفظ: '+e.message) }
    finally { setSaving(false) }
  }

  if (!loaded) return <div className="loading-spinner"><div className="spinner"/></div>

  const Field = ({ label, field, placeholder }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6, color:'#374151' }}>{label}</label>
      <input style={inp} value={nums[field]||''} onChange={e=>setNums(p=>({...p,[field]:e.target.value}))} placeholder={placeholder} />
    </div>
  )

  return (
    <div>
      <div style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', borderRadius:12, padding:'12px 14px', marginBottom:20, fontSize:13, color:'#1d4ed8' }}>
        💡 هذه الأرقام تظهر للعملاء عند الاشتراك — تأكد من صحتها قبل الحفظ.
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16, padding:20, marginBottom:16 }}>
        <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#0f172a' }}>💬 واتساب الإدارة (يدوي)</h3>
        <Field label="رقم واتساب الإدارة" field="manual" placeholder="+252 61 000 0000" />
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16, padding:20, marginBottom:16 }}>
        <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#0f172a' }}>📱 الدفع الإلكتروني المحلي</h3>
        <Field label="EVC Plus (Hormuud)" field="evc"  placeholder="252610000000" />
        <Field label="Zaad (Telesom)"     field="zaad" placeholder="252630000000" />
        <Field label="Sahal (Somtel)"     field="sahal" placeholder="252680000000" />
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16, padding:20, marginBottom:16 }}>
        <h3 style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#0f172a' }}>🏦 تحويل بنكي / حوالة (اختياري)</h3>
        <Field label="اسم البنك أو شركة الحوالة" field="bankName"    placeholder="مثال: Salaam Bank, Dahabshiil" />
        <Field label="رقم الحساب / رقم المستلم"   field="bankAccount" placeholder="1234-5678-xxxx" />
        <Field label="اسم صاحب الحساب"            field="bankHolder"  placeholder="محمد أحمد" />
      </div>
      <button onClick={save} disabled={saving} style={{
        width:'100%', padding:'14px 0', borderRadius:12, border:'none',
        background:G, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
        opacity:saving ? 0.7 : 1,
      }}>
        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ أرقام الدفع'}
      </button>
    </div>
  )
}

function ContentPanel() {
  const [activePage, setActivePage] = useState('about')
  const [contents, setContents] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsubs = PAGES_CONFIG.map(p => {
      return onSnapshot(doc(db,'pages',p.slug), snap => {
        if (snap.exists()) {
          setContents(prev => ({ ...prev, [p.slug]: snap.data() }))
        } else {
          setContents(prev => ({ ...prev, [p.slug]: { title:'', body:'' } }))
        }
      })
    })
    return () => unsubs.forEach(u => u())
  }, [])

  const cur = contents[activePage] || { title:'', body:'' }
  const setField = (field, val) => setContents(prev => ({ ...prev, [activePage]: { ...prev[activePage], [field]: val } }))

  const save = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db,'pages',activePage), { ...cur, updatedAt: new Date().toISOString() })
        .catch(async () => {
          const { setDoc } = await import('firebase/firestore')
          await setDoc(doc(db,'pages',activePage), { ...cur, slug:activePage, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() })
        })
      toast.success('✅ تم الحفظ!')
    } catch(e) { toast.error('فشل الحفظ: '+e.message) }
    finally { setSaving(false) }
  }

  const inp = { width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', color:'#1e293b', background:'#fff' }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {PAGES_CONFIG.map(p => (
          <button key={p.slug} onClick={()=>setActivePage(p.slug)} style={{
            padding:'8px 16px', borderRadius:12, fontSize:13, fontWeight:600, border:'1.5px solid', cursor:'pointer',
            background:activePage===p.slug ? G : '#fff', color:activePage===p.slug ? '#fff' : '#64748b', borderColor:activePage===p.slug ? G : '#e2e8f0',
          }}>{p.icon} {p.title}</button>
        ))}
      </div>
      <div style={{ background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:16, padding:20 }}>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>عنوان الصفحة</label>
          <input style={inp} value={cur.title||''} onChange={e=>setField('title',e.target.value)} placeholder="عنوان الصفحة..." />
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>محتوى الصفحة</label>
          <textarea style={{ ...inp, minHeight:220, resize:'vertical', lineHeight:1.7 }} value={cur.body||''} onChange={e=>setField('body',e.target.value)} placeholder="اكتب محتوى الصفحة هنا..." />
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>معلومات إضافية</label>
          <input style={inp} value={cur.extra||''} onChange={e=>setField('extra',e.target.value)} placeholder="رقم هاتف، بريد إلكتروني، عنوان..." />
        </div>
        <button onClick={save} disabled={saving} style={{ width:'100%', padding:'14px 0', borderRadius:12, border:'none', background:G, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', opacity:saving?0.7:1 }}>
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
        </button>
        <div style={{ textAlign:'center', marginTop:12 }}>
          <a href={`/${activePage}`} target="_blank" style={{ fontSize:12, color:'#64748b', textDecoration:'none' }}>👁️ معاينة الصفحة →</a>
        </div>
      </div>
    </div>
  )
}

function AdminSettingsTab() {
  const [panel, setPanel] = useState('payment')
  const PANELS = [
    { id:'payment', label:'💳 أرقام الدفع' },
    { id:'content', label:'📝 محتوى الصفحات' },
  ]
  return (
    <div>
      <SectionHeader title="⚙️ الإعدادات" />
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {PANELS.map(p => (
          <button key={p.id} onClick={()=>setPanel(p.id)} style={{
            padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700, border:'1.5px solid', cursor:'pointer',
            background:panel===p.id ? G : '#fff', color:panel===p.id ? '#fff' : '#64748b', borderColor:panel===p.id ? G : '#e2e8f0',
          }}>{p.label}</button>
        ))}
      </div>
      {panel === 'payment' ? <PaymentSettingsPanel /> : <ContentPanel />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  MAIN ADMIN PAGE (router)
// ════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/app" replace />

  return (
    <Routes>
      <Route index              element={<StatsTab />} />
      <Route path="payments"   element={<PaymentsTab />} />
      <Route path="users"      element={<UsersTab />} />
      <Route path="messages"   element={<MessagesTab />} />
      <Route path="settings"   element={<AdminSettingsTab />} />
      {/* legacy redirect */}
      <Route path="content"    element={<AdminSettingsTab />} />
    </Routes>
  )
}
