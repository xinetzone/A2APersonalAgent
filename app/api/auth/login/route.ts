import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

const OAUTH_URL = 'https://second-me.cn/oauth';

function getRedirectUri(request: NextRequest): string {
  const isProduction = process.env.VERCEL === 'true';
  if (isProduction) {
    return 'https://pagent.agentpit.io/api/auth/callback';
  }
  const host = request.headers.get('host') || 'localhost:3001';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/api/auth/callback`;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.SECONDME_CLIENT_ID;
  const clientSecret = process.env.SECONDME_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Login] SecondMe credentials not configured:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      environment: process.env.VERCEL ? 'production' : 'development'
    });

    return NextResponse.redirect(new URL('/profile?error=server_not_configured', request.url));
  }

  // 验证客户端 ID 是否为测试值
  if (clientId === 'test_client_id' || clientSecret === 'test_client_secret') {
    console.warn('[Login] Using test credentials. This should only be used in development.');
    // 在生产环境中拒绝使用测试凭据
    if (process.env.VERCEL === 'true') {
      return NextResponse.redirect(new URL('/profile?error=invalid_credentials', request.url));
    }
  }

  const redirectUri = getRedirectUri(request);
  const state = randomUUID();
  
  // 存储state到cookie
  const cookieStore = cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.VERCEL === 'true',
    maxAge: 60 * 10, // 10分钟过期
    path: '/'
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  const authUrl = `${OAUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}