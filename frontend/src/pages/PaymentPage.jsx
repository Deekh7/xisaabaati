// PaymentPage.jsx — 4-step payment flow for Somalia market
// Step 1: Choose plan + extra users
// Step 2: Choose method (Manual/EVC/Zaad/Sahal)
// Step 3: Instructions + submit proof
// Step 4: Status tracking
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth }         from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import toast from 'react-hot-toast'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/* ── Config ───────────────────────────────── */
const PLANS = [
  { id:'basic', name:'Basic', price:12, desc:'Unlimited invoices · 1 user',       icon:'◆', color:'#1d4ed8' },
  { id:'pro',   name:'Pro',   price:25, desc:'Reports · Multi-user · Everything', icon:'✦', color:'#15803d' },
]

const METHODS = [
  { id:'manual', label:'Manual (WhatsApp)', sublabel:'Send money → screenshot to admin', icon:'💬', accent:'#25D366' },
  { id:'evc',    label:'EVC Plus',          sublabel:'Hormuud · Dial *712#',              icon:'📱', accent:'#e7131a' },
  { id:'zaad',   label:'Zaad',              sublabel:'Telesom · Dial *880#',               icon:'💳', accent:'#0066cc' },
  { id:'sahal',  label:'Sahal',             sublabel:'Somtel · Dial *567#',                icon:'💳', accent:'#ff6b00' },
]

// Replace with real numbers before deploy
const PAYMENT_NUMBERS = {
  manual: { label:'Admin WhatsApp',   number:'+252 61 000 0000' },
  evc:    { label:'EVC Plus Merchant',number:'252610000000'     },
  zaad:   { label:'Zaad Number',      number:'252630000000'     },
  sahal:  { label:'Sahal Merchant',   number:'252680000000'     },
}

const STEPS_HOW = {
  manual: [
    'Send the exact amount shown above to the admin WhatsApp number.',
    'Take a screenshot of your transaction or write the exact amount and time.',
    'Send the screenshot to the same WhatsApp number.',
    'Admin will verify and upgrade your plan within 2 hours.',
  ],
  evc: [
    'Open your EVC Plus app or dial *712# on your Hormuud SIM.',
    'Choose "Send Money" → enter the merchant number above.',
    'Enter the exact amount. Use your phone number as reference.',
    'Save the transaction ID, enter it below, and click Submit.',
  ],
  zaad: [
    'Open your Zaad app or dial *880# on your Telesom SIM.',
    'Choose "Send Money" → enter the Zaad number above.',
    'Enter the exact amount. The system will generate a reference.',
    'Save the transaction ID, enter it below, and click Submit.',
  ],
  sahal: [
    'Open your Sahal app or dial *567# on your Somtel SIM.',
    'Choose "Pay" → enter the Sahal merchant code above.',
    'Enter the exact amount and confirm the payment.',
    'Save the confirmation code, enter it below, and click Submit.',
  ],
}

const STATUS_STYLE = {
  pending:  { bg:'#fffbeb', color:'#92400e', border:'#fde68a', icon:'⏳' },
  approved: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0', icon:'✅' },
  rejected: { bg:'#fef2f2', color:'#991b1b', border:'#fecaca', icon:'❌' },
}

/* ── Sub-components ──────────────────────── */
function StepDot({ n, active, done }) {
  return (
    <div style={{
      width:32, height:32, borderRadius:'50%', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:700, fontSize:'.8rem', transition:'all .25s',
      background: done ? 'var(--green-dark)' : active ? 'var(--green-light)' : 'var(--paper-3)',
      color: done || active ? '#fff' : 'var(--ink-4)',
    }}>
      {done ? '✓' : n}
    </div>
  )
}

function SummaryBox({ plan, extraUsers, total }) {
  const p = PLANS.find(x => x.id === plan)
  return (
    <div style={{ background:'var(--paper-2)', border:'1.5px solid var(--paper-3)', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', color:'var(--ink-3)', marginBottom: extraUsers > 0 ? 4 : 0 }}>
        <span>{p?.icon} {p?.name} plan</span>
        <span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>${p?.price}/mo</span>
      </div>
      {extraUsers > 0 && plan === 'pro' && (
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', color:'var(--ink-3)', marginBottom:4 }}>
          <span>{extraUsers} extra user{extraUsers > 1 ? 's' : ''}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:600 }}>+${(extraUsers*2.5).toFixed(2)}/mo</span>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'.9rem', borderTop:'1.5px solid var(--paper-3)', paddingTop:8, marginTop:6 }}>
        <span>Total</span>
        <span style={{ fontFamily:'var(--font-mono)', color:'var(--green-dark)' }}>${total.toFixed(2)}/mo</span>
      </div>
    </div>
  )
}

