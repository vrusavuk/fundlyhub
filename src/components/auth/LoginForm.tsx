import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/services/auth.service';
import { createLoginSchema, emailSchema } from '@/lib/validation/dynamicAuthSchemas';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { AuthConfig } from '@/hooks/useAuthConfig';

interface LoginFormProps {
  onToggleMode: () => void;
  config: AuthConfig;
}

export const LoginForm = ({ onToggleMode, config }: LoginFormProps) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const loginSchema = createLoginSchema(config);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleEmailContinue = () => {
    const validation = emailSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }
    setEmailError('');
    form.setValue('email', emailInput);
    setStep('password');
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authService.signIn(data);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await authService.signInWithGoogle();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Google sign-in failed",
          description: result.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">Enter your email to sign in to your account</p>
        </div>

        <div className="space-y-4">
          <EmailInput
            value={emailInput}
            onChange={setEmailInput}
            error={emailError}
            disabled={loading}
            autoFocus
          />

          <Button 
            onClick={handleEmailContinue} 
            className="w-full" 
            disabled={loading}
          >
            Continue
          </Button>

          <GoogleSignInButton onSignIn={handleGoogleSignIn} disabled={loading} />

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setStep('email')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={loading}
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Enter your password</h1>
        <p className="text-sm text-muted-foreground">{emailInput}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    id="password"
                    label="Password"
                    value={field.value}
                    onChange={field.onChange}
                    showPassword={showPassword}
                    onToggleVisibility={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    error={fieldState.error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </form>
      </Form>
    </div>
  );
};
