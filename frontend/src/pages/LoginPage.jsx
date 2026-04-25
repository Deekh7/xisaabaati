import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'
const GL = '#f0fdf4'

// Full list of 8 business types — matches SignupPage & helpers.js
const BIZ_TYPES = [
  { id:'grocery',    emoji:'🛒', en:'Grocery',       so:'Bakhaaro',     ar:'بقالة'        },
  { id:'retail',     emoji:'🏪', en:'Retail / Shop', so:'Dukaan',       ar:'تجزئة / دكان' },
  { id:'wholesale',  emoji:'📦', en:'Wholesale',     so:'Xoolo-guri',   ar:'جملة'         },
  { id:'pharmacy',   emoji:'💊', en:'Pharmacy',      so:'Farmaashiye',  ar:'صيدلية'       },
  { id:'restaurant', emoji:'🍽️', en:'Restaurant',    so:'Makhaayad',    ar:'مطعم'         },
  { id:'services',   emoji:'🔧', en:'Services',      so:'Adeegyo',      ar:'خدمات'        },
  { id:'salon',      emoji:'✂️', en:'Salon / Beauty',so:'Saloon',       ar:'صالون / تجميل'},
  { id:'other',      emoji:'🏢', en:'Other',         so:'Kale',         ar:'أخرى'         },
]

const inp = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 12,
  fontSize: 14, outline: 'none', background: '#fff',
  fontFamily: 'inherit', color: '#1e293b',
  WebkitAppearance: 'none', appearance: 'none',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { signup, login } = useAuth()
  const { t, lang, changeLang } = useLang()

  const [isLogin,  setIsLogin]  = useState(true)
  const [loading,  setLoading]  = useState(false)
  const [bizType,  setBizType]  = useState('retail')
  const [form, setForm] = useState({
    name: '', email: '', password: '', businessName: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const bizLabel = (b) => lang === 'ar' ? b.ar : lang === 'so' ? b.so : b.en

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.email || !form.password) { toast.error(t('required')); return }
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        navigate('/app')
      } else {
        if (!form.businessName) { toast.error(t('required')); setLoading(false); return }
        await signup(form.email, form.password, form.name || form.businessName, form.businessName, bizType)
        navigate('/app')
      }
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
          ? t('loginError')
          : err.code === 'auth/email-already-in-use'
          ? (lang === 'ar' ? 'البريد مستخدم بالفعل' : lang === 'so' ? 'Email-kan horey ayaa loo isticmaalay' : 'Email already in use')
          : err.message
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <div
      dir={dir}
      className="auth-page"
      style={{ fontFamily: lang === 'ar' ? "'Noto Sans Arabic',sans-serif" : 'system-ui,-apple-system,sans-serif' }}
      onKeyDown={(e) => e.key === 'Enter' && !isLogin ? null : handleSubmit()}
    >
      <div className="auth-box" style={{ maxWidth: isLogin ? 400 : 520, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="auth-logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 24 }}>{t('appName')}</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{t('tagline')}</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`}  onClick={() => setIsLogin(true)}>
            {t('login')}
          </button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
            {t('register')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Register fields ── */}
          {!isLogin && (
            <>
              <div>
                <label className="form-label">{t('name')}</label>
                <input style={inp} value={form.name} onChange={set('name')} placeholder={t('name')} autoComplete="name" />
              </div>
              <div>
                <label className="form-label">{t('businessName')}</label>
                <input style={inp} value={form.businessName} onChange={set('businessName')} placeholder={t('businessName')} autoComplete="organization" />
              </div>

              {/* Business type visual cards */}
              <div>
                <label className="form-label" style={{ marginBottom: 10 }}>
                  {t('businessType')}
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginInlineStart: 6, fontSize: 11 }}>
                    {lang === 'ar' ? '— اختر ما يناسبك' : lang === 'so' ? '— Dooro noocaaga' : '— we adapt the app for you'}
                  </span>
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                }}>
                  {BIZ_TYPES.map((b) => {
                    const active = bizType === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBizType(b.id)}
                        style={{
                          padding: '10px 4px',
                          borderRadius: 12,
                          border: `2px solid ${active ? G : '#e2e8f0'}`,
                          background: active ? GL : '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all .15s',
                          boxShadow: active ? `0 0 0 3px ${G}22` : 'none',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{b.emoji}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: active ? G : '#64748b',
                          textAlign: 'center', lineHeight: 1.2,
                        }}>
                          {bizLabel(b)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Common fields ── */}
          <div>
            <label className="form-label">{t('email')}</label>
            <input
              style={inp} type="email" value={form.email} onChange={set('email')}
              placeholder="you@example.com"
              autoComplete={isLogin ? 'username' : 'email'}
            />
          </div>
          <div>
            <label className="form-label">{t('password')}</label>
            <input
              style={inp} type="password" value={form.password} onChange={set('password')}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: 6,
              padding: '14px 0', borderRadius: 14,
              border: 'none', background: G, color: '#fff',
              fontWeight: 700, fontSize: 16, cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : isLogin ? t('login') : t('register')}
          </button>
        </form>

        {/* Language switcher */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 20 }}>
          {Object.keys(languageFlags).map((k) => (
            <button
              key={k}
              onClick={() => changeLang(k)}
              style={{
                padding: '5px 10px', borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: lang === k ? GL : 'transparent',
                color: lang === k ? G : '#94a3b8',
                fontSize: 12, fontWeight: 700,
              }}
            >
              {languageFlags[k]} {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
