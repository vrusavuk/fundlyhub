/**
 * Accessible form management hook
 * Provides comprehensive form accessibility features
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface FormError {
  field: string;
  message: string;
  type?: 'required' | 'invalid' | 'min' | 'max' | 'pattern';
}

interface AccessibleFormOptions {
  autoFocusFirst?: boolean;
  announceErrors?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

export function useAccessibleForm<T extends Record<string, any>>(
  initialValues: T,
  options: AccessibleFormOptions = {}
) {
  const {
    autoFocusFirst = true,
    announceErrors = true,
    validateOnBlur = true,
    validateOnChange = false
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { announce, focusFirst } = useAccessibility();

  // Focus first input on mount
  useEffect(() => {
    if (autoFocusFirst && formRef.current) {
      focusFirst(formRef.current);
    }
  }, [autoFocusFirst, focusFirst]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange) {
      validateField(field as string, value);
    }
  }, [validateOnChange]);

  const setError = useCallback((field: string, message: string, type?: FormError['type']) => {
    setErrors(prev => [
      ...prev.filter(error => error.field !== field),
      { field, message, type }
    ]);
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const validateField = useCallback((field: string, value: any) => {
    // Basic validation - extend as needed
    if (!value && value !== 0 && value !== false) {
      setError(field, `${field} is required`, 'required');
      return false;
    }
    
    clearError(field);
    return true;
  }, [setError, clearError]);

  const validateForm = useCallback(() => {
    const newErrors: FormError[] = [];
    
    Object.entries(values).forEach(([field, value]) => {
      if (!validateField(field, value)) {
        const error = errors.find(e => e.field === field);
        if (error) newErrors.push(error);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [values, validateField, errors]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => new Set([...prev, field]));
    
    if (validateOnBlur) {
      validateField(field, values[field as keyof T]);
    }
  }, [validateOnBlur, validateField, values]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void,
    event?: React.FormEvent
  ) => {
    event?.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      if (!validateForm()) {
        if (announceErrors && errors.length > 0) {
          announce(
            `Form has ${errors.length} error${errors.length === 1 ? '' : 's'}. Please correct them and try again.`,
            'assertive'
          );
          
          // Focus first field with error
          const firstErrorField = errors[0]?.field;
          if (firstErrorField && formRef.current) {
            const fieldElement = formRef.current.querySelector(
              `[name="${firstErrorField}"], #${firstErrorField}`
            ) as HTMLElement;
            fieldElement?.focus();
          }
        }
        return;
      }

      await onSubmit(values);
      
      if (announceErrors) {
        announce('Form submitted successfully', 'polite');
      }
    } catch (error) {
      if (announceErrors) {
        announce('Form submission failed. Please try again.', 'assertive');
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, announceErrors, announce, errors, values]);

  const reset = useCallback((newValues?: Partial<T>) => {
    setValues(newValues ? { ...initialValues, ...newValues } : initialValues);
    setErrors([]);
    setTouched(new Set());
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => {
    const fieldName = field as string;
    const error = errors.find(e => e.field === fieldName);
    const isTouched = touched.has(fieldName);
    
    return {
      id: fieldName,
      name: fieldName,
      value: values[field],
      onChange: (value: any) => setValue(field, value),
      onBlur: () => handleBlur(fieldName),
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': error ? `${fieldName}-error` : undefined,
      'aria-required': true,
    };
  }, [values, errors, touched, setValue, handleBlur]);

  const getErrorProps = useCallback((field: string) => {
    const error = errors.find(e => e.field === field);
    
    return {
      id: `${field}-error`,
      role: 'alert' as const,
      'aria-live': 'polite' as const,
      children: error?.message
    };
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    formRef,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateForm,
    handleSubmit,
    handleBlur,
    reset,
    getFieldProps,
    getErrorProps,
    hasErrors: errors.length > 0,
    isValid: errors.length === 0,
  };
}