import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReceiptEmailRequest {
  recipient_email: string;
  donation_id?: string;
  // Direct receipt data (used when donation_id not available)
  receipt_data?: {
    donor_name: string;
    amount: number;
    tip_amount: number;
    fee_amount?: number;
    net_amount?: number;
    currency: string;
    campaign_title: string;
    campaign_slug: string;
    receipt_id: string;
    payment_method?: string;
    card_brand?: string;
    card_last4?: string;
    created_at: string;
    is_anonymous: boolean;
  };
}

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
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

const generateReceiptHtml = (data: {
  donor_name: string;
  amount: number;
  tip_amount: number;
  fee_amount?: number;
  net_amount?: number;
  currency: string;
  campaign_title: string;
  campaign_slug: string;
  receipt_id: string;
  payment_method?: string;
  card_brand?: string;
  card_last4?: string;
  created_at: string;
  is_anonymous: boolean;
}): string => {
  const totalAmount = data.amount + (data.tip_amount || 0);
  const feeAmount = data.fee_amount || 0;
  const netAmount = data.net_amount || (totalAmount - feeAmount);
  const paymentDisplay = data.card_brand && data.card_last4 
    ? `${data.card_brand} •••• ${data.card_last4}`
    : data.payment_method || 'Card';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">✓</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Thank You!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Your donation has been received</p>
            </td>
          </tr>
          
          <!-- Campaign Info -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Campaign</p>
              <h2 style="margin: 8px 0 0; color: #111827; font-size: 20px; font-weight: 600;">${data.campaign_title}</h2>
            </td>
          </tr>
          
          <!-- Receipt Details -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Receipt Details</p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Donation Amount</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(data.amount, data.currency)}</td>
                      </tr>
                      ${data.tip_amount > 0 ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Platform Tip</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; font-weight: 500;">${formatCurrency(data.tip_amount, data.currency)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #111827; font-size: 16px; font-weight: 600;">Total Charged</td>
                        <td style="padding: 8px 0; color: #10b981; font-size: 16px; text-align: right; font-weight: 700;">${formatCurrency(totalAmount, data.currency)}</td>
                      </tr>
                      ${feeAmount > 0 ? `
                      <tr>
                        <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 12px;"></td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0 0 8px; color: #374151; font-size: 13px; font-weight: 600;">Payment Breakdown</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Payment Amount</td>
                        <td style="padding: 6px 0; color: #111827; font-size: 13px; text-align: right;">${formatCurrency(totalAmount, data.currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #6b7280; font-size: 13px;">Stripe Processing Fees</td>
                        <td style="padding: 6px 0; color: #dc2626; font-size: 13px; text-align: right;">-${formatCurrency(feeAmount, data.currency)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Net Amount</td>
                        <td style="padding: 8px 0; color: #10b981; font-size: 14px; text-align: right; font-weight: 600;">${formatCurrency(netAmount, data.currency)}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Transaction Info -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Date</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 13px; text-align: right;">${formatDate(data.created_at)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Payment Method</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 13px; text-align: right;">${paymentDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Receipt #</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 13px; text-align: right; font-family: monospace;">${data.receipt_id?.slice(0, 20) || 'N/A'}...</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Donor</td>
                  <td style="padding: 8px 0; color: #374151; font-size: 13px; text-align: right;">${data.is_anonymous ? 'Anonymous Donor' : data.donor_name}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center;">
                This receipt confirms your donation. Please save it for your records.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Questions? Contact us at support@example.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_email, donation_id, receipt_data }: ReceiptEmailRequest = await req.json();

    if (!recipient_email) {
      throw new Error("Recipient email is required");
    }

    let emailData = receipt_data;

    // If donation_id provided, fetch from database
    if (donation_id && !emailData) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase configuration missing");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: donation, error: donationError } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          tip_amount,
          fee_amount,
          net_amount,
          currency,
          donor_name,
          is_anonymous,
          receipt_id,
          payment_method_type,
          card_brand,
          card_last4,
          created_at,
          fundraiser:fundraisers(title, slug)
        `)
        .eq("id", donation_id)
        .single();

      if (donationError || !donation) {
        throw new Error("Donation not found");
      }

      emailData = {
        donor_name: donation.donor_name || "Generous Donor",
        amount: donation.amount,
        tip_amount: donation.tip_amount || 0,
        fee_amount: donation.fee_amount || 0,
        net_amount: donation.net_amount || 0,
        currency: donation.currency || "USD",
        campaign_title: donation.fundraiser?.title || "Campaign",
        campaign_slug: donation.fundraiser?.slug || "",
        receipt_id: donation.receipt_id || donation.id,
        payment_method: donation.payment_method_type,
        card_brand: donation.card_brand,
        card_last4: donation.card_last4,
        created_at: donation.created_at,
        is_anonymous: donation.is_anonymous,
      };
    }

    if (!emailData) {
      throw new Error("Receipt data or donation ID is required");
    }

    console.log("Sending receipt email to:", recipient_email);
    console.log("Receipt data:", emailData);

    const htmlContent = generateReceiptHtml(emailData);

    const { data, error } = await resend.emails.send({
      from: "Donations <onboarding@resend.dev>",
      to: [recipient_email],
      subject: `Donation Receipt - ${emailData.campaign_title}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, message_id: data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-receipt-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
