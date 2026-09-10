/**
 * 全量 API 功能测试脚本
 * 用法: node scripts/full-api-test.js [--skip-media] [--skip-chat]
 * 依赖: 项目内 pg（读取 .env.local 的 DATABASE_URL 查询验证码）
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { Pool } = require("pg");

const BASE = "http://localhost:5000";
const results = [];
let pool = null;

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} ${name}${detail ? "  -- " + detail : ""}`);
}

function makeClient() {
  let cookies = "";
  const client = async function request(pathname, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (cookies) headers["Cookie"] = cookies;
    let body = options.body;
    if (body && !(body instanceof FormData) && typeof body !== "string") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    const res = await fetch(BASE + pathname, {
      method: options.method || "GET",
      headers,
      body,
      redirect: "manual",
    });
    const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of setCookie) {
      const kv = c.split(";")[0];
      if (kv && !kv.startsWith("=")) {
        cookies = cookies
          ? cookies
              .split("; ")
              .filter((x) => !x.startsWith(kv.split("=")[0] + "="))
              .concat(kv)
              .join("; ")
          : kv;
      }
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text, headers: res.headers, raw: res };
  };
  client.getCookies = () => cookies;
  return client;
}

const randomPhone = () =>
  "139" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");

async function getLatestCode(phone) {
  const r = await pool.query(
    "SELECT code FROM verification_codes WHERE phone=$1 AND used=0 ORDER BY created_at DESC LIMIT 1",
    [phone],
  );
  return r.rows[0] ? r.rows[0].code : null;
}

/* 生成最小合法 PNG（纯色 64x64），用于上传/图生文测试 */
function makeTinyPng(r = 200, g = 120, b = 90) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(64, 0);
  ihdr.writeUInt32BE(64, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(64 * 3)]);
  for (let i = 0; i < 64 * 3; i += 3) {
    row[1 + i] = r;
    row[2 + i] = g;
    row[3 + i] = b;
  }
  const raw = Buffer.concat(Array.from({ length: 64 }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* 流式请求：返回原始 Response 供 SSE 读取 */
async function streamRequest(client, pathname, body) {
  const cookies = client.getCookies();
  return fetch(BASE + pathname, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies && { Cookie: cookies }),
    },
    body: JSON.stringify(body),
  });
}

async function readSSE(res, maxMs = 90000) {
  const start = Date.now();
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let sseEvents = 0;
  while (Date.now() - start < maxMs) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    sseEvents += (chunk.match(/^data:/gm) || []).length;
    text += chunk;
    if (text.includes("[DONE]") || text.includes("__END__")) break;
  }
  try {
    reader.cancel();
  } catch {}
  return { text, sseEvents };
}

async function testPages() {
  console.log("\n========== A. 页面加载 ==========");
  const pages = ["/", "/login", "/history", "/create-character", "/profile"];
  for (const p of pages) {
    const res = await fetch(BASE + p);
    const html = await res.text();
    const ok = res.status === 200 && html.includes("虚拟恋人");
    record(`页面 ${p}`, ok, `status=${res.status}, len=${html.length}`);
  }
}

