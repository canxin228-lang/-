import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { platformApi } from '../services/api';

// ========== 支持的招聘平台 ==========
const SUPPORTED_PLATFORMS = [
  {
    type: 'boss',
    name: 'Boss直聘',
    logo: 'https://img.bosszhipin.com/beijin/mcs/chatphoto/20200722/bac4dae1f960dcee5353316a092f681dcfcd208495d565ef66e7dff9f98764da.png',
    url: 'https://www.zhipin.com',
    color: '#00BEAB',
    description: '移动互联网招聘，直接跟老板谈',
    cookieGuide: [
      '1. 打开浏览器访问 zhipin.com 并登录你的账号',
      '2. 按 F12 打开开发者工具',
      '3. 切换到「Application / 应用」选项卡',
      '4. 左侧展开「Cookies」→ 点击「https://www.zhipin.com」',
      '5. 在右侧找到所有 Cookie，按 Ctrl+A 全选后复制',
      '或者：在「Network / 网络」选项卡中，随便点击一个请求，从请求头中复制完整的 Cookie 值',
    ],
  },
  {
    type: 'zhilian',
    name: '智联招聘',
    logo: 'https://special.zhaopin.com/2012/bj/byqzphlogo/images/logo.png',
    url: 'https://www.zhaopin.com',
    color: '#005AFF',
    description: '中国领先的职业发展平台',
    cookieGuide: [
      '1. 打开浏览器访问 zhaopin.com 并登录你的账号',
      '2. 按 F12 打开开发者工具',
      '3. 切换到「Network / 网络」选项卡',
      '4. 刷新页面，随便点击一个请求',
      '5. 在请求头(Request Headers)中找到「Cookie」字段',
      '6. 复制该字段的完整值',
    ],
  },
];

// ========== 城市选项 ==========
const CITY_OPTIONS = [
  { label: '全国', value: '100010000' },
  { label: '北京', value: '101010100' },
  { label: '上海', value: '101020100' },
  { label: '广州', value: '101280100' },
  { label: '深圳', value: '101280600' },
  { label: '杭州', value: '101210100' },
  { label: '成都', value: '101270100' },
  { label: '南京', value: '101190100' },
  { label: '武汉', value: '101200100' },
  { label: '西安', value: '101110100' },
  { label: '重庆', value: '101040100' },
];

