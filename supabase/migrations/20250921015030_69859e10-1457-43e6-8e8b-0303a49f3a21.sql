-- Create 1000 sample fundraisers for testing (simplified approach)
DO $$
DECLARE
    i INTEGER;
    sample_titles TEXT[] := ARRAY[
        'Help Save Our Local Animal Shelter',
        'Medical Emergency Fund for Sarah',
        'Rebuild After Hurricane Damage',
        'Support Student Education in Rural Areas',
        'Clean Water Initiative for Remote Villages',
        'Emergency Surgery for Baby Emma',
        'Disaster Relief for Flood Victims',
        'Community Garden Project',
        'Help Fund Cancer Treatment',
        'Rescue Abandoned Puppies',
        'Support Local Food Bank',
        'Emergency Housing for Homeless Veterans',
        'School Playground Renovation',
        'Wildlife Conservation Project',
        'Support Small Business Recovery',
        'Mental Health Awareness Campaign',
        'Youth Sports Equipment Fund',
        'Senior Center Renovation',
        'Art Therapy for Children',
        'Environmental Cleanup Initiative',
        'Support Local Library',
        'Help Family After House Fire',
        'Veteran Support Program',
        'Children Hospital Equipment',
        'Save Historic Building',
        'Community Kitchen Expansion',
        'Youth Art Program',
        'Senior Transportation Service',
        'Mental Health Counseling Center',
        'Playground Safety Upgrades'
    ];
    sample_categories TEXT[] := ARRAY['Medical', 'Emergency', 'Education', 'Community', 'Animal', 'Environment', 'Sports', 'Arts'];
    sample_locations TEXT[] := ARRAY[
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
        'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
        'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
        'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Nashville, TN', 'Portland, OR',
        'Miami, FL', 'Atlanta, GA', 'Las Vegas, NV', 'Detroit, MI', 'Memphis, TN',
        'Orlando, FL', 'San Francisco, CA', 'Pittsburgh, PA', 'Sacramento, CA', 'Kansas City, MO'
    ];
    sample_names TEXT[] := ARRAY[
        'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Brown',
        'Christopher Wilson', 'Amanda Davis', 'Matthew Taylor', 'Lauren Anderson', 'James Martinez',
        'Ashley Thompson', 'Daniel Garcia', 'Nicole White', 'Ryan Lee', 'Samantha Clark',
        'Kevin Martinez', 'Rachel Anderson', 'Tyler Johnson', 'Stephanie Brown', 'Justin Wilson',
        'Maria Lopez', 'Robert Taylor', 'Jennifer Miller', 'William Jones', 'Lisa Williams'
    ];
    random_title TEXT;
    random_category TEXT;
    random_location TEXT;
    random_name TEXT;
    random_goal NUMERIC;
    random_summary TEXT;
    random_story TEXT;
    random_slug TEXT;
    random_created_at TIMESTAMPTZ;
    sample_user_id UUID;
    title_base TEXT;
    story_templates TEXT[] := ARRAY[
        '<p>We are reaching out for your support during this challenging time. Your donation can make a real difference in our community.</p>',
        '<p>Every contribution brings us closer to our goal. Together, we can overcome this challenge and create positive change.</p>',
        '<p>This campaign is vital for our community. With your help, we can achieve our mission and help those in need.</p>',
        '<p>Time is of the essence. Your generous support will help us reach our goal and make an immediate impact.</p>',
        '<p>We believe in the power of community. Join us in making a difference with your contribution today.</p>'
    ];
BEGIN
    -- Use a default user ID (we'll create fundraisers without specific user ownership for now)
    -- In a real scenario, these would be linked to actual authenticated users
    sample_user_id := '00000000-0000-0000-0000-000000000000';

    RAISE NOTICE 'Starting to create 1000 sample fundraisers...';

    -- Create 1000 sample fundraisers
    FOR i IN 1..1000 LOOP
        -- Select random data
        title_base := sample_titles[1 + (random() * (array_length(sample_titles, 1) - 1))::INTEGER];
        random_category := sample_categories[1 + (random() * (array_length(sample_categories, 1) - 1))::INTEGER];
        random_location := sample_locations[1 + (random() * (array_length(sample_locations, 1) - 1))::INTEGER];
        random_name := sample_names[1 + (random() * (array_length(sample_names, 1) - 1))::INTEGER];
        
        -- Create variations of titles
        CASE 
            WHEN i % 5 = 0 THEN random_title := 'URGENT: ' || title_base;
            WHEN i % 7 = 0 THEN random_title := title_base || ' - Time Sensitive';
            WHEN i % 11 = 0 THEN random_title := 'Help ' || title_base;
            WHEN i % 13 = 0 THEN random_title := title_base || ' in ' || split_part(random_location, ',', 1);
            ELSE random_title := title_base;
        END CASE;
        
        -- Generate random amounts
        random_goal := (500 + random() * 49500)::NUMERIC; -- $500 to $50K
        
        -- Generate random date within last year
        random_created_at := NOW() - (random() * INTERVAL '365 days');
        
        -- Create unique slug
        random_slug := lower(regexp_replace(random_title, '[^a-zA-Z0-9\s]', '', 'g'));
        random_slug := lower(replace(random_slug, ' ', '-')) || '-' || i;
        
        -- Generate content
        random_summary := 'Help us raise funds for ' || title_base || '. Every donation makes a difference in ' || random_location || '. Join our community in supporting this important cause.';
        
        random_story := story_templates[1 + (random() * (array_length(story_templates, 1) - 1))::INTEGER] ||
                       '<p>Our goal is to raise $' || random_goal || ' for ' || title_base || ' in ' || random_location || '.</p>' ||
                       '<p>This initiative will directly benefit our community and help us create lasting positive change. Thank you for considering a donation.</p>';

        -- Insert fundraiser
        INSERT INTO public.fundraisers (
            title,
            slug,
            summary,
            story_html,
            goal_amount,
            currency,
            category,
            cover_image,
            location,
            owner_user_id,
            status,
            visibility,
            beneficiary_name,
            created_at,
            updated_at
        ) VALUES (
            random_title,
            random_slug,
            random_summary,
            random_story,
            random_goal,
            'USD',
            random_category,
            CASE 
                WHEN random_category = 'Medical' THEN 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=75'
                WHEN random_category = 'Emergency' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=75'
                WHEN random_category = 'Education' THEN 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=75'
                WHEN random_category = 'Community' THEN 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=75'
                WHEN random_category = 'Animal' THEN 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400&q=75'
                WHEN random_category = 'Environment' THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=75'
                WHEN random_category = 'Sports' THEN 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=75'
                WHEN random_category = 'Arts' THEN 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=75'
                ELSE 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=75'
            END,
            random_location,
            sample_user_id,
            'active',
            'public',
            random_name,
            random_created_at,
            random_created_at
        );

        -- Progress indicator
        IF i % 200 = 0 THEN
            RAISE NOTICE 'Created % fundraisers...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully created 1000 sample fundraisers!';
    RAISE NOTICE 'Note: These fundraisers use a placeholder user ID. You can create real fundraisers through the UI after authentication.';
END $$;