async function testAuth() {
  console.log("\n========== B. 认证流程 ==========");
  const anon = makeClient();

  // 未登录访问 me
  let res = await anon("/api/auth/me");
  record("未登录访问 /api/auth/me 应 401", res.status === 401, `status=${res.status}`);

  // 非法手机号
  res = await anon("/api/auth/send-code", { method: "POST", body: { phone: "123" } });
  record("send-code 非法手机号应 400", res.status === 400, `status=${res.status} ${res.text.slice(0, 80)}`);

  // ===== 短信验证码登录（主流程）=====
  const phoneA = randomPhone();
  res = await anon("/api/auth/send-code", { method: "POST", body: { phone: phoneA } });
  record(
    `send-code 发送验证码 (${phoneA})`,
    res.status === 200 && res.json?.success,
    `status=${res.status} ${res.text.slice(0, 80)}`,
  );

  const codeA = await getLatestCode(phoneA);
  record("验证码已入库（可查）", Boolean(codeA), codeA ? `code=${codeA}` : "未查到");

  res = await anon("/api/auth/verify-code", {
    method: "POST",
    body: { phone: phoneA, code: "000000" },
  });
  record("verify-code 错误验证码应 400", res.status === 400, `status=${res.status}`);

  res = await anon("/api/auth/verify-code", {
    method: "POST",
    body: { phone: phoneA, code: codeA },
  });
  record(
    "verify-code 正确验证码登录",
    res.status === 200 && res.json?.success,
    `status=${res.status} user=${JSON.stringify(res.json?.user || {})}`,
  );

  res = await anon("/api/auth/me");
  record(
    "登录后 /api/auth/me 返回用户",
    res.status === 200 && res.json?.user?.phone === phoneA,
    `status=${res.status} ${res.text.slice(0, 120)}`,
  );

  res = await anon("/api/auth/logout", { method: "POST" });
  record("logout 退出登录", res.status === 200, `status=${res.status}`);
  res = await anon("/api/auth/me");
  record("退出后 me 应 401", res.status === 401, `status=${res.status}`);

  // ===== 密码注册 + 密码登录（注册要求上传头像文件）=====
  const phoneB = randomPhone();
  await anon("/api/auth/send-code", { method: "POST", body: { phone: phoneB } });
  const codeB = await getLatestCode(phoneB);
  const pngReg = makeTinyPng(120, 160, 220);
  const fd = new FormData();
  fd.set("phone", phoneB);
  fd.set("nickname", "测试用户AB");
  fd.set("password", "test123456");
  fd.set("code", codeB || "000000");
  fd.set("avatar", new Blob([pngReg], { type: "image/png" }), "avatar.png");
  res = await anon("/api/auth/register", { method: "POST", body: fd });
  record(
    `register 密码注册 (${phoneB})`,
    res.status === 200 && res.json?.success,
    `status=${res.status} ${res.text.slice(0, 100)}`,
  );
  res = await anon("/api/auth/me");
  record("注册后自动登录 me", res.status === 200, `status=${res.status}`);
  await anon("/api/auth/logout", { method: "POST" });

  res = await anon("/api/auth/login-password", {
    method: "POST",
    body: { phone: phoneB, password: "test123456" },
  });
  record("login-password 正确密码登录", res.status === 200 && res.json?.success, `status=${res.status}`);

  res = await anon("/api/auth/login-password", {
    method: "POST",
    body: { phone: phoneB, password: "wrong-password" },
  });
  record("login-password 错误密码应 401/400", res.status === 401 || res.status === 400, `status=${res.status}`);

  // 重复注册应 409（需真实验证码才会走到查重分支）
  await anon("/api/auth/send-code", { method: "POST", body: { phone: phoneA } });
  const codeA2 = await getLatestCode(phoneA);
  const fd2 = new FormData();
  fd2.set("phone", phoneA);
  fd2.set("nickname", "重复注册");
  fd2.set("password", "test123456");
  fd2.set("code", codeA2 || "123456");
  fd2.set("avatar", new Blob([pngReg], { type: "image/png" }), "avatar.png");
  res = await anon("/api/auth/register", { method: "POST", body: fd2 });
  record("register 已注册手机号应 409", res.status === 409, `status=${res.status} ${res.text.slice(0, 80)}`);

  return { phoneA, phoneB };
}

async function testCharacters() {
  console.log("\n========== C. 自定义角色 ==========");
  const c = makeClient();
  const phone = randomPhone();
  await c("/api/auth/send-code", { method: "POST", body: { phone } });
  const code = await getLatestCode(phone);
  await c("/api/auth/verify-code", {
    method: "POST",
    body: { phone, code },
  });

  let res = await c("/api/characters/custom", {
    method: "POST",
    body: {
      name: "自动化测试角色" + Math.floor(Math.random() * 1000),
      systemPrompt: "你是一个用于自动化测试的角色",
      greeting: "你好，我是测试角色",
      avatar: "🤖",
      description: "测试用角色",
    },
  });
  const createdId = res.json?.character?.id || res.json?.id;
  record(
    "创建自定义角色",
    res.status === 200 && Boolean(createdId),
    `status=${res.status} id=${createdId}`,
  );

  res = await c("/api/characters/custom");
  const listOk = res.status === 200 && JSON.stringify(res.json || {}).includes("自动化测试角色");
  record("查询自定义角色列表", listOk, `status=${res.status} count=${Array.isArray(res.json) ? res.json.length : Object.keys(res.json || {}).length}`);

  if (createdId) {
    // 前端约定：id 带 custom- 前缀，删除时去掉前缀（见 MyVirtualLovers.tsx:55）
    const numericId = String(createdId).replace("custom-", "");
    res = await c(`/api/characters/${numericId}`, { method: "DELETE" });
    record("删除自定义角色", res.status === 200, `status=${res.status} ${res.text.slice(0, 80)}`);
  }
}

