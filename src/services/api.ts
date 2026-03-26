import { supabase } from '../lib/supabase';

// API 基础URL，开发环境通过 Vite 代理，不需要完整地址
const API_BASE = '/api';

/**
 * 统一的 API 请求封装
 * 自动附加 Supabase session token 到请求头
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================
// 用户 API
// ============================================================
export const userApi = {
  /** 获取当前用户信息 */
  getMe: () => request<any>('/users/me'),

  /** 更新当前用户信息 */
  updateMe: (data: any) => request<any>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// ============================================================
// 简历 API
// ============================================================
export const resumeApi = {
  /** 获取所有简历 */
  list: () => request<any[]>('/resumes'),

  /** 创建简历 */
  create: (data: any) => request<any>('/resumes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** 更新简历 */
  update: (id: string, data: any) => request<any>(`/resumes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** 删除简历 */
  delete: (id: string) => request<any>(`/resumes/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// 平台 API
// ============================================================
export const platformApi = {
  /** 获取所有平台 */
  list: () => request<any[]>('/platforms'),

  /** 添加平台 */
  create: (data: any) => request<any>('/platforms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** 更新平台 */
  update: (id: string, data: any) => request<any>(`/platforms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** 删除平台 */
  delete: (id: string) => request<any>(`/platforms/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// 投递日志 API
// ============================================================
export const logApi = {
  /** 获取日志列表（带分页和筛选） */
  list: (params?: { limit?: number; offset?: number; status?: string; platform?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.status) query.set('status', params.status);
    if (params?.platform) query.set('platform', params.platform);
    const qs = query.toString();
    return request<{ data: any[]; total: number }>(`/logs${qs ? `?${qs}` : ''}`);
  },

  /** 创建日志 */
  create: (data: any) => request<any>('/logs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** 获取统计数据 */
  getStats: () => request<{ appliedCount: number; successCount: number }>('/logs/stats'),
};

// ============================================================
// 职位机会 API
// ============================================================
export const opportunityApi = {
  /** 获取职位机会列表 */
  list: (params?: { limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<any[]>(`/opportunities${qs ? `?${qs}` : ''}`);
  },
};

// ============================================================
// 面试 API
// ============================================================
export const interviewApi = {
  /** 获取面试列表 */
  list: (limit?: number) => request<any[]>(`/interviews${limit ? `?limit=${limit}` : ''}`),

  /** 创建面试 */
  create: (data: any) => request<any>('/interviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** 更新面试 */
  update: (id: string, data: any) => request<any>(`/interviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** 删除面试 */
  delete: (id: string) => request<any>(`/interviews/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// 自动化任务 API
// ============================================================
export const taskApi = {
  /** 获取任务列表 */
  list: (limit?: number) => request<any[]>(`/tasks${limit ? `?limit=${limit}` : ''}`),

  /** 创建任务 */
  create: (data: any) => request<any>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** 更新任务 */
  update: (id: string, data: any) => request<any>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** 删除任务 */
  delete: (id: string) => request<any>(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};
