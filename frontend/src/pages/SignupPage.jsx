import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import LangSwitcher from '../components/LangSwitcher'

const BIZ_TYPES = [
  { id:'grocery',    emoji:'🛒', en:'Grocery',      so:'Bakhaaro',      ar:'بقالة'   },
  { id:'retail',     emoji:'🏪', en:'Retail',        so:'Dukaan',        ar:'تجزئة'   },
  { id:'wholesale',  emoji:'📦', en:'Wholesale',     so:'Xoolo-guri',    ar:'جملة'    },
  { id:'pharmacy',   emoji:'💊', en:'Pharmacy',      so:'Farmaashiye',   ar:'صيدلية'  },
  { id:'restaurant', emoji:'🍽️', en:'Restaurant',    so:'Makhaayadda',   ar:'مطعم'    },
  { id:'services',   emoji:'🔧', en:'Services',      so:'Adeegyo',       ar:'خدمات'   },
  { id:'salon',      emoji:'✂️', en:'Salon/Beauty',  so:'Saloon',        ar:'صالون'   },
  { id:'other',      emoji:'🏢', en:'Other',         so:'Kale',          ar:'أخرى'    },
]

export default function SignupPage() {
  const { phoneSignup } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  const [step, setStep]       = useState('info')   // info | biz | pin
  const [form, setForm]       = useState({ businessName: '', phone: '' })
  const [bizType, setBizType] = useState(null)
  const [pin, setPin]         = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const BIZ_NAME = b => lang === 'ar' ? b.ar : lang === 'so' ? b.so : b.en

  const handleSignup = async () => {
    setError('')
    if (pin !== pinConfirm) { setError('PINs do not match'); return }
    if (pin.length !== 4)   { setError('PIN must be 4 digits'); return }
    if (!bizType)           { setError(t('required')); return }
    setLoading(true)
    try {
      await phoneSignup(form.phone, pin, form.businessName, bizType.id)
      navigate('/')
    } catch (err) {
      setError(err?.message || t('signupError'))
      toast.error(t('signupError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, insetInlineEnd: 16 }}>
          <LangSwitcher />
        </div>
        <div className="auth-logo">
          <h1>✦ Xisaabaati</h1>
          <p>{t('tagline')}</p>
        </div>

        {/* STEP 1 — Business info */}
        {step === 'info' && (
          <div>
            <div className="form-group">
              <label className="form-label">{t('businessName')}</label>
              <input className="form-input" type="text" value={form.businessName} onChange={set('businessName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ display:'flex', alignItems:'center', padding:'0 12px', background:'var(--paper-2)', border:'1.5px solid var(--paper-3)', borderRadius:'var(--radius-sm)', fontWeight:600, color:'var(--ink-3)', fontSize:'0.9rem', whiteSpace:'nowrap', gap:5, flexShrink:0 }}>
                  🇸🇴 +252
                </div>
                <input className="form-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="61 234 5678" style={{ flex:1 }} />
              </div>
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => { if(form.businessName && form.phone.replace(/\D/g,'').length>=7) setStep('biz') }}
              disabled={!form.businessName || form.phone.replace(/\D/g,'').length < 7}
            >
              {t('login')} →
            </button>
            <p style={{ textAlign:'center', marginTop:16, fontSize:'0.85rem', color:'var(--ink-3)' }}>
              {t('haveAccount')}{' '}
              <Link to="/login" style={{ color:'var(--green-mid)', fontWeight:600 }}>{t('login')}</Link>
            </p>
          </div>
        )}

        {/* STEP 2 — Business type */}
        {step === 'biz' && (
          <div>
            <p style={{ fontSize:'0.85rem', color:'var(--ink-3)', marginBottom:14, textAlign:'center' }}>
              {lang==='ar' ? 'اختر نوع نشاطك التجاري' : lang==='so' ? 'Dooro nooca ganacsigaaga' : 'Choose your business type'}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:16 }}>
              {BIZ_TYPES.map(b => (
                <button key={b.id} onClick={() => setBizType(b)}
                  style={{ padding:'12px 8px', borderRadius:14, border:`2px solid ${bizType?.id===b.id?'var(--green-dark)':'var(--paper-3)'}`, background: bizType?.id===b.id?'var(--green-ghost)':'#fff', cursor:'pointer', textAlign:'center', transition:'all .15s', fontFamily:'var(--font-body)' }}>
                  <div style={{ fontSize:'1.6rem', marginBottom:4 }}>{b.emoji}</div>
                  <div style={{ fontSize:'0.78rem', fontWeight:700, color: bizType?.id===b.id?'var(--green-dark)':'var(--ink)' }}>{BIZ_NAME(b)}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => bizType && setStep('pin')} disabled={!bizType}>
              {t('login')} →
            </button>
          </div>
        )}

        {/* STEP 3 — Set PIN */}
        {step === 'pin' && (
          <div>
            <div className="form-group">
              <label className="form-label">
                {lang==='ar' ? 'أنشئ رمز PIN (4 أرقام)' : lang==='so' ? 'Samee PIN-kaaga (4 tiro)' : 'Create PIN (4 digits)'}
              </label>
              <input className="form-input mono" type="password" inputMode="numeric" maxLength={4}
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="••••" style={{ fontSize:'1.4rem', letterSpacing:'0.5rem', textAlign:'center' }} />
            </div>
            <div className="form-group">
              <label className="form-label">
                {lang==='ar' ? 'تأكيد رمز PIN' : lang==='so' ? 'Xaqiiji PIN-kaaga' : 'Confirm PIN'}
              </label>
              <input className="form-input mono" type="password" inputMode="numeric" maxLength={4}
                value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g,'').slice(0,4))}
                placeholder="••••" style={{ fontSize:'1.4rem', letterSpacing:'0.5rem', textAlign:'center' }} />
            </div>
            {error && (
              <div style={{ color: 'var(--red)', fontSize: '0.82rem', marginBottom: 8, textAlign: 'center' }}>
                {error}
              </div>
            )}
            <button className="btn btn-primary btn-full btn-lg" onClick={handleSignup}
              disabled={loading || pin.length !== 4 || pinConfirm.length !== 4}>
              {loading ? t('loading') : t('signup')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
