-- Fix search_path security issues for functions
CREATE OR REPLACE FUNCTION public.log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.settings_audit_log (
      setting_key,
      old_value,
      new_value,
      changed_by,
      change_reason
    ) VALUES (
      NEW.setting_key,
      OLD.setting_value,
      NEW.setting_value,
      NEW.updated_by,
      'Settings updated via admin panel'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for update_settings_timestamp function
CREATE OR REPLACE FUNCTION public.update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;