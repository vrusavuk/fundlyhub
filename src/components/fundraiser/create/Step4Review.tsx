/**
 * Step 4: Review & Submit
 * True preview of how the fundraiser page will look
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, AlertCircle, Calendar, MapPin, Shield, Lock, 
  Mail, Target, Share2, Heart, Eye, Verified
} from 'lucide-react';
import { format } from 'date-fns';
import { VisibilityBadge } from '@/components/fundraiser/VisibilityBadge';
import { TipsBox } from './TipsBox';
import { useAuth } from '@/hooks/useAuth';

interface Step4ReviewProps {
  formData: {
    title?: string;
    categoryId?: string;
    goalAmount?: number;
    summary?: string;
    story?: string;
    beneficiaryName?: string;
    location?: string;
    coverImage?: string;
    endDate?: string;
    type?: 'personal' | 'charity';
    visibility?: 'public' | 'unlisted' | 'private';
    passcode?: string;
    allowlistEmails?: string;
    isProject?: boolean;
    milestones?: Array<{
      title?: string;
      description?: string;
      target_amount?: number;
      currency?: string;
      due_date?: string;
    }>;
  };
  categoryName?: string;
  categoryEmoji?: string;
}

export function Step4Review({ formData, categoryName, categoryEmoji }: Step4ReviewProps) {
  const { user } = useAuth();
  
  const isComplete = formData.title && formData.categoryId && formData.goalAmount && 
                     formData.summary && formData.story &&
                     (!formData.isProject || (formData.milestones && formData.milestones.length > 0));

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'You';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Preview Mode Banner */}
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Preview Mode</span>
        </div>
        {isComplete ? (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Ready to publish</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Missing required fields</span>
          </div>
        )}
      </div>

      {/* Main Preview Layout - Matches FundraiserDetail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Hero Image */}
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-muted">
            {formData.coverImage ? (
              <img
                src={formData.coverImage}
                alt="Campaign cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-sm">No cover image</p>
                </div>
              </div>
            )}
          </div>

          {/* Title and Info */}
          <div className="space-y-3 sm:space-y-4">
            {/* Badges */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {categoryName && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categoryEmoji} {categoryName}
                </Badge>
              )}
              {formData.location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formData.location}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created today
              </Badge>
              {formData.type === 'charity' && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Tax-Deductible
                </Badge>
              )}
              {formData.visibility && (
                <VisibilityBadge visibility={formData.visibility} />
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {formData.title || 'Untitled Fundraiser'}
            </h1>
            
            {/* Summary */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {formData.summary || 'No summary provided'}
            </p>
            
            {/* Organizer */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{userName}</span>
                    <Badge variant="outline" className="text-xs">
                      <Verified className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">Organizer</span>
                </div>
              </div>
            </div>

            {/* Beneficiary Info */}
            {formData.beneficiaryName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>Beneficiary: <strong className="text-foreground">{formData.beneficiaryName}</strong></span>
              </div>
            )}
          </div>

          {/* Tabs - Story, Milestones, etc. */}
          <Tabs defaultValue="story" className="w-full">
            <TabsList className={`grid w-full ${formData.isProject ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
              <TabsTrigger value="story" className="text-sm">Story</TabsTrigger>
              {formData.isProject && (
                <TabsTrigger value="milestones" className="text-sm">
                  Milestones ({formData.milestones?.length || 0})
                </TabsTrigger>
              )}
              <TabsTrigger value="comments" className="text-sm">Comments (0)</TabsTrigger>
            </TabsList>
              
            <TabsContent value="story" className="mt-4 space-y-4">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  {formData.story ? (
                    <div className="prose max-w-none whitespace-pre-wrap">
                      {formData.story}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No story provided yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Share Section Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share this fundraiser
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button variant="outline" className="flex items-center gap-2" disabled>
                      Facebook
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" disabled>
                      Twitter
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2" disabled>
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {formData.isProject && (
              <TabsContent value="milestones" className="mt-4 space-y-4">
                {formData.milestones && formData.milestones.length > 0 ? (
                  <>
                    {formData.milestones.map((milestone, index) => (
                      <Card key={index} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              <h5 className="font-semibold">{milestone.title || `Milestone ${index + 1}`}</h5>
                            </div>
                            <Badge variant="secondary">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: milestone.currency || 'USD',
                              }).format(milestone.target_amount || 0)}
                            </Badge>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                              {milestone.description}
                            </p>
                          )}
                          {milestone.due_date && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Due: {format(new Date(milestone.due_date), 'PPP')}
                            </div>
                          )}
                          <div className="mt-3">
                            <Progress value={0} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">$0 of goal</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium flex items-center justify-between">
                        <span>Total Milestone Goals:</span>
                        <span className="text-primary">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: formData.milestones[0]?.currency || 'USD',
                          }).format(
                            formData.milestones.reduce((sum, m) => sum + (m.target_amount || 0), 0)
                          )}
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No milestones added yet
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No comments yet. Comments will appear here after your fundraiser is published.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Donation Widget Preview */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-4">
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Goal Amount */}
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">
                  ${(formData.goalAmount || 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">goal</p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <Progress value={0} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">$0 raised</span>
                  <span className="text-muted-foreground">0%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-border">
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-muted-foreground">donors</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-xs text-muted-foreground">days left</div>
                </div>
              </div>

              {/* Donate Button (disabled preview) */}
              <Button className="w-full" size="lg" disabled>
                <Heart className="h-4 w-4 mr-2" />
                Donate Now
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Preview only — donations enabled after publishing
              </p>
            </CardContent>
          </Card>

          {/* Access Controls (for private campaigns) */}
          {formData.visibility === 'private' && (formData.passcode || formData.allowlistEmails) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Access Controls
                </h4>
                <div className="space-y-2 text-sm">
                  {formData.passcode && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Passcode protected
                    </div>
                  )}
                  {formData.allowlistEmails && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-success" />
                      {formData.allowlistEmails.split(',').filter(Boolean).length} email(s) allowed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* End Date */}
          {formData.endDate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Ends {format(new Date(formData.endDate), 'PPP')}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips Box */}
      <TipsBox
        title="Before you publish:"
        tips={[
          'Review all information for accuracy',
          'Check your story is compelling and complete',
          'Verify your goal amount is realistic',
          ...(formData.isProject ? ['Ensure milestones are complete and achievable'] : []),
        ]}
      />
    </div>
  );
}