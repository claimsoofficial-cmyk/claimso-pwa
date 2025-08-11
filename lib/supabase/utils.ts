import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes intelligently
 * Combines clsx for conditional classes with tailwind-merge for proper Tailwind deduplication
 * 
 * @param inputs - CSS class values (strings, objects, arrays, etc.)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': true, 'font-bold': false })
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 * 
 * cn('px-4 py-2', 'px-6') // Tailwind-merge deduplicates conflicting classes
 * // Returns: "py-2 px-6" (px-6 overrides px-4)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or Date object into a human-readable format
 * 
 * @param date - Date string (ISO format) or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string (e.g., "January 15, 2024")
 * 
 * @example
 * formatDate('2024-01-15') // Returns: "January 15, 2024"
 * formatDate(new Date()) // Returns current date formatted
 * formatDate('2024-01-15', { month: 'short' }) // Returns: "Jan 15, 2024"
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  try {
    // Handle string dates (like ISO format from database)
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date)
      return 'Invalid Date'
    }
    
    // Format using Intl.DateTimeFormat for consistent, localized output
    return new Intl.DateTimeFormat('en-US', options).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Additional date formatting shortcuts for common use cases
 */
export const dateFormats = {
  /**
   * Short format: "Jan 15, 2024"
   */
  short: (date: string | Date) => formatDate(date, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }),
  
  /**
   * Compact format: "1/15/2024"
   */
  compact: (date: string | Date) => formatDate(date, { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  }),
  
  /**
   * Long format: "Monday, January 15, 2024"
   */
  long: (date: string | Date) => formatDate(date, { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  
  /**
   * Relative format: "2 days ago", "in 3 weeks"
   * Uses Intl.RelativeTimeFormat for internationalization
   */
  relative: (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const now = new Date()
      const diffInMs = dateObj.getTime() - now.getTime()
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))
      
      const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
      
      // Handle different time scales
      if (Math.abs(diffInDays) < 1) {
        const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
        return rtf.format(diffInHours, 'hour')
      } else if (Math.abs(diffInDays) < 7) {
        return rtf.format(diffInDays, 'day')
      } else if (Math.abs(diffInDays) < 30) {
        const diffInWeeks = Math.round(diffInDays / 7)
        return rtf.format(diffInWeeks, 'week')
      } else if (Math.abs(diffInDays) < 365) {
        const diffInMonths = Math.round(diffInDays / 30)
        return rtf.format(diffInMonths, 'month')
      } else {
        const diffInYears = Math.round(diffInDays / 365)
        return rtf.format(diffInYears, 'year')
      }
    } catch (error) {
      console.error('Error formatting relative date:', error)
      return formatDate(date) // Fallback to standard format
    }
  }
}