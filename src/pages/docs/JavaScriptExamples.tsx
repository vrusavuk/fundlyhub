/**
 * JavaScript Examples page for API documentation
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Info, Code, Zap } from "lucide-react";

export function DocsJavaScriptExamples() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">JavaScript Examples</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Real-world JavaScript and TypeScript examples for integrating with the FundlyHub API.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          All examples use the Supabase JavaScript client. Make sure to install it with <code>npm install @supabase/supabase-js</code>
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Getting Started" 
        description="Basic setup and configuration examples"
      >
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4" />
              <h4 className="font-semibold text-foreground">Initialize Supabase Client</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Set up the Supabase client for your application</p>
            <CodeBlock 
              code={`// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-url.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For TypeScript projects, you can add type definitions
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)`}
              language="javascript"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4" />
              <h4 className="font-semibold text-foreground">Environment Configuration</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Configure environment variables for different environments</p>
            <CodeBlock 
              code={`// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

// config.js
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Fundraiser Management" 
        description="Complete examples for managing fundraising campaigns"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Create a Complete Fundraiser</h4>
            <p className="text-sm text-muted-foreground mb-3">Full example including validation, image upload, and error handling</p>
            <CodeBlock 
              code={`// createFundraiser.js
import { supabase } from './supabase'

export const createFundraiser = async (fundraiserData, imageFile) => {
  try {
    // 1. Upload cover image if provided
    let coverImageUrl = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = \`\${Math.random()}.\${fileExt}\`
      const filePath = \`fundraiser-images/\${fileName}\`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fundraiser-images')
        .upload(filePath, imageFile)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('fundraiser-images')
        .getPublicUrl(filePath)
      
      coverImageUrl = publicUrlData.publicUrl
    }

    // 2. Create the fundraiser
    const { data, error } = await supabase
      .from('fundraisers')
      .insert([{
        title: fundraiserData.title,
        summary: fundraiserData.summary,
        story_html: fundraiserData.story_html,
        goal_amount: parseFloat(fundraiserData.goal_amount),
        category_id: fundraiserData.category_id,
        cover_image: coverImageUrl,
        location: fundraiserData.location,
        tags: fundraiserData.tags || [],
        end_date: fundraiserData.end_date,
        status: 'draft' // Start as draft
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating fundraiser:', error)
    return { success: false, error: error.message }
  }
}`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Fundraiser Dashboard with Statistics</h4>
            <p className="text-sm text-muted-foreground mb-3">Build a dashboard showing fundraiser performance</p>
            <CodeBlock 
              code={`// fundraiserDashboard.js
import { supabase } from './supabase'

export const getFundraiserDashboard = async (userId) => {
  try {
    // Get user's fundraisers with basic info
    const { data: fundraisers, error: fundraisersError } = await supabase
      .from('fundraisers')
      .select(\`
        id,
        title,
        slug,
        goal_amount,
        status,
        created_at,
        categories(name, emoji)
      \`)
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })

    if (fundraisersError) throw fundraisersError

    // Get statistics for all fundraisers
    const fundraiserIds = fundraisers.map(f => f.id)
    const { data: stats, error: statsError } = await supabase
      .rpc('get_fundraiser_totals', { fundraiser_ids: fundraiserIds })

    if (statsError) throw statsError

    // Combine data
    const fundraisersWithStats = fundraisers.map(fundraiser => {
      const stat = stats.find(s => s.fundraiser_id === fundraiser.id)
      return {
        ...fundraiser,
        total_raised: stat?.total_raised || 0,
        donor_count: stat?.donor_count || 0,
        progress_percentage: stat ? (stat.total_raised / fundraiser.goal_amount) * 100 : 0
      }
    })

    // Calculate totals
    const totalStats = {
      total_campaigns: fundraisers.length,
      active_campaigns: fundraisers.filter(f => f.status === 'active').length,
      total_raised: stats.reduce((sum, stat) => sum + (stat.total_raised || 0), 0),
      total_donors: stats.reduce((sum, stat) => sum + (stat.donor_count || 0), 0)
    }

    return {
      success: true,
      fundraisers: fundraisersWithStats,
      stats: totalStats
    }
  } catch (error) {
    console.error('Error loading dashboard:', error)
    return { success: false, error: error.message }
  }
}`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Real-time Fundraiser Updates</h4>
            <p className="text-sm text-muted-foreground mb-3">Subscribe to live updates for fundraiser statistics</p>
            <CodeBlock 
              code={`// useRealtimeFundraiser.js (React Hook)
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export const useRealtimeFundraiser = (fundraiserId) => {
  const [fundraiser, setFundraiser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let subscription

    const fetchFundraiser = async () => {
      try {
        // Get initial data
        const { data, error } = await supabase
          .from('fundraisers')
          .select(\`
            *,
            profiles(name, avatar),
            categories(name, emoji)
          \`)
          .eq('id', fundraiserId)
          .single()

        if (error) throw error

        // Get statistics
        const { data: stats } = await supabase
          .rpc('get_fundraiser_totals', { 
            fundraiser_ids: [fundraiserId] 
          })

        const stat = stats?.[0]
        setFundraiser({
          ...data,
          total_raised: stat?.total_raised || 0,
          donor_count: stat?.donor_count || 0
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchFundraiser()

    // Subscribe to donation changes
    subscription = supabase
      .channel('fundraiser-donations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: \`fundraiser_id=eq.\${fundraiserId}\`
      }, async (payload) => {
        // Refresh statistics when new donation is made
        const { data: stats } = await supabase
          .rpc('get_fundraiser_totals', { 
            fundraiser_ids: [fundraiserId] 
          })

        const stat = stats?.[0]
        setFundraiser(prev => ({
          ...prev,
          total_raised: stat?.total_raised || 0,
          donor_count: stat?.donor_count || 0
        }))
      })
      .subscribe()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [fundraiserId])

  return { fundraiser, loading, error }
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="User Authentication & Profiles" 
        description="Complete authentication and profile management examples"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Complete Authentication Flow</h4>
            <p className="text-sm text-muted-foreground mb-3">Sign up, sign in, and session management</p>
            <CodeBlock 
              code={`// auth.js
import { supabase } from './supabase'

export const authService = {
  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: 'user'
          }
        }
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Sign in
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { success: true, session }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Profile with Social Features</h4>
            <p className="text-sm text-muted-foreground mb-3">Get user profile with followers, fundraisers, and activity</p>
            <CodeBlock 
              code={`// profileService.js
import { supabase } from './supabase'

export const getCompleteProfile = async (userId) => {
  try {
    // Get basic profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get user's fundraisers
    const { data: fundraisers, error: fundraisersError } = await supabase
      .from('fundraisers')
      .select(\`
        id,
        title,
        slug,
        summary,
        goal_amount,
        status,
        cover_image,
        created_at,
        categories(name, emoji)
      \`)
      .eq('owner_user_id', userId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6)

    if (fundraisersError) throw fundraisersError

    // Get recent activity
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('actor_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activitiesError) throw activitiesError

    // Check if current user follows this profile
    const { data: { user } } = await supabase.auth.getUser()
    let isFollowing = false
    
    if (user && user.id !== userId) {
      const { data: followData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .eq('following_type', 'user')
        .single()
      
      isFollowing = !!followData
    }

    return {
      success: true,
      data: {
        profile,
        fundraisers,
        activities,
        isFollowing,
        isOwnProfile: user?.id === userId
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    return { success: false, error: error.message }
  }
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>

      <ApiEndpointSection 
        title="Advanced Examples" 
        description="Complex integrations and optimization techniques"
      >
        <div className="space-y-8">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Infinite Scroll with Search</h4>
            <p className="text-sm text-muted-foreground mb-3">Implement pagination and search with React</p>
            <CodeBlock 
              code={`// useInfiniteSearch.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export const useInfiniteSearch = (searchTerm = '', filters = {}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)

  const ITEMS_PER_PAGE = 20

  const loadItems = useCallback(async (offset = 0, reset = false) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('fundraisers')
        .select(\`
          *,
          profiles(name, avatar),
          categories(name, emoji)
        \`)
        .eq('status', 'active')
        .eq('visibility', 'public')

      // Add search filter
      if (searchTerm) {
        query = query.or(\`title.ilike.%\${searchTerm}%,summary.ilike.%\${searchTerm}%\`)
      }

      // Add category filter
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      // Add location filter
      if (filters.location) {
        query = query.ilike('location', \`%\${filters.location}%\`)
      }

      // Add goal amount range
      if (filters.minGoal) {
        query = query.gte('goal_amount', filters.minGoal)
      }
      if (filters.maxGoal) {
        query = query.lte('goal_amount', filters.maxGoal)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

      if (error) throw error

      const newItems = reset ? data : [...items, ...data]
      setItems(newItems)
      setHasMore(data.length === ITEMS_PER_PAGE)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filters, items])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadItems(items.length)
    }
  }, [items.length, loading, hasMore, loadItems])

  const refresh = useCallback(() => {
    loadItems(0, true)
  }, [loadItems])

  useEffect(() => {
    refresh()
  }, [searchTerm, filters])

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    refresh
  }
}`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Batch Operations with Error Handling</h4>
            <p className="text-sm text-muted-foreground mb-3">Process multiple operations efficiently with proper error handling</p>
            <CodeBlock 
              code={`// batchOperations.js
import { supabase } from './supabase'

export const batchUpdateFundraisers = async (updates) => {
  const results = []
  const errors = []

  try {
    // Process updates in batches of 10
    const batchSize = 10
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (update) => {
        try {
          const { data, error } = await supabase
            .from('fundraisers')
            .update(update.data)
            .eq('id', update.id)
            .select()
            .single()

          if (error) throw error
          return { success: true, id: update.id, data }
        } catch (error) {
          return { success: false, id: update.id, error: error.message }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result)
        } else {
          errors.push(result)
        }
      })

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return {
      success: true,
      results,
      errors,
      summary: {
        total: updates.length,
        successful: results.length,
        failed: errors.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      results,
      errors
    }
  }
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}