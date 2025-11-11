import { Label } from '@/components/ui/label';
import { WIZARD_TYPOGRAPHY } from './designConstants';

interface FieldLabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldLabel({ htmlFor, required, children }: FieldLabelProps) {
  return (
    <Label htmlFor={htmlFor} className={WIZARD_TYPOGRAPHY.fieldLabel}>
      {children}{required && <span className={WIZARD_TYPOGRAPHY.requiredMark}> *</span>}
    </Label>
  );
}
