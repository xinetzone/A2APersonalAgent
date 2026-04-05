import { API_ENDPOINTS } from '../../config';
import { credentialManager } from './credentials';
import { AuthenticationError, NetworkError } from '../../errors';
import { withRetry } from '../../utils/retry';
import { TimedCache } from '../../utils/cache';
import { apiLogger } from '../../utils/logger';

export interface Profile {
  name: string;
  avatar: string;
  aboutMe: string;
  originRoute: string;
  homepage: string;
}

export interface ProfileUpdate {
  name?: string;
  avatar?: string;
  aboutMe?: string;
  originRoute?: string;
}

const profileCache = new TimedCache<Profile>(300000);

export class ProfileClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await credentialManager.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getProfile(): Promise<Profile> {
    const cached = profileCache.get('current_user');
    if (cached) {
      apiLogger.debug({}, 'Returning cached profile');
      return cached;
    }

    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(API_ENDPOINTS.profile, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: Profile };
      profileCache.set('current_user', result.data);
      return result.data;
    });
  }

  async updateProfile(update: ProfileUpdate): Promise<Profile> {
    return withRetry(async () => {
      const token = await credentialManager.getAccessToken();
      if (!token) {
        throw new AuthenticationError('Not authenticated. Please login first.');
      }

      const response = await fetch(API_ENDPOINTS.profile, {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: JSON.stringify(update),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as { data: Profile };

      profileCache.invalidate('current_user');

      await credentialManager.save({
        accessToken: token,
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.homepage && { homepage: result.data.homepage }),
        ...(result.data.originRoute && { originRoute: result.data.originRoute }),
      });

      return result.data;
    });
  }
}

export const profileClient = new ProfileClient();
