import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes safely
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Arabic locale
 */
export const formatArabicDate = (dateStr, options = {}) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
};

/**
 * Format time to Arabic locale
 */
export const formatArabicTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('ar-SY', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Validate National ID format
 */
export const isValidNationalId = (id) => {
  return /^\d{9,11}$/.test(id);
};
