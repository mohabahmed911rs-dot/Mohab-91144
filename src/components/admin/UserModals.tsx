import React, { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Trash2, UserCog, UserPlus, X } from 'lucide-react';
import type { AccountStatus, SafeUser } from '../../types/auth';
import { ApiError } from '../../utils/authApi';

interface BaseModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<BaseModalProps> = ({ title, subtitle, onClose, children }) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ---------- Create User Modal ----------

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    fullName: string;
    username: string;
    password: string;
    status: AccountStatus;
    isActive: boolean;
  }) => Promise<void>;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<AccountStatus>('approved');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setUsername('');
      setPassword('');
      setShowPassword(false);
      setStatus('approved');
      setIsActive(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError('يرجى إدخال اسم المستخدم الكامل (حرفين على الأقل).');
      return;
    }
    if (username.trim().length < 3) {
      setError('اسم المستخدم أو البريد يجب أن يكون 3 أحرف على الأقل.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        status,
        isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر إنشاء الحساب.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="إنشاء حساب مستخدم جديد"
      subtitle="أضف مستخدماً جديداً وحدّد صلاحية الدخول وحالة الحساب."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="create-fullname" className="block text-xs font-bold text-slate-700 mb-1.5">
            الاسم الكامل
          </label>
          <input
            id="create-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: سارة علي محمود"
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label htmlFor="create-username" className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم المستخدم أو البريد الإلكتروني
          </label>
          <input
            id="create-username"
            type="text"
            dir="ltr"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="sara.ali أو sara@company.com"
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label htmlFor="create-password" className="block text-xs font-bold text-slate-700 mb-1.5">
            كلمة المرور
          </label>
          <div className="relative">
            <input
              id="create-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-sm text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute inset-y-0 left-1 my-auto w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="create-status" className="block text-xs font-bold text-slate-700 mb-1.5">
              حالة الحساب
            </label>
            <select
              id="create-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:border-slate-900"
            >
              <option value="approved">موافق عليه (Approved)</option>
              <option value="pending">قيد الانتظار (Pending)</option>
              <option value="rejected">مرفوض (Rejected)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">حساب مفعّل (نشط)</span>
            </label>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------- Edit User Modal ----------

interface EditUserModalProps {
  user: SafeUser | null;
  onClose: () => void;
  onSubmit: (
    userId: number,
    payload: {
      fullName: string;
      username: string;
      status: AccountStatus;
      isActive: boolean;
    }
  ) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSubmit }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<AccountStatus>('approved');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setUsername(user.username);
      setStatus(user.status);
      setIsActive(user.isActive);
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const isAdminAccount = user.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError('الاسم الكامل يجب أن يكون حرفين على الأقل.');
      return;
    }
    if (username.trim().length < 3) {
      setError('اسم المستخدم أو البريد يجب أن يكون 3 أحرف على الأقل.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(user.id, {
        fullName: fullName.trim(),
        username: username.trim(),
        status: isAdminAccount ? 'approved' : status,
        isActive: isAdminAccount ? true : isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حفظ التعديلات.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="تعديل بيانات الحساب"
      subtitle={`تحديث معلومات المستخدم (${user.username})`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="edit-fullname" className="block text-xs font-bold text-slate-700 mb-1.5">
            الاسم الكامل
          </label>
          <input
            id="edit-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div>
          <label htmlFor="edit-username" className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم المستخدم أو البريد الإلكتروني
          </label>
          <input
            id="edit-username"
            type="text"
            dir="ltr"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {!isAdminAccount && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-status" className="block text-xs font-bold text-slate-700 mb-1.5">
                حالة الحساب
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:border-slate-900"
              >
                <option value="approved">موافق عليه (Approved)</option>
                <option value="pending">قيد الانتظار (Pending)</option>
                <option value="rejected">مرفوض (Rejected)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">حساب مفعّل (نشط)</span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 cursor-pointer"
          >
            <UserCog className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------- Change Password Modal ----------

interface ChangePasswordModalProps {
  user: SafeUser | null;
  onClose: () => void;
  onSubmit: (userId: number, newPassword: string) => Promise<void>;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  user,
  onClose,
  onSubmit,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(user.id, newPassword);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر تغيير كلمة المرور.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="تغيير كلمة المرور"
      subtitle={`تعيين كلمة مرور جديدة للحساب (${user.username})`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
            كلمة المرور الجديدة
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="6 أحرف على الأقل"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-slate-300 text-sm text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              className="absolute inset-y-0 left-1 my-auto w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            تأكيد كلمة المرور الجديدة
          </label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            dir="ltr"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-left focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 font-medium flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'جارٍ التحديث...' : 'حفظ كلمة المرور'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ---------- Delete User Modal ----------

interface DeleteUserModalProps {
  user: SafeUser | null;
  onClose: () => void;
  onConfirm: (userId: number) => Promise<void>;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onClose,
  onConfirm,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [user]);

  if (!user) return null;

  const handleDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذّر حذف الحساب.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="تأكيد حذف الحساب"
      subtitle="سيتم حذف الحساب وإنهاء جميع جلساته النشطة فوراً."
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          هل أنت متأكد من حذف حساب{' '}
          <strong className="text-slate-900">{user.fullName}</strong> (
          <span className="font-mono-num text-xs text-slate-600" dir="ltr">
            {user.username}
          </span>
          ) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 font-medium"
          >
            {error}
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? 'جارٍ الحذف...' : 'حذف الحساب نهائياً'}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
