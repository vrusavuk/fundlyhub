import { z } from 'zod';
import type { AuthConfig } from '@/hooks/useAuthConfig';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const createPasswordSchema = (config: AuthConfig) => {
  let passwordSchema = z.string()
    .min(config.passwordMinLength, `Password must be at least ${config.passwordMinLength} characters`);

  if (config.passwordRequireLetters) {
    passwordSchema = passwordSchema.regex(/[a-zA-Z]/, 'Password must contain at least one letter');
  }

  if (config.passwordRequireNumbers) {
    passwordSchema = passwordSchema.regex(/\d/, 'Password must contain at least one number');
  }

  if (config.passwordRequireSymbols) {
    passwordSchema = passwordSchema.regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one symbol');
  }

  if (config.passwordRequireUppercase) {
    passwordSchema = passwordSchema.regex(/[A-Z]/, 'Password must contain at least one uppercase letter');
  }

  return passwordSchema;
};

export const createLoginSchema = (config: AuthConfig) => {
  return z.object({
    email: z.string().email('Please enter a valid email address'),
    password: createPasswordSchema(config),
  });
};

export const createSignupSchema = (config: AuthConfig) => {
  return z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: createPasswordSchema(config),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
};

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;
export type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>;