// ========== 组件 ==========
export function PlatformManager() {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatformType, setSelectedPlatformType] = useState<typeof SUPPORTED_PLATFORMS[0] | null>(null);
  const [cookieInput, setCookieInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  // 岗位搜索状态
  const [activeSearchPlatform, setActiveSearchPlatform] = useState<any | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchCity, setSearchCity] = useState('100010000');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 投递状态
  const [applyingJobIds, setApplyingJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyMessages, setApplyMessages] = useState<Record<string, string>>({});

  // 验证状态
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());

  // 加载平台列表
  const fetchPlatforms = useCallback(async () => {
    if (!user) return;
    try {
      const data = await platformApi.list();
      setPlatforms(data);
    } catch (error) {
      console.error('获取平台列表失败:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  // ========== Cookie 连接 ==========
  const handleCookieConnect = async () => {
    if (!selectedPlatformType || !cookieInput.trim()) return;
    setConnecting(true);
    setConnectError('');
    try {
      await platformApi.connect({
        platformType: selectedPlatformType.type,
        cookie: cookieInput.trim(),
        platformName: selectedPlatformType.name,
      });

      setShowConnectModal(false);
      setSelectedPlatformType(null);
      setCookieInput('');
      await fetchPlatforms();
    } catch (error: any) {
      setConnectError(error.message || '连接失败，请检查 Cookie 是否正确');
    } finally {
      setConnecting(false);
    }
  };

  // ========== 验证连接 ==========
  const handleVerify = async (platform: any) => {
    setVerifyingIds((prev) => new Set(prev).add(platform.id));
    try {
      const result = await platformApi.verify(platform.id);
      if (!result.connected) {
        alert(`⚠️ ${platform.name} 连接已失效：${result.error}\n请重新获取 Cookie`);
      }
      await fetchPlatforms();
    } catch (err) {
      console.error('验证失败:', err);
    } finally {
      setVerifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(platform.id);
        return next;
      });
    }
  };

  // ========== 断开连接 ==========
  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`确定断开与 ${name} 的连接？`)) return;
    try {
      await platformApi.delete(id);
      await fetchPlatforms();
    } catch (error) {
      console.error('断开连接失败:', error);
    }
  };

  // ========== 搜索岗位 ==========
  const handleSearchJobs = async () => {
    if (!activeSearchPlatform || !searchKeyword.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const result = await platformApi.searchJobs(activeSearchPlatform.id, {
        keyword: searchKeyword,
        city: searchCity,
      });
      setSearchResults(result.jobs || []);
      if (!result.jobs?.length) {
        setSearchError('未找到匹配的岗位');
      }
    } catch (err: any) {
      setSearchError(err.message || '搜索失败');
      if (err.message?.includes('Cookie') || err.message?.includes('过期')) {
        setSearchError('Cookie 已过期，请重新连接平台');
      }
    } finally {
      setSearching(false);
    }
  };

  // ========== 投递 ==========
  const handleApply = async (job: any) => {
    if (!activeSearchPlatform) return;
    const jobKey = job.jobId || job.encryptJobId;
    setApplyingJobIds((prev) => new Set(prev).add(jobKey));
    try {
      const result = await platformApi.apply(activeSearchPlatform.id, {
        jobId: job.jobId,
        jobTitle: job.title,
        company: job.company,
        encryptJobId: job.encryptJobId,
        encryptUserId: job.encryptUserId,
        lid: job.lid,
        securityId: job.securityId,
      });
      if (result.success) {
        setAppliedJobIds((prev) => new Set(prev).add(jobKey));
        setApplyMessages((prev) => ({ ...prev, [jobKey]: '✅ ' + result.message }));
      } else {
        setApplyMessages((prev) => ({ ...prev, [jobKey]: '❌ ' + result.message }));
      }
    } catch (err: any) {
      setApplyMessages((prev) => ({ ...prev, [jobKey]: '❌ ' + (err.message || '投递失败') }));
    } finally {
      setApplyingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobKey);
        return next;
      });
    }
  };

  // 获取已连接的平台类型列表
  const connectedTypes = platforms.map((p) => p.platform_id || p.name);

  // 判断连接状态
  const getStatusInfo = (platform: any) => {
    const status = platform.connection_status;
    if (status === 'connected' && platform.has_credentials) {
      return { label: '已连接', color: '#34a853', icon: 'check_circle' };
    }
    if (status === 'expired') {
      return { label: 'Cookie已过期', color: '#ea4335', icon: 'warning' };
    }
    if (platform.has_credentials) {
      return { label: '待验证', color: '#fbbc04', icon: 'help' };
    }
    return { label: '仅记录', color: '#9aa0a6', icon: 'link_off' };
  };

  return (
    <div className="space-y-10">
      {/* ========== 页面标题 ========== */}
      <div className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-on-surface leading-tight">平台管理</h1>
          <p className="text-on-surface-variant mt-2 text-lg max-w-2xl">
            真正连接招聘平台，实现岗位搜索与自动投递。通过 Cookie 认证安全对接 Boss直聘、智联招聘等主流平台。
          </p>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_link</span>
          连接新平台
        </button>
      </div>

      {/* ========== 已连接平台卡片 ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.length > 0 ? platforms.map((platform) => {
          const info = platform.account_info || {};
          const matched = SUPPORTED_PLATFORMS.find((sp) => sp.type === (platform.platform_id || ''));
          const logo = info.logo || matched?.logo || '';
          const color = matched?.color || '#005AFF';
          const statusInfo = getStatusInfo(platform);
          const isVerifying = verifyingIds.has(platform.id);

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
            >
              {/* 头部 */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden p-2">
                  {logo ? (
                    <img src={logo} alt={platform.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl" style={{ color }}>language</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: statusInfo.color + '15', color: statusInfo.color }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{statusInfo.icon}</span>
                  {statusInfo.label}
                </div>
              </div>

              {/* 信息 */}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-1">{platform.name}</h3>
                {platform.platform_user_name && (
                  <p className="text-on-surface-variant text-sm mb-1">
                    平台用户：{platform.platform_user_name}
                  </p>
                )}
                <p className="text-outline text-xs">
                  {platform.last_verified_at
                    ? `上次验证：${new Date(platform.last_verified_at).toLocaleString('zh-CN')}`
                    : `创建于：${new Date(platform.created_at).toLocaleString('zh-CN')}`}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="pt-4 border-t border-outline-variant/10 flex flex-wrap gap-2">
                {platform.has_credentials && (
                  <>
                    <button
                      onClick={() => {
                        setActiveSearchPlatform(platform);
                        setSearchResults([]);
                        setSearchError('');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>search</span>
                      搜索岗位
                    </button>
                    <button
                      onClick={() => handleVerify(platform)}
                      disabled={isVerifying}
                      className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold hover:bg-surface-variant transition-colors disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined ${isVerifying ? 'animate-spin' : ''}`} style={{ fontSize: '14px' }}>
                        {isVerifying ? 'sync' : 'verified'}
                      </span>
                      {isVerifying ? '验证中...' : '验证连接'}
                    </button>
                  </>
                )}

                {!platform.has_credentials && (
                  <button
                    onClick={() => {
                      const sp = SUPPORTED_PLATFORMS.find((s) => s.name === platform.name);
                      if (sp) {
                        setSelectedPlatformType(sp);
                        setShowConnectModal(true);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-tertiary/10 text-tertiary rounded-lg text-xs font-semibold hover:bg-tertiary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>key</span>
                    配置Cookie
                  </button>
                )}

                <button
                  onClick={() => handleDisconnect(platform.id, platform.name)}
                  className="flex items-center gap-1 px-3 py-1.5 text-outline hover:text-red-500 rounded-lg text-xs font-semibold transition-colors ml-auto"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                </button>
              </div>
            </motion.div>
          );
        }) : (
          <div className="col-span-full p-12 bg-surface-container-low/30 rounded-3xl text-center border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">hub</span>
            <p className="text-on-surface-variant mb-2">暂无已连接的平台</p>
            <p className="text-sm text-outline mb-6">选择下方按钮连接招聘平台，开始自动投递</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary-container transition-all"
            >
              连接第一个平台
            </button>
          </div>
        )}
      </div>

      {/* ========== 岗位搜索面板 ========== */}
      <AnimatePresence>
        {activeSearchPlatform && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/10 overflow-hidden"
          >
            {/* 搜索头部 */}
            <div className="bg-surface-container-low p-6 border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">work_outline</span>
                  <h2 className="text-xl font-bold">
                    岗位搜索 — {activeSearchPlatform.name}
                  </h2>
                </div>
                <button
                  onClick={() => { setActiveSearchPlatform(null); setSearchResults([]); }}
                  className="material-symbols-outlined text-outline hover:text-on-surface transition-colors"
                >close</button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchJobs()}
                  placeholder="输入职位关键词，如：前端开发、产品经理..."
                  className="flex-1 bg-surface-container-highest rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="bg-surface-container-highest rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[100px]"
                >
                  {CITY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearchJobs}
                  disabled={searching || !searchKeyword.trim()}
                  className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {searching ? (
                    <><span className="animate-spin material-symbols-outlined text-sm">sync</span>搜索中...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">search</span>搜索岗位</>
                  )}
                </button>
              </div>

              {searchError && (
                <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {searchError}
                </p>
              )}
            </div>

            {/* 搜索结果列表 */}
            {searchResults.length > 0 && (
              <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
                {searchResults.map((job, idx) => {
                  const jobKey = job.jobId || job.encryptJobId || idx;
                  const isApplying = applyingJobIds.has(jobKey);
                  const isApplied = appliedJobIds.has(jobKey);
                  const message = applyMessages[jobKey];

                  return (
                    <motion.div
                      key={jobKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-5 hover:bg-surface-container-low/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-bold text-base text-on-surface truncate">{job.title}</h4>
                            <span className="text-sm font-semibold text-primary whitespace-nowrap">{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {job.companyLogo && (
                              <img src={job.companyLogo} alt="" className="w-5 h-5 rounded object-contain" referrerPolicy="no-referrer" />
                            )}
                            <span className="text-sm text-on-surface-variant font-medium">{job.company}</span>
                            <span className="text-xs text-outline">•</span>
                            <span className="text-xs text-outline">{job.city}</span>
                            <span className="text-xs text-outline">•</span>
                            <span className="text-xs text-outline">{job.experience}</span>
                            <span className="text-xs text-outline">•</span>
                            <span className="text-xs text-outline">{job.education}</span>
                          </div>
                          {job.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.tags.slice(0, 5).map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 bg-surface-container-high rounded text-[11px] text-on-surface-variant">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {job.bossName && (
                            <p className="text-xs text-outline mt-1.5">
                              👤 {job.bossName} · {job.bossTitle}
                            </p>
                          )}
                          {message && (
                            <p className="text-xs mt-1.5 font-medium" style={{ color: message.startsWith('✅') ? '#34a853' : '#ea4335' }}>
                              {message}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 items-end shrink-0">
                          <button
                            onClick={() => handleApply(job)}
                            disabled={isApplying || isApplied}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isApplied
                                ? 'bg-green-100 text-green-700 cursor-default'
                                : 'bg-primary text-on-primary hover:bg-primary-container shadow-sm active:scale-95 disabled:opacity-50'
                            }`}
                          >
                            {isApplying ? (
                              <><span className="animate-spin material-symbols-outlined" style={{ fontSize: '14px' }}>sync</span>投递中</>
                            ) : isApplied ? (
                              <><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span>已投递</>
                            ) : (
                              <><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>send</span>投递</>
                            )}
                          </button>
                          <a
                            href={job.detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            详情 <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>open_in_new</span>
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== 使用提示 ========== */}
      <div className="mt-8 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
          </span>
          <span className="text-xs font-bold text-tertiary tracking-widest uppercase">Platform Engine</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">真实平台对接引擎</h2>
        <p className="text-on-surface-variant mb-4">
          通过 Cookie 认证直接调用招聘平台内部 API，实现真正的岗位搜索与简历投递。所有操作通过反检测引擎保护，降低被平台拦截的风险。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-surface-container-lowest p-4 rounded-xl">
            <span className="material-symbols-outlined text-primary mb-2 block">vpn_key</span>
            <p className="font-bold mb-1">Cookie 认证</p>
            <p className="text-outline text-xs">使用浏览器 Cookie 安全对接，无需提供账号密码</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl">
            <span className="material-symbols-outlined text-primary mb-2 block">shield</span>
            <p className="font-bold mb-1">反检测保护</p>
            <p className="text-outline text-xs">随机延迟、UA轮换、频率限制，降低被封风险</p>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl">
            <span className="material-symbols-outlined text-primary mb-2 block">description</span>
            <p className="font-bold mb-1">自动记录</p>
            <p className="text-outline text-xs">每次投递自动写入日志，跟踪投递进度</p>
          </div>
        </div>
      </div>

      {/* ========== 连接平台弹窗 ========== */}
      <AnimatePresence>
        {showConnectModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => { setShowConnectModal(false); setSelectedPlatformType(null); setCookieInput(''); setConnectError(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest rounded-3xl shadow-2xl z-50 w-full max-w-lg max-h-[85vh] overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  {selectedPlatformType ? `连接 ${selectedPlatformType.name}` : '选择招聘平台'}
                </h3>
                <button
                  onClick={() => { setShowConnectModal(false); setSelectedPlatformType(null); setCookieInput(''); setConnectError(''); }}
                  className="material-symbols-outlined text-outline hover:text-on-surface transition-colors"
                >close</button>
              </div>

              {!selectedPlatformType ? (
                /* ===== 平台选择 ===== */
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">选择要连接的招聘平台：</p>
                  <div className="grid grid-cols-1 gap-3">
                    {SUPPORTED_PLATFORMS.map((sp) => {
                      const isConnected = connectedTypes.includes(sp.type);
                      return (
                        <button
                          key={sp.type}
                          onClick={() => !isConnected && setSelectedPlatformType(sp)}
                          disabled={isConnected}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                            isConnected
                              ? 'border-outline-variant/20 bg-surface-container-low opacity-50 cursor-not-allowed'
                              : 'border-outline-variant/10 bg-surface-container-lowest hover:shadow-md hover:border-primary/30 cursor-pointer'
                          }`}
                        >
                          <img src={sp.logo} alt={sp.name} className="w-12 h-12 object-contain rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <div className="font-bold">{sp.name}</div>
                            <div className="text-xs text-outline">
                              {isConnected ? '✅ 已连接' : sp.description}
                            </div>
                          </div>
                          {!isConnected && (
                            <span className="material-symbols-outlined text-outline">arrow_forward</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ===== Cookie 输入与教程 ===== */
                <div className="space-y-5">
                  {/* 平台信息 */}
                  <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                    <img src={selectedPlatformType.logo} alt={selectedPlatformType.name} className="w-12 h-12 object-contain rounded-lg" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-lg">{selectedPlatformType.name}</h4>
                      <a href={selectedPlatformType.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        {selectedPlatformType.url} ↗
                      </a>
                    </div>
                  </div>

                  {/* Cookie 获取教程 */}
                  <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '18px' }}>help</span>
                      <span className="font-bold text-sm text-amber-800">如何获取 Cookie？</span>
                    </div>
                    <ol className="text-xs text-amber-900/80 space-y-1.5 ml-1">
                      {selectedPlatformType.cookieGuide.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Cookie 输入 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">vpn_key</span>
                      粘贴 Cookie
                    </label>
                    <textarea
                      value={cookieInput}
                      onChange={(e) => { setCookieInput(e.target.value); setConnectError(''); }}
                      placeholder="在此粘贴从浏览器复制的完整 Cookie 值..."
                      rows={4}
                      className="w-full bg-surface-container-high rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      autoFocus
                    />
                    <p className="text-[11px] text-outline">
                      🔒 Cookie 将加密存储，仅用于调用平台 API，不会被泄露
                    </p>
                  </div>

                  {/* 错误提示 */}
                  {connectError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-500" style={{ fontSize: '16px' }}>error</span>
                      {connectError}
                    </div>
                  )}

                  {/* 按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setSelectedPlatformType(null); setCookieInput(''); setConnectError(''); }}
                      className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-variant transition-colors"
                    >
                      返回选择
                    </button>
                    <button
                      onClick={handleCookieConnect}
                      disabled={connecting || !cookieInput.trim()}
                      className="flex-1 px-4 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <><span className="animate-spin material-symbols-outlined text-sm">sync</span>验证连接中...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">link</span>验证并连接</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
