import { Resume, AutomationTask, Interview, ApplicationLog, JobOpportunity } from './types';

export const MOCK_RESUMES: Resume[] = [
  {
    id: '1',
    title: '通用简历',
    updatedAt: '2023.11.24',
    description: '包含完整工作流',
    isDefault: true,
  },
  {
    id: '2',
    title: '后端开发',
    updatedAt: '2023.12.01',
    description: '针对互联网大厂 · 侧重架构设计',
    isDefault: false,
  },
  {
    id: '3',
    title: '前端实习',
    updatedAt: '2024.01.15',
    description: '在校生版本 · 侧重项目经验',
    isDefault: false,
  },
];

export const MOCK_TASKS: AutomationTask[] = [
  {
    id: '1',
    title: '高级产品经理 - 互联网大厂专项',
    platforms: ['BOSS直聘', '拉勾', '领英'],
    status: 'running',
    progress: 85,
    appliedCount: 42,
    totalCount: 50,
  },
  {
    id: '2',
    title: '技术专家 - 远程/海外机会',
    platforms: ['LinkedIn', 'Indeed'],
    status: 'paused',
    progress: 30,
    appliedCount: 15,
    totalCount: 50,
  },
];

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: '1',
    company: '蚂蚁集团',
    position: '资深设计师',
    date: 'Oct 24',
    time: '14:30 - 15:30',
    location: '',
    type: 'video',
  },
  {
    id: '2',
    company: '字节跳动',
    position: '飞书产品经理',
    date: 'Oct 26',
    time: '10:00 - 11:00',
    location: '',
    type: 'video',
  },
  {
    id: '3',
    company: '腾讯',
    position: '云架构师',
    date: 'Oct 27',
    time: '腾讯滨海大厦',
    location: '腾讯滨海大厦',
    type: 'offline',
  },
];

export const MOCK_LOGS: ApplicationLog[] = [
  {
    id: '1',
    position: '资深交互设计师',
    company: '腾讯科技',
    location: '深圳',
    platform: 'Boss直聘',
    time: '10:45 AM',
    status: 'success',
    details: '已通过第一轮算法初筛',
  },
  {
    id: '2',
    position: 'AI 研究员 (NLP方向)',
    company: '阿里巴巴集团',
    location: '杭州',
    platform: '官网内推',
    time: '09:12 AM',
    status: 'read',
    details: '招聘负责人已查看简历',
  },
  {
    id: '3',
    position: '产品架构师',
    company: '美团',
    location: '北京',
    platform: '前程无忧',
    time: '昨天 18:30',
    status: 'mismatch',
    details: '行业经验要求不符',
  },
  {
    id: '4',
    position: '品牌营销总监',
    company: '小红书',
    location: '上海',
    platform: 'LinkedIn',
    time: '昨天 14:00',
    status: 'success',
    details: '系统自动匹配 98%',
  },
];

export const MOCK_OPPORTUNITIES: JobOpportunity[] = [
  {
    id: '1',
    title: '资深 AI 产品专家',
    company: '腾讯科技',
    location: '深圳 · 南山区',
    salary: '45k - 70k',
    matchRate: 98,
    tags: ['大模型经验', '10年以上', '双休'],
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKBW2XEOYWW-Ws2g7qeIn0p97SvpYVsjoBB8RWUW6VzvJp9f96v04xZFrJfBER7jrJroDrClVhqLHCjt8uqpggFro3uobsYR-K-fPgf8u-McCymVohWFXRNSsK7SThX0AmtrZRv9XG0WVJWOi-2mPbZ7oJ10yzNR67pvMSIqC6krvPPi8irf33UP4wNQsxj2CquNYWRUQtHp7FMa59JuQQboCwLAwIUha91VkjtOEwPj4Qrz11_3YzKwZ92U88UhtW5-7wVJ-rqQ',
  },
  {
    id: '2',
    title: '效能平台负责人',
    company: '字节跳动',
    location: '北京 · 海淀区',
    salary: '50k - 85k',
    matchRate: 95,
    tags: ['自动化架构', '管理岗', '期权激励'],
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW6CYcQHhLD3Me36VzjngwD-KhzBmGEYWFpZviCOrg6J0qOGVrLlv36nDNu5o1VINTMX_yLJPDx-04aU3bilmThUYoV3WG8lEtAS7PPxErQvlyPs6Y-Wwwm9C8Dr_9yWFW-VWiyfS32XJqU5Fdz6zw4CpOQWfadyiQ4P5VaxhKThejzuyqtq10x3kZqv7NX7bYD_XcqcsV49CL5H1eumbLaDBTpEVqugU8_CFmr2kBjgRre8fNc_AfGHA7GiDDjc86StjJfP8e0Q',
  },
  {
    id: '3',
    title: '数字化转型策展人',
    company: '小米集团',
    location: '上海 · 徐汇区',
    salary: '35k - 60k',
    matchRate: 92,
    tags: ['系统集成', '5-10年', '全球视野'],
    logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgdu4oo0ge9PhS_Dq93WgBNVw4BtqAiWwJngEkzw_Fh-NpbHfZp_Ly3gzhL03lWfL_hLdlWGfCsy50hc8wsiDpWQLIeHyP7IpnAUaXUv4NAW78BC05DYLfA0zU-ppX4yCJFOqy2wtDmoYY3fCz-3WIxIVvO41tAXyj3Dj4tkVYrIoiyS7SqipDA03Nj9cHmIPLE1z-kkgTYkVJ6E4xKuNkYtr4anht3Hw6aGTNEUs8mGwT3DbWYUhgyEpMhkrvE1HnmeYbXlT_Sg',
  },
];
