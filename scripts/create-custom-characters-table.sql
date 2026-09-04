-- 创建自定义角色表
-- 在 Neon 控制台的 SQL Editor 中执行此脚本

-- 1. 创建 custom_characters 表
CREATE TABLE IF NOT EXISTS custom_characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    tags JSONB DEFAULT '[]'::jsonb,
    avatar VARCHAR(10) DEFAULT '🎭',
    avatar_image VARCHAR(500),
    gender VARCHAR(10) DEFAULT 'female',
    appearance TEXT,
    system_prompt TEXT NOT NULL,
    greeting TEXT NOT NULL,
    color VARCHAR(7) DEFAULT '#FFB6C1',
    status VARCHAR(200),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. 为 chat_sessions 表添加 is_custom 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' 
        AND column_name = 'is_custom'
    ) THEN
        ALTER TABLE chat_sessions ADD COLUMN is_custom BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- 3. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_custom_characters_user_id ON custom_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_characters_is_active ON custom_characters(is_active);

-- 4. 验证表创建成功
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'custom_characters'
ORDER BY ordinal_position;

-- 完成！
-- 现在你可以使用自定义角色功能了