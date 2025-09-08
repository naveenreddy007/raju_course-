import { NextRequest } from 'next/server';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Log categories for better organization
export enum LogCategory {
  API = 'API',
  AUTH = 'AUTH',
  DATABASE = 'DATABASE',
  SECURITY = 'SECURITY',
  PAYMENT = 'PAYMENT',
  EMAIL = 'EMAIL',
  SYSTEM = 'SYSTEM'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel = process.env.LOG_LEVEL || 'INFO';
  
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel as LogLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }
  
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, category, message, requestId, userId, endpoint, method, statusCode, duration } = entry;
    
    let logMessage = `[${timestamp}] ${level} [${category}]`;
    
    if (requestId) logMessage += ` [${requestId}]`;
    if (userId) logMessage += ` [User:${userId}]`;
    if (method && endpoint) logMessage += ` ${method} ${endpoint}`;
    if (statusCode) logMessage += ` ${statusCode}`;
    if (duration) logMessage += ` ${duration}ms`;
    
    logMessage += ` - ${message}`;
    
    return logMessage;
  }
  
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;
    
    const formattedMessage = this.formatLog(entry);
    
    // In development, use console with colors
    if (this.isDevelopment) {
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error('\x1b[31m%s\x1b[0m', formattedMessage);
          if (entry.error?.stack) console.error(entry.error.stack);
          if (entry.data) console.error('Data:', entry.data);
          break;
        case LogLevel.WARN:
          console.warn('\x1b[33m%s\x1b[0m', formattedMessage);
          if (entry.data) console.warn('Data:', entry.data);
          break;
        case LogLevel.INFO:
          console.info('\x1b[36m%s\x1b[0m', formattedMessage);
          if (entry.data) console.info('Data:', entry.data);
          break;
        case LogLevel.DEBUG:
          console.debug('\x1b[37m%s\x1b[0m', formattedMessage);
          if (entry.data) console.debug('Data:', entry.data);
          break;
      }
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(entry));
    }
  }
  
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: {
      requestId?: string;
      userId?: string;
      ip?: string;
      userAgent?: string;
      endpoint?: string;
      method?: string;
      statusCode?: number;
      duration?: number;
      error?: Error;
    }
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };
    
    if (context) {
      Object.assign(entry, context);
      
      if (context.error) {
        entry.error = {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack
        };
      }
    }
    
    return entry;
  }
  
  error(message: string, data?: any, context?: any): void {
    const entry = this.createLogEntry(LogLevel.ERROR, LogCategory.SYSTEM, message, data, context);
    this.writeLog(entry);
  }
  
  warn(message: string, data?: any, context?: any): void {
    const entry = this.createLogEntry(LogLevel.WARN, LogCategory.SYSTEM, message, data, context);
    this.writeLog(entry);
  }
  
  info(message: string, data?: any, context?: any): void {
    const entry = this.createLogEntry(LogLevel.INFO, LogCategory.SYSTEM, message, data, context);
    this.writeLog(entry);
  }
  
  debug(message: string, data?: any, context?: any): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, LogCategory.SYSTEM, message, data, context);
    this.writeLog(entry);
  }
  
  // Specialized logging methods
  apiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: {
      requestId?: string;
      userId?: string;
      ip?: string;
      userAgent?: string;
      data?: any;
    }
  ): void {
    const message = `API Request completed`;
    const entry = this.createLogEntry(
      statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
      LogCategory.API,
      message,
      context?.data,
      {
        ...context,
        method,
        endpoint,
        statusCode,
        duration
      }
    );
    this.writeLog(entry);
  }
  
  authEvent(
    event: 'login' | 'logout' | 'register' | 'password_reset' | 'failed_login',
    userId?: string,
    context?: {
      ip?: string;
      userAgent?: string;
      requestId?: string;
      data?: any;
    }
  ): void {
    const message = `Authentication event: ${event}`;
    const entry = this.createLogEntry(
      event === 'failed_login' ? LogLevel.WARN : LogLevel.INFO,
      LogCategory.AUTH,
      message,
      context?.data,
      {
        ...context,
        userId
      }
    );
    this.writeLog(entry);
  }
  
  securityEvent(
    event: 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access' | 'permission_denied',
    context?: {
      ip?: string;
      userAgent?: string;
      userId?: string;
      endpoint?: string;
      requestId?: string;
      data?: any;
    }
  ): void {
    const message = `Security event: ${event}`;
    const entry = this.createLogEntry(
      LogLevel.WARN,
      LogCategory.SECURITY,
      message,
      context?.data,
      context
    );
    this.writeLog(entry);
  }
  
  databaseEvent(
    operation: 'create' | 'read' | 'update' | 'delete' | 'error',
    table: string,
    context?: {
      userId?: string;
      recordId?: string;
      duration?: number;
      error?: Error;
      data?: any;
    }
  ): void {
    const message = `Database ${operation} on ${table}`;
    const entry = this.createLogEntry(
      operation === 'error' ? LogLevel.ERROR : LogLevel.DEBUG,
      LogCategory.DATABASE,
      message,
      context?.data,
      context
    );
    this.writeLog(entry);
  }
  
  paymentEvent(
    event: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'refund_processed',
    amount: number,
    currency: string,
    context?: {
      userId?: string;
      paymentId?: string;
      courseId?: string;
      error?: Error;
      data?: any;
    }
  ): void {
    const message = `Payment event: ${event} - ${amount} ${currency}`;
    const entry = this.createLogEntry(
      event === 'payment_failed' ? LogLevel.ERROR : LogLevel.INFO,
      LogCategory.PAYMENT,
      message,
      context?.data,
      context
    );
    this.writeLog(entry);
  }
}

// Create singleton instance
export const logger = new Logger();

// Request context helper
export function getRequestContext(request: NextRequest, requestId?: string) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const url = new URL(request.url);
  
  return {
    requestId: requestId || crypto.randomUUID(),
    ip,
    userAgent,
    endpoint: url.pathname,
    method: request.method
  };
}

// API logging middleware helper
export function logApiRequest(
  request: NextRequest,
  statusCode: number,
  startTime: number,
  context?: {
    userId?: string;
    requestId?: string;
    data?: any;
  }
): void {
  const duration = Date.now() - startTime;
  const requestContext = getRequestContext(request, context?.requestId);
  
  logger.apiRequest(
    request.method,
    requestContext.endpoint,
    statusCode,
    duration,
    {
      ...requestContext,
      userId: context?.userId,
      data: context?.data
    }
  );
}

// Error logging helper
export function logError(
  error: Error,
  context?: {
    category?: LogCategory;
    userId?: string;
    requestId?: string;
    endpoint?: string;
    data?: any;
  }
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    category: context?.category || LogCategory.SYSTEM,
    message: error.message,
    data: context?.data,
    userId: context?.userId,
    requestId: context?.requestId,
    endpoint: context?.endpoint,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };
  
  logger['writeLog'](entry);
}

export default logger;