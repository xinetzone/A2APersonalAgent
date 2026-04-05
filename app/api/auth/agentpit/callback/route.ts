import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.AGENTPIT_CLIENT_ID;
const CLIENT_SECRET = process.env.AGENTPIT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('AGENTPIT_CLIENT_ID and AGENTPIT_CLIENT_SECRET must be configured');
}
const TOKEN_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/oauth/token/code';
const USERINFO_ENDPOINT = 'https://api.mindverse.com/gate/lab/api/user/info';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/login/agentpit?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login/agentpit?error=missing_code', request.url));
  }

  const savedState = request.cookies.get('agentpit_oauth_state')?.value;
  if (state && savedState && state !== savedState) {
    return NextResponse.redirect(new URL('/login/agentpit?error=invalid_state', request.url));
  }

  try {
    const redirectUri = getRedirectUri(request);

    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const userInfoRes = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};

    const response = NextResponse.redirect(new URL('/profile?login=agentpit_success', request.url));
    response.cookies.set('agentpit_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });
    if (refresh_token) {
      response.cookies.set('agentpit_refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30天
      });
    }
    response.cookies.set('agentpit_user', JSON.stringify(userInfo), {
      httpOnly: false, // 用户信息可以在前端访问
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7天
    });
    response.cookies.delete('agentpit_oauth_state');

    return response;
  } catch (err) {
    console.error('[AgentPit Callback] Error:', err);
    return NextResponse.redirect(new URL('/login/agentpit?error=server_error', request.url));
  }
}

const PUBLIC_HOST = process.env.PUBLIC_HOST || 'pagent.agentpit.io';

function getRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || PUBLIC_HOST;
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocalhost ? 'https' : 'https';
  const effectiveHost = isLocalhost ? PUBLIC_HOST : host;
  return `${protocol}://${effectiveHost}/api/auth/agentpit/callback`;
}
