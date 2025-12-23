/**
 * Payment Complete Page
 * Comprehensive thank you page with receipt details, download, and email functionality
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, Clock, ArrowLeft, Download, Mail, Share2 } from 'lucide-react';
import { logger } from '@/lib/services/logger.service';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type PaymentStatus = 'loading' | 'succeeded' | 'processing' | 'failed';

interface DonationDetails {
  id: string;
  amount: number;
  tip_amount: number;
  currency: string;
  donor_name: string | null;
  donor_email: string | null;
  is_anonymous: boolean;
  receipt_id: string | null;
  payment_method_type: string | null;
  card_brand: string | null;
  card_last4: string | null;
  created_at: string;
  campaign_title: string;
  campaign_slug: string;
}

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PaymentComplete() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      const paymentIntentId = searchParams.get('payment_intent');
      const redirectStatus = searchParams.get('redirect_status');

      if (!paymentIntentClientSecret && !paymentIntentId) {
        setStatus('failed');
        setMessage('Invalid payment session. Please try again.');
        return;
      }

      // Quick check based on redirect_status
      if (redirectStatus === 'failed') {
        setStatus('failed');
        setMessage('Payment was not completed. Please try again.');
        return;
      }

      // For succeeded or other statuses, verify with Stripe and fetch donation details
      try {
        let finalPaymentIntentId = paymentIntentId;
        
        if (!finalPaymentIntentId && paymentIntentClientSecret) {
          const stripe = await stripePromise;
          if (stripe) {
            const { paymentIntent } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
            if (paymentIntent) {
              finalPaymentIntentId = paymentIntent.id;
              
              if (paymentIntent.status === 'processing') {
                setStatus('processing');
                setMessage('Your payment is being processed. This may take a few moments for bank transfers.');
              } else if (paymentIntent.status === 'requires_payment_method') {
                setStatus('failed');
                setMessage('Payment was not completed. Please try again with a different payment method.');
                return;
              } else if (paymentIntent.status !== 'succeeded') {
                setStatus('failed');
                setMessage('Something went wrong. Please try again.');
                return;
              }
            }
          }
        }

        // Fetch donation details from database
        if (finalPaymentIntentId) {
          // Wait a moment for webhook to process
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: donationData, error } = await supabase
            .from('donations')
            .select(`
              id,
              amount,
              tip_amount,
              currency,
              donor_name,
              donor_email,
              is_anonymous,
              receipt_id,
              payment_method_type,
              card_brand,
              card_last4,
              created_at,
              fundraiser:fundraisers(title, slug)
            `)
            .eq('receipt_id', finalPaymentIntentId)
            .maybeSingle();

          if (donationData) {
            setDonation({
              id: donationData.id,
              amount: donationData.amount,
              tip_amount: donationData.tip_amount || 0,
              currency: donationData.currency || 'USD',
              donor_name: donationData.donor_name,
              donor_email: donationData.donor_email,
              is_anonymous: donationData.is_anonymous,
              receipt_id: donationData.receipt_id,
              payment_method_type: donationData.payment_method_type,
              card_brand: donationData.card_brand,
              card_last4: donationData.card_last4,
              created_at: donationData.created_at,
              campaign_title: (donationData.fundraiser as any)?.title || 'Campaign',
              campaign_slug: (donationData.fundraiser as any)?.slug || '',
            });
            
            if (donationData.donor_email) {
              setEmailInput(donationData.donor_email);
            }
          }
        }

        if (redirectStatus === 'succeeded' || status !== 'processing') {
          setStatus('succeeded');
          setMessage('Your donation has been received. Thank you for your generosity!');
        }
      } catch (error) {
        logger.error('Error checking payment status', error as Error);
        // Still show success if redirect_status was succeeded
        if (redirectStatus === 'succeeded') {
          setStatus('succeeded');
          setMessage('Your donation has been received. Thank you for your generosity!');
        } else {
          setStatus('failed');
          setMessage('Unable to verify payment status. Please check your email for confirmation.');
        }
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const getFundraiserUrl = () => {
    if (donation?.campaign_slug) {
      return `/fundraiser/${donation.campaign_slug}`;
    }
    const returnTo = searchParams.get('return_to');
    if (returnTo) {
      return returnTo;
    }
    return '/campaigns';
  };

  const handleDownloadReceipt = () => {
    if (!donation) return;
    
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to download the receipt",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = donation.amount + donation.tip_amount;
    const paymentDisplay = donation.card_brand && donation.card_last4 
      ? `${donation.card_brand} •••• ${donation.card_last4}`
      : donation.payment_method_type || 'Card';

    receiptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Donation Receipt - ${donation.campaign_title}</title>
        <style>
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #111827; }
          .header { text-align: center; margin-bottom: 32px; }
          .check-icon { width: 64px; height: 64px; background: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; }
          h1 { margin: 0; font-size: 28px; color: #111827; }
          .subtitle { color: #6b7280; margin-top: 8px; }
          .campaign { background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
          .campaign-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .campaign-title { font-size: 18px; font-weight: 600; margin-top: 4px; }
          .details { background: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
          .details-header { font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; }
          .row-label { color: #6b7280; }
          .row-value { font-weight: 500; }
          .total-row { border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 12px; }
          .total-row .row-label { font-weight: 600; color: #111827; }
          .total-row .row-value { color: #10b981; font-weight: 700; font-size: 18px; }
          .meta { font-size: 13px; margin-bottom: 24px; }
          .meta .row { padding: 6px 0; }
          .footer { text-align: center; color: #9ca3af; font-size: 12px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="check-icon">✓</div>
          <h1>Thank You!</h1>
          <p class="subtitle">Your donation has been received</p>
        </div>
        
        <div class="campaign">
          <div class="campaign-label">Campaign</div>
          <div class="campaign-title">${donation.campaign_title}</div>
        </div>
        
        <div class="details">
          <div class="details-header">Receipt Details</div>
          <div class="row">
            <span class="row-label">Donation Amount</span>
            <span class="row-value">${formatCurrency(donation.amount, donation.currency)}</span>
          </div>
          ${donation.tip_amount > 0 ? `
          <div class="row">
            <span class="row-label">Platform Tip</span>
            <span class="row-value">${formatCurrency(donation.tip_amount, donation.currency)}</span>
          </div>
          ` : ''}
          <div class="row total-row">
            <span class="row-label">Total</span>
            <span class="row-value">${formatCurrency(totalAmount, donation.currency)}</span>
          </div>
        </div>
        
        <div class="meta">
          <div class="row">
            <span class="row-label">Date</span>
            <span class="row-value">${formatDate(donation.created_at)}</span>
          </div>
          <div class="row">
            <span class="row-label">Payment Method</span>
            <span class="row-value">${paymentDisplay}</span>
          </div>
          <div class="row">
            <span class="row-label">Receipt #</span>
            <span class="row-value" style="font-family: monospace;">${donation.receipt_id?.slice(0, 20) || donation.id.slice(0, 8)}...</span>
          </div>
          <div class="row">
            <span class="row-label">Donor</span>
            <span class="row-value">${donation.is_anonymous ? 'Anonymous Donor' : donation.donor_name || 'Generous Donor'}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>This receipt confirms your donation. Please save it for your records.</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 24px;">
          <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  const handleSendEmail = async () => {
    if (!emailInput || !donation) return;
    
    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-receipt-email', {
        body: {
          recipient_email: emailInput,
          receipt_data: {
            donor_name: donation.donor_name || 'Generous Donor',
            amount: donation.amount,
            tip_amount: donation.tip_amount,
            currency: donation.currency,
            campaign_title: donation.campaign_title,
            campaign_slug: donation.campaign_slug,
            receipt_id: donation.receipt_id || donation.id,
            payment_method: donation.payment_method_type,
            card_brand: donation.card_brand,
            card_last4: donation.card_last4,
            created_at: donation.created_at,
            is_anonymous: donation.is_anonymous,
          },
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Receipt sent!",
        description: `A receipt has been sent to ${emailInput}`,
      });
    } catch (error) {
      logger.error('Error sending receipt email', error as Error);
      toast({
        title: "Failed to send receipt",
        description: "Please try again or download the receipt instead",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShare = async () => {
    const url = donation?.campaign_slug 
      ? `${window.location.origin}/fundraiser/${donation.campaign_slug}`
      : window.location.origin;
      
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I just donated to ${donation?.campaign_title || 'a campaign'}!`,
          text: 'Join me in supporting this cause!',
          url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Campaign link copied to clipboard",
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'succeeded':
        return <CheckCircle2 className="h-16 w-16 text-green-500" />;
      case 'processing':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying Payment...';
      case 'succeeded':
        return 'Thank You!';
      case 'processing':
        return 'Payment Processing';
      case 'failed':
        return 'Payment Failed';
    }
  };

  const totalAmount = donation ? donation.amount + donation.tip_amount : 0;
  const paymentDisplay = donation?.card_brand && donation?.card_last4 
    ? `${donation.card_brand} •••• ${donation.card_last4}`
    : donation?.payment_method_type || 'Card';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h1 className="text-2xl font-bold">{getStatusTitle()}</h1>
          <p className="text-muted-foreground">{message}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Receipt Details - Only show on success with donation data */}
          {status === 'succeeded' && donation && (
            <>
              {/* Campaign Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Campaign</p>
                <p className="text-lg font-semibold mt-1">{donation.campaign_title}</p>
              </div>

              {/* Amount Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border pb-2">
                  Receipt Details
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Donation Amount</span>
                  <span className="font-medium">{formatCurrency(donation.amount, donation.currency)}</span>
                </div>
                {donation.tip_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Tip</span>
                    <span className="font-medium">{formatCurrency(donation.tip_amount, donation.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg text-green-600">{formatCurrency(totalAmount, donation.currency)}</span>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{formatDate(donation.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span>{paymentDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt #</span>
                  <span className="font-mono text-xs">{(donation.receipt_id || donation.id).slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Donor</span>
                  <span>{donation.is_anonymous ? 'Anonymous Donor' : donation.donor_name || 'Generous Donor'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownloadReceipt}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Email Receipt */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Email receipt to:</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    disabled={isSendingEmail || emailSent}
                  />
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={!emailInput || isSendingEmail || emailSent}
                    variant={emailSent ? "outline" : "default"}
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : emailSent ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {emailSent && (
                  <p className="text-xs text-green-600">Receipt sent to {emailInput}</p>
                )}
              </div>
            </>
          )}

          {/* Processing Notice */}
          {status === 'processing' && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Bank transfers typically take 1-3 business days to complete.
                You'll receive an email once the transfer is confirmed.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate(getFundraiserUrl())} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Campaign
            </Button>
            
            {status === 'failed' && (
              <Button variant="outline" onClick={() => navigate(-1)}>
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
