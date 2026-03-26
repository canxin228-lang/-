import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { platformApi } from '../services/api';

// ========== 真实招聘平台数据 ==========
const REAL_PLATFORMS = [
  {
    id: 'boss',
    name: 'Boss直聘',
    logo: 'https://img.bosszhipin.com/beijin/mcs/chatphoto/20200722/bac4dae1f960dcee5353316a092f681dcfcd208495d565ef66e7dff9f98764da.png',
    url: 'https://www.zhipin.com',
    color: '#00BEAB',
    description: '移动互联网招聘，直接跟老板谈',
  },
  {
    id: 'zhilian',
    name: '智联招聘',
    logo: 'https://special.zhaopin.com/2012/bj/byqzphlogo/images/logo.png',
    url: 'https://www.zhaopin.com',
    color: '#005AFF',
    description: '中国领先的职业发展平台',
  },
  {
    id: 'liepin',
    name: '猎聘',
    logo: 'https://concat-1.liepin.com/assets/images/logo.png',
    url: 'https://www.liepin.com',
    color: '#00B38A',
    description: '中高端人才招聘平台',
  },
  {
    id: 'lagou',
    name: '拉勾招聘',
    logo: 'https://www.lgstatic.com/thumbnail_120x120/i/image/M00/00/4C/CgpEMlpPr1qAJGB2AAA_FQ8F19A487.png',
    url: 'https://www.lagou.com',
    color: '#11B95C',
    description: '互联网垂直招聘平台',
  },
  {
    id: '51job',
    name: '前程无忧',
    logo: 'https://img02.51jobcdn.com/im/2013/logo/logo2013.png',
    url: 'https://www.51job.com',
    color: '#FF6600',
    description: '中国具有影响力的人力资源服务商',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn领英',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/240px-LinkedIn_logo_initials.png',
    url: 'https://www.linkedin.com',
    color: '#0077B5',
    description: '全球职场社交平台',
  },
  {
    id: 'maimai',
    name: '脉脉',
    logo: 'https://maimai.cn/favicon.ico',
    url: 'https://maimai.cn',
    color: '#2F54EB',
    description: '中国领先的职场社交平台',
  },
  {
    id: 'shixiseng',
    name: '实习僧',
    logo: 'https://www.shixiseng.com/favicon.ico',
    url: 'https://www.shixiseng.com',
    color: '#FF7043',
    description: '实习/校招求职平台',
  },
];

