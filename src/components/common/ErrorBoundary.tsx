/**
 * Enterprise-level error boundary with proper error handling and accessibility
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppError, ErrorType, ErrorSeverity, shouldLogError } from '@/lib/errors/AppError';
import { ScreenReaderOnly } from '@/components/accessibility/ScreenReaderOnly';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Enhanced error logging
    const appError = error instanceof AppError ? error : new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false,
      undefined,
      ErrorType.CLIENT,
      ErrorSeverity.HIGH,
      'An unexpected error occurred'
    );

    if (shouldLogError(appError)) {
      // Report to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Integrate with error tracking service (e.g., Sentry)
        console.error('Production error:', appError.toJSON());
      }
    }

    // Announce error to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'An error has occurred. Please try refreshing the page.';
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userMessage = this.state.error instanceof AppError 
        ? this.state.error.userMessage 
        : 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';

      const isRetryable = this.state.error instanceof AppError 
        ? this.state.error.retryable 
        : true;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4" role="alert">
          <div className="max-w-md w-full">
            <ScreenReaderOnly>
              Error: {userMessage}
            </ScreenReaderOnly>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {userMessage}
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex gap-2 justify-center">
              {isRetryable && (
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  aria-describedby="error-retry-description"
                >
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Try Again
                </Button>
              )}
              <Button 
                onClick={() => window.location.reload()}
                size="sm"
                aria-describedby="error-refresh-description"
              >
                Refresh Page
              </Button>
            </div>

            <ScreenReaderOnly>
              <div id="error-retry-description">
                Click to retry the failed operation
              </div>
              <div id="error-refresh-description">
                Click to refresh the entire page
              </div>
            </ScreenReaderOnly>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-muted rounded-md text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}