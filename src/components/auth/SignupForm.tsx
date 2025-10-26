import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { authService } from '@/lib/services/auth.service';
import { createSignupSchema, emailSchema } from '@/lib/validation/dynamicAuthSchemas';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { AuthConfig } from '@/hooks/useAuthConfig';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { DisplayHeading, Text, Caption } from '@/components/ui/typography';

interface SignupFormProps {
  onToggleMode: () => void;
  config: AuthConfig;
}

export const SignupForm = ({ onToggleMode, config }: SignupFormProps) => {
  const [step, setStep] = useState<'email' | 'credentials'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { canRegister, getDisabledMessage } = useFeatureFlags();

  // Check if registration is enabled
  if (!canRegister) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <DisplayHeading level="md" as="h1">Create an account</DisplayHeading>
        </div>
        <Alert variant="destructive" className="bg-muted border-border">
          <Lock className="h-4 w-4" />
          <AlertTitle>Registration Disabled</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            {getDisabledMessage('features.user_registration')}
          </AlertDescription>
        </Alert>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  const signupSchema = createSignupSchema(config);
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = form.watch('password');
  const confirmPasswordValue = form.watch('confirmPassword');
  const { criteria } = usePasswordValidation(passwordValue, confirmPasswordValue, config);

  const handleEmailContinue = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const validation = emailSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      setEmailError(validation.error.errors[0].message);
      return;
    }
    setEmailError('');
    form.setValue('email', emailInput);
    setStep('credentials');
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleEmailContinue();
    }
  };

  const handleSignup = async (data: { name: string; email: string; password: string; confirmPassword: string }) => {
    setLoading(true);
    try {
      const result = await authService.signUp({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      
      if (result.success) {
        toast({
          title: "Account created!",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Signup failed",
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
          <DisplayHeading level="md" as="h1">Create an account</DisplayHeading>
          <Text size="md" emphasis="low">Enter your email to get started</Text>
        </div>

        <form onSubmit={handleEmailContinue} className="space-y-4">
          <EmailInput
            value={emailInput}
            onChange={setEmailInput}
            onKeyDown={handleEmailKeyDown}
            error={emailError}
            disabled={loading}
            autoFocus
          />

          <Button 
            type="submit"
            className="w-full" 
            disabled={loading}
          >
            Continue
          </Button>

          <GoogleSignInButton onSignIn={handleGoogleSignIn} disabled={loading} />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </form>
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
        <DisplayHeading level="md" as="h1">Complete your profile</DisplayHeading>
        <Caption size="sm">{emailInput}</Caption>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <Label htmlFor="name">Full name</Label>
                <FormControl>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    {...field}
                    disabled={loading}
                    aria-invalid={!!fieldState.error}
                  />
                </FormControl>
                {fieldState.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {fieldState.error.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    id="password"
                    label="Create password"
                    value={field.value}
                    onChange={field.onChange}
                    showPassword={showPassword}
                    onToggleVisibility={() => setShowPassword(!showPassword)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={loading}
                    error={fieldState.error?.message}
                    aria-describedby="password-criteria"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    id="confirmPassword"
                    label="Confirm password"
                    value={field.value}
                    onChange={field.onChange}
                    showPassword={showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={loading}
                    error={fieldState.error?.message}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div id="password-criteria">
            <PasswordStrengthIndicator 
              criteria={criteria} 
              config={config}
              showMatchCriteria 
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </form>
      </Form>
    </div>
  );
};
