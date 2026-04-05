import { ZHIHU_ENDPOINTS } from '../../config';
import { ZhihuAuth } from './auth';

export interface BillboardItem {
  title: string;
  body: string;
  linkUrl: string;
  publishedTime: number;
  publishedTimeStr: string;
  state: string;
  heatScore: number;
  token: string;
  type: string;
  answers?: BillboardAnswer[];
  interactionInfo?: {
    voteUpCount: number;
    likeCount: number;
    commentCount: number;
    favorites: number;
    pvCount: number;
  };
}

export interface BillboardAnswer {
  title: string;
  body: string;
  linkUrl: string;
  publishedTime: number;
  publishedTimeStr: string;
  state: string;
  heatScore: number;
  token: string;
  type: string;
  interactionInfo?: {
    voteUpCount: number;
    likeCount: number;
    commentCount: number;
    favorites: number;
    pvCount: number;
  };
}

export interface BillboardListResult {
  list: BillboardItem[];
  pagination: {
    total: number;
  };
}

export interface BillboardParams {
  topCnt?: number;
  publishInHours?: number;
}

export class BillboardClient {
  private zhihuAuth: ZhihuAuth;

  constructor(zhihuAuth: ZhihuAuth) {
    this.zhihuAuth = zhihuAuth;
  }

  async getList(params?: BillboardParams): Promise<BillboardListResult> {
    const url = new URL(ZHIHU_ENDPOINTS.billboardList);
    url.searchParams.set('top_cnt', String(params?.topCnt || 50));
    url.searchParams.set('publish_in_hours', String(params?.publishInHours || 48));

    const headers = this.zhihuAuth.generateHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { status: number; msg?: string; data: BillboardListResult };
    if (result.status !== 0) {
      throw new Error(result.msg || 'Failed to get billboard list');
    }
    return result.data;
  }
}
