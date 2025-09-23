/**
 * API Documentation Profiles page
 */
import { CodeBlock } from "@/components/docs/CodeBlock";
import { SwaggerEndpoint } from "@/components/docs/SwaggerEndpoint";
import { ApiEndpointSection } from "@/components/docs/ApiEndpointSection";
import { EndpointDetails } from "@/components/docs/EndpointDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function DocsProfiles() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">User Profiles API</h1>
      <p className="text-xl text-muted-foreground mb-6">
        Manage user profiles and retrieve public profile information.
      </p>

      <Alert className="mb-8">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Profile updates require authentication and users can only modify their own profiles.
        </AlertDescription>
      </Alert>

      <ApiEndpointSection 
        title="Profile Management" 
        description="CRUD operations for user profiles with privacy controls."
      >
        {/* List Profiles */}
        <SwaggerEndpoint
          method="GET"
          path="/profiles"
          summary="List user profiles"
          description="Retrieve public user profiles with pagination"
          tags={['Profiles']}
        >
          <EndpointDetails
            parameters={[
              { name: 'limit', type: 'integer', description: 'Number of results (max 100)', example: '20' },
              { name: 'offset', type: 'integer', description: 'Pagination offset', example: '0' }
            ]}
            responses={[
              { status: '200', description: 'Array of public user profile objects' },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get Public Profiles',
                code: `const { data, error } = await supabase
  .from('profiles')
  .select('id, name, avatar, bio, created_at')
  .order('created_at', { ascending: false })
  .range(0, 19)`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Get Single Profile */}
        <SwaggerEndpoint
          method="GET"
          path="/profiles/{userId}"
          summary="Get user profile"
          description="Retrieve a specific user's public profile information"
          tags={['Profiles']}
        >
          <EndpointDetails
            parameters={[
              { name: 'userId', type: 'uuid', required: true, description: 'User ID' }
            ]}
            responses={[
              { status: '200', description: 'User profile object with public information' },
              { status: '404', description: 'User profile not found' },
              { status: '500', description: 'Internal server error' }
            ]}
            examples={[
              {
                title: 'Get Profile by ID',
                code: `const { data, error } = await supabase
  .from('profiles')
  .select('id, name, avatar, bio, location, created_at')
  .eq('id', userId)
  .single()`
              },
              {
                title: 'With Fundraiser Count',
                description: 'Get profile with associated fundraiser statistics',
                code: `import { userProfileService } from '@/lib/services/userProfile.service'

const profile = await userProfileService.getProfileWithStats(userId)

console.log('Profile:', profile.name)
console.log('Fundraisers:', profile.fundraiser_count)
console.log('Total raised:', profile.total_raised)`
              }
            ]}
          />
        </SwaggerEndpoint>

        {/* Update Profile */}
        <SwaggerEndpoint
          method="PUT"
          path="/profiles/{userId}"
          summary="Update user profile"
          description="Update user's own profile information"
          tags={['Profiles']}
          requiresAuth={true}
        >
          <EndpointDetails
            parameters={[
              { name: 'userId', type: 'uuid', required: true, description: 'User ID (must be authenticated user)' }
            ]}
            requestBody={{
              contentType: 'application/json',
              example: `{
  "name": "John Doe",
  "bio": "Passionate about helping local communities",
  "avatar": "https://example.com/avatar.jpg",
  "location": "Austin, TX",
  "website": "https://johndoe.com"
}`
            }}
            responses={[
              { status: '200', description: 'Profile updated successfully' },
              { status: '400', description: 'Validation errors' },
              { status: '401', description: 'Authentication required' },
              { status: '403', description: 'Permission denied - can only update own profile' },
              { status: '404', description: 'Profile not found' }
            ]}
            examples={[
              {
                title: 'Update Profile',
                code: `const { data, error } = await supabase
  .from('profiles')
  .update({
    name: 'John Doe',
    bio: 'Passionate about helping local communities',
    avatar: 'https://example.com/avatar.jpg',
    location: 'Austin, TX'
  })
  .eq('id', currentUser.id)
  .select()`
              }
            ]}
          />
        </SwaggerEndpoint>
      </ApiEndpointSection>

      <ApiEndpointSection title="Common Use Cases" description="Practical examples for working with user profiles">
        <div className="grid gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Search Profiles</h4>
            <p className="text-sm text-muted-foreground mb-3">Search for users by name or bio content</p>
            <CodeBlock 
              code={`const searchTerm = 'community organizer'
const { data, error } = await supabase
  .from('profiles')
  .select('id, name, avatar, bio')
  .or(\`name.ilike.%\${searchTerm}%,bio.ilike.%\${searchTerm}%\`)
  .limit(10)`}
              language="javascript"
            />
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-foreground">Profile Avatar Upload</h4>
            <p className="text-sm text-muted-foreground mb-3">Upload and update user avatar images</p>
            <CodeBlock 
              code={`// Upload avatar to Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(\`\${userId}/avatar.jpg\`, file)

if (data) {
  // Update profile with new avatar URL
  const { data: publicURL } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path)
    
  await supabase
    .from('profiles')
    .update({ avatar: publicURL.publicUrl })
    .eq('id', userId)
}`}
              language="javascript"
            />
          </div>
        </div>
      </ApiEndpointSection>
    </div>
  );
}