export function PlatformManager() {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof REAL_PLATFORMS[0] | null>(null);
  const [accountInput, setAccountInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.list();
        setPlatforms(data);
      } catch (error) {
        console.error('获取平台列表失败:', error);
      }
    };
    fetchPlatforms();
  }, [user]);

  // 连接平台
  const handleConnect = async () => {
    if (!selectedPlatform || !accountInput.trim()) {
      alert('请选择平台并填写账号');
      return;
    }
    setConnecting(true);
    try {
      await platformApi.create({
        name: selectedPlatform.name,
        account_info: {
          account: accountInput,
          logo: selectedPlatform.logo,
          url: selectedPlatform.url,
          platform_id: selectedPlatform.id,
        },
        status: 'active',
      });
      alert(`已成功连接到 ${selectedPlatform.name}！`);
      setShowAddModal(false);
      setSelectedPlatform(null);
      setAccountInput('');
      const data = await platformApi.list();
      setPlatforms(data);
    } catch (error) {
      console.error('连接平台失败:', error);
      alert('连接失败，请重试');
    } finally {
      setConnecting(false);
    }
  };

  // 断开连接
  const handleDisconnect = async (id: string, name: string) => {
    if (!confirm(`确定断开与 ${name} 的连接？`)) return;
    try {
      await platformApi.delete(id);
      const data = await platformApi.list();
      setPlatforms(data);
    } catch (error) {
      console.error('断开连接失败:', error);
      alert('操作失败');
    }
  };

  // 跳转到平台
  const openPlatform = (platform: any) => {
    const url = platform.account_info?.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 获取已连接平台名称列表
  const connectedNames = platforms.map((p) => p.name);

  return (
    <div className="space-y-10">
      <div className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-on-surface leading-tight">平台管理</h1>
          <p className="text-on-surface-variant mt-2 text-lg max-w-2xl">
            集中化管理您的职业社交与招聘平台连接。通过数字策展人系统，自动化您的简历分发与互动追踪。
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 whitespace-nowrap flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_link</span>
          连接新平台
        </button>
      </div>

      {/* ========== 已连接平台列表 ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platforms.length > 0 ? platforms.map((platform) => {
          const info = platform.account_info || {};
          const matchedPlatform = REAL_PLATFORMS.find((rp) => rp.name === platform.name);
          const logo = info.logo || matchedPlatform?.logo || '';
          const color = matchedPlatform?.color || '#005AFF';

          return (
            <div
              key={platform.id}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/10 flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-surface-container-low rounded-xl flex items-center justify-center overflow-hidden p-2">
                  {logo ? (
                    <img src={logo} alt={platform.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl" style={{ color }}>language</span>
                  )}
                </div>
                <span className="bg-primary-container/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-1">{platform.name}</h3>
                <p className="text-on-surface-variant text-sm mb-4">
                  账号: {info.account || '未设置'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#34a853] animate-pulse"></span>
                  <span className="text-sm font-medium text-[#34a853]">已连接</span>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/10 flex justify-between items-center">
                <button
                  onClick={() => openPlatform(platform)}
                  className="text-sm font-semibold text-primary hover:underline transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  前往平台
                </button>
                <button
                  onClick={() => handleDisconnect(platform.id, platform.name)}
                  className="material-symbols-outlined text-outline hover:text-red-500 transition-colors text-xl"
                >
                  link_off
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full p-12 bg-surface-container-low/30 rounded-3xl text-center border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">hub</span>
            <p className="text-on-surface-variant mb-2">暂无已连接的平台</p>
            <p className="text-sm text-outline mb-6">选择下方平台快速开始连接</p>
            <div className="flex flex-wrap justify-center gap-3">
              {REAL_PLATFORMS.slice(0, 4).map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => { setSelectedPlatform(rp); setShowAddModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/20 hover:shadow-md transition-all"
                >
                  <img src={rp.logo} alt={rp.name} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                  <span className="text-sm font-medium">{rp.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== 同步状态 ========== */}
      <div className="mt-12 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
              </span>
              <span className="text-xs font-bold text-tertiary tracking-widest uppercase">Process Engine Status</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">自动化策展同步中</h2>
            <p className="text-on-surface-variant">正在跨平台同步您的最新职场画像。此过程可确保所有连接的招聘端均显示您最具竞争力的信息。</p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex items-center gap-6 min-w-[300px]">
            <div className="flex-1">
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: platforms.length > 0 ? '100%' : '0%' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              <div className="flex justify-between mt-2 text-[11px] font-medium text-outline">
                <span>同步进度</span>
                <span>{platforms.length > 0 ? '100%' : '未开始'}</span>
              </div>
            </div>
            <button className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg text-sm font-bold hover:bg-secondary-fixed transition-colors">
              详情
            </button>
          </div>
        </div>
      </div>

      {/* ========== 添加平台弹窗 ========== */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => { setShowAddModal(false); setSelectedPlatform(null); setAccountInput(''); }}
            />
            {/* 弹窗 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-lowest rounded-3xl shadow-2xl z-50 w-full max-w-lg p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">连接招聘平台</h3>
                <button
                  onClick={() => { setShowAddModal(false); setSelectedPlatform(null); setAccountInput(''); }}
                  className="material-symbols-outlined text-outline hover:text-on-surface transition-colors"
                >close</button>
              </div>

              {/* 平台选择网格 */}
              {!selectedPlatform ? (
                <div className="space-y-4">
                  <p className="text-sm text-on-surface-variant">选择一个招聘平台进行连接：</p>
                  <div className="grid grid-cols-2 gap-3">
                    {REAL_PLATFORMS.map((rp) => {
                      const isConnected = connectedNames.includes(rp.name);
                      return (
                        <button
                          key={rp.id}
                          onClick={() => !isConnected && setSelectedPlatform(rp)}
                          disabled={isConnected}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${isConnected
                            ? 'border-outline-variant/20 bg-surface-container-low opacity-50 cursor-not-allowed'
                            : 'border-outline-variant/10 bg-surface-container-lowest hover:shadow-md hover:border-primary/30 cursor-pointer'
                          }`}
                        >
                          <img src={rp.logo} alt={rp.name} className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{rp.name}</div>
                            <div className="text-[11px] text-outline truncate">
                              {isConnected ? '已连接' : rp.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 选中的平台信息 */}
                  <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                    <img src={selectedPlatform.logo} alt={selectedPlatform.name} className="w-12 h-12 object-contain rounded-lg" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-lg">{selectedPlatform.name}</h4>
                      <a href={selectedPlatform.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        {selectedPlatform.url}
                        <span className="material-symbols-outlined text-xs">open_in_new</span>
                      </a>
                    </div>
                  </div>

                  {/* 账号输入 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-on-surface">登录账号 / 手机号</label>
                    <input
                      type="text"
                      value={accountInput}
                      onChange={(e) => setAccountInput(e.target.value)}
                      placeholder="请输入您在该平台的账号"
                      className="w-full bg-surface-container-high rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setSelectedPlatform(null); setAccountInput(''); }}
                      className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-variant transition-colors"
                    >
                      返回选择
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={connecting || !accountInput.trim()}
                      className="flex-1 px-4 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <><span className="animate-spin material-symbols-outlined text-sm">sync</span>连接中...</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">link</span>确认连接</>
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
