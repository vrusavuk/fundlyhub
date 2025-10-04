import { useMemo } from 'react';
import type { AuthConfig } from './useAuthConfig';

export interface PasswordCriteria {
  minLength: boolean;
  hasLetters: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUppercase: boolean;
  passwordsMatch: boolean;
}

export const usePasswordValidation = (
  password: string,
  confirmPassword: string,
  config: AuthConfig
) => {
  const criteria = useMemo<PasswordCriteria>(() => ({
    minLength: password.length >= config.passwordMinLength,
    hasLetters: config.passwordRequireLetters ? /[a-zA-Z]/.test(password) : true,
    hasNumber: config.passwordRequireNumbers ? /\d/.test(password) : true,
    hasSymbol: config.passwordRequireSymbols ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
    hasUppercase: config.passwordRequireUppercase ? /[A-Z]/.test(password) : true,
    passwordsMatch: password === confirmPassword && confirmPassword !== '',
  }), [password, confirmPassword, config]);

  const isValid = useMemo(() => 
    Object.values(criteria).every(criterion => criterion === true),
    [criteria]
  );

  return { criteria, isValid };
};
