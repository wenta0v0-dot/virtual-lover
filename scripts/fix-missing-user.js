require("dotenv").config({ path: ".env.local" });

const { Pool } = require("pg");

async function fixMissingUser() {
  console.log("🔧 修复缺失的用户记录\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 检查用户是否存在
    const checkResult = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      ["ww@qq.com"],
    );

    if (checkResult.rows.length > 0) {
      console.log("✅ 用户已存在:", checkResult.rows[0]);
      return;
    }

    console.log("⚠️  用户不存在，正在创建...");

    // 创建用户记录
    const insertResult = await pool.query(
      `INSERT INTO users (email, name, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       RETURNING id, email, name, created_at`,
      ["ww@qq.com", "测试用户"],
    );

    console.log("✅ 用户创建成功:", insertResult.rows[0]);

    // 验证创建结果
    const verifyResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["ww@qq.com"],
    );
    console.log("\n📋 当前用户记录:");
    console.log(verifyResult.rows[0]);
  } catch (error) {
    console.error("❌ 错误:", error.message);
    if (error.code === "23505") {
      console.error("   提示: 用户邮箱已存在（唯一约束冲突）");
    }
  } finally {
    await pool.end();
  }
}

fixMissingUser();
