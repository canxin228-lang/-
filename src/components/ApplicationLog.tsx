import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { logApi } from '../services/api';
import { cn } from '../lib/utils';

export function ApplicationLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选状态
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const result = await logApi.list({ 
          limit: 50,
          platform: filterPlatform || undefined,
          status: filterStatus || undefined
        });
        const data = Array.isArray(result) ? result : (result.data || []);
        setLogs(data);
      } catch (error) {
        console.error('获取投递日志失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user, filterPlatform, filterStatus]);

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('success')) return 'rocket_launch';
    if (s.includes('error') || s.includes('fail')) return 'error';
    if (s.includes('read') || s.includes('viewed')) return 'visibility';
    return 'pending';
  };

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('success')) return '投递成功';
    if (s.includes('error') || s.includes('fail')) return '投递失败/被驳回';
    if (s.includes('read') || s.includes('viewed')) return '对方已读';
    return '处理中 / 未知';
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('success')) return 'text-primary';
    if (s.includes('error') || s.includes('fail')) return 'text-red-500';
    if (s.includes('read') || s.includes('viewed')) return 'text-tertiary';
    return 'text-on-surface-variant';
  };

  const getStatusDotColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('success')) return 'bg-primary';
    if (s.includes('error') || s.includes('fail')) return 'bg-red-500';
    if (s.includes('read') || s.includes('viewed')) return 'bg-tertiary';
    return 'bg-outline-variant';
  };

  const PLATFORMS = ['所有平台', 'Boss直聘', '智联招聘', '拉勾网', '51job', 'LinkedIn'];
  const STATUSES = [
    { label: '所有状态', value: '' },
    { label: '投递成功', value: 'success' },
    { label: '投递失败/被驳回', value: 'failed' },
    { label: '对方已读', value: 'read' },
  ];

  // 计算今日成功数
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(l => new Date(l.created_at) >= todayStart);
  const todaySuccess = todayLogs.filter(l => l.status?.includes('success')).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-12 mb-4">
        <p className="text-on-surface-variant font-medium tracking-wider mb-1 text-xs uppercase">Efficiency Control Center</p>
        <h2 className="text-4xl font-semibold tracking-tight text-on-surface">全网投递日志库</h2>
      </div>

      {/* 左侧筛选与统计 */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              今日投递雷达
            </h3>
            <span className="text-[10px] font-bold text-primary-container px-2 py-0.5 rounded-full bg-primary/10 uppercase tracking-widest">Active</span>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center text-[11px] text-on-surface-variant mb-2">
              <span>今日发出来自 AI 的打招呼</span>
              <span className="font-bold text-on-surface text-lg text-primary">{todayLogs.length} <span className="text-xs text-outline font-normal">条</span></span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-on-surface-variant mb-2 mt-4">
              <span>其中成功送达</span>
              <span className="font-bold text-on-surface text-lg text-green-600">{todaySuccess} <span className="text-xs text-outline font-normal">次</span></span>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low p-6 rounded-2xl space-y-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            组合筛选器
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-3">按招聘平台</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => {
                  const val = p === '所有平台' ? '' : p;
                  const isActive = filterPlatform === val;
                  return (
                    <button 
                      key={p} 
                      onClick={() => setFilterPlatform(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isActive 
                          ? 'bg-primary text-on-primary border-primary shadow-md' 
                          : 'bg-surface-container-lowest text-on-surface-variant border-transparent hover:border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-3">按投递状态</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none font-medium cursor-pointer shadow-sm"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {loading && (
          <div className="p-6 text-center text-primary flex items-center justify-center gap-2 font-bold animate-pulse">
            <span className="material-symbols-outlined animation-spin">sync</span>
            正在拉取云端记录...
          </div>
        )}
      </div>

      {/* 右侧列表 */}
      <div className="lg:col-span-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10">
          <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">history</span>
              投递历史记录
            </h3>
            <div className="flex gap-2">
              <span className="text-[11px] font-bold px-2 py-1 bg-surface-container rounded-lg text-on-surface-variant">共 {logs.length} 条符合条件</span>
            </div>
          </div>
          
          <div className="divide-y divide-outline-variant/10 min-h-[400px]">
            {!loading && logs.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">folder_open</span>
                <p className="text-on-surface-variant font-medium">当前筛选条件下没有日志</p>
              </div>
            ) : (
              <AnimatePresence>
                {logs.map((log, idx) => {
                  const isFail = log.status?.toLowerCase().includes('fail') || log.status?.toLowerCase().includes('error');
                  
                  return (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="px-6 py-6 hover:bg-surface-container-low/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isFail ? 'bg-red-50 text-red-500' : 'bg-surface-container text-primary'}`}>
                          <span className="material-symbols-outlined text-2xl">{getStatusIcon(log.status)}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-on-surface leading-tight mb-1">{log.position}</h4>
                          <p className="text-sm text-on-surface-variant">{log.company} {log.location ? `· ${log.location}` : ''}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded">{log.platform}</span>
                            <span className="text-[10px] text-outline font-mono">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          
                          {/* 失败详情折叠展示区 */}
                          {isFail && log.details && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-500/20 rounded-xl">
                              <div className="flex items-center gap-1.5 text-red-600 mb-1">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                <span className="text-xs font-bold">错误详情解释</span>
                              </div>
                              <p className="text-xs text-red-700/80 font-mono break-all">{log.details}</p>
                            </div>
                          )}
                          {!isFail && log.details && (
                            <p className="text-[11px] text-on-surface-variant mt-2 italic bg-surface-container p-2 rounded-lg inline-block">
                              备注: {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end bg-white py-1 px-3 border border-outline-variant/20 rounded-full shadow-sm">
                            <span className={cn("w-2 h-2 rounded-full shadow-inner", getStatusDotColor(log.status))} />
                            <span className={cn("text-xs font-bold tracking-wider", getStatusColor(log.status))}>{getStatusLabel(log.status)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
