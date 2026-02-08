/**
 * @file Tailwind CSS class name merge utility.
 *
 * Combines clsx (conditional class names) with tailwind-merge (deduplicates
 * conflicting Tailwind classes). Used across all components for dynamic styling.
 *
 * Example: cn('px-4 py-2', isActive && 'bg-primary', className)
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge and deduplicate Tailwind CSS class names. Accepts strings, arrays, objects. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
