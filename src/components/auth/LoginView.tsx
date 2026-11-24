import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type { AccountStatus, SafeUser } from '../../types/auth';
import {
  ApiError,
  buildWebSocketUrl,
  checkAccessRequestStatus,
  enterWithApprovedRequest,
  loginWithCredentials,
  submitAccessRequest,
} from '../../utils/authApi';

interface LoginViewProps {
  onAuthenticated: (user: SafeUser) => void;
  revokedNotice?: string | null;
  onDismissNotice?: () => void;
}

type AuthTab = 'login' | 'request';

interface PendingRequestState {
  id: number;
  fullName: string;
  requestToken: string;
  status: AccountStatus;
  createdAt: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onAuthenticated,
  revokedNotice,
  onDismissNotice,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorCode, setLoginErrorCode] = useState<string | null>(null);

  // First-time access request form state
  const [requestName, setRequestName] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<PendingRequestState | null>(null);
  const [enteringWorkspace, setEnteringWorkspace] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const enteringRef = useRef(false);

  const handleEnterApproved = useCallback(
    async (requestToken: string) => {
      if (enteringRef.current) return;
      enteringRef.current = true;
      setEnteringWorkspace(true);
      setRequestError(null);
      try {
        const res = await enterWithApprovedRequest(requestToken);
        if (res.authenticated && res.user) {
          onAuthenticated(res.user);
        }
      } catch (err) {
        enteringRef.current = false;
        setEnteringWorkspace(false);
        setRequestError(
          err instanceof ApiError ? err.message : 'تعذّر إتمام الدخول بعد الموافقة.'
        );
      }
    },
    [onAuthenticated]
  );

  // Live WebSocket subscription for waiting access requester
  useEffect(() => {
    if (!activeRequest || activeRequest.status !== 'pending') {
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    const token = activeRequest.requestToken;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(buildWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth_request', requestToken: token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type?: string;
            status?: AccountStatus;
          };
          if (msg.type === 'request:status' && msg.status) {
            const nextStatus = msg.status;
            setActiveRequest((prev) => (prev ? { ...prev, status: nextStatus } : null));
            if (nextStatus === 'approved') {
              void handleEnterApproved(token);
            }
          }
        } catch {
          // Ignore malformed WS payloads
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        // Reconcile latest status on reconnect
        reconnectTimer = window.setTimeout(() => {
          void checkAccessRequestStatus(token)
            .then((res) => {
              if (cancelled) return;
              setActiveRequest((prev) => (prev ? { ...prev, status: res.status } : null));
              if (res.status === 'approved') {
                void handleEnterApproved(token);
              } else if (res.status === 'pending') {
                connect();
              }
            })
            .catch(() => {
              if (!cancelled) connect();
            });
        }, 2500);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeRequest?.requestToken, activeRequest?.status, handleEnterApproved]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginErrorCode(null);
    onDismissNotice?.();

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setLoginError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await loginWithCredentials(trimmedUser, password);
      if (res.authenticated && res.user) {
        onAuthenticated(res.user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message);
        setLoginErrorCode(err.code ?? null);
      } else {
        setLoginError('تعذّر الاتصال بالخادم. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    onDismissNotice?.();

    const cleaned = requestName.trim();
    if (cleaned.length < 2) {
      setRequestError('يرجى كتابة اسمك الكامل (حرفين على الأقل) لإرسال طلب الوصول.');
      return;
    }

    setRequestLoading(true);
    try {
      const res = await submitAccessRequest(cleaned, requestNote.trim());
      enteringRef.current = false;
      setActiveRequest({
        id: res.request.id,
        fullName: res.request.fullName,
        requestToken: res.requestToken,
        status: res.request.status,
        createdAt: res.request.createdAt,
      });
    } catch (err) {
      setRequestError(
        err instanceof ApiError ? err.message : 'تعذّر إرسال طلب الوصول. يرجى المحاولة مجدداً.'
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const handleResetRequest = () => {
    enteringRef.current = false;
    setEnteringWorkspace(false);
    setActiveRequest(null);
    setRequestName('');
    setRequestNote('');
    setRequestError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Clean minimal brand bar */}
      <header className="h-16 bg-white border-b border-slate-200">
        <div className="max-w-[1280px] h-full mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <span className="text-base font-extrabold text-slate-900 whitespace-nowrap tracking-tight">
              منشئ السيرة الذاتية
            </span>
          </div>

          <div className="text-xs font-medium text-slate-500 hidden sm:flex items-center gap-2">
            <span>بوابة الدخول الموحّدة</span>
            <span aria-hidden="true">·</span>
            <span>إدارة الصلاحيات والمستخدمين</span>
          </div>
        </div>
      </header>

      {/* Full-viewport structured 2-column content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Auth Action Column */}
        <section
          aria-label="بوابة الدخول وطلب الوصول"
          className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            {/* Mode Switcher */}
            <div
              role="tablist"
              aria-label="طريقة الدخول"
              className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 mb-7"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'request'}
                onClick={() => {
                  setActiveTab('request');
                  setRequestError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                  activeTab === 'request'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>طلب دخول لأول مرة</span>
              </button>
            </div>

            {revokedNotice && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{revokedNotice}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                  تسجيل الدخول إلى النظام
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  أدخل بيانات حسابك للدخول إلى لوحة تحكم المدير أو مساحة عمل منشئ السيرة الذاتية.
                </p>

                <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="login-username"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      اسم المستخدم أو البريد الإلكتروني
                    </label>
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin / user@example.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        dir="ltr"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-11 pr-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        className="absolute inset-y-0 left-1.5 my-auto w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div
                      role="alert"
                      data-testid="login-error"
                      className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2.5 ${
                        loginErrorCode === 'PENDING'
                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      {loginErrorCode === 'PENDING' ? (
                        <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
                      )}
                      <span className="leading-relaxed font-medium">{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-11 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <span>{loginLoading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</span>
                    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-4 text-xs text-slate-500">
                  <span>هل تدخل إلى النظام لأول مرة وليس لديك حساب؟</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('request');
                      setRequestError(null);
                    }}
                    className="font-bold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    اطلب إذن الدخول
                  </button>
                </div>
              </div>
            ) : !activeRequest ? (
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                  طلب وصول للنظام لأول مرة
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  اكتب اسمك الكامل ليتم إرسال طلبك فوراً إلى لوحة تحكم المدير. بمجرد موافقة المدير سيتم فتح النظام لك تلقائياً دون الحاجة لتحديث الصفحة.
                </p>

                <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="request-full-name"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      الاسم الكامل
                    </label>
                    <input
                      id="request-full-name"
                      name="fullName"
                      type="text"
                      value={requestName}
                      onChange={(e) => setRequestName(e.target.value)}
                      placeholder="مثال: أحمد محمود المنصور"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="request-note"
                      className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                      سبب الطلب أو الجهة (اختياري)
                    </label>
                    <input
                      id="request-note"
                      name="note"
                      type="text"
                      maxLength={240}
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      placeholder="مثال: إعداد السيرة الذاتية للتقديم الأكاديمي"
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-colors"
                    />
                  </div>

                  {requestError && (
                    <div
                      role="alert"
                      data-testid="request-error"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-relaxed font-medium">{requestError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="w-full h-11 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{requestLoading ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الوصول'}</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Live Waiting / Approved / Rejected Tracker */
              <div data-testid="request-status-panel" className="py-2">
                {activeRequest.status === 'pending' && (
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                      <Clock className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1.5">
                        طلبك قيد المراجعة — بانتظار موافقة المدير
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        تم إرسال طلب الدخول باسم{' '}
                        <strong className="text-slate-900">{activeRequest.fullName}</strong> إلى لوحة تحكم المدير.
                        تتحدّث هذه الصفحة تلقائياً فور اتخاذ القرار.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">رقم الطلب</span>
                        <span className="font-mono-num font-bold text-slate-900">
                          #{activeRequest.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">الاسم المُرسَل</span>
                        <span className="font-bold text-slate-900">{activeRequest.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">الحالة الحالية</span>
                        <span className="font-bold text-amber-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Pending · قيد الانتظار</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetRequest}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      إرسال طلب باسم آخر أو العودة
                    </button>
                  </div>
                )}

                {activeRequest.status === 'approved' && (
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1.5">
                        تمت الموافقة على طلبك!
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        وافق المدير على دخول{' '}
                        <strong className="text-slate-900">{activeRequest.fullName}</strong>.
                        {enteringWorkspace
                          ? ' جارٍ فتح مساحة العمل الآن...'
                          : ' يمكنك الدخول إلى النظام الآن.'}
                      </p>
                    </div>

                    {requestError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                      >
                        {requestError}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={enteringWorkspace}
                      onClick={() => void handleEnterApproved(activeRequest.requestToken)}
                      className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>{enteringWorkspace ? 'جارٍ الدخول...' : 'الدخول إلى النظام الآن'}</span>
                      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {activeRequest.status === 'rejected' && (
                  <div className="space-y-5">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 mb-1.5">
                        تم رفض طلب الوصول
                      </h2>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        تم رفض طلب الدخول الخاص بـ{' '}
                        <strong className="text-slate-900">{activeRequest.fullName}</strong> من قِبل المدير، ولا يُسمح بالدخول إلى النظام حالياً.
                      </p>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 font-medium">
                      الحالة: Rejected · مرفوض من قِبل الإدارة
                    </div>

                    <button
                      type="button"
                      onClick={handleResetRequest}
                      className="w-full h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition-colors cursor-pointer"
                    >
                      العودة إلى نموذج الطلب
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>تخزين آمن ومشفّر لكلمات المرور</span>
            <span>صلاحيات دخول مُدارة مركزياً</span>
          </div>
        </section>

        {/* System Architecture & Access Overview Panel */}
        <aside className="lg:col-span-6 bg-slate-900 text-white rounded-2xl p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-300 mb-3">
              نظام إدارة الوصول والصلاحيات
            </p>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-4"
              style={{ textWrap: 'balance' }}
            >
              تحكّم مركزي كامل في حسابات المستخدمين وطلبات الدخول الفورية
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              بوابة محمية لإدارة منشئ السيرة الذاتية الأكاديمية والمهنية. يتحكم المدير بالكامل في إنشاء الحسابات، تعديل البيانات، تغيير كلمات المرور، وقبول أو رفض طلبات الدخول بشكل لحظي.
            </p>

            <div className="space-y-5 border-t border-slate-800 pt-6">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    صلاحيات حصرية للمدير (Admin Control)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    المدير فقط يملك صلاحية إنشاء عدد غير محدود من الحسابات، تعديلها، تغيير كلمات المرور، وتفعيل أو إيقاف أي مستخدم في أي لحظة.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    موافقة فورية على طلبات الدخول (Real-Time)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    عند تقديم طلب وصول جديد، يصل إشعار فوري للوحة المدير ويتحدّث الطلب مباشرة دون إعادة تحميل الصفحة، مع فتح النظام تلقائياً فور القبول.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-slate-800 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    حماية الجلسات وحالات الحساب الثلاث
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    تحقق صارم على الخادم لحالات Pending و Approved و Rejected مع تشفير كلمات المرور وحماية ضد محاولات التخمين المتكررة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>حالات المستخدمين: Pending · Approved · Rejected</span>
            <span>منشئ السيرة الذاتية</span>
          </div>
        </aside>
      </main>
    </div>
  );
};
