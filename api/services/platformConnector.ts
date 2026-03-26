/**
 * 平台连接器服务
 * 通过用户提供的 Cookie 调用 Boss直聘 / 智联招聘 的内部 API
 */
import { buildBrowserHeaders, randomDelay, decryptCookie, encryptCookie } from './antiDetect.js';

// ========== 类型定义 ==========
export interface PlatformCredentials {
  cookie: string;          // 用户从浏览器复制的 Cookie（加密存储）
  platform: 'boss' | 'zhilian';
}

export interface ValidationResult {
  valid: boolean;
  userName?: string;       // 平台上的用户名
  error?: string;
}

export interface JobSearchParams {
  keyword: string;
  city?: string;
  salary?: string;
  page?: number;
}

export interface JobResult {
  jobId: string;
  title: string;
  company: string;
  salary: string;
  city: string;
  experience: string;
  education: string;
  tags: string[];
  bossName?: string;
  bossTitle?: string;
  companyLogo?: string;
  detailUrl: string;
  // Boss 直聘特有
  encryptJobId?: string;
  encryptUserId?: string;
  lid?: string;
  securityId?: string;
}

export interface ApplyResult {
  success: boolean;
  message: string;
  jobId: string;
}

// ========== Boss直聘连接器 ==========
class BossConnector {
  private baseUrl = 'https://www.zhipin.com';

  /**
   * 验证 Cookie 是否有效（通过获取用户信息）
   */
  async validate(cookie: string): Promise<ValidationResult> {
    try {
      const headers = buildBrowserHeaders('boss', cookie);
      const resp = await fetch(`${this.baseUrl}/wapi/zpgeek/friendlist.json?page=1`, {
        headers,
        method: 'GET',
      });

      if (!resp.ok) {
        return { valid: false, error: `HTTP ${resp.status}` };
      }

      const data = await resp.json();

      // Boss 直聘返回 code === 0 表示成功
      if (data.code === 0) {
        return { valid: true, userName: '已认证用户' };
      }

      // code === 302 通常表示需要登录
      if (data.code === 302 || data.code === 403) {
        return { valid: false, error: 'Cookie 已过期，请重新登录 Boss直聘后获取' };
      }

      return { valid: false, error: data.message || '验证失败' };
    } catch (err: any) {
      return { valid: false, error: `连接失败: ${err.message}` };
    }
  }

  /**
   * 搜索岗位
   */
  async searchJobs(cookie: string, params: JobSearchParams): Promise<JobResult[]> {
    try {
      await randomDelay();
      const headers = buildBrowserHeaders('boss', cookie);

      const query = new URLSearchParams({
        query: params.keyword,
        city: params.city || '100010000',  // 默认全国
        page: String(params.page || 1),
        pageSize: '15',
      });

      if (params.salary) {
        query.set('salary', params.salary);
      }

      const resp = await fetch(
        `${this.baseUrl}/wapi/zpgeek/search/joblist.json?${query.toString()}`,
        { headers, method: 'GET' },
      );

      if (!resp.ok) {
        throw new Error(`搜索失败: HTTP ${resp.status}`);
      }

      const data = await resp.json();

      if (data.code !== 0) {
        throw new Error(data.message || '搜索请求被拒绝');
      }

      const jobList = data.zpData?.jobList || [];

      return jobList.map((job: any) => ({
        jobId: job.jobId || job.encryptJobId,
        title: job.jobName,
        company: job.brandName,
        salary: job.salaryDesc,
        city: job.cityName,
        experience: job.jobExperience,
        education: job.jobDegree,
        tags: job.skills || [],
        bossName: job.bossName,
        bossTitle: job.bossTitle,
        companyLogo: job.brandLogo ? `https://img.bosszhipin.com${job.brandLogo}` : '',
        detailUrl: `https://www.zhipin.com/job_detail/${job.encryptJobId}.html`,
        encryptJobId: job.encryptJobId,
        encryptUserId: job.encryptUserId,
        lid: job.lid,
        securityId: job.securityId,
      }));
    } catch (err: any) {
      console.error('Boss直聘搜索失败:', err);
      throw err;
    }
  }

