import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../App';
import { resumeApi, userApi } from '../services/api';
import { geminiService } from '../services/geminiService';

// ========== 职位类别数据 ==========
const JOB_CATEGORIES: Record<string, string[]> = {
  '技术开发': [
    '前端工程师', '后端工程师', '全栈工程师', 'Java工程师', 'Python工程师',
    'Go工程师', 'C++工程师', 'Android工程师', 'iOS开发工程师', 'Flutter工程师',
    '嵌入式工程师', '算法工程师', '大数据工程师', 'AI/机器学习工程师',
    'DevOps工程师', '测试工程师', '测试开发工程师', '安全工程师', '运维工程师',
    '架构师', '技术总监/CTO', '区块链工程师', '游戏开发工程师',
  ],
  '产品/设计': [
    '产品经理', '高级产品经理', '产品总监', 'UI设计师', 'UX设计师',
    '交互设计师', '视觉设计师', '平面设计师', '游戏策划',
  ],
  '数据/运营': [
    '数据分析师', '数据产品经理', '数据挖掘工程师', '商业分析师',
    '运营经理', '内容运营', '用户运营', '社区运营', 'SEO/SEM专员', '增长黑客',
  ],
  '市场/销售': [
    '市场经理', '品牌经理', '公关经理', '销售经理', '客户经理',
    '商务拓展', '渠道经理', '大客户经理',
  ],
  '管理/职能': [
    '项目经理', 'PMO', '人事经理/HR', 'HRBP', '行政主管',
    '财务主管', '法务', '总经理助理',
  ],
};

// ========== 中国主要城市数据 ==========
const CITY_OPTIONS = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉',
  '西安', '苏州', '长沙', '重庆', '天津', '郑州', '青岛', '厦门',
  '合肥', '福州', '大连', '宁波', '无锡', '佛山', '东莞', '珠海',
  '昆明', '贵阳', '济南', '哈尔滨', '沈阳', '长春', '海口', '太原',
  '石家庄', '南昌', '南宁', '兰州', '呼和浩特', '乌鲁木齐', '拉萨',
  '远程/不限',
];

