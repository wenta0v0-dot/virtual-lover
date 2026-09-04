-- 修复 character_avatar 字段长度限制
-- 从 10 字符增加到 500 字符以支持完整图片路径

ALTER TABLE chat_sessions 
ALTER COLUMN character_avatar TYPE varchar(500);

-- 验证修改
SELECT column_name, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
AND column_name = 'character_avatar';