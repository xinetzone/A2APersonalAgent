import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.SECONDME_API_BASE || 'https://api.mindverse.com/gate/lab';
const TOKEN_ENDPOINT = `${API_BASE_URL}/api/oauth/token/code`;

interface TokenResponse {
  code: number;
  data?: {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    scope?: string[];
  };
  message?: string;
}

function getRedirectUri(request: NextRequest): string {
  const isProduction = process.env.VERCEL === 'true';
  if (isProduction) {
    return 'https://a2-a-personal-agent.vercel.app/api/auth/callback';
  }
  const host = request.headers.get('host') || 'localhost:3001';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/auth/callback`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/profile?error=missing_code', request.url));
  }

  try {
    const clientId = process.env.SECONDME_CLIENT_ID;
    const clientSecret = process.env.SECONDME_CLIENT_SECRET;
    const redirectUri = getRedirectUri(request);

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/profile?error=server_config_error', request.url));
    }

    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/profile?error=token_exchange_failed', request.url));
    }

    const result = (await response.json()) as TokenResponse;

    if (result.code !== 0 || !result.data?.accessToken) {
      return NextResponse.redirect(new URL('/profile?error=invalid_token_response', request.url));
    }

    const { accessToken, refreshToken } = result.data;

    const script = `
    try {
      localStorage.setItem('secondme_token', ${JSON.stringify(accessToken)});
      ${refreshToken ? `localStorage.setItem('secondme_refresh_token', ${JSON.stringify(refreshToken)});` : ''}
      window.location.href = '/profile?login=success';
    } catch (e) {
      window.location.href = '/profile?error=storage_error';
    }
    `.replace(/\n/g, '').trim();

    const html = `<!DOCTYPE html><html><head><title>登录中...</title></head><body><script>${script}</script></body></html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (err) {
    console.error('[Callback] Exception:', err);
    return NextResponse.redirect(new URL('/profile?error=server_error', request.url));
  }
}