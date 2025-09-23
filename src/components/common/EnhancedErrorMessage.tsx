/**
 * Enhanced error message component with accessibility and recovery actions
 */
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';
import { cn } from '@/lib/utils';

interface EnhancedErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
  showActions?: boolean;
  retryText?: string;
  icon?: React.ReactNode;
}

export function EnhancedErrorMessage({ 
  title = "Something went wrong",
  message, 
  onRetry, 
  onGoBack,
  onGoHome,
  className,
  variant = 'destructive',
  showActions = true,
  retryText = "Try Again",
  icon
}: EnhancedErrorMessageProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className={cn("max-w-md mx-auto", className)} role="alert">
      <ScreenReaderOnly>
        Error: {message}
      </ScreenReaderOnly>
      
      <Alert variant={variant}>
        {icon || <AlertCircle className="h-4 w-4" aria-hidden="true" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
      </Alert>
      
      {showActions && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          {onRetry && (
            <AccessibleButton 
              onClick={onRetry}
              variant="default"
              size="sm"
              describedBy="retry-description"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              {retryText}
            </AccessibleButton>
          )}
          
          <AccessibleButton 
            onClick={handleGoBack}
            variant="outline"
            size="sm"
            describedBy="back-description"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Back
          </AccessibleButton>
          
          <AccessibleButton 
            onClick={handleGoHome}
            variant="outline" 
            size="sm"
            describedBy="home-description"
          >
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Home
          </AccessibleButton>
        </div>
      )}

      <ScreenReaderOnly>
        <div id="retry-description">
          Click to retry the failed operation
        </div>
        <div id="back-description">
          Click to go back to the previous page
        </div>
        <div id="home-description">
          Click to go back to the home page
        </div>
      </ScreenReaderOnly>
    </div>
  );
}

// Specialized error variants
export function NetworkErrorMessage(props: Omit<EnhancedErrorMessageProps, 'title' | 'variant'>) {
  return (
    <EnhancedErrorMessage
      {...props}
      title="Connection Problem"
      variant="destructive"
      retryText="Retry Connection"
    />
  );
}

export function NotFoundErrorMessage(props: Omit<EnhancedErrorMessageProps, 'title' | 'variant' | 'message'>) {
  return (
    <EnhancedErrorMessage
      {...props}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      variant="default"
      showActions={true}
    />
  );
}

export function PermissionErrorMessage(props: Omit<EnhancedErrorMessageProps, 'title' | 'variant' | 'message'>) {
  return (
    <EnhancedErrorMessage
      {...props}
      title="Access Denied"
      message="You don't have permission to access this resource."
      variant="default"
      showActions={true}
    />
  );
}