/** 迁移后针对性测试：generate-avatar / image-to-prompt / chat-with-image（全部走智谱） */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const BASE = "http://localhost:5000";

function loadEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const randomPhone = () => "139" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");

async function main() {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  let cookies = "";

  async function req(p, opt = {}) {
    const h = { ...(opt.headers || {}) };
    if (cookies) h["Cookie"] = cookies;
    let b = opt.body;
    if (b && typeof b !== "string" && !(b instanceof FormData)) {
      h["Content-Type"] = "application/json";
      b = JSON.stringify(b);
    }
    const r = await fetch(BASE + p, { method: opt.method || "GET", headers: h, body: b });
    for (const c of r.headers.getSetCookie()) {
      const kv = c.split(";")[0];
      if (kv) {
        const k = kv.split("=")[0];
        cookies = cookies ? cookies.split("; ").filter(x => !x.startsWith(k + "=")).concat(kv).join("; ") : kv;
      }
    }
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  }

  // 登录
  const phone = randomPhone();
  await req("/api/auth/send-code", { method: "POST", body: { phone } });
  const r1 = await pool.query("SELECT code FROM verification_codes WHERE phone=$1 AND used=0 ORDER BY created_at DESC LIMIT 1", [phone]);
  const login = await req("/api/auth/verify-code", { method: "POST", body: { phone, code: r1.rows[0].code } });
  console.log("登录:", login.status === 200 ? "OK" : "FAIL " + login.text);

  // 1. generate-avatar（CogView 生图）
  let t = Date.now();
  let res = await req("/api/generate-avatar", {
    method: "POST",
    body: { appearance: "银色长发的清冷少女，红色眼瞳，穿黑色JK制服", gender: "female", style: "anime" },
  });
  const avatarOk = res.status === 200 && res.json?.imageUrl && /^https?:/.test(res.json.imageUrl);
  console.log(`[${avatarOk ? "PASS" : "FAIL"}] generate-avatar (${((Date.now() - t) / 1000).toFixed(1)}s) status=${res.status}`,
    avatarOk ? "url=" + String(res.json.imageUrl).slice(0, 70) : "resp=" + res.text.slice(0, 150));

  // 2. image-to-prompt（视觉模型图生文）
  const imgPath = path.join(__dirname, "..", "img", "healing-girl.png");
  const dataUrl = "data:image/png;base64," + fs.readFileSync(imgPath).toString("base64");
  t = Date.now();
  res = await req("/api/image-to-prompt", { method: "POST", body: { image: dataUrl } });
  const p = res.json?.prompts;
  const itpOk = res.status === 200 && p && typeof p.appearance === "string" && p.appearance.length > 20 && Array.isArray(p.tags);
  console.log(`[${itpOk ? "PASS" : "FAIL"}] image-to-prompt (${((Date.now() - t) / 1000).toFixed(1)}s) status=${res.status}`,
    itpOk ? `name=${p.name} tags=[${p.tags.slice(0, 4).join(",")}] appearance=${p.appearance.slice(0, 60)}...` : "resp=" + res.text.slice(0, 150));

  // 3. chat-with-image（视觉模型图文聊天）
  const fd = new FormData();
  fd.set("image", new Blob([fs.readFileSync(imgPath)], { type: "image/png" }), "photo.png");
  fd.set("messages", JSON.stringify([{ role: "user", content: "你觉得这张图片里的场景怎么样？" }]));
  fd.set("characterData", JSON.stringify({ name: "温柔学长", systemPrompt: "你是一位温柔体贴的学长，说话亲切自然。", appearance: "" }));
  t = Date.now();
  res = await req("/api/chat-with-image", { method: "POST", body: fd });
  const cwiOk = res.status === 200 && typeof res.json?.reply === "string" && res.json.reply.length > 5;
  console.log(`[${cwiOk ? "PASS" : "FAIL"}] chat-with-image (${((Date.now() - t) / 1000).toFixed(1)}s) status=${res.status}`,
    cwiOk ? "reply=" + res.json.reply.slice(0, 80) : "resp=" + res.text.slice(0, 150));

  await pool.end();
}

main().catch(e => { console.error("异常:", e); process.exit(1); });
