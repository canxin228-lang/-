import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { platformApi } from '../services/api';

// ========== 城市选项 ==========
const CITY_OPTIONS = [
  { label: '全国', value: '100010000' },
  { label: '北京', value: '101010100' },
  { label: '上海', value: '101020100' },
  { label: '广州', value: '101280100' },
  { label: '深圳', value: '101280600' },
  { label: '杭州', value: '101210100' },
  { label: '成都', value: '101270100' },
];

export function Opportunities() {
  const { user } = useAuth();
  
  // 平台状态
  const [activePlatforms, setActivePlatforms] = useState<any[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>('');
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('100010000');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // 投递状态
  const [applyingJobIds, setApplyingJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyMessages, setApplyMessages] = useState<Record<string, string>>({});

  // 1. 获取已连接的有效平台
  useEffect(() => {
    if (!user) return;
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.list();
        const validPlatforms = data.filter((p: any) => p.has_credentials && p.connection_status === 'connected');
        setActivePlatforms(validPlatforms);
        if (validPlatforms.length > 0) {
          setSelectedPlatformId(validPlatforms[0].id);
        }
      } catch (err) {
        console.error('获取平台列表失败', err);
      }
    };
    fetchPlatforms();
  }, [user]);

  // 2. 搜索岗位
  const handleSearch = async () => {
    if (!selectedPlatformId || !searchQuery.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    setJobs([]);
    
    try {
      const savedCompanySize = localStorage.getItem(`company_size_${user!.id}`);
      const result = await platformApi.searchJobs(selectedPlatformId, {
        keyword: searchQuery,
        city: searchCity,
        companySize: savedCompanySize && savedCompanySize !== '不限' ? savedCompanySize : undefined,
      });
      setJobs(result.jobs || []);
      if (result.jobs?.length === 0) {
        setErrorMsg('未找到匹配的岗位，请尝试更换关键词');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '搜索失败，请检查平台连接状态');
    } finally {
      setLoading(false);
    }
  };

  // 3. 投递
  const handleApply = async (job: any) => {
    if (!selectedPlatformId) return;
    const jobKey = job.jobId || job.encryptJobId;
    
    setApplyingJobIds(prev => new Set(prev).add(jobKey));
    try {
      const result = await platformApi.apply(selectedPlatformId, {
        jobId: job.jobId,
        jobTitle: job.title,
        company: job.company,
        encryptJobId: job.encryptJobId,
        encryptUserId: job.encryptUserId,
        lid: job.lid,
        securityId: job.securityId,
      });
      
      if (result.success) {
        setAppliedJobIds(prev => new Set(prev).add(jobKey));
        setApplyMessages(prev => ({ ...prev, [jobKey]: '✅ ' + result.message }));
      } else {
        setApplyMessages(prev => ({ ...prev, [jobKey]: '❌ ' + result.message }));
      }
    } catch (err: any) {
      setApplyMessages(prev => ({ ...prev, [jobKey]: '❌ 投递失败' }));
    } finally {
      setApplyingJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobKey);
        return next;
      });
    }
  };

  return (
    <div className="space-y-10">
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">Real-time Discovery</span>
            <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
              全网真实<span className="text-primary">职位搜索</span>
            </h2>
            <p className="text-on-surface-variant mt-3 text-lg">
              直接搜索已连接平台上的最新真实岗位，并实时一键投递。
            </p>
          </div>
        </div>

        {activePlatforms.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">link_off</span>
            <h3 className="text-xl font-bold mb-2">尚未连接真实平台</h3>
            <p className="text-on-surface-variant mb-6">请先前往“平台管理”配置 Boss直聘 或 智联招聘 的 Cookie。</p>
            <button
              onClick={() => window.location.hash = '#/platforms'}
              className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary-container transition-all"
            >
              前往连接平台
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl shadow-sm border border-outline-variant/10">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* 平台选择 */}
              <div className="flex-1 max-w-[200px]">
                <label className="text-xs font-bold text-outline uppercase mb-2 block">招募平台</label>
                <select
                  value={selectedPlatformId}
                  onChange={(e) => setSelectedPlatformId(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {activePlatforms.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (已连接)</option>
                  ))}
                </select>
              </div>
              
              {/* 城市选择 */}
              <div className="flex-1 max-w-[150px]">
                <label className="text-xs font-bold text-outline uppercase mb-2 block">搜索城市</label>
                <select
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  {CITY_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* 关键词输入 */}
              <div className="flex-[3] relative flex items-end">
                <div className="w-full relative">
                  <label className="text-xs font-bold text-outline uppercase mb-2 block">职位关键词</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="如：前端工程师、产品经理..."
                    className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              
              {/* 搜索按钮 */}
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="h-[44px] px-8 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:shadow-lg hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <><span className="animate-spin material-symbols-outlined text-sm">sync</span>搜索中</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">search</span>开始搜索</>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg">
                <span className="material-symbols-outlined text-base">error</span>
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 结果列表 */}
      <section>
        {jobs.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              搜索结果 <span className="text-outline text-sm font-normal">({jobs.length}个)</span>
            </h3>
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence>
            {jobs.map((job, idx) => {
              const jobKey = job.jobId || job.encryptJobId || idx;
              const isApplying = applyingJobIds.has(jobKey);
              const isApplied = appliedJobIds.has(jobKey);
              const message = applyMessages[jobKey];

              return (
                <motion.div
                  key={jobKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <div className="w-12 h-12 bg-surface-container-low rounded-xl p-2 flex shrink-0 items-center justify-center overflow-hidden">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="material-symbols-outlined text-outline">business</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-bold text-lg text-on-surface truncate hover:text-primary transition-colors cursor-pointer" onClick={() => window.open(job.detailUrl)}>
                          {job.title}
                        </h4>
                        <span className="text-primary font-bold whitespace-nowrap">{job.salary}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium mb-3">
                        <span className="truncate">{job.company}</span>
                        <span className="text-xs text-outline">•</span>
                        <span>{job.city}</span>
                        <span className="text-xs text-outline">•</span>
                        <span>{job.experience}</span>
                        <span className="text-xs text-outline">•</span>
                        <span>{job.education}</span>
                      </div>
                      
                      {job.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {job.tags.slice(0, 5).map((tag: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] rounded-lg border border-outline-variant/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {job.bossName && (
                        <div className="text-xs text-outline mt-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          {job.bossName} · {job.bossTitle}
                        </div>
                      )}
                      
                      {message && (
                        <div className={`text-xs mt-2 font-medium flex items-center gap-1 ${message.includes('✅') ? 'text-green-600' : 'text-red-500'}`}>
                          {message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-start gap-3 shrink-0">
                    <button
                      onClick={() => handleApply(job)}
                      disabled={isApplying || isApplied}
                      className={`w-full md:w-32 py-2.5 rounded-xl text-sm font-bold flex flex-col items-center justify-center transition-all ${
                        isApplied 
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 disabled:opacity-50'
                      }`}
                    >
                      {isApplying ? (
                        <div className="flex items-center gap-1.5"><span className="animate-spin material-symbols-outlined text-sm">sync</span>处理中</div>
                      ) : isApplied ? (
                        <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">check</span>已投递</div>
                      ) : (
                        <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">send</span>极速投递</div>
                      )}
                    </button>
                    <a 
                      href={job.detailUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-outline hover:text-primary transition-colors flex items-center gap-1"
                    >
                      在平台查看原文的详情 <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
