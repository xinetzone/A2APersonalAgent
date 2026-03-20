const isProduction = process.env.NODE_ENV === 'production';

const logLevel = process.env.LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function formatMessage(level: LogLevel, msg: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${metaStr}`;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (logLevel as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return levels[level] >= levels[this.level];
  }

  debug(meta: Record<string, unknown>, msg: string): void {
    if (this.shouldLog('debug')) {
      console.log(formatMessage('debug', msg, meta));
    }
  }

  info(meta: Record<string, unknown>, msg: string): void {
    if (this.shouldLog('info')) {
      console.log(formatMessage('info', msg, meta));
    }
  }

  warn(meta: Record<string, unknown>, msg: string): void {
    if (this.shouldLog('warn')) {
      console.warn(formatMessage('warn', msg, meta));
    }
  }

  error(meta: Record<string, unknown>, msg: string): void {
    if (this.shouldLog('error')) {
      console.error(formatMessage('error', msg, meta));
    }
  }

  child(_context: Record<string, unknown>): Logger {
    return this;
  }
}

export const logger = new Logger();

export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

const authLogger = createChildLogger({ module: 'auth' });
const apiLogger = createChildLogger({ module: 'api' });
const mcpLogger = createChildLogger({ module: 'mcp' });

export { authLogger, apiLogger, mcpLogger };
