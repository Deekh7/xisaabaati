import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, BarChart2, LogOut, Shield, UsersRound } from 'lucide-react'
import { useAuth }         from '../context/AuthContext'
import { useLang }         from '../context/LangContext'
import { useSubscription } from '../context/SubscriptionContext'
import LangSwitcher  from './LangSwitcher'
import TrialBanner   from './TrialBanner'
import PaywallModal  from './PaywallModal'

const baseNavItems = [
  { path: '/',          icon: LayoutDashboard, key: 'dashboard' },
  { path: '/invoices',  icon: FileText,         key: 'invoices'  },
  { path: '/customers', icon: Users,            key: 'customers' },
  { path: '/reports',   icon: BarChart2,        key: 'reports'   },
  { path: '/team',      icon: UsersRound,       key: 'team'      },
]
const adminNavItem = { path: '/admin', icon: Shield, key: 'admin' }

export default function AppLayout() {
  const { profile, logout, isAdmin }  = useAuth()
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems
  const { t }                         = useLang()
  const { canViewReports, effectivePlan } = useSubscription()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [showPaywall, setShowPaywall] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const handleNav = (path, key) => {
    if (key === 'reports' && !canViewReports) { setShowPaywall(true); return }
    if (key === 'team'    && effectivePlan !== 'pro') { setShowPaywall(true); return }
    navigate(path)
  }

  return (
    <div className="app-layout app-bg">
      <nav className="top-nav">
        <div className="logo">
          ✦ Xisaabaati
          <span>{profile?.businessName || ''}</span>
        </div>
        <div className="top-nav-actions">
          <LangSwitcher />
          <button className="btn btn-icon" onClick={handleLogout} title={t('logout')}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Trial banner — sits between top nav and content */}
      <TrialBanner onUpgradeClick={() => setShowPaywall(true)} />

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {navItems.map(({ path, icon: Icon, key }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)
          const isLocked = (key === 'reports' && !canViewReports) || (key === 'team' && effectivePlan !== 'pro')

          return (
            <button key={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(path, key)}
              style={isLocked ? { opacity: 0.55 } : {}}>
              <Icon size={22} />
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {t(key)}
                {isLocked && <span style={{ fontSize: '0.5rem' }}>🔒</span>}
              </span>
            </button>
          )
        })}
      </nav>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </div>
  )
}
