import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth.js';

const router = Router();

// 所有路由需要认证
router.use(authMiddleware);

/**
 * GET /api/users/me - 获取当前用户信息
 */
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // 用户不存在，自动创建
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: req.user!.id,
          email: req.user!.email || '',
          display_name: '',
          expected_position: '',
          expected_locations: [],
          salary_min: 0,
          salary_max: 0,
          blocked_keywords: '',
          auto_apply: false,
          ai_refinement: false,
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: createError.message });
      }
      return res.json(newUser);
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/users/me - 更新当前用户信息
 */
router.put('/me', async (req: AuthRequest, res) => {
  try {
    const { display_name, expected_position, expected_locations, salary_min, salary_max, blocked_keywords, auto_apply, ai_refinement } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: req.user!.id,
        email: req.user!.email || '',
        display_name,
        expected_position,
        expected_locations,
        salary_min,
        salary_max,
        blocked_keywords,
        auto_apply,
        ai_refinement,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error('更新用户信息失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
