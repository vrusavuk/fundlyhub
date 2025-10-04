import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { globalEventBus } from '@/lib/events';
import { createCampaignCreatedEvent } from '@/lib/events/domain/CampaignEvents';

export default function CreateFundraiser() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    story: '',
    goalAmount: '',
    category: '',
    beneficiaryName: '',
    location: '',
    coverImage: '',
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing dashes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const slug = generateSlug(formData.title);
      const goalAmount = parseFloat(formData.goalAmount);
      
      if (isNaN(goalAmount) || goalAmount <= 0) {
        toast({
          title: "Invalid goal amount",
          description: "Please enter a valid goal amount.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Find the selected category to get its ID
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      
      const { data, error } = await supabase
        .from('fundraisers')
        .insert({
          title: formData.title,
          slug: slug,
          summary: formData.summary,
          story_html: formData.story.replace(/\n/g, '<br>'),
          goal_amount: goalAmount,
          category: formData.category,
          category_id: selectedCategory?.id,
          beneficiary_name: formData.beneficiaryName,
          location: formData.location,
          cover_image: formData.coverImage || '/placeholder.svg',
          owner_user_id: user.id,
          status: 'active',
          visibility: 'public',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating fundraiser:', error);
        toast({
          title: "Error creating fundraiser",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Publish campaign created event
        try {
          const event = createCampaignCreatedEvent({
            campaignId: data.id,
            userId: user.id,
            title: formData.title,
            description: formData.summary,
            goalAmount: goalAmount,
            categoryId: selectedCategory?.id || '',
            visibility: 'public',
          });
          await globalEventBus.publish(event);
        } catch (eventError) {
          console.error('Failed to publish campaign created event:', eventError);
        }

        // Check if user was promoted to creator
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'creator') {
          toast({
            title: "🎉 Congratulations! You're now a Creator",
            description: "You can now manage and track your fundraising campaigns.",
          });
        } else {
          toast({
            title: "Fundraiser created!",
            description: "Your fundraiser has been created successfully.",
          });
        }
        
        navigate(`/fundraiser/${data.slug}`);
      }
    } catch (error: any) {
      console.error('Error creating fundraiser:', error);
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (categoriesLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer maxWidth="md" className="section-hierarchy">
        <PageHeader 
          title="Create New Fundraiser"
          description="Start your journey to make a difference"
          className="text-center"
        />
        <Card className="card-enhanced shadow-glow">
          <CardContent className="mobile-card-spacing">
            <form onSubmit={handleSubmit} className="mobile-form-spacing">
              <div className="component-hierarchy">
                <Label htmlFor="title" className="label-small">Fundraiser Title *</Label>
                <Input
                  id="title"
                  placeholder="Give your fundraiser a compelling title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="mobile-input-padding"
                  required
                />
              </div>

              <div className="component-hierarchy">
                <Label htmlFor="summary" className="label-small">Short Summary *</Label>
                <Textarea
                  id="summary"
                  placeholder="Write a brief summary of your fundraiser"
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  rows={3}
                  className="mobile-input-padding"
                  required
                />
              </div>

              <div className="mobile-grid grid-cols-1 md:grid-cols-2">
                <div className="component-hierarchy">
                  <Label htmlFor="goalAmount" className="label-small">Goal Amount (USD) *</Label>
                  <Input
                    id="goalAmount"
                    type="number"
                    placeholder="10000"
                    value={formData.goalAmount}
                    onChange={(e) => handleChange('goalAmount', e.target.value)}
                    min="1"
                    step="0.01"
                    className="mobile-input-padding"
                    required
                  />
                </div>

                <div className="component-hierarchy">
                  <Label htmlFor="category" className="label-small">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          <span className="flex items-center gap-2">
                            <span>{cat.emoji}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="component-hierarchy">
                <Label htmlFor="beneficiaryName" className="label-small">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  placeholder="Who will benefit from this fundraiser?"
                  value={formData.beneficiaryName}
                  onChange={(e) => handleChange('beneficiaryName', e.target.value)}
                  className="mobile-input-padding"
                />
              </div>

              <div className="component-hierarchy">
                <Label htmlFor="location" className="label-small">Location</Label>
                <Input
                  id="location"
                  placeholder="City, State/Country"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="mobile-input-padding"
                />
              </div>

              <div className="component-hierarchy">
                <Label htmlFor="coverImage" className="label-small">Cover Image URL</Label>
                <Input
                  id="coverImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.coverImage}
                  onChange={(e) => handleChange('coverImage', e.target.value)}
                  className="mobile-input-padding"
                />
              </div>

              <div className="component-hierarchy">
                <Label htmlFor="story" className="label-small">Full Story *</Label>
                <Textarea
                  id="story"
                  placeholder="Tell your story in detail. Explain why you're raising funds and how the money will be used."
                  value={formData.story}
                  onChange={(e) => handleChange('story', e.target.value)}
                  rows={8}
                  className="mobile-input-padding"
                  required
                />
              </div>

              <div className="mobile-grid grid-cols-1 md:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="cta-secondary touch-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="cta-primary touch-button shadow-medium hover:shadow-glow transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </div>
                  ) : (
                    'Create Fundraiser'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}