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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { DialogErrorBadge } from "@/components/common/DialogErrorBadge";
import { DialogStatusIndicator } from "@/components/common/DialogStatusIndicator";
import { 
  formatValidationErrors, 
  extractSupabaseError, 
  shouldShowRetry,
  getErrorTitle 
} from "@/lib/utils/dialogNotifications";
import { campaignEditSchema, type CampaignEditData } from '@/lib/validation/campaignEdit.schema';
import { useCategories } from '@/hooks/useCategories';

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
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [submitError, setSubmitError] = useState<any>(null);
  const { toast } = useToast();
  const { categories } = useCategories();
  
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

  // Enhanced change detection with type coercion - Step 4
  const detectChanges = (formData: CampaignEditData, original: any) => {
    console.log('[DEBUG] detectChanges called', { formData, original });
    const changes: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = original[key];
      
      // Normalize both values
      const normalizedNew = normalizeValue(value);
      const normalizedOld = normalizeValue(originalValue);
      
      console.log(`[DEBUG] Comparing ${key}:`, {
        raw: { new: value, old: originalValue },
        normalized: { new: normalizedNew, old: normalizedOld },
        types: { new: typeof normalizedNew, old: typeof normalizedOld }
      });
      
      // Direct comparison for primitives
      if (typeof normalizedNew === 'string' || typeof normalizedNew === 'number' || typeof normalizedNew === 'boolean') {
        if (normalizedNew !== normalizedOld) {
          console.log(`[EditCampaign] Change detected in ${key}:`, { old: normalizedOld, new: normalizedNew });
          changes[key] = value; // Use original value, not normalized
        }
      }
      // JSON comparison for objects/arrays
      else if (JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)) {
        console.log(`[EditCampaign] Change detected in ${key}:`, { old: normalizedOld, new: normalizedNew });
        changes[key] = value; // Use original value, not normalized
      }
    });
    
    return changes;
  };

  const onSubmit = async (data: CampaignEditData) => {
    // Step 1: Debug logging at the very beginning
    console.log('[DEBUG] ========== FORM SUBMISSION STARTED ==========');
    console.log('[DEBUG] onSubmit called with data:', data);
    console.log('[DEBUG] campaign:', campaign);
    console.log('[DEBUG] form.formState:', form.formState);
    
    if (!campaign) {
      console.error('[DEBUG] No campaign provided!');
      return;
    }
    
    console.log('[EditCampaign] Starting submission', { campaignId: campaign.id });
    setStatusMessage("Validating changes...");
    
    // Detect changes
    const changes = detectChanges(data, campaign);
    
    console.log('[EditCampaign] Changes detected:', { changeCount: Object.keys(changes).length, changes });
    
    if (Object.keys(changes).length === 0) {
      console.log('[EditCampaign] No changes detected');
      setStatusMessage("");
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Saving changes...");
    
    try {
      console.log('[EditCampaign] Calling onSave');
      await onSave(campaign.id, changes);
      console.log('[EditCampaign] Save successful');
      
      setStatusMessage("Campaign updated successfully!");
      setSubmitError(null);
      toast({
        title: "Campaign Updated",
        description: "Campaign has been successfully updated.",
      });
      
      setTimeout(() => {
        onOpenChange(false);
        setStatusMessage("");
      }, 1500);
    } catch (error: any) {
      console.error('[EditCampaign] Save failed:', error);
      setStatusMessage("");
      setSubmitError(error);
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

        {/* Warning for live campaigns */}
        {isLiveCampaign && (
          <DialogErrorBadge
            variant="warning"
            title="Live Campaign"
            message="This campaign is currently active. Changes will be visible to donors immediately."
          />
        )}

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

        {/* Status indicator */}
        {statusMessage && (
          <DialogStatusIndicator
            status={statusMessage}
            loading={isSubmitting}
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
                        <Select 
                          onValueChange={(value) => {
                            // Step 2: Log status changes
                            console.log('[DEBUG] Status field changed:', { 
                              oldValue: field.value, 
                              newValue: value,
                              campaignId: campaign?.id
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
                  // Step 5: Log button click
                  console.log('[DEBUG] Save button clicked!', {
                    isSubmitting,
                    hasErrors: Object.keys(form.formState.errors).length > 0,
                    isDirty: form.formState.isDirty,
                    formValues: form.getValues()
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
