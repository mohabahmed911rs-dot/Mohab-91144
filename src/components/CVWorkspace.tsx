import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ClearConfirmModal } from './ClearConfirmModal';
import { DocumentPreview } from './DocumentPreview';
import { EditorPanel, type SectionId } from './EditorPanel';
import { TopBar } from './TopBar';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { cloneSampleData, getEmptyData } from '../data/sampleData';
import {
  DEFAULT_FONT_ID,
  DEFAULT_HEADING_FONT_ID,
  DEFAULT_PALETTE_ID,
  DEFAULT_TEMPLATE_ID,
  getFontById,
  getPaletteById,
  getTemplateById,
  isValidFontId,
  isValidPaletteId,
  isValidTemplateId,
} from '../data/themes';
import type { SafeUser } from '../types/auth';
import type {
  A4FitMode,
  CVData,
  CVFontId,
  CVPaletteId,
  CVTemplateId,
  CoverLetterData,
  DocLang,
  DocType,
  DynamicListKey,
  PersonalInfo,
} from '../types/cv';
import {
  STORAGE_KEY,
  buildPrintFileName,
  createBlankEntry,
  isUntouchedSample,
  moveItem,
  parseCommaList,
  parseImportedCvData,
  resizeImageToDataUrl,
  validatePhotoFile,
} from '../utils/cvUtils';

interface PersistedWorkspace {
  docType: DocType;
  docLang: DocLang;
  a4FitMode?: A4FitMode;
  cvTemplate?: CVTemplateId;
  cvPalette?: CVPaletteId;
  cvFont?: CVFontId;
  cvHeadingFont?: CVFontId;
  data: CVData;
}

function loadInitialWorkspace(): PersistedWorkspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedWorkspace>;
      const docLang: DocLang = parsed.docLang === 'ar' ? 'ar' : 'en';
      const docType: DocType =
        parsed.docType === 'resume' || parsed.docType === 'cover_letter' ? parsed.docType : 'cv';
      const a4FitMode: A4FitMode = parsed.a4FitMode === 'auto' ? 'auto' : 'single';
      const cvTemplate: CVTemplateId = isValidTemplateId(parsed.cvTemplate)
        ? parsed.cvTemplate
        : DEFAULT_TEMPLATE_ID;
      const cvPalette: CVPaletteId = isValidPaletteId(parsed.cvPalette)
        ? parsed.cvPalette
        : DEFAULT_PALETTE_ID;
      const cvFont: CVFontId = isValidFontId(parsed.cvFont) ? parsed.cvFont : DEFAULT_FONT_ID;
      const cvHeadingFont: CVFontId = isValidFontId(parsed.cvHeadingFont)
        ? parsed.cvHeadingFont
        : DEFAULT_HEADING_FONT_ID;
      const hydrated = parsed.data ? parseImportedCvData(JSON.stringify(parsed.data)) : null;
      if (hydrated) {
        return {
          docType,
          docLang,
          a4FitMode,
          cvTemplate,
          cvPalette,
          cvFont,
          cvHeadingFont,
          data: hydrated,
        };
      }
    }
  } catch {
    // Fallback to clean sample data if storage is unavailable or corrupt
  }
  return {
    docType: 'cv',
    docLang: 'en',
    a4FitMode: 'single',
    cvTemplate: DEFAULT_TEMPLATE_ID,
    cvPalette: DEFAULT_PALETTE_ID,
    cvFont: DEFAULT_FONT_ID,
    cvHeadingFont: DEFAULT_HEADING_FONT_ID,
    data: cloneSampleData('en'),
  };
}

interface CVWorkspaceProps {
  currentUser: SafeUser;
  onOpenAdminDashboard?: () => void;
  onLogout: () => Promise<void>;
}

