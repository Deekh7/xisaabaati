import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'
import { languageFlags, languageNames } from '../i18n/translations'

const G = '#16a34a'
const GL = '#f0fdf4'

const PLAN_COLORS = { free: '#6b7280', starter: '#3b82f6', growth: '#8b5cf6', pro: '#10b981' }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{t('currentPlan')}</span>
          <span className="badge" style={{ background: planColor + '18', color: planColor }}>
            {t(effectivePlan)}
          </span>
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
      </div>

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

      {/* Admin panel link */}
      {isAdmin && (
        <div className="settings-section">
          <button
            onClick={() => navigate('/app/admin')}
            style={{
              width: '100%', background: '#f8fafc', color: '#374151',
              border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '12px 0',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}
          >
            🛡 {t('admin')}
          </button>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', background: '#fee2e2', color: '#dc2626',
          border: 'none', borderRadius: 14, padding: '13px 0',
          fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4,
        }}
      >
        {t('logout')}
      </button>
    </div>
  )
}
