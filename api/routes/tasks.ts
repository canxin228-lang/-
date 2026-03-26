import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/tasks - 获取当前用户的自动化任务
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limitNum = parseInt(req.query.limit as string) || 10;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('uid', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('获取任务列表失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/tasks - 创建任务
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, platforms, status, progress, applied_count, total_count } = req.body;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        uid: req.user!.id,
        title,
        platforms: platforms || [],
        status: status || 'running',
        progress: progress || 0,
        applied_count: applied_count || 0,
        total_count: total_count || 0,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('创建任务失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/tasks/:id - 更新任务
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, platforms, status, progress, applied_count, total_count } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('tasks')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权修改此任务' });
    }

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ title, platforms, status, progress, applied_count, total_count })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('更新任务失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/tasks/:id - 删除任务
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('tasks')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权删除此任务' });
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('删除任务失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
