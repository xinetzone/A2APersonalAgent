import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.SECONDME_API_BASE || 'https://api.mindverse.com/gate/lab';

interface SecondMeUserData {
  userId: string;
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  selfIntroduction?: string;
  profileCompleteness?: number;
  route?: string;
}

interface UserData {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  selfIntroduction?: string;
  profileCompleteness?: number;
  route?: string;
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.slice('Bearer '.length);

  if (!token) {
    return NextResponse.json({ code: 401, message: 'No token provided' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/secondme/user/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log('[API] SecondMe user info raw response:', JSON.stringify(data));

    if (response.ok && data.code === 0 && data.data) {
      const normalizedUser = normalizeUserData(data.data);
      console.log('[API] Normalized user data:', JSON.stringify(normalizedUser));
      return NextResponse.json({ code: 0, data: normalizedUser });
    }

    return NextResponse.json(data.code ? data : { code: response.status, message: 'Failed to fetch user info' }, { status: response.status });
  } catch (error) {
    console.error('[API] User info proxy error:', error);
    return NextResponse.json({ code: 500, message: 'Failed to fetch user info' }, { status: 500 });
  }
}

function normalizeUserData(data: SecondMeUserData): UserData {
  return {
    id: data.userId || '',
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar,
    bio: data.bio,
    selfIntroduction: data.selfIntroduction,
    profileCompleteness: data.profileCompleteness,
    route: data.route,
  };
}