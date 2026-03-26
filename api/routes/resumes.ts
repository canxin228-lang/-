import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/resumes - 获取当前用户的所有简历
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('resumes')
      .select('*')
      .eq('uid', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('获取简历列表失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/resumes - 创建新简历
 * 兼容旧表（无 file_type/file_name/file_size 列）和新表
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, description, content, is_default, file_type, file_name, file_size } = req.body;

    // 基础字段（旧表一定有这些列）
    const insertData: any = {
      uid: req.user!.id,
      title,
      description: description || '',
      content: content || '',
      is_default: is_default || false,
    };

    // 新字段（如果表已迁移才会生效）
    if (file_type) insertData.file_type = file_type;
    if (file_name) insertData.file_name = file_name;
    if (file_size) insertData.file_size = file_size;

    const { data, error } = await supabaseAdmin
      .from('resumes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('简历插入错误:', error);
      // 如果因为新列不存在而失败，去掉新列重试
      delete insertData.file_type;
      delete insertData.file_name;
      delete insertData.file_size;
      const { data: retryData, error: retryError } = await supabaseAdmin
        .from('resumes')
        .insert(insertData)
        .select()
        .single();

      if (retryError) {
        console.error('简历插入重试仍失败:', retryError);
        return res.status(500).json({ error: retryError.message });
      }
      return res.status(201).json(retryData);
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('创建简历失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/resumes/:id - 更新简历
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, is_default } = req.body;

    // 先验证所有权
    const { data: existing } = await supabaseAdmin
      .from('resumes')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权修改此简历' });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (is_default !== undefined) updateData.is_default = is_default;

    const { data, error } = await supabaseAdmin
      .from('resumes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('更新简历失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/resumes/:id - 删除简历
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('resumes')
      .select('uid')
      .eq('id', id)
      .single();

    if (!existing || existing.uid !== req.user!.id) {
      return res.status(403).json({ error: '无权删除此简历' });
    }

    const { error } = await supabaseAdmin
      .from('resumes')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('删除简历失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
