/**
 * Create Fundraiser Wizard
 * Multi-step fundraiser creation with AI enhancement
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { Step1Basics } from './Step1Basics';
import { Step2Story } from './Step2Story';
import { Step3Details } from './Step3Details';
import { Step4Review } from './Step4Review';
import { useCreateFundraiser } from '@/hooks/useCreateFundraiser';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useCategories } from '@/hooks/useCategories';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { FeatureGate } from '@/components/common/FeatureGate';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const STEPS = [
  { number: 1, title: 'Basics', description: 'Title, category, goal' },
  { number: 2, title: 'Story', description: 'Tell your story' },
  { number: 3, title: 'Details', description: 'Additional info' },
  { number: 4, title: 'Review', description: 'Preview & publish' },
];

export function CreateFundraiserWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const { canCreateFundraiser, canCreateProject, getDisabledMessage } = useFeatureFlags();
  
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

  // Check feature access - for now just check fundraiser creation
  if (!canCreateFundraiser) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <FeatureGate featureKey="features.fundraiser_creation" showMessage={true} />
      </div>
    );
  }

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

  const selectedCategory = categories.find((cat) => cat.id === formData.categoryId);
  
  // Only mark steps as completed if we've moved past them
  const completedSteps = [];
  if (currentStep > 1 && formData.title && formData.categoryId && formData.goalAmount) {
    completedSteps.push(1);
  }
  if (currentStep > 2 && formData.summary && formData.story) {
    completedSteps.push(2);
  }
  if (currentStep > 3) {
    completedSteps.push(3);
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
    <div className="w-full space-y-6 sm:space-y-8">
      <ProgressIndicator
        currentStep={currentStep}
        steps={STEPS}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      <Card className="card-enhanced shadow-glow">
        <CardContent className="p-4 sm:p-6 md:p-8">
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
            />
          )}

          {currentStep === 4 && (
            <Step4Review
              formData={formData}
              categoryName={selectedCategory?.name}
              categoryEmoji={selectedCategory?.emoji}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 sm:p-0 -mx-4 sm:mx-0 border-t sm:border-t-0">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1 || isSubmitting}
          size="lg"
          className="w-full sm:w-auto min-h-[44px]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="h-4 w-4" />
          <span>Auto-saving...</span>
        </div>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
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
  );
}
