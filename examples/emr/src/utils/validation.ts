/**
 * Common validation utilities for form inputs
 */

export const validators = {
  /**
   * Check if value is not empty
   */
  required: (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  },

  /**
   * Validate email format
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Validate phone number (US format)
   */
  phone: (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10;
  },

  /**
   * Check if number is positive
   */
  positive: (value: number): boolean => {
    return value > 0;
  },

  /**
   * Check if number is within range
   */
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, length: number): boolean => {
    return value.trim().length >= length;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, length: number): boolean => {
    return value.trim().length <= length;
  },

  /**
   * Validate URL format
   */
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate date is not in the past
   */
  notPast: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj >= new Date();
  },

  /**
   * Validate date is not in the future
   */
  notFuture: (date: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj <= new Date();
  },
};

/**
 * Validate multiple fields and return error messages
 */
export function validateFields(
  fields: Record<string, any>,
  rules: Record<string, (value: any) => boolean | string>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(rules)) {
    const value = fields[field];
    const result = validator(value);

    if (result === false) {
      errors[field] = `${field} is invalid`;
    } else if (typeof result === 'string') {
      errors[field] = result;
    }
  }

  return errors;
}

/**
 * Common validation error messages
 */
export const validationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  positive: 'Value must be greater than zero',
  range: (min: number, max: number) => `Value must be between ${min} and ${max}`,
  minLength: (length: number) => `Must be at least ${length} characters`,
  maxLength: (length: number) => `Must be no more than ${length} characters`,
  url: 'Please enter a valid URL',
  notPast: 'Date cannot be in the past',
  notFuture: 'Date cannot be in the future',
};

