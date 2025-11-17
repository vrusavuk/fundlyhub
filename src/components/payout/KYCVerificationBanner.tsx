import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
} from 'lucide-react';

interface KYCVerificationBannerProps {
  kycStatus: {
    status: string;
    verification_level?: string | null;
    risk_level?: string | null;
    requires_info_details?: string | null;
    rejection_reason?: string | null;
  };
}

export function KYCVerificationBanner({ kycStatus }: KYCVerificationBannerProps) {
  const getStatusConfig = () => {
    switch (kycStatus.status) {
      case 'not_started':
        return {
          icon: ShieldAlert,
          variant: 'default' as const,
          title: 'Identity Verification Available',
          description: 'Identity verification is optional but may be required for high-value payouts ($1,000+) or in certain cases.',
          action: null,
          actionVariant: null,
        };
      case 'pending':
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Verification In Progress',
          description: 'Your identity verification is being reviewed. This usually takes 1-2 business days.',
          action: null,
          actionVariant: null,
        };
      case 'requires_info':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          title: 'Additional Information Required',
          description: kycStatus.requires_info_details || 'Please provide additional information to complete verification.',
          action: 'Provide Information',
          actionVariant: 'destructive' as const,
        };
      case 'rejected':
        return {
          icon: XCircle,
          variant: 'destructive' as const,
          title: 'Verification Rejected',
          description: kycStatus.rejection_reason || 'Your verification was rejected. Please contact support for assistance.',
          action: 'Contact Support',
          actionVariant: 'destructive' as const,
        };
      case 'verified':
        return {
          icon: CheckCircle2,
          variant: 'default' as const,
          title: 'Identity Verified',
          description: 'Your identity has been verified. You can now request payouts.',
          action: null,
          actionVariant: null,
        };
      default:
        return {
          icon: AlertTriangle,
          variant: 'default' as const,
          title: 'Verification Status Unknown',
          description: 'Please contact support to check your verification status.',
          action: 'Contact Support',
          actionVariant: 'default' as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Don't show banner if verified
  if (kycStatus.status === 'verified') {
    return null;
  }

  return (
    <Alert variant={config.variant} className="border-l-4">
      <Icon className="h-5 w-5" />
      <div className="flex items-start justify-between flex-1">
        <div className="flex-1">
          <AlertTitle className="mb-1 flex items-center gap-2">
            {config.title}
            <Badge variant="outline" className="text-xs">
              {kycStatus.status.replace('_', ' ')}
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-sm">
            {config.description}
          </AlertDescription>
          {kycStatus.risk_level && kycStatus.risk_level !== 'low' && (
            <p className="text-xs mt-2 opacity-75">
              Risk Level: {kycStatus.risk_level}
            </p>
          )}
        </div>
        {config.action && (
          <Button
            variant={config.actionVariant}
            size="sm"
            className="ml-4 shrink-0"
            onClick={() => {
              // TODO: Implement KYC verification flow
              console.log('Start KYC verification');
            }}
          >
            {config.action}
          </Button>
        )}
      </div>
    </Alert>
  );
}
