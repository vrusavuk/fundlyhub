import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User, Shield, ArrowRight, Check } from 'lucide-react';

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

const signupSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/\d/, 'Password must contain at least 1 digit')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'credentials'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  // Password validation criteria
  const passwordCriteria = {
    minLength: passwordInput.length >= 8,
    hasLetters: /[a-zA-Z]/.test(passwordInput),
    hasDigit: /\d/.test(passwordInput),
    passwordsMatch: passwordInput === confirmPasswordInput && confirmPasswordInput !== '',
  };
  
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
    mode: 'onSubmit',
  });

  const signupForm = useForm<SignupFormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (data: LoginFormData) => {
    // Manual validation
    const validation = loginSchema.safeParse(data);
    if (!validation.success) {
      validation.error.errors.forEach(err => {
        loginForm.setError(err.path[0] as any, {
          type: 'manual',
          message: err.message,
        });
      });
      return;
    }

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
    // Manual validation
    const validation = signupSchema.safeParse(data);
    if (!validation.success) {
      validation.error.errors.forEach(err => {
        signupForm.setError(err.path[0] as any, {
          type: 'manual',
          message: err.message,
        });
      });
      return;
    }

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

  const handleEmailContinue = () => {
    const result = emailSchema.safeParse({ email: emailInput });
    if (!result.success) {
      setEmailError(result.error.errors[0]?.message || 'Invalid email');
      return;
    }
    
    setEmailError('');
    if (isLogin) {
      loginForm.setValue('email', emailInput);
    } else {
      signupForm.setValue('email', emailInput);
    }
    setStep('credentials');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setStep('email');
    setEmailError('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    loginForm.reset({ email: '', password: '' });
    signupForm.reset({ name: '', email: '', password: '', confirmPassword: '' });
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
      <div className="flex items-center justify-center p-6 sm:p-12 bg-secondary">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">FundlyHub</h1>
          </div>

          <div className="card-enhanced shadow-elevated rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <p className="body-medium text-muted-foreground">
                {step === 'email' 
                  ? `Enter your email to ${isLogin ? 'sign in' : 'get started'}` 
                  : isLogin 
                    ? 'Enter your password'
                    : 'Complete your profile'
                }
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-medium border-2 touch-button"
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center caption-small uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">Or</span>
              </div>
            </div>

            {isLogin ? (
              <>
                {step === 'email' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            setEmailError('');
                          }}
                          placeholder="you@example.com"
                          className="pl-12 h-12 border-2"
                          disabled={loading}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                      {emailError && (
                        <p className="caption-small text-destructive">{emailError}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleEmailContinue}
                      disabled={!emailInput || loading}
                      size="lg"
                      className="w-full"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {step === 'credentials' && (
                  <Form {...loginForm}>
                    <form 
                      onSubmit={loginForm.handleSubmit(handleLogin)} 
                      className="space-y-5 animate-fade-in"
                    >

                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="caption-small text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                        Change email
                      </button>

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Password"
                                  className="pl-12 pr-12 h-12 border-2"
                                  disabled={loading}
                                  autoComplete="current-password"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  tabIndex={-1}
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="caption-small" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Signing in...
                          </>
                        ) : (
                          'Sign in'
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </>
            ) : (
              <>
                {step === 'email' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          type="email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            setEmailError('');
                          }}
                          placeholder="you@example.com"
                          className="pl-12 h-12 border-2"
                          disabled={loading}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                      {emailError && (
                        <p className="caption-small text-destructive">{emailError}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleEmailContinue}
                      disabled={!emailInput || loading}
                      size="lg"
                      className="w-full"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {step === 'credentials' && (
                  <Form {...signupForm}>
                    <form 
                      onSubmit={signupForm.handleSubmit(handleSignup)} 
                      className="space-y-5 animate-fade-in"
                    >

                      <button
                        type="button"
                        onClick={() => setStep('email')}
                        className="caption-small text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <ArrowRight className="h-4 w-4 rotate-180" />
                        Change email
                      </button>

                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  {...field}
                                  placeholder="Full name"
                                  className="pl-12 h-12 border-2"
                                  disabled={loading}
                                  autoComplete="name"
                                  autoFocus
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="caption-small" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Create password"
                                  className="pl-12 pr-12 h-12 border-2"
                                  disabled={loading}
                                  autoComplete="new-password"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setPasswordInput(e.target.value);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  tabIndex={-1}
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="caption-small" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={signupForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="Confirm password"
                                  className="pl-12 pr-12 h-12 border-2"
                                  disabled={loading}
                                  autoComplete="new-password"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setConfirmPasswordInput(e.target.value);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  tabIndex={-1}
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="caption-small" />
                            
                            {/* Password Requirements - shown under both inputs */}
                            <div className="space-y-2 mt-3">
                              <div className="flex items-center gap-2 caption-small">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  passwordCriteria.minLength ? 'bg-green-500' : 'bg-muted'
                                }`}>
                                  {passwordCriteria.minLength && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className={passwordCriteria.minLength ? 'text-green-600' : 'text-muted-foreground'}>
                                  Minimum 8 characters
                                </span>
                              </div>
                              <div className="flex items-center gap-2 caption-small">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  passwordCriteria.hasLetters ? 'bg-green-500' : 'bg-muted'
                                }`}>
                                  {passwordCriteria.hasLetters && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className={passwordCriteria.hasLetters ? 'text-green-600' : 'text-muted-foreground'}>
                                  Contains letters
                                </span>
                              </div>
                              <div className="flex items-center gap-2 caption-small">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  passwordCriteria.hasDigit ? 'bg-green-500' : 'bg-muted'
                                }`}>
                                  {passwordCriteria.hasDigit && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className={passwordCriteria.hasDigit ? 'text-green-600' : 'text-muted-foreground'}>
                                  Contains at least 1 digit
                                </span>
                              </div>
                              <div className="flex items-center gap-2 caption-small">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  passwordCriteria.passwordsMatch ? 'bg-green-500' : 'bg-muted'
                                }`}>
                                  {passwordCriteria.passwordsMatch && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className={passwordCriteria.passwordsMatch ? 'text-green-600' : 'text-muted-foreground'}>
                                  Passwords match
                                </span>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Creating account...
                          </>
                        ) : (
                          'Create account'
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </>
            )}

            <div className="text-center">
              <button
                onClick={toggleMode}
                className="caption-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="font-semibold text-primary">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="caption-small font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="caption-small font-medium">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
