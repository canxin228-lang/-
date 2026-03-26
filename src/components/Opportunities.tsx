import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { opportunityApi } from '../services/api';

// ========== 筛选选项数据 ==========
const FILTER_OPTIONS: Record<string, string[]> = {
  '期望职位': [
    '前端工程师', '后端工程师', '全栈工程师', '产品经理', '高级产品经理',
    'UI/UX设计师', '算法工程师', '数据分析师', '测试工程师', '运维工程师',
    'Android工程师', 'iOS工程师', 'Java工程师', 'Python工程师', 'Go工程师',
    '项目经理', '技术总监', '架构师', '运营经理',
  ],
  '所属行业': [
    '互联网 / AI 科技', '金融 / 银行', '电商 / 零售', '游戏 / 娱乐',
    '教育 / 在线教育', '医疗 / 健康', '汽车 / 新能源', '物流 / 供应链',
    '房产 / 建筑', '制造 / 工业', '咨询 / 管理', '传媒 / 广告',
    '通讯 / 运营商', '政府 / 事业单位', '其他',
  ],
  '公司规模': [
    '20人以下', '20-99人', '100-499人', '500-999人',
    '1000-9999人', '10000人以上', '不限',
  ],
  '薪资范围': [
    '3k - 5k', '5k - 8k', '8k - 10k', '10k - 15k', '15k - 20k',
    '20k - 30k', '30k - 50k', '50k - 80k', '80k 以上', '不限',
  ],
};

const DEFAULT_VALUES: Record<string, string> = {
  '期望职位': '高级产品经理',
  '所属行业': '互联网 / AI 科技',
  '公司规模': '500-999人',
  '薪资范围': '30k - 50k',
};

export function Opportunities() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>(DEFAULT_VALUES);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchOpportunities = async () => {
      try {
        const data = await opportunityApi.list({ limit: 10, search: searchQuery || undefined });
        setOpportunities(data);
      } catch (error) {
        console.error('获取职位机会失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, [user, searchQuery]);

  const handleFilterSelect = (filterName: string, value: string) => {
    setFilters({ ...filters, [filterName]: value });
    setOpenFilter(null);
  };

  const filterIcons: Record<string, string> = {
    '薪资范围': 'tune',
  };

  return (
    <div className="space-y-12">
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block">Premium Recruitment</span>
            <h2 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tighter text-on-surface">
              开启您的<span className="text-primary">职业策展</span>之旅
            </h2>
          </div>
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline">search</span>
            </div>
            <input
              className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant text-on-surface"
              placeholder="搜索职位、公司或关键词"
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ========== 可交互的筛选器 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.keys(FILTER_OPTIONS).map((filterName) => (
            <div key={filterName} className="relative">
              <div
                onClick={() => setOpenFilter(openFilter === filterName ? null : filterName)}
                className={`bg-surface-container-low p-5 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all ${openFilter === filterName ? 'ring-2 ring-primary bg-surface-container' : 'hover:bg-surface-container group'}`}
              >
                <label className="text-[11px] font-bold text-outline uppercase tracking-wider">{filterName}</label>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{filters[filterName]}</span>
                  <span className={`material-symbols-outlined transition-transform ${openFilter === filterName ? 'text-primary rotate-180' : 'text-outline group-hover:text-primary'}`}>
                    {filterIcons[filterName] || 'keyboard_arrow_down'}
                  </span>
                </div>
              </div>

              {/* 下拉选项面板 */}
              <AnimatePresence>
                {openFilter === filterName && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 max-h-[300px] overflow-y-auto"
                  >
                    {FILTER_OPTIONS[filterName].map((option) => (
                      <div
                        key={option}
                        onClick={() => handleFilterSelect(filterName, option)}
                        className={`px-4 py-3 hover:bg-primary/5 cursor-pointer text-sm transition-colors flex items-center justify-between ${filters[filterName] === option ? 'bg-primary/10 text-primary font-bold' : ''}`}
                      >
                        <span>{option}</span>
                        {filters[filterName] === option && (
                          <span className="material-symbols-outlined text-sm text-primary">check</span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <h3 className="text-xl font-bold">智能匹配推荐</h3>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-medium hover:bg-surface-variant transition-colors">最新发布</button>
            <button className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-medium shadow-lg shadow-primary/20">匹配度优先</button>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-3 block">progress_activity</span>
              智能匹配中...
            </div>
          ) : opportunities.length > 0 ? opportunities.map((job) => (
            <div key={job.id} className="group relative bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 border-l-4 border-transparent hover:border-primary">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-surface-container p-2 flex items-center justify-center">
                <img src={job.logo_url} alt={job.company} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="text-xl font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{job.title}</h4>
                    <p className="text-on-surface-variant font-medium">{job.company} · {job.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl font-bold text-primary">{job.salary}</span>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold tracking-tight flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      {job.match_rate}% 深度匹配
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.tags?.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 bg-surface-container text-on-surface-variant text-xs rounded-lg">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )) : (
            <div className="p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-3 block">work_outline</span>
              <p className="text-on-surface-variant text-lg mb-2">暂无推荐机会</p>
              <p className="text-sm text-outline">调整上方筛选条件或刷新以获取最新职位</p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <button className="group flex items-center gap-2 mx-auto text-primary font-bold hover:gap-4 transition-all">
            查看更多精选机会
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* 点击外部关闭下拉 */}
      {openFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenFilter(null)}
        />
      )}
    </div>
  );
}
