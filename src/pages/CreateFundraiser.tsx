import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const categories = [
  'Medical',
  'Emergency',
  'Education',
  'Community',
  'Animal',
  'Environment',
  'Sports',
  'Arts',
  'Other'
];

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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
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

      const { data, error } = await supabase
        .from('fundraisers')
        .insert({
          title: formData.title,
          slug: slug,
          summary: formData.summary,
          story_html: formData.story.replace(/\n/g, '<br>'),
          goal_amount: goalAmount,
          category: formData.category,
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
        toast({
          title: "Fundraiser created!",
          description: "Your fundraiser has been created successfully.",
        });
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Fundraiser</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Fundraiser Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your fundraiser a compelling title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Short Summary *</Label>
                  <Textarea
                    id="summary"
                    placeholder="Write a brief summary of your fundraiser"
                    value={formData.summary}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalAmount">Goal Amount (USD) *</Label>
                    <Input
                      id="goalAmount"
                      type="number"
                      placeholder="10000"
                      value={formData.goalAmount}
                      onChange={(e) => handleChange('goalAmount', e.target.value)}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                  <Input
                    id="beneficiaryName"
                    placeholder="Who will benefit from this fundraiser?"
                    value={formData.beneficiaryName}
                    onChange={(e) => handleChange('beneficiaryName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State/Country"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.coverImage}
                    onChange={(e) => handleChange('coverImage', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="story">Full Story *</Label>
                  <Textarea
                    id="story"
                    placeholder="Tell your story in detail. Explain why you're raising funds and how the money will be used."
                    value={formData.story}
                    onChange={(e) => handleChange('story', e.target.value)}
                    rows={8}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
        </div>
      </div>
    </div>
  );
}