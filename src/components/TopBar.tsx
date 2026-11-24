import React from 'react';
import { FileText, Printer } from 'lucide-react';
import type { DocType } from '../types/cv';

interface TopBarProps {
  docType: DocType;
  onSelectDocType: (type: DocType) => void;
  onPrint: () => void;
}

const DOC_TABS: Array<{ id: DocType; label: string }> = [
  { id: 'cv', label: 'CV الأكاديمي' },
  { id: 'resume', label: 'Resume (صفحة)' },
  { id: 'cover_letter', label: 'Cover Letter' },
];

export const TopBar: React.FC<TopBarProps> = ({ docType, onSelectDocType, onPrint }) => {
  return (
    <header className="no-print sticky top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1480px] h-full mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line brand mark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm sm:text-base font-extrabold text-slate-900 whitespace-nowrap tracking-tight">
            منشئ السيرة الذاتية
          </span>
        </div>

        {/* Zone 2: Document mode navigation */}
        <nav
          aria-label="نوع المستند"
          role="tablist"
          className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0"
        >
          {DOC_TABS.map((tab) => {
            const active = docType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDocType(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>حفظ PDF (A4)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
