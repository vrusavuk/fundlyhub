-- Create sample fundraisers for testing
DO $$
DECLARE
    i INTEGER;
    random_user_id UUID;
    random_org_id UUID;
    sample_user_ids UUID[] := ARRAY[
        'a1b2c3d4-e5f6-7890-abcd-123456789001',
        'a1b2c3d4-e5f6-7890-abcd-123456789002',
        'a1b2c3d4-e5f6-7890-abcd-123456789003',
        'a1b2c3d4-e5f6-7890-abcd-123456789004',
        'a1b2c3d4-e5f6-7890-abcd-123456789005'
    ];
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
        'Environmental Cleanup Initiative'
    ];
    sample_categories TEXT[] := ARRAY['Medical', 'Emergency', 'Education', 'Community', 'Animal', 'Environment', 'Sports', 'Arts'];
    sample_locations TEXT[] := ARRAY[
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
        'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
        'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
        'Seattle, WA', 'Denver, CO', 'Boston, MA', 'Nashville, TN', 'Portland, OR',
        'Miami, FL', 'Atlanta, GA', 'Las Vegas, NV', 'Detroit, MI', 'Memphis, TN'
    ];
    sample_names TEXT[] := ARRAY[
        'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Brown',
        'Christopher Wilson', 'Amanda Davis', 'Matthew Taylor', 'Lauren Anderson', 'James Martinez',
        'Ashley Thompson', 'Daniel Garcia', 'Nicole White', 'Ryan Lee', 'Samantha Clark',
        'Kevin Martinez', 'Rachel Anderson', 'Tyler Johnson', 'Stephanie Brown', 'Justin Wilson'
    ];
    random_title TEXT;
    random_category TEXT;
    random_location TEXT;
    random_name TEXT;
    random_goal NUMERIC;
    random_raised NUMERIC;
    random_summary TEXT;
    random_story TEXT;
    random_slug TEXT;
    random_created_at TIMESTAMPTZ;
BEGIN
    -- First, create some sample user profiles (if they don't exist)
    FOR i IN 1..5 LOOP
        INSERT INTO public.profiles (id, name, email, role)
        VALUES (
            sample_user_ids[i],
            sample_names[i],
            'user' || i || '@example.com',
            'creator'
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Create 1000 sample fundraisers
    FOR i IN 1..1000 LOOP
        -- Select random data
        random_user_id := sample_user_ids[1 + (random() * 4)::INTEGER];
        random_title := sample_titles[1 + (random() * (array_length(sample_titles, 1) - 1))::INTEGER];
        random_category := sample_categories[1 + (random() * (array_length(sample_categories, 1) - 1))::INTEGER];
        random_location := sample_locations[1 + (random() * (array_length(sample_locations, 1) - 1))::INTEGER];
        random_name := sample_names[1 + (random() * (array_length(sample_names, 1) - 1))::INTEGER];
        
        -- Generate random amounts
        random_goal := (1000 + random() * 49000)::NUMERIC; -- $1K to $50K
        random_raised := (random() * random_goal * 1.2)::NUMERIC; -- 0% to 120% of goal
        
        -- Generate random date within last year
        random_created_at := NOW() - (random() * INTERVAL '365 days');
        
        -- Create unique slug
        random_slug := lower(replace(random_title, ' ', '-')) || '-' || i;
        
        -- Generate random content
        random_summary := 'Help us raise funds for ' || random_title || '. Every donation makes a difference in ' || random_location || '.';
        random_story := '<p>We are reaching out to our community for support with ' || random_title || '.</p><p>This initiative is crucial for our community in ' || random_location || '. With your help, we can make a real difference.</p><p>Every donation, no matter the size, brings us closer to our goal of $' || random_goal || '. Thank you for your support!</p>';
        
        -- Add some variation to titles
        IF i % 5 = 0 THEN
            random_title := 'URGENT: ' || random_title;
        ELSIF i % 7 = 0 THEN
            random_title := random_title || ' - Time Sensitive';
        END IF;

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
                WHEN random_category = 'Medical' THEN 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400'
                WHEN random_category = 'Emergency' THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
                WHEN random_category = 'Education' THEN 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400'
                WHEN random_category = 'Community' THEN 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400'
                WHEN random_category = 'Animal' THEN 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=400'
                WHEN random_category = 'Environment' THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'
                WHEN random_category = 'Sports' THEN 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'
                WHEN random_category = 'Arts' THEN 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400'
                ELSE 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400'
            END,
            random_location,
            random_user_id,
            'active',
            'public',
            random_name,
            random_created_at,
            random_created_at
        );

        -- Add some random donations for each fundraiser
        DECLARE
            fundraiser_id UUID;
            donation_count INTEGER;
            j INTEGER;
            donation_amount NUMERIC;
            donation_date TIMESTAMPTZ;
        BEGIN
            -- Get the fundraiser ID
            SELECT id INTO fundraiser_id FROM public.fundraisers WHERE slug = random_slug;
            
            -- Random number of donations (0-20)
            donation_count := (random() * 20)::INTEGER;
            
            FOR j IN 1..donation_count LOOP
                donation_amount := (5 + random() * 495)::NUMERIC; -- $5 to $500
                donation_date := random_created_at + (random() * (NOW() - random_created_at));
                
                INSERT INTO public.donations (
                    fundraiser_id,
                    donor_user_id,
                    amount,
                    currency,
                    payment_status,
                    payment_provider,
                    created_at
                ) VALUES (
                    fundraiser_id,
                    sample_user_ids[1 + (random() * 4)::INTEGER],
                    donation_amount,
                    'USD',
                    'paid',
                    'stripe',
                    donation_date
                );
            END LOOP;
        END;

        -- Add some random comments
        DECLARE
            comment_count INTEGER;
            k INTEGER;
            comment_content TEXT;
        BEGIN
            comment_count := (random() * 10)::INTEGER; -- 0-10 comments
            
            FOR k IN 1..comment_count LOOP
                comment_content := CASE 
                    WHEN k % 4 = 0 THEN 'Great cause! Happy to support.'
                    WHEN k % 4 = 1 THEN 'Wishing you all the best with this important initiative.'
                    WHEN k % 4 = 2 THEN 'Thank you for organizing this. Much needed!'
                    ELSE 'Shared with my network. Hope this helps!'
                END;
                
                INSERT INTO public.comments (
                    fundraiser_id,
                    author_id,
                    content,
                    created_at
                ) VALUES (
                    (SELECT id FROM public.fundraisers WHERE slug = random_slug),
                    sample_user_ids[1 + (random() * 4)::INTEGER],
                    comment_content,
                    random_created_at + (random() * (NOW() - random_created_at))
                );
            END LOOP;
        END;

        -- Progress indicator
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Created % fundraisers...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully created 1000 sample fundraisers with donations and comments!';
END $$;