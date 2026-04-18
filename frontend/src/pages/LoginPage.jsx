import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import LangSwitcher from '../components/LangSwitcher'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const BIZ_TYPES = [
  { id:'grocery',    emoji:'🛒', en:'Grocery',      so:'Bakhaaro',      ar:'بقالة'      },
  { id:'retail',     emoji:'🏪', en:'Retail',        so:'Dukaan',        ar:'تجزئة'      },
  { id:'wholesale',  emoji:'📦', en:'Wholesale',     so:'Xoolo-guri',    ar:'جملة'       },
  { id:'pharmacy',   emoji:'💊', en:'Pharmacy',      so:'Farmaashiye',   ar:'صيدلية'     },
  { id:'restaurant', emoji:'🍽️', en:'Restaurant',    so:'Makhaayadda',   ar:'مطعم'       },
  { id:'services',   emoji:'🔧', en:'Services',      so:'Adeegyo',       ar:'خدمات'      },
  { id:'salon',      emoji:'✂️', en:'Salon/Beauty',  so:'Saloon',        ar:'صالون'      },
  { id:'other',      emoji:'🏢', en:'Other',         so:'Kale',          ar:'أخرى'       },
]

export default function LoginPage() {
  const { phoneLogin } = useAuth()
  const { t, lang } = useLang()
  const navigate = useNavigate()

  const [step, setStep]       = useState('phone') // phone | biz | pin
  const [phone, setPhone]     = useState('')
  const [bizType, setBizType] = useState(null)
  const [pin, setPin]         = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake]     = useState(false)

  // Contact form state
  const [contactOpen, setContactOpen]   = useState(false)
  const [contactForm, setContactForm]   = useState({ name: '', phone: '', message: '' })
  const [contactSending, setContactSending] = useState(false)

  const setContact = k => e => setContactForm(f => ({ ...f, [k]: e.target.value }))

  const submitContact = async () => {
    if (!contactForm.name || !contactForm.message) return
    setContactSending(true)
    try {
      await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactForm.name, phone: contactForm.phone, body: contactForm.message }),
      })
      toast.success(lang === 'ar' ? 'تم الإرسال ✓' : 'Message sent!')
      setContactForm({ name: '', phone: '', message: '' })
      setContactOpen(false)
    } catch {
      toast.error(lang === 'ar' ? 'فشل الإرسال' : 'Send failed')
    } finally {
      setContactSending(false)
    }
  }

  // Step 1 → Step 2
  const goToBiz = () => {
    if (phone.replace(/\D/g, '').length < 7) return
    setStep('biz')
  }

  // Step 2 → Step 3
  const goToPin = () => {
    if (!bizType) return
    setStep('pin')
  }

  // PIN keypad
  const pressKey = async (k) => {
    if (k === 'del') { setPin(p => p.slice(0, -1)); return }
    const next = pin + k
    setPin(next)
    if (next.length === 4) {
      setLoading(true)
      try {
        await phoneLogin(phone, next)
        navigate('/app')
      } catch {
        setShake(true)
        setTimeout(() => { setShake(false); setPin('') }, 700)
        toast.error(t('loginError'))
      } finally {
        setLoading(false)
      }
    }
  }

  const BIZ_NAME = (b) => lang === 'ar' ? b.ar : lang === 'so' ? b.so : b.en

  const PIN_KEYS = [
    ['1','ABC'], ['2','DEF'], ['3','GHI'],
    ['4','JKL'], ['5','MNO'], ['6','PQR'],
    ['7','STU'], ['8','VWX'], ['9','YZ'],
    null, ['0',''], 'del',
  ]

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

        {/* ── STEP 1: Phone ── */}
        {step === 'phone' && (
          <div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '0 12px',
                  background: 'var(--paper-2)', border: '1.5px solid var(--paper-3)',
                  borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--ink-3)',
                  fontSize: '0.9rem', whiteSpace: 'nowrap', gap: 5, flexShrink: 0
                }}>
                  🇸🇴 +252
                </div>
                <input
                  className="form-input"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="61 234 5678"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={goToBiz}
              disabled={phone.replace(/\D/g, '').length < 7}
            >
              {t('login')} →
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--ink-3)' }}>
              {t('noAccount')}{' '}
              <Link to="/signup" style={{ color: 'var(--green-mid)', fontWeight: 600 }}>
                {t('signup')}
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Business Type ── */}
        {step === 'biz' && (
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-3)', marginBottom: 14, textAlign: 'center' }}>
              {lang === 'ar' ? 'اختر نوع نشاطك التجاري' : lang === 'so' ? 'Dooro nooca ganacsigaaga' : 'Choose your business type'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 16 }}>
              {BIZ_TYPES.map(b => (
                <button
                  key={b.id}
                  onClick={() => setBizType(b)}
                  style={{
                    padding: '12px 8px', borderRadius: 14,
                    border: `2px solid ${bizType?.id === b.id ? 'var(--green-dark)' : 'var(--paper-3)'}`,
                    background: bizType?.id === b.id ? 'var(--green-ghost)' : '#fff',
                    cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{b.emoji}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: bizType?.id === b.id ? 'var(--green-dark)' : 'var(--ink)' }}>
                    {BIZ_NAME(b)}
                  </div>
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={goToPin}
              disabled={!bizType}
            >
              {t('login')} →
            </button>
          </div>
        )}

        {/* ── STEP 3: PIN ── */}
        {step === 'pin' && (
          <div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--ink-3)', marginBottom: 6 }}>
              {lang === 'ar' ? 'أدخل رمز PIN المكون من 4 أرقام' : lang === 'so' ? 'Geli PIN-kaaga 4-tirood ah' : 'Enter your 4-digit PIN'}
            </p>

            {/* PIN dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '16px 0',
              animation: shake ? 'pinShake .35s ease' : 'none' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: `2px solid ${i < pin.length ? 'var(--green-dark)' : 'var(--paper-3)'}`,
                  background: i < pin.length ? 'var(--green-dark)' : 'var(--paper-2)',
                  transition: 'all .15s'
                }} />
              ))}
            </div>

            <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginTop: 8 }}>
              {PIN_KEYS.map((k, i) => {
                if (k === null) return <div key={i} />
                if (k === 'del') return (
                  <button key={i} onClick={() => pressKey('del')}
                    style={{ height: 52, borderRadius: 12, border: '1.5px solid var(--paper-3)', background: 'var(--paper-2)', cursor: 'pointer', fontSize: '1rem', color: 'var(--ink-3)', fontFamily: 'var(--font-body)', transition: 'all .12s' }}>
                    ⌫
                  </button>
                )
                return (
                  <button key={i} onClick={() => pressKey(k[0])}
                    style={{ height: 52, borderRadius: 12, border: '1.5px solid var(--paper-3)', background: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'all .12s', fontFamily: 'var(--font-body)' }}
                    onMouseDown={e => e.currentTarget.style.background = 'var(--green-ghost)'}
                    onMouseUp={e => e.currentTarget.style.background = '#fff'}
                    onTouchStart={e => e.currentTarget.style.background = 'var(--green-ghost)'}
                    onTouchEnd={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{k[0]}</span>
                    {k[1] && <span style={{ fontSize: '0.5rem', color: 'var(--ink-4)', letterSpacing: '.3px' }}>{k[1]}</span>}
                  </button>
                )
              })}
            </div>

            {loading && (
              <div style={{ textAlign: 'center', marginTop: 14, color: 'var(--muted)', fontSize: '0.8rem' }}>
                {t('loading')}
              </div>
            )}
          </div>
        )}

        {/* ── Contact Us ── */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={() => setContactOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: '0.8rem', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}
          >
            {lang === 'ar' ? 'تواصل معنا' : lang === 'so' ? 'Nala soo xiriir' : 'Contact Us'}
          </button>
          {contactOpen && (
            <div style={{ marginTop: 12, textAlign: 'start', background: 'var(--paper-2)', borderRadius: 'var(--radius)', padding: 14, border: '1.5px solid var(--paper-3)' }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
                <input className="form-input" value={contactForm.name} onChange={setContact('name')} />
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">{t('phone')}</label>
                <input className="form-input" type="tel" value={contactForm.phone} onChange={setContact('phone')} />
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">{lang === 'ar' ? 'الرسالة' : 'Message'}</label>
                <textarea className="form-textarea" rows={3} value={contactForm.message} onChange={setContact('message')} />
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={submitContact}
                disabled={contactSending || !contactForm.name || !contactForm.message}
              >
                {contactSending ? t('loading') : (lang === 'ar' ? 'إرسال' : 'Send')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
