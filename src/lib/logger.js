const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LOG_LEVELS.WARN 
      : LOG_LEVELS.DEBUG;
    
    // Enable detailed logging in development or when explicitly enabled
    this.enableDetailedLogging = process.env.NODE_ENV === 'development' || 
                                  process.env.ENABLE_DETAILED_LOGS === 'true';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level}:`;
    
    if (data && typeof data === 'object') {
      // Remove sensitive information
      const sanitizedData = this.sanitizeData(data);
      return `${prefix} ${message} ${JSON.stringify(sanitizedData)}`;
    }
    
    return `${prefix} ${message}`;
  }

  sanitizeData(data) {
    const sensitive = ['password', 'token', 'auth', 'Authorization', 'secret', 'key'];
    const sanitized = { ...data };
    
    // Remove or mask sensitive fields
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  error(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  debug(message, data = null) {
    if (this.logLevel >= LOG_LEVELS.DEBUG && this.enableDetailedLogging) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  // Special method for test submission events (minimal logging)
  testEvent(event, testId, userId, additionalData = {}) {
    const eventData = {
      event,
      testId,
      userId: userId ? userId.substring(0, 8) + '...' : 'unknown', // Mask user ID
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    // Always log test events (for auditing), but keep them minimal
    console.log(`TEST_EVENT: ${JSON.stringify(eventData)}`);
  }

  // Performance tracking
  timeStart(label) {
    if (this.enableDetailedLogging) {
      console.time(label);
    }
  }

  timeEnd(label) {
    if (this.enableDetailedLogging) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger(); 