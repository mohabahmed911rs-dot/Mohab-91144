import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import {
  SlidingWindowRateLimiter,
  evaluateAccountAccess,
  isValidAccountStatus,
  normalizeUsername,
  validateFullName,
  validatePassword,
  validateUsername,
  verifyPassword,
} from './server/authLogic';
import {
  type DbUserRow,
  approveAccessRequest,
  createAccessRequest,
  createSession,
  createUserRecord,
  deleteUserRecord,
  findUserById,
  findUserByUsername,
  getAccessRequestByToken,
  getDashboardStats,
  getUserBySessionToken,
  listAccessRequests,
  listActivityLogs,
  listAllUsers,
  logAdminActivity,
  rejectAccessRequest,
  revokeAllUserSessions,
  revokeSessionByToken,
  toSafeUser,
  touchUserLogin,
  updateUserPassword,
  updateUserRecord,
} from './server/db';

const PORT = Number(process.env.PORT) || 3000;
const SESSION_COOKIE_NAME = 'cv_studio_sid';

const loginRateLimiter = new SlidingWindowRateLimiter(5, 60_000);
const requestRateLimiter = new SlidingWindowRateLimiter(10, 60_000);

interface AuthenticatedRequest extends Request {
  authUser?: DbUserRow;
  authToken?: string;
  authViaCookieOnly?: boolean;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = decodeURIComponent(val);
  }
  return result;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isHttpsRequest(req: Request): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string') {
    return proto.split(',')[0].trim().toLowerCase() === 'https';
  }
  return false;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const secure = isHttpsRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${7 * 24 * 60 * 60}`,
  ];
  if (secure) {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: Request, res: Response): void {
  const secure = isHttpsRequest(req);
  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Max-Age=0'];
  if (secure) {
    parts.push('SameSite=None', 'Secure', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function extractSessionToken(req: Request): { token: string | null; viaCookieOnly: boolean } {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return { token: bearer, viaCookieOnly: false };
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) return { token: cookieToken, viaCookieOnly: true };
  return { token: null, viaCookieOnly: false };
}

function verifyCsrfForCookieMutation(req: Request): boolean {
  const xrw = req.headers['x-requested-with'];
  if (typeof xrw === 'string' && xrw.toLowerCase() === 'xmlhttprequest') {
    return true;
  }
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function attachSession(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const { token, viaCookieOnly } = extractSessionToken(req);
  if (token) {
    const user = getUserBySessionToken(token);
    if (user) {
      const access = evaluateAccountAccess(user);
      if (access.allowed) {
        req.authUser = user;
        req.authToken = token;
        req.authViaCookieOnly = viaCookieOnly;
      } else {
        // Account was revoked/disabled/rejected after session creation
        revokeSessionByToken(token);
      }
    }
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول للمتابعة.' });
    return;
  }
  if (
    req.authViaCookieOnly &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase()) &&
    !verifyCsrfForCookieMutation(req)
  ) {
    res.status(403).json({ error: 'طلب غير مصرح به (تحقق الأمان).' });
    return;
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول بحساب المدير للمتابعة.' });
    return;
  }
  if (
    req.authViaCookieOnly &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase()) &&
    !verifyCsrfForCookieMutation(req)
  ) {
    res.status(403).json({ error: 'طلب غير مصرح به (تحقق الأمان).' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'صلاحية مرفوضة: هذه الوظيفة مخصصة للمدير فقط.' });
    return;
  }
  next();
}

// ---------- Real-Time WebSocket Hub ----------

const adminSockets = new Set<WebSocket>();
const userSockets = new Map<number, Set<WebSocket>>();
const requestSockets = new Map<string, Set<WebSocket>>();

function sendWsJson(ws: WebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToAdmins(payload: Record<string, unknown>): void {
  for (const ws of adminSockets) {
    sendWsJson(ws, payload);
  }
}

function notifyUserSockets(userId: number, payload: Record<string, unknown>): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const ws of sockets) {
    sendWsJson(ws, payload);
  }
}

function notifyRequestSockets(requestToken: string, payload: Record<string, unknown>): void {
  const sockets = requestSockets.get(requestToken);
  if (!sockets) return;
  for (const ws of sockets) {
    sendWsJson(ws, payload);
  }
}

function broadcastAdminStateRefresh(extraEvent?: Record<string, unknown>): void {
  if (extraEvent) {
    broadcastToAdmins(extraEvent);
  }
  broadcastToAdmins({
    type: 'admin:stats',
    stats: getDashboardStats(),
  });
}

// ---------- Express App Setup ----------

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use('/api', attachSession);

// Prevent caching of sensitive API responses
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

// ---------- Public & Auth Routes ----------

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.authUser) {
    res.json({ authenticated: false, user: null });
    return;
  }
  res.json({
    authenticated: true,
    user: toSafeUser(req.authUser),
    sessionToken: req.authToken,
  });
});

app.post('/api/auth/login', (req: AuthenticatedRequest, res: Response) => {
  const ip = getClientIp(req);
  const rawUsername = typeof req.body?.username === 'string' ? req.body.username : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

  const normalized = normalizeUsername(rawUsername);
  const rateKey = `${ip}:${normalized || 'empty'}`;

  const rateCheck = loginRateLimiter.check(rateKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `تم تجاوز عدد محاولات الدخول المسموح بها. يرجى الانتظار ${rateCheck.retryAfterSeconds} ثانية والمحاولة مجدداً.`,
      code: 'RATE_LIMITED',
      retryAfterSeconds: rateCheck.retryAfterSeconds,
    });
    return;
  }

  if (!normalized || !rawPassword) {
    loginRateLimiter.recordAttempt(rateKey);
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
    return;
  }

  const user = findUserByUsername(normalized);
  if (!user || !verifyPassword(rawPassword, user.password_hash)) {
    loginRateLimiter.recordAttempt(rateKey);
    res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    return;
  }

  const access = evaluateAccountAccess(user);
  if (!access.allowed) {
    res.status(403).json({
      error: access.message,
      code: access.code,
      status: user.status,
      isActive: user.is_active === 1,
    });
    return;
  }

  loginRateLimiter.reset(rateKey);
  touchUserLogin(user.id);
  const { rawToken } = createSession(user.id, user.role);
  setSessionCookie(req, res, rawToken);

  if (user.role === 'admin') {
    logAdminActivity({
      adminId: user.id,
      adminUsername: user.username,
      action: 'تسجيل دخول المدير',
      target: user.username,
      details: 'تم تسجيل الدخول إلى لوحة التحكم',
    });
  }

  const fresh = findUserById(user.id) ?? user;
  res.json({
    authenticated: true,
    user: toSafeUser(fresh),
    sessionToken: rawToken,
  });
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.authToken) {
    revokeSessionByToken(req.authToken);
  }
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

// ---------- First-Time Access Request Flow ----------

app.post('/api/access-requests', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const rateCheck = requestRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: `تم إرسال عدد كبير من الطلبات. يرجى الانتظار ${rateCheck.retryAfterSeconds} ثانية.`,
    });
    return;
  }

  const rawName = typeof req.body?.fullName === 'string' ? req.body.fullName : '';
  const rawNote = typeof req.body?.note === 'string' ? req.body.note : '';

  const nameValidation = validateFullName(rawName);
  if (!nameValidation.ok) {
    res.status(400).json({ error: nameValidation.error });
    return;
  }

  requestRateLimiter.recordAttempt(ip);
  const { record, requestToken } = createAccessRequest({
    fullName: nameValidation.value,
    note: rawNote,
    ipAddress: ip,
  });

  // Notify connected Admin Dashboards in real time!
  broadcastAdminStateRefresh({
    type: 'request:created',
    request: record,
  });

  res.status(201).json({
    request: record,
    requestToken,
  });
});

app.get('/api/access-requests/:token/status', (req: Request, res: Response) => {
  const token = String(req.params.token || '');
  const row = getAccessRequestByToken(token);
  if (!row) {
    res.status(404).json({ error: 'لم يتم العثور على طلب الوصول.' });
    return;
  }
  res.json({
    id: row.id,
    fullName: row.full_name,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  });
});

app.post('/api/access-requests/:token/enter', (req: Request, res: Response) => {
  const token = String(req.params.token || '');
  const row = getAccessRequestByToken(token);
  if (!row) {
    res.status(404).json({ error: 'طلب الوصول غير صالح.' });
    return;
  }
  if (row.status !== 'approved' || !row.linked_user_id) {
    res.status(403).json({
      error:
        row.status === 'rejected'
          ? 'تم رفض طلب الوصول الخاص بك.'
          : 'طلبك ما زال بانتظار موافقة المدير.',
      status: row.status,
    });
    return;
  }

  const user = findUserById(row.linked_user_id);
  if (!user) {
    res.status(403).json({ error: 'تم حذف الحساب المرتبط بهذا الطلب.' });
    return;
  }

  const access = evaluateAccountAccess(user);
  if (!access.allowed) {
    res.status(403).json({ error: access.message, code: access.code });
    return;
  }

  touchUserLogin(user.id);
  const { rawToken } = createSession(user.id, user.role);
  setSessionCookie(req, res, rawToken);

  const fresh = findUserById(user.id) ?? user;
  res.json({
    authenticated: true,
    user: toSafeUser(fresh),
    sessionToken: rawToken,
  });
});

// Explicitly verify authenticated user route (and block any attempt by regular users to mutate passwords)
app.get('/api/user/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: toSafeUser(req.authUser!) });
});

// ---------- Admin-Only Protected Routes ----------

app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    stats: getDashboardStats(),
    users: listAllUsers(),
    requests: listAccessRequests(),
    logs: listActivityLogs(100),
  });
});

app.get('/api/admin/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ users: listAllUsers(), stats: getDashboardStats() });
});

app.post('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const rawUsername = typeof req.body?.username === 'string' ? req.body.username : '';
  const rawFullName = typeof req.body?.fullName === 'string' ? req.body.fullName : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const rawStatus = req.body?.status ?? 'approved';
  const isActive = req.body?.isActive !== false;

  const usernameCheck = validateUsername(rawUsername);
  if (!usernameCheck.ok) {
    res.status(400).json({ error: usernameCheck.error });
    return;
  }

  const nameCheck = validateFullName(rawFullName);
  if (!nameCheck.ok) {
    res.status(400).json({ error: nameCheck.error });
    return;
  }

  const passwordCheck = validatePassword(rawPassword, 6);
  if (!passwordCheck.ok) {
    res.status(400).json({ error: passwordCheck.error });
    return;
  }

  if (!isValidAccountStatus(rawStatus)) {
    res.status(400).json({ error: 'حالة الحساب غير صالحة.' });
    return;
  }

  if (findUserByUsername(usernameCheck.value)) {
    res.status(409).json({ error: 'اسم المستخدم أو البريد مسجل بالفعل.' });
    return;
  }

  const created = createUserRecord({
    username: usernameCheck.value,
    fullName: nameCheck.value,
    password: rawPassword,
    status: rawStatus,
    isActive,
    role: 'user',
  });

  const statusAr =
    created.status === 'approved'
      ? 'موافق عليه'
      : created.status === 'rejected'
        ? 'مرفوض'
        : 'قيد الانتظار';

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'إنشاء حساب مستخدم',
    target: created.username,
    details: `الاسم: ${created.fullName} · الحالة: ${statusAr}`,
  });

  broadcastAdminStateRefresh({ type: 'users:changed', user: created, log });

  res.status(201).json({ user: created, stats: getDashboardStats(), log });
});

app.patch('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'معرّف المستخدم غير صالح.' });
    return;
  }

  const existing = findUserById(userId);
  if (!existing) {
    res.status(404).json({ error: 'المستخدم غير موجود.' });
    return;
  }

  const updates: {
    username?: string;
    fullName?: string;
    status?: 'pending' | 'approved' | 'rejected';
    isActive?: boolean;
  } = {};

  if (typeof req.body?.username === 'string') {
    const uCheck = validateUsername(req.body.username);
    if (!uCheck.ok) {
      res.status(400).json({ error: uCheck.error });
      return;
    }
    const conflict = findUserByUsername(uCheck.value);
    if (conflict && conflict.id !== userId) {
      res.status(409).json({ error: 'اسم المستخدم مستخدم من قِبل حساب آخر.' });
      return;
    }
    updates.username = uCheck.value;
  }

  if (typeof req.body?.fullName === 'string') {
    const nCheck = validateFullName(req.body.fullName);
    if (!nCheck.ok) {
      res.status(400).json({ error: nCheck.error });
      return;
    }
    updates.fullName = nCheck.value;
  }

  if (req.body?.status !== undefined) {
    if (!isValidAccountStatus(req.body.status)) {
      res.status(400).json({ error: 'حالة الحساب غير صالحة.' });
      return;
    }
    if (existing.role === 'admin' && req.body.status !== 'approved') {
      res.status(400).json({ error: 'لا يمكن تغيير حالة حساب المدير الرئيسي.' });
      return;
    }
    updates.status = req.body.status;
  }

  if (typeof req.body?.isActive === 'boolean') {
    if (existing.role === 'admin' && !req.body.isActive) {
      res.status(400).json({ error: 'لا يمكن تعطيل حساب المدير الرئيسي.' });
      return;
    }
    updates.isActive = req.body.isActive;
  }

  const updated = updateUserRecord(userId, updates);
  if (!updated) {
    res.status(404).json({ error: 'تعذّر تحديث بيانات المستخدم.' });
    return;
  }

  // Immediately kick out user if deactivated or no longer approved
  if (!updated.isActive || updated.status !== 'approved') {
    revokeAllUserSessions(userId);
    notifyUserSockets(userId, {
      type: 'session:revoked',
      reason: !updated.isActive
        ? 'تم إيقاف حسابك من قِبل المدير.'
        : 'تم تعديل صلاحية الوصول الخاصة بحسابك من قِبل المدير.',
    });
  }

  const updatedStatusAr =
    updated.status === 'approved'
      ? 'موافق عليه'
      : updated.status === 'rejected'
        ? 'مرفوض'
        : 'قيد الانتظار';

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'تعديل بيانات مستخدم',
    target: updated.username,
    details: `الحالة: ${updatedStatusAr} · التفعيل: ${updated.isActive ? 'نشط' : 'معطّل'}`,
  });

  broadcastAdminStateRefresh({ type: 'users:changed', user: updated, log });

  res.json({ user: updated, stats: getDashboardStats(), log });
});

app.patch('/api/admin/users/:id/password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'معرّف المستخدم غير صالح.' });
    return;
  }

  const existing = findUserById(userId);
  if (!existing) {
    res.status(404).json({ error: 'المستخدم غير موجود.' });
    return;
  }

  const newPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const passCheck = validatePassword(newPassword, 6);
  if (!passCheck.ok) {
    res.status(400).json({ error: passCheck.error });
    return;
  }

  updateUserPassword(userId, newPassword);

  // Revoke existing sessions for non-admin target users so they re-authenticate with the new password
  if (existing.id !== req.authUser!.id) {
    revokeAllUserSessions(userId);
    notifyUserSockets(userId, {
      type: 'session:revoked',
      reason: 'تم تغيير كلمة المرور الخاصة بك من قِبل المدير. يرجى تسجيل الدخول مجدداً.',
    });
  }

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'تغيير كلمة مرور مستخدم',
    target: existing.username,
    details: 'تم تحديث كلمة المرور وتشفيرها بنجاح',
  });

  broadcastAdminStateRefresh({ type: 'logs:changed', log });
  res.json({ ok: true, log });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ error: 'معرّف المستخدم غير صالح.' });
    return;
  }

  const existing = findUserById(userId);
  if (!existing) {
    res.status(404).json({ error: 'المستخدم غير موجود.' });
    return;
  }

  if (existing.role === 'admin') {
    res.status(400).json({ error: 'لا يمكن حذف حساب المدير الرئيسي.' });
    return;
  }

  deleteUserRecord(userId);
  notifyUserSockets(userId, {
    type: 'session:revoked',
    reason: 'تم حذف حسابك من النظام بواسطة المدير.',
  });

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'حذف حساب مستخدم',
    target: existing.username,
    details: `الاسم: ${existing.full_name}`,
  });

  broadcastAdminStateRefresh({ type: 'users:changed', deletedUserId: userId, log });
  res.json({ ok: true, stats: getDashboardStats(), log });
});

app.get('/api/admin/requests', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ requests: listAccessRequests(), stats: getDashboardStats() });
});

app.post('/api/admin/requests/:id/approve', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    res.status(400).json({ error: 'معرّف الطلب غير صالح.' });
    return;
  }

  const result = approveAccessRequest(requestId, req.authUser!.username);
  if (!result) {
    res.status(404).json({ error: 'طلب الوصول غير موجود.' });
    return;
  }

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'قبول طلب وصول',
    target: result.record.fullName,
    details: `تمت الموافقة وإنشاء الحساب (${result.user.username})`,
  });

  // Notify the waiting visitor LIVE over WebSocket!
  notifyRequestSockets(result.requestToken, {
    type: 'request:status',
    status: 'approved',
    fullName: result.record.fullName,
  });

  broadcastAdminStateRefresh({
    type: 'request:updated',
    request: result.record,
    user: result.user,
    log,
  });

  res.json({
    request: result.record,
    user: result.user,
    stats: getDashboardStats(),
    log,
  });
});

app.post('/api/admin/requests/:id/reject', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    res.status(400).json({ error: 'معرّف الطلب غير صالح.' });
    return;
  }

  const result = rejectAccessRequest(requestId, req.authUser!.username);
  if (!result) {
    res.status(404).json({ error: 'طلب الوصول غير موجود.' });
    return;
  }

  if (result.revokedUserId) {
    notifyUserSockets(result.revokedUserId, {
      type: 'session:revoked',
      reason: 'تم رفض طلب الوصول وإيقاف الجلسة بواسطة المدير.',
    });
  }

  const log = logAdminActivity({
    adminId: req.authUser!.id,
    adminUsername: req.authUser!.username,
    action: 'رفض طلب وصول',
    target: result.record.fullName,
    details: 'تم رفض طلب الدخول للنظام',
  });

  // Notify the waiting visitor LIVE over WebSocket!
  notifyRequestSockets(result.requestToken, {
    type: 'request:status',
    status: 'rejected',
    fullName: result.record.fullName,
  });

  broadcastAdminStateRefresh({
    type: 'request:updated',
    request: result.record,
    log,
  });

  res.json({
    request: result.record,
    stats: getDashboardStats(),
    log,
  });
});

app.get('/api/admin/logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  res.json({ logs: listActivityLogs(200) });
});

// Unknown API routes return clean JSON 404
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'المسار المطلوب غير موجود.' });
});

// ---------- Start Server with Vite Middleware (Dev) or Static Dist (Prod) ----------

async function startServer(): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      let boundRole: 'admin' | 'user' | 'request' | null = null;
      let boundUserId: number | null = null;
      let boundRequestToken: string | null = null;

      const bindUser = (validUser: DbUserRow) => {
        if (boundRole) return;
        if (validUser.role === 'admin') {
          boundRole = 'admin';
          boundUserId = validUser.id;
          adminSockets.add(ws);
          sendWsJson(ws, { type: 'ws:connected', channel: 'admin', stats: getDashboardStats() });
        } else {
          boundRole = 'user';
          boundUserId = validUser.id;
          if (!userSockets.has(validUser.id)) {
            userSockets.set(validUser.id, new Set());
          }
          userSockets.get(validUser.id)!.add(ws);
          sendWsJson(ws, { type: 'ws:connected', channel: 'user' });
        }
      };

      const bindRequest = (requestToken: string) => {
        if (boundRole) return false;
        const accessReq = getAccessRequestByToken(requestToken);
        if (!accessReq) return false;
        boundRole = 'request';
        boundRequestToken = accessReq.request_token;
        if (!requestSockets.has(accessReq.request_token)) {
          requestSockets.set(accessReq.request_token, new Set());
        }
        requestSockets.get(accessReq.request_token)!.add(ws);
        sendWsJson(ws, {
          type: 'request:status',
          status: accessReq.status,
          fullName: accessReq.full_name,
        });
        return true;
      };

      // Try automatic cookie authentication first for authenticated users
      const cookies = parseCookies(request.headers.cookie);
      const cookieToken = cookies[SESSION_COOKIE_NAME] || '';
      if (cookieToken) {
        const cookieUser = getUserBySessionToken(cookieToken);
        if (cookieUser && evaluateAccountAccess(cookieUser).allowed) {
          bindUser(cookieUser);
        }
      }

      // Close unauthenticated sockets if no auth frame arrives within 6 seconds
      const authTimeout = setTimeout(() => {
        if (!boundRole && ws.readyState === WebSocket.OPEN) {
          ws.close(4001, 'Authentication required');
        }
      }, 6000);

      ws.on('message', (raw) => {
        if (boundRole) return;
        try {
          const msg = JSON.parse(raw.toString()) as {
            type?: string;
            token?: string;
            requestToken?: string;
          };
          if (msg.type === 'auth' && typeof msg.token === 'string') {
            const u = getUserBySessionToken(msg.token);
            if (u && evaluateAccountAccess(u).allowed) {
              clearTimeout(authTimeout);
              bindUser(u);
              return;
            }
          } else if (msg.type === 'auth_request' && typeof msg.requestToken === 'string') {
            if (bindRequest(msg.requestToken)) {
              clearTimeout(authTimeout);
              return;
            }
          }
          ws.close(4003, 'Unauthorized');
        } catch {
          ws.close(4000, 'Invalid payload');
        }
      });

      ws.on('close', () => {
        clearTimeout(authTimeout);
        adminSockets.delete(ws);
        if (boundUserId !== null) {
          const set = userSockets.get(boundUserId);
          if (set) {
            set.delete(ws);
            if (set.size === 0) userSockets.delete(boundUserId);
          }
        }
        if (boundRequestToken !== null) {
          const set = requestSockets.get(boundRequestToken);
          if (set) {
            set.delete(ws);
            if (set.size === 0) requestSockets.delete(boundRequestToken);
          }
        }
      });
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
