export interface LogContext {
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}

export class NoopLogger implements Logger {
  public debug(_message: string, _context?: LogContext): void {
    // noop
  }

  public info(_message: string, _context?: LogContext): void {
    // noop
  }

  public warn(_message: string, _context?: LogContext): void {
    // noop
  }

  public error(_message: string, _error?: Error, _context?: LogContext): void {
    // noop
  }
}