async function testChat() {
  console.log("\n========== D. AI 聊天（真实调用智谱AI）==========");
  const c = makeClient();
  const phone = randomPhone();
  await c("/api/auth/send-code", { method: "POST", body: { phone } });
  const code = await getLatestCode(phone);
  await c("/api/auth/verify-code", { method: "POST", body: { phone, code } });

  const raw = await streamRequest(c, "/api/chat", {
    messages: [
      { role: "user", content: "你好呀，请用不超过20个字介绍你自己" },
    ],
    characterId: "gentle-senpai",
    characterName: "温柔学长",
    characterAvatar: "",
  });
  if (raw.status !== 200) {
    const errText = await raw.text().catch(() => "");
    record("AI 聊天流式响应", false, `status=${raw.status} ${errText.slice(0, 150)}`);
    return;
  }
  const ct = raw.headers.get("content-type") || "";
  const isSSE = ct.includes("text/event-stream");
  const { text, sseEvents } = await readSSE(raw);
  const hasContent = text.length > 50 && sseEvents > 0;
  record(
    "AI 聊天流式响应 (SSE)",
    isSSE && hasContent,
    `status=${raw.status} sseEvents=${sseEvents} bytes=${text.length} 预览:${text.replace(/^data:/gm, "").replace(/\n/g, " ").slice(0, 60)}`,
  );
  return { phone };
}

async function testUserApis() {
  console.log("\n========== E. 历史/设置/体验统计 ==========");
  const c = makeClient();
  const phone = randomPhone();
  await c("/api/auth/send-code", { method: "POST", body: { phone } });
  const code = await getLatestCode(phone);
  await c("/api/auth/verify-code", { method: "POST", body: { phone, code } });

  let res = await c("/api/history");
  record(
    "GET /api/history",
    res.status === 200,
    `status=${res.status} 预览:${res.text.slice(0, 100)}`,
  );

  res = await c("/api/user-settings");
  record("GET /api/user-settings", res.status === 200, `status=${res.status}`);

  res = await c("/api/user-settings", {
    method: "PUT",
    body: { name: "测试昵称" + Math.floor(Math.random() * 1000) },
  });
  record("PUT /api/user-settings 修改昵称", res.status === 200, `status=${res.status} ${res.text.slice(0, 80)}`);

  res = await c("/api/user-settings", {
    method: "PUT",
    body: { avatar: "data:image/png;base64,AAAA" },
  });
  record(
    "PUT /api/user-settings base64头像应拒绝(400)",
    res.status === 400,
    `status=${res.status} ${res.text.slice(0, 80)}`,
  );

  res = await c("/api/user-experience");
  record("GET /api/user-experience", res.status === 200, `status=${res.status} 预览:${res.text.slice(0, 100)}`);
}