export const CVWorkspace: React.FC<CVWorkspaceProps> = ({
  currentUser,
  onOpenAdminDashboard,
  onLogout,
}) => {
  const [initial] = useState<PersistedWorkspace>(() => loadInitialWorkspace());
  const [docType, setDocType] = useState<DocType>(initial.docType);
  const [docLang, setDocLang] = useState<DocLang>(initial.docLang);
  const [a4FitMode, setA4FitMode] = useState<A4FitMode>(initial.a4FitMode ?? 'single');
  const [cvTemplate, setCvTemplate] = useState<CVTemplateId>(
    initial.cvTemplate ?? DEFAULT_TEMPLATE_ID
  );
  const [cvPalette, setCvPalette] = useState<CVPaletteId>(
    initial.cvPalette ?? DEFAULT_PALETTE_ID
  );
  const [cvFont, setCvFont] = useState<CVFontId>(initial.cvFont ?? DEFAULT_FONT_ID);
  const [cvHeadingFont, setCvHeadingFont] = useState<CVFontId>(
    initial.cvHeadingFont ?? DEFAULT_HEADING_FONT_ID
  );
  const [data, setData] = useState<CVData>(initial.data);

  const [skillsInput, setSkillsInput] = useState<string>(() => initial.data.skills.join(', '));
  const [languagesInput, setLanguagesInput] = useState<string>(() =>
    initial.data.languages.join(', ')
  );

  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    personal: true,
    education: false,
    experience: false,
    research: false,
    conferences: false,
    awards: false,
    skills: false,
    cover: false,
  });

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const payload: PersistedWorkspace = {
      docType,
      docLang,
      a4FitMode,
      cvTemplate,
      cvPalette,
      cvFont,
      cvHeadingFont,
      data,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      try {
        const textOnlyFallback: PersistedWorkspace = {
          docType,
          docLang,
          a4FitMode,
          cvTemplate,
          cvPalette,
          cvFont,
          cvHeadingFont,
          data: { ...data, personal: { ...data.personal, photo: '' } },
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnlyFallback));
      } catch {
        // Ignore storage errors in restricted browsing modes
      }
    }
  }, [docType, docLang, a4FitMode, cvTemplate, cvPalette, cvFont, cvHeadingFont, data]);

  const handleSelectDocType = (nextType: DocType) => {
    setDocType(nextType);
    if (nextType === 'cover_letter') {
      setOpenSections((prev) => ({ ...prev, cover: true }));
    }
  };

  const handleSelectDocLang = (nextLang: DocLang) => {
    if (nextLang === docLang) return;
    if (isUntouchedSample(data, docLang)) {
      const nextSample = cloneSampleData(nextLang);
      setData(nextSample);
      setSkillsInput(nextSample.skills.join(', '));
      setLanguagesInput(nextSample.languages.join(', '));
    }
    setDocLang(nextLang);
    showToast(
      nextLang === 'en'
        ? 'تم تحويل اتجاه ولغة المستند إلى الإنجليزية (LTR)'
        : 'تم تحويل اتجاه ولغة المستند إلى العربية (RTL)'
    );
  };

  const handleToggleSection = (id: SectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdatePersonal = <K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) => {
    setData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
    }));
  };

  const handleUploadPhoto = async (file: File) => {
    const check = validatePhotoFile(file);
    if (!check.ok) {
      setPhotoError(check.error);
      return;
    }
    setPhotoError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          photo: dataUrl,
          photoZoom: 1,
          photoPosX: 50,
          photoPosY: 20,
        },
      }));
      showToast('تمت إضافة الصورة بجودة عالية دون تعديل بياناتك');
    } catch {
      setPhotoError('تعذّر تحميل الصورة؛ يرجى المحاولة بصورة أخرى.');
    }
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        photo: '',
        photoZoom: 1,
        photoPosX: 50,
        photoPosY: 20,
      },
    }));
    showToast('تم حذف الصورة الشخصية');
  };

  const handleResetPhotoFraming = () => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        photoZoom: 1,
        photoPosX: 50,
        photoPosY: 20,
      },
    }));
  };

  const handleUpdateCoverLetter = <K extends keyof CoverLetterData>(
    key: K,
    value: CoverLetterData[K]
  ) => {
    setData((prev) => ({
      ...prev,
      coverLetter: { ...prev.coverLetter, [key]: value },
    }));
  };

  const handleSkillsInputChange = (value: string) => {
    setSkillsInput(value);
    setData((prev) => ({ ...prev, skills: parseCommaList(value) }));
  };

  const handleLanguagesInputChange = (value: string) => {
    setLanguagesInput(value);
    setData((prev) => ({ ...prev, languages: parseCommaList(value) }));
  };

  const handleAddItem = (listKey: DynamicListKey) => {
    const newItem = createBlankEntry(listKey);
    setData((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], newItem],
    }));
  };

  const handleRemoveItem = (listKey: DynamicListKey, index: number) => {
    setData((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveItem = (listKey: DynamicListKey, index: number, direction: 'up' | 'down') => {
    setData((prev) => ({
      ...prev,
      [listKey]: moveItem(prev[listKey] as unknown[], index, direction),
    }));
  };

  const handleUpdateItem = (
    listKey: DynamicListKey,
    index: number,
    field: string,
    value: string
  ) => {
    setData((prev) => {
      const nextList = [...(prev[listKey] as unknown as Array<Record<string, string>>)];
      if (!nextList[index]) return prev;
      nextList[index] = { ...nextList[index], [field]: value };
      return { ...prev, [listKey]: nextList };
    });
  };

  const handleLoadSample = () => {
    const sample = cloneSampleData(docLang);
    setData(sample);
    setSkillsInput(sample.skills.join(', '));
    setLanguagesInput(sample.languages.join(', '));
    showToast('تمت تعبئة بيانات تجريبية كاملة مطابقة للدليل');
  };

  const handleConfirmClear = () => {
    const empty = getEmptyData();
    setData(empty);
    setSkillsInput('');
    setLanguagesInput('');
    setPhotoError(null);
    setIsClearModalOpen(false);
    showToast('تم مسح جميع البيانات، يمكنك البدء بملء بياناتك الآن');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (data.personal.fullName || 'cv-studio')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-');
    link.href = url;
    link.download = `${safeName || 'cv-studio'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('تم حفظ ملف النسخة الاحتياطية (JSON) بنجاح');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const imported = parseImportedCvData(text);
      if (!imported) {
        showToast('تعذّر قراءة الملف؛ يرجى اختيار ملف JSON صالح');
        return;
      }
      setData(imported);
      setSkillsInput(imported.skills.join(', '));
      setLanguagesInput(imported.languages.join(', '));
      showToast('تم استيراد بيانات السيرة الذاتية بنجاح');
    };
    reader.readAsText(file);
  };

  const handleScrollToPreview = () => {
    const previewEl = document.getElementById('document-preview');
    previewEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('تم تحديث المستند وجاهز للعرض والطباعة');
  };

  const handleSelectTemplate = (nextTemplate: CVTemplateId) => {
    setCvTemplate(nextTemplate);
    showToast(`تم تغيير قالب السيرة الذاتية إلى: ${getTemplateById(nextTemplate).name}`);
  };

  const handleSelectPalette = (nextPalette: CVPaletteId) => {
    setCvPalette(nextPalette);
    showToast(`تم تطبيق باليت الألوان: ${getPaletteById(nextPalette).name}`);
  };

  const handleSelectBodyFont = (nextFont: CVFontId) => {
    setCvFont(nextFont);
    setCvHeadingFont(DEFAULT_HEADING_FONT_ID);
    showToast(`تم تطبيق خط المستند: ${getFontById(nextFont).name}`);
  };

  const handleSelectHeadingFont = (nextFont: CVFontId) => {
    setCvHeadingFont(nextFont);
    showToast(
      nextFont === 'auto'
        ? 'تم توحيد خط العناوين مع خط النص'
        : `تم تطبيق خط العناوين: ${getFontById(nextFont).name}`
    );
  };

  const handleResetTheme = () => {
    setCvTemplate(DEFAULT_TEMPLATE_ID);
    setCvPalette(DEFAULT_PALETTE_ID);
    setCvFont(DEFAULT_FONT_ID);
    setCvHeadingFont(DEFAULT_HEADING_FONT_ID);
    showToast('تمت استعادة التصميم والألوان والخطوط الأصلية');
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = buildPrintFileName(data.personal.fullName, docType);
    let restored = false;
    const restoreTitle = () => {
      if (restored) return;
      restored = true;
      document.title = prevTitle;
    };
    window.addEventListener('afterprint', restoreTitle, { once: true });
    window.setTimeout(restoreTitle, 1500);
    window.print();
  };

  return (
    <div className="print-root min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        docType={docType}
        onSelectDocType={handleSelectDocType}
        onPrint={handlePrint}
      />

      <WorkspaceToolbar
        docType={docType}
        docLang={docLang}
        onSelectDocType={handleSelectDocType}
        onSelectDocLang={handleSelectDocLang}
        onLoadSample={handleLoadSample}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        currentUser={currentUser}
        onOpenAdminDashboard={onOpenAdminDashboard}
        onLogout={() => void onLogout()}
      />

      <main className="print-main flex-1 max-w-[1480px] w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <EditorPanel
          data={data}
          skillsInput={skillsInput}
          languagesInput={languagesInput}
          openSections={openSections}
          onToggleSection={handleToggleSection}
          onUpdatePersonal={handleUpdatePersonal}
          onUploadPhoto={handleUploadPhoto}
          onRemovePhoto={handleRemovePhoto}
          onResetPhotoFraming={handleResetPhotoFraming}
          photoError={photoError}
          onUpdateCoverLetter={handleUpdateCoverLetter}
          onSkillsInputChange={handleSkillsInputChange}
          onLanguagesInputChange={handleLanguagesInputChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onMoveItem={handleMoveItem}
          onUpdateItem={handleUpdateItem}
          onScrollToPreview={handleScrollToPreview}
          docLang={docLang}
          templateId={cvTemplate}
          paletteId={cvPalette}
          bodyFontId={cvFont}
          headingFontId={cvHeadingFont}
          onSelectTemplate={handleSelectTemplate}
          onSelectPalette={handleSelectPalette}
          onSelectBodyFont={handleSelectBodyFont}
          onSelectHeadingFont={handleSelectHeadingFont}
          onResetTheme={handleResetTheme}
        />

        <DocumentPreview
          data={data}
          docType={docType}
          docLang={docLang}
          a4FitMode={a4FitMode}
          templateId={cvTemplate}
          paletteId={cvPalette}
          bodyFontId={cvFont}
          headingFontId={cvHeadingFont}
          onChangeA4FitMode={setA4FitMode}
          onPrint={handlePrint}
          onLoadSample={handleLoadSample}
        />
      </main>

      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
      />

      <div
        role="status"
        aria-live="polite"
        className={`no-print fixed bottom-5 left-5 z-50 transition-all duration-200 ${
          toastMessage
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        {toastMessage && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
