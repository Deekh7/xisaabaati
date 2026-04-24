import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc, getDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'
const GL = '#f0fdf4'

const PLAN_COLORS = { free:'#6b7280', starter:'#1d4ed8', basic:'#7c3aed', pro:'#10b981' }

// Plan limits: users and branches
const PLAN_LIMITS = {
  free:    { users:1, branches:1 },
  starter: { users:1, branches:1 },
  basic:   { users:3, branches:3 },
  pro:     { users:7, branches:7 },
}

// ── Team Management Section ──────────────────────────────────
function TeamSection({ plan, user }) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const [members, setMembers]   = useState([])
  const [branches, setBranches] = useState([])
  const [inviteEmail, setInviteEmail]   = useState('')
  const [branchName,  setBranchName]    = useState('')
  const [addingMember,  setAddingMember]  = useState(false)
  const [addingBranch,  setAddingBranch]  = useState(false)
  const [showInvite,  setShowInvite]  = useState(false)
  const [showBranch,  setShowBranch]  = useState(false)

  const teamsRef   = collection(db, 'users', user.uid, 'members')
  const branchRef  = collection(db, 'users', user.uid, 'branches')

  useEffect(() => {
    const u1 = onSnapshot(teamsRef,   snap => setMembers(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u2 = onSnapshot(branchRef, snap => setBranches(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2() }
  }, [user.uid])

  const addMember = async () => {
    if (!inviteEmail.trim()) return toast.error('أدخل البريد الإلكتروني')
    if (members.length >= limits.users - 1) return toast.error(`الباقة تسمح بـ ${limits.users} مستخدم فقط`)
    setAddingMember(true)
    try {
      await addDoc(teamsRef, {
        email: inviteEmail.trim().toLowerCase(),
        role: 'cashier',
        status: 'invited',
        invitedAt: new Date().toISOString(),
      })
      toast.success('✅ تمت الدعوة!')
      setInviteEmail(''); setShowInvite(false)
    } catch(e) { toast.error(e.message) }
    finally { setAddingMember(false) }
  }

  const addBranch = async () => {
    if (!branchName.trim()) return toast.error('أدخل اسم الفرع')
    if (branches.length >= limits.branches - 1) return toast.error(`الباقة تسمح بـ ${limits.branches} فرع فقط`)
    setAddingBranch(true)
    try {
      await addDoc(branchRef, {
        name: branchName.trim(),
        createdAt: new Date().toISOString(),
        active: true,
      })
      toast.success('✅ تمت إضافة الفرع!')
      setBranchName(''); setShowBranch(false)
    } catch(e) { toast.error(e.message) }
    finally { setAddingBranch(false) }
  }

  const removeMember = async (id) => {
    try { await deleteDoc(doc(db,'users',user.uid,'members',id)); toast.success('تم الحذف') }
    catch(e) { toast.error(e.message) }
  }

  const removeBranch = async (id) => {
    try { await deleteDoc(doc(db,'users',user.uid,'branches',id)); toast.success('تم الحذف') }
    catch(e) { toast.error(e.message) }
  }

  const inp = {
    width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:12,
    fontSize:14, outline:'none', fontFamily:'inherit', color:'#1e293b', background:'#fff',
  }

  const usersUsed    = members.length + 1  // +1 for owner
  const branchesUsed = branches.length + 1 // +1 for main branch

  return (
    <div className="settings-section">
      <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>👥 إدارة الفريق والفروع</div>

      {/* Usage bars */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <div style={{ background:'#f8fafc', borderRadius:12, padding:'10px 12px', border:'1.5px solid #e2e8f0' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>المستخدمون</div>
          <div style={{ fontWeight:800, fontSize:18, color:usersUsed>=limits.users?'#dc2626':G }}>{usersUsed}</div>
          <div style={{ fontSize:11, color:'#64748b' }}>من {limits.users}</div>
          <div style={{ height:4, background:'#e2e8f0', borderRadius:4, marginTop:6 }}>
            <div style={{ height:4, borderRadius:4, background:usersUsed>=limits.users?'#dc2626':G, width:`${Math.min((usersUsed/limits.users)*100,100)}%` }}/>
          </div>
        </div>
        <div style={{ background:'#f8fafc', borderRadius:12, padding:'10px 12px', border:'1.5px solid #e2e8f0' }}>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>الفروع</div>
          <div style={{ fontWeight:800, fontSize:18, color:branchesUsed>=limits.branches?'#dc2626':G }}>{branchesUsed}</div>
          <div style={{ fontSize:11, color:'#64748b' }}>من {limits.branches}</div>
          <div style={{ height:4, background:'#e2e8f0', borderRadius:4, marginTop:6 }}>
            <div style={{ height:4, borderRadius:4, background:branchesUsed>=limits.branches?'#dc2626':G, width:`${Math.min((branchesUsed/limits.branches)*100,100)}%` }}/>
          </div>
        </div>
      </div>

      {/* Add-ons hint */}
      {(usersUsed >= limits.users || branchesUsed >= limits.branches) && (
        <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:10, padding:'10px 12px', fontSize:12, color:'#92400e', marginBottom:14 }}>
          💡 وصلت للحد الأقصى — يمكنك إضافة مستخدم إضافي بـ $3/شهر أو فرع إضافي بـ $5/شهر من صفحة الاشتراك.
        </div>
      )}

      {/* Members list */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>الموظفون / المستخدمون</span>
          <button onClick={()=>setShowInvite(!showInvite)} style={{
            background:GL, color:G, border:'none', borderRadius:10, padding:'6px 12px',
            fontSize:12, fontWeight:700, cursor:'pointer',
          }}>+ دعوة</button>
        </div>

        {/* Owner row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f8fafc', borderRadius:10, marginBottom:6 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:GL, color:G, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
            {(user.email||'').slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>{user.email}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>المالك</div>
          </div>
          <span style={{ background:GL, color:G, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>مالك</span>
        </div>

        {members.map(m => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:10, marginBottom:6 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'#eff6ff', color:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>
              {(m.email||'').slice(0,2).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{m.email}</div>
              <div style={{ fontSize:11, color:m.status==='invited'?'#f59e0b':'#94a3b8' }}>
                {m.status==='invited' ? '⏳ في الانتظار' : m.role}
              </div>
            </div>
            <button onClick={()=>removeMember(m.id)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:16, padding:'4px 8px' }}>×</button>
          </div>
        ))}

        {showInvite && (
          <div style={{ background:'#f8fafc', borderRadius:12, padding:14, border:'1.5px solid #e2e8f0', marginTop:8 }}>
            <input style={inp} value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="البريد الإلكتروني للموظف..." />
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button onClick={()=>setShowInvite(false)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>إلغاء</button>
              <button onClick={addMember} disabled={addingMember} style={{ flex:2, padding:'10px 0', borderRadius:10, border:'none', background:G, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:addingMember?0.7:1 }}>
                {addingMember ? '...' : '✅ إرسال الدعوة'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Branches list */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>الفروع</span>
          <button onClick={()=>setShowBranch(!showBranch)} style={{ background:GL, color:G, border:'none', borderRadius:10, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ إضافة فرع</button>
        </div>

        {/* Main branch */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f8fafc', borderRadius:10, marginBottom:6 }}>
          <span style={{ fontSize:18 }}>🏪</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700 }}>الفرع الرئيسي</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>افتراضي</div>
          </div>
          <span style={{ background:GL, color:G, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>رئيسي</span>
        </div>

        {branches.map(b => (
          <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:10, marginBottom:6 }}>
            <span style={{ fontSize:18 }}>🏬</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{b.name}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{b.createdAt?.slice(0,10)}</div>
            </div>
            <button onClick={()=>removeBranch(b.id)} style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:16, padding:'4px 8px' }}>×</button>
          </div>
        ))}

        {showBranch && (
          <div style={{ background:'#f8fafc', borderRadius:12, padding:14, border:'1.5px solid #e2e8f0', marginTop:8 }}>
            <input style={inp} value={branchName} onChange={e=>setBranchName(e.target.value)} placeholder="اسم الفرع الجديد..." />
            <div style={{ display:'flex', gap:8, marginTop:10 }}>
              <button onClick={()=>setShowBranch(false)} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#64748b' }}>إلغاء</button>
              <button onClick={addBranch} disabled={addingBranch} style={{ flex:2, padding:'10px 0', borderRadius:10, border:'none', background:G, color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, opacity:addingBranch?0.7:1 }}>
                {addingBranch ? '...' : '✅ إضافة الفرع'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main SettingsPage ────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, profile, logout, isAdmin } = useAuth()
  const { effectivePlan, isTrialActive, trialDaysLeft } = useSubscription()
  const { t, lang, changeLang } = useLang()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      toast.error(t('error'))
    }
  }

  const initials = (profile?.displayName || profile?.businessName || user?.email || 'U')
    .slice(0, 2).toUpperCase()

  const planColor = PLAN_COLORS[effectivePlan] || G
  const limits    = PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: 18 }}>{t('settings')}</h2>

      {/* Profile card */}
      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: GL, color: G, fontWeight: 700, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {profile?.displayName || profile?.businessName || '—'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
            {profile?.businessType && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                {profile?.businessName} · {t(profile.businessType)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan card */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{t('currentPlan')}</span>
          <span className="badge" style={{ background: planColor + '18', color: planColor }}>
            {t(effectivePlan) || effectivePlan}
          </span>
        </div>

        {/* Plan limits */}
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'8px 10px', fontSize:12, color:'#64748b', textAlign:'center' }}>
            👥 <b style={{ color:'#1e293b' }}>{limits.users}</b> مستخدم
          </div>
          <div style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'8px 10px', fontSize:12, color:'#64748b', textAlign:'center' }}>
            🏪 <b style={{ color:'#1e293b' }}>{limits.branches}</b> فرع
          </div>
        </div>

        {isTrialActive && (
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            🎉 {trialDaysLeft} {t('trialDaysLeft')}
          </div>
        )}

        <button
          onClick={() => navigate('/app/payment')}
          style={{
            width: '100%', background: G, color: '#fff',
            border: 'none', borderRadius: 12, padding: '12px 0',
            fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}
        >
          {t('upgradeNow')}
        </button>

        {/* Add-ons */}
        <div style={{ marginTop:10, display:'flex', gap:8 }}>
          <div style={{ flex:1, textAlign:'center', fontSize:11, color:'#64748b', background:'#f8fafc', borderRadius:8, padding:'6px 8px' }}>
            +مستخدم <b>$3</b>/شهر
          </div>
          <div style={{ flex:1, textAlign:'center', fontSize:11, color:'#64748b', background:'#f8fafc', borderRadius:8, padding:'6px 8px' }}>
            +فرع <b>$5</b>/شهر
          </div>
        </div>
      </div>

      {/* Team Management */}
      {!isAdmin && <TeamSection plan={effectivePlan} user={user} />}

      {/* Language */}
      <div className="settings-section">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
          Language / Luqadda / اللغة
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.keys(languageFlags).map((k) => (
            <button
              key={k}
              onClick={() => changeLang(k)}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12,
                border: `2px solid ${lang === k ? G : '#e2e8f0'}`,
                background: lang === k ? GL : '#fff',
                color: lang === k ? G : '#64748b',
                fontWeight: 700, cursor: 'pointer', fontSize: 14,
              }}
            >
              {languageFlags[k]} {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="settings-section">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#374151' }}>
          More
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => navigate('/app/customers')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', background: '#f8fafc', color: '#374151',
              border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
              fontWeight: 600, cursor: 'pointer', fontSize: 14, textAlign: 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {t('customers')}
          </button>
          <button
            onClick={() => navigate('/app/reports')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', background: '#f8fafc', color: '#374151',
              border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
              fontWeight: 600, cursor: 'pointer', fontSize: 14, textAlign: 'left',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            {t('reports')}
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/app/admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', background: '#fef3c7', color: '#92400e',
                border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 14px',
                fontWeight: 700, cursor: 'pointer', fontSize: 14, textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 16 }}>⚡</span>
              {t('admin')}
            </button>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', background: '#fee2e2', color: '#dc2626',
          border: 'none', borderRadius: 14, padding: '13px 0',
          fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4,
        }}
      >
        🚪 {t('logout')}
      </button>
    </div>
  )
}
