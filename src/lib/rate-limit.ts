const attemptStore = new Map<
  string,
  { count: number; lastAttempt: number; lockedUntil?: number }
>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_WINDOW = 15 * 60 * 1000;

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemaining?: number;
} {
  const now = Date.now();
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
