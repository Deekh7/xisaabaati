import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout    from './components/AppLayout'
import LandingPage  from './pages/LandingPage'
import LoginPage    from './pages/LoginPage'
import DashboardPage  from './pages/DashboardPage'
import SalesPage      from './pages/SalesPage'
import ProductsPage   from './pages/ProductsPage'
import ExpensesPage   from './pages/ExpensesPage'
import ReportsPage    from './pages/ReportsPage'
import CustomersPage  from './pages/CustomersPage'
import SettingsPage   from './pages/SettingsPage'
import AdminPage      from './pages/AdminPage'
import PaymentPage    from './pages/PaymentPage'

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
function RootRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/app" replace /> : <LandingPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<RootRoute />} />
      <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index              element={<DashboardPage />} />
        <Route path="sales"       element={<SalesPage />} />
        <Route path="products"    element={<ProductsPage />} />
        <Route path="expenses"    element={<ExpensesPage />} />
        <Route path="customers"   element={<CustomersPage />} />
        <Route path="reports"     element={<ReportsPage />} />
        <Route path="settings"    element={<SettingsPage />} />
        <Route path="payment"     element={<PaymentPage />} />
        <Route path="admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
