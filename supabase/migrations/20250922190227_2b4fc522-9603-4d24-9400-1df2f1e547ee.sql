-- Create subscription system tables and enhanced profiles (Fixed)

-- Add social fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS campaign_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_funds_raised NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL,
  following_type TEXT NOT NULL CHECK (following_type IN ('user', 'organization')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id, following_type)
);

-- Create user activities table for activity feed
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('campaign_created', 'donation_made', 'campaign_updated', 'followed_user', 'followed_organization')),
  target_id UUID,
  target_type TEXT CHECK (target_type IN ('fundraiser', 'user', 'organization', 'donation')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  new_follower BOOLEAN DEFAULT true,
  campaign_updates BOOLEAN DEFAULT true,
  donation_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view public subscriptions" ON public.subscriptions
FOR SELECT USING (
  follower_id = auth.uid() OR 
  following_id = auth.uid() AND following_type = 'user' OR
  true
);

CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions
FOR DELETE USING (follower_id = auth.uid());

-- RLS Policies for user activities
CREATE POLICY "Users can view activities of people they follow" ON public.user_activities
FOR SELECT USING (
  actor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.follower_id = auth.uid() 
    AND s.following_id = user_activities.actor_id 
    AND s.following_type = 'user'
  )
);

CREATE POLICY "Users can create their own activities" ON public.user_activities
FOR INSERT WITH CHECK (actor_id = auth.uid());

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" ON public.notification_preferences
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user blocks
CREATE POLICY "Users can manage their own blocks" ON public.user_blocks
FOR ALL USING (blocker_id = auth.uid())
WITH CHECK (blocker_id = auth.uid());

-- Performance indexes (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_subscriptions_follower_id ON public.subscriptions(follower_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_following_id_type ON public.subscriptions(following_id, following_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_actor_id ON public.user_activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);