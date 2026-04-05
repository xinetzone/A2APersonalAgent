import { AUTH_ENDPOINTS } from '../../config';
import { credentialManager, Credentials } from './credentials';
import { AuthenticationError, NetworkError, isAppError } from '../../errors';
import { withRetry } from '../../utils/retry';
import { mcpLogger } from '../../utils/logger';

export interface TokenResponse {
  code: number;
  data: {
    accessToken: string;
    tokenType: string;
  };
  message?: string;
}

export class AuthClient {
  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    return withRetry(async () => {
      const clientId = process.env.SECONDME_CLIENT_ID;
      const clientSecret = process.env.SECONDME_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new AuthenticationError('Client credentials not configured');
      }
      
      const redirectUri = process.env.VERCEL === 'true' 
        ? 'https://pagent.agentpit.io/api/auth/callback' 
        : 'http://localhost:3001/api/auth/callback';

      const response = await fetch(AUTH_ENDPOINTS.codeExchange, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        }),
      });

      if (!response.ok) {
        throw new NetworkError(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as TokenResponse;

      if (result.code !== 0) {
        throw new AuthenticationError(result.message || 'Token exchange failed');
      }

      if (!result.data.accessToken) {
        throw new AuthenticationError('No access token in response');
      }

      mcpLogger.info({ code: result.code }, 'Token exchanged successfully');
      return result;
    });
  }

  async saveCredentials(credentials: Credentials): Promise<void> {
    await credentialManager.save(credentials);
  }

  async getValidToken(): Promise<string | null> {
    return await credentialManager.getAccessToken();
  }

  async isAuthenticated(): Promise<boolean> {
    return await credentialManager.hasCredentials();
  }

  async logout(): Promise<void> {
    await credentialManager.clear();
  }
}

export const authClient = new AuthClient();
