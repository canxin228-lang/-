import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/platforms - 获取当前用户的所有平台
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('platforms')
      .select('*')
      .eq('uid', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // 兼容处理：把数据库的列映射为前端期望的格式
    const normalized = (data || []).map((p: any) => ({
      ...p,
      // 如果有 account_info JSONB 列就用它，否则回退到旧列
      account_info: p.account_info || { account: p.account || '', logo: p.logo || '' },
    }));

    return res.json(normalized);
  } catch (err) {
    console.error('获取平台列表失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/platforms - 添加新平台
 * 兼容旧表结构（platform_id/account/logo 列）和新表结构（account_info JSONB）
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, account_info, status } = req.body;

    // 构造插入数据 — 同时写入旧列和新列，确保兼容
    const insertData: any = {
      uid: req.user!.id,
      name,
      status: status || 'active',
      // 旧列 — 防止 NOT NULL 约束报错
      platform_id: (account_info?.platform_id) || name.toLowerCase().replace(/\s+/g, '_'),
      account: account_info?.account || '',
      logo: account_info?.logo || '',
      last_sync: new Date().toLocaleString('zh-CN'),
    };

    // 尝试也写入新列（如果表已迁移会生效，未迁移则被忽略）
    insertData.account_info = account_info || {};

    const { data, error } = await supabaseAdmin
      .from('platforms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('平台插入错误详情:', error);
      // 如果失败了，可能是因为 account_info 列不存在，去掉它再试一次
      delete insertData.account_info;
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('platforms')
        .insert(insertData)
        .select()
        .single();

      if (retryError) {
        console.error('平台插入重试仍失败:', retryError);
        return res.status(500).json({ error: retryError.message });
      }
      // 补充 account_info 用于前端显示
      return res.status(201).json({
        ...retryData,
        account_info: { account: retryData.account || '', logo: retryData.logo || '' },
      });
    }

    return res.status(201).json({
      ...data,
      account_info: data.account_info || { account: data.account || '', logo: data.logo || '' },
    });
  } catch (err) {
    console.error('添加平台失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/platforms/:id - 更新平台
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, account_info, status } = req.body;

    const { data: existing } = await supabaseAdmin
      .from('platforms')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权修改此平台' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (account_info) {
      updateData.account = account_info.account || '';
      updateData.logo = account_info.logo || '';
    }

    const { data, error } = await supabaseAdmin
      .from('platforms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({
      ...data,
      account_info: data.account_info || { account: data.account || '', logo: data.logo || '' },
    });
  } catch (err) {
    console.error('更新平台失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/platforms/:id - 删除平台
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('platforms')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权删除此平台' });
    }

    const { error } = await supabaseAdmin
      .from('platforms')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('删除平台失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
