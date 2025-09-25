import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC } from '@/hooks/useRBAC';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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

  const loading = authLoading || rbacLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
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