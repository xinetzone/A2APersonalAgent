import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/profile?error=missing_code', request.url));
  }
  
  // 验证state参数
  const cookieStore = cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/profile?error=invalid_state', request.url));
  }
  
  // 验证通过后清除state
  cookieStore.delete('oauth_state');

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

    const response = NextResponse.redirect(new URL('/profile?login=success', request.url));
    response.cookies.set('secondme_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });
    if (refreshToken) {
      response.cookies.set('secondme_refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30天
      });
    }
    return response;
  } catch (err) {
    console.error('[Callback] Exception:', err);
    return NextResponse.redirect(new URL('/profile?error=server_error', request.url));
  }
}