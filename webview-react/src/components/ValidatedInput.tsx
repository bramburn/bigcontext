/**
 * ValidatedInput Component
 * 
 * Input component with built-in validation and error display.
 * Supports various input types and custom validation functions.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Input,
  Label,
  Field,
  makeStyles,
  tokens,
  InputProps
} from '@fluentui/react-components';
import { ValidationMessage } from './ValidationMessage';
import { ValidationResult } from '../types';

interface ValidatedInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator?: (value: string) => ValidationResult;
  required?: boolean;
  debounceMs?: number;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  helperText?: string;
  className?: string;
}

const useStyles = makeStyles({
  field: {
    marginBottom: tokens.spacingVerticalM
  },
  label: {
    marginBottom: tokens.spacingVerticalXS
  },
  helperText: {
    marginTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  }
});

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  value,
  onChange,
  validator,
  required = false,
  debounceMs = 300,
  validateOnBlur = true,
  validateOnChange = true,
  helperText,
  className,
  ...inputProps
}) => {
  const styles = useStyles();
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Validation function
  const validateValue = useCallback((val: string) => {
    if (required && !val.trim()) {
      return {
        isValid: false,
        message: `${label} is required`
      };
    }

    if (validator) {
      return validator(val);
    }

    return { isValid: true, message: '' };
  }, [validator, required, label]);

  // Debounced validation
  const debouncedValidate = useCallback((val: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const result = validateValue(val);
      setValidationResult(result);
    }, debounceMs);

    setDebounceTimer(timer);
  }, [validateValue, debounceMs, debounceTimer]);

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue);

    if (validateOnChange && (hasBlurred || newValue.length > 0)) {
      debouncedValidate(newValue);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setHasBlurred(true);
    if (validateOnBlur) {
      const result = validateValue(value);
      setValidationResult(result);
    }
  };

  // Validate on mount if value exists
  useEffect(() => {
    if (value && validator) {
      const result = validateValue(value);
      setValidationResult(result);
    }
  }, [value, validator, validateValue]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Determine validation state for styling
  const getValidationState = (): 'error' | 'warning' | 'success' | 'none' => {
    if (!validationResult || !hasBlurred) return 'none';
    
    if (!validationResult.isValid) return 'error';
    if (value && validationResult.isValid) return 'success';
    
    return 'none';
  };

  const validationState = getValidationState();

  return (
    <Field className={`${styles.field} ${className || ''}`}>
      <Label 
        required={required}
        className={styles.label}
      >
        {label}
      </Label>
      
      <Input
        {...inputProps}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={validationState === 'error'}
        aria-describedby={
          validationResult && !validationResult.isValid 
            ? `${inputProps.id || label}-error` 
            : undefined
        }
      />

      {helperText && !validationResult && (
        <div className={styles.helperText}>
          {helperText}
        </div>
      )}

      {validationResult && !validationResult.isValid && hasBlurred && (
        <ValidationMessage
          type="error"
          message={validationResult.message}
          suggestions={validationResult.suggestions}
        />
      )}

      {validationResult && validationResult.isValid && value && hasBlurred && (
        <ValidationMessage
          type="success"
          message="Valid"
        />
      )}
    </Field>
  );
};

export default ValidatedInput;
