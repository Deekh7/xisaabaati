import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout      from './components/AppLayout'
import LandingPage    from './pages/LandingPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'
import DashboardPage  from './pages/DashboardPage'
import SalesPage      from './pages/SalesPage'
import ProductsPage   from './pages/ProductsPage'
import ExpensesPage   from './pages/ExpensesPage'
import ReportsPage    from './pages/ReportsPage'
import CustomersPage  from './pages/CustomersPage'
import SettingsPage   from './pages/SettingsPage'
import AdminPage      from './pages/AdminPage'
import PaymentPage    from './pages/PaymentPage'
import PublicPage     from './pages/PublicPage'
import ContactPage    from './pages/ContactPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
function PublicRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return children
  return <Navigate to={isAdmin ? '/app/admin' : '/app'} replace />
}
function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user)    return <Navigate to="/login"  replace />
  if (!isAdmin) return <Navigate to="/app"    replace />
  return children
}
function RootRoute() {
  const { user, isAdmin } = useAuth()
  if (!user) return <LandingPage />
  return <Navigate to={isAdmin ? '/app/admin' : '/app'} replace />
}
// Redirect admin to /app/admin if they somehow land on /app
function AppIndexRoute() {
  const { isAdmin } = useAuth()
  return isAdmin ? <Navigate to="/app/admin" replace /> : <DashboardPage />
}

export default function App() {
  return (
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
  )
}
