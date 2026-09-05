import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.AUTH_SECRET;
const key = secretKey ? new TextEncoder().encode(secretKey) : null;

export async function encrypt(payload: Record<string, unknown>) {
  if (!key) throw new Error("AUTH_SECRET 环境变量未设置");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(token: string) {
  if (!key) throw new Error("AUTH_SECRET 环境变量未设置");
  const { payload } = await jwtVerify(token, key, {
    clockTolerance: 60,
  });
  return payload;
}

export async function createSession(userId: number, email: string) {
  const token = await encrypt({ userId, email });
  console.log("[Auth] 创建session，token长度:", token.length);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    // HTTPS deployments must never send the session cookie over plain HTTP.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  console.log("[Auth] Cookie已设置");
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  try {
    const payload = await decrypt(token);
    return payload as { userId: number; email: string };
  } catch (e) {
    console.log("[Auth] 解密失败:", e);
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const { getDb } = await import("@/db");
  const { users } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = getDb();

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user[0] || null;
}
