/**
 * Create Fundraiser Wizard
 * Multi-step fundraiser creation with AI enhancement
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { Step0ProjectType } from './Step0ProjectType';
import { Step1Basics } from './Step1Basics';
import { Step2Story } from './Step2Story';
import { Step3Details } from './Step3Details';
import { Step4Milestones } from './Step4Milestones';
import { Step4Review } from './Step4Review';
import { useCreateFundraiser } from '@/hooks/useCreateFundraiser';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { WIZARD_BUTTONS } from './designConstants';

const STEPS = [
  { number: 0, title: 'Type', description: 'Choose fundraising type' },
  { number: 1, title: 'Basics', description: 'Title, category, goal' },
  { number: 2, title: 'Story', description: 'Tell your story' },
  { number: 3, title: 'Details', description: 'Additional info' },
  { number: 4, title: 'Milestones', description: 'Project goals (optional)' },
  { number: 5, title: 'Review', description: 'Preview & publish' },
];

export function CreateFundraiserWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  
  const {
    currentStep,
    formData,
    validationErrors,
    isSubmitting,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submitFundraiser,
  } = useCreateFundraiser();

  const { saveDraft, loadDraft } = useDraftPersistence({
    formData,
    autoSaveInterval: 30000, // 30 seconds
    enabled: !!user,
  });

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      updateFormData(draft);
      toast({
        title: 'Draft restored',
        description: 'Your previous work has been restored.',
      });
    }
  }, []);

  // Filter steps based on project type
  const visibleSteps = STEPS.filter(step => {
    if (step.number === 4 && !formData.isProject) {
      return false; // Hide milestones step for non-projects
    }
    return true;
  });
  
  const selectedCategory = categories.find((cat) => cat.id === formData.categoryId);
  
  // Only mark steps as completed if we've moved past them
  const completedSteps = [];
  if (currentStep > 0) {
    completedSteps.push(0);
  }
  if (currentStep > 1 && formData.title && formData.categoryId && formData.goalAmount) {
    completedSteps.push(1);
  }
  if (currentStep > 2 && formData.summary && formData.story) {
    completedSteps.push(2);
  }
  if (currentStep > 3) {
    completedSteps.push(3);
  }
  if (currentStep > 4 && formData.isProject && formData.milestones && formData.milestones.length > 0) {
    completedSteps.push(4);
  }

  const handleNext = () => {
    if (goToNextStep()) {
      saveDraft();
    }
  };

  const handlePublish = async () => {
    await submitFundraiser();
  };

  return (
    <div className="w-full component-hierarchy pb-20 md:pb-24">
      <ProgressIndicator
        currentStep={currentStep}
        steps={visibleSteps}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      <Card className="card-enhanced shadow-glow">
        <CardContent className="mobile-card-spacing">
          {currentStep === 0 && (
            <Step0ProjectType
              value={formData.isProject}
              onChange={(isProject) => updateFormData({ isProject })}
            />
          )}

          {currentStep === 1 && (
            <Step1Basics
              formData={formData}
              errors={validationErrors}
              onChange={updateFormData}
            />
          )}

          {currentStep === 2 && (
            <Step2Story
              formData={formData}
              errors={validationErrors}
              onChange={updateFormData}
              categoryName={selectedCategory?.name}
            />
          )}

          {currentStep === 3 && (
            <Step3Details
              formData={formData}
              errors={validationErrors}
              onChange={updateFormData}
              isProject={formData.isProject || false}
            />
          )}

          {currentStep === 4 && formData.isProject && (
            <Step4Milestones
              value={formData.milestones || []}
              currency="USD"
              onChange={(milestones) => updateFormData({ milestones })}
            />
          )}

          {currentStep === (formData.isProject ? 5 : 4) && (
            <Step4Review
              formData={formData}
              categoryName={selectedCategory?.name}
              categoryEmoji={selectedCategory?.emoji}
            />
          )}
        </CardContent>
      </Card>

      {/* Fixed footer - breaks out of container constraints */}
      <div className={WIZARD_BUTTONS.footerOuter}>
        <div className={WIZARD_BUTTONS.footerInner}>
          <div className={WIZARD_BUTTONS.footerGrid}>
            {/* Left: Previous button */}
            <div className="flex justify-start">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isSubmitting}
                  size={WIZARD_BUTTONS.size}
                  className={WIZARD_BUTTONS.className}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            {/* Center: Auto-saving indicator */}
            <div className="hidden sm:flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Save className="h-4 w-4" />
              <span>Auto-saving</span>
            </div>

            {/* Right: Next/Publish button */}
            <div className="flex justify-end">
              {currentStep < (formData.isProject ? 5 : 4) ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || (currentStep === 0 && formData.isProject === undefined)}
                  size={WIZARD_BUTTONS.size}
                  className={WIZARD_BUTTONS.className}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  size={WIZARD_BUTTONS.size}
                  className={WIZARD_BUTTONS.className}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Fundraiser'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
