-- Allow admins to read campaign_summary_projection for internal tools like donation reallocation
-- (keeps public policy intact, adds admin-only visibility)

CREATE POLICY "Admins can view all campaign summaries"
ON public.campaign_summary_projection
FOR SELECT
USING (
  is_super_admin(auth.uid())
  OR user_has_permission(auth.uid(), 'manage_campaigns'::text)
);
