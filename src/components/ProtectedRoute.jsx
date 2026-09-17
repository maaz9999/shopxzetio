import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, admin = false }) {
  const { loading, profileLoading, isCustomer, isAdmin } = useAuth();
  const location = useLocation();
  if (loading || (isCustomer && profileLoading)) return <main className="account-shell"><div className="auth-card">Checking secure session…</div></main>;
  if (!isCustomer) return <Navigate to={`${admin ? '/admin/login' : '/login'}?return=${encodeURIComponent(location.pathname)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/admin/login?error=not-admin" replace />;
  if (!admin && isAdmin) return <Navigate to="/admin" replace />;
  return children;
}
