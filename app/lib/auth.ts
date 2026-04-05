const API_BASE_URL = process.env.SECONDME_API_BASE || 'https://api.mindverse.com/gate/lab';

function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const cookieValue = document.cookie
    .split('; ') 
    .find(row => row.startsWith(`${name}=`)) 
    ?.split('=')[1];
  return cookieValue ? decodeURIComponent(cookieValue) : null;
}

export function getAccessToken(): string | null {
  return getCookie('secondme_token');
}

export function setAccessToken(token: string): void {
  // 令牌通过后端设置HttpOnly Cookie
  // 前端不需要设置
}

export function getRefreshToken(): string | null {
  return getCookie('secondme_refresh_token');
}

export function setRefreshToken(token: string): void {
  // 令牌通过后端设置HttpOnly Cookie
  // 前端不需要设置
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  // 通过设置过期时间来清除Cookie
  document.cookie = 'secondme_token=; Max-Age=0; Path=/;';
  document.cookie = 'secondme_refresh_token=; Max-Age=0; Path=/;';
  document.cookie = 'agentpit_token=; Max-Age=0; Path=/;';
  document.cookie = 'agentpit_refresh_token=; Max-Age=0; Path=/;';
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    // 由于使用HttpOnly Cookie，刷新令牌应该通过后端API进行
    // 这里我们返回null，实际的刷新逻辑应该在后端实现
    // 前端可以通过重定向到登录页面来处理令牌过期的情况
    console.warn('Token refresh should be handled by backend API');
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
