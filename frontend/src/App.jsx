import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }       from './context/AuthContext'
import AppLayout         from './components/AppLayout'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import LandingPage       from './pages/LandingPage'
import DashboardPage     from './pages/DashboardPage'
import InvoicesPage      from './pages/InvoicesPage'
import CustomersPage     from './pages/CustomersPage'
import ReportsPage       from './pages/ReportsPage'
import AdminPage         from './pages/AdminPage'
import TeamPage          from './pages/TeamPage'
import PaymentPage       from './pages/PaymentPage'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}
function PublicRoute({ children }) {
  const { user } = useAuth()
  return !user ? children : <Navigate to="/app" replace />
}
function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/app" replace />
  return children
}
// Root: landing page for guests, dashboard for logged-in users
function RootRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/app" replace /> : <LandingPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<RootRoute />} />
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/app"    element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index              element={<DashboardPage />} />
        <Route path="invoices"    element={<InvoicesPage />} />
        <Route path="customers"   element={<CustomersPage />} />
        <Route path="reports"     element={<ReportsPage />} />
        <Route path="team"        element={<TeamPage />} />
        <Route path="admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="payment"     element={<PaymentPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
