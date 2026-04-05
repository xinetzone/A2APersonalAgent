import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const CLIENT_ID = process.env.AGENTPIT_CLIENT_ID;
const CLIENT_SECRET = process.env.AGENTPIT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('AGENTPIT_CLIENT_ID and AGENTPIT_CLIENT_SECRET must be configured');
}
const OAUTH_URL = 'https://go.second.me/oauth/';

const PUBLIC_HOST = process.env.PUBLIC_HOST || 'pagent.agentpit.io';

function getRedirectUri(request: NextRequest): string {
  const host = request.headers.get('host') || PUBLIC_HOST;
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const protocol = isLocalhost ? 'https' : 'https';
  const effectiveHost = isLocalhost ? PUBLIC_HOST : host;
  return `${protocol}://${effectiveHost}/api/auth/agentpit/callback`;
}

export async function GET(request: NextRequest) {
  const redirectUri = getRedirectUri(request);
  const state = randomUUID();

  const loginUrl = new URL(OAUTH_URL);
  loginUrl.searchParams.set('client_id', CLIENT_ID);
  loginUrl.searchParams.set('redirect_uri', redirectUri);
  loginUrl.searchParams.set('response_type', 'code');
  loginUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(loginUrl.toString());
  response.cookies.set('agentpit_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return response;
}
