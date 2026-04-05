import { AppError, AuthenticationError, AuthorizationError, NotFoundError, ValidationError, NetworkError, isAppError, getErrorMessage, safeStringify } from '@/errors';

describe('AppError', () => {
  describe('AppError base class', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should default statusCode to 500', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('AuthenticationError', () => {
    it('should create error with correct properties', () => {
      const error = new AuthenticationError('Auth failed');

      expect(error.message).toBe('Auth failed');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should have default message', () => {
      const error = new AuthenticationError();
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('AuthorizationError', () => {
    it('should create error with correct properties', () => {
      const error = new AuthorizationError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('AUTHZ_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('AuthorizationError');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with correct properties', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct properties', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('NetworkError', () => {
    it('should create error with correct properties', () => {
      const error = new NetworkError('Connection failed');

      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(502);
    });

    it('should have default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network request failed');
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      expect(isAppError(new AppError('test', 'TEST'))).toBe(true);
      expect(isAppError(new AuthenticationError())).toBe(true);
      expect(isAppError(new NotFoundError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from AppError', () => {
      const error = new ValidationError('Invalid input');
      expect(getErrorMessage(error)).toBe('Invalid input');
    });

    it('should extract message from regular Error', () => {
      const error = new Error('Regular error');
      expect(getErrorMessage(error)).toBe('Regular error');
    });

    it('should return default message for unknown values', () => {
      expect(getErrorMessage('string')).toBe('An unknown error occurred');
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
    });
  });

  describe('safeStringify', () => {
    it('should stringify regular objects', () => {
      const result = safeStringify({ key: 'value' });
      expect(JSON.parse(result)).toEqual({ key: 'value' });
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { key: 'value' };
      obj.circular = obj;

      const result = safeStringify(obj);
      expect(result).toContain('[Circular]');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = safeStringify(error);

      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('Error');
      expect(parsed.message).toBe('Test error');
    });
  });
});
