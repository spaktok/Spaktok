import { useState, useCallback } from 'react';

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface FieldError {
  [key: string]: string | null;
}

export function useFormValidation(rules: Record<string, ValidationRule[]>) {
  const [errors, setErrors] = useState<FieldError>({});

  const validateField = useCallback(
    (fieldName: string, value: string) => {
      const fieldRules = rules[fieldName];
      if (!fieldRules) return true;

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: rule.message,
          }));
          return false;
        }
      }

      setErrors((prev) => ({
        ...prev,
        [fieldName]: null,
      }));
      return true;
    },
    [rules]
  );

  const validateForm = useCallback(
    (formData: Record<string, string>) => {
      const newErrors: FieldError = {};
      let isValid = true;

      Object.keys(rules).forEach((fieldName) => {
        const fieldRules = rules[fieldName];
        const value = formData[fieldName] || '';

        for (const rule of fieldRules) {
          if (!rule.validate(value)) {
            newErrors[fieldName] = rule.message;
            isValid = false;
            break;
          }
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [rules]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
}
