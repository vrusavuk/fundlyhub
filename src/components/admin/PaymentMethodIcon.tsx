/**
 * Payment Method Icon
 * Shows payment method icons like Visa, Mastercard, etc.
 */

import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethodIconProps {
  type: string;
  last4?: string;
  className?: string;
}

export function PaymentMethodIcon({
  type,
  last4,
  className,
}: PaymentMethodIconProps) {
  const getPaymentIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes("visa")) {
      return (
        <span className="text-[#1A1F71] font-bold text-sm">VISA</span>
      );
    }
    
    if (lowerType.includes("mastercard") || lowerType.includes("master")) {
      return (
        <span className="flex items-center gap-0.5">
          <span className="w-3 h-3 rounded-full bg-[#EB001B]" />
          <span className="w-3 h-3 rounded-full bg-[#FF5F00] -ml-1.5" />
        </span>
      );
    }
    
    if (lowerType.includes("amex") || lowerType.includes("american")) {
      return (
        <span className="text-[#006FCF] font-bold text-sm">AMEX</span>
      );
    }
    
    return <CreditCard className="h-4 w-4 text-[#425466]" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center w-8 h-6 bg-white border border-[#E3E8EE] rounded">
        {getPaymentIcon(type)}
      </div>
      {last4 && (
        <span className="text-sm text-[#425466]">
          •••• {last4}
        </span>
      )}
    </div>
  );
}
