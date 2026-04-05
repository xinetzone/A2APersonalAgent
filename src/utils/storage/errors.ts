import { AppError } from '../../errors';

export class StorageError extends AppError {
  constructor(
    message: string,
    public readonly operation: 'get' | 'set' | 'delete' | 'clear' | 'init' | 'unknown' = 'unknown',
    public readonly key?: string,
    public readonly causeError?: Error
  ) {
    super(message, 'STORAGE_ERROR', 500, true);
    this.name = 'StorageError';
  }
}

export class StorageConnectionError extends StorageError {
  constructor(provider: string, cause?: Error) {
    super(`Failed to connect to ${provider} storage`, 'init', undefined, cause);
    this.name = 'StorageConnectionError';
  }
}

export class StorageNotAvailableError extends StorageError {
  constructor(provider: string) {
    super(`${provider} storage is not configured or unavailable`, 'init');
    this.name = 'StorageNotAvailableError';
  }
}

export class StorageReadError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Failed to read key: ${key}`, 'get', key, cause);
    this.name = 'StorageReadError';
  }
}

export class StorageWriteError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Failed to write key: ${key}`, 'set', key, cause);
    this.name = 'StorageWriteError';
  }
}

export class StorageDeleteError extends StorageError {
  constructor(key: string, cause?: Error) {
    super(`Failed to delete key: ${key}`, 'delete', key, cause);
    this.name = 'StorageDeleteError';
  }
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}
