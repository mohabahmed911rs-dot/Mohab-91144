import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import type {
  AccessRequestRecord,
  AccountStatus,
  ActivityLogRecord,
  DashboardStats,
  SafeUser,
} from '../../types/auth';
import {
  ApiError,
  adminApproveRequest,
  adminChangeUserPassword,
  adminCreateUser,
  adminDeleteUser,
  adminRejectRequest,
  adminUpdateUser,
  buildWebSocketUrl,
  fetchAdminOverview,
  formatArabicDateTime,
  getInMemorySessionToken,
  getStatusLabel,
} from '../../utils/authApi';
import {
  ChangePasswordModal,
  CreateUserModal,
  DeleteUserModal,
  EditUserModal,
} from './UserModals';

interface AdminDashboardProps {
  adminUser: SafeUser;
  onOpenCVStudio: () => void;
  onLogout: () => Promise<void>;
}

type AdminSection = 'overview' | 'users' | 'requests' | 'logs';
type UserFilter = 'all' | 'approved' | 'pending' | 'rejected' | 'disabled';
type RequestFilter = 'pending' | 'all' | 'approved' | 'rejected';

interface AdminNotification {
  id: string;
  requestId: number;
  fullName: string;
  note: string;
  createdAt: string;
  read: boolean;
}

