import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Home from './pages/Home'
import Login from './pages/Login'
import RentFlow from './pages/RentFlow'
import ReturnFlow from './pages/ReturnFlow'
import ExtendFlow from './pages/ExtendFlow'
import BookInfo from './pages/BookInfo'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  // Public routes that don't require authentication
  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  // Protected routes that require authentication
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return <>{children}</>
  }

  // Admin routes that require admin role
  const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    if (user?.role !== 'ADMIN') {
      return <Navigate to="/" replace />
    }
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/rent" 
          element={
            <ProtectedRoute>
              <RentFlow />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/return" 
          element={
            <ProtectedRoute>
              <ReturnFlow />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/extend" 
          element={
            <ProtectedRoute>
              <ExtendFlow />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/book/:barcode" 
          element={
            <ProtectedRoute>
              <BookInfo />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App