export function ResumeConfig() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>({
    expected_position: '',
    expected_locations: ['上海', '杭州'],
    salary_min: 10,
    salary_max: 20,
    blocked_keywords: '',
    auto_apply: true,
    ai_refinement: false
  });
  const [refiningId, setRefiningId] = useState<string | null>(null);
  
  // 预览与 AI 润色弹窗状态
  const [viewingResume, setViewingResume] = useState<any>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{resume: any, original: string, refined: string} | null>(null);

  // 弹窗控制状态
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [resumesData, userData] = await Promise.all([
          resumeApi.list(),
          userApi.getMe(),
        ]);
        setResumes(resumesData);
        if (userData) {
          // 读取本地存储中的公司规模（避免改动云数据库 schema）
          const savedSize = localStorage.getItem(`company_size_${user.id}`) || '不限';
          setPreferences((prev: any) => ({ ...prev, ...userData, company_size: savedSize }));
        }
      } catch (error) {
        console.error('加载简历配置失败:', error);
      }
    };
    fetchData();
  }, [user]);

  // ========== 简历文件上传 ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('仅支持 PDF 和 Word 格式的简历文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('文件大小不能超过 10MB');
      return;
    }

    setUploading(true);
    try {
      // 读取文件内容为 base64，存储到数据库中
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
        await resumeApi.create({
          title: file.name.replace(/\.[^.]+$/, ''),
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
          content: base64Content,
          file_type: ext,
          file_name: file.name,
          file_size: file.size,
          is_default: resumes.length === 0,
        });
        alert('简历上传成功！');
        const updatedResumes = await resumeApi.list();
        setResumes(updatedResumes);
        setUploading(false);
      };
      reader.onerror = () => {
        alert('文件读取失败');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('上传简历失败:', error);
      alert('上传简历失败，请重试');
      setUploading(false);
    }
    // 清空 input 以支持重复上传同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    try {
      await userApi.updateMe({
        display_name: user.user_metadata?.full_name || '',
        expected_position: preferences.expected_position,
        expected_locations: preferences.expected_locations,
        salary_min: preferences.salary_min,
        salary_max: preferences.salary_max,
        blocked_keywords: preferences.blocked_keywords,
        auto_apply: preferences.auto_apply,
        ai_refinement: preferences.ai_refinement,
      });
      // 存储公司规模
      if (preferences.company_size) {
        localStorage.setItem(`company_size_${user.id}`, preferences.company_size);
      }
      alert('配置已保存');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  const handleAIRefine = async (resume: any) => {
    if (!user) return;
    setRefiningId(resume.id);
    try {
      const original = resume.content || resume.description || '';
      const refinedContent = await geminiService.refineResume(original);
      setAiSuggestion({ resume, original, refined: refinedContent });
    } catch (error) {
      console.error('AI 润色失败:', error);
      alert('AI 润色失败，请稍后重试');
    } finally {
      setRefiningId(null);
    }
  };

  const acceptAiSuggestion = async () => {
    if (!aiSuggestion) return;
    try {
      const { resume, refined } = aiSuggestion;
      await resumeApi.update(resume.id, {
        description: (refined || '').slice(0, 100) + '...',
        content: refined,
      });
      const updatedResumes = await resumeApi.list();
      setResumes(updatedResumes);
      alert('优化已应用！');
      setAiSuggestion(null);
    } catch (err) {
      alert('应用失败，请重试');
    }
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('确定删除此简历版本？')) return;
    try {
      await resumeApi.delete(id);
      const updatedResumes = await resumeApi.list();
      setResumes(updatedResumes);
    } catch (error) {
      console.error('删除简历失败:', error);
      alert('删除失败');
    }
  };

  // ========== 城市增删 ==========
  const addCity = (city: string) => {
    if (!preferences.expected_locations?.includes(city)) {
      setPreferences({
        ...preferences,
        expected_locations: [...(preferences.expected_locations || []), city],
      });
    }
  };
  const removeCity = (city: string) => {
    setPreferences({
      ...preferences,
      expected_locations: (preferences.expected_locations || []).filter((c: string) => c !== city),
    });
  };

  // ========== 职位选择 ==========
  const selectJob = (job: string) => {
    setPreferences({ ...preferences, expected_position: job });
    setShowJobPicker(false);
  };

  // 获取文件图标
  const getFileIcon = (resume: any) => {
    const ext = resume.file_type || '';
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'article';
    return 'description';
  };

  return (
    <div className="space-y-10">
      <div className="mb-10">
        <h1 className="text-5xl font-semibold text-on-surface leading-tight tracking-tight">简历配置</h1>
        <p className="text-on-surface-variant mt-2 text-lg">在这里精炼您的数字化职业资产与投递偏好。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* ========== 简历库 ========== */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              简历库
            </h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-primary hover:underline text-sm font-bold flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{uploading ? 'hourglass_top' : 'upload_file'}</span>
              {uploading ? '上传中...' : '上传简历'}
            </button>
            {/* 隐藏的文件 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-4">
            {resumes.length > 0 ? resumes.map((resume) => (
              <div
                key={resume.id}
                className={resume.is_default
                  ? "p-6 bg-surface-container-lowest rounded-2xl shadow-md border-l-4 border-primary"
                  : "p-6 bg-surface-container-low/50 hover:bg-surface-container-lowest rounded-2xl transition-all duration-300 group border-l-4 border-transparent hover:border-outline-variant"
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">{getFileIcon(resume)}</span>
                    <div>
                      <h3 className={resume.is_default ? "font-bold text-lg" : "font-bold text-lg group-hover:text-primary transition-colors"}>
                        {resume.title}
                      </h3>
                      {resume.file_name && (
                        <span className="text-[11px] text-outline">{resume.file_name}</span>
                      )}
                    </div>
                  </div>
                  {resume.is_default && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">默认</span>}
                </div>
                <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">{resume.description}</p>
                <div className={resume.is_default ? "flex gap-2" : "flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity"}>
                  <button
                    onClick={() => setViewingResume(resume)}
                    className="p-2 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-lg transition-colors"
                    title="预览内容"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                  <button
                    onClick={() => handleAIRefine(resume)}
                    disabled={refiningId === resume.id}
                    className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {refiningId === resume.id ? (
                      <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                    ) : (
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                    )}
                    AI 润色
                  </button>
                  <button
                    onClick={() => handleDeleteResume(resume.id)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                    title="删除"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            )) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-10 bg-surface-container-low/30 rounded-2xl text-center border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low/60 transition-colors"
              >
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">cloud_upload</span>
                <p className="text-sm text-on-surface-variant mb-1 font-semibold">点击上传简历文件</p>
                <p className="text-xs text-outline">支持 PDF / Word 格式，最大 10MB</p>
              </div>
            )}
          </div>
        </section>

        {/* ========== 投递偏好设置 ========== */}
        <section className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-3xl">
            <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              投递偏好设置
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* 期望职位 - 下拉选择 */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">期望职位</label>
                <div
                  onClick={() => setShowJobPicker(!showJobPicker)}
                  className="w-full bg-surface-container-high rounded-xl p-4 text-on-surface font-medium cursor-pointer flex justify-between items-center hover:bg-surface-variant transition-colors"
                >
                  <span>{preferences.expected_position || '点击选择职位...'}</span>
                  <span className="material-symbols-outlined text-outline text-sm">
                    {showJobPicker ? 'expand_less' : 'expand_more'}
                  </span>
                </div>

                {/* 职位选择器弹窗 */}
                <AnimatePresence>
                  {showJobPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 max-h-[400px] overflow-y-auto"
                    >
                      {Object.entries(JOB_CATEGORIES).map(([category, jobs]) => (
                        <div key={category}>
                          <div className="sticky top-0 bg-surface-container-low px-4 py-2 text-xs font-bold text-primary uppercase tracking-wider border-b border-outline-variant/10">
                            {category}
                          </div>
                          {jobs.map((job) => (
                            <div
                              key={job}
                              onClick={() => selectJob(job)}
                              className={`px-4 py-2.5 hover:bg-primary/5 cursor-pointer text-sm transition-colors flex items-center gap-2 ${preferences.expected_position === job ? 'bg-primary/10 text-primary font-bold' : ''}`}
                            >
                              {preferences.expected_position === job && (
                                <span className="material-symbols-outlined text-sm">check</span>
                              )}
                              {job}
                            </div>
                          ))}
                        </div>
                      ))}
                      {/* 自定义输入 */}
                      <div className="p-3 border-t border-outline-variant/10">
                        <input
                          placeholder="或者手动输入职位名称..."
                          className="w-full bg-surface-container-high rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                              selectJob((e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 期望地点 - 可增删 */}
              <div className="space-y-2 relative">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">期望地点</label>
                <div className="flex flex-wrap gap-2">
                  {preferences.expected_locations?.map((loc: string) => (
                    <span key={loc} className="bg-primary-container text-on-primary-container text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                      {loc}
                      <span
                        onClick={() => removeCity(loc)}
                        className="material-symbols-outlined text-[14px] cursor-pointer hover:text-red-500 transition-colors"
                      >close</span>
                    </span>
                  ))}
                  <button
                    onClick={() => setShowCityPicker(!showCityPicker)}
                    className="bg-surface-container-highest text-on-surface text-xs px-3 py-1.5 rounded-full border border-dashed border-outline-variant hover:bg-surface-variant transition-colors"
                  >
                    + 添加
                  </button>
                </div>

                {/* 城市选择器 */}
                <AnimatePresence>
                  {showCityPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 p-3 max-h-[300px] overflow-y-auto"
                    >
                      <div className="flex flex-wrap gap-2">
                        {CITY_OPTIONS.map((city) => {
                          const selected = preferences.expected_locations?.includes(city);
                          return (
                            <button
                              key={city}
                              onClick={() => {
                                if (selected) removeCity(city);
                                else addCity(city);
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full transition-all ${selected
                                ? 'bg-primary text-on-primary font-bold shadow-sm'
                                : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                              }`}
                            >
                              {selected ? `✓ ${city}` : city}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-3 pt-2 border-t border-outline-variant/10 flex justify-end">
                        <button
                          onClick={() => setShowCityPicker(false)}
                          className="text-xs text-primary font-bold px-3 py-1 hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          完成选择
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 薪资范围与公司规模 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">薪资范围</label>
                  <div className="flex items-center gap-4">
                    <select
                      className="flex-1 bg-surface-container-high border-none rounded-xl p-4 text-sm focus:ring-0"
                      value={preferences.salary_min}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferences({ ...preferences, salary_min: Number(e.target.value) })}
                    >
                      {[3,5,8,10,15,20,25,30,40,50].map(v => (
                        <option key={v} value={v}>{v}K</option>
                      ))}
                    </select>
                    <span className="text-on-surface-variant font-medium">至</span>
                    <select
                      className="flex-1 bg-surface-container-high border-none rounded-xl p-4 text-sm focus:ring-0"
                      value={preferences.salary_max}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferences({ ...preferences, salary_max: Number(e.target.value) })}
                    >
                      {[5,8,10,15,20,25,30,40,50,60,80,100].map(v => (
                        <option key={v} value={v}>{v === 100 ? '100K+' : `${v}K`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">目标公司规模 (人数)</label>
                  <select
                    className="w-full bg-surface-container-high border-none rounded-xl p-4 text-sm focus:ring-0"
                    value={preferences.company_size || '不限'}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferences({ ...preferences, company_size: e.target.value })}
                  >
                    {['不限', '0-20人', '20-99人', '100-499人', '500-999人', '1000-9999人', '10000人以上'].map(scale => (
                      <option key={scale} value={scale}>{scale}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 屏蔽关键词 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">屏蔽关键词 (不投递单位)</label>
                <textarea
                  className="w-full bg-surface-container-high border-none rounded-xl focus:ring-0 focus:border-b-2 focus:border-primary transition-all p-4 text-sm placeholder:text-outline-variant"
                  placeholder="输入公司简称，逗号分隔 (如: 某某实业, P2P, 外包公司)"
                  rows={2}
                  value={preferences.blocked_keywords}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPreferences({ ...preferences, blocked_keywords: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 开关区 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-tertiary-container/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary-container">rocket_launch</span>
                </div>
                <div>
                  <h4 className="font-bold">自动投递</h4>
                  <p className="text-xs text-on-surface-variant">基于偏好全天候匹配</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.auto_apply}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferences({ ...preferences, auto_apply: e.target.checked })}
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">auto_fix_high</span>
                </div>
                <div>
                  <h4 className="font-bold">AI 智能润色</h4>
                  <p className="text-xs text-on-surface-variant">根据职位描述自动微调</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.ai_refinement}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferences({ ...preferences, ai_refinement: e.target.checked })}
                />
                <div className="w-12 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button className="px-8 py-3 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-variant transition-colors">取消修改</button>
            <button
              onClick={handleSavePreferences}
              className="px-10 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
            >
              保存当前配置
            </button>
          </div>
        </section>
      </div>

      {/* 点击外部关闭弹窗 */}
      {(showJobPicker || showCityPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowJobPicker(false); setShowCityPicker(false); }}
        />
      )}

      {/* ========== 简历预览弹窗 ========== */}
      <AnimatePresence>
        {viewingResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-outline-variant/10 bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-3xl">{getFileIcon(viewingResume)}</span>
                  <div>
                    <h3 className="font-bold text-xl">{viewingResume.title}</h3>
                    <p className="text-sm text-outline tracking-wider">{viewingResume.file_name || '无文件上传记录'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingResume(null)}
                  className="material-symbols-outlined text-outline hover:text-on-surface bg-transparent border-none text-3xl"
                >close</button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 bg-surface whitespace-pre-wrap font-mono text-sm leading-relaxed text-on-surface-variant">
                {viewingResume.content ? viewingResume.content : viewingResume.description}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== AI 润色建议弹窗 ========== */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-surface-container-lowest w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-3xl animate-pulse">auto_fix_high</span>
                  <h3 className="font-bold text-xl text-primary">AI 智能润色建议</h3>
                </div>
                <button
                  onClick={() => setAiSuggestion(null)}
                  className="material-symbols-outlined text-outline hover:text-on-surface bg-transparent border-none text-2xl"
                >close</button>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-outline-variant/20">
                {/* 原版 */}
                <div className="flex-1 flex flex-col bg-surface-container-low/30 overflow-hidden">
                  <div className="p-4 bg-surface-container-low text-sm font-bold tracking-wider text-outline uppercase">
                    原版内容
                  </div>
                  <div className="p-6 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface-variant opacity-75">
                    {aiSuggestion.original}
                  </div>
                </div>
                {/* 优化版 */}
                <div className="flex-1 flex flex-col bg-primary/5 overflow-hidden">
                  <div className="p-4 bg-primary/10 text-sm font-bold tracking-wider text-primary uppercase flex justify-between">
                    优化后内容
                    <span className="text-[10px] bg-primary/20 px-2 py-0.5 rounded-full normal-case">Gemini 3.1 Pro 强力加持</span>
                  </div>
                  <div className="p-6 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-surface font-medium">
                    {aiSuggestion.refined}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-4">
                <button
                  onClick={() => setAiSuggestion(null)}
                  className="px-6 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-variant transition-colors font-bold"
                >
                  放弃修改
                </button>
                <button
                  onClick={acceptAiSuggestion}
                  className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  应用此优化
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
