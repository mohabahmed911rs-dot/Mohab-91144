import crypto from 'node:crypto';

export type UserRole = 'admin' | 'user';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

const SCRYPT_KEYLEN = 64;

/**
 * Hashes a plaintext password using scrypt with a unique random 16-byte salt.
 * Output format: scrypt$<saltHex>$<derivedKeyHex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);
    if (expected.length !== actual.length) return false;
    return crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Generates an opaque 32-byte cryptographically random token and its SHA-256 digest.
 */
export function generateOpaqueToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const normalized = normalizeUsername(input);
  if (normalized.length < 3 || normalized.length > 80) {
    return { ok: false, error: 'اسم المستخدم أو البريد يجب أن يكون بين 3 و 80 حرفاً.' };
  }
  if (!/^[a-z0-9._@+-]+$/i.test(normalized)) {
    return {
      ok: false,
      error: 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام أو الرموز (. _ @ + -) فقط.',
    };
  }
  return { ok: true, value: normalized };
}

export function validatePassword(
  password: string,
  minLength = 6
): { ok: true } | { ok: false; error: string } {
  if (typeof password !== 'string' || password.length < minLength || password.length > 128) {
    return {
      ok: false,
      error: `كلمة المرور يجب أن تكون بين ${minLength} و 128 حرفاً.`,
    };
  }
  return { ok: true };
}

export function validateFullName(input: string): { ok: true; value: string } | { ok: false; error: string } {
  const cleaned = input.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2 || cleaned.length > 100) {
    return { ok: false, error: 'الاسم الكامل يجب أن يكون بين حرفين و 100 حرف.' };
  }
  return { ok: true, value: cleaned };
}

export function isValidAccountStatus(value: unknown): value is AccountStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected';
}

export interface AccessCheckResult {
  allowed: boolean;
  code: 'OK' | 'PENDING' | 'REJECTED' | 'DISABLED';
  message: string;
}

/**
 * Evaluates whether a user account is allowed to enter the system.
 * Admin is always checked for active status; normal users must be BOTH approved AND active.
 */
export function evaluateAccountAccess(account: {
  role: UserRole;
  status: AccountStatus;
  is_active: number | boolean;
}): AccessCheckResult {
  const active = Boolean(account.is_active);
  if (!active) {
    return {
      allowed: false,
      code: 'DISABLED',
      message: 'تم تعطيل حسابك من قِبل المدير. يرجى التواصل مع الإدارة.',
    };
  }
  if (account.role === 'admin') {
    return { allowed: true, code: 'OK', message: 'تم تسجيل دخول المدير بنجاح.' };
  }
  if (account.status === 'pending') {
    return {
      allowed: false,
      code: 'PENDING',
      message: 'حسابك قيد المراجعة وبانتظار موافقة المدير قبل السماح بالدخول.',
    };
  }
  if (account.status === 'rejected') {
    return {
      allowed: false,
      code: 'REJECTED',
      message: 'تم رفض طلب الوصول الخاص بك ولا يمكنك الدخول إلى النظام.',
    };
  }
  return { allowed: true, code: 'OK', message: 'تم تسجيل الدخول بنجاح.' };
}

interface RateLimitBucket {
  timestamps: number[];
}

/**
 * Sliding-window in-memory rate limiter for protecting login and request endpoints
 * against repeated brute-force attempts.
 */
export class SlidingWindowRateLimiter {
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(maxAttempts: number, windowMs: number) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  check(key: string, now = Date.now()): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const cutoff = now - this.windowMs;
    const bucket = this.buckets.get(key);
    const recent = bucket ? bucket.timestamps.filter((ts) => ts > cutoff) : [];

    if (recent.length >= this.maxAttempts) {
      const oldest = recent[0] ?? now;
      const retryAfterMs = Math.max(1000, oldest + this.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, this.maxAttempts - recent.length),
      retryAfterSeconds: 0,
    };
  }

  recordAttempt(key: string, now = Date.now()): void {
    const cutoff = now - this.windowMs;
    const existing = this.buckets.get(key)?.timestamps.filter((ts) => ts > cutoff) ?? [];
    existing.push(now);
    this.buckets.set(key, { timestamps: existing });
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}

/**
 * Generates a unique, clean ASCII username slug for an approved access requester
 * who only submitted their full name.
 */
export function buildSlugUsernameFromName(fullName: string, suffix: string): string {
  const ascii = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 20);
  const base = ascii.length >= 3 ? ascii : 'member';
  return `${base}.${suffix}`;
}
