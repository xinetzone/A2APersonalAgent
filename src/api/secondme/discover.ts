import { API_ENDPOINTS } from '../../config';
import { credentialManager } from './credentials';
import { AuthenticationError, NetworkError } from '../../errors';
import { withRetry } from '../../utils/retry';

export interface DiscoveredUser {
  username: string;
  distance?: string;
  route: string;
  matchScore?: number;
  title?: string;
  hook?: string;
  briefIntroduction?: string;
}

export interface DiscoverUsersResult {
  items: DiscoveredUser[];
  total: number;
  pageNo: number;
  pageSize: number;
  hasMore: boolean;
}

export class DiscoverClient {
  async getUsers(options?: {
    pageNo?: number;
    pageSize?: number;
    longitude?: number;
    latitude?: number;
    circleType?: string;
  }): Promise<DiscoverUsersResult> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const url = new URL(API_ENDPOINTS.discoverUsers);
      url.searchParams.set('pageNo', String(options?.pageNo || 1));
      url.searchParams.set('pageSize', String(options?.pageSize || 20));
      if (options?.longitude) url.searchParams.set('longitude', String(options.longitude));
      if (options?.latitude) url.searchParams.set('latitude', String(options.latitude));
      if (options?.circleType) url.searchParams.set('circleType', options.circleType);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: DiscoverUsersResult };

      return result.data;
    });
  }
}

export const discoverClient = new DiscoverClient();
