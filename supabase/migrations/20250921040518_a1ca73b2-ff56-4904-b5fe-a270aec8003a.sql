-- Insert sample organizations for testing search functionality
INSERT INTO public.organizations (
  legal_name, 
  dba_name, 
  country, 
  ein, 
  website, 
  categories, 
  verification_status,
  address
) VALUES 
  (
    'American Red Cross National Headquarters',
    'American Red Cross',
    'United States',
    '530196605',
    'https://www.redcross.org',
    ARRAY['Emergency Response', 'Disaster Relief', 'Health Services'],
    'approved',
    '{"street": "431 18th Street NW", "city": "Washington", "state": "DC", "zip": "20006", "country": "United States"}'::jsonb
  ),
  (
    'Doctors Without Borders USA Inc',
    'Médecins Sans Frontières',
    'United States',
    '133433452',
    'https://www.doctorswithoutborders.org',
    ARRAY['Medical', 'International Aid', 'Emergency Response'],
    'approved',
    '{"street": "40 Rector Street", "city": "New York", "state": "NY", "zip": "10006", "country": "United States"}'::jsonb
  ),
  (
    'Habitat for Humanity International Inc',
    'Habitat for Humanity',
    'United States',
    '911914868',
    'https://www.habitat.org',
    ARRAY['Housing', 'Community Development', 'Poverty Alleviation'],
    'approved',
    '{"street": "270 Peachtree Street NW", "city": "Atlanta", "state": "GA", "zip": "30303", "country": "United States"}'::jsonb
  ),
  (
    'World Wildlife Fund Inc',
    'WWF',
    'United States',
    '521693387',
    'https://www.worldwildlife.org',
    ARRAY['Environment', 'Wildlife Conservation', 'Climate Change'],
    'approved',
    '{"street": "1250 24th Street NW", "city": "Washington", "state": "DC", "zip": "20037", "country": "United States"}'::jsonb
  ),
  (
    'St. Jude Children''s Research Hospital',
    'St. Jude',
    'United States',
    '621835230',
    'https://www.stjude.org',
    ARRAY['Medical', 'Children', 'Cancer Research'],
    'approved',
    '{"street": "262 Danny Thomas Place", "city": "Memphis", "state": "TN", "zip": "38105", "country": "United States"}'::jsonb
  ),
  (
    'United Way Worldwide',
    'United Way',
    'United States',
    '131635294',
    'https://www.unitedway.org',
    ARRAY['Community Development', 'Education', 'Health'],
    'approved',
    '{"street": "701 N Fairfax Street", "city": "Alexandria", "state": "VA", "zip": "22314", "country": "United States"}'::jsonb
  ),
  (
    'Feeding America',
    'Feeding America',
    'United States',
    '363673599',
    'https://www.feedingamerica.org',
    ARRAY['Hunger Relief', 'Food Security', 'Community Support'],
    'approved',
    '{"street": "35 E Wacker Drive", "city": "Chicago", "state": "IL", "zip": "60601", "country": "United States"}'::jsonb
  ),
  (
    'Boys & Girls Clubs of America',
    'Boys & Girls Clubs',
    'United States',
    '581839756',
    'https://www.bgca.org',
    ARRAY['Youth Development', 'Education', 'Community'],
    'approved',
    '{"street": "1275 Peachtree Street NE", "city": "Atlanta", "state": "GA", "zip": "30309", "country": "United States"}'::jsonb
  ),
  (
    'Goodwill Industries International Inc',
    'Goodwill',
    'United States',
    '530196517',
    'https://www.goodwill.org',
    ARRAY['Job Training', 'Community Development', 'Social Services'],
    'approved',
    '{"street": "15810 Indianola Drive", "city": "Rockville", "state": "MD", "zip": "20855", "country": "United States"}'::jsonb
  ),
  (
    'Make-A-Wish Foundation of America',
    'Make-A-Wish',
    'United States',
    '860557352',
    'https://www.wish.org',
    ARRAY['Children', 'Medical', 'Wish Fulfillment'],
    'approved',
    '{"street": "1702 E Highland Avenue", "city": "Phoenix", "state": "AZ", "zip": "85016", "country": "United States"}'::jsonb
  ),
  (
    'Local Veterans Support Network',
    'VetSupport',
    'United States',
    '471234567',
    'https://www.vetsupport.org',
    ARRAY['Veterans', 'Mental Health', 'Housing Assistance'],
    'pending',
    '{"street": "123 Main Street", "city": "Portland", "state": "OR", "zip": "97201", "country": "United States"}'::jsonb
  ),
  (
    'Community Food Bank Alliance',
    'Food Bank Alliance',
    'United States',
    '987654321',
    'https://www.foodbankalliance.org',
    ARRAY['Food Security', 'Community Support', 'Volunteers'],
    'pending',
    '{"street": "456 Oak Avenue", "city": "Denver", "state": "CO", "zip": "80202", "country": "United States"}'::jsonb
  );