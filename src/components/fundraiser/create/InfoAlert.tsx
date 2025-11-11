import { Alert, AlertDescription } from '@/components/ui/alert';
import { WIZARD_ALERTS } from './designConstants';

interface InfoAlertProps {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function InfoAlert({ icon: Icon, children, variant = 'info' }: InfoAlertProps) {
  return (
    <Alert className={WIZARD_ALERTS[variant]}>
      <Icon className={WIZARD_ALERTS.icon} />
      <AlertDescription className={WIZARD_ALERTS.description}>
        {children}
      </AlertDescription>
    </Alert>
  );
}
