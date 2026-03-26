-- ============================================================
-- 数字策展人 - Supabase 数据库建表脚本
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 用户表 (users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  expected_position TEXT DEFAULT '',
  expected_locations TEXT[] DEFAULT '{}',
  salary_min NUMERIC DEFAULT 0,
  salary_max NUMERIC DEFAULT 0,
  blocked_keywords TEXT DEFAULT '',
  auto_apply BOOLEAN DEFAULT false,
  ai_refinement BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 简历表 (resumes)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  file_type TEXT,
  file_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 平台表 (platforms)
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('active', 'disconnected')),
  account_info JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 投递日志表 (logs)
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT '',
  platform TEXT DEFAULT '',
  time TEXT DEFAULT '',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'read', 'rejected', 'mismatch')),
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 职位机会表 (opportunities)
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  match_rate NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  logo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 面试表 (interviews)
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  type TEXT DEFAULT 'video' CHECK (type IN ('video', 'onsite')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 自动化任务表 (tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'paused')),
  progress NUMERIC DEFAULT 0,
  applied_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resumes_uid ON resumes(uid);
CREATE INDEX IF NOT EXISTS idx_platforms_uid ON platforms(uid);
CREATE INDEX IF NOT EXISTS idx_logs_uid ON logs(uid);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_uid ON interviews(uid);
CREATE INDEX IF NOT EXISTS idx_tasks_uid ON tasks(uid);
CREATE INDEX IF NOT EXISTS idx_opportunities_match_rate ON opportunities(match_rate DESC);

-- ============================================================
-- RLS (行级安全策略)
-- ============================================================

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的数据" ON users
  FOR ALL USING (auth.uid() = id);

-- resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的简历" ON resumes
  FOR ALL USING (auth.uid() = uid);

-- platforms
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的平台" ON platforms
  FOR ALL USING (auth.uid() = uid);

-- logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的日志" ON logs
  FOR ALL USING (auth.uid() = uid);

-- opportunities（所有认证用户可读）
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "认证用户可读取职位机会" ON opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

-- interviews
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的面试" ON interviews
  FOR ALL USING (auth.uid() = uid);

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的任务" ON tasks
  FOR ALL USING (auth.uid() = uid);

-- ============================================================
-- 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 平台集成增强（v2 迁移）
-- ============================================================

-- 为 platforms 表增加真实连接所需字段
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}';
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS connection_status TEXT DEFAULT 'disconnected';
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS platform_user_name TEXT;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS platform_id TEXT;

-- 岗位搜索结果缓存表
CREATE TABLE IF NOT EXISTS job_search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  job_data JSONB NOT NULL DEFAULT '{}',
  applied BOOLEAN DEFAULT false,
  apply_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_search_uid ON job_search_results(uid);
CREATE INDEX IF NOT EXISTS idx_job_search_platform ON job_search_results(platform_id);

ALTER TABLE job_search_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户只能读写自己的搜索结果" ON job_search_results
  FOR ALL USING (auth.uid() = uid);
