/**
 * Create Fundraiser Hook
 * Manages multi-step form state and submission
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { fundraiserMutationService } from '@/lib/services/fundraiserMutation.service';
import {
  CompleteFundraiser,
  fundraiserBasicsSchema,
  fundraiserStorySchema,
  fundraiserDetailsSchema,
} from '@/lib/validation/fundraiserCreation.schema';

type FormData = Partial<CompleteFundraiser>;

export function useCreateFundraiser() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    try {
      setValidationErrors({});
      
      switch (step) {
        case 1:
          fundraiserBasicsSchema.parse({
            title: formData.title,
            categoryId: formData.categoryId,
            goalAmount: formData.goalAmount,
          });
          break;
        case 2:
          fundraiserStorySchema.parse({
            summary: formData.summary,
            story: formData.story,
          });
          break;
        case 3:
          fundraiserDetailsSchema.parse({
            beneficiaryName: formData.beneficiaryName,
            location: formData.location,
            coverImage: formData.coverImage,
            endDate: formData.endDate,
          });
          break;
      }
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        errors[err.path[0]] = err.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      return true;
    }
    return false;
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    // Validate all steps up to target step
    for (let i = 1; i < step; i++) {
      if (!validateStep(i)) {
        toast({
          title: 'Please complete previous steps',
          description: 'Fill out all required fields before proceeding.',
          variant: 'destructive',
        });
        return false;
      }
    }
    setCurrentStep(step);
    return true;
  };

  const submitFundraiser = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a fundraiser.',
        variant: 'destructive',
      });
      return;
    }

    // Validate all steps
    for (let i = 1; i <= 3; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        toast({
          title: 'Validation failed',
          description: 'Please fix the errors before submitting.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = await fundraiserMutationService.createFundraiser({
        userId: user.id,
        title: formData.title!,
        categoryId: formData.categoryId!,
        goalAmount: formData.goalAmount!,
        summary: formData.summary!,
        story: formData.story!,
        beneficiaryName: formData.beneficiaryName,
        location: formData.location,
        coverImage: formData.coverImage,
        endDate: formData.endDate,
      });

      if (result.success && result.data) {
        // Clear draft
        fundraiserMutationService.clearDraftFromLocal(user.id);

        // Check if user was promoted to creator
        const { data: profile } = await user.app_metadata;
        
        if (profile?.role === 'creator') {
          toast({
            title: '🎉 Congratulations! You\'re now a Creator',
            description: 'You can now manage and track your fundraising campaigns.',
          });
        } else {
          toast({
            title: 'Fundraiser created!',
            description: 'Your fundraiser has been created successfully.',
          });
        }

        navigate(`/fundraiser/${result.data.slug}`);
      } else {
        throw new Error(result.error || 'Failed to create fundraiser');
      }
    } catch (error: any) {
      console.error('Error submitting fundraiser:', error);
      toast({
        title: 'Error creating fundraiser',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentStep,
    formData,
    validationErrors,
    isSubmitting,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    validateStep,
    submitFundraiser,
  };
}
