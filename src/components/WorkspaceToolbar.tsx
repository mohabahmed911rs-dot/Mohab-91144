import React, { useRef } from 'react';
import { Download, LogOut, RotateCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { SafeUser } from '../types/auth';
import type { DocLang, DocType } from '../types/cv';

interface WorkspaceToolbarProps {
  docType: DocType;
  docLang: DocLang;
  onSelectDocType: (type: DocType) => void;
  onSelectDocLang: (lang: DocLang) => void;
  onLoadSample: () => void;
  onOpenClearModal: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  currentUser?: SafeUser;
  onOpenAdminDashboard?: () => void;
  onLogout?: () => void;
}

const MOBILE_TABS: Array<{ id: DocType; label: string }> = [
  { id: 'cv', label: 'CV الأكاديمي' },
  { id: 'resume', label: 'Resume' },
  { id: 'cover_letter', label: 'Cover Letter' },
];

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  docType,
  docLang,
  onSelectDocType,
  onSelectDocLang,
  onLoadSample,
  onOpenClearModal,
  onExportJson,
  onImportJson,
  currentUser,
  onOpenAdminDashboard,
  onLogout,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportJson(file);
      event.target.value = '';
    }
  };

  return (
    <div className="no-print bg-white border-b border-slate-200">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Mobile Document Mode Switcher */}
        <div
          role="tablist"
          aria-label="نوع المستند"
          className="flex md:hidden items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto"
        >
          {MOBILE_TABS.map((tab) => {
            const active = docType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDocType(tab.id)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Start Group: Document Language & Direction */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            لغة المستند واتجاهه:
          </span>
          <div
            role="group"
            aria-label="لغة واتجاه المستند المُنشأ"
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
          >
            <button
              type="button"
              aria-pressed={docLang === 'en'}
              onClick={() => onSelectDocLang('en')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                docLang === 'en'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English (LTR)
            </button>
            <button
              type="button"
              aria-pressed={docLang === 'ar'}
              onClick={() => onSelectDocLang('ar')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                docLang === 'ar'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              عربي (RTL)
            </button>
          </div>
        </div>

        {/* End Group: Sample, JSON Backup, Clear, and Account Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-700"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>تعبئة بيانات تجريبية</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>حفظ نسخة JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>استيراد JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />

          <button
            type="button"
            onClick={onOpenClearModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>مسح</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 pr-2 mr-1 border-r border-slate-200">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                {currentUser.fullName}
              </span>
              {currentUser.role === 'admin' && onOpenAdminDashboard && (
                <button
                  type="button"
                  onClick={onOpenAdminDashboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>لوحة التحكم</span>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>خروج</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
