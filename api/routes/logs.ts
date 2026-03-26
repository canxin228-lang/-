import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/logs - 获取当前用户的投递日志
 * 支持查询参数: limit (默认20), offset, status, platform
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limitNum = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;
    const platform = req.query.platform as string;

    let query = supabaseAdmin
      .from('logs')
      .select('*', { count: 'exact' })
      .eq('uid', req.user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq('status', status);
    if (platform) query = query.eq('platform', platform);

    const { data, error, count } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data, total: count });
  } catch (err) {
    console.error('获取投递日志失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/logs - 创建投递日志
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { position, company, location, platform, time, status, details } = req.body;

    const { data, error } = await supabaseAdmin
      .from('logs')
      .insert({
        uid: req.user!.id,
        position,
        company,
        location: location || '',
        platform: platform || '',
        time: time || '',
        status: status || 'success',
        details: details || '',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('创建投递日志失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/logs/stats - 获取日志统计数据
 */
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { count: totalCount } = await supabaseAdmin
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('uid', req.user!.id);

    const { count: successCount } = await supabaseAdmin
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('uid', req.user!.id)
      .eq('status', 'success');

    return res.json({
      appliedCount: totalCount || 0,
      successCount: successCount || 0,
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
