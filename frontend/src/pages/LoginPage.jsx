import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'
const GL = '#f0fdf4'

const BIZ_TYPES = ['shop', 'restaurant', 'pharmacy', 'services']

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

  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    businessName: '', businessType: 'shop',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.email || !form.password) {
      toast.error(t('required'))
      return
    }
    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        navigate('/app')
      } else {
        if (!form.businessName) { toast.error(t('required')); setLoading(false); return }
        await signup(form.email, form.password, form.name || form.businessName, form.businessName, form.businessType)
        navigate('/app')
      }
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
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
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
    >
      <div className="auth-box">
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
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            {t('login')}
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            {t('register')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <>
              <div>
                <label className="form-label">{t('name')}</label>
                <input
                  style={inp}
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('name')}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="form-label">{t('businessName')}</label>
                <input
                  style={inp}
                  value={form.businessName}
                  onChange={set('businessName')}
                  placeholder={t('businessName')}
                  autoComplete="organization"
                />
              </div>
              <div>
                <label className="form-label">{t('businessType')}</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.businessType} onChange={set('businessType')}>
                  {BIZ_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{t(bt)}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="form-label">{t('email')}</label>
            <input
              style={inp}
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete={isLogin ? 'username' : 'email'}
            />
          </div>
          <div>
            <label className="form-label">{t('password')}</label>
            <input
              style={inp}
              type="password"
              value={form.password}
              onChange={set('password')}
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
