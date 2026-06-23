/**
 * Error handling and logging utilities for React Native
 */

enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      error,
    };

    this.logs.push(entry);

    // Keep logs size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const logFn = this.getConsoleFunction(level);
      logFn(`[${level}] ${message}`, data, error);
    }
  }

  private getConsoleFunction(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, message, data, error);
  }

  fatal(message: string, error?: Error) {
    this.log(LogLevel.FATAL, message, undefined, error);
    // Could send to crash reporting service here
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(l => l.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

// Error handler
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string = "UNKNOWN_ERROR",
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// Async error handler wrapper
export function handleAsyncError<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error("Async error:", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }) as T;
}

// Firebase error handler
export function handleFirebaseError(error: any): AppError {
  const fbError = error as any;
  const code = fbError.code || "FIREBASE_ERROR";

  const errorMessages: { [key: string]: string } = {
    "auth/user-not-found": "User account not found",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "Email already registered",
    "auth/weak-password": "Password must be at least 6 characters",
    "auth/invalid-email": "Invalid email address",
    "auth/user-disabled": "User account has been disabled",
    "auth/too-many-requests": "Too many login attempts. Try again later",
    "firestore/permission-denied": "You don't have permission to access this data",
    "firestore/unauthenticated": "Please sign in first",
  };

  const message = errorMessages[code] || fbError.message || "An error occurred";
  
  logger.error(`Firebase error: ${code}`, fbError);
  
  return new AppError(message, code, 400, { originalError: fbError });
}

// Network error handler
export function handleNetworkError(error: any): AppError {
  logger.error("Network error:", error);
  
  if (error.code === "ERR_NETWORK") {
    return new AppError(
      "No internet connection. Please check your connection and try again.",
      "NO_INTERNET",
      0
    );
  }
  
  return new AppError(
    "Network error occurred. Please try again.",
    "NETWORK_ERROR",
    0,
    { originalError: error }
  );
}

// Validation error handler
export interface ValidationError {
  field: string;
  message: string;
}

export function createValidationError(
  field: string,
  message: string
): ValidationError {
  return { field, message };
}

// Error reporting (ready for Sentry integration)
export function reportError(error: any, context?: any) {
  logger.error("Error reported", error instanceof Error ? error : new Error(String(error)));
  
  // TODO: Send to Sentry or other error tracking service
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

export type { LogEntry };
export { LogLevel };
