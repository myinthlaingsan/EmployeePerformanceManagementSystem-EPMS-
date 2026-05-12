import { format, isThisYear, differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns';

/**
 * Formats a date relative to now following the Telegram/Professional messaging style:
 * - < 1 min: "Just now"
 * - < 60 min: "Xm ago"
 * - < 24 hours: "Xh ago"
 * - Within this year: "MMM dd" (e.g., "Apr 07")
 * - Previous years: "MMM dd, yyyy" (e.g., "May 06, 2019")
 */
export const formatRelativeTime = (dateInput: Date | string | number | undefined | null): string => {
  if (!dateInput) return '';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  
  const diffInSeconds = differenceInSeconds(now, date);
  if (diffInSeconds < 0) return format(date, 'MMM dd, yyyy'); // Future date fallback
  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = differenceInMinutes(now, date);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;

  const diffInHours = differenceInHours(now, date);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

  if (isThisYear(date)) {
    return format(date, 'MMM dd');
  }
  
  return format(date, 'MMM dd, yyyy');
};
