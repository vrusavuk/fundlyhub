-- Add is_project field to fundraisers table
ALTER TABLE fundraisers 
ADD COLUMN IF NOT EXISTS is_project BOOLEAN DEFAULT false;

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'submitted', 'approved', 'completed', 'canceled')),
  proof_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create project_updates table
CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'donors_only')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project_allocations table
CREATE TABLE IF NOT EXISTS project_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  allocated_by UUID NOT NULL REFERENCES profiles(id),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create project_disbursements table
CREATE TABLE IF NOT EXISTS project_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  destination TEXT NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'sent', 'reconciled', 'rejected')),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_fundraiser ON project_milestones(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_updates_fundraiser ON project_updates(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_milestone ON project_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_fundraiser ON project_allocations(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_project_allocations_milestone ON project_allocations(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_disbursements_fundraiser ON project_disbursements(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_project_disbursements_status ON project_disbursements(status);

-- Add triggers for updated_at
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public milestones viewable by everyone"
  ON project_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_milestones.fundraiser_id 
      AND visibility = 'public'
      AND status IN ('active', 'ended', 'closed')
    )
  );

CREATE POLICY "Project owners can manage milestones"
  ON project_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_milestones.fundraiser_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all milestones"
  ON project_milestones FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS Policies for project_updates
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public updates viewable by everyone"
  ON project_updates FOR SELECT
  USING (
    visibility = 'public' AND
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_updates.fundraiser_id 
      AND visibility = 'public'
      AND status IN ('active', 'ended', 'closed')
    )
  );

CREATE POLICY "Donors can view donor-only updates"
  ON project_updates FOR SELECT
  USING (
    visibility = 'donors_only' AND
    EXISTS (
      SELECT 1 FROM donations 
      WHERE fundraiser_id = project_updates.fundraiser_id 
      AND donor_user_id = auth.uid()
      AND payment_status = 'paid'
    )
  );

CREATE POLICY "Project owners can create updates"
  ON project_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_updates.fundraiser_id 
      AND owner_user_id = auth.uid()
    ) AND author_id = auth.uid()
  );

CREATE POLICY "Update authors can manage their updates"
  ON project_updates FOR ALL
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all updates"
  ON project_updates FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS Policies for project_allocations
ALTER TABLE project_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can view allocations"
  ON project_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_allocations.fundraiser_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can create allocations"
  ON project_allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_allocations.fundraiser_id 
      AND owner_user_id = auth.uid()
    ) AND allocated_by = auth.uid()
  );

CREATE POLICY "Admins can manage all allocations"
  ON project_allocations FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS Policies for project_disbursements
ALTER TABLE project_disbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owners can view disbursements"
  ON project_disbursements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_disbursements.fundraiser_id 
      AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can request disbursements"
  ON project_disbursements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fundraisers 
      WHERE id = project_disbursements.fundraiser_id 
      AND owner_user_id = auth.uid()
    ) AND requested_by = auth.uid()
  );

CREATE POLICY "Admins can manage all disbursements"
  ON project_disbursements FOR ALL
  USING (is_super_admin(auth.uid()));

-- Add comment to fundraisers table
COMMENT ON COLUMN fundraisers.is_project IS 'Indicates if this fundraiser uses structured project features (milestones, allocations, etc.)';