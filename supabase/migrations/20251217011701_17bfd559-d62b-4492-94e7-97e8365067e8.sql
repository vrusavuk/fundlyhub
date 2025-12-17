-- Add payment method details columns to donations table
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS payment_method_type text,
ADD COLUMN IF NOT EXISTS card_brand text,
ADD COLUMN IF NOT EXISTS card_last4 text;

-- Add comments for documentation
COMMENT ON COLUMN public.donations.payment_method_type IS 'Type of payment method used (e.g., card, us_bank_account)';
COMMENT ON COLUMN public.donations.card_brand IS 'Card brand if payment method is card (e.g., visa, mastercard, amex)';
COMMENT ON COLUMN public.donations.card_last4 IS 'Last 4 digits of the card if payment method is card';