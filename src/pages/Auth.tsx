import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User, Shield, ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation schemas with progressive validation
const emailSchema = z.object({
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
});

const loginSchema = emailSchema.extend({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
});

const signupSchema = loginSchema.extend({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);
  const [step, setStep] = useState<'email' | 'credentials'>('email');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onChange',
  });

  const currentForm = isLogin ? loginForm : signupForm;

  // Watch email field for validation
  const emailValue = currentForm.watch('email' as any);
  
  useEffect(() => {
    const validateEmail = async () => {
      try {
        emailSchema.parse({ email: emailValue });
        setEmailValidated(true);
      } catch {
        setEmailValidated(false);
        if (step === 'credentials') {
          setStep('email');
        }
      }
    };
    
    if (emailValue) {
      validateEmail();
    } else {
      setEmailValidated(false);
      setStep('email');
    }
  }, [emailValue, step]);

  // Auto-focus password when step changes
  useEffect(() => {
    if (step === 'credentials' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleContinueWithEmail = () => {
    if (emailValidated) {
      setStep('credentials');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setShowPassword(false);
  };

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.name);
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setStep('email');
    setEmailValidated(false);
    currentForm.reset();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Side - Branding & Visual Story */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-primary-foreground/20 backdrop-blur-sm rounded-xl shadow-elegant">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">FundlyHub</h1>
          </div>

          {/* Main Message */}
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              {isLogin ? 'Welcome back!' : 'Start making a difference'}
            </h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              {isLogin 
                ? 'Sign in to access your campaigns, track donations, and continue making an impact.'
                : 'Join thousands of creators raising funds for causes that matter. Your story starts here.'
              }
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Bank-level Security</h3>
              <p className="text-sm text-primary-foreground/70">
                Your data is encrypted and protected with industry-leading security standards
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Quick Setup</h3>
              <p className="text-sm text-primary-foreground/70">
                Create your campaign in minutes and start receiving donations right away
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Progressive Auth Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-gradient-subtle">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-medium">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">FundlyHub</h1>
          </div>

          {/* Auth Card */}
          <div className="card-enhanced shadow-glow rounded-2xl p-8 space-y-6 backdrop-blur-sm border-2">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="heading-medium">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="body-small text-muted-foreground">
                {step === 'email' 
                  ? 'Enter your email to continue' 
                  : isLogin 
                    ? 'Enter your password to sign in'
                    : 'Complete your profile setup'
                }
              </p>
            </div>

            {/* Social Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium border-2 hover-scale touch-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">Or continue with email</span>
              </div>
            </div>

            {/* Progressive Form */}
            <Form {...currentForm}>
              <form 
                onSubmit={currentForm.handleSubmit(isLogin ? handleLogin : handleSignup)} 
                className="space-y-5"
              >
                {/* Email Step */}
                <div className={cn(
                  "space-y-5 transition-all duration-300",
                  step === 'credentials' && "opacity-40 pointer-events-none"
                )}>
                  <FormField
                    control={currentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="label-small font-semibold">Email address</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="you@example.com"
                              className="pl-12 h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all mobile-input-padding"
                              disabled={loading || step === 'credentials'}
                              autoComplete="email"
                              autoFocus
                            />
                            {emailValidated && step === 'email' && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-medium">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="caption-small" />
                      </FormItem>
                    )}
                  />

                  {step === 'email' && (
                    <Button
                      type="button"
                      onClick={handleContinueWithEmail}
                      disabled={!emailValidated || loading}
                      className="w-full h-12 text-base font-semibold cta-primary touch-button shadow-medium hover:shadow-glow transition-all duration-300"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Credentials Step */}
                {step === 'credentials' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      className="caption-small text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 -mt-2 story-link"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      Change email
                    </button>

                    {/* Name Field (Signup Only) */}
                    {!isLogin && (
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="label-small font-semibold">Full name</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                                <Input
                                  {...field}
                                  placeholder="John Doe"
                                  className="pl-12 h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20 mobile-input-padding"
                                  disabled={loading}
                                  autoComplete="name"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="caption-small" />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Password Field */}
                    <FormField
                      control={currentForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="label-small font-semibold">Password</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                              <Input
                                {...field}
                                ref={passwordInputRef}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="pl-12 pr-12 h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-primary/20 mobile-input-padding"
                                disabled={loading}
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="caption-small" />
                          {!isLogin && (
                            <p className="caption-small text-muted-foreground flex items-center gap-1.5 mt-1.5">
                              <Shield className="h-3.5 w-3.5" />
                              Minimum 6 characters
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold cta-primary touch-button shadow-medium hover:shadow-glow transition-all duration-300"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          {isLogin ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          {isLogin ? 'Sign in' : 'Create account'}
                          <Sparkles className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="body-small text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                className="font-semibold text-primary hover:underline focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors story-link"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 caption-small text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Encrypted</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>GDPR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}