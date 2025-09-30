-- Ensure the manage_campaigns permission exists
INSERT INTO public.permissions (name, display_name, description, category)
VALUES (
  'manage_campaigns',
  'Manage Campaigns', 
  'View and manage all fundraising campaigns including draft, paused, and closed statuses',
  'campaign_management'
)
ON CONFLICT (name) DO NOTHING;

-- Add RLS policy allowing admins to view all campaigns regardless of status
CREATE POLICY "Admins can view all campaigns"
  ON public.fundraisers
  FOR SELECT
  USING (
    user_has_permission(auth.uid(), 'manage_campaigns')
    OR is_super_admin(auth.uid())
  );