import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  type AccountStatus,
  type UserRole,
  buildSlugUsernameFromName,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  normalizeUsername,
} from './authLogic';

export interface DbUserRow {
  id: number;
  username: string;
  full_name: string;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
  is_active: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface SafeUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface AccessRequestRecord {
  id: number;
  fullName: string;
  note: string;
  status: AccountStatus;
  linkedUserId: number | null;
  linkedUsername: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ActivityLogRecord {
  id: number;
  adminId: number | null;
  adminUsername: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  pendingRequests: number;
  rejectedRequests: number;
  approvedUsers: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'app.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    request_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    linked_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_requests_status ON access_requests(status);
  CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at);
`);

export function toSafeUser(row: DbUserRow): SafeUser {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Ensures the primary Admin account exists in SQLite with a salted scrypt password hash.
 * Uses process.env.SEED_ADMIN_USERNAME / process.env.SEED_ADMIN_PASSWORD when explicitly configured,
 * and bootstraps the requested default admin account ('admin' / '123456') only when no admin exists yet.
 * Existing admin password changes made in the Admin Dashboard are preserved across restarts.
 */
export function ensurePrimaryAdmin(): void {
  const adminUsername = normalizeUsername(process.env.SEED_ADMIN_USERNAME || 'admin');
  const envPassword = (process.env.SEED_ADMIN_PASSWORD || '').trim();

  const existingAdmin = db
    .prepare(`SELECT * FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`)
    .get() as DbUserRow | undefined;

  if (!existingAdmin) {
    const initialPassword = envPassword || '123456';
    const ts = nowIso();
    db.prepare(
      `INSERT INTO users (username, full_name, password_hash, role, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 'approved', 1, ?, ?)`
    ).run(adminUsername, 'مدير النظام (Admin)', hashPassword(initialPassword), ts, ts);
  }
}

ensurePrimaryAdmin();

export function findUserByUsername(username: string): DbUserRow | undefined {
  return db
    .prepare(`SELECT * FROM users WHERE lower(username) = lower(?) LIMIT 1`)
    .get(normalizeUsername(username)) as DbUserRow | undefined;
}

export function findUserById(id: number): DbUserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) as DbUserRow | undefined;
}

export function touchUserLogin(userId: number): void {
  db.prepare(`UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?`).run(
    nowIso(),
    nowIso(),
    userId
  );
}

export function listAllUsers(): SafeUser[] {
  const rows = db
    .prepare(`SELECT * FROM users ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id DESC`)
    .all() as DbUserRow[];
  return rows.map(toSafeUser);
}

export function createUserRecord(params: {
  username: string;
  fullName: string;
  password: string;
  status: AccountStatus;
  isActive: boolean;
  role?: UserRole;
}): SafeUser {
  const ts = nowIso();
  const normalized = normalizeUsername(params.username);
  const passwordHash = hashPassword(params.password);
  const role: UserRole = params.role === 'admin' ? 'admin' : 'user';
  const result = db
    .prepare(
      `INSERT INTO users (username, full_name, password_hash, role, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      normalized,
      params.fullName.trim(),
      passwordHash,
      role,
      params.status,
      params.isActive ? 1 : 0,
      ts,
      ts
    );

  const created = findUserById(Number(result.lastInsertRowid));
  if (!created) {
    throw new Error('Failed to retrieve newly created user');
  }
  return toSafeUser(created);
}

export function updateUserRecord(
  userId: number,
  updates: {
    username?: string;
    fullName?: string;
    status?: AccountStatus;
    isActive?: boolean;
  }
): SafeUser | null {
  const existing = findUserById(userId);
  if (!existing) return null;

  const nextUsername = updates.username ? normalizeUsername(updates.username) : existing.username;
  const nextFullName = updates.fullName ? updates.fullName.trim() : existing.full_name;
  const nextStatus = updates.status ?? existing.status;
  const nextActive = updates.isActive === undefined ? existing.is_active : updates.isActive ? 1 : 0;

  db.prepare(
    `UPDATE users
     SET username = ?, full_name = ?, status = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(nextUsername, nextFullName, nextStatus, nextActive, nowIso(), userId);

  const updated = findUserById(userId);
  return updated ? toSafeUser(updated) : null;
}

export function updateUserPassword(userId: number, newPassword: string): boolean {
  const existing = findUserById(userId);
  if (!existing) return false;
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
    hashPassword(newPassword),
    nowIso(),
    userId
  );
  return true;
}

export function deleteUserRecord(userId: number): DbUserRow | null {
  const existing = findUserById(userId);
  if (!existing) return null;
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return existing;
}

// ---------- Sessions ----------

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: number, role: UserRole): { rawToken: string; expiresAt: string } {
  // Prune expired sessions lazily
  db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(nowIso());

  const { rawToken, tokenHash } = generateOpaqueToken();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, role, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(tokenHash, userId, role, createdAt, expiresAt);

  return { rawToken, expiresAt };
}

export function getUserBySessionToken(rawToken: string): DbUserRow | null {
  if (!rawToken || rawToken.length < 32) return null;
  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(
      `SELECT u.*
       FROM sessions s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?
       LIMIT 1`
    )
    .get(tokenHash, nowIso()) as DbUserRow | undefined;
  return row ?? null;
}

export function revokeSessionByToken(rawToken: string): void {
  if (!rawToken) return;
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(rawToken));
}

export function revokeAllUserSessions(userId: number): void {
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

// ---------- Access Requests ----------

interface DbAccessRequestRow {
  id: number;
  full_name: string;
  note: string;
  request_token: string;
  status: AccountStatus;
  linked_user_id: number | null;
  linked_username?: string | null;
  ip_address: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function toAccessRequestRecord(row: DbAccessRequestRow): AccessRequestRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    note: row.note,
    status: row.status,
    linkedUserId: row.linked_user_id,
    linkedUsername: row.linked_username ?? null,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
  };
}

export function createAccessRequest(params: {
  fullName: string;
  note: string;
  ipAddress: string;
}): { record: AccessRequestRecord; requestToken: string } {
  const requestToken = crypto.randomBytes(32).toString('hex');
  const ts = nowIso();
  const res = db
    .prepare(
      `INSERT INTO access_requests (full_name, note, request_token, status, ip_address, created_at)
       VALUES (?, ?, ?, 'pending', ?, ?)`
    )
    .run(params.fullName.trim(), params.note.trim().slice(0, 240), requestToken, params.ipAddress, ts);

  const row = db
    .prepare(`SELECT * FROM access_requests WHERE id = ?`)
    .get(Number(res.lastInsertRowid)) as DbAccessRequestRow;

  return { record: toAccessRequestRecord(row), requestToken };
}

export function listAccessRequests(): AccessRequestRecord[] {
  const rows = db
    .prepare(
      `SELECT ar.*, u.username AS linked_username
       FROM access_requests ar
       LEFT JOIN users u ON u.id = ar.linked_user_id
       ORDER BY CASE WHEN ar.status = 'pending' THEN 0 ELSE 1 END, ar.id DESC`
    )
    .all() as DbAccessRequestRow[];
  return rows.map(toAccessRequestRecord);
}

export function getAccessRequestByToken(requestToken: string): DbAccessRequestRow | undefined {
  if (!requestToken || requestToken.length < 32) return undefined;
  return db
    .prepare(
      `SELECT ar.*, u.username AS linked_username
       FROM access_requests ar
       LEFT JOIN users u ON u.id = ar.linked_user_id
       WHERE ar.request_token = ?
       LIMIT 1`
    )
    .get(requestToken) as DbAccessRequestRow | undefined;
}

export function getAccessRequestById(id: number): DbAccessRequestRow | undefined {
  return db
    .prepare(
      `SELECT ar.*, u.username AS linked_username
       FROM access_requests ar
       LEFT JOIN users u ON u.id = ar.linked_user_id
       WHERE ar.id = ?
       LIMIT 1`
    )
    .get(id) as DbAccessRequestRow | undefined;
}

export function approveAccessRequest(
  requestId: number,
  adminUsername: string
): { record: AccessRequestRecord; requestToken: string; user: SafeUser } | null {
  const reqRow = getAccessRequestById(requestId);
  if (!reqRow) return null;

  let linkedUser: SafeUser | null = null;

  if (reqRow.linked_user_id) {
    linkedUser = updateUserRecord(reqRow.linked_user_id, {
      status: 'approved',
      isActive: true,
    });
  }

  if (!linkedUser) {
    const uniqueSuffix = `${reqRow.id}${crypto.randomBytes(2).toString('hex')}`;
    const generatedUsername = buildSlugUsernameFromName(reqRow.full_name, uniqueSuffix);
    // Random unguessable password; admin can set a custom password anytime from Users Management
    const randomPass = crypto.randomBytes(16).toString('hex');
    linkedUser = createUserRecord({
      username: generatedUsername,
      fullName: reqRow.full_name,
      password: randomPass,
      status: 'approved',
      isActive: true,
      role: 'user',
    });
  }

  db.prepare(
    `UPDATE access_requests
     SET status = 'approved', linked_user_id = ?, reviewed_at = ?, reviewed_by = ?
     WHERE id = ?`
  ).run(linkedUser.id, nowIso(), adminUsername, requestId);

  const updatedRow = getAccessRequestById(requestId);
  if (!updatedRow) return null;
  return {
    record: toAccessRequestRecord(updatedRow),
    requestToken: updatedRow.request_token,
    user: linkedUser,
  };
}

export function rejectAccessRequest(
  requestId: number,
  adminUsername: string
): { record: AccessRequestRecord; requestToken: string; revokedUserId: number | null } | null {
  const reqRow = getAccessRequestById(requestId);
  if (!reqRow) return null;

  let revokedUserId: number | null = null;
  if (reqRow.linked_user_id) {
    updateUserRecord(reqRow.linked_user_id, { status: 'rejected', isActive: false });
    revokeAllUserSessions(reqRow.linked_user_id);
    revokedUserId = reqRow.linked_user_id;
  }

  db.prepare(
    `UPDATE access_requests
     SET status = 'rejected', reviewed_at = ?, reviewed_by = ?
     WHERE id = ?`
  ).run(nowIso(), adminUsername, requestId);

  const updatedRow = getAccessRequestById(requestId);
  if (!updatedRow) return null;
  return {
    record: toAccessRequestRecord(updatedRow),
    requestToken: updatedRow.request_token,
    revokedUserId,
  };
}

// ---------- Activity Logs ----------

export function logAdminActivity(params: {
  adminId: number | null;
  adminUsername: string;
  action: string;
  target: string;
  details?: string;
}): ActivityLogRecord {
  const ts = nowIso();
  const res = db
    .prepare(
      `INSERT INTO activity_logs (admin_id, admin_username, action, target, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(params.adminId, params.adminUsername, params.action, params.target, params.details ?? '', ts);

  return {
    id: Number(res.lastInsertRowid),
    adminId: params.adminId,
    adminUsername: params.adminUsername,
    action: params.action,
    target: params.target,
    details: params.details ?? '',
    createdAt: ts,
  };
}

export function listActivityLogs(limit = 150): ActivityLogRecord[] {
  const rows = db
    .prepare(`SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?`)
    .all(limit) as Array<{
    id: number;
    admin_id: number | null;
    admin_username: string;
    action: string;
    target: string;
    details: string;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    adminId: r.admin_id,
    adminUsername: r.admin_username,
    action: r.action,
    target: r.target,
    details: r.details,
    createdAt: r.created_at,
  }));
}

// ---------- Dashboard Statistics ----------

export function getDashboardStats(): DashboardStats {
  const userCounts = db
    .prepare(
      `SELECT
         COUNT(*) AS total_users,
         SUM(CASE WHEN is_active = 1 AND status = 'approved' THEN 1 ELSE 0 END) AS active_users,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_users,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_users,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_users
       FROM users`
    )
    .get() as {
    total_users: number;
    active_users: number | null;
    approved_users: number | null;
    pending_users: number | null;
    rejected_users: number | null;
  };

  const reqCounts = db
    .prepare(
      `SELECT
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_requests,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_requests
       FROM access_requests`
    )
    .get() as {
    pending_requests: number | null;
    rejected_requests: number | null;
  };

  return {
    totalUsers: userCounts.total_users ?? 0,
    activeUsers: userCounts.active_users ?? 0,
    approvedUsers: userCounts.approved_users ?? 0,
    pendingRequests: reqCounts.pending_requests ?? 0,
    rejectedRequests: (reqCounts.rejected_requests ?? 0) + (userCounts.rejected_users ?? 0),
  };
}
