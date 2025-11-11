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
import { TipsBox } from './TipsBox';
import { WIZARD_SPACING, WIZARD_TYPOGRAPHY, WIZARD_ICONS, WIZARD_GAPS, WIZARD_CARDS } from './designConstants';

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
    <div className={WIZARD_SPACING.stepContainer}>
      {isComplete ? (
        <div className={`flex items-center ${WIZARD_GAPS.inline} text-success p-4 bg-success/10 rounded-lg border border-success/20`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Ready to publish!</span>
        </div>
      ) : (
        <div className={`flex items-center ${WIZARD_GAPS.inline} text-warning p-4 bg-warning/10 rounded-lg border border-warning/20`}>
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Please complete all required fields</span>
        </div>
      )}

      <Card className="card-enhanced">
        <CardHeader className={WIZARD_CARDS.outerCard}>
          <div className={`flex items-start justify-between ${WIZARD_GAPS.standard}`}>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                {formData.title || 'Untitled Fundraiser'}
              </CardTitle>
              <div className={`flex flex-wrap ${WIZARD_GAPS.inline}`}>
                {categoryName && (
                  <Badge variant="secondary" className={WIZARD_TYPOGRAPHY.bodyText}>
                    {categoryEmoji} {categoryName}
                  </Badge>
                )}
                {formData.type === 'charity' && (
                  <Badge variant="default" className={WIZARD_TYPOGRAPHY.bodyText}>
                    <Shield className={`${WIZARD_ICONS.inline} mr-1`} />
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
                <div className={`${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground`}>Goal</div>
                <div className="text-2xl font-bold text-primary">
                  ${formData.goalAmount.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className={`${WIZARD_SPACING.cardSection} ${WIZARD_CARDS.outerCard}`}>
          {formData.summary && (
            <div>
              <h4 className={`${WIZARD_TYPOGRAPHY.cardTitle} mb-2`}>Summary</h4>
              <p className={WIZARD_TYPOGRAPHY.subsectionTitle}>{formData.summary}</p>
            </div>
          )}

          <Separator />

          {formData.story && (
            <div>
              <h4 className={`${WIZARD_TYPOGRAPHY.cardTitle} mb-2`}>Story</h4>
              <p className={`${WIZARD_TYPOGRAPHY.bodyText} whitespace-pre-wrap`}>{formData.story}</p>
            </div>
          )}

          {formData.visibility === 'private' && (formData.passcode || formData.allowlistEmails) && (
            <>
              <Separator />
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium mb-3 flex items-center ${WIZARD_GAPS.inline}`}>
                  <Lock className={WIZARD_ICONS.standard} />
                  Access Controls
                </h4>
                <div className={`${WIZARD_SPACING.listItems} ${WIZARD_TYPOGRAPHY.bodyText}`}>
                  {formData.passcode && (
                    <div className={`flex items-center ${WIZARD_GAPS.inline} text-muted-foreground`}>
                      <CheckCircle2 className={`${WIZARD_ICONS.standard} text-success`} />
                      Passcode protected
                    </div>
                  )}
                  {formData.allowlistEmails && (
                    <div className={`flex items-center ${WIZARD_GAPS.inline} text-muted-foreground`}>
                      <Mail className={`${WIZARD_ICONS.standard} text-success`} />
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
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${WIZARD_GAPS.standard}`}>
                {formData.beneficiaryName && (
                  <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                    <User className={`${WIZARD_ICONS.standard} text-muted-foreground`} />
                    <div>
                      <div className={`${WIZARD_TYPOGRAPHY.helperText}`}>Beneficiary</div>
                      <div className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium`}>{formData.beneficiaryName}</div>
                    </div>
                  </div>
                )}

                {formData.location && (
                  <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                    <MapPin className={`${WIZARD_ICONS.standard} text-muted-foreground`} />
                    <div>
                      <div className={WIZARD_TYPOGRAPHY.helperText}>Location</div>
                      <div className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium`}>{formData.location}</div>
                    </div>
                  </div>
                )}

                {formData.endDate && (
                  <div className={`flex items-center ${WIZARD_GAPS.inline}`}>
                    <Calendar className={`${WIZARD_ICONS.standard} text-muted-foreground`} />
                    <div>
                      <div className={WIZARD_TYPOGRAPHY.helperText}>End Date</div>
                      <div className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium`}>
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
                <h4 className={`${WIZARD_TYPOGRAPHY.cardTitle} mb-2`}>Cover Image</h4>
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
          <CardHeader className={WIZARD_CARDS.outerCard}>
            <CardTitle className={`flex items-center ${WIZARD_GAPS.inline}`}>
              <Target className="h-5 w-5" />
              Project Milestones ({formData.milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className={`${WIZARD_SPACING.cardSection} ${WIZARD_CARDS.outerCard}`}>
            {formData.milestones.map((milestone, index) => (
              <Card key={index} className="border-l-4 border-l-primary/50">
                <CardContent className={WIZARD_CARDS.nestedCard}>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className={WIZARD_TYPOGRAPHY.subsectionTitle}>{milestone.title}</h5>
                    <Badge variant="secondary" className="ml-2">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: milestone.currency,
                      }).format(milestone.target_amount)}
                    </Badge>
                  </div>
                  {milestone.description && (
                    <p className={`${WIZARD_TYPOGRAPHY.bodyText} text-muted-foreground mb-2 whitespace-pre-wrap`}>
                      {milestone.description}
                    </p>
                  )}
                  {milestone.due_date && (
                    <div className={`flex items-center ${WIZARD_GAPS.tight} ${WIZARD_TYPOGRAPHY.helperText} text-muted-foreground`}>
                      <Calendar className={WIZARD_ICONS.inline} />
                      Due: {format(new Date(milestone.due_date), 'PPP')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className={`${WIZARD_TYPOGRAPHY.bodyText} font-medium flex items-center justify-between`}>
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

      <TipsBox
        title="Before you publish:"
        tips={[
          'Review all information',
          'Check story is compelling',
          'Verify goal amount',
          ...(formData.isProject ? ['Ensure milestones are complete'] : []),
        ]}
      />
    </div>
  );
}
