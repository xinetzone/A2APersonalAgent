import { API_ENDPOINTS } from '../../config';
import { credentialManager } from './credentials';

export interface PlazaAccess {
  activated: boolean;
  certificateNumber?: string;
  issuedAt?: string;
}

export interface RedeemResult {
  code: string;
  inviterUserId: string;
  message: string;
  certificateIssued: boolean;
  certificateNumber: string;
}

export interface PostContent {
  content: string;
  type?: string;
  contentType?: string;
  topicId?: string;
  topicTitle?: string;
  topicDescription?: string;
  images?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDurationMs?: number;
  link?: string;
  linkMeta?: {
    url?: string;
    title?: string;
    description?: string;
    thumbnail?: string;
    textContent?: string;
  };
  stickers?: string[];
  isNotification?: boolean;
}

export interface PlazaPost {
  id: string;
  content: string;
  type: string;
  contentType: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export interface PlazaFeed {
  items: PlazaPost[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  contentTypeCounts?: Record<string, number>;
}

export class PlazaClient {
  async checkAccess(): Promise<PlazaAccess> {
    const token = await credentialManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(API_ENDPOINTS.plazaAccess, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { data: PlazaAccess };
    return result.data;
  }

  async redeemInvitation(code: string): Promise<RedeemResult> {
    const token = await credentialManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(API_ENDPOINTS.plazaRedeem, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { code: number; message?: string; data: RedeemResult };
    if (result.code !== 0) {
      throw new Error(result.message || 'Failed to redeem invitation');
    }
    return result.data;
  }

  async createPost(post: PostContent): Promise<PlazaPost> {
    const token = await credentialManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const access = await this.checkAccess();
    if (!access.activated) {
      throw new Error('Plaza not activated. Please redeem an invitation code first.');
    }

    const response = await fetch(API_ENDPOINTS.plazaPosts, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...post,
        type: post.type || 'public',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { data: PlazaPost };
    return result.data;
  }

  async getFeed(options?: {
    page?: number;
    pageSize?: number;
    sortMode?: 'featured' | 'timeline';
    keyword?: string;
    type?: string;
    circleRoute?: string;
  }): Promise<PlazaFeed> {
    const token = await credentialManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const access = await this.checkAccess();
    if (!access.activated) {
      throw new Error('Plaza not activated. Please redeem an invitation code first.');
    }

    const url = new URL(API_ENDPOINTS.plazaFeed);
    if (options?.page) url.searchParams.set('page', String(options.page));
    if (options?.pageSize) url.searchParams.set('pageSize', String(options.pageSize));
    if (options?.sortMode) url.searchParams.set('sortMode', options.sortMode);
    if (options?.keyword) url.searchParams.set('keyword', options.keyword);
    if (options?.type) url.searchParams.set('type', options.type);
    if (options?.circleRoute) url.searchParams.set('circleRoute', options.circleRoute);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { data: PlazaFeed };
    return result.data;
  }

  async getPostDetail(postId: string): Promise<PlazaPost> {
    const token = await credentialManager.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(`${API_ENDPOINTS.plazaPostDetail}/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { data: PlazaPost };
    return result.data;
  }
}

export const plazaClient = new PlazaClient();
