import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/interviews - 获取当前用户的面试列表
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limitNum = parseInt(req.query.limit as string) || 10;

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('uid', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(limitNum);

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('获取面试列表失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/interviews - 创建面试
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { company, position, date, time, type } = req.body;

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .insert({
        uid: req.user!.id,
        company,
        position,
        date: date || '',
        time: time || '',
        type: type || 'video',
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('创建面试失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/interviews/:id - 更新面试
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { company, position, date, time, type } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('interviews')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权修改此面试' });
    }

    const { data, error } = await supabaseAdmin
      .from('interviews')
      .update({ company, position, date, time, type })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('更新面试失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/interviews/:id - 删除面试
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('interviews')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权删除此面试' });
    }

    const { error } = await supabaseAdmin
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('删除面试失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
