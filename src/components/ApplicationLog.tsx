import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { logApi } from '../services/api';
import { cn } from '../lib/utils';

export function ApplicationLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      try {
        const result = await logApi.list({ limit: 20 });
        setLogs(result.data);
      } catch (error) {
        console.error('获取投递日志失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const getStatusIcon = (status: string) => {
    if (status === 'success') return 'rocket_launch';
    if (status === 'read') return 'language';
    return 'architecture';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'success') return '投递成功';
    if (status === 'read') return '对方已读';
    return '不匹配';
  };

  const getStatusColor = (status: string) => {
    if (status === 'success') return 'text-primary';
    if (status === 'read') return 'text-tertiary';
    return 'text-error';
  };

  const getStatusDotColor = (status: string) => {
    if (status === 'success') return 'bg-primary';
    if (status === 'read') return 'bg-tertiary';
    return 'bg-error';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-12 mb-4">
        <p className="text-on-surface-variant font-medium tracking-wider mb-1 text-xs uppercase">Efficiency Control Center</p>
        <h2 className="text-4xl font-semibold tracking-tight text-on-surface">投递日志</h2>
      </div>

      {/* 左侧 */}
      <div className="lg:col-span-4 space-y-6">
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              实时投递脉冲
            </h3>
            <span className="text-[10px] font-bold text-tertiary-container px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/20 uppercase tracking-widest">Live</span>
          </div>
          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/30">
            <div className="relative pl-9"><div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-primary-container/10 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-primary">search</span></div><p className="text-xs font-semibold text-primary">正在扫描全网职位</p><p className="text-[11px] text-on-surface-variant mt-0.5">智联、前程无忧、Boss直聘 (3/3)</p></div>
            <div className="relative pl-9"><div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">check_circle</span></div><p className="text-xs font-semibold text-on-surface">发现高匹配岗位</p><p className="text-[11px] text-on-surface-variant mt-0.5">字节跳动 - 高级产品经理 (匹配度 94%)</p></div>
            <div className="relative pl-9"><div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">send</span></div><p className="text-xs font-semibold text-on-surface-variant">准备投递材料</p><p className="text-[11px] text-on-surface-variant mt-0.5">正根据 JD 自动微调简历中...</p></div>
          </div>
          <div className="mt-8 pt-6 border-t border-outline-variant/20">
            <div className="flex justify-between items-center text-[11px] text-on-surface-variant mb-2"><span>今日已完成</span><span className="font-bold text-on-surface">12 / 20</span></div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: '60%' }} className="bg-primary h-full rounded-full" /></div>
          </div>
        </section>
        <section className="bg-surface-container-low p-6 rounded-2xl space-y-6">
          <h3 className="text-sm font-bold">日志筛选</h3>
          <div className="space-y-4">
            <div><label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">按平台</label><div className="flex flex-wrap gap-2"><button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-medium text-primary shadow-sm ring-1 ring-primary/20">全部</button>{['Boss', '智联', 'LinkedIn'].map(p => (<button key={p} className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs font-medium text-on-surface-variant hover:bg-white transition-colors">{p}</button>))}</div></div>
            <div><label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">按状态</label><select className="w-full bg-surface-container-lowest border-none rounded-xl text-xs py-3 focus:ring-2 focus:ring-primary/20 cursor-pointer"><option>所有状态</option><option>投递成功</option><option>已读</option><option>不匹配</option></select></div>
          </div>
        </section>
      </div>

      {/* 右侧：历史记录 */}
      <div className="lg:col-span-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/10">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
            <h3 className="text-sm font-bold">历史记录</h3>
            <button className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline">导出 CSV <span className="material-symbols-outlined text-sm">download</span></button>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {loading ? (
              <div className="p-12 text-center text-on-surface-variant">加载中...</div>
            ) : logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="px-6 py-6 hover:bg-surface-container-low/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">{getStatusIcon(log.status)}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface leading-tight">{log.position}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{log.company} · {log.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-medium bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded">{log.platform}</span>
                      <span className="text-[10px] text-outline">{log.time || new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full", getStatusDotColor(log.status))} />
                      <span className={cn("text-xs font-bold", getStatusColor(log.status))}>{getStatusLabel(log.status)}</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant">{log.details}</p>
                  </div>
                  <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors"><span className="material-symbols-outlined text-on-surface-variant">more_vert</span></button>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-on-surface-variant">暂无投递记录</div>
            )}
          </div>
          <div className="px-6 py-4 flex items-center justify-between bg-surface-container-low/20">
            <p className="text-[11px] text-on-surface-variant">显示 {logs.length} 条记录</p>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-outline-variant/20 disabled:opacity-50" disabled><span className="material-symbols-outlined text-sm">chevron_left</span></button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-outline-variant/20 text-xs font-medium">2</button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-outline-variant/20"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
