/**
 * Professional logging utility for Claimso PWA
 * 
 * Usage:
 * - logger.debug() - Development only, auto-filtered in production
 * - logger.info() - Important info, shows in production as console.warn
 * - logger.error() - Errors, always shows in production
 * - logger.api() - API debugging, development only
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logging - Only shows in development
   * Use for detailed debugging that shouldn't clutter production
   */
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`🔍 [DEBUG] ${message}`, data || '');
    }
  },

  /**
   * Info logging - Shows in production as warnings
   * Use for important operational info that helps with production debugging
   */
  info: (message: string, data?: unknown) => {
    console.warn(`ℹ️ [INFO] ${message}`, data || '');
  },

  /**
   * Error logging - Always shows in production
   * Use for actual errors that need attention
   */
  error: (message: string, error?: unknown) => {
    console.error(`❌ [ERROR] ${message}`, error || '');
  },

  /**
   * API logging - Development only
   * Use for API request/response debugging
   */
  api: (endpoint: string, method: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`🌐 [API] ${method} ${endpoint}`, data || '');
    }
  },

  /**
   * User action logging - Shows in production
   * Use for tracking important user interactions
   */
  user: (action: string, data?: unknown) => {
    console.warn(`👤 [USER] ${action}`, data || '');
  },

  /**
   * Database logging - Development only
   * Use for database operation debugging
   */
  db: (operation: string, table?: string, data?: unknown) => {
    if (isDevelopment) {
      console.warn(`🗄️ [DB] ${operation}${table ? ` on ${table}` : ''}`, data || '');
    }
  }
};

/**
 * Quick migration helpers - use these to replace existing console.log calls
 */
export const quickLog = {
  // Replace console.log with these based on context
  debug: logger.debug,
  api: logger.api,
  user: logger.user,
  db: logger.db,
  error: logger.error
};