import { Router } from 'express';
import { authMiddleware, AuthRequest, supabaseAdmin } from '../middleware/auth.js';
import {
  getConnector,
  encryptCookie,
  decryptCookie,
} from '../services/platformConnector.js';
import { checkRateLimit } from '../services/antiDetect.js';

const router = Router();
router.use(authMiddleware);

// ============================================================
// 基础 CRUD（兼容已有功能）
// ============================================================

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

    // 返回时不带明文凭证
    const normalized = (data || []).map((p: any) => ({
      ...p,
      account_info: p.account_info || { account: p.account || '', logo: p.logo || '' },
      credentials: undefined, // 前端不需要看到凭证
      has_credentials: !!p.credentials && Object.keys(p.credentials).length > 0,
    }));

    return res.json(normalized);
  } catch (err) {
    console.error('获取平台列表失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/platforms - 添加新平台（兼容旧功能）
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, account_info, status } = req.body;

    const insertData: any = {
      uid: req.user!.id,
      name,
      status: status || 'active',
      platform_id: (account_info?.platform_id) || name.toLowerCase().replace(/\s+/g, '_'),
      account: account_info?.account || '',
      logo: account_info?.logo || '',
      last_sync: new Date().toLocaleString('zh-CN'),
      account_info: account_info || {},
    };

    const { data, error } = await supabaseAdmin
      .from('platforms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('平台插入错误详情:', error);
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

// ============================================================
// 新增：真实平台对接 API
// ============================================================

/**
 * POST /api/platforms/connect - 使用 Cookie 连接平台
 * Body: { platformType: 'boss' | 'zhilian', cookie: string, platformName: string }
 */
router.post('/connect', async (req: AuthRequest, res) => {
  try {
    const { platformType, cookie, platformName } = req.body;

    if (!platformType || !cookie) {
      return res.status(400).json({ error: '缺少平台类型或 Cookie' });
    }

    const connector = getConnector(platformType);
    if (!connector) {
      return res.status(400).json({ error: '不支持的平台类型' });
    }

    // 验证 Cookie 是否有效
    const result = await connector.validate(cookie);

    if (!result.valid) {
      return res.status(400).json({
        error: result.error || 'Cookie 验证失败',
        needRelogin: true,
      });
    }

    // 查找是否已有该平台记录
    const { data: existingList } = await supabaseAdmin
      .from('platforms')
      .select('*')
      .eq('uid', req.user!.id)
      .eq('platform_id', platformType);

    const encryptedCookie = encryptCookie(cookie);
    const now = new Date().toISOString();

    if (existingList && existingList.length > 0) {
      // 更新现有记录
      const { data, error } = await supabaseAdmin
        .from('platforms')
        .update({
          status: 'active',
          credentials: { cookie: encryptedCookie },
          connection_status: 'connected',
          platform_user_name: result.userName,
          last_verified_at: now,
          error_message: null,
          last_sync: now,
        })
        .eq('id', existingList[0].id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.json({
        ...data,
        credentials: undefined,
        has_credentials: true,
        platform_user_name: result.userName,
        connection_status: 'connected',
      });
    }

    // 创建新记录
    const platformMeta: Record<string, any> = {
      boss: {
        name: 'Boss直聘',
        logo: 'https://img.bosszhipin.com/beijin/mcs/chatphoto/20200722/bac4dae1f960dcee5353316a092f681dcfcd208495d565ef66e7dff9f98764da.png',
        url: 'https://www.zhipin.com',
      },
      zhilian: {
        name: '智联招聘',
        logo: 'https://special.zhaopin.com/2012/bj/byqzphlogo/images/logo.png',
        url: 'https://www.zhaopin.com',
      },
    };

    const meta = platformMeta[platformType] || { name: platformName, logo: '', url: '' };

    const { data, error } = await supabaseAdmin
      .from('platforms')
      .insert({
        uid: req.user!.id,
        name: meta.name,
        platform_id: platformType,
        status: 'active',
        account_info: {
          logo: meta.logo,
          url: meta.url,
          platform_id: platformType,
          account: result.userName || '',
        },
        account: result.userName || '',
        logo: meta.logo,
        credentials: { cookie: encryptedCookie },
        connection_status: 'connected',
        platform_user_name: result.userName,
        last_verified_at: now,
        last_sync: now,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({
      ...data,
      credentials: undefined,
      has_credentials: true,
      platform_user_name: result.userName,
      connection_status: 'connected',
    });
  } catch (err) {
    console.error('平台连接失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/platforms/:id/verify - 验证平台连接状态
 */
router.get('/:id/verify', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: platform } = await supabaseAdmin
      .from('platforms')
      .select('*')
      .eq('id', id)
      .eq('uid', req.user!.id)
      .single();

    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }

    if (!platform.credentials?.cookie) {
      return res.json({ connected: false, error: '未配置凭证' });
    }

    const connector = getConnector(platform.platform_id || platform.name);
    if (!connector) {
      return res.json({ connected: false, error: '不支持的平台' });
    }

    const cookie = decryptCookie(platform.credentials.cookie);
    const result = await connector.validate(cookie);

    // 更新状态
    await supabaseAdmin
      .from('platforms')
      .update({
        connection_status: result.valid ? 'connected' : 'expired',
        last_verified_at: new Date().toISOString(),
        error_message: result.valid ? null : result.error,
        platform_user_name: result.valid ? (result.userName || platform.platform_user_name) : platform.platform_user_name,
      })
      .eq('id', id);

    return res.json({
      connected: result.valid,
      userName: result.userName,
      error: result.error,
    });
  } catch (err) {
    console.error('验证平台状态失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/platforms/:id/search-jobs - 搜索岗位
 */
router.post('/:id/search-jobs', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { keyword, city, salary, page } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    // 频率限制
    const rateCheck = checkRateLimit(req.user!.id, id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: '操作太频繁，请稍后再试',
        retryAfterMs: rateCheck.retryAfterMs,
      });
    }

    const { data: platform } = await supabaseAdmin
      .from('platforms')
      .select('*')
      .eq('id', id)
      .eq('uid', req.user!.id)
      .single();

    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }

    if (!platform.credentials?.cookie) {
      return res.status(400).json({ error: '平台未连接，请先配置 Cookie', needRelogin: true });
    }

    const connector = getConnector(platform.platform_id || platform.name);
    if (!connector) {
      return res.status(400).json({ error: '不支持的平台' });
    }

    const cookie = decryptCookie(platform.credentials.cookie);
    const jobs = await connector.searchJobs(cookie, { keyword, city, salary, page });

    return res.json({ jobs, total: jobs.length });
  } catch (err: any) {
    console.error('搜索岗位失败:', err);

    // 检测是否是 Cookie 过期
    if (err.message?.includes('302') || err.message?.includes('登录')) {
      return res.status(401).json({ error: 'Cookie 已过期，请重新获取', needRelogin: true });
    }

    return res.status(500).json({ error: err.message || '搜索失败' });
  }
});

/**
 * POST /api/platforms/:id/apply - 投递简历
 */
router.post('/:id/apply', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { jobId, jobTitle, company, encryptJobId, encryptUserId, lid, securityId, greeting } = req.body;

    if (!jobId && !encryptJobId) {
      return res.status(400).json({ error: '缺少岗位信息' });
    }

    // 频率限制
    const rateCheck = checkRateLimit(req.user!.id, id);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: '投递太频繁，请稍后再试',
        retryAfterMs: rateCheck.retryAfterMs,
      });
    }

    const { data: platform } = await supabaseAdmin
      .from('platforms')
      .select('*')
      .eq('id', id)
      .eq('uid', req.user!.id)
      .single();

    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }

    if (!platform.credentials?.cookie) {
      return res.status(400).json({ error: '平台未连接', needRelogin: true });
    }

    const connector = getConnector(platform.platform_id || platform.name);
    if (!connector) {
      return res.status(400).json({ error: '不支持的平台' });
    }

    const cookie = decryptCookie(platform.credentials.cookie);
    const result = await connector.apply(cookie, {
      encryptJobId: encryptJobId || jobId,
      encryptUserId: encryptUserId || '',
      lid,
      securityId,
      greeting,
      jobId: jobId || encryptJobId,
    } as any);

    // 记录投递日志
    if (result.success) {
      await supabaseAdmin.from('logs').insert({
        uid: req.user!.id,
        position: jobTitle || '未知岗位',
        company: company || '未知公司',
        platform: platform.name,
        time: new Date().toLocaleString('zh-CN'),
        status: 'success',
        details: result.message,
      });
    }

    return res.json(result);
  } catch (err: any) {
    console.error('投递失败:', err);
    return res.status(500).json({ error: err.message || '投递失败' });
  }
});

/**
 * GET /api/platforms/:id/status - 获取平台实时状态
 */
router.get('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data: platform } = await supabaseAdmin
      .from('platforms')
      .select('connection_status, platform_user_name, last_verified_at, error_message')
      .eq('id', id)
      .eq('uid', req.user!.id)
      .single();

    if (!platform) {
      return res.status(404).json({ error: '平台不存在' });
    }

    return res.json(platform);
  } catch (err) {
    console.error('获取平台状态失败:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;
