import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'
import toast from 'react-hot-toast'

const G = '#16a34a'

// ── Icons ────────────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const HomeIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const SalesIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const ProductsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
)
const ExpensesIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#f97316' : '#94a3b8'} strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const CustomersIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ReportsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const SettingsIcon = ({ active }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? G : '#94a3b8'} strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const NAV_ITEMS = [
  { path: '/app',           exact: true,  labelKey: 'dashboard', Icon: HomeIcon },
  { path: '/app/sales',     exact: false, labelKey: 'sales',     Icon: SalesIcon },
  { path: '/app/products',  exact: false, labelKey: 'products',  Icon: ProductsIcon },
  { path: '/app/expenses',  exact: false, labelKey: 'expenses',  Icon: ExpensesIcon },
  { path: '/app/settings',  exact: false, labelKey: 'settings',  Icon: SettingsIcon },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, logout } = useAuth()
  const { isTrialActive, trialDaysLeft } = useSubscription()
  const { t } = useLang()

  const handleLogout = async () => {
    try { await logout(); navigate('/login') }
    catch { toast.error(t('error')) }
  }

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const initials = (profile?.displayName || profile?.businessName || user?.email || 'U')
    .slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100dvh', background: '#fff' }}>
      {/* ── TOPBAR ──────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo"><LogoIcon /></div>
          <span className="topbar-title">
            {profile?.businessName || t('appName')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="status-chip">
            <div className="status-dot online" />
            <span className="status-label">{t('online')}</span>
          </div>
          <div
            className="avatar"
            onClick={() => navigate('/app/settings')}
            title={profile?.displayName || user?.email}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── TRIAL BANNER ─────────────────────────────────── */}
      {isTrialActive && trialDaysLeft <= 7 && (
        <div className="trial-banner">
          <span className="trial-banner-text">
            🎉 {trialDaysLeft} {t('trialDaysLeft')}
          </span>
          <button
            className="trial-banner-btn"
            onClick={() => navigate('/app/payment')}
          >
            {t('upgradeNow')}
          </button>
        </div>
      )}

      {/* ── PAGE CONTENT ────────────────────────────────── */}
      <main className="page-content">
        <Outlet />
      </main>

      {/* ── BOTTOM NAV ──────────────────────────────────── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ path, exact, labelKey, Icon }) => {
          const active = isActive(path, exact)
          return (
            <button
              key={path}
              className="bottom-nav-item"
              onClick={() => navigate(path)}
            >
              <Icon active={active} />
              <span
                className="bottom-nav-label"
                style={{ color: active ? (labelKey === 'expenses' ? '#f97316' : G) : '#94a3b8' }}
              >
                {t(labelKey)}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
