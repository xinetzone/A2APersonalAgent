const API_BASE_URL = process.env.SECONDME_API_BASE || 'https://api.mindverse.com/gate/lab';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('secondme_token');
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('secondme_token', token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('secondme_refresh_token');
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('secondme_refresh_token', token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('secondme_token');
  localStorage.removeItem('secondme_refresh_token');
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/oauth/token/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.SECONDME_CLIENT_ID || '',
        client_secret: process.env.SECONDME_CLIENT_SECRET || '',
      }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const result = await response.json();
    if (result.code === 0 && result.data?.accessToken) {
      setAccessToken(result.data.accessToken);
      if (result.data.refreshToken) {
        setRefreshToken(result.data.refreshToken);
      }
      return result.data.accessToken;
    }

    clearTokens();
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export { API_BASE_URL };
