-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  color_class TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy for categories (public read access)
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

-- Create policy for authenticated users to manage categories (admin only)
CREATE POLICY "Only authenticated users can manage categories" 
ON public.categories 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert initial category data
INSERT INTO public.categories (name, emoji, color_class, description, display_order) VALUES
('Medical', '🏥', 'bg-red-50 text-red-700 border-red-200', 'Healthcare and medical expenses', 1),
('Emergency', '🚨', 'bg-orange-50 text-orange-700 border-orange-200', 'Urgent financial assistance', 2),
('Education', '🎓', 'bg-blue-50 text-blue-700 border-blue-200', 'Educational expenses and scholarships', 3),
('Community', '🏘️', 'bg-green-50 text-green-700 border-green-200', 'Local community projects', 4),
('Animal', '🐾', 'bg-purple-50 text-purple-700 border-purple-200', 'Animal welfare and rescue', 5),
('Environment', '🌱', 'bg-emerald-50 text-emerald-700 border-emerald-200', 'Environmental conservation', 6),
('Sports', '⚽', 'bg-indigo-50 text-indigo-700 border-indigo-200', 'Sports teams and athletics', 7),
('Arts', '🎨', 'bg-pink-50 text-pink-700 border-pink-200', 'Creative arts and culture', 8),
('Business', '💼', 'bg-yellow-50 text-yellow-700 border-yellow-200', 'Business and entrepreneurship', 9),
('Memorial', '🕯️', 'bg-gray-50 text-gray-700 border-gray-200', 'Memorial and funeral expenses', 10),
('Charity', '❤️', 'bg-rose-50 text-rose-700 border-rose-200', 'General charitable causes', 11),
('Religious', '⛪', 'bg-violet-50 text-violet-700 border-violet-200', 'Religious and faith-based causes', 12),
('Travel', '✈️', 'bg-sky-50 text-sky-700 border-sky-200', 'Travel and adventure', 13),
('Technology', '💻', 'bg-slate-50 text-slate-700 border-slate-200', 'Technology and innovation', 14),
('Family', '👨‍👩‍👧‍👦', 'bg-amber-50 text-amber-700 border-amber-200', 'Family support and childcare', 15),
('Housing', '🏠', 'bg-stone-50 text-stone-700 border-stone-200', 'Housing and shelter', 16)
ON CONFLICT (name) DO NOTHING;

-- Add category_id column to fundraisers table
ALTER TABLE public.fundraisers 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fundraisers_category_id ON public.fundraisers(category_id);

-- Update existing fundraisers to link to categories based on category text
UPDATE public.fundraisers 
SET category_id = c.id 
FROM public.categories c 
WHERE fundraisers.category = c.name 
AND fundraisers.category_id IS NULL;

-- Create function to get category statistics
CREATE OR REPLACE FUNCTION public.get_category_stats()
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  emoji TEXT,
  color_class TEXT,
  active_campaigns BIGINT,
  total_raised NUMERIC,
  campaign_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.emoji,
    c.color_class,
    COUNT(f.id) FILTER (WHERE f.status = 'active') as active_campaigns,
    COALESCE(SUM(pfs.total_raised), 0) as total_raised,
    COUNT(f.id) as campaign_count
  FROM public.categories c
  LEFT JOIN public.fundraisers f ON c.id = f.category_id AND f.visibility = 'public'
  LEFT JOIN public_fundraiser_stats pfs ON f.id = pfs.fundraiser_id
  WHERE c.is_active = true
  GROUP BY c.id, c.name, c.emoji, c.color_class, c.display_order
  ORDER BY c.display_order;
END;
$$;

-- Create trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();