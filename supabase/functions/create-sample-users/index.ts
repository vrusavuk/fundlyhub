import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Sample users to create
    const sampleUsers = [
      {
        email: 'sarah.johnson@example.com',
        password: 'tempPassword123!',
        user_metadata: {
          name: 'Sarah Johnson'
        },
        profile: {
          name: 'Sarah Johnson',
          bio: 'Passionate about animal welfare and environmental conservation. Working to make the world a better place for all living beings.',
          location: 'San Francisco, CA',
          website: 'https://sarahjohnson.org',
          role: 'creator'
        }
      },
      {
        email: 'michael.chen@example.com',
        password: 'tempPassword123!',
        user_metadata: {
          name: 'Michael Chen'
        },
        profile: {
          name: 'Michael Chen',
          bio: 'Healthcare advocate focused on improving medical access in underserved communities. Former nurse turned full-time organizer.',
          location: 'Seattle, WA',
          role: 'creator'
        }
      },
      {
        email: 'emma.rodriguez@example.com',
        password: 'tempPassword123!',
        user_metadata: {
          name: 'Emma Rodriguez'
        },
        profile: {
          name: 'Emma Rodriguez',
          bio: 'Education enthusiast working to provide learning opportunities for children in low-income areas.',
          location: 'Austin, TX',
          website: 'https://eduforall.org',
          role: 'creator'
        }
      },
      {
        email: 'david.kim@example.com',
        password: 'tempPassword123!',
        user_metadata: {
          name: 'David Kim'
        },
        profile: {
          name: 'David Kim',
          bio: 'Emergency response coordinator helping communities recover from natural disasters.',
          location: 'Los Angeles, CA',
          role: 'creator'
        }
      }
    ]

    const createdUsers = []

    // Create each user
    for (const userData of sampleUsers) {
      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true // Auto-confirm email for sample users
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        continue
      }

      if (authUser.user) {
        // Update the profile (it should be created by the trigger, but let's update it with our data)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            ...userData.profile,
            email: userData.email
          })
          .eq('id', authUser.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        } else {
          createdUsers.push({
            id: authUser.user.id,
            email: userData.email,
            name: userData.profile.name
          })
        }
      }
    }

    // Now reassign some fundraisers to the new users
    if (createdUsers.length > 0) {
      // Get existing fundraisers
      const { data: fundraisers } = await supabaseAdmin
        .from('fundraisers')
        .select('id')
        .limit(4)

      if (fundraisers && fundraisers.length > 0) {
        // Distribute fundraisers among the new users
        for (let i = 0; i < Math.min(fundraisers.length, createdUsers.length); i++) {
          await supabaseAdmin
            .from('fundraisers')
            .update({ owner_user_id: createdUsers[i].id })
            .eq('id', fundraisers[i].id)
        }
      }

      // Create some follow relationships
      const vitaliyId = 'ebd04736-b785-4569-83d4-5fee5a49e3fa'
      
      if (createdUsers.length >= 2) {
        // Vitaliy follows first two users
        await supabaseAdmin.from('subscriptions').insert([
          { follower_id: vitaliyId, following_id: createdUsers[0].id, following_type: 'user' },
          { follower_id: vitaliyId, following_id: createdUsers[1].id, following_type: 'user' }
        ])

        // First user follows Vitaliy back
        await supabaseAdmin.from('subscriptions').insert([
          { follower_id: createdUsers[0].id, following_id: vitaliyId, following_type: 'user' }
        ])

        // Create cross-follows between sample users
        if (createdUsers.length >= 4) {
          await supabaseAdmin.from('subscriptions').insert([
            { follower_id: createdUsers[1].id, following_id: createdUsers[2].id, following_type: 'user' },
            { follower_id: createdUsers[2].id, following_id: createdUsers[3].id, following_type: 'user' },
            { follower_id: createdUsers[2].id, following_id: createdUsers[0].id, following_type: 'user' }
          ])
        }
      }

      // Update follower/following counts for all affected users
      const allUserIds = [vitaliyId, ...createdUsers.map(u => u.id)]
      
      for (const userId of allUserIds) {
        const { data: followingCount } = await supabaseAdmin
          .from('subscriptions')
          .select('id', { count: 'exact' })
          .eq('follower_id', userId)
          .eq('following_type', 'user')

        const { data: followerCount } = await supabaseAdmin
          .from('subscriptions')
          .select('id', { count: 'exact' })
          .eq('following_id', userId)
          .eq('following_type', 'user')

        await supabaseAdmin
          .from('profiles')
          .update({
            following_count: followingCount?.length || 0,
            follower_count: followerCount?.length || 0
          })
          .eq('id', userId)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${createdUsers.length} sample users with proper auth entries`,
        users: createdUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})