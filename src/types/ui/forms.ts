/**
 * Form-related types
 */

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export interface FormSubmissionState {
  isSubmitting: boolean;
  hasErrors: boolean;
  errorMessage?: string;
}