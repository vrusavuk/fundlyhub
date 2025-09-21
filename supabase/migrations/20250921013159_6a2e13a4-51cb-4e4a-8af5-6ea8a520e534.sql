-- Drop existing tables if they exist to recreate with new schema
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.updates CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.fundraisers CASCADE;
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.org_member_role CASCADE;
DROP TYPE IF EXISTS public.fundraiser_status CASCADE;
DROP TYPE IF EXISTS public.visibility_type CASCADE;
DROP TYPE IF EXISTS public.payment_status CASCADE;

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('visitor', 'creator', 'org_admin', 'admin');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
CREATE TYPE public.fundraiser_status AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE public.visibility_type AS ENUM ('public', 'unlisted');
CREATE TYPE public.payment_status AS ENUM ('paid', 'refunded', 'failed');

-- Users/Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  avatar TEXT,
  role public.user_role DEFAULT 'visitor',
  twofa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  dba_name TEXT,
  country TEXT,
  ein TEXT,
  address JSONB,
  website TEXT,
  categories TEXT[],
  verification_status public.verification_status DEFAULT 'pending',
  stripe_connect_id TEXT,
  paypal_merchant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization members
CREATE TABLE public.org_members (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.org_member_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- Fundraisers table
CREATE TABLE public.fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  owner_user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  story_html TEXT,
  goal_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  tags TEXT[],
  cover_image TEXT,
  images TEXT[],
  video_url TEXT,
  status public.fundraiser_status DEFAULT 'draft',
  visibility public.visibility_type DEFAULT 'public',
  beneficiary_name TEXT,
  beneficiary_contact TEXT,
  location TEXT,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID REFERENCES public.fundraisers(id) ON DELETE CASCADE NOT NULL,
  donor_user_id UUID REFERENCES public.profiles(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  tip_amount NUMERIC(12,2) DEFAULT 0,
  fee_amount NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) GENERATED ALWAYS AS (amount - fee_amount) STORED,
  payment_status public.payment_status DEFAULT 'paid',
  payment_provider TEXT,
  receipt_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Updates table
CREATE TABLE public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID REFERENCES public.fundraisers(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id UUID REFERENCES public.fundraisers(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_donations_fundraiser_created ON public.donations(fundraiser_id, created_at DESC);
CREATE INDEX idx_fundraisers_status_visibility ON public.fundraisers(status, visibility);
CREATE INDEX idx_fundraisers_category ON public.fundraisers(category);
CREATE INDEX idx_fundraisers_owner ON public.fundraisers(owner_user_id);
CREATE INDEX idx_organizations_verification ON public.organizations(verification_status);
CREATE INDEX idx_updates_fundraiser ON public.updates(fundraiser_id, created_at DESC);
CREATE INDEX idx_comments_fundraiser ON public.comments(fundraiser_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Only org members can update organizations" ON public.organizations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for org_members
CREATE POLICY "Org members are viewable by everyone" ON public.org_members FOR SELECT USING (true);
CREATE POLICY "Only org owners can manage members" ON public.org_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = org_members.org_id AND user_id = auth.uid() AND role = 'owner')
);

-- RLS Policies for fundraisers
CREATE POLICY "Public fundraisers are viewable by everyone" ON public.fundraisers FOR SELECT USING (
  visibility = 'public' AND status = 'active'
);
CREATE POLICY "Owners can view their own fundraisers" ON public.fundraisers FOR SELECT USING (
  owner_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = fundraisers.org_id AND user_id = auth.uid())
);
CREATE POLICY "Owners can update their fundraisers" ON public.fundraisers FOR UPDATE USING (
  owner_user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = fundraisers.org_id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
);
CREATE POLICY "Authenticated users can create fundraisers" ON public.fundraisers FOR INSERT WITH CHECK (
  auth.uid() = owner_user_id
);

-- RLS Policies for donations
CREATE POLICY "Fundraiser owners can view donations" ON public.donations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND owner_user_id = auth.uid()) OR
  donor_user_id = auth.uid()
);
CREATE POLICY "Anyone can create donations" ON public.donations FOR INSERT WITH CHECK (true);

-- RLS Policies for updates
CREATE POLICY "Updates are viewable by everyone" ON public.updates FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND visibility = 'public')
);
CREATE POLICY "Fundraiser owners can create updates" ON public.updates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND owner_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.fundraisers f JOIN public.org_members om ON f.org_id = om.org_id 
          WHERE f.id = fundraiser_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'editor'))
);

-- RLS Policies for comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.fundraisers WHERE id = fundraiser_id AND visibility = 'public')
);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = author_id
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'visitor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fundraisers_updated_at
  BEFORE UPDATE ON public.fundraisers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_updates_updated_at
  BEFORE UPDATE ON public.updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();