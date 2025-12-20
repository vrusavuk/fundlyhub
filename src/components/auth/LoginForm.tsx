import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/services/auth.service';
import { createLoginSchema } from '@/lib/validation/dynamicAuthSchemas';
import { EmailInput } from './EmailInput';
import { PasswordInput } from './PasswordInput';
import { GoogleSignInButton } from './GoogleSignInButton';
import { DisplayHeading, Text } from '@/components/ui/typography';
import type { AuthConfig } from '@/hooks/useAuthConfig';

interface LoginFormProps {
  onToggleMode: () => void;
  config: AuthConfig;
}

export const LoginForm = ({ onToggleMode, config }: LoginFormProps) => {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <DisplayHeading level="md" as="h1">Welcome back</DisplayHeading>
        <Text size="md" emphasis="low">Sign in to your account</Text>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormControl>
                  <EmailInput
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={loading}
                    autoFocus
                  />
                </FormControl>
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
        </form>
      </Form>
    </div>
  );
};
