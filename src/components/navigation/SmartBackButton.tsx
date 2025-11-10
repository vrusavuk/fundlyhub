/**
 * Simple back button component for navigation
 */
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/contexts/NavigationContext';

interface SmartBackButtonProps {
  className?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  show?: boolean;
}

export function SmartBackButton({ 
  className, 
  label = 'Back', 
  variant = 'ghost',
  size = 'sm',
  show = true
}: SmartBackButtonProps) {
  const { navigateBack, shouldShowBackButton } = useNavigation();

  if (!show && !shouldShowBackButton) {
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