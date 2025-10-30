# Stripe Payment Integration

## Overview

This project integrates Stripe for secure payment processing with a complete donation flow including webhook handling, automatic database updates, and event-driven architecture.

## Architecture

```
Frontend → Edge Function (create-payment-intent) → Stripe API
                                                       ↓
                                            Payment Processing
                                                       ↓
Stripe Webhook → Edge Function (stripe-webhook) → Database → Event Bus
```

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard:
   - **Test Mode**: Use for development
   - **Live Mode**: Use for production

### 2. Configure Secrets (Already Done)

The following secrets have been added to Supabase:
- ✅ `STRIPE_SECRET_KEY` - Your Stripe secret key
- ✅ `STRIPE_WEBHOOK_SECRET` - Will be configured after webhook setup

### 3. Configure Webhook in Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter webhook URL:
   ```
   https://sgcaqrtnxqhrrqzxmupa.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Update the `STRIPE_WEBHOOK_SECRET` in Supabase secrets

### 4. Update Frontend Publishable Key

In production, update the publishable key in:
- `src/lib/services/stripe.service.ts` (line 22)
- `src/components/DonationWidgetWithStripe.tsx` (line 19)

Replace with your live publishable key from Stripe Dashboard.

## Components

### Edge Functions

#### `create-payment-intent`
- **Purpose**: Create a Stripe PaymentIntent for donations
- **Authentication**: Public (no JWT required)
- **Input**:
  ```typescript
  {
    fundraiser_id: string;
    amount: number;        // in cents
    tip_amount?: number;   // in cents
    currency?: string;     // default: 'USD'
    donor_email?: string;
    donor_name?: string;
    is_anonymous?: boolean;
  }
  ```
- **Output**:
  ```typescript
  {
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    stripe_fee: number;
    net_amount: number;
  }
  ```

#### `stripe-webhook`
- **Purpose**: Handle Stripe webhook events
- **Authentication**: Verified by Stripe signature
- **Events Handled**:
  - `payment_intent.succeeded` → Creates donation record
  - `payment_intent.payment_failed` → Logs failure
  - `charge.refunded` → Updates donation status

### Frontend Components

#### `DonationWidgetWithStripe`
- Complete donation flow UI
- Amount selection with suggested amounts
- Custom amount input
- Tip calculator with slider
- Anonymous donation toggle
- Integration with Stripe Elements

#### `StripePaymentForm`
- Stripe card input (CardElement)
- Billing details collection
- Payment processing
- 3D Secure support
- Error handling

### Services & Hooks

#### `StripeService`
- Initialize Stripe.js
- Create payment intents
- Confirm card payments
- Format amounts
- Error handling

#### `useStripePayment`
- Payment intent creation
- Payment processing
- Loading states
- Error management
- Toast notifications

## Database Schema

The `donations` table includes Stripe-specific fields:
- `payment_provider` - Set to 'stripe'
- `payment_status` - 'pending', 'paid', 'failed', 'refunded'
- `receipt_id` - Stripe PaymentIntent ID
- `stripe_payment_intent_id` - (optional) Explicit reference
- `stripe_customer_id` - (optional) For recurring donations

## Fee Structure

### Stripe Fees
- **Rate**: 2.9% + $0.30 per successful transaction
- **Example**: $100 donation = $3.20 Stripe fee

### Platform Tips (Optional)
- Donors can add optional tip (0-25%)
- Tips support platform operations
- 100% of donation goes to campaign

### Calculation Example
```
Donation Amount: $100.00
Platform Tip:     $15.00 (15%)
─────────────────────────
Subtotal:        $115.00
Stripe Fee:        $3.64
Net to Campaign: $111.36
```

## Testing

### Test Cards (Stripe Test Mode)

| Card Number         | Scenario           |
|---------------------|-------------------|
| 4242 4242 4242 4242 | Success           |
| 4000 0025 0000 3155 | 3D Secure Auth    |
| 4000 0000 0000 9995 | Declined          |
| 4000 0000 0000 0341 | Attach & Decline  |

### Test Flow

1. Navigate to a fundraiser page
2. Click "Donate" button
3. Select or enter amount
4. Adjust tip (optional)
5. Toggle anonymous (optional)
6. Click "Continue to Payment"
7. Enter test card: `4242 4242 4242 4242`
8. Enter any future expiry date
9. Enter any 3-digit CVC
10. Click "Donate"
11. Verify success toast
12. Check database for donation record

## Security Features

### Payment Security
- ✅ PCI DSS compliant (Stripe handles card data)
- ✅ Webhook signature verification
- ✅ No card data touches our servers
- ✅ Secure secrets management

### Input Validation
- Minimum donation: $1.00 (100 cents)
- Maximum donation: Configurable
- Email validation for non-anonymous donations
- Fundraiser status validation

### Rate Limiting
- Edge function automatic rate limiting
- Stripe built-in fraud detection
- Duplicate payment prevention

## Event-Driven Architecture

### Domain Events
The integration publishes events to the event bus:
- `donation.initiated` - When payment intent is created
- `donation.completed` - When payment succeeds
- `donation.failed` - When payment fails
- `donation.refunded` - When charge is refunded

### Event Subscribers
These events can trigger:
- Email notifications
- Analytics tracking
- Fundraiser statistics updates
- Real-time UI updates

## Error Handling

### Payment Failures
- Card declined
- Insufficient funds
- Network errors
- 3D Secure cancellation

### User Experience
- Clear error messages
- Retry mechanism
- Back button for amount changes
- Loading states during processing

## Monitoring & Logging

### Edge Function Logs
View logs in Supabase Dashboard:
- Function: `create-payment-intent`
- Function: `stripe-webhook`

### Stripe Dashboard
Monitor in Stripe Dashboard:
- Payments
- Customers
- Webhooks
- Logs

## Going Live Checklist

- [ ] Test all payment flows in test mode
- [ ] Test webhook delivery
- [ ] Update to live Stripe keys
- [ ] Update publishable key in frontend
- [ ] Configure production webhook endpoint
- [ ] Test with real card (small amount)
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email receipts in Stripe
- [ ] Configure refund policy
- [ ] Add customer support contact
- [ ] Test 3D Secure authentication
- [ ] Monitor first transactions closely

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe Dashboard**: https://dashboard.stripe.com

## Troubleshooting

### Payment Intent Creation Fails
- Check Stripe secret key is valid
- Verify fundraiser exists and is active
- Check minimum amount ($1.00)
- Review edge function logs

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook secret is configured
- Test webhook in Stripe Dashboard
- Review edge function logs for signature errors

### Payment Succeeds But No Donation Record
- Check webhook is configured correctly
- Verify webhook signature
- Review stripe-webhook function logs
- Check database RLS policies

### Card Declined
- Use test cards in test mode
- Check card details are valid
- Verify sufficient funds (for real cards)
- Check Stripe Dashboard for decline reason
