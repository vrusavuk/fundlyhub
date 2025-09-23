/**
 * Example of mobile-optimized form usage
 * This demonstrates how to use the mobile form utilities
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { MobileOptimizedForm } from './MobileOptimizedForm';
import { MobileOptimizedInput } from './MobileOptimizedInput';
import { useMobileForm } from '@/hooks/useMobileForm';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  amount: string;
}

export function MobileFormExample() {
  const { toast } = useToast();
  
  const form = useMobileForm<FormData>(
    {
      name: '',
      email: '',
      phone: '',
      amount: ''
    },
    {
      name: { required: true, minLength: 2 },
      email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      phone: { required: true, pattern: /^\+?[\d\s\-\(\)]+$/ },
      amount: { required: true, pattern: /^\d+(\.\d{2})?$/ }
    },
    {
      enableHapticFeedback: true,
      validateOnBlur: true,
      autoFocusFirst: true
    }
  );

  const handleSubmit = async (values: FormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Success!",
      description: "Form submitted successfully with mobile-optimized UX.",
    });
    
    console.log('Form values:', values);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-6">Mobile-Optimized Form</h2>
      
      <MobileOptimizedForm
        onSubmit={() => form.handleSubmit(handleSubmit)}
        loading={form.isSubmitting}
        containerClassName="mobile-form-spacing"
      >
        <MobileOptimizedInput
          label="Full Name"
          name="name"
          fieldType="text"
          placeholder="Enter your full name"
          value={form.getValue('name')}
          onChange={(e) => form.setValue('name', e.target.value)}
          onBlur={() => form.handleBlur('name')}
          error={form.getError('name')}
          autoComplete="name"
        />

        <MobileOptimizedInput
          label="Email Address"
          name="email"
          fieldType="email"
          placeholder="Enter your email"
          value={form.getValue('email')}
          onChange={(e) => form.setValue('email', e.target.value)}
          onBlur={() => form.handleBlur('email')}
          error={form.getError('email')}
          autoComplete="email"
        />

        <MobileOptimizedInput
          label="Phone Number"
          name="phone"
          fieldType="phone"
          placeholder="Enter your phone number"
          value={form.getValue('phone')}
          onChange={(e) => form.setValue('phone', e.target.value)}
          onBlur={() => form.handleBlur('phone')}
          error={form.getError('phone')}
          autoComplete="tel"
        />

        <MobileOptimizedInput
          label="Amount"
          name="amount"
          fieldType="currency"
          placeholder="0.00"
          value={form.getValue('amount')}
          onChange={(e) => form.setValue('amount', e.target.value)}
          onBlur={() => form.handleBlur('amount')}
          error={form.getError('amount')}
        />

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full touch-button"
            disabled={!form.isValid || form.isSubmitting}
            size="lg"
          >
            {form.isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Form State Debug:</p>
          <p>Valid: {form.isValid ? '✅' : '❌'}</p>
          <p>Dirty: {form.isDirty ? '✅' : '❌'}</p>
          <p>Mobile: {form.isMobile ? '📱' : '💻'}</p>
        </div>
      </MobileOptimizedForm>
    </div>
  );
}