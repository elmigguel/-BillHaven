/**
 * Safe date formatting utilities
 * Prevents "Invalid time value" errors from crashing the app
 */

import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely format a date string or Date object
 * Returns fallback string if date is invalid or null
 *
 * @param {string|Date|null|undefined} dateValue - The date to format
 * @param {string} formatString - date-fns format string (default: 'MMM d, yyyy')
 * @param {string} fallback - Fallback string if date is invalid (default: 'N/A')
 * @returns {string} Formatted date or fallback
 */
export function safeFormatDate(dateValue, formatString = 'MMM d, yyyy', fallback = 'N/A') {
  // Handle null/undefined
  if (!dateValue) {
    return fallback;
  }

  try {
    let date;

    // If it's already a Date object
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // If it's a string, try to parse it
    else if (typeof dateValue === 'string') {
      // Try ISO format first
      date = parseISO(dateValue);

      // If that fails, try regular Date constructor
      if (!isValid(date)) {
        date = new Date(dateValue);
      }
    }
    // If it's a number (timestamp)
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    }
    else {
      return fallback;
    }

    // Check if the resulting date is valid
    if (!isValid(date)) {
      console.warn('Invalid date value:', dateValue);
      return fallback;
    }

    return format(date, formatString);
  } catch (error) {
    console.error('Date formatting error:', error, 'for value:', dateValue);
    return fallback;
  }
}

/**
 * Get the best available date from a bill object
 * Handles both created_at and created_date fields
 *
 * @param {object} bill - Bill object
 * @returns {string|null} Date string or null
 */
export function getBillDate(bill) {
  return bill?.created_at || bill?.created_date || null;
}

/**
 * Format a bill's creation date safely
 *
 * @param {object} bill - Bill object
 * @param {string} formatString - date-fns format string
 * @returns {string} Formatted date or 'N/A'
 */
export function formatBillDate(bill, formatString = 'MMM d, yyyy') {
  const dateValue = getBillDate(bill);
  return safeFormatDate(dateValue, formatString);
}
