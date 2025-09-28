-- Create event store table for pub/sub architecture
CREATE TABLE IF NOT EXISTS public.event_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_version TEXT NOT NULL DEFAULT '1.0.0',
  aggregate_id UUID,
  correlation_id UUID,
  causation_id UUID,
  event_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;

-- Create policies for event store access
CREATE POLICY "Event store is readable by authenticated users" 
ON public.event_store 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Event store is writable by authenticated users" 
ON public.event_store 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Create indices for performance
CREATE INDEX idx_event_store_event_type ON public.event_store(event_type);
CREATE INDEX idx_event_store_aggregate_id ON public.event_store(aggregate_id);
CREATE INDEX idx_event_store_correlation_id ON public.event_store(correlation_id);
CREATE INDEX idx_event_store_occurred_at ON public.event_store(occurred_at);
CREATE INDEX idx_event_store_event_data ON public.event_store USING GIN(event_data);

-- Create composite indices for common query patterns
CREATE INDEX idx_event_store_type_aggregate ON public.event_store(event_type, aggregate_id, occurred_at);
CREATE INDEX idx_event_store_correlation_occurred ON public.event_store(correlation_id, occurred_at);