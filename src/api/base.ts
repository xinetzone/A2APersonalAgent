import { NetworkError, AuthenticationError } from '../errors';
import { withRetry } from '../utils/retry';

export abstract class BaseApiClient {
  protected abstract getAuthHeaders(): Promise<Record<string, string>>;

  protected async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  protected async post<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) });
  }

  protected async put<T>(endpoint: string, data: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) });
  }

  protected async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    return withRetry(async () => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: T };
      return result.data;
    });
  }
}
