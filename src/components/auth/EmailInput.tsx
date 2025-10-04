import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const EmailInput = ({ 
  value, 
  onChange, 
  error, 
  disabled = false,
  autoFocus = false,
  label = "Email address",
  onKeyDown
}: EmailInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">{label}</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pl-10"
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
      </div>
      {error && (
        <p id="email-error" className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
};
