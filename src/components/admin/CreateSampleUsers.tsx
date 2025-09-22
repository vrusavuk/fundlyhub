import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function CreateSampleUsers() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateSampleUsers = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-sample-users');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: data.message,
      });

      // Refresh the page to see the new users
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error creating sample users:', error);
      toast({
        title: "Error",
        description: "Failed to create sample users. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Create Sample Users</CardTitle>
        <CardDescription>
          Create sample users with proper auth.users entries for testing the follow functionality.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleCreateSampleUsers} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Sample Users'}
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          This will create 4 sample users: Sarah Johnson, Michael Chen, Emma Rodriguez, and David Kim.
        </p>
      </CardContent>
    </Card>
  );
}