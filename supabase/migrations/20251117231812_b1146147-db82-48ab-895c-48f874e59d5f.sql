-- Fix security warning: Set search_path for get_user_earnings function
ALTER FUNCTION get_user_earnings(_user_id UUID) SET search_path = public;