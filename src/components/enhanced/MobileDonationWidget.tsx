/**
 * Mobile-enhanced donation widget with improved UX
 * Demonstrates the mobile optimization improvements from Phase 2
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MobileEnhancedButton } from './MobileEnhancedButton';
import { MobileOptimizedInput } from '../forms/MobileOptimizedInput';
import { MobileOptimizedForm } from '../forms/MobileOptimizedForm';
import { useMobileForm } from '@/hooks/useMobileForm';
import { formatCurrency } from '@/lib/utils/formatters';
import { hapticFeedback, breakpointUtils } from '@/lib/utils/mobile';
import { cn } from '@/lib/utils';

interface MobileDonationWidgetProps {
  fundraiserId: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  progressPercentage: number;
  currency?: string;
  onDonate: (amount: number, tipAmount?: number) => void;
  loading?: boolean;
}

const suggestedAmounts = [25, 50, 100, 250, 500];

export function MobileDonationWidget({
  fundraiserId,
  title,
  creatorName,
  creatorAvatar,
  goalAmount,
  raisedAmount,
  donorCount,
  progressPercentage,
  currency = 'USD',
  onDonate,
  loading = false,
}: MobileDonationWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [tipPercentage, setTipPercentage] = useState(0);
  const isMobile = breakpointUtils.isMobile();

  const form = useMobileForm(
    {
      customAmount: '',
      donorName: '',
      message: ''
    },
    {
      customAmount: { 
        pattern: /^\d+(\.\d{0,2})?$/ 
      },
      donorName: { 
        minLength: 2 
      }
    },
    {
      enableHapticFeedback: true,
      validateOnBlur: true
    }
  );

  const currentAmount = selectedAmount || parseFloat(form.getValue('customAmount')) || 0;
  const tipAmount = Math.round(currentAmount * (tipPercentage / 100) * 100) / 100;
  const totalAmount = currentAmount + tipAmount;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    form.setValue('customAmount', '');
    setShowTip(true);
    hapticFeedback.light();
  };

  const handleCustomAmount = (value: string) => {
    form.setValue('customAmount', value);
    setSelectedAmount(null);
    setShowTip(value !== '' && !form.getError('customAmount'));
  };

  const handleTipSelect = (percentage: number) => {
    setTipPercentage(percentage);
    hapticFeedback.light();
  };

  const handleDonate = async () => {
    if (currentAmount > 0) {
      hapticFeedback.success();
      onDonate(currentAmount, tipAmount);
    }
  };

  return (
    <Card className={cn(
      "w-full max-w-md mx-auto",
      isMobile ? "mobile-card-spacing" : "p-6"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback>{creatorName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground">by {creatorName}</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Raised</span>
            <span className="font-medium">
              {formatCurrency(raisedAmount)} of {formatCurrency(goalAmount)}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {donorCount} donor{donorCount !== 1 ? 's' : ''}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Choose amount</h4>
          
          {/* Suggested Amounts */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {suggestedAmounts.map((amount) => (
              <MobileEnhancedButton
                key={amount}
                variant={selectedAmount === amount ? "default" : "outline"}
                className="h-12 sm:h-10 text-base sm:text-sm font-medium"
                onClick={() => handleAmountSelect(amount)}
                hapticType="light"
                touchSize="md"
              >
                ${amount}
              </MobileEnhancedButton>
            ))}
          </div>

          {/* Custom Amount */}
          <MobileOptimizedInput
            label="Custom amount"
            fieldType="currency"
            placeholder="Enter amount"
            value={form.getValue('customAmount')}
            onChange={(e) => handleCustomAmount(e.target.value)}
            onBlur={() => form.handleBlur('customAmount')}
            error={form.getError('customAmount')}
            containerClassName="space-y-2"
          />
        </div>

        {/* Tip Selection */}
        {showTip && currentAmount > 0 && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Add a tip for FundlyHub?</h4>
            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 10, 15].map((percentage) => (
                <MobileEnhancedButton
                  key={percentage}
                  variant={tipPercentage === percentage ? "default" : "outline"}
                  size="sm"
                  className="h-10 text-sm"
                  onClick={() => handleTipSelect(percentage)}
                  hapticType="light"
                >
                  {percentage === 0 ? 'No tip' : `${percentage}%`}
                </MobileEnhancedButton>
              ))}
            </div>
            {tipAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                Tip: {formatCurrency(tipAmount)}
              </p>
            )}
          </div>
        )}

        {/* Optional Fields */}
        <div className="space-y-4">
          <MobileOptimizedInput
            label="Your name (optional)"
            fieldType="text"
            placeholder="Anonymous"
            value={form.getValue('donorName')}
            onChange={(e) => form.setValue('donorName', e.target.value)}
            onBlur={() => form.handleBlur('donorName')}
            error={form.getError('donorName')}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Message (optional)</label>
            <textarea
              placeholder="Leave a message of support..."
              value={form.getValue('message')}
              onChange={(e) => form.setValue('message', e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 text-base sm:text-sm border border-input rounded-md bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 touch-manipulation"
              maxLength={500}
            />
          </div>
        </div>

        {/* Total and Donate Button */}
        <div className="space-y-4 pt-4 border-t">
          {currentAmount > 0 && (
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          )}
          
          <MobileEnhancedButton
            className="w-full h-12 sm:h-11 text-base font-semibold"
            size="lg"
            disabled={currentAmount <= 0 || loading}
            onClick={handleDonate}
            hapticType="medium"
            touchSize="lg"
          >
            {loading ? 'Processing...' : `Donate ${formatCurrency(totalAmount || 0)}`}
          </MobileEnhancedButton>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By donating, you agree to our terms. Your donation will help support this cause.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}