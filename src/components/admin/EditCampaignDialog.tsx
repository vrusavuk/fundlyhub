import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/services/logger.service';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { DialogErrorBadge } from "@/components/common/DialogErrorBadge";
import { 
  formatValidationErrors, 
  extractSupabaseError, 
  shouldShowRetry,
  getErrorTitle 
} from "@/lib/utils/dialogNotifications";
import { campaignEditSchema, type CampaignEditData } from '@/lib/validation/campaignEdit.schema';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/ui/ImageUpload';

interface EditCampaignDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaignId: string, changes: Record<string, any>, imageOperations?: any) => Promise<void>;
}

export function EditCampaignDialog({ 
  campaign, 
  open, 
  onOpenChange, 
  onSave 
}: EditCampaignDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<any>(null);
  const { toast } = useToast();
  const { categories } = useCategories();
  
  // Image tracking state
  const [uploadedCoverImageId, setUploadedCoverImageId] = useState<string | null>(null);
  const [uploadedCoverImagePath, setUploadedCoverImagePath] = useState<string | null>(null);
  
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
      coverImageId: null,
      coverImagePath: null,
      video_url: campaign?.video_url || '',
      images: campaign?.images || [],
      galleryImageIds: [],
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
        coverImageId: null,
        coverImagePath: null,
        video_url: campaign.video_url || '',
        images: campaign.images || [],
        galleryImageIds: [],
        end_date: campaign.end_date || null,
        beneficiary_name: campaign.beneficiary_name || '',
        beneficiary_contact: campaign.beneficiary_contact || '',
      });
    }
  }, [campaign, form]);

  // Normalize values for comparison - Step 4
  const normalizeValue = (value: any): any => {
    // Null/undefined normalization
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Number normalization
    if (typeof value === 'number') {
      return value;
    }
    
    // String that looks like number
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    
    // Boolean normalization
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Array normalization
    if (Array.isArray(value)) {
      return value.length === 0 ? null : value;
    }
    
    return value;
  };

  // Enhanced change detection with type coercion
  const detectChanges = (formData: CampaignEditData, original: any) => {
    const changes: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = original[key];
      
      // Normalize both values
      const normalizedNew = normalizeValue(value);
      const normalizedOld = normalizeValue(originalValue);
      
      // Direct comparison for primitives
      if (typeof normalizedNew === 'string' || typeof normalizedNew === 'number' || typeof normalizedNew === 'boolean') {
        if (normalizedNew !== normalizedOld) {
          changes[key] = value;
        }
      }
      // JSON comparison for objects/arrays
      else if (JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)) {
        changes[key] = value;
      }
    });
    
    return changes;
  };

  const onSubmit = async (data: CampaignEditData) => {
    if (!campaign) return;
    
    // Detect regular changes
    const changes = detectChanges(data, campaign);
    
    // Prepare image operations
    const imageOperations: any = {};
    
    if (uploadedCoverImageId) {
      imageOperations.coverImageId = uploadedCoverImageId;
      imageOperations.coverImagePath = uploadedCoverImagePath;
      
      // Track previous cover image for cleanup
      const previousImageQuery = await supabase
        .from('fundraiser_images')
        .select('id')
        .eq('fundraiser_id', campaign.id)
        .eq('image_type', 'cover')
        .maybeSingle();
      
      if (previousImageQuery.data) {
        imageOperations.previousCoverImageId = previousImageQuery.data.id;
      }
      
      // Add cover_image URL to changes if new upload
      changes.cover_image = data.cover_image;
    }
    
    if (Object.keys(changes).length === 0 && !imageOperations.coverImageId) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(campaign.id, changes, imageOperations);
      setSubmitError(null);
      
      toast({
        title: "Campaign Updated",
        description: imageOperations.coverImageId 
          ? "Campaign and images have been successfully updated."
          : "Campaign has been successfully updated.",
      });
      
      onOpenChange(false);
    } catch (error: any) {
      setSubmitError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Make changes to "{campaign?.title}"
          </DialogDescription>
        </DialogHeader>

        {/* Validation errors */}
        {Object.keys(form.formState.errors).length > 0 && (
          <DialogErrorBadge
            variant="error"
            title="Form Validation Failed"
            message={formatValidationErrors(form.formState.errors)}
            dismissible
            onDismiss={() => form.clearErrors()}
          />
        )}

        {/* Submit error */}
        {submitError && (
          <DialogErrorBadge
            variant="error"
            title={getErrorTitle(submitError)}
            message={extractSupabaseError(submitError)}
            dismissible
            onDismiss={() => setSubmitError(null)}
            action={shouldShowRetry(submitError) ? {
              label: "Retry",
              onClick: form.handleSubmit(onSubmit)
            } : undefined}
          />
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
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {/* Upload Option */}
                            <ImageUpload
                              value={uploadedCoverImageId ? [form.watch('cover_image')] : (field.value ? [field.value] : [])}
                              onChange={(url) => {
                                // Handle both string and array types
                                const imageUrl = typeof url === 'string' ? url : (Array.isArray(url) ? url[0] : '');
                                if (imageUrl) {
                                  field.onChange(imageUrl);
                                }
                              }}
                              onImageIdChange={(ids) => {
                                // Handle both string and array types (string when maxFiles=1)
                                const imageId = typeof ids === 'string' ? ids : (Array.isArray(ids) ? ids[0] : '');
                                if (imageId) {
                                  setUploadedCoverImageId(imageId);
                                  form.setValue('coverImageId', imageId);
                                }
                              }}
                              maxFiles={1}
                              bucket="fundraiser-images"
                              isDraft={false}
                              label="Upload New Cover Image"
                              description="Upload a new image or enter a URL below"
                              showPreview={true}
                            />
                            
                            {/* OR URL Input (for backward compatibility) */}
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                  Or use URL
                                </span>
                              </div>
                            </div>
                            
                            <Input 
                              {...field} 
                              value={field.value || ''} 
                              type="url" 
                              placeholder="https://example.com/image.jpg"
                              disabled={!!uploadedCoverImageId}
                            />
                            
                            {uploadedCoverImageId && (
                              <Alert>
                                <AlertDescription>
                                  Uploaded image will replace any existing cover image when you save.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a file or paste an image URL
                        </FormDescription>
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
                        <Select 
                          onValueChange={(value) => {
                            logger.debug('Status field changed', {
                              componentName: 'EditCampaignDialog',
                              operationName: 'statusChange',
                              campaignId: campaign?.id,
                              oldValue: field.value,
                              newValue: value
                            });
                            field.onChange(value);
                          }}
                          value={field.value}
                        >
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
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={() => {
                  logger.debug('Save button clicked', {
                    componentName: 'EditCampaignDialog',
                    operationName: 'saveButtonClick',
                    isSubmitting,
                    hasErrors: Object.keys(form.formState.errors).length > 0,
                    isDirty: form.formState.isDirty
                  });
                }}
              >
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
