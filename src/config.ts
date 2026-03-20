export const SECONDME_API_BASE = process.env.SECONDME_API_BASE || 'https://api.mindverse.com/gate/lab';

export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'file';

export const KV_STORAGE_CONFIG = {
  url: process.env.KV_URL,
  restApiUrl: process.env.KV_REST_API_URL,
  httpApiToken: process.env.KV_HTTP_API_TOKEN,
  premiumApiToken: process.env.KV_PREMIUM_API_TOKEN,
};

export const POSTGRES_STORAGE_CONFIG = {
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
  maxConnections: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '10', 10),
};

export const AUTH_ENDPOINTS = {
  codeExchange: `${SECONDME_API_BASE}/api/oauth/token/code`,
  tokenRefresh: `${SECONDME_API_BASE}/api/oauth/token/refresh`,
};

export const API_ENDPOINTS = {
  profile: `${SECONDME_API_BASE}/api/secondme/user/info`,
  plazaAccess: `${SECONDME_API_BASE}/plaza/access`,
  plazaRedeem: `${SECONDME_API_BASE}/plaza/invitation/redeem`,
  plazaPosts: `${SECONDME_API_BASE}/plaza/posts`,
  plazaFeed: `${SECONDME_API_BASE}/plaza/feed`,
  plazaPostDetail: `${SECONDME_API_BASE}/plaza/posts`,
  plazaComments: `${SECONDME_API_BASE}/plaza/posts`,
  discoverUsers: `${SECONDME_API_BASE}/discover/users`,
  memoriesKey: `${SECONDME_API_BASE}/memories/key`,
  memoriesKeyBatch: `${SECONDME_API_BASE}/memories/key/batch`,
  memoriesKeySearch: `${SECONDME_API_BASE}/memories/key/search`,
  agentMemoryIngest: `${SECONDME_API_BASE}/api/secondme/agent_memory/ingest`,
  activity: `${SECONDME_API_BASE}/agent/events/day-overview`,
  appsAvailable: `${SECONDME_API_BASE}/apps/available`,
  skills: `${SECONDME_API_BASE}/skills`,
};

export const CREDENTIALS_FILE = '~/.openclaw/.credentials';

export const STORAGE_DATA_DIR = process.env.STORAGE_DATA_DIR || '~/.openclaw/data';

export const ZHIHU_API_BASE = process.env.ZHIHU_API_BASE || 'https://openapi.zhihu.com';

export const ZHIHU_ENDPOINTS = {
  ringDetail: `${ZHIHU_API_BASE}/openapi/ring/detail`,
  publishPin: `${ZHIHU_API_BASE}/openapi/publish/pin`,
  reaction: `${ZHIHU_API_BASE}/openapi/reaction`,
  commentCreate: `${ZHIHU_API_BASE}/openapi/comment/create`,
  commentDelete: `${ZHIHU_API_BASE}/openapi/comment/delete`,
  commentList: `${ZHIHU_API_BASE}/openapi/comment/list`,
  billboardList: `${ZHIHU_API_BASE}/openapi/billboard/list`,
  searchGlobal: `${ZHIHU_API_BASE}/openapi/search/global`,
};
