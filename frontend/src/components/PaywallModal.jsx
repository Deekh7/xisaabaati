// PaywallModal.jsx — Plan upgrade sheet with extra user pricing
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../context/SubscriptionContext'

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

.pw-overlay{position:fixed;inset:0;background:rgba(5,15,10,.72);backdrop-filter:blur(4px);z-index:600;display:flex;align-items:flex-end;justify-content:center;animation:pwFade .2s ease}
@keyframes pwFade{from{opacity:0}to{opacity:1}}
.pw-sheet{background:#0d1f14;border-radius:24px 24px 0 0;width:100%;max-width:520px;max-height:94dvh;overflow-y:auto;padding-bottom:max(env(safe-area-inset-bottom,0px),24px);animation:pwUp .3s cubic-bezier(.32,.72,0,1);border:1px solid rgba(255,255,255,.08);border-bottom:none}
@keyframes pwUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.pw-sheet::-webkit-scrollbar{width:3px}
.pw-sheet::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:2px}

.pw-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin:14px auto 0}
.pw-header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 22px 0}
.pw-header h2{font-family:'IBM Plex Mono',monospace;font-size:1.2rem;font-weight:700;color:#fff;margin-bottom:4px}
.pw-header p{font-family:'Plus Jakarta Sans',sans-serif;font-size:.83rem;color:#6ee7b7}
.pw-close{background:rgba(255,255,255,.08);border:none;width:34px;height:34px;border-radius:10px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1rem;transition:background .15s}
.pw-close:hover{background:rgba(255,255,255,.16)}

.pw-plans{display:flex;flex-direction:column;gap:11px;padding:18px 22px 6px}
.pw-plan{border-radius:16px;padding:17px;border:2px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);cursor:pointer;position:relative;overflow:hidden;transition:border-color .2s,transform .15s;font-family:'Plus Jakarta Sans',sans-serif}
.pw-plan:hover{border-color:rgba(255,255,255,.18);transform:translateY(-1px)}
.pw-plan.pw-active{border-color:#22c55e;background:rgba(34,197,94,.07)}
.pw-plan.pw-recommended::before{content:'BEST';position:absolute;top:13px;right:13px;font-family:'IBM Plex Mono',monospace;font-size:.58rem;font-weight:700;letter-spacing:.8px;background:#22c55e;color:#052e16;padding:3px 8px;border-radius:99px}
.pw-plan-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.pw-plan-name{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:.9rem;color:#fff}
.pw-plan-price{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:1.3rem;color:#fff}
.pw-plan-price small{font-size:.75rem;color:#6b7280;font-weight:400}
.pw-feat{font-size:.8rem;color:#9ca3af;display:flex;align-items:center;gap:8px;margin-bottom:5px}
.pw-feat.ok{color:#86efac}

.pw-users-section{margin:0 22px 6px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:14px;padding:14px}
.pw-users-label{font-size:.82rem;font-weight:700;color:#4ade80;margin-bottom:3px;display:flex;align-items:center;gap:8px}
.pw-users-sub{font-size:.72rem;color:#6b7280;margin-bottom:12px}
.pw-users-row{display:flex;align-items:center;justify-content:space-between}
.pw-users-info{font-size:.8rem;color:#d1d5db}
.pw-users-cost{font-size:.72rem;color:#4ade80;margin-top:2px;font-family:'IBM Plex Mono',monospace}
.pw-stepper{display:flex;align-items:center;gap:10px}
.pw-step-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fff;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:'Plus Jakarta Sans',sans-serif}
.pw-step-btn:hover{border-color:#22c55e;color:#22c55e;background:rgba(34,197,94,.1)}
.pw-step-n{font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:.95rem;color:#fff;min-width:24px;text-align:center}

.pw-summary{margin:0 22px 6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px}
.pw-sum-row{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;color:#9ca3af;padding:3px 0;font-family:'Plus Jakarta Sans',sans-serif}
.pw-sum-row.total{border-top:1px solid rgba(255,255,255,.1);margin-top:6px;padding-top:9px;font-weight:800;font-size:.9rem;color:#fff}
.pw-sum-row.total span:last-child{font-family:'IBM Plex Mono',monospace;color:#4ade80}

.pw-cta{padding:14px 22px 0}
.pw-btn{width:100%;padding:15px;border-radius:14px;border:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:1rem;font-weight:800;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px}
.pw-btn:active{transform:scale(.97)}
.pw-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.pw-btn-go{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 4px 20px rgba(34,197,94,.3)}
.pw-btn-go:hover:not(:disabled){box-shadow:0 4px 28px rgba(34,197,94,.45)}
.pw-btn-off{background:rgba(255,255,255,.06);color:#4b5563}
.pw-note{text-align:center;padding:12px 22px 0;font-size:.72rem;color:#374151;font-family:'Plus Jakarta Sans',sans-serif}
.pw-spin{width:18px;height:18px;border-radius:50%;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;animation:pwSpin .6s linear infinite;flex-shrink:0}
@keyframes pwSpin{to{transform:rotate(360deg)}}
`

const DEFAULT_PLANS = [
  { id:'free',  name:'Free',  price:0,  invoiceLimit:20,   reports:false, multiUser:false },
  { id:'basic', name:'Basic', price:12, invoiceLimit:null, reports:false, multiUser:false },
  { id:'pro',   name:'Pro',   price:25, invoiceLimit:null, reports:true,  multiUser:true  },
]

export default function PaywallModal({ onClose, triggeredBy = null }) {
  const { availablePlans, effectivePlan, isTrialActive } = useSubscription()
  const navigate = useNavigate()
  const plans = availablePlans?.length ? availablePlans : DEFAULT_PLANS

  const defaultSel = 'pro'
  const [selected, setSelected]     = useState(defaultSel)
  const [extraUsers, setExtraUsers] = useState(0)

  const selectedPlan = plans.find(p => p.id === selected) || plans[2]
  const basePrice    = selectedPlan?.price || 0
  const extraCost    = selected === 'pro' ? extraUsers * 2.5 : 0
  const totalPrice   = basePrice + extraCost

  const handleUpgrade = () => {
    if (selected === 'free') return
    onClose()
    navigate(`/payment?plan=${selected}`)
  }

  const isCurrent = (planId) => {
    if (isTrialActive && planId === 'pro') return true
    return planId === effectivePlan
  }

  const headings = {
    limit:   { title: '🚫 Invoice Limit Reached', sub: 'Upgrade to create unlimited invoices' },
    reports: { title: '📈 Reports — Pro Only',     sub: 'Unlock reports with a Pro subscription' },
    null:    { title: '✦ Choose Your Plan',        sub: 'Simple pricing for growing businesses' },
  }
  const { title, sub } = headings[triggeredBy] || headings[null]

  return (
    <>
      <style>{STYLES}</style>
      <div className="pw-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="pw-sheet">
          <div className="pw-handle" />
          <div className="pw-header">
            <div>
              <h2>{title}</h2>
              <p>{sub}</p>
            </div>
            <button className="pw-close" onClick={onClose}>✕</button>
          </div>

          {/* Plan cards */}
          <div className="pw-plans">
            {plans.map(plan => {
              const isSelected = selected === plan.id
              const current    = isCurrent(plan.id)
              return (
                <div key={plan.id}
                  className={`pw-plan ${isSelected ? 'pw-active' : ''} ${plan.id === 'pro' ? 'pw-recommended' : ''}`}
                  onClick={() => plan.id !== 'free' && setSelected(plan.id)}>
                  <div className="pw-plan-top">
                    <div>
                      <div className="pw-plan-name">
                        {plan.id === 'pro' ? '✦ ' : plan.id === 'basic' ? '◆ ' : '○ '}{plan.name}
                        {current && <span style={{ marginLeft: 8, fontSize: '.62rem', background: 'rgba(34,197,94,.2)', color: '#4ade80', padding: '2px 8px', borderRadius: 99, fontFamily: 'IBM Plex Mono,monospace', verticalAlign: 'middle' }}>Current</span>}
                      </div>
                    </div>
                    <div className="pw-plan-price">
                      {plan.price === 0 ? <span style={{ fontSize: '.95rem', color: '#6b7280' }}>Free</span> : <>{`$${plan.price}`}<small>/mo</small></>}
                    </div>
                  </div>
                  <div className={`pw-feat ${true ? 'ok' : ''}`}>✓ {plan.invoiceLimit === null ? 'Unlimited invoices' : `${plan.invoiceLimit} invoices max`}</div>
                  <div className={`pw-feat ${plan.reports ? 'ok' : ''}`}>{plan.reports ? '✓' : '✗'} Reports &amp; analytics</div>
                  <div className={`pw-feat ${plan.multiUser ? 'ok' : ''}`}>{plan.multiUser ? '✓' : '✗'} Multi-user support (+$2.5/user)</div>
                </div>
              )
            })}
          </div>

          {/* Extra users — only shown when Pro is selected */}
          {selected === 'pro' && (
            <div className="pw-users-section">
              <div className="pw-users-label">
                👥 Additional Users
                <span style={{ fontSize: '.6rem', background: 'rgba(74,222,128,.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 99, fontFamily: 'IBM Plex Mono,monospace' }}>$2.5 / user / mo</span>
              </div>
              <div className="pw-users-sub">Invite team members to collaborate</div>
              <div className="pw-users-row">
                <div>
                  <div className="pw-users-info">Extra seats</div>
                  {extraUsers > 0 && <div className="pw-users-cost">+${(extraUsers * 2.5).toFixed(2)}/mo</div>}
                </div>
                <div className="pw-stepper">
                  <button className="pw-step-btn" onClick={() => setExtraUsers(Math.max(0, extraUsers - 1))}>−</button>
                  <span className="pw-step-n">{extraUsers}</span>
                  <button className="pw-step-btn" onClick={() => setExtraUsers(Math.min(20, extraUsers + 1))}>+</button>
                </div>
              </div>
            </div>
          )}

          {/* Price summary */}
          {selected !== 'free' && (
            <div className="pw-summary">
              <div className="pw-sum-row">
                <span>{selectedPlan?.name} plan</span>
                <span style={{ fontFamily: 'IBM Plex Mono,monospace' }}>${basePrice}/mo</span>
              </div>
              {extraUsers > 0 && selected === 'pro' && (
                <div className="pw-sum-row">
                  <span>{extraUsers} extra user{extraUsers > 1 ? 's' : ''}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono,monospace' }}>+${extraCost.toFixed(2)}/mo</span>
                </div>
              )}
              <div className="pw-sum-row total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}/mo</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pw-cta">
            {selected === 'free' ? (
              <button className="pw-btn pw-btn-off" disabled>You are on the Free plan</button>
            ) : (
              <button className="pw-btn pw-btn-go" onClick={handleUpgrade}>
                Pay ${totalPrice.toFixed(2)}/mo → Continue
              </button>
            )}
          </div>
          <p className="pw-note">Secure payment · Cancel anytime · Instant access</p>
        </div>
      </div>
    </>
  )
}
