import { Check, X } from 'lucide-react';
import type { PasswordCriteria } from '@/hooks/usePasswordValidation';
import type { AuthConfig } from '@/hooks/useAuthConfig';

interface PasswordStrengthIndicatorProps {
  criteria: PasswordCriteria;
  config: AuthConfig;
  showMatchCriteria?: boolean;
}

export const PasswordStrengthIndicator = ({ 
  criteria, 
  config,
  showMatchCriteria = false 
}: PasswordStrengthIndicatorProps) => {
  const criteriaList = [
    { 
      key: 'minLength', 
      label: `At least ${config.passwordMinLength} characters`, 
      met: criteria.minLength,
      show: true 
    },
    { 
      key: 'hasLetters', 
      label: 'Contains letters', 
      met: criteria.hasLetters,
      show: config.passwordRequireLetters 
    },
    { 
      key: 'hasNumber', 
      label: 'Contains at least 1 number', 
      met: criteria.hasNumber,
      show: config.passwordRequireNumbers 
    },
    { 
      key: 'hasSymbol', 
      label: 'Contains at least 1 symbol', 
      met: criteria.hasSymbol,
      show: config.passwordRequireSymbols 
    },
    { 
      key: 'hasUppercase', 
      label: 'Contains uppercase letter', 
      met: criteria.hasUppercase,
      show: config.passwordRequireUppercase 
    },
    { 
      key: 'passwordsMatch', 
      label: 'Passwords match', 
      met: criteria.passwordsMatch,
      show: showMatchCriteria 
    },
  ];

  const visibleCriteria = criteriaList.filter(c => c.show);

  return (
    <div 
      className="space-y-2 text-sm"
      role="status"
      aria-live="polite"
      aria-label="Password requirements"
    >
      <p className="font-medium text-muted-foreground">Password must contain:</p>
      {visibleCriteria.map((criterion) => (
        <div 
          key={criterion.key} 
          className="flex items-center gap-2"
          aria-label={`${criterion.label}: ${criterion.met ? 'met' : 'not met'}`}
        >
          {criterion.met ? (
            <Check className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className={criterion.met ? 'text-success' : 'text-muted-foreground'}>
            {criterion.label}
          </span>
        </div>
      ))}
    </div>
  );
};
