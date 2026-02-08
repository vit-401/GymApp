/**
 * @file Date formatting and comparison utilities.
 *
 * All dates in the app are stored as ISO strings:
 * - Session dates use 'yyyy-MM-dd' format (date only, no time)
 * - BodyMetric timestamps use full ISO 8601 (date + time)
 *
 * Uses date-fns for reliable date parsing and formatting.
 */

import { format, parseISO, startOfDay, isToday, isSameDay } from 'date-fns';

/** Format a date (or ISO string) into 'yyyy-MM-dd' for storage/lookup keys */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

/** Format a date (or ISO string) into human-readable 'MMM d, yyyy' for display */
export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

/** Get today's date as 'yyyy-MM-dd' string — used for session date keys */
export const getToday = (): string => formatDate(startOfDay(new Date()));

/** Check if a given date/string is today */
export const isTodayDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
};

/** Check if two dates/strings represent the same calendar day */
export const isSameDate = (a: Date | string, b: Date | string): boolean => {
  const da = typeof a === 'string' ? parseISO(a) : a;
  const db = typeof b === 'string' ? parseISO(b) : b;
  return isSameDay(da, db);
};
