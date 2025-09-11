import { useState, useCallback, useEffect } from 'react';
import { Input } from './Input';
import { Label } from './Label';

export interface ValidationResult {
  isValid: boolean;
  message: string;
  suggestions?: string[];
}

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator?: (value: string) => ValidationResult;
  required?: boolean;
  type?: string;
  placeholder?: string;
  debounceMs?: number;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  helperText?: string;
  className?: string;
}

export default function ValidatedInput({
  label,
  value,
  onChange,
  validator,
  required = false,
  type = 'text',
  placeholder,
  debounceMs = 300,
  validateOnBlur = true,
  validateOnChange = true,
  helperText,
  className,
}: ValidatedInputProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const validateValue = useCallback((val: string) => {
    if (required && !val.trim()) {
      return { isValid: false, message: `${label} is required` };
    }
    if (validator) return validator(val);
    return { isValid: true, message: '' };
  }, [validator, required, label]);

  const debouncedValidate = useCallback((val: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      const result = validateValue(val);
      setValidationResult(result);
    }, debounceMs);
    setDebounceTimer(timer);
  }, [validateValue, debounceMs, debounceTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    if (validateOnChange && (hasBlurred || newValue.length > 0)) {
      debouncedValidate(newValue);
    }
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (validateOnBlur) {
      const result = validateValue(value);
      setValidationResult(result);
    }
  };

  useEffect(() => {
    if (value && validator) {
      const result = validateValue(value);
      setValidationResult(result);
    }
  }, [value, validator, validateValue]);

  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const isError = validationResult && !validationResult.isValid && hasBlurred;
  const isSuccess = validationResult && validationResult.isValid && value && hasBlurred;

  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`space-y-1 ${className || ''}`}>
      <Label htmlFor={inputId} className="block text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={inputId}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${
          isError ? 'border-red-500 focus-visible:ring-red-500' :
          isSuccess ? 'border-green-500 focus-visible:ring-green-500' : ''
        }`}
        aria-invalid={isError ? 'true' : 'false'}
        aria-describedby={validationResult ? `${inputId}-validation` : undefined}
      />

      {helperText && !validationResult && (
        <div className="text-xs opacity-70">{helperText}</div>
      )}

      {isError && (
        <div
          id={`${inputId}-validation`}
          className="rounded border border-red-600/40 bg-red-500/10 px-2 py-1 text-xs"
        >
          <div className="text-red-400">{validationResult.message}</div>
          {validationResult.suggestions && (
            <ul className="mt-1 list-disc list-inside">
              {validationResult.suggestions.map((s, i) => (
                <li key={i} className="opacity-80">{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isSuccess && (
        <div
          id={`${inputId}-validation`}
          className="rounded border border-green-600/40 bg-green-500/10 px-2 py-1 text-xs text-green-400"
        >
          Valid
        </div>
      )}
    </div>
  );
}
