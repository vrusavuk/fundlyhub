/**
 * Campaign Detail Page
 * Unified view and edit page for individual campaigns
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Check, Clock, TrendingUp, Pencil, X, Save, Loader2, Play, Pause, XCircle, Trash2, Eye } from 'lucide-react';
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
import { formatProgressPercentage } from '@/lib/utils/formatters';
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
import { ConfirmActionDialog } from '@/components/admin/dialogs/ConfirmActionDialog';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { categories } = useCategories();
  const [campaign, setCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const editParam = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(() => editParam === '1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedCoverImageId, setUploadedCoverImageId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    // Keep UI state in sync with URL (?edit=1)
    setIsEditing(editParam === '1');
  }, [editParam]);

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
    
    // Fields that are form-only and don't exist in the database
    const nonDatabaseFields = ['coverImageId', 'coverImagePath'];
    
    Object.entries(formData).forEach(([key, value]) => {
      // Skip non-database fields
      if (nonDatabaseFields.includes(key)) return;
      
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
  };

  const fetchCampaignData = async () => {
    if (!id) return;
    const campaignData = await adminDataService.fetchCampaignById(id);
    setCampaign(campaignData);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!campaign || !id) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await AdminEventService.updateCampaign(
        campaign.id,
        user?.id || 'system',
        { status: newStatus }
      );
      
      toast({
        title: 'Status Updated',
        description: `Campaign has been ${newStatus === 'active' ? 'activated' : newStatus}.`,
      });
      
      await fetchCampaignData();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowApproveDialog(false);
      setShowPauseDialog(false);
      setShowCloseDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !id) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('fundraisers')
        .update({ 
          deleted_at: new Date().toISOString(),
          deleted_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign has been soft deleted.',
      });
      
      navigate('/admin/campaigns');
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
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
  const donorCount = campaign.stats?.donor_count || 0;
  // Calculate average donation from total raised / donor count if not provided
  const averageDonation = campaign.stats?.average_donation || (donorCount > 0 ? totalRaised / donorCount : 0);
  const currentStatus = campaign.status || 'draft';

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
          backUrl="/admin/campaigns"
          backLabel="Campaigns"
          title={
            isEditing ? (
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="text-2xl font-semibold min-h-[60px] py-2 px-3 -ml-2 resize-none w-full"
                        placeholder="Campaign title"
                        rows={2}
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
            <div className="flex flex-wrap gap-2">
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
                  {/* Quick Status Actions */}
                  {(currentStatus === 'pending' || currentStatus === 'draft') && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowApproveDialog(true)}
                      disabled={actionLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  {currentStatus === 'active' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPauseDialog(true)}
                      disabled={actionLoading}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {currentStatus === 'paused' && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowApproveDialog(true)}
                      disabled={actionLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {currentStatus !== 'closed' && currentStatus !== 'ended' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCloseDialog(true)}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  )}
                  
                  {/* Core Actions */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchParams({ edit: '1' });
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/fundraiser/${campaign.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Public
                  </Button>
                  
                  {/* Delete Action */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
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
                            {/* Current Cover Image Preview */}
                            {campaign?.cover_image && !uploadedCoverImageId && (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Current cover image:</p>
                                <div className="relative rounded-lg overflow-hidden border bg-muted">
                                  <img 
                                    src={campaign.cover_image} 
                                    alt="Current cover" 
                                    className="w-full h-48 object-cover"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Upload New Image Section */}
                            <ImageUpload
                              value={uploadedCoverImageId ? [form.watch('cover_image')] : []}
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
                                  form.setValue('cover_image', '');
                                }
                              }}
                              maxFiles={1}
                              bucket="fundraiser-images"
                              isDraft={false}
                              label={campaign?.cover_image ? "Replace Cover Image" : "Upload Cover Image"}
                              description={campaign?.cover_image ? "Upload a new image to replace the current one" : "Drag & drop or click to upload"}
                              showPreview={true}
                            />

                            {/* Pending Upload Indicator */}
                            {uploadedCoverImageId && (
                              <Alert className="border-primary/50 bg-primary/5">
                                <AlertDescription className="flex items-center justify-between">
                                  <span>New image will replace the current cover when you save.</span>
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setUploadedCoverImageId(null);
                                      form.setValue('coverImageId', null);
                                      form.setValue('cover_image', campaign?.cover_image || '');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {/* OR URL Input */}
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
                        {formatProgressPercentage(totalRaised, goalAmount)}%
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
                        {donorCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-muted-foreground">Unique Donors</div>
                      <div className="text-[18px] font-semibold text-foreground">
                        {campaign.stats?.unique_donors || donorCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12px] text-muted-foreground">Avg Donation</div>
                      <div className="text-[18px] font-semibold text-foreground">
                        {MoneyMath.format(MoneyMath.create(averageDonation, campaign.currency))}
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

      {/* Activate/Resume Dialog */}
      <ConfirmActionDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Activate Campaign"
        description={`Are you sure you want to activate "${campaign?.title}"? It will become publicly visible.`}
        confirmLabel="Activate"
        isLoading={actionLoading}
        onConfirm={() => handleStatusChange('active')}
      />

      {/* Pause Dialog */}
      <ConfirmActionDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        title="Pause Campaign"
        description={`Are you sure you want to pause "${campaign?.title}"? It will temporarily stop accepting donations.`}
        confirmLabel="Pause"
        isLoading={actionLoading}
        onConfirm={() => handleStatusChange('paused')}
      />

      {/* Close Dialog */}
      <ConfirmActionDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title="Close Campaign"
        description={`Are you sure you want to close "${campaign?.title}"? This will end the campaign permanently.`}
        confirmLabel="Close Campaign"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={() => handleStatusChange('closed')}
      />

      {/* Delete Dialog */}
      <ConfirmActionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${campaign?.title}"? This action can be reversed by an administrator.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={handleDelete}
      />
    </Form>
  );
}
