-- Create user admin notes table for internal notes and flagging system
CREATE TABLE IF NOT EXISTS public.user_admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'flag', 'positive', 'investigation')),
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user messages table for admin communication
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_id UUID,
  sender_type TEXT NOT NULL DEFAULT 'admin' CHECK (sender_type IN ('admin', 'system', 'user')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general' CHECK (message_type IN ('general', 'warning', 'admin_notice', 'system_update')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add additional profile fields for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.user_admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_admin_notes
DROP POLICY IF EXISTS "Super admins can manage all admin notes" ON public.user_admin_notes;
CREATE POLICY "Super admins can manage all admin notes" ON public.user_admin_notes
  FOR ALL USING (is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins can manage admin notes" ON public.user_admin_notes;
CREATE POLICY "Platform admins can manage admin notes" ON public.user_admin_notes
  FOR ALL USING (user_has_permission(auth.uid(), 'manage_user_notes'));

-- RLS policies for user_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.user_messages;
CREATE POLICY "Users can view their own messages" ON public.user_messages
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can mark their messages as read" ON public.user_messages;
CREATE POLICY "Users can mark their messages as read" ON public.user_messages
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can send messages to users" ON public.user_messages;
CREATE POLICY "Admins can send messages to users" ON public.user_messages
  FOR INSERT WITH CHECK (user_has_permission(auth.uid(), 'send_user_messages'));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.user_messages;
CREATE POLICY "Admins can view all messages" ON public.user_messages
  FOR SELECT USING (user_has_permission(auth.uid(), 'view_user_messages'));

-- Update triggers for timestamps
DROP TRIGGER IF EXISTS update_user_admin_notes_updated_at ON public.user_admin_notes;
CREATE TRIGGER update_user_admin_notes_updated_at
  BEFORE UPDATE ON public.user_admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_admin_notes_user_id ON public.user_admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_admin_notes_admin_id ON public.user_admin_notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_admin_notes_note_type ON public.user_admin_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_user_admin_notes_created_at ON public.user_admin_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_messages_user_id ON public.user_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON public.user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_message_type ON public.user_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_user_messages_is_read ON public.user_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON public.user_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_banned_at ON public.profiles(banned_at);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);