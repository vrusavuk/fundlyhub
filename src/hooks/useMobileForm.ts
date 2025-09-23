/**
 * Mobile-optimized form handling hook
 * Provides enhanced validation, keyboard handling, and user experience for mobile devices
 */
import { useState, useCallback, useEffect } from 'react';
import { hapticFeedback, mobileFormValidation, breakpointUtils, keyboardUtils } from '@/lib/utils/mobile';

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
  rules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | undefined;
  };
}

interface UseMobileFormOptions {
  enableHapticFeedback?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  autoFocusFirst?: boolean;
}

export function useMobileForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, FormField['rules']>> = {},
  options: UseMobileFormOptions = {}
) {
  const {
    enableHapticFeedback = true,
    validateOnChange = false,
    validateOnBlur = true,
    autoFocusFirst = true
  } = options;

  // Form state
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initialFields: Record<keyof T, FormField> = {} as any;
    Object.keys(initialValues).forEach(key => {
      initialFields[key as keyof T] = {
        value: initialValues[key] || '',
        touched: false,
        rules: validationRules[key as keyof T]
      };
    });
    return initialFields;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const isMobile = breakpointUtils.isMobile();

  // Auto-focus first field on mobile
  useEffect(() => {
    if (autoFocusFirst && isMobile && submitCount === 0) {
      const firstFieldName = Object.keys(initialValues)[0];
      if (firstFieldName) {
        setTimeout(() => {
          const firstInput = document.querySelector(`input[name="${firstFieldName}"], textarea[name="${firstFieldName}"]`) as HTMLInputElement;
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
      }
    }
  }, [autoFocusFirst, isMobile, submitCount, initialValues]);

  // Validation function
  const validateField = useCallback((name: keyof T, value: string): string | undefined => {
    const rules = fields[name]?.rules;
    if (!rules) return undefined;

    if (rules.required && !value.trim()) {
      return 'required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return 'minLength';
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return 'maxLength';
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'invalid';
    }

    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) return customError;
    }

    return undefined;
  }, [fields]);

  // Get field value
  const getValue = useCallback((name: keyof T): string => {
    return fields[name]?.value || '';
  }, [fields]);

  // Get field error
  const getError = useCallback((name: keyof T): string | undefined => {
    return fields[name]?.error;
  }, [fields]);

  // Check if field has been touched
  const isTouched = useCallback((name: keyof T): boolean => {
    return fields[name]?.touched || false;
  }, [fields]);

  // Set field value
  const setValue = useCallback((name: keyof T, value: string) => {
    setFields(prev => {
      const field = prev[name];
      const error = validateOnChange ? validateField(name, value) : field?.error;
      
      // Provide haptic feedback for errors
      if (enableHapticFeedback && error && !field?.error) {
        hapticFeedback.error();
      } else if (enableHapticFeedback && !error && field?.error) {
        hapticFeedback.success();
      }

      return {
        ...prev,
        [name]: {
          ...field,
          value,
          error,
          touched: true
        }
      };
    });
  }, [validateField, validateOnChange, enableHapticFeedback]);

  // Handle field blur
  const handleBlur = useCallback((name: keyof T) => {
    if (!validateOnBlur) return;

    setFields(prev => {
      const field = prev[name];
      const error = validateField(name, field?.value || '');
      
      if (enableHapticFeedback && error) {
        hapticFeedback.error();
      }

      return {
        ...prev,
        [name]: {
          ...field,
          error,
          touched: true
        }
      };
    });
  }, [validateField, validateOnBlur, enableHapticFeedback]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    let hasErrors = false;
    
    setFields(prev => {
      const newFields = { ...prev };
      
      Object.keys(newFields).forEach(key => {
        const field = newFields[key as keyof T];
        const error = validateField(key as keyof T, field.value);
        
        if (error) {
          hasErrors = true;
        }
        
        newFields[key as keyof T] = {
          ...field,
          error,
          touched: true
        };
      });
      
      return newFields;
    });

    if (hasErrors && enableHapticFeedback) {
      hapticFeedback.error();
    }

    return !hasErrors;
  }, [validateField, enableHapticFeedback]);

  // Get form values
  const getValues = useCallback((): T => {
    const values = {} as T;
    Object.keys(fields).forEach(key => {
      values[key as keyof T] = fields[key as keyof T].value as any;
    });
    return values;
  }, [fields]);

  // Reset form
  const reset = useCallback(() => {
    setFields(() => {
      const resetFields: Record<keyof T, FormField> = {} as any;
      Object.keys(initialValues).forEach(key => {
        resetFields[key as keyof T] = {
          value: initialValues[key] || '',
          touched: false,
          rules: validationRules[key as keyof T]
        };
      });
      return resetFields;
    });
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues, validationRules]);

  // Check if form is valid
  const isValid = useCallback((): boolean => {
    return Object.values(fields).every(field => !field.error);
  }, [fields]);

  // Check if form has been modified
  const isDirty = useCallback((): boolean => {
    return Object.keys(fields).some(key => {
      const field = fields[key as keyof T];
      return field.value !== (initialValues[key as keyof T] || '');
    });
  }, [fields, initialValues]);

  // Enhanced submit handler
  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setSubmitCount(prev => prev + 1);
    
    // Dismiss mobile keyboard
    if (isMobile && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!validateAll()) {
      if (enableHapticFeedback) {
        hapticFeedback.error();
      }
      
      // Focus first error field
      const firstErrorField = Object.keys(fields).find(key => fields[key as keyof T].error);
      if (firstErrorField) {
        setTimeout(() => {
          const errorInput = document.querySelector(`input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`) as HTMLInputElement;
          if (errorInput) {
            errorInput.focus();
            errorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (enableHapticFeedback) {
        hapticFeedback.medium();
      }
      
      await onSubmit(getValues());
      
      if (enableHapticFeedback) {
        hapticFeedback.success();
      }
    } catch (error) {
      if (enableHapticFeedback) {
        hapticFeedback.error();
      }
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [fields, validateAll, getValues, enableHapticFeedback, isMobile]);

  return {
    // Field operations
    getValue,
    setValue,
    getError,
    isTouched,
    handleBlur,
    
    // Form operations
    getValues,
    validateAll,
    reset,
    handleSubmit,
    
    // Form state
    isValid: isValid(),
    isDirty: isDirty(),
    isSubmitting,
    submitCount,
    
    // Utilities
    isMobile
  };
}