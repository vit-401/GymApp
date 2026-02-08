/**
 * @file Reusable Input component with consistent dark-theme styling.
 *
 * Wraps native <input> with Tailwind classes matching the app's design system.
 * Used in: exercise forms, set logging, timer adjust, metrics recording, settings.
 *
 * Features: focus ring, rounded corners, card-colored background, responsive sizing.
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

/** Styled input element — forwards ref for form libraries and focus management */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
