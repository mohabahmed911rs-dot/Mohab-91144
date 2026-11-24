import type {
  AccessRequestRecord,
  AccountStatus,
  ActivityLogRecord,
  AdminOverviewPayload,
  AuthSessionResponse,
  DashboardStats,
  SafeUser,
} from '../types/auth';

// Session token is held strictly in JS memory (never persisted to localStorage/sessionStorage).
let inMemorySessionToken: string | null = null;

export function setInMemorySessionToken(token: string | null): void {
  inMemorySessionToken = token;
}

export function getInMemorySessionToken(): string | null {
  return inMemorySessionToken;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemorySessionToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemorySessionToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      typeof data.error === 'string' ? data.error : 'حدث خطأ غير متوقع في الاتصال بالخادم.',
      res.status,
      typeof data.code === 'string' ? data.code : undefined,
      typeof data.retryAfterSeconds === 'number' ? data.retryAfterSeconds : undefined
    );
  }
  return data as T;
}

export function buildWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

// ---------- Auth Endpoints ----------

export async function fetchCurrentSession(): Promise<AuthSessionResponse> {
  const data = await apiRequest<AuthSessionResponse>('/api/auth/me');
  if (data.authenticated && data.sessionToken) {
    setInMemorySessionToken(data.sessionToken);
  } else if (!data.authenticated) {
    setInMemorySessionToken(null);
  }
  return data;
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<AuthSessionResponse> {
  const data = await apiRequest<AuthSessionResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (data.sessionToken) {
    setInMemorySessionToken(data.sessionToken);
  }
  return data;
}

export async function logoutSession(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } finally {
    setInMemorySessionToken(null);
  }
}

// ---------- First-Time Access Request Endpoints ----------

export async function submitAccessRequest(
  fullName: string,
  note: string
): Promise<{ request: AccessRequestRecord; requestToken: string }> {
  return apiRequest<{ request: AccessRequestRecord; requestToken: string }>(
    '/api/access-requests',
    {
      method: 'POST',
      body: JSON.stringify({ fullName, note }),
    }
  );
}

export async function checkAccessRequestStatus(requestToken: string): Promise<{
  id: number;
  fullName: string;
  status: AccountStatus;
  createdAt: string;
  reviewedAt: string | null;
}> {
  return apiRequest(`/api/access-requests/${encodeURIComponent(requestToken)}/status`);
}

export async function enterWithApprovedRequest(
  requestToken: string
): Promise<AuthSessionResponse> {
  const data = await apiRequest<AuthSessionResponse>(
    `/api/access-requests/${encodeURIComponent(requestToken)}/enter`,
    { method: 'POST' }
  );
  if (data.sessionToken) {
    setInMemorySessionToken(data.sessionToken);
  }
  return data;
}

// ---------- Admin Endpoints ----------

export async function fetchAdminOverview(): Promise<AdminOverviewPayload> {
  return apiRequest<AdminOverviewPayload>('/api/admin/overview');
}

export async function adminCreateUser(payload: {
  username: string;
  fullName: string;
  password: string;
  status: AccountStatus;
  isActive: boolean;
}): Promise<{ user: SafeUser; stats: DashboardStats; log: ActivityLogRecord }> {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateUser(
  userId: number,
  payload: {
    username?: string;
    fullName?: string;
    status?: AccountStatus;
    isActive?: boolean;
  }
): Promise<{ user: SafeUser; stats: DashboardStats; log: ActivityLogRecord }> {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminChangeUserPassword(
  userId: number,
  password: string
): Promise<{ ok: boolean; log: ActivityLogRecord }> {
  return apiRequest(`/api/admin/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password }),
  });
}

export async function adminDeleteUser(
  userId: number
): Promise<{ ok: boolean; stats: DashboardStats; log: ActivityLogRecord }> {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export async function adminApproveRequest(requestId: number): Promise<{
  request: AccessRequestRecord;
  user: SafeUser;
  stats: DashboardStats;
  log: ActivityLogRecord;
}> {
  return apiRequest(`/api/admin/requests/${requestId}/approve`, {
    method: 'POST',
  });
}

export async function adminRejectRequest(requestId: number): Promise<{
  request: AccessRequestRecord;
  stats: DashboardStats;
  log: ActivityLogRecord;
}> {
  return apiRequest(`/api/admin/requests/${requestId}/reject`, {
    method: 'POST',
  });
}

// ---------- Display Helpers ----------

export function formatArabicDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getStatusLabel(status: AccountStatus): string {
  switch (status) {
    case 'approved':
      return 'موافق عليه';
    case 'rejected':
      return 'مرفوض';
    case 'pending':
    default:
      return 'قيد الانتظار';
  }
}
