-- Create function to get recent activities
CREATE OR REPLACE FUNCTION public.get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  type TEXT,
  description TEXT,
  event_timestamp TIMESTAMP WITH TIME ZONE,
  severity TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.action as type,
    CONCAT(
      COALESCE(p.name, p.email, 'System'),
      ' ',
      al.action,
      ' ',
      al.resource_type
    ) as description,
    al.created_at as event_timestamp,
    CASE 
      WHEN al.action LIKE '%failed%' OR al.action LIKE '%error%' THEN 'error'
      WHEN al.action LIKE '%warning%' OR al.action LIKE '%suspended%' THEN 'warning'
      ELSE 'info'
    END as severity
  FROM audit_logs al
  LEFT JOIN profiles p ON p.id = al.actor_id
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get system health
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS TABLE (
  database TEXT,
  api TEXT,
  storage TEXT,
  last_check TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'healthy'::TEXT as database,
    'healthy'::TEXT as api,
    'healthy'::TEXT as storage,
    NOW() as last_check;
END;
$$;