  /**
   * 投递（发起打招呼）
   */
  async apply(cookie: string, job: { encryptJobId: string; encryptUserId: string; lid?: string; securityId?: string; greeting?: string }): Promise<ApplyResult> {
    try {
      await randomDelay(3000, 8000); // 投递操作延迟更长
      const headers = buildBrowserHeaders('boss', cookie);
      headers['Content-Type'] = 'application/x-www-form-urlencoded';

      const body = new URLSearchParams({
        jobId: job.encryptJobId,
        uid: job.encryptUserId,
        lid: job.lid || '',
        securityId: job.securityId || '',
      });

      const resp = await fetch(
        `${this.baseUrl}/wapi/zpgeek/friend/add.json`,
        {
          headers,
          method: 'POST',
          body: body.toString(),
        },
      );

      if (!resp.ok) {
        return { success: false, message: `HTTP ${resp.status}`, jobId: job.encryptJobId };
      }

      const data = await resp.json();

      if (data.code === 0) {
        return { success: true, message: '打招呼成功，已投递', jobId: job.encryptJobId };
      }

      // 常见错误码处理
      if (data.code === 1) {
        return { success: false, message: data.message || '投递失败（可能已投递过）', jobId: job.encryptJobId };
      }

      return { success: false, message: data.message || '投递失败', jobId: job.encryptJobId };
    } catch (err: any) {
      return { success: false, message: `投递异常: ${err.message}`, jobId: job.encryptJobId };
    }
  }
}

// ========== 智联招聘连接器 ==========
class ZhilianConnector {
  private baseUrl = 'https://fe-api.zhaopin.com';

  /**
   * 验证 Cookie
   */
  async validate(cookie: string): Promise<ValidationResult> {
    try {
      const headers = buildBrowserHeaders('zhilian', cookie);
      const resp = await fetch(`${this.baseUrl}/c/i/user/info`, {
        headers,
        method: 'GET',
      });

      if (!resp.ok) {
        return { valid: false, error: `HTTP ${resp.status}` };
      }

      const data = await resp.json();

      if (data.code === 200 || data.code === 0) {
        const name = data.data?.userName || data.data?.realName || '已认证用户';
        return { valid: true, userName: name };
      }

      return { valid: false, error: data.message || 'Cookie 已过期' };
    } catch (err: any) {
      return { valid: false, error: `连接失败: ${err.message}` };
    }
  }

  /**
   * 搜索岗位
   */
  async searchJobs(cookie: string, params: JobSearchParams): Promise<JobResult[]> {
    try {
      await randomDelay();
      const headers = buildBrowserHeaders('zhilian', cookie);

      const query = new URLSearchParams({
        kw: params.keyword,
        cityId: params.city || '',
        start: String(((params.page || 1) - 1) * 20),
        pageSize: '20',
        kt: '3',
      });

      if (params.salary) {
        query.set('sl', params.salary);
      }

      const resp = await fetch(
        `${this.baseUrl}/c/i/sou?${query.toString()}`,
        { headers, method: 'GET' },
      );

      if (!resp.ok) {
        throw new Error(`搜索失败: HTTP ${resp.status}`);
      }

      const data = await resp.json();

      if (data.code !== 200 && data.code !== 0) {
        throw new Error(data.message || '搜索请求被拒绝');
      }

      const results = data.data?.results || [];

      return results.map((item: any) => ({
        jobId: item.number || item.positionId || '',
        title: item.jobName || item.name || '',
        company: item.company?.name || '',
        salary: item.salary || '',
        city: item.city?.display || '',
        experience: item.workingExp?.name || '',
        education: item.eduLevel?.name || '',
        tags: item.welfare || [],
        companyLogo: item.company?.logo || '',
        detailUrl: item.positionURL || `https://jobs.zhaopin.com/${item.number}.htm`,
      }));
    } catch (err: any) {
      console.error('智联招聘搜索失败:', err);
      throw err;
    }
  }

  /**
   * 投递简历
   */
  async apply(cookie: string, job: { jobId: string; greeting?: string }): Promise<ApplyResult> {
    try {
      await randomDelay(3000, 8000);
      const headers = buildBrowserHeaders('zhilian', cookie);
      headers['Content-Type'] = 'application/json';

      const resp = await fetch(
        `${this.baseUrl}/c/i/apply/submit`,
        {
          headers,
          method: 'POST',
          body: JSON.stringify({ jobNumber: job.jobId }),
        },
      );

      if (!resp.ok) {
        return { success: false, message: `HTTP ${resp.status}`, jobId: job.jobId };
      }

      const data = await resp.json();

      if (data.code === 200 || data.code === 0) {
        return { success: true, message: '简历投递成功', jobId: job.jobId };
      }

      return { success: false, message: data.message || '投递失败', jobId: job.jobId };
    } catch (err: any) {
      return { success: false, message: `投递异常: ${err.message}`, jobId: job.jobId };
    }
  }
}

// ========== 导出单例 ==========
export const bossConnector = new BossConnector();
export const zhilianConnector = new ZhilianConnector();

/**
 * 根据平台名获取对应连接器
 */
export function getConnector(platform: string) {
  switch (platform) {
    case 'boss':
    case 'Boss直聘':
      return bossConnector;
    case 'zhilian':
    case '智联招聘':
      return zhilianConnector;
    default:
      return null;
  }
}

// 重新导出加密工具
export { encryptCookie, decryptCookie };
