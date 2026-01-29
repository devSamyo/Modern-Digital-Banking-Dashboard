import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toast notification container */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            // Default options
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            // Success
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            // Error
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 - Not Found */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;