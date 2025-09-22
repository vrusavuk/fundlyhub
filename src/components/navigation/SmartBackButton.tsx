/**
 * Smart back button component for linear navigation flows
 */
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

interface SmartBackButtonProps {
  className?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

export function SmartBackButton({ 
  className, 
  label = 'Back', 
  variant = 'ghost',
  size = 'sm' 
}: SmartBackButtonProps) {
  const { navigateBack } = useNavigation();
  const { shouldShowBackButton } = useSmartNavigation();

  if (!shouldShowBackButton) {
    return null;
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={navigateBack}
      className={`mb-4 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}