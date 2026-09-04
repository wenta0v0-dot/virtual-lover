const devStore = new Map<string, { code: string; expiresAt: number }>();

export function isDevMode(): boolean {
  return process.env.DEV_MODE === "true";
}

export function generateDevCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  devStore.set(email, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return code;
}

export function verifyDevCode(email: string, code: string): boolean {
  const record = devStore.get(email);
  if (!record) return false;
  if (record.code !== code) return false;
  if (Date.now() > record.expiresAt) return false;
  devStore.delete(email);
  return true;
}

export function getDevCode(email: string): string | null {
  const record = devStore.get(email);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    devStore.delete(email);
    return null;
  }
  return record.code;
}
