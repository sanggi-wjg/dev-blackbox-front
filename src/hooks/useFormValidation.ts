import { useState, useCallback } from 'react';

type ValidationRule = (value: string) => string | undefined;
type ValidationRules = Record<string, ValidationRule>;

interface UseFormValidationReturn {
  errors: Record<string, string>;
  serverError: string;
  validate: (values: Record<string, string>) => boolean;
  validateField: (name: string, value: string) => void;
  setServerError: (msg: string) => void;
  clearErrors: () => void;
}

export function useFormValidation(rules: ValidationRules): UseFormValidationReturn {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  const validateField = useCallback(
    (name: string, value: string) => {
      const rule = rules[name];
      if (!rule) return;
      const error = rule(value);
      setErrors((prev) => {
        if (error) return { ...prev, [name]: error };
        const { [name]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      });
    },
    [rules],
  );

  const validate = useCallback(
    (values: Record<string, string>) => {
      const newErrors: Record<string, string> = {};
      for (const [name, rule] of Object.entries(rules)) {
        const error = rule(values[name] ?? '');
        if (error) newErrors[name] = error;
      }
      setErrors(newErrors);
      setServerError('');
      return Object.keys(newErrors).length === 0;
    },
    [rules],
  );

  const clearErrors = useCallback(() => {
    setErrors({});
    setServerError('');
  }, []);

  return { errors, serverError, validate, validateField, setServerError, clearErrors };
}

// 공통 유효성 검사 규칙
export const validators = {
  required:
    (label: string): ValidationRule =>
    (value) =>
      value.trim() ? undefined : `${label}을(를) 입력해주세요`,

  email:
    (label: string): ValidationRule =>
    (value) => {
      if (!value.trim()) return `${label}을(를) 입력해주세요`;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '올바른 이메일 형식이 아닙니다';
      return undefined;
    },

  url:
    (label: string): ValidationRule =>
    (value) => {
      if (!value.trim()) return `${label}을(를) 입력해주세요`;
      try {
        new URL(value);
        return undefined;
      } catch {
        return '올바른 URL 형식이 아닙니다';
      }
    },

  minLength:
    (label: string, min: number): ValidationRule =>
    (value) => {
      if (!value.trim()) return `${label}을(를) 입력해주세요`;
      if (value.length < min) return `${label}은(는) ${min}자 이상이어야 합니다`;
      return undefined;
    },
};
