import { AppError, NetworkError } from '../errors';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === opts.maxAttempts) {
        if (error instanceof AppError) throw error;
        throw new NetworkError(error instanceof Error ? error.message : 'Request failed after retries');
      }

      if (error instanceof Response) {
        if (!opts.retryableStatuses.includes(error.status)) {
          throw error;
        }
      } else if (error instanceof Error && !isRetryableError(error)) {
        throw error;
      }

      const delay = Math.min(
        opts.baseDelay * Math.pow(2, attempt - 1),
        opts.maxDelay
      );
      await sleep(delay);
    }
  }
  throw new Error('Unreachable');
}

function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'socket hang up',
    'network error',
  ];
  return retryablePatterns.some(pattern =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
  );
}
