import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'

// Critical path — load eagerly (landing page must paint fast)
import LandingPage from './pages/LandingPage'

// Lazy-load everything else — split into separate chunks
const AppLayout     = lazy(() => import('./components/AppLayout'))
const LoginPage     = lazy(() => import('./pages/LoginPage'))
const SignupPage    = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SalesPage     = lazy(() => import('./pages/SalesPage'))
const ProductsPage  = lazy(() => import('./pages/ProductsPage'))
const ExpensesPage  = lazy(() => import('./pages/ExpensesPage'))
const ReportsPage   = lazy(() => import('./pages/ReportsPage'))
const CustomersPage = lazy(() => import('./pages/CustomersPage'))
const SettingsPage  = lazy(() => import('./pages/SettingsPage'))
const AdminPage     = lazy(() => import('./pages/AdminPage'))
const PaymentPage   = lazy(() => import('./pages/PaymentPage'))
const PublicPage    = lazy(() => import('./pages/PublicPage'))
const ContactPage   = lazy(() => import('./pages/ContactPage'))

// Minimal spinner shown while lazy chunks download
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f8faf8'
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #e0e0e0',
        borderTopColor: '#2e7d32', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  return user ? children : <Navigate to="/login" replace />
}
function PublicRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return children
  return <Navigate to={isAdmin ? '/app/admin' : '/app'} replace />
}
function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)    return <Navigate to="/login"  replace />
  if (!isAdmin) return <Navigate to="/app"    replace />
  return children
}
function RootRoute() {
  const { user, isAdmin, loading } = useAuth()
  // Show landing page immediately — don't wait for Firebase auth
  if (!loading && user) return <Navigate to={isAdmin ? '/app/admin' : '/app'} replace />
  return <LandingPage />
}
// Redirect admin to /app/admin if they somehow land on /app
function AppIndexRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/app/admin" replace /> : <DashboardPage />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public pages ── */}
        <Route path="/"        element={<RootRoute />} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup"  element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* ── Footer / Info pages ── */}
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about"   element={<PublicPage />} />
        <Route path="/vision"  element={<PublicPage />} />
        <Route path="/privacy" element={<PublicPage />} />
        <Route path="/terms"   element={<PublicPage />} />

        {/* ── App (authenticated) ── */}
        <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index              element={<AppIndexRoute />} />
          <Route path="sales"       element={<SalesPage />} />
          <Route path="products"    element={<ProductsPage />} />
          <Route path="expenses"    element={<ExpensesPage />} />
          <Route path="customers"   element={<CustomersPage />} />
          <Route path="reports"     element={<ReportsPage />} />
          <Route path="settings"    element={<SettingsPage />} />
          <Route path="payment"     element={<PaymentPage />} />

          {/* ── Admin (nested routes) ── */}
          <Route path="admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
