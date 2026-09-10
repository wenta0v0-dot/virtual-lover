const attemptStore = new Map<
  string,
  { count: number; lastAttempt: number; lockedUntil?: number }
>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_WINDOW = 15 * 60 * 1000;

// 记录的存活上限：锁定中保留到解锁，普通记录保留一个窗口期
const RECORD_TTL = Math.max(LOCKOUT_DURATION, ATTEMPT_WINDOW) * 2;
// 每次清理的间隔，避免高频请求反复全表扫描
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanupAt = Date.now();

function cleanupExpired(now: number): void {
  if (now - lastCleanupAt < CLEANUP_INTERVAL) return;
  lastCleanupAt = now;
  for (const [key, record] of attemptStore) {
    const keepUntil = Math.max(
      record.lastAttempt + RECORD_TTL,
      record.lockedUntil ?? 0,
    );
    if (now > keepUntil) {
      attemptStore.delete(key);
    }
  }
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemaining?: number;
} {
  const now = Date.now();
  cleanupExpired(now);
  const record = attemptStore.get(identifier);

  if (record?.lockedUntil && now < record.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemaining: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (!record || now - record.lastAttempt > ATTEMPT_WINDOW) {
    attemptStore.set(identifier, { count: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION;
    attemptStore.set(identifier, {
      ...record,
      lockedUntil,
    });
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemaining: LOCKOUT_DURATION / 1000,
    };
  }

  record.count++;
  record.lastAttempt = now;
  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - record.count,
  };
}

export function resetRateLimit(identifier: string): void {
  attemptStore.delete(identifier);
}

export function getLockoutInfo(
  identifier: string,
): { isLocked: boolean; remainingSeconds: number } | null {
  const record = attemptStore.get(identifier);
  if (!record?.lockedUntil) return null;

  const now = Date.now();
  if (now >= record.lockedUntil) {
    attemptStore.delete(identifier);
    return null;
  }

  return {
    isLocked: true,
    remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000),
  };
}
