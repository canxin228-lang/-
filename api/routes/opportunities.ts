import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/opportunities - 获取职位机会列表
 * 支持查询参数: limit (默认10), search
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limitNum = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    let query = supabaseAdmin
      .from('opportunities')
      .select('*')
      .order('match_rate', { ascending: false })
      .limit(limitNum);

    if (search) {
      query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('获取职位机会失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