const StatusDisplay: React.FC<{ status: AccountStatus; isActive?: boolean }> = ({
  status,
  isActive = true,
}) => {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 whitespace-nowrap">
        <Power className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
        <span>معطّل</span>
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{getStatusLabel(status)}</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{getStatusLabel(status)}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{getStatusLabel(status)}</span>
    </span>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onOpenCVStudio,
  onLogout,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    approvedUsers: 0,
  });
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('pending');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<SafeUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SafeUser | null>(null);

  // Row-level busy tracking
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [busyToggleUserId, setBusyToggleUserId] = useState<number | null>(null);

  // Real-time notifications & toast
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, action?: { label: string; onAction: () => void }) => {
      setToast({ message, actionLabel: action?.label, onAction: action?.onAction });
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 4500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const data = await fetchAdminOverview();
      setStats(data.stats);
      setUsers(data.users);
      setRequests(data.requests);
      setLogs(data.logs);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : 'تعذّر تحميل بيانات لوحة التحكم.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  // Real-Time WebSocket for live requests, notifications, users, logs, and stats
  useEffect(() => {
    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;
      ws = new WebSocket(buildWebSocketUrl());

      ws.onopen = () => {
        const token = getInMemorySessionToken();
        if (token) {
          ws?.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type?: string;
            stats?: DashboardStats;
            request?: AccessRequestRecord;
            user?: SafeUser;
            deletedUserId?: number;
            log?: ActivityLogRecord;
          };

          if (msg.stats) {
            setStats(msg.stats);
          }

          if (msg.type === 'request:created' && msg.request) {
            const incoming = msg.request;
            setRequests((prev) => {
              if (prev.some((r) => r.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            setNotifications((prev) => {
              if (prev.some((n) => n.requestId === incoming.id)) return prev;
              return [
                {
                  id: `req-${incoming.id}`,
                  requestId: incoming.id,
                  fullName: incoming.fullName,
                  note: incoming.note,
                  createdAt: incoming.createdAt,
                  read: false,
                },
                ...prev,
              ].slice(0, 20);
            });
            showToast(`طلب وصول جديد من: ${incoming.fullName}`, {
              label: 'مراجعة الطلب',
              onAction: () => {
                setSection('requests');
                setRequestFilter('pending');
              },
            });
          }

          if (msg.type === 'request:updated' && msg.request) {
            const updatedReq = msg.request;
            setRequests((prev) => {
              const exists = prev.some((r) => r.id === updatedReq.id);
              if (!exists) return [updatedReq, ...prev];
              return prev.map((r) => (r.id === updatedReq.id ? updatedReq : r));
            });
          }

          if (msg.user) {
            const incomingUser = msg.user;
            setUsers((prev) => {
              const exists = prev.some((u) => u.id === incomingUser.id);
              if (!exists) return [incomingUser, ...prev];
              return prev.map((u) => (u.id === incomingUser.id ? incomingUser : u));
            });
          }

          if (typeof msg.deletedUserId === 'number') {
            setUsers((prev) => prev.filter((u) => u.id !== msg.deletedUserId));
          }

          if (msg.log) {
            const incomingLog = msg.log;
            setLogs((prev) => {
              if (prev.some((l) => l.id === incomingLog.id)) return prev;
              return [incomingLog, ...prev].slice(0, 150);
            });
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(() => {
          void loadOverview();
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [loadOverview, showToast]);

  // ---------- Mutation Handlers ----------

  const handleCreateUser = async (payload: {
    fullName: string;
    username: string;
    password: string;
    status: AccountStatus;
    isActive: boolean;
  }) => {
    const res = await adminCreateUser(payload);
    setUsers((prev) => (prev.some((u) => u.id === res.user.id) ? prev : [res.user, ...prev]));
    setStats(res.stats);
    setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
    showToast(`تم إنشاء حساب المستخدم "${res.user.fullName}" بنجاح`);
  };

  const handleEditUser = async (
    userId: number,
    payload: {
      fullName: string;
      username: string;
      status: AccountStatus;
      isActive: boolean;
    }
  ) => {
    const res = await adminUpdateUser(userId, payload);
    setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
    setStats(res.stats);
    setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
    showToast(`تم تحديث بيانات الحساب (${res.user.username})`);
  };

  const handleToggleActive = async (target: SafeUser) => {
    if (target.role === 'admin') return;
    setBusyToggleUserId(target.id);
    try {
      const res = await adminUpdateUser(target.id, { isActive: !target.isActive });
      setUsers((prev) => prev.map((u) => (u.id === res.user.id ? res.user : u)));
      setStats(res.stats);
      setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
      showToast(
        res.user.isActive
          ? `تم تفعيل حساب ${res.user.username}`
          : `تم تعطيل حساب ${res.user.username} وإيقاف جلساته`
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'تعذّر تغيير حالة التفعيل.');
    } finally {
      setBusyToggleUserId(null);
    }
  };

  const handleChangePassword = async (userId: number, newPassword: string) => {
    const res = await adminChangeUserPassword(userId, newPassword);
    setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
    showToast('تم تغيير كلمة المرور وتشفيرها بنجاح');
  };

  const handleDeleteUser = async (userId: number) => {
    const res = await adminDeleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setStats(res.stats);
    setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
    showToast('تم حذف الحساب وإنهاء جلساته');
  };

  const handleApproveRequest = async (reqItem: AccessRequestRecord) => {
    setBusyRequestId(reqItem.id);
    try {
      const res = await adminApproveRequest(reqItem.id);
      setRequests((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      setUsers((prev) => {
        const exists = prev.some((u) => u.id === res.user.id);
        return exists
          ? prev.map((u) => (u.id === res.user.id ? res.user : u))
          : [res.user, ...prev];
      });
      setStats(res.stats);
      setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
      setNotifications((prev) =>
        prev.map((n) => (n.requestId === reqItem.id ? { ...n, read: true } : n))
      );
      showToast(`تم قبول طلب "${reqItem.fullName}" والسماح له بالدخول`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'تعذّر قبول الطلب.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleRejectRequest = async (reqItem: AccessRequestRecord) => {
    setBusyRequestId(reqItem.id);
    try {
      const res = await adminRejectRequest(reqItem.id);
      setRequests((prev) => prev.map((r) => (r.id === res.request.id ? res.request : r)));
      setStats(res.stats);
      setLogs((prev) => (prev.some((l) => l.id === res.log.id) ? prev : [res.log, ...prev]));
      setNotifications((prev) =>
        prev.map((n) => (n.requestId === reqItem.id ? { ...n, read: true } : n))
      );
      showToast(`تم رفض طلب "${reqItem.fullName}"`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'تعذّر رفض الطلب.');
    } finally {
      setBusyRequestId(null);
    }
  };

  // ---------- Derived Filtered Lists ----------

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (userFilter === 'disabled' && u.isActive) return false;
      if (
        (userFilter === 'approved' || userFilter === 'pending' || userFilter === 'rejected') &&
        u.status !== userFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    });
  }, [users, userSearch, userFilter]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === 'all') return requests;
    return requests.filter((r) => r.status === requestFilter);
  }, [requests, requestFilter]);

  const pendingRequestsList = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests]
  );

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const sectionTitleMap: Record<AdminSection, string> = {
    overview: 'نظرة عامة على النظام',
    users: 'إدارة المستخدمين',
    requests: 'طلبات الوصول المعلقة والسابقة',
    logs: 'سجل نشاط المدير',
  };

  const navItems: Array<{
    id: AdminSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users', label: 'إدارة المستخدمين', icon: Users, count: stats.totalUsers },
    { id: 'requests', label: 'طلبات الوصول', icon: UserCheck, count: stats.pendingRequests },
    { id: 'logs', label: 'سجل النشاط', icon: Activity },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-extrabold text-slate-900 truncate">
            لوحة تحكم المدير
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="إغلاق القائمة الجانبية"
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="أقسام لوحة التحكم" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setMobileMenuOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono-num text-xs font-bold ${
                    active
                      ? 'text-slate-200'
                      : item.id === 'requests' && item.count > 0
                        ? 'text-amber-700'
                        : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
          <button
            type="button"
            onClick={onOpenCVStudio}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>استوديو السيرة الذاتية</span>
          </button>
        </div>
      </nav>

      {/* Admin profile & logout footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-900 truncate">{adminUser.fullName}</p>
            <p className="text-xs text-slate-500 font-mono-num truncate" dir="ltr">
              @{adminUser.username}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordUser(adminUser)}
            title="تغيير كلمة مرور المدير"
            aria-label="تغيير كلمة مرور المدير"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 bg-white border-l border-slate-200 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full border-l border-slate-200 shadow-xl z-10">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pr-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="فتح القائمة الجانبية"
                className="lg:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {sectionTitleMap[section]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Functional Real-Time Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifPopoverOpen((prev) => !prev);
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                  }}
                  aria-label={`الإشعارات (${unreadNotifCount + stats.pendingRequests} معلق)`}
                  className="relative w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  {(unreadNotifCount > 0 || stats.pendingRequests > 0) && (
                    <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-600 text-white text-[10px] font-mono-num font-bold flex items-center justify-center">
                      {stats.pendingRequests || unreadNotifCount}
                    </span>
                  )}
                </button>

                {notifPopoverOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        إشعارات طلبات الوصول
                      </span>
                      <button
                        type="button"
                        onClick={() => setNotifPopoverOpen(false)}
                        aria-label="إغلاق الإشعارات"
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {pendingRequestsList.length === 0 && notifications.length === 0 ? (
                        <div className="p-5 text-center text-xs text-slate-500">
                          لا توجد طلبات وصول جديدة حالياً.
                        </div>
                      ) : (
                        pendingRequestsList.map((req) => (
                          <div key={req.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-900">{req.fullName}</span>
                              <span className="text-[11px] font-mono-num text-slate-400 shrink-0">
                                #{req.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mb-2">
                              {req.note || 'طلب دخول جديد بانتظار موافقتك'}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setNotifPopoverOpen(false);
                                  void handleApproveRequest(req);
                                }}
                                className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
                              >
                                قبول
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNotifPopoverOpen(false);
                                  void handleRejectRequest(req);
                                }}
                                className="px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold cursor-pointer"
                              >
                                رفض
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">إنشاء مستخدم جديد</span>
                <span className="sm:hidden">مستخدم جديد</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1280px] w-full mx-auto space-y-6">
          {loadError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-center justify-between gap-4"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => void loadOverview()}
                className="text-xs font-bold underline cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Top 4 KPI Statistics Bar */}
          <section
            aria-label="إحصائيات النظام"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div
              data-testid="stat-total-users"
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500">إجمالي المستخدمين</span>
                <Users className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-slate-900">
                {loading ? '—' : stats.totalUsers}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Total Users</p>
            </div>

            <div
              data-testid="stat-active-users"
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500">المستخدمون النشطون</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-emerald-700">
                {loading ? '—' : stats.activeUsers}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Active Users</p>
            </div>

            <button
              type="button"
              data-testid="stat-pending-requests"
              onClick={() => {
                setSection('requests');
                setRequestFilter('pending');
              }}
              className="text-right bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 sm:p-5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500">الطلبات المعلقة</span>
                <Clock className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-amber-700">
                {loading ? '—' : stats.pendingRequests}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Pending Requests</p>
            </button>

            <div
              data-testid="stat-rejected-requests"
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500">الطلبات المرفوضة</span>
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono-num text-rose-700">
                {loading ? '—' : stats.rejectedRequests}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Rejected Requests</p>
            </div>
          </section>

          {/* OVERVIEW SECTION */}
          {section === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Pending Access Requests Queue */}
              <section
                aria-label="طلبات الوصول قيد الانتظار"
                className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">
                      طلبات الوصول قيد الانتظار
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تتحدّث القائمة لحظياً فور إرسال أي طلب جديد دون إعادة تحميل الصفحة
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('requests')}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    عرض الكل
                  </button>
                </div>

                {loading ? (
                  <div className="p-6 space-y-3">
                    <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                    <div className="h-10 rounded-lg bg-slate-100 animate-pulse" />
                  </div>
                ) : pendingRequestsList.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-bold text-slate-700 mb-1">
                      لا توجد طلبات معلّقة حالياً
                    </p>
                    <p className="text-xs text-slate-500">
                      عند محاولة أي مستخدم جديد الدخول لأول مرة سيظهر طلبه هنا فوراً مع إشعار مباشر.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pendingRequestsList.slice(0, 6).map((req) => (
                      <div
                        key={req.id}
                        className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <span className="truncate">{req.fullName}</span>
                            <span className="text-xs font-mono-num font-normal text-slate-400">
                              #{req.id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {req.note ? `${req.note} · ` : ''}
                            {formatArabicDateTime(req.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={busyRequestId === req.id}
                            aria-label={`قبول طلب ${req.fullName}`}
                            onClick={() => void handleApproveRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>قبول</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyRequestId === req.id}
                            aria-label={`رفض طلب ${req.fullName}`}
                            onClick={() => void handleRejectRequest(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>رفض</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recent Admin Activity */}
              <section
                aria-label="أحدث الأنشطة الإدارية"
                className="xl:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-extrabold text-slate-900">أحدث الأنشطة</h2>
                  <button
                    type="button"
                    onClick={() => setSection('logs')}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    السجل الكامل
                  </button>
                </div>

                {logs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    لا توجد أنشطة مسجّلة بعد.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {logs.slice(0, 6).map((item) => (
                      <div key={item.id} className="px-5 py-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{item.action}</span>
                          <span className="text-[11px] font-mono-num text-slate-400 whitespace-nowrap">
                            {formatArabicDateTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 truncate">
                          {item.target}
                          {item.details ? ` — ${item.details}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* USERS MANAGEMENT SECTION */}
          {(section === 'users' || section === 'overview') && (
            <section
              aria-label="جدول إدارة المستخدمين"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    إدارة حسابات المستخدمين ({filteredUsers.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إنشاء وتعديل وحذف الحسابات، تغيير كلمات المرور، وتفعيل أو تعطيل صلاحية الوصول
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search
                      className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      aria-label="بحث في المستخدمين"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="بحث بالاسم أو اسم المستخدم..."
                      className="h-9 pr-8 pl-3 w-56 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div
                    role="group"
                    aria-label="تصفية المستخدمين حسب الحالة"
                    className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
                  >
                    {(
                      [
                        { id: 'all', label: 'الكل' },
                        { id: 'approved', label: 'موافق عليه' },
                        { id: 'pending', label: 'قيد الانتظار' },
                        { id: 'rejected', label: 'مرفوض' },
                        { id: 'disabled', label: 'معطّل' },
                      ] as Array<{ id: UserFilter; label: string }>
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setUserFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                          userFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500">
                      <th className="py-3 px-4 whitespace-nowrap">المستخدم</th>
                      <th className="py-3 px-4 whitespace-nowrap">اسم المستخدم / البريد</th>
                      <th className="py-3 px-4 whitespace-nowrap">الدور</th>
                      <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
                      <th className="py-3 px-4 whitespace-nowrap">التفعيل</th>
                      <th className="py-3 px-4 whitespace-nowrap">آخر دخول</th>
                      <th className="py-3 px-4 whitespace-nowrap">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          جارٍ تحميل قائمة المستخدمين...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                          لا يوجد مستخدمون مطابقون لخيارات البحث أو التصفية الحالية.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isAdminRow = u.role === 'admin';
                        return (
                          <tr
                            key={u.id}
                            data-testid={`user-row-${u.username}`}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {u.fullName}
                            </td>
                            <td
                              className="py-3 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap"
                              dir="ltr"
                            >
                              {u.username}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                              {isAdminRow ? 'مدير (Admin)' : 'مستخدم'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <StatusDisplay status={u.status} isActive={u.isActive} />
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isAdminRow ? (
                                <span className="text-xs text-slate-400">دائم التفعيل</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busyToggleUserId === u.id}
                                  aria-label={
                                    u.isActive
                                      ? `تعطيل حساب ${u.username}`
                                      : `تفعيل حساب ${u.username}`
                                  }
                                  onClick={() => void handleToggleActive(u)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                    u.isActive
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  <Power className="w-3 h-3" aria-hidden="true" />
                                  <span>{u.isActive ? 'نشط' : 'معطّل'}</span>
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono-num text-slate-500 whitespace-nowrap">
                              {formatArabicDateTime(u.lastLoginAt)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingUser(u)}
                                  aria-label={`تعديل المستخدم ${u.username}`}
                                  title="تعديل البيانات"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPasswordUser(u)}
                                  aria-label={`تغيير كلمة مرور ${u.username}`}
                                  title="تغيير كلمة المرور"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>كلمة المرور</span>
                                </button>
                                {!isAdminRow && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingUser(u)}
                                    aria-label={`حذف المستخدم ${u.username}`}
                                    title="حذف الحساب"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-xs font-bold text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>حذف</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ACCESS REQUESTS SECTION */}
          {section === 'requests' && (
            <section
              aria-label="جدول طلبات الوصول"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    طلبات الوصول ({filteredRequests.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    إدارة طلبات الدخول الجديدة بقبولها أو رفضها مع تحديث لحظي للمستخدمين
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="تصفية الطلبات"
                  className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
                >
                  {(
                    [
                      { id: 'pending', label: `معلّقة (${stats.pendingRequests})` },
                      { id: 'all', label: 'الكل' },
                      { id: 'approved', label: 'مقبولة' },
                      { id: 'rejected', label: 'مرفوضة' },
                    ] as Array<{ id: RequestFilter; label: string }>
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRequestFilter(tab.id)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        requestFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500">
                      <th className="py-3 px-4 whitespace-nowrap">#</th>
                      <th className="py-3 px-4 whitespace-nowrap">الاسم</th>
                      <th className="py-3 px-4 whitespace-nowrap">الملاحظة</th>
                      <th className="py-3 px-4 whitespace-nowrap">تاريخ الطلب</th>
                      <th className="py-3 px-4 whitespace-nowrap">الحالة</th>
                      <th className="py-3 px-4 whitespace-nowrap">الحساب المرتبط</th>
                      <th className="py-3 px-4 whitespace-nowrap">القرار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                          لا توجد طلبات وصول في هذا التصنيف حالياً.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr
                          key={req.id}
                          data-testid={`request-row-${req.id}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono-num text-xs text-slate-400">
                            #{req.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {req.fullName}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                            {req.note || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                            {formatArabicDateTime(req.createdAt)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusDisplay status={req.status} />
                          </td>
                          <td
                            className="py-3 px-4 font-mono-num text-xs text-slate-600 whitespace-nowrap"
                            dir="ltr"
                          >
                            {req.linkedUsername || '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {req.status !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={busyRequestId === req.id}
                                  aria-label={`قبول طلب ${req.fullName}`}
                                  onClick={() => void handleApproveRequest(req)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>قبول</span>
                                </button>
                              )}
                              {req.status !== 'rejected' && (
                                <button
                                  type="button"
                                  disabled={busyRequestId === req.id}
                                  aria-label={`رفض طلب ${req.fullName}`}
                                  onClick={() => void handleRejectRequest(req)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>رفض</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ACTIVITY LOGS SECTION */}
          {section === 'logs' && (
            <section
              aria-label="سجل نشاط المدير"
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-extrabold text-slate-900">
                  سجل النشاط الإداري ({logs.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  توثيق كامل لجميع عمليات إنشاء الحسابات والتعديلات وقرارات قبول ورفض الطلبات
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500">
                      <th className="py-3 px-4 whitespace-nowrap">الإجراء</th>
                      <th className="py-3 px-4 whitespace-nowrap">الهدف</th>
                      <th className="py-3 px-4 whitespace-nowrap">التفاصيل</th>
                      <th className="py-3 px-4 whitespace-nowrap">المدير</th>
                      <th className="py-3 px-4 whitespace-nowrap">التوقيت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          لا توجد عمليات مسجلة بعد.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                            {log.target}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.details || '—'}</td>
                          <td
                            className="py-3 px-4 font-mono-num text-slate-500 whitespace-nowrap"
                            dir="ltr"
                          >
                            @{log.adminUsername}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                            {formatArabicDateTime(log.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUser}
      />
      <ChangePasswordModal
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
        onSubmit={handleChangePassword}
      />
      <DeleteUserModal
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
      />

      {/* Live Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 left-5 z-50 transition-all duration-200 ${
          toast
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        {toast && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
