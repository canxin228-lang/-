-- ============================================================
-- 数据库增量迁移：新增简历文件字段 + 平台表结构调整
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- 1. 简历表：新增文件上传相关字段
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- 2. 平台表：新增 account_info JSONB 字段 (替代硬编码列)
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS account_info JSONB DEFAULT '{}';
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- 3. 如果存在旧列，将数据迁移到新的 JSONB 字段
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platforms' AND column_name = 'account'
  ) THEN
    UPDATE platforms
    SET account_info = jsonb_build_object(
      'account', COALESCE(account, ''),
      'logo', COALESCE(logo, '')
    )
    WHERE account_info = '{}' OR account_info IS NULL;
  END IF;
END $$;

-- 4. 放宽 platform_id NOT NULL 约束 (如果存在)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platforms' AND column_name = 'platform_id'
  ) THEN
    ALTER TABLE platforms ALTER COLUMN platform_id DROP NOT NULL;
    ALTER TABLE platforms ALTER COLUMN platform_id SET DEFAULT '';
  END IF;
END $$;

-- 5. 放宽 status CHECK 约束以适应新值
DO $$
BEGIN
  ALTER TABLE platforms DROP CONSTRAINT IF EXISTS platforms_status_check;
  ALTER TABLE platforms ADD CONSTRAINT platforms_status_check 
    CHECK (status IN ('active', 'idle', 'disconnected'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
