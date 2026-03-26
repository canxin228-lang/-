import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// 使用 service_role key 创建管理员级 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 扩展 Express Request 类型，添加 user 字段
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * JWT 认证中间件
 * 从请求头提取 Supabase JWT token 并验证
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: '无效的认证令牌' });
    }

    // 将用户信息注入 request 对象
    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ error: '认证服务异常' });
  }
}
