import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Layout           from './components/Layout';
import Login            from './pages/Login';
import Dashboard        from './pages/Dashboard';
import Users            from './pages/Users';
import Metrics          from './pages/Metrics';
import Queues           from './pages/Queues';
import Calibrate        from './pages/Calibrate';

function AdminApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/users"     element={<Users />}     />
        <Route path="/metrics"   element={<Metrics />}   />
        <Route path="/queues"    element={<Queues />}    />
        <Route path="/calibrate" element={<Calibrate />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
