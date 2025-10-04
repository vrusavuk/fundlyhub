import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAuthConfig } from '@/hooks/useAuthConfig';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Shield, Check } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const { config, loading: configLoading } = useAuthConfig();

  // Redirect to home if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Show loading state while fetching auth configuration
  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-primary p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-foreground/20 backdrop-blur-sm rounded-xl">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FundlyHub</h1>
          </div>

          <div className="space-y-6 max-w-lg">
            <h2 className="text-5xl font-bold leading-tight">
              {isLogin ? 'Welcome back' : 'Start your journey'}
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              {isLogin 
                ? 'Continue making an impact with your campaigns and donations.'
                : 'Join creators raising funds for causes that matter. Your story starts here.'
              }
            </p>
          </div>
        </div>

        <div className="relative z-10 grid gap-3">
          <div className="flex items-center gap-3 p-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Bank-level security & encryption</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20">
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Launch campaigns in minutes</span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">FundlyHub</h1>
          </div>

          <Card className="shadow-lg rounded-2xl p-8 bg-card">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} config={config} />
            ) : (
              <SignupForm onToggleMode={toggleMode} config={config} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
