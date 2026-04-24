// PaymentPage.jsx — Firestore-based payment flow
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { collection, addDoc, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const G = '#16a34a'
const fm = n => `$${Number(n||0).toFixed(2)}`

const PLANS = [
  {
    id:'starter', name:'Starter', price:9, annualPrice:6.3,
    icon:'⚡', color:'#1d4ed8',
    features:['مبيعات غير محدودة','تقارير أساسية','تتبع المصروفات','1 مستخدم · 1 فرع'],
  },
  {
    id:'basic', name:'Basic', price:19, annualPrice:13.3,
    icon:'◆', color:'#7c3aed',
    features:['كل مميزات Starter','تقارير متقدمة','3 مستخدمين · 3 فروع','أولوية الدعم'],
    popular: true,
  },
  {
    id:'pro', name:'Pro', price:39, annualPrice:27.3,
    icon:'✦', color:G,
    features:['كل مميزات Basic','7 مستخدمين · 7 فروع','تصدير Excel/PDF','مدير حساب مخصص'],
  },
]

const METHODS = [
  { id:'manual', label:'WhatsApp يدوي',   sublabel:'أرسل المال ← أرسل لقطة للإدارة', icon:'💬', accent:'#25D366' },
  { id:'evc',    label:'EVC Plus',         sublabel:'Hormuud · اتصل *712#',            icon:'📱', accent:'#e7131a' },
  { id:'zaad',   label:'Zaad',             sublabel:'Telesom · اتصل *880#',             icon:'💳', accent:'#0066cc' },
  { id:'sahal',  label:'Sahal',            sublabel:'Somtel · اتصل *567#',              icon:'💳', accent:'#ff6b00' },
]

// Fallback numbers (overridden by Firestore settings/payment)
const DEFAULT_PAYMENT_NUMBERS = {
  manual: { label:'واتساب الإدارة',    number:'+252 61 000 0000' },
  evc:    { label:'رقم EVC Plus',      number:'252610000000'     },
  zaad:   { label:'رقم Zaad',          number:'252630000000'     },
  sahal:  { label:'رقم Sahal',         number:'252680000000'     },
}

const STEPS_HOW = {
  manual: ['أرسل المبلغ المحدد بالضبط إلى رقم واتساب الإدارة.','خذ لقطة شاشة للمعاملة.','أرسل اللقطة لنفس الرقم.','ستتم الترقية خلال ساعتين.'],
  evc:    ['افتح EVC Plus أو اتصل *712# على شريحة Hormuud.','اختر "إرسال المال" وأدخل الرقم أعلاه.','أدخل المبلغ بالضبط.','احتفظ بمعرف المعاملة وأدخله أدناه.'],
  zaad:   ['افتح Zaad أو اتصل *880# على شريحة Telesom.','اختر "إرسال المال" وأدخل الرقم أعلاه.','أدخل المبلغ بالضبط.','احتفظ بمعرف المعاملة وأدخله أدناه.'],
  sahal:  ['افتح Sahal أو اتصل *567# على شريحة Somtel.','اختر "دفع" وأدخل رمز التاجر.','أدخل المبلغ وأكّد الدفع.','احتفظ برمز التأكيد وأدخله أدناه.'],
}

const inp = {
  width:'100%', padding:'12px 14px', border:'1.5px solid #e2e8f0', borderRadius:12,
  fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit', color:'#1e293b',
}

export default function PaymentPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step,           setStep]           = useState(1)
  const [plan,           setPlan]           = useState(searchParams.get('plan') || 'pro')
  const [billing,        setBilling]        = useState('monthly')
  const [method,         setMethod]         = useState('manual')
  const [phoneUsed,      setPhoneUsed]      = useState('')
  const [proofNote,      setProofNote]      = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [myPayments,     setMyPayments]     = useState([])
  const [paymentNumbers, setPaymentNumbers] = useState(DEFAULT_PAYMENT_NUMBERS)

  // Load admin-configured payment numbers from Firestore
  useEffect(() => {
    getDoc(doc(db, 'settings', 'payment')).then(snap => {
      if (!snap.exists()) return
      const d = snap.data()
      setPaymentNumbers({
        manual: { label:'واتساب الإدارة', number: d.manual || DEFAULT_PAYMENT_NUMBERS.manual.number },
        evc:    { label:'رقم EVC Plus',    number: d.evc    || DEFAULT_PAYMENT_NUMBERS.evc.number    },
        zaad:   { label:'رقم Zaad',        number: d.zaad   || DEFAULT_PAYMENT_NUMBERS.zaad.number   },
        sahal:  { label:'رقم Sahal',       number: d.sahal  || DEFAULT_PAYMENT_NUMBERS.sahal.number  },
      })
    }).catch(() => {/* use defaults */})
  }, [])

  const selPlan = PLANS.find(p => p.id === plan) || PLANS[2]
  const monthlyPrice = billing === 'annual' ? selPlan.annualPrice : selPlan.price
  const totalMonthly = monthlyPrice
  const totalAnnual  = billing === 'annual' ? +(monthlyPrice * 12).toFixed(2) : null

  // Load existing payments
  useEffect(() => {
    if (!user) return
    const q = query(collection(db,'payments'), where('uid','==',user.uid))
    return onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      docs.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
      setMyPayments(docs)
    })
  }, [user])

  const hasPending = myPayments.some(p => p.status === 'pending')

  const submit = async () => {
    if (!phoneUsed.trim()) return toast.error('أدخل رقم الهاتف المستخدم')
    if (!proofNote.trim()) return toast.error('أدخل رمز المعاملة أو ملاحظة الإثبات')
    if (hasPending) return toast.error('لديك طلب معلق بالفعل')
    setSubmitting(true)
    try {
      const amount = billing === 'annual' ? totalAnnual : totalMonthly
      await addDoc(collection(db,'payments'), {
        uid: user.uid,
        userEmail: user.email,
        businessName: profile?.businessName || '',
        plan,
        billing,
        totalAmount: amount,
        method,
        phoneUsed,
        proofNote,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        rejectReason: null,
      })
      toast.success('✅ تم إرسال الطلب! سنراجعه خلال ساعتين.')
      setStep(4)
    } catch(e) { toast.error('فشل الإرسال: '+e.message) }
    finally { setSubmitting(false) }
  }

  const STATUS_STYLE = {
    pending:  { bg:'#fffbeb', color:'#92400e', icon:'⏳' },
    approved: { bg:'#f0fdf4', color:'#166534', icon:'✅' },
    rejected: { bg:'#fef2f2', color:'#991b1b', icon:'❌' },
  }

  // ── Step 4: Status ─────────────────────────────────────────
  if (step === 4 || myPayments.length > 0) {
    const latest = myPayments[0]
    return (
      <div>
        <h2 style={{ fontWeight:800, fontSize:18, marginBottom:20 }}>حالة الاشتراك</h2>
        {myPayments.map(p => {
          const s = STATUS_STYLE[p.status] || STATUS_STYLE.pending
          return (
            <div key={p.id} style={{
              background:s.bg, border:`1.5px solid ${s.bg}`, borderRadius:16, padding:16, marginBottom:12,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontWeight:700 }}>{s.icon} {p.plan?.toUpperCase()} — ${p.totalAmount}</div>
                <span style={{
                  background:'#fff', color:s.color, fontSize:11, fontWeight:700,
                  padding:'3px 10px', borderRadius:20,
                }}>{p.status}</span>
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>
                {p.method?.toUpperCase()} · {p.billing === 'annual' ? 'سنوي' : 'شهري'} · {p.createdAt?.slice(0,10)}
              </div>
              {p.proofNote && <div style={{ fontSize:12, color:'#64748b', marginTop:4, fontStyle:'italic' }}>"{p.proofNote}"</div>}
              {p.status==='rejected' && p.rejectReason && (
                <div style={{ fontSize:13, color:'#dc2626', marginTop:8, fontWeight:600 }}>
                  سبب الرفض: {p.rejectReason}
                </div>
              )}
            </div>
          )
        })}
        {!hasPending && (
          <button onClick={() => { setStep(1); }} style={{
            width:'100%', marginTop:8, padding:'13px 0', borderRadius:12,
            border:`1.5px solid ${G}`, background:'#f0fdf4', color:G,
            fontWeight:700, cursor:'pointer', fontSize:15,
          }}>+ طلب اشتراك جديد</button>
        )}
        <button onClick={() => navigate('/app')} style={{
          width:'100%', marginTop:8, padding:'13px 0', borderRadius:12,
          border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b',
          fontWeight:600, cursor:'pointer',
        }}>← العودة للتطبيق</button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>الترقية والاشتراك</h2>
      <p style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>اختر الخطة المناسبة لنشاطك التجاري</p>

      {/* ── STEP INDICATOR ─────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:28 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background: step>n ? G : step===n ? G : '#e2e8f0',
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:12,
            }}>{step>n ? '✓' : n}</div>
            {n<3 && <div style={{ width:24, height:2, background:step>n?G:'#e2e8f0' }}/>}
          </div>
        ))}
        <span style={{ marginRight:8, fontSize:12, color:'#94a3b8' }}>
          {step===1?'اختر الخطة':step===2?'طريقة الدفع':'أكد الدفع'}
        </span>
      </div>

      {/* ── STEP 1: Plan ───────────────────────────────── */}
      {step === 1 && (
        <div>
          {/* Billing toggle */}
          <div style={{
            display:'flex', background:'#f8fafc', borderRadius:14,
            padding:4, marginBottom:24, gap:4,
          }}>
            {['monthly','annual'].map(b => (
              <button key={b} onClick={()=>setBilling(b)} style={{
                flex:1, padding:'10px 0', borderRadius:10, border:'none',
                background:billing===b ? '#fff' : 'transparent',
                fontWeight:700, fontSize:13, cursor:'pointer',
                color:billing===b ? '#0f172a' : '#94a3b8',
                boxShadow:billing===b ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
                {b==='monthly' ? '📆 شهري' : '📅 سنوي'}
                {b==='annual' && <span style={{
                  background:'#dcfce7', color:'#15803d', fontSize:10, fontWeight:700,
                  padding:'2px 6px', borderRadius:20, marginRight:6,
                }}>وفّر 30%</span>}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          {PLANS.map(p => (
            <div
              key={p.id}
              onClick={() => setPlan(p.id)}
              style={{
                background:'#fff', borderRadius:16, padding:18, marginBottom:12,
                border:`2px solid ${plan===p.id ? p.color : '#f1f5f9'}`,
                cursor:'pointer', position:'relative',
                boxShadow: plan===p.id ? `0 0 0 3px ${p.color}22` : 'none',
              }}
            >
              {p.popular && (
                <span style={{
                  position:'absolute', top:-10, right:16,
                  background:p.color, color:'#fff', fontSize:10, fontWeight:700,
                  padding:'3px 12px', borderRadius:20,
                }}>الأكثر شيوعاً</span>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:20 }}>{p.icon}</span>
                  <span style={{ fontWeight:800, fontSize:16, color:p.color }}>{p.name}</span>
                </div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'#0f172a' }}>
                    ${billing==='annual' ? p.annualPrice : p.price}
                    <span style={{ fontSize:12, fontWeight:400, color:'#94a3b8' }}>/شهر</span>
                  </div>
                  {billing==='annual' && (
                    <div style={{ fontSize:11, color:'#64748b' }}>
                      ${+(p.annualPrice*12).toFixed(0)}/سنة · <s style={{ color:'#94a3b8' }}>${p.price*12}</s>
                    </div>
                  )}
                </div>
              </div>
              <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                {p.features.map((f,i) => (
                  <li key={i} style={{ fontSize:12, color:'#64748b', marginBottom:3 }}>
                    ✓ {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button onClick={()=>setStep(2)} style={{
            width:'100%', padding:'14px 0', borderRadius:12, border:'none',
            background:G, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
            marginTop:8,
          }}>التالي: طريقة الدفع →</button>
        </div>
      )}

      {/* ── STEP 2: Method ─────────────────────────────── */}
      {step === 2 && (
        <div>
          {/* Summary */}
          <div style={{
            background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:12,
            padding:'12px 14px', marginBottom:20,
          }}>
            <div style={{ fontSize:12, color:'#64748b' }}>الخطة المختارة</div>
            <div style={{ fontWeight:800, fontSize:16, color:G }}>
              {selPlan.name} — ${monthlyPrice}/شهر
              {billing==='annual' && ` · ${fm(totalAnnual)}/سنة`}
            </div>
          </div>

          {METHODS.map(m => (
            <div
              key={m.id}
              onClick={() => setMethod(m.id)}
              style={{
                background:'#fff', borderRadius:14, padding:16, marginBottom:10,
                border:`2px solid ${method===m.id ? m.accent : '#f1f5f9'}`,
                cursor:'pointer', display:'flex', alignItems:'center', gap:14,
              }}
            >
              <span style={{ fontSize:28 }}>{m.icon}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{m.label}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{m.sublabel}</div>
              </div>
              <div style={{ marginRight:'auto' }}>
                <div style={{
                  width:20, height:20, borderRadius:'50%',
                  border:`2px solid ${method===m.id ? m.accent : '#cbd5e1'}`,
                  background:method===m.id ? m.accent : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {method===m.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
                </div>
              </div>
            </div>
          ))}

          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={()=>setStep(1)} style={{
              flex:1, padding:'13px 0', borderRadius:12, border:'1.5px solid #e2e8f0',
              background:'#fff', cursor:'pointer', fontWeight:600, color:'#64748b',
            }}>← السابق</button>
            <button onClick={()=>setStep(3)} style={{
              flex:2, padding:'13px 0', borderRadius:12, border:'none',
              background:G, color:'#fff', fontWeight:700, cursor:'pointer',
            }}>التالي: تأكيد الدفع →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Proof ──────────────────────────────── */}
      {step === 3 && (
        <div>
          {/* Payment info box */}
          <div style={{
            background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:14,
            padding:16, marginBottom:20,
          }}>
            <div style={{ fontWeight:700, fontSize:13, color:'#92400e', marginBottom:8 }}>
              📋 تعليمات الدفع
            </div>
            {STEPS_HOW[method].map((s,i) => (
              <div key={i} style={{ fontSize:13, color:'#78350f', marginBottom:6, display:'flex', gap:8 }}>
                <span style={{
                  width:20, height:20, borderRadius:'50%', background:'#f59e0b',
                  color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, flexShrink:0,
                }}>{i+1}</span>
                <span>{s}</span>
              </div>
            ))}
            <div style={{
              marginTop:12, background:'#fff', borderRadius:10, padding:'10px 14px',
              fontWeight:700, fontSize:15, color:'#0f172a',
            }}>
              {paymentNumbers[method].label}:{' '}
              <span style={{ fontFamily:'monospace', color:G }}>
                {paymentNumbers[method].number}
              </span>
            </div>
            <div style={{
              marginTop:8, fontWeight:800, fontSize:18, color:'#0f172a', textAlign:'center',
            }}>
              المبلغ: <span style={{ color:G }}>
                ${billing==='annual' ? totalAnnual : totalMonthly}
              </span>
              {billing==='annual' && <span style={{ fontSize:12, color:'#64748b', display:'block' }}>(مدفوع سنوياً)</span>}
            </div>
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>
              رقم الهاتف الذي دفعت منه *
            </label>
            <input
              style={inp} value={phoneUsed} onChange={e=>setPhoneUsed(e.target.value)}
              placeholder="+252 61 000 0000"
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>
              رمز المعاملة أو ملاحظة الإثبات *
            </label>
            <input
              style={inp} value={proofNote} onChange={e=>setProofNote(e.target.value)}
              placeholder="مثال: #TX123456 أو رسالة تأكيد Zaad"
            />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setStep(2)} style={{
              flex:1, padding:'13px 0', borderRadius:12, border:'1.5px solid #e2e8f0',
              background:'#fff', cursor:'pointer', fontWeight:600, color:'#64748b',
            }}>← السابق</button>
            <button onClick={submit} disabled={submitting} style={{
              flex:2, padding:'13px 0', borderRadius:12, border:'none',
              background:G, color:'#fff', fontWeight:700, cursor:'pointer',
              opacity:submitting ? 0.7 : 1,
            }}>
              {submitting ? '⏳ جاري الإرسال...' : '✅ إرسال طلب الاشتراك'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
