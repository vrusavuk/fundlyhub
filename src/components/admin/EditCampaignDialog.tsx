import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { campaignEditSchema, type CampaignEditData } from '@/lib/validation/campaignEdit.schema';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

interface EditCampaignDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaignId: string, changes: Record<string, any>) => Promise<void>;
}

export function EditCampaignDialog({ 
  campaign, 
  open, 
  onOpenChange, 
  onSave 
}: EditCampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories } = useCategories();
  const { toast } = useToast();
  
  const form = useForm<CampaignEditData>({
    resolver: zodResolver(campaignEditSchema),
    defaultValues: {
      title: campaign?.title || '',
      slug: campaign?.slug || '',
      summary: campaign?.summary || '',
      story_html: campaign?.story_html || '',
      goal_amount: campaign?.goal_amount || 0,
      currency: campaign?.currency || 'USD',
      category_id: campaign?.category_id || null,
      location: campaign?.location || '',
      tags: campaign?.tags || [],
      visibility: campaign?.visibility || 'public',
      status: campaign?.status || 'draft',
      cover_image: campaign?.cover_image || '',
      video_url: campaign?.video_url || '',
      images: campaign?.images || [],
      end_date: campaign?.end_date || null,
      beneficiary_name: campaign?.beneficiary_name || '',
      beneficiary_contact: campaign?.beneficiary_contact || '',
    },
  });

  // Reset form when campaign changes
  useEffect(() => {
    if (campaign) {
      form.reset({
        title: campaign.title || '',
        slug: campaign.slug || '',
        summary: campaign.summary || '',
        story_html: campaign.story_html || '',
        goal_amount: campaign.goal_amount || 0,
        currency: campaign.currency || 'USD',
        category_id: campaign.category_id || null,
        location: campaign.location || '',
        tags: campaign.tags || [],
        visibility: campaign.visibility || 'public',
        status: campaign.status || 'draft',
        cover_image: campaign.cover_image || '',
        video_url: campaign.video_url || '',
        images: campaign.images || [],
        end_date: campaign.end_date || null,
        beneficiary_name: campaign.beneficiary_name || '',
        beneficiary_contact: campaign.beneficiary_contact || '',
      });
    }
  }, [campaign, form]);

  const onSubmit = async (data: CampaignEditData) => {
    console.group('📝 Campaign Edit Form Submission');
    console.log('Form data:', data);
    console.log('Campaign original data:', campaign);
    
    setIsSubmitting(true);
    
    try {
      // Detect changes with proper null/empty string handling and deep comparison
      const changes: Record<string, any> = {};
      
      (Object.keys(data) as Array<keyof CampaignEditData>).forEach((key) => {
        const formValue = data[key];
        const campaignValue = campaign[key];
        
        // Normalize empty strings and null
        const normalizedFormValue = formValue === '' ? null : formValue;
        const normalizedCampaignValue = campaignValue === '' ? null : campaignValue;
        
        // Deep comparison for objects/arrays, JSON stringify for primitives
        const isChanged = JSON.stringify(normalizedFormValue) !== JSON.stringify(normalizedCampaignValue);
        
        if (isChanged) {
          console.log(`Field "${key}" changed:`, {
            from: normalizedCampaignValue,
            to: normalizedFormValue
          });
          changes[key] = normalizedFormValue;
        }
      });

      console.log('📊 Changes detected:', changes);
      console.log('📊 Number of changes:', Object.keys(changes).length);

      if (Object.keys(changes).length === 0) {
        console.log('⚠️ No changes detected, closing dialog');
        toast({
          title: "No changes",
          description: "No fields were modified.",
        });
        onOpenChange(false);
        console.groupEnd();
        return;
      }

      console.log('🚀 Calling onSave with campaign ID:', campaign.id);
      console.log('🚀 Changes payload:', changes);
      
      // Call onSave - it will throw on error
      await onSave(campaign.id, changes);
      
      console.log('✅ Campaign updated successfully');
      toast({
        title: "Campaign updated",
        description: `Successfully updated ${Object.keys(changes).length} field(s).`,
      });
      
      onOpenChange(false);
      console.groupEnd();
    } catch (error) {
      console.error('❌ Failed to update campaign:', error);
      
      // Extract meaningful error message
      let errorMessage = "Failed to update campaign. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Update failed",
        description: errorMessage,
      });
      console.groupEnd();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLiveCampaign = campaign?.status === 'active';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Make changes to "{campaign?.title}"
          </DialogDescription>
        </DialogHeader>

        {isLiveCampaign && (
          <Alert variant="default" className="border-warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This campaign is currently live. Changes will be visible to donors immediately.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[50vh] mt-4">
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          URL-friendly identifier (lowercase, hyphens only)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.emoji} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="City, Country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="goal_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {campaign?.stats?.donor_count > 0 && (
                            <span className="text-warning">
                              ⚠️ Campaign has {campaign.stats.donor_count} donors. Reducing goal amount may affect trust.
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {campaign?.stats?.donor_count > 0 && (
                            <span className="text-destructive">
                              ⚠️ Cannot change currency after receiving donations
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="beneficiary_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beneficiary Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="story_html"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Story</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} rows={10} />
                        </FormControl>
                        <FormDescription>
                          HTML content for the campaign story
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending Review</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="ended">Ended</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Public campaigns appear in search, unlisted are accessible via link only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="date" />
                        </FormControl>
                        <FormDescription>
                          Optional deadline for the campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
