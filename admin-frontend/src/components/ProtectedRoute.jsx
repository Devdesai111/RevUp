import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  // DEV PREVIEW: ?preview=1 bypasses auth — checked on every render so
  // navigating to /?preview=1 works even after the module is cached.
  const isPreview = import.meta.env.DEV &&
    new URLSearchParams(location.search).get('preview') === '1';

  if (isPreview) return children;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
