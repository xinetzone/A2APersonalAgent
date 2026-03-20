import crypto from 'crypto';

export interface ZhihuAuthParams {
  appKey: string;
  appSecret: string;
}

export class ZhihuAuth {
  private appKey: string;
  private appSecret: string;

  constructor(params: ZhihuAuthParams) {
    this.appKey = params.appKey;
    this.appSecret = params.appSecret;
  }

  generateSignature(timestamp: string, logId: string, extraInfo: string = ''): string {
    const signStr = `app_key:${this.appKey}|ts:${timestamp}|logid:${logId}|extra_info:${extraInfo}`;
    const hmac = crypto.createHmac('sha256', this.appSecret);
    hmac.update(signStr);
    return hmac.digest('base64');
  }

  generateHeaders(logId?: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const actualLogId = logId || `log_${Date.now()}${Math.random().toString(36).substring(2, 10)}`;
    const signature = this.generateSignature(timestamp, actualLogId);

    return {
      'X-App-Key': this.appKey,
      'X-Timestamp': timestamp,
      'X-Log-Id': actualLogId,
      'X-Sign': signature,
      'X-Extra-Info': '',
    };
  }
}
