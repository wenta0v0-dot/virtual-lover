const devStore = new Map<string, { code: string; expiresAt: number }>();

export function isDevMode(): boolean {
  return process.env.DEV_MODE === "true";
}

export function generateDevCode(identifier: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  devStore.set(identifier, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return code;
}

export function verifyDevCode(identifier: string, code: string): boolean {
  const record = devStore.get(identifier);
  if (!record) return false;
  if (record.code !== code) return false;
  if (Date.now() > record.expiresAt) return false;
  devStore.delete(identifier);
  return true;
}

export function getDevCode(identifier: string): string | null {
  const record = devStore.get(identifier);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    devStore.delete(identifier);
    return null;
  }
  return record.code;
}
