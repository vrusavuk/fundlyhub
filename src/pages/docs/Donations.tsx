/**
 * API Documentation Donations page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsDonations() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Donations API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Process donations, manage payment status, and track fundraiser contributions.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Donation records are protected by RLS policies. Fundraiser owners can view donations to their campaigns, and donors can view their own donation history.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Donation Management" 
        description="Create and track donations with payment processing integration."
      >
        {/* Create Donation */}
        <SwaggerEndpoint
          method="POST"
          path="/donations"
          summary="Create donation"
          description="Process a new donation for a fundraising campaign"
          tags={['Donations']}
        >
          <EndpointDetails
            requestBody={{
              contentType: 'application/json',
              example: `{
  "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 50.00,
  "tip_amount": 2.50,
  "currency": "USD",
  "payment_provider": "stripe",
  "donor_user_id": "456e7890-e89b-12d3-a456-426614174000"
}`
            }}
            responses={[
              { 
                status: '201', 
                description: 'Donation created successfully',
                example: `{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000", 
  "donor_user_id": "456e7890-e89b-12d3-a456-426614174000",
  "amount": 50.00,
  "tip_amount": 2.50,
  "fee_amount": 1.75,
  "net_amount": 48.25,
  "currency": "USD",
  "payment_provider": "stripe",
  "payment_status": "paid",
  "receipt_id": "pi_1234567890",
  "created_at": "2024-01-16T10:30:00Z"
}`
              },
              { status: '400', description: 'Validation errors or invalid fundraiser' },
              { status: '500', description: 'Payment processing error' }
            ]}
            examples={[
              {
                title: 'Create Donation',
                code: `const { data, error } = await supabase
  .from('donations')
  .insert([{
    fundraiser_id: 'fundraiser-uuid',
    amount: 50.00,
    tip_amount: 2.50,
    currency: 'USD',
    payment_provider: 'stripe',
    donor_user_id: currentUser.id
  }])
  .select()`
              },
              {
                title: 'Anonymous Donation',
                description: 'Create a donation without user authentication',
                code: `const { data, error } = await supabase
  .from('donations')
  .insert([{
    fundraiser_id: 'fundraiser-uuid',
    amount: 25.00,
    currency: 'USD',
    payment_provider: 'stripe'
    // donor_user_id is null for anonymous donations
  }])
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Fundraiser Donations */}
        <SwaggerEndpoint
          method="GET"
          path="/donations"
          summary="List donations"
          description="Retrieve donations (filtered by permissions)"
          tags={['Donations']}
          requiresAuth={true}
        >
          <EndpointDetails
            parameters={[
              { name: 'fundraiser_id', type: 'uuid', description: 'Filter by fundraiser ID' },
              { name: 'limit', type: 'integer', description: 'Number of results (max 100)', example: '20' },
              { name: 'offset', type: 'integer', description: 'Pagination offset', example: '0' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Array of donation objects (filtered by user permissions)',
                example: `[
  {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000",
    "donor_user_id": "456e7890-e89b-12d3-a456-426614174000",
    "amount": 50.00,
    "tip_amount": 2.50,
    "fee_amount": 1.75,
    "net_amount": 48.25,
    "currency": "USD",
    "payment_provider": "stripe",
    "payment_status": "paid",
    "receipt_id": "pi_1234567890",
    "created_at": "2024-01-16T10:30:00Z"
  },
  {
    "id": "abc1234e-e89b-12d3-a456-426614174000",
    "fundraiser_id": "123e4567-e89b-12d3-a456-426614174000",
    "donor_user_id": null,
    "amount": 25.00,
    "tip_amount": 0,
    "fee_amount": 1.05,
    "net_amount": 23.95,
    "currency": "USD",
    "payment_provider": "stripe",
    "payment_status": "paid", 
    "receipt_id": "pi_0987654321",
    "created_at": "2024-01-15T14:22:00Z"
  }
]`
              },
              { status: '401', description: 'Authentication required' },
              { status: '403', description: 'Access denied - not authorized to view these donations' }
            ]}
            examples={[
              {
                title: 'Get Donations for My Fundraiser',
                description: 'Fundraiser owners can view all donations to their campaigns',
                code: `const { data, error } = await supabase
  .from('donations')
  .select('*')
  .eq('fundraiser_id', myFundraiserId)
  .order('created_at', { ascending: false })`
              },
              {
                title: 'Get My Donation History',
                description: 'Users can view their own donation history',
                code: `const { data, error } = await supabase
  .from('donations')
  .select(\`
    *,
    fundraisers(title, slug)
  \`)
  .eq('donor_user_id', currentUser.id)
  .order('created_at', { ascending: false })`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Donation Analytics */}
        <SwaggerEndpoint
          method="GET"
          path="/donations/analytics"
          summary="Get donation analytics"
          description="Retrieve donation statistics and trends (fundraiser owners only)"
          tags={['Analytics']}
          requiresAuth={true}
        >
          <EndpointDetails
            parameters={[
              { name: 'fundraiser_id', type: 'uuid', required: true, description: 'Fundraiser ID' },
              { name: 'period', type: 'string', description: 'Time period (day, week, month)', example: 'week' }
            ]}
            responses={[
              { 
                status: '200', 
                description: 'Donation analytics and statistics',
                example: `{
  "total_donations": 47,
  "total_amount": 2350.75,
  "average_donation": 50.02,
  "total_fees": 98.45,
  "net_amount": 2252.30,
  "anonymous_donations": 12,
  "recent_donations": [
    {
      "amount": 100.00,
      "created_at": "2024-01-16T10:30:00Z",
      "donor_name": "John D."
    },
    {
      "amount": 25.00,
      "created_at": "2024-01-16T08:15:00Z",
      "donor_name": "Anonymous"
    }
  ],
  "daily_totals": [
    {
      "date": "2024-01-16",
      "amount": 175.00,
      "count": 4
    },
    {
      "date": "2024-01-15", 
      "amount": 200.25,
      "count": 6
    }
  ]
}`
              },
              { status: '401', description: 'Authentication required' },
              { status: '403', description: 'Permission denied - not fundraiser owner' },
              { status: '404', description: 'Fundraiser not found' }
            ]}
            examples={[
              {
                title: 'Get Weekly Analytics',
                code: `// Custom query to get donation analytics
const { data, error } = await supabase
  .from('donations')
  .select('amount, created_at, donor_user_id')
  .eq('fundraiser_id', fundraiserId)
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false })`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Payment Processing" description="Integration examples for payment providers">
        <div className="grid gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Stripe Integration</h4>
            <p className="text-sm text-muted-foreground mb-3">Process donations with Stripe payment processing</p>
            <CodeBlock 
              code={`// 1. Create payment intent on frontend
const response = await fetch('/api/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 5000, // $50.00 in cents
    fundraiser_id: 'fundraiser-uuid'
  })
})
const { client_secret } = await response.json()

// 2. Confirm payment with Stripe
const { error } = await stripe.confirmCardPayment(client_secret, {
  payment_method: { card: cardElement }
})

// 3. Create donation record after successful payment
if (!error) {
  const { data } = await supabase
    .from('donations')
    .insert([{
      fundraiser_id: 'fundraiser-uuid',
      amount: 50.00,
      payment_provider: 'stripe',
      payment_status: 'paid',
      receipt_id: paymentIntent.id
    }])
}`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Donation with Fee Calculation</h4>
            <p className="text-sm text-muted-foreground mb-3">Calculate platform and payment processing fees</p>
            <CodeBlock 
              code={`// Calculate fees and net amount
const donationAmount = 100.00
const tipAmount = 5.00
const stripeFee = (donationAmount + tipAmount) * 0.029 + 0.30 // 2.9% + 30¢
const platformFee = donationAmount * 0.05 // 5% platform fee
const totalFees = stripeFee + platformFee
const netAmount = donationAmount - platformFee // Stripe fee deducted separately

const { data, error } = await supabase
  .from('donations')
  .insert([{
    fundraiser_id: 'fundraiser-uuid',
    amount: donationAmount,
    tip_amount: tipAmount,
    fee_amount: totalFees,
    net_amount: netAmount,
    currency: 'USD',
    payment_provider: 'stripe'
  }])`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}