/**
 * Step 4: Review & Submit
 * Preview and confirm all details
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, Calendar, MapPin, User, Shield, Lock, Mail, Target } from 'lucide-react';
import { format } from 'date-fns';
import { VisibilityBadge } from '@/components/fundraiser/VisibilityBadge';

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
  const isComplete = formData.title && formData.categoryId && formData.goalAmount && 
                     formData.summary && formData.story &&
                     (!formData.isProject || (formData.milestones && formData.milestones.length > 0));

  return (
    <div className="space-y-6">
      {isComplete ? (
        <div className="flex items-center gap-2 text-success p-4 bg-success/10 rounded-lg border border-success/20">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Ready to publish!</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-warning p-4 bg-warning/10 rounded-lg border border-warning/20">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Please complete all required fields</span>
        </div>
      )}

      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {formData.title || 'Untitled Fundraiser'}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {categoryName && (
                  <Badge variant="secondary" className="text-sm">
                    {categoryEmoji} {categoryName}
                  </Badge>
                )}
                {formData.type === 'charity' && (
                  <Badge variant="default" className="text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Tax-Deductible
                  </Badge>
                )}
                {formData.visibility && (
                  <VisibilityBadge visibility={formData.visibility} />
                )}
              </div>
            </div>
            {formData.goalAmount && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Goal</div>
                <div className="text-2xl font-bold text-primary">
                  ${formData.goalAmount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.summary && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Summary</h4>
              <p className="text-base">{formData.summary}</p>
            </div>
          )}

          <Separator />

          {formData.story && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Story</h4>
              <p className="text-sm whitespace-pre-wrap">{formData.story}</p>
            </div>
          )}

          {formData.visibility === 'private' && (formData.passcode || formData.allowlistEmails) && (
            <>
              <Separator />
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
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
                      Allowlist: {formData.allowlistEmails.split(',').filter(Boolean).length} email(s)
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {(formData.beneficiaryName || formData.location || formData.endDate) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.beneficiaryName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Beneficiary</div>
                      <div className="text-sm font-medium">{formData.beneficiaryName}</div>
                    </div>
                  </div>
                )}

                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      <div className="text-sm font-medium">{formData.location}</div>
                    </div>
                  </div>
                )}

                {formData.endDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">End Date</div>
                      <div className="text-sm font-medium">
                        {format(new Date(formData.endDate), 'PPP')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {formData.coverImage && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Cover Image</h4>
                <img
                  src={formData.coverImage}
                  alt="Campaign cover"
                  className="rounded-lg w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {formData.isProject && formData.milestones && formData.milestones.length > 0 && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Project Milestones ({formData.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.milestones.map((milestone, index) => (
              <Card key={index} className="border-l-4 border-l-primary/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-base">{milestone.title}</h5>
                    <Badge variant="secondary" className="ml-2">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: milestone.currency,
                      }).format(milestone.target_amount)}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                      {milestone.description}
                    </p>
                  )}
                  {milestone.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {format(new Date(milestone.due_date), 'PPP')}
                    </div>
                  )}
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
                    formData.milestones.reduce((sum, m) => sum + m.target_amount, 0)
                  )}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-accent/50 border border-border rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">Before you publish:</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Review all information for accuracy</li>
          <li>Check that your story is clear and compelling</li>
          <li>Verify your goal amount is correct</li>
          {formData.isProject && (
            <li>Ensure all milestones are complete and realistic</li>
          )}
          <li>Ensure all contact information is up to date</li>
        </ul>
      </div>
    </div>
  );
}
