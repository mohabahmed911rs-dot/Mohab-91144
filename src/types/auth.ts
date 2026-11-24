export type UserRole = 'admin' | 'user';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

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

export interface AdminOverviewPayload {
  stats: DashboardStats;
  users: SafeUser[];
  requests: AccessRequestRecord[];
  logs: ActivityLogRecord[];
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user: SafeUser | null;
  sessionToken?: string;
}
