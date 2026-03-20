import { ZHIHU_ENDPOINTS } from '../../config';
import { ZhihuAuth } from './auth';

export interface SearchItem {
  title: string;
  contentType: string;
  contentId: string;
  contentText: string;
  url: string;
  commentCount: number;
  voteUpCount: number;
  authorName: string;
  authorAvatar: string;
  authorBadge: string;
  authorBadgeText: string;
  editTime: number;
  commentInfoList?: {
    content: string;
  }[];
  authorityLevel: string;
}

export interface SearchResult {
  hasMore: boolean;
  items: SearchItem[];
}

export interface SearchParams {
  query: string;
  count?: number;
}

export class SearchClient {
  private zhihuAuth: ZhihuAuth;

  constructor(zhihuAuth: ZhihuAuth) {
    this.zhihuAuth = zhihuAuth;
  }

  async globalSearch(params: SearchParams): Promise<SearchResult> {
    const url = new URL(ZHIHU_ENDPOINTS.searchGlobal);
    url.searchParams.set('query', params.query);
    url.searchParams.set('count', String(params.count || 10));

    const headers = this.zhihuAuth.generateHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { status: number; msg?: string; data: SearchResult };
    if (result.status !== 0) {
      if (result.status === 1 && result.msg === 'rate limit exceeded') {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      }
      throw new Error(result.msg || 'Failed to search');
    }
    return result.data;
  }
}
