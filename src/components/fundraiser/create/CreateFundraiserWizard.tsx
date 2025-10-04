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

  const selectedCategory = categories.find((cat) => cat.id === formData.categoryId);
  const completedSteps = [1, 2, 3].filter((step) => {
    if (step === 1) return formData.title && formData.categoryId && formData.goalAmount;
    if (step === 2) return formData.summary && formData.story;
    if (step === 3) return true; // Step 3 is optional
    return false;
  });

  const handleNext = () => {
    if (goToNextStep()) {
      saveDraft();
    }
  };

  const handlePublish = async () => {
    await submitFundraiser();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProgressIndicator
        currentStep={currentStep}
        steps={STEPS}
        onStepClick={goToStep}
        completedSteps={completedSteps}
      />

      <Card className="card-enhanced shadow-glow">
        <CardContent className="mobile-card-spacing">
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

      <div className="flex justify-between items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1 || isSubmitting}
          size="lg"
          className="touch-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4" />
          <span>Auto-saving draft...</span>
        </div>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            size="lg"
            className="touch-button"
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
            className="touch-button"
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
