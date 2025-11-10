import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/contexts/RBACContext';
import { AdminPageLoadingSkeleton } from './AdminPageLoadingSkeleton';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

export function AdminProtectedRoute({ 
  children, 
  requiredPermission,
  requiredRole,
  fallbackPath = '/auth'
}: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { canAccessAdmin, hasPermission, hasRole, loading: rbacLoading } = useRBAC();
  const location = useLocation();

  // CRITICAL: Wait for both auth AND RBAC data before performing any checks
  // This prevents race conditions and "Access denied" flashes
  const loading = authLoading || rbacLoading;

  // Always show skeleton when loading to prevent race conditions
  // This ensures RBAC is fully initialized before rendering protected content
  if (loading) {
    return <AdminPageLoadingSkeleton />;
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check basic admin access
  if (!canAccessAdmin()) {
    return (
      <Navigate 
        to="/" 
        state={{ 
          error: 'Access denied. Admin privileges required.',
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // Check specific permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Navigate 
        to="/admin" 
        state={{ 
          error: 'Insufficient permissions for this admin section.',
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // Check specific role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Navigate 
        to="/admin" 
        state={{ 
          error: 'Required role not found for this admin section.',
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
}