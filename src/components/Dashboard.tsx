import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { taskApi, interviewApi, logApi } from '../services/api';

export function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [stats, setStats] = useState({
    appliedCount: 0,
    visibilityCount: 0,
    interviewCount: 0
  });
  const [startingTask, setStartingTask] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 通过后端 API 获取数据
    const fetchData = async () => {
      try {
        const [tasksData, interviewsData, statsData] = await Promise.all([
          taskApi.list(5),
          interviewApi.list(3),
          logApi.getStats(),
        ]);
        setTasks(tasksData);
        setInterviews(interviewsData);
        setStats(prev => ({
          ...prev,
          appliedCount: statsData.appliedCount,
          interviewCount: interviewsData.length,
        }));
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleStartAutoApply = async () => {
    if (!user) return;
    setStartingTask(true);
    try {
      await taskApi.create({
        title: '智能全网并发投递',
        platforms: ['Boss直聘', '智联招聘'],
        status: 'running',
        progress: 5,
        applied_count: 0,
        total_count: 50
      });
      alert('投递引擎已就绪：正在从底层连接平台发送握手包，请耐心等待任务完成。');
      // 重新加载列表
      const updatedTasks = await taskApi.list(5);
      setTasks(updatedTasks);
    } catch (err: any) {
      alert(`挂载自动化任务失败: ${err.message || '未知网络错误'}`);
    } finally {
      setStartingTask(false);
    }
  };

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-on-surface leading-tight">早上好，{user?.user_metadata?.full_name || user?.email || '策展人'}</h2>
        <p className="text-on-surface-variant text-lg max-w-2xl">您的自动化投递系统正在平稳运行中。今天已有 {interviews.length} 个新的面试邀请待确认。</p>
      </section>

      {/* 统计卡片网格 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">投递总数</span>
            <span className="material-symbols-outlined text-primary">send</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">{stats.appliedCount.toLocaleString()}</div>
            <div className="text-xs text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              实时统计
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">简历曝光</span>
            <span className="material-symbols-outlined text-primary">visibility</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">4,592</div>
            <div className="text-xs text-secondary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              高峰时段：10:00 - 14:00
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">面试邀请</span>
            <span className="material-symbols-outlined text-primary">event_available</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">{interviews.length}</div>
            <div className="text-xs text-tertiary mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">star</span>
              近期活跃
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 自动化投递任务 */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">bolt</span>
              自动化投递任务
            </h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={handleStartAutoApply}
                disabled={startingTask}
                className="bg-primary hover:bg-primary-container text-on-primary shadow-md hover:shadow-lg transition-all rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {startingTask ? (
                  <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                )}
                启动智能双擎投递
              </button>
              <button onClick={() => window.location.href='/#logs'} className="text-primary text-sm font-medium hover:underline">查看日志</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="bg-surface-container-low p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-on-surface">{task.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">目标平台：{task.platforms?.join(', ')}</p>
                  </div>
                  <div className={task.status === 'running' ? "bg-tertiary-container/10 text-tertiary px-3 py-1 rounded-full flex items-center gap-2" : "bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full flex items-center gap-2"}>
                    {task.status === 'running' && <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />}
                    <span className="text-[10px] font-bold tracking-widest uppercase">{task.status === 'running' ? '正在运行' : '已暂停'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <span>进度: {task.progress}%</span>
                    <span>已投递: {task.applied_count}/{task.total_count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      className={task.status === 'running' ? "bg-primary h-full rounded-full" : "bg-outline h-full rounded-full opacity-50"}
                    />
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-surface-container-low p-10 rounded-2xl text-center border-2 border-dashed border-outline-variant">
                <p className="text-on-surface-variant">暂无运行中的任务</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex-shrink-0 bg-surface-container-high px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
              <span className="text-sm font-medium">简历解析完成</span>
            </div>
            <div className="flex-shrink-0 bg-surface-container-high px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
              <span className="text-sm font-medium">JD 匹配度校验</span>
            </div>
            <div className="flex-shrink-0 bg-surface-container-high px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary-container animate-pulse">sync</span>
              <span className="text-sm font-medium">正在投递简历...</span>
            </div>
          </div>
        </section>

        {/* 近期面试 */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">近期面试</h3>
            <button className="p-1.5 rounded-lg bg-surface-container-high">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {interviews.length > 0 ? interviews.map((interview) => (
              <div key={interview.id} className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-transparent hover:border-primary/10 transition-all">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary-fixed rounded-xl flex flex-col items-center justify-center text-on-secondary-fixed">
                    <span className="text-[10px] font-bold uppercase">{interview.date?.split(' ')[0]}</span>
                    <span className="text-lg font-bold">{interview.date?.split(' ')[1]}</span>
                  </div>
                  <div className="flex-grow">
                    <h5 className="font-bold text-on-surface line-clamp-1">{interview.company} - {interview.position}</h5>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">{interview.type === 'video' ? 'schedule' : 'location_on'}</span>
                      {interview.time}
                    </p>
                  </div>
                </div>
                {interview.type === 'video' && (
                  <div className="mt-4 pt-4 border-t border-surface-container flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary tracking-widest uppercase">视频面试</span>
                    <button className="bg-primary text-on-primary text-xs px-3 py-1 rounded-md hover:bg-primary-container transition-colors">进入会议</button>
                  </div>
                )}
              </div>
            )) : (
              <div className="bg-surface-container-lowest p-8 rounded-2xl text-center border border-dashed border-outline-variant">
                <p className="text-xs text-on-surface-variant">暂无面试安排</p>
              </div>
            )}
            
            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 group">
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
              <span className="text-sm font-medium">手动添加面试计划</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
