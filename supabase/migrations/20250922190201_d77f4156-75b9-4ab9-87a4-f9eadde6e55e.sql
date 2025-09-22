-- Create subscription system tables and enhanced profiles

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
  -- Users can see who they follow
  follower_id = auth.uid() OR 
  -- Users can see who follows them
  following_id = auth.uid() AND following_type = 'user' OR
  -- Public subscriptions for profile discovery
  true
);

CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own subscriptions" ON public.subscriptions
FOR DELETE USING (follower_id = auth.uid());

-- RLS Policies for user activities
CREATE POLICY "Users can view activities of people they follow" ON public.user_activities
FOR SELECT USING (
  -- Users can see their own activities
  actor_id = auth.uid() OR
  -- Users can see activities of people they follow
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

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_follower_id ON public.subscriptions(follower_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_following_id_type ON public.subscriptions(following_id, following_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_actor_id ON public.user_activities(actor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);

-- Database functions
CREATE OR REPLACE FUNCTION public.get_user_profile_with_stats(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB,
  profile_visibility TEXT,
  role public.user_role,
  campaign_count BIGINT,
  total_funds_raised NUMERIC,
  follower_count BIGINT,
  following_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.avatar,
    p.bio,
    p.location,
    p.website,
    p.social_links,
    p.profile_visibility,
    p.role,
    COUNT(f.id)::BIGINT as campaign_count,
    COALESCE(SUM(pfs.total_raised), 0) as total_funds_raised,
    (SELECT COUNT(*)::BIGINT FROM public.subscriptions WHERE following_id = target_user_id AND following_type = 'user') as follower_count,
    (SELECT COUNT(*)::BIGINT FROM public.subscriptions WHERE follower_id = target_user_id) as following_count,
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.fundraisers f ON f.owner_user_id = p.id AND f.status IN ('active', 'closed')
  LEFT JOIN public_fundraiser_stats pfs ON pfs.fundraiser_id = f.id
  WHERE p.id = target_user_id
  GROUP BY p.id, p.name, p.email, p.avatar, p.bio, p.location, p.website, p.social_links, p.profile_visibility, p.role, p.created_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subscription_counts(entity_id UUID, entity_type TEXT)
RETURNS TABLE(follower_count BIGINT, following_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::BIGINT FROM public.subscriptions WHERE following_id = entity_id AND following_type = entity_type) as follower_count,
    (SELECT COUNT(*)::BIGINT FROM public.subscriptions WHERE follower_id = entity_id) as following_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_activity_feed(user_id UUID, feed_limit INTEGER DEFAULT 20, feed_offset INTEGER DEFAULT 0)
RETURNS TABLE(
  id UUID,
  actor_id UUID,
  actor_name TEXT,
  actor_avatar TEXT,
  activity_type TEXT,
  target_id UUID,
  target_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.actor_id,
    p.name as actor_name,
    p.avatar as actor_avatar,
    ua.activity_type,
    ua.target_id,
    ua.target_type,
    ua.metadata,
    ua.created_at
  FROM public.user_activities ua
  JOIN public.profiles p ON p.id = ua.actor_id
  WHERE ua.actor_id IN (
    SELECT s.following_id 
    FROM public.subscriptions s 
    WHERE s.follower_id = user_id AND s.following_type = 'user'
  )
  ORDER BY ua.created_at DESC
  LIMIT feed_limit OFFSET feed_offset;
END;
$$;

-- Function to handle subscription counts update
CREATE OR REPLACE FUNCTION public.update_subscription_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower count for the followed entity
    IF NEW.following_type = 'user' THEN
      UPDATE public.profiles 
      SET follower_count = follower_count + 1 
      WHERE id = NEW.following_id;
    END IF;
    
    -- Update following count for the follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower count for the unfollowed entity
    IF OLD.following_type = 'user' THEN
      UPDATE public.profiles 
      SET follower_count = GREATEST(follower_count - 1, 0) 
      WHERE id = OLD.following_id;
    END IF;
    
    -- Update following count for the unfollower
    UPDATE public.profiles 
    SET following_count = GREATEST(following_count - 1, 0) 
    WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update subscription counts
DROP TRIGGER IF EXISTS subscription_counts_trigger ON public.subscriptions;
CREATE TRIGGER subscription_counts_trigger
  AFTER INSERT OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_counts();

-- Function to create activity when user follows someone
CREATE OR REPLACE FUNCTION public.log_follow_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_activities (actor_id, activity_type, target_id, target_type, metadata)
  VALUES (
    NEW.follower_id,
    CASE 
      WHEN NEW.following_type = 'user' THEN 'followed_user'
      WHEN NEW.following_type = 'organization' THEN 'followed_organization'
    END,
    NEW.following_id,
    NEW.following_type,
    jsonb_build_object('followed_at', NEW.created_at)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to log follow activities
DROP TRIGGER IF EXISTS log_follow_activity_trigger ON public.subscriptions;
CREATE TRIGGER log_follow_activity_trigger
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.log_follow_activity();

-- Add trigger for notification preferences auto-creation
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create notification preferences for new users
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON public.profiles;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_notification_preferences();