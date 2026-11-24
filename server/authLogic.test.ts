import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SlidingWindowRateLimiter,
  buildSlugUsernameFromName,
  evaluateAccountAccess,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  isValidAccountStatus,
  validateFullName,
  validatePassword,
  validateUsername,
  verifyPassword,
} from './authLogic';

test('hashPassword and verifyPassword use salted scrypt hashes and never store plaintext', () => {
  const hash1 = hashPassword('MySecurePass123');
  const hash2 = hashPassword('MySecurePass123');

  assert.ok(hash1.startsWith('scrypt$'));
  assert.notEqual(hash1, hash2); // Unique salt per hash
  assert.equal(hash1.includes('MySecurePass123'), false);

  assert.equal(verifyPassword('MySecurePass123', hash1), true);
  assert.equal(verifyPassword('MySecurePass123', hash2), true);
  assert.equal(verifyPassword('WrongPass', hash1), false);
  assert.equal(verifyPassword('MySecurePass123', 'plaintext'), false);
});

test('generateOpaqueToken creates unique tokens whose SHA-256 hash matches hashToken', () => {
  const t1 = generateOpaqueToken();
  const t2 = generateOpaqueToken();
  assert.notEqual(t1.rawToken, t2.rawToken);
  assert.equal(hashToken(t1.rawToken), t1.tokenHash);
  assert.equal(t1.rawToken.length, 64);
});

test('evaluateAccountAccess blocks pending, rejected, and disabled users while allowing approved active users', () => {
  assert.equal(
    evaluateAccountAccess({ role: 'user', status: 'pending', is_active: 1 }).allowed,
    false
  );
  assert.equal(
    evaluateAccountAccess({ role: 'user', status: 'pending', is_active: 1 }).code,
    'PENDING'
  );
  assert.equal(
    evaluateAccountAccess({ role: 'user', status: 'rejected', is_active: 1 }).code,
    'REJECTED'
  );
  assert.equal(
    evaluateAccountAccess({ role: 'user', status: 'approved', is_active: 0 }).code,
    'DISABLED'
  );
  assert.equal(
    evaluateAccountAccess({ role: 'user', status: 'approved', is_active: 1 }).allowed,
    true
  );
  assert.equal(
    evaluateAccountAccess({ role: 'admin', status: 'approved', is_active: 1 }).allowed,
    true
  );
  assert.equal(
    evaluateAccountAccess({ role: 'admin', status: 'approved', is_active: 0 }).allowed,
    false
  );
});

test('SlidingWindowRateLimiter blocks after threshold and resets after window or explicit reset', () => {
  const limiter = new SlidingWindowRateLimiter(3, 60_000);
  const t0 = 1_000_000;

  assert.equal(limiter.check('ip:admin', t0).allowed, true);
  limiter.recordAttempt('ip:admin', t0 + 100);
  limiter.recordAttempt('ip:admin', t0 + 200);
  limiter.recordAttempt('ip:admin', t0 + 300);

  const blocked = limiter.check('ip:admin', t0 + 400);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 59);

  // After window expires, allowed again
  assert.equal(limiter.check('ip:admin', t0 + 61_000).allowed, true);

  // Explicit reset clears bucket immediately
  limiter.recordAttempt('ip:user', t0);
  limiter.recordAttempt('ip:user', t0 + 1);
  limiter.recordAttempt('ip:user', t0 + 2);
  assert.equal(limiter.check('ip:user', t0 + 3).allowed, false);
  limiter.reset('ip:user');
  assert.equal(limiter.check('ip:user', t0 + 4).allowed, true);
});

test('validators enforce clean usernames, emails, passwords, names, and statuses', () => {
  assert.equal(validateUsername('Admin').ok, true);
  assert.equal(validateUsername('sara.ahmed@company.com').ok, true);
  assert.equal(validateUsername('ab').ok, false);
  assert.equal(validateUsername('bad user!').ok, false);

  assert.equal(validatePassword('123456').ok, true);
  assert.equal(validatePassword('12345').ok, false);

  assert.equal(validateFullName('أحمد محمود').ok, true);
  assert.equal(validateFullName('A').ok, false);

  assert.equal(isValidAccountStatus('pending'), true);
  assert.equal(isValidAccountStatus('approved'), true);
  assert.equal(isValidAccountStatus('rejected'), true);
  assert.equal(isValidAccountStatus('superadmin'), false);

  assert.equal(buildSlugUsernameFromName('Sarah Ahmed', '1234'), 'sarah.ahmed.1234');
  assert.equal(buildSlugUsernameFromName('محمد علي', '5678'), 'member.5678');
});