/* ── Main Component ──────────────────────── */
export default function PaymentPage() {
  const { user }               = useAuth()
  const { fetchStatus }        = useSubscription()
  const navigate               = useNavigate()
  const [searchParams]         = useSearchParams()

  // form state
  const [step, setStep]               = useState(1)
  const [plan, setPlan]               = useState(searchParams.get('plan') || 'pro')
  const [extraUsers, setExtraUsers]   = useState(0)
  const [method, setMethod]           = useState('manual')
  const [phoneUsed, setPhoneUsed]     = useState('')
  const [proofNote, setProofNote]     = useState('')
  const [submitting, setSubmitting]   = useState(false)

  // payment history
  const [payments, setPayments]       = useState([])
  const [loadingHist, setLoadingHist] = useState(true)

  const selPlan = PLANS.find(p => p.id === plan) || PLANS[1]
  const total   = selPlan.price + (plan === 'pro' ? extraUsers * 2.5 : 0)
  const hasPending = payments.some(p => p.status === 'pending')

  /* load history on mount */
  useEffect(() => {
    if (!user) return
    loadHistory()
  }, [user])

  /* if already has a pending payment, jump to step 4 */
  useEffect(() => {
    if (hasPending) setStep(4)
  }, [hasPending])

  async function loadHistory() {
    setLoadingHist(true)
    try {
      const token = await user.getIdToken()
      const res   = await fetch(`${API}/api/payments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    } catch { /* silent */ } finally {
      setLoadingHist(false)
    }
  }

  async function submit() {
    if (!phoneUsed.trim()) {
      toast.error('Please enter the phone number you used')
      return
    }
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`${API}/api/payments/submit`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ plan, extraUsers, method, phoneUsed, proofNote }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          toast('You already have a pending payment — waiting for admin.', { icon:'ℹ️' })
          await loadHistory()
          setStep(4)
          return
        }
        throw new Error(data.error || 'Submission failed')
      }
      toast.success('Payment submitted! Admin will verify within 2 hours.')
      await loadHistory()
      setStep(4)
    } catch (e) {
      toast.error(e.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const STEP_LABELS = ['Choose Plan', 'Payment Method', 'Send & Submit', 'Track Status']

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom:20 }}>
        <h2>Upgrade Your Plan</h2>
        <p style={{ color:'var(--ink-3)', fontSize:'.84rem', marginTop:4 }}>
          Simple payments · Admin verifies · Auto-upgrade
        </p>
      </div>

      {/* Step bar */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:28, overflowX:'auto', paddingBottom:4, gap:0 }}>
        {STEP_LABELS.map((lbl, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <StepDot n={i+1} active={step === i+1} done={step > i+1} />
              <span style={{
                fontSize:'.72rem', fontWeight:600, whiteSpace:'nowrap',
                color: step === i+1 ? 'var(--green-dark)' : step > i+1 ? 'var(--ink-3)' : 'var(--ink-4)',
              }}>{lbl}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ width:20, height:2, margin:'0 6px', borderRadius:1, flexShrink:0,
                background: step > i+1 ? 'var(--green-light)' : 'var(--paper-3)' }} />
            )}
          </div>
        ))}
      </div>

      {/* ══ STEP 1 — Plan picker ══════════════════ */}
      {step === 1 && (
        <div>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:18 }}>
            {PLANS.map(p => (
              <div key={p.id} onClick={() => setPlan(p.id)} style={{
                background: plan===p.id ? 'var(--green-ghost)' : '#fff',
                border:`2px solid ${plan===p.id ? 'var(--green-dark)' : 'var(--paper-3)'}`,
                borderRadius:16, padding:'16px 18px', cursor:'pointer', transition:'all .18s',
                position:'relative',
              }}>
                {p.id === 'pro' && (
                  <span style={{ position:'absolute', top:-10, right:14, background:'var(--green-dark)', color:'#fff', fontSize:'.6rem', fontWeight:700, padding:'3px 10px', borderRadius:99, letterSpacing:'.4px' }}>
                    POPULAR
                  </span>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'.95rem', color: plan===p.id ? 'var(--green-dark)' : 'var(--ink)' }}>
                      {p.icon} {p.name}
                    </div>
                    <div style={{ fontSize:'.8rem', color:'var(--ink-3)', marginTop:4 }}>{p.desc}</div>
                  </div>
                  <div style={{ textAlign:'end', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.4rem', fontWeight:700 }}>${p.price}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--ink-3)' }}>/month</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Extra users — Pro only */}
          {plan === 'pro' && (
            <div style={{ background:'var(--green-ghost)', border:'1px solid var(--green-pale)', borderRadius:14, padding:16, marginBottom:18 }}>
              <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--green-dark)', marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                👥 Extra Users
                <span style={{ background:'var(--green-pale)', color:'var(--green-dark)', fontSize:'.6rem', fontWeight:700, padding:'2px 8px', borderRadius:99 }}>
                  $2.5 / user / mo
                </span>
              </div>
              <div style={{ fontSize:'.78rem', color:'var(--muted)', marginBottom:12 }}>Invite team members to collaborate</div>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <button onClick={() => setExtraUsers(v => Math.max(0,v-1))}
                  style={{ width:32, height:32, borderRadius:8, border:'1.5px solid var(--green-light)', background:'#fff', fontWeight:700, cursor:'pointer', fontSize:'1rem', color:'var(--green-dark)' }}>−</button>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'1.1rem', minWidth:28, textAlign:'center' }}>{extraUsers}</span>
                <button onClick={() => setExtraUsers(v => Math.min(20,v+1))}
                  style={{ width:32, height:32, borderRadius:8, border:'1.5px solid var(--green-light)', background:'#fff', fontWeight:700, cursor:'pointer', fontSize:'1rem', color:'var(--green-dark)' }}>+</button>
                {extraUsers > 0 && (
                  <span style={{ fontSize:'.8rem', color:'var(--green-dark)', fontWeight:600 }}>
                    +${(extraUsers*2.5).toFixed(2)}/mo
                  </span>
                )}
              </div>
            </div>
          )}

          <SummaryBox plan={plan} extraUsers={extraUsers} total={total} />
          <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(2)}>
            Continue →
          </button>
        </div>
      )}

      {/* ══ STEP 2 — Method picker ════════════════ */}
      {step === 2 && (
        <div>
          <div style={{ fontSize:'.84rem', color:'var(--ink-3)', marginBottom:16 }}>
            Upgrading to <strong style={{ color:'var(--green-dark)' }}>{selPlan.name}</strong> —{' '}
            <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>${total.toFixed(2)}/mo</span>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:22 }}>
            {METHODS.map(m => (
              <div key={m.id} onClick={() => setMethod(m.id)} style={{
                background: method===m.id ? 'var(--green-ghost)' : '#fff',
                border:`2px solid ${method===m.id ? 'var(--green-dark)' : 'var(--paper-3)'}`,
                borderRadius:14, padding:'14px 16px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:14, transition:'all .18s',
              }}>
                <div style={{
                  width:44, height:44, borderRadius:12, flexShrink:0,
                  background: m.accent + '18', border:`1.5px solid ${m.accent}30`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem',
                }}>
                  {m.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.9rem', color: method===m.id ? 'var(--green-dark)' : 'var(--ink)' }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize:'.74rem', color:'var(--ink-3)', marginTop:2 }}>{m.sublabel}</div>
                </div>
                <div style={{
                  width:22, height:22, borderRadius:'50%', flexShrink:0,
                  border:`2px solid ${method===m.id ? 'var(--green-dark)' : 'var(--paper-3)'}`,
                  background: method===m.id ? 'var(--green-dark)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontSize:'.7rem',
                }}>
                  {method===m.id ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(3)}>Continue →</button>
          </div>
        </div>
      )}

      {/* ══ STEP 3 — Instructions + Submit ═══════ */}
      {step === 3 && (
        <div>
          {/* Payment target card */}
          <div style={{ background:'var(--green-dark)', borderRadius:16, padding:'18px 20px', marginBottom:18, color:'#fff' }}>
            <div style={{ fontSize:'.66rem', opacity:.65, fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:6 }}>
              {PAYMENT_NUMBERS[method].label}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'1.4rem', fontWeight:700, letterSpacing:'1px', marginBottom:10 }}>
              {PAYMENT_NUMBERS[method].number}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', opacity:.75, fontSize:'.84rem', paddingTop:10, borderTop:'1px solid rgba(255,255,255,.15)' }}>
              <span>Amount to send</span>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Steps */}
          <div style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:14, padding:'14px 16px', marginBottom:18 }}>
            <div style={{ fontWeight:700, fontSize:'.84rem', marginBottom:12, color:'var(--ink)' }}>How to pay:</div>
            {STEPS_HOW[method].map((text, i) => (
              <div key={i} style={{ display:'flex', gap:12, marginBottom: i < 3 ? 10 : 0, alignItems:'flex-start' }}>
                <div style={{
                  width:24, height:24, borderRadius:'50%', flexShrink:0,
                  background:'var(--green-ghost)', border:'1px solid var(--green-pale)',
                  color:'var(--green-dark)', display:'flex', alignItems:'center',
                  justifyContent:'center', fontWeight:700, fontSize:'.72rem',
                }}>
                  {i+1}
                </div>
                <div style={{ fontSize:'.85rem', color:'var(--ink-2)', paddingTop:3, lineHeight:1.5 }}>{text}</div>
              </div>
            ))}
          </div>

          {/* WhatsApp reminder (manual only) */}
          {method === 'manual' && (
            <a href={`https://wa.me/${PAYMENT_NUMBERS.manual.number.replace(/\s/g,'')}`}
               target="_blank" rel="noopener noreferrer"
               style={{ display:'flex', alignItems:'center', gap:10, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'11px 14px', marginBottom:16, textDecoration:'none', color:'var(--green-dark)' }}>
              <span style={{ fontSize:'1.2rem' }}>💬</span>
              <div>
                <div style={{ fontWeight:700, fontSize:'.84rem' }}>Open WhatsApp to send screenshot</div>
                <div style={{ fontSize:'.73rem', opacity:.75, marginTop:1 }}>{PAYMENT_NUMBERS.manual.number}</div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:'.8rem', opacity:.6 }}>→</span>
            </a>
          )}

          {/* User inputs */}
          <div className="form-group">
            <label className="form-label">
              {method === 'manual' ? 'Your Phone Number (you sent from)' : 'Your Phone Number'}
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', padding:'0 12px', background:'var(--paper-2)', border:'1.5px solid var(--paper-3)', borderRadius:'var(--radius-sm)', fontWeight:600, color:'var(--ink-3)', fontSize:'.9rem', whiteSpace:'nowrap', flexShrink:0, gap:5 }}>
                🇸🇴 +252
              </div>
              <input
                className="form-input"
                style={{ flex:1 }}
                type="tel"
                inputMode="tel"
                placeholder="61 234 5678"
                value={phoneUsed}
                onChange={e => setPhoneUsed(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {method === 'manual'
                ? 'Reference Note (optional — time sent, amount, etc.)'
                : 'Transaction ID / Confirmation Code'}
            </label>
            <input
              className="form-input"
              placeholder={method === 'manual' ? 'e.g. Sent $25 at 2:30pm on 15 April' : 'e.g. TX1234567'}
              value={proofNote}
              onChange={e => setProofNote(e.target.value)}
            />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setStep(2)}>← Back</button>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={submit}
              disabled={submitting || !phoneUsed.trim()}
            >
              {submitting ? 'Submitting…' : '✓ I Sent Payment'}
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP 4 — Status tracker ═══════════════ */}
      {step === 4 && (
        <div>
          {/* Latest payment status */}
          {loadingHist ? (
            <div className="spinner" style={{ padding:40 }} />
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <p>No payments found.</p>
              <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => setStep(1)}>
                Make a Payment
              </button>
            </div>
          ) : (() => {
            const latest  = payments[0]
            const ss       = STATUS_STYLE[latest.status] || STATUS_STYLE.pending
            return (
              <div>
                {/* Status hero */}
                <div style={{ background:ss.bg, border:`2px solid ${ss.border}`, borderRadius:18, padding:'24px 20px', textAlign:'center', marginBottom:20 }}>
                  <div style={{ fontSize:'2.8rem', marginBottom:10 }}>{ss.icon}</div>
                  <div style={{ fontWeight:800, fontSize:'1.1rem', color:ss.color, marginBottom:6 }}>
                    {latest.status === 'pending'  ? 'Awaiting Admin Verification' :
                     latest.status === 'approved' ? 'Plan Activated!' : 'Payment Rejected'}
                  </div>
                  <div style={{ fontSize:'.84rem', color:ss.color, opacity:.8 }}>
                    {latest.status === 'pending'
                      ? 'Admin will verify and upgrade your plan within 2 hours.'
                      : latest.status === 'approved'
                      ? `Your ${latest.plan?.toUpperCase()} plan is now active. Enjoy all features!`
                      : latest.rejectReason || 'Payment could not be verified. Please try again.'}
                  </div>
                  {latest.status === 'pending' && (
                    <a href={`https://wa.me/${PAYMENT_NUMBERS.manual.number.replace(/\s/g,'')}?text=Hi! I submitted payment for ${latest.plan?.toUpperCase()} plan. Payment ID: ${latest.id}`}
                       target="_blank" rel="noopener noreferrer"
                       style={{ display:'inline-flex', alignItems:'center', gap:7, marginTop:14, background:'#25D366', color:'#fff', padding:'8px 18px', borderRadius:99, textDecoration:'none', fontWeight:700, fontSize:'.82rem' }}>
                      💬 Follow Up on WhatsApp
                    </a>
                  )}
                </div>

                {/* Payment details */}
                <div style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:'.8rem', color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom:12 }}>Payment Details</div>
                  {[
                    ['Plan',       latest.plan?.toUpperCase()],
                    ['Amount',     `$${latest.totalAmount}`],
                    ['Method',     METHODS.find(m => m.id === latest.method)?.label || latest.method],
                    ['Phone Used', latest.phoneUsed],
                    ['Submitted',  latest.createdAt?.slice(0,16).replace('T',' ')],
                    ...(latest.reviewedAt ? [['Reviewed', latest.reviewedAt?.slice(0,16).replace('T',' ')]] : []),
                  ].map(([k,v]) => v ? (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--paper-2)', fontSize:'.84rem' }}>
                      <span style={{ color:'var(--ink-3)' }}>{k}</span>
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:'var(--ink)' }}>{v}</span>
                    </div>
                  ) : null)}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:10 }}>
                  {latest.status === 'approved' && (
                    <button className="btn btn-primary btn-full" onClick={async () => { await fetchStatus(); navigate('/app') }}>
                      Go to Dashboard →
                    </button>
                  )}
                  {latest.status === 'rejected' && (
                    <button className="btn btn-primary btn-full" onClick={() => { setStep(1); }}>
                      Try Again
                    </button>
                  )}
                  {latest.status === 'pending' && (
                    <button className="btn btn-ghost btn-full" onClick={loadHistory}>
                      ↻ Refresh Status
                    </button>
                  )}
                </div>

                {/* Full history */}
                {payments.length > 1 && (
                  <div style={{ marginTop:24 }}>
                    <div style={{ fontSize:'.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', color:'var(--ink-3)', marginBottom:10 }}>
                      Payment History
                    </div>
                    {payments.slice(1).map(p => {
                      const pss = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                      return (
                        <div key={p.id} style={{ background:'#fff', border:'1.5px solid var(--paper-3)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div>
                              <div style={{ fontWeight:700, fontSize:'.86rem' }}>{p.plan?.toUpperCase()} — ${p.totalAmount}</div>
                              <div style={{ fontSize:'.7rem', color:'var(--ink-3)', fontFamily:'var(--font-mono)', marginTop:2 }}>{p.createdAt?.slice(0,10)}</div>
                            </div>
                            <span style={{ fontSize:'.72rem', fontWeight:700, color:pss.color, background:pss.bg, padding:'3px 9px', borderRadius:99, border:`1px solid ${pss.border}` }}>
                              {pss.icon} {p.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
