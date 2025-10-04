-- Phase 3: Create CQRS Projection Tables for Campaigns

-- Campaign Summary Projection (optimized for list views)
CREATE TABLE IF NOT EXISTS public.campaign_summary_projection (
  campaign_id UUID PRIMARY KEY REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  cover_image TEXT,
  goal_amount NUMERIC NOT NULL,
  total_raised NUMERIC DEFAULT 0,
  donor_count INTEGER DEFAULT 0,
  status fundraiser_status NOT NULL,
  visibility visibility_type NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  owner_user_id UUID NOT NULL,
  owner_name TEXT,
  owner_avatar TEXT,
  org_id UUID REFERENCES public.organizations(id),
  org_name TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  end_date DATE,
  progress_percentage NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN goal_amount > 0 THEN (total_raised / goal_amount * 100)
      ELSE 0 
    END
  ) STORED,
  days_remaining INTEGER,
  last_donation_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Stats Projection (real-time aggregated statistics)
CREATE TABLE IF NOT EXISTS public.campaign_stats_projection (
  campaign_id UUID PRIMARY KEY REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  total_donations NUMERIC DEFAULT 0,
  donation_count INTEGER DEFAULT 0,
  unique_donors INTEGER DEFAULT 0,
  average_donation NUMERIC DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  update_count INTEGER DEFAULT 0,
  first_donation_at TIMESTAMPTZ,
  last_donation_at TIMESTAMPTZ,
  peak_donation_amount NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Search Projection (optimized full-text search)
CREATE TABLE IF NOT EXISTS public.campaign_search_projection (
  campaign_id UUID PRIMARY KEY REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  search_vector TSVECTOR,
  title TEXT NOT NULL,
  summary TEXT,
  story_text TEXT,
  beneficiary_name TEXT,
  location TEXT,
  tags TEXT[],
  category_name TEXT,
  owner_name TEXT,
  org_name TEXT,
  status fundraiser_status NOT NULL,
  visibility visibility_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_summary_status ON public.campaign_summary_projection(status);
CREATE INDEX IF NOT EXISTS idx_campaign_summary_visibility ON public.campaign_summary_projection(visibility);
CREATE INDEX IF NOT EXISTS idx_campaign_summary_category ON public.campaign_summary_projection(category_id);
CREATE INDEX IF NOT EXISTS idx_campaign_summary_owner ON public.campaign_summary_projection(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_summary_org ON public.campaign_summary_projection(org_id);
CREATE INDEX IF NOT EXISTS idx_campaign_summary_created ON public.campaign_summary_projection(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_stats_donation_count ON public.campaign_stats_projection(donation_count DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_search_vector ON public.campaign_search_projection USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_campaign_search_status ON public.campaign_search_projection(status);

-- Enable RLS
ALTER TABLE public.campaign_summary_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_stats_projection ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_search_projection ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public campaigns are viewable by everyone
CREATE POLICY "Public campaign summaries are viewable by everyone"
ON public.campaign_summary_projection
FOR SELECT
USING (visibility = 'public' AND status IN ('active', 'ended', 'closed'));

CREATE POLICY "Public campaign stats are viewable by everyone"
ON public.campaign_stats_projection
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_summary_projection csp
    WHERE csp.campaign_id = campaign_stats_projection.campaign_id
    AND csp.visibility = 'public'
  )
);

CREATE POLICY "Public campaign search is viewable by everyone"
ON public.campaign_search_projection
FOR SELECT
USING (visibility = 'public' AND status IN ('active', 'ended', 'closed'));

-- RLS Policies: Owners can view their own campaigns
CREATE POLICY "Owners can view their own campaign summaries"
ON public.campaign_summary_projection
FOR SELECT
USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can view their own campaign stats"
ON public.campaign_stats_projection
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_summary_projection csp
    WHERE csp.campaign_id = campaign_stats_projection.campaign_id
    AND csp.owner_user_id = auth.uid()
  )
);

-- RLS Policies: System can manage projections
CREATE POLICY "System can manage campaign summaries"
ON public.campaign_summary_projection
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can manage campaign stats"
ON public.campaign_stats_projection
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can manage campaign search"
ON public.campaign_search_projection
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.update_campaign_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.story_text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.beneficiary_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'D');
  RETURN NEW;
END;
$$;

-- Trigger to auto-update search vector
CREATE TRIGGER update_campaign_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.campaign_search_projection
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_search_vector();

-- Phase 4: Saga State Management Tables

-- Saga instances to track multi-step processes
CREATE TABLE IF NOT EXISTS public.saga_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, compensating, failed
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Saga steps to track individual step execution
CREATE TABLE IF NOT EXISTS public.saga_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saga_id UUID NOT NULL REFERENCES public.saga_instances(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, compensated
  attempt_count INTEGER NOT NULL DEFAULT 0,
  executed_at TIMESTAMPTZ,
  compensated_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saga_instances_type ON public.saga_instances(saga_type);
CREATE INDEX IF NOT EXISTS idx_saga_instances_aggregate ON public.saga_instances(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_saga_instances_status ON public.saga_instances(status);
CREATE INDEX IF NOT EXISTS idx_saga_steps_saga ON public.saga_steps(saga_id);

-- Enable RLS
ALTER TABLE public.saga_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_steps ENABLE ROW LEVEL SECURITY;

-- RLS: Only system can manage sagas
CREATE POLICY "System can manage saga instances"
ON public.saga_instances
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can manage saga steps"
ON public.saga_steps
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins can view sagas for debugging
CREATE POLICY "Admins can view saga instances"
ON public.saga_instances
FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view saga steps"
ON public.saga_steps
FOR SELECT
USING (is_super_admin(auth.uid()));