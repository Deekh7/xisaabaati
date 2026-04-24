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

const navIcon = (paths, active) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke={active ? G : '#94a3b8'} strokeWidth="2">
    {paths}
  </svg>
)

// User nav icons
const HomeIcon    = ({ a }) => navIcon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, a)
const SalesIcon   = ({ a }) => navIcon(<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>, a)
const ProductsIcon= ({ a }) => navIcon(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>, a)
const ExpensesIcon= ({ a }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#f97316' : '#94a3b8'} strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const SettingsIcon = ({ a }) => navIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>, a)

// Admin nav icons
const StatsIcon   = ({ a }) => navIcon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>, a)
const PayIcon     = ({ a }) => navIcon(<><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>, a)
const UsersIcon   = ({ a }) => navIcon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, a)
const MsgIcon     = ({ a }) => navIcon(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>, a)
const CmsIcon     = ({ a }) => navIcon(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, a)

const USER_NAV = [
  { path:'/app',          exact:true,  labelKey:'dashboard', Icon:HomeIcon,     expColor:G },
  { path:'/app/sales',    exact:false, labelKey:'sales',     Icon:SalesIcon,    expColor:G },
  { path:'/app/products', exact:false, labelKey:'products',  Icon:ProductsIcon, expColor:G },
  { path:'/app/expenses', exact:false, labelKey:'expenses',  Icon:ExpensesIcon, expColor:'#f97316' },
  { path:'/app/settings', exact:false, labelKey:'settings',  Icon:SettingsIcon, expColor:G },
]

const ADMIN_NAV = [
  { path:'/app/admin',          labelKey:'adminStats',    Icon:StatsIcon  },
  { path:'/app/admin/payments', labelKey:'adminPay',      Icon:PayIcon    },
  { path:'/app/admin/users',    labelKey:'adminUsers',    Icon:UsersIcon  },
  { path:'/app/admin/messages', labelKey:'adminMsgs',     Icon:MsgIcon    },
  { path:'/app/admin/content',  labelKey:'adminContent',  Icon:CmsIcon    },
]

export default function AppLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, profile, logout, isAdmin } = useAuth()
  const { isTrialActive, trialDaysLeft }   = useSubscription()
  const { t } = useLang()

  const handleLogout = async () => {
    try { await logout(); navigate('/') }
    catch { toast.error(t('error')) }
  }

  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/')

  const initials = (profile?.displayName || profile?.businessName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const navItems = isAdmin ? ADMIN_NAV : USER_NAV

  return (
    <div style={{ minHeight:'100dvh', background:'#fff' }}>
      {/* ── TOPBAR ──────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo"><LogoIcon /></div>
          <span className="topbar-title">
            {isAdmin ? '⚡ Maamulka' : (profile?.businessName || t('appName'))}
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {isAdmin && (
            <span style={{
              background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:700,
              padding:'3px 10px', borderRadius:20, border:'1px solid #fde68a',
            }}>ADMIN</span>
          )}
          <div className="status-chip">
            <div className="status-dot online" />
            <span className="status-label">{t('online')}</span>
          </div>
          <div
            className="avatar"
            onClick={() => navigate(isAdmin ? '/app/admin' : '/app/settings')}
            title={profile?.displayName || user?.email}
            style={isAdmin ? { background:'#f59e0b', color:'#fff' } : {}}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── TRIAL BANNER (users only) ────────────────────── */}
      {!isAdmin && isTrialActive && trialDaysLeft <= 7 && (
        <div className="trial-banner">
          <span className="trial-banner-text">🎉 {trialDaysLeft} {t('trialDaysLeft')}</span>
          <button className="trial-banner-btn" onClick={() => navigate('/app/payment')}>
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
        {isAdmin ? (
          ADMIN_NAV.map(({ path, labelKey, Icon }) => {
            const active = isActive(path, path === '/app/admin')
            return (
              <button key={path} className="bottom-nav-item" onClick={() => navigate(path)}>
                <Icon a={active} />
                <span className="bottom-nav-label" style={{ color: active ? G : '#94a3b8', fontSize:10 }}>
                  {t(labelKey)}
                </span>
              </button>
            )
          })
        ) : (
          USER_NAV.map(({ path, exact, labelKey, Icon, expColor }) => {
            const active = isActive(path, exact)
            return (
              <button key={path} className="bottom-nav-item" onClick={() => navigate(path)}>
                <Icon a={active} />
                <span className="bottom-nav-label" style={{ color: active ? expColor : '#94a3b8' }}>
                  {t(labelKey)}
                </span>
              </button>
            )
          })
        )}
      </nav>
    </div>
  )
}
