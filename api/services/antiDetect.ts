/**
 * 反检测与频率限制服务
 * 防止被招聘平台识别为自动化请求
 */

// ========== User-Agent 池 ==========
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
];

// ========== 频率限制器 ==========
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// 每用户每平台的请求计数（内存级）
const rateLimitMap = new Map<string, RateLimitEntry>();

// 配置
const RATE_LIMIT_WINDOW_MS = 60 * 1000;   // 1 分钟窗口
const MAX_REQUESTS_PER_WINDOW = 6;         // 每分钟最多 6 次操作
const MIN_DELAY_MS = 2000;                 // 最小延迟 2 秒
const MAX_DELAY_MS = 6000;                 // 最大延迟 6 秒

/**
 * 获取一个随机 User-Agent
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 随机延迟（模拟人类操作时间）
 */
export function randomDelay(minMs = MIN_DELAY_MS, maxMs = MAX_DELAY_MS): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * 检查频率限制
 * @returns true = 允许请求；false = 需要等待
 */
export function checkRateLimit(userId: string, platformId: string): { allowed: boolean; retryAfterMs?: number } {
  const key = `${userId}:${platformId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // 新窗口
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * 构建通用请求头（模拟真实浏览器）
 */
export function buildBrowserHeaders(platform: 'boss' | 'zhilian', cookie: string): Record<string, string> {
  const ua = getRandomUserAgent();
  const common: Record<string, string> = {
    'User-Agent': ua,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cookie': cookie,
  };

  if (platform === 'boss') {
    return {
      ...common,
      'Referer': 'https://www.zhipin.com/web/geek/job',
      'Origin': 'https://www.zhipin.com',
      'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };
  }

  // 智联招聘
  return {
    ...common,
    'Referer': 'https://sou.zhaopin.com/',
    'Origin': 'https://sou.zhaopin.com',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
  };
}

/**
 * 简单的 Cookie 值加密（AES 对称加密可后续替换）
 * 这里用 Base64 编码做简易保护，生产环境建议用 crypto.createCipheriv
 */
export function encryptCookie(raw: string): string {
  return Buffer.from(raw, 'utf-8').toString('base64');
}

export function decryptCookie(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf-8');
}
