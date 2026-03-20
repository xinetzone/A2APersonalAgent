import { ZHIHU_ENDPOINTS } from '../../config';
import { ZhihuAuth } from './auth';

export interface RingInfo {
  ringId: string;
  ringName: string;
  ringDesc: string;
  ringAvatar: string;
  membershipNum: number;
  discussionNum: number;
}

export interface RingContent {
  pinId: string;
  content: string;
  authorName: string;
  images?: string[];
  publishTime: number;
  likeNum: number;
  commentNum: number;
  shareNum: number;
  favNum: number;
  comments?: ZhihuComment[];
}

export interface ZhihuComment {
  commentId: number;
  content: string;
  authorName: string;
  authorToken: string;
  likeCount: number;
  replyCount: number;
  publishTime: number;
}

export interface RingDetailResult {
  ring_info: RingInfo;
  contents: RingContent[];
}

export interface RingDetailParams {
  ringId: string;
  pageNum?: number;
  pageSize?: number;
}

export class RingClient {
  private zhihuAuth: ZhihuAuth;

  constructor(zhihuAuth: ZhihuAuth) {
    this.zhihuAuth = zhihuAuth;
  }

  async getDetail(params: RingDetailParams): Promise<RingDetailResult> {
    const url = new URL(ZHIHU_ENDPOINTS.ringDetail);
    url.searchParams.set('ring_id', params.ringId);
    url.searchParams.set('page_num', String(params.pageNum || 1));
    url.searchParams.set('page_size', String(params.pageSize || 20));

    const headers = this.zhihuAuth.generateHeaders();

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json() as { status: number; msg?: string; data: RingDetailResult };
    if (result.status !== 0) {
      throw new Error(result.msg || 'Failed to get ring detail');
    }
    return result.data;
  }
}
