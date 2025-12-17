/**
 * Campaign Detail Page
 * Unified view and edit page for individual campaigns
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ExternalLink, Check, Clock, TrendingUp, Pencil, X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MoneyMath } from '@/lib/enterprise/utils/MoneyMath';
import { formatDistanceToNow } from 'date-fns';
import {
  DetailPageLayout,
  DetailSection,
  DetailKeyValue,
  DetailTimeline,
} from '@/components/admin/detail';
import { CampaignDetailSidebar } from '@/components/admin/detail/CampaignDetailSidebar';
import { adminDataService } from '@/lib/services/AdminDataService';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useDetailPageBreadcrumbs } from '@/hooks/useDetailPageBreadcrumbs';
import { campaignEditSchema, type CampaignEditData } from '@/lib/validation/campaignEdit.schema';
import { useCategories } from '@/hooks/useCategories';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminEventService } from '@/lib/services/AdminEventService';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { categories } = useCategories();
  const [campaign, setCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === '1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedCoverImageId, setUploadedCoverImageId] = useState<string | null>(null);

  const form = useForm<CampaignEditData>({
    resolver: zodResolver(campaignEditSchema),
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      story_html: '',
      goal_amount: 0,
      currency: 'USD',
      category_id: null,
      location: '',
      tags: [],
      visibility: 'public',
      status: 'draft',
      cover_image: '',
      coverImageId: null,
      coverImagePath: null,
      video_url: '',
      images: [],
      galleryImageIds: [],
      end_date: null,
      beneficiary_name: '',
      beneficiary_contact: '',
    },
  });

  // Set dynamic breadcrumbs
  useDetailPageBreadcrumbs(
    'Campaign Management',
    '/admin/campaigns',
    campaign?.title,
    loading
  );

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const campaignData = await adminDataService.fetchCampaignById(id);
        setCampaign(campaignData);
        
        // Initialize form with campaign data
        form.reset({
          title: campaignData.title || '',
          slug: campaignData.slug || '',
          summary: campaignData.summary || '',
          story_html: campaignData.story_html || '',
          goal_amount: campaignData.goal_amount || 0,
          currency: campaignData.currency || 'USD',
          category_id: campaignData.category_id || null,
          location: campaignData.location || '',
          tags: campaignData.tags || [],
          visibility: campaignData.visibility || 'public',
          status: campaignData.status || 'draft',
          cover_image: campaignData.cover_image || '',
          coverImageId: null,
          coverImagePath: null,
          video_url: campaignData.video_url || '',
          images: campaignData.images || [],
          galleryImageIds: [],
          end_date: campaignData.end_date || null,
          beneficiary_name: campaignData.beneficiary_name || '',
          beneficiary_contact: campaignData.beneficiary_contact || '',
        });
      } catch (error) {
        console.error('Error fetching campaign:', error);
        toast({
          title: 'Failed to load campaign',
          description: error instanceof Error ? error.message : 'Campaign not found',
          variant: 'destructive',
        });
        navigate('/admin/campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id, navigate, toast, form]);

  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') return Number(value);
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (Array.isArray(value)) return value.length === 0 ? null : value;
    return value;
  };

  const detectChanges = (formData: CampaignEditData, original: any) => {
    const changes: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = original[key];
      const normalizedNew = normalizeValue(value);
      const normalizedOld = normalizeValue(originalValue);
      
      if (typeof normalizedNew === 'string' || typeof normalizedNew === 'number' || typeof normalizedNew === 'boolean') {
        if (normalizedNew !== normalizedOld) {
          changes[key] = value;
        }
      } else if (JSON.stringify(normalizedNew) !== JSON.stringify(normalizedOld)) {
        changes[key] = value;
      }
    });
    
    return changes;
  };

  const handleSave = async (data: CampaignEditData) => {
    if (!campaign) return;
    
    const changes = detectChanges(data, campaign);
    const imageOperations: any = {};
    
    if (uploadedCoverImageId) {
      imageOperations.coverImageId = uploadedCoverImageId;
      
      const previousImageQuery = await supabase
        .from('fundraiser_images')
        .select('id')
        .eq('fundraiser_id', campaign.id)
        .eq('image_type', 'cover')
        .maybeSingle();
      
      if (previousImageQuery.data) {
        imageOperations.previousCoverImageId = previousImageQuery.data.id;
      }
      
      changes.cover_image = data.cover_image;
    }
    
    if (Object.keys(changes).length === 0 && !imageOperations.coverImageId) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user for event publishing
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update via AdminEventService with correct parameter order
      await AdminEventService.updateCampaign(
        campaign.id, 
        user?.id || 'system', 
        changes,
        imageOperations.coverImageId ? { imageOperations } : undefined
      );
      
      toast({
        title: "Campaign Updated",
        description: "Changes have been saved successfully.",
      });
      
      // Refresh campaign data
      const updatedCampaign = await adminDataService.fetchCampaignById(campaign.id);
      setCampaign(updatedCampaign);
      setUploadedCoverImageId(null);
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current campaign values
    form.reset({
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
    });
    setUploadedCoverImageId(null);
    setIsEditing(false);
    setSearchParams({});
      setSearchParams({});
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const totalRaised = campaign.stats?.total_raised || 0;
  const goalAmount = campaign.goal_amount || 0;
  const progressPercentage = goalAmount > 0 ? Math.min((totalRaised / goalAmount) * 100, 100) : 0;

  const statusConfig = {
    active: { label: 'Active', variant: 'default' as const, icon: Check },
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    paused: { label: 'Paused', variant: 'secondary' as const, icon: Clock },
    ended: { label: 'Ended', variant: 'outline' as const, icon: Clock },
    closed: { label: 'Closed', variant: 'outline' as const, icon: Clock },
    draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  };

  const status = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = status.icon;

  const timelineEvents = [
    {
      icon: <Check className="h-4 w-4" />,
      title: 'Campaign created',
      subtitle: `By ${campaign.owner_name || 'Unknown'}`,
      time: formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true }),
    },
  ];

  if (campaign.stats?.last_donation_at) {
    timelineEvents.unshift({
      icon: <TrendingUp className="h-4 w-4" />,
      title: 'Latest donation received',
      subtitle: `${campaign.stats.donor_count} total donations`,
      time: formatDistanceToNow(new Date(campaign.stats.last_donation_at), { addSuffix: true }),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <DetailPageLayout
          title={
            isEditing ? (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input 
                        {...field} 
                        className="text-2xl font-semibold h-auto py-1 px-2 -ml-2"
                        placeholder="Campaign title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : campaign.title
          }
          subtitle={
            isEditing ? (
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem className="flex-1 mt-2">
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        className="text-sm text-muted-foreground resize-none"
                        placeholder="Campaign summary"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (campaign.summary || 'No summary provided')
          }
          status={
            isEditing ? (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            )
          }
          actions={
            <>
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/campaigns')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setSearchParams({ edit: '1' });
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/fundraiser/${campaign.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public
                  </Button>
                </>
              )}
            </>
          }
          mainContent={
            <>
              {/* Edit Mode Banner */}
              {isEditing && (
                <Alert className="mb-4 border-primary/50 bg-primary/5">
                  <Pencil className="h-4 w-4" />
                  <AlertDescription>
                    You are in edit mode. Make changes and click "Save Changes" to update the campaign.
                  </AlertDescription>
                </Alert>
              )}

              {/* Cover Image Section */}
              <DetailSection title="Cover Image">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="cover_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-4">
                            <ImageUpload
                              value={uploadedCoverImageId ? [form.watch('cover_image')] : (field.value ? [field.value] : [])}
                              onChange={(url) => {
                                const imageUrl = typeof url === 'string' ? url : (Array.isArray(url) ? url[0] : '');
                                if (imageUrl) {
                                  field.onChange(imageUrl);
                                }
                              }}
                              onImageIdChange={(ids) => {
                                const imageId = typeof ids === 'string' ? ids : (Array.isArray(ids) ? ids[0] : '');
                                if (imageId) {
                                  setUploadedCoverImageId(imageId);
                                  form.setValue('coverImageId', imageId);
                                }
                              }}
                              maxFiles={1}
                              bucket="fundraiser-images"
                              isDraft={false}
                              label="Upload Cover Image"
                              description="Drag & drop or click to upload"
                              showPreview={true}
                            />
                            
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
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : campaign.cover_image ? (
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={campaign.cover_image} 
                      alt={campaign.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed h-64 flex items-center justify-center bg-muted/50">
                    <p className="text-muted-foreground">No cover image</p>
                  </div>
                )}
              </DetailSection>

              {/* Funding Progress */}
              <DetailSection title="Funding Progress">
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <div className="text-[32px] font-semibold text-foreground">
                        {MoneyMath.format(MoneyMath.create(totalRaised, campaign.currency))}
                      </div>
                      <div className="text-[14px] text-muted-foreground">
                        raised of{' '}
                        {isEditing ? (
                          <FormField
                            control={form.control}
                            name="goal_amount"
                            render={({ field }) => (
                              <span className="inline-flex items-center gap-1">
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  className="w-28 h-7 inline-block text-sm"
                                />
                                <span>goal</span>
                              </span>
                            )}
                          />
                        ) : (
                          <span>{MoneyMath.format(MoneyMath.create(goalAmount, campaign.currency))} goal</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[24px] font-semibold text-foreground">
                        {progressPercentage.toFixed(0)}%
                      </div>
                      <div className="text-[12px] text-muted-foreground">
                        funded
                      </div>
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="text-[12px] text-muted-foreground">Donors</div>
                      <div className="text-[18px] font-semibold text-foreground">
                        {campaign.stats?.donor_count || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-muted-foreground">Unique Donors</div>
                      <div className="text-[18px] font-semibold text-foreground">
                        {campaign.stats?.unique_donors || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-muted-foreground">Avg Donation</div>
                      <div className="text-[18px] font-semibold text-foreground">
                        {campaign.stats?.average_donation 
                          ? MoneyMath.format(MoneyMath.create(campaign.stats.average_donation, campaign.currency))
                          : '$0'}
                      </div>
                    </div>
                  </div>
                </div>
              </DetailSection>

              {/* Recent Activity */}
              <DetailSection title="Recent Activity">
                <DetailTimeline events={timelineEvents} />
              </DetailSection>

              {/* Campaign Information */}
              <DetailSection title="Campaign Information">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="campaign-slug" />
                          </FormControl>
                          <FormDescription>URL-friendly identifier</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="CAD">CAD</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.emoji} {cat.name}
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
                    
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="visibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Visibility</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <DetailKeyValue label="Campaign ID" value={campaign.id} copyable />
                    <DetailKeyValue label="Slug" value={campaign.slug} copyable />
                    <DetailKeyValue label="Type" value={campaign.type || 'personal'} />
                    <DetailKeyValue label="Currency" value={campaign.currency} />
                    {campaign.location && (
                      <DetailKeyValue label="Location" value={campaign.location} />
                    )}
                    {campaign.end_date && (
                      <DetailKeyValue label="End Date" value={new Date(campaign.end_date).toLocaleDateString()} />
                    )}
                  </div>
                )}
              </DetailSection>

              {/* Beneficiary Information */}
              <DetailSection title="Beneficiary">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="beneficiary_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Who will receive the funds" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="beneficiary_contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary Contact</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Email or phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <DetailKeyValue label="Name" value={campaign.beneficiary_name || 'Not specified'} />
                    <DetailKeyValue label="Contact" value={campaign.beneficiary_contact || 'Not specified'} />
                  </div>
                )}
              </DetailSection>

              {/* Campaign Story */}
              <DetailSection title="Campaign Story">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="story_html"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            rows={12}
                            placeholder="Tell the story of your campaign..."
                            className="font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>HTML content supported</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : campaign.story_html ? (
                  <div 
                    className="prose prose-sm max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: campaign.story_html }}
                  />
                ) : (
                  <p className="text-muted-foreground">No story provided</p>
                )}
              </DetailSection>

              {/* Video URL */}
              {(isEditing || campaign.video_url) && (
                <DetailSection title="Video">
                  {isEditing ? (
                    <FormField
                      control={form.control}
                      name="video_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value || ''} type="url" placeholder="https://youtube.com/..." />
                          </FormControl>
                          <FormDescription>YouTube or Vimeo URL</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <DetailKeyValue label="Video URL" value={campaign.video_url} copyable />
                  )}
                </DetailSection>
              )}
            </>
          }
          sidebar={
            <CampaignDetailSidebar 
              campaign={campaign} 
              isEditing={isEditing}
              form={form}
            />
          }
        />
      </form>
    </Form>
  );
}