async function testMedia() {
  console.log("\n========== F. 媒体功能（真实调用AI）==========");
  const c = makeClient();
  const phone = randomPhone();
  await c("/api/auth/send-code", { method: "POST", body: { phone } });
  const code = await getLatestCode(phone);
  await c("/api/auth/verify-code", { method: "POST", body: { phone, code } });

  // 1. TTS 路由已删除（原空目录死代码），应保持 404
  let res = await fetch(BASE + "/api/tts", { method: "POST" });
  record(
    "POST /api/tts 已删除应 404",
    res.status === 404,
    `status=${res.status}`,
  );

  // 2. 头像上传
  const png = makeTinyPng();
  const fd = new FormData();
  fd.set("avatar", new Blob([png], { type: "image/png" }), "test.png");
  res = await c("/api/upload/avatar", { method: "POST", body: fd });
  const uploadedUrl = res.json?.url || res.json?.avatarUrl;
  record(
    "上传头像 /api/upload/avatar",
    res.status === 200 && Boolean(uploadedUrl),
    `status=${res.status} url=${uploadedUrl || res.text.slice(0, 80)}`,
  );

  // 3. 图生文（image-to-prompt）
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  res = await c("/api/image-to-prompt", {
    method: "POST",
    body: { image: dataUrl },
    });
  record(
    "图生文 /api/image-to-prompt",
    res.status === 200 && Boolean(res.json?.prompts),
    `status=${res.status} prompts=${Array.isArray(res.json?.prompts) ? res.json.prompts.length : typeof res.json?.prompts}`,
  );

  // 4. AI 生成头像（generate-avatar）
  res = await c("/api/generate-avatar", {
    method: "POST",
    body: { appearance: "棕色长发的温柔女孩", gender: "female", style: "anime" },
  });
  const avatarOk = res.status === 200 && /http|data:/.test(JSON.stringify(res.json || {}).slice(0, 2000));
  record(
    "AI 生成头像 /api/generate-avatar",
    avatarOk,
    `status=${res.status} 预览:${res.text.slice(0, 100)}`,
  );

  // 5. AI 生成图片（generate-image）
  res = await c("/api/generate-image", {
    method: "POST",
    body: { prompt: "一只在阳光下打盹的橘猫，清新插画风格" },
  });
  const imgOk = res.status === 200 && /http|data:image/.test(res.text.slice(0, 3000));
  record(
    "AI 生成图片 /api/generate-image",
    imgOk,
    `status=${res.status} 预览:${res.text.slice(0, 100)}`,
  );

  // 6. 图文聊天（chat-with-image）
  const fd2 = new FormData();
  fd2.set("image", new Blob([png], { type: "image/png" }), "photo.png");
  fd2.set(
    "messages",
    JSON.stringify([{ role: "user", content: "看看这张图片" }]),
  );
  fd2.set(
    "characterData",
    JSON.stringify({ name: "温柔学长", systemPrompt: "你是一位温柔体贴的学长。" }),
  );
  const cookies = c.getCookies();
  const raw = await fetch(BASE + "/api/chat-with-image", {
    method: "POST",
    headers: { ...(cookies && { Cookie: cookies }) },
    body: fd2,
  });
  if (raw.status === 200) {
    const ct = raw.headers.get("content-type") || "";
    if (ct.includes("event-stream")) {
      const { text, sseEvents } = await readSSE(raw, 120000);
      record(
        "图文聊天 /api/chat-with-image (SSE)",
        sseEvents > 0 && text.length > 30,
        `sseEvents=${sseEvents} bytes=${text.length} 预览:${text.replace(/^data:/gm, "").replace(/\n/g, " ").slice(0, 60)}`,
      );
    } else {
      const body = await raw.text();
      record("图文聊天 /api/chat-with-image", true, `JSON响应: ${body.slice(0, 100)}`);
    }
  } else {
    const body = await raw.text().catch(() => "");
    record("图文聊天 /api/chat-with-image", false, `status=${raw.status} ${body.slice(0, 120)}`);
  }
}

async function main() {
  const skipMedia = process.argv.includes("--skip-media");
  const skipChat = process.argv.includes("--skip-chat");
  const onlyAI = process.argv.includes("--only-ai");
  const env = loadEnv();
  pool = new Pool({ connectionString: env.DATABASE_URL });

  console.log(`目标服务器: ${BASE}`);
  console.time("总耗时");

  if (!onlyAI) {
    await testPages();
    await testAuth();
    await testCharacters();
    await testUserApis();
  }
  if (!skipChat) await testChat();
  if (!skipMedia) await testMedia();

  console.timeEnd("总耗时");
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n========== 结果汇总: ${passed}/${results.length} 通过 ==========`);
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log("失败项:");
    for (const f of failed) console.log(`  ❌ ${f.name} -- ${f.detail}`);
  }
  await pool.end();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error("测试脚本异常:", e);
  try { await pool.end(); } catch {}
  process.exit(2);
});
