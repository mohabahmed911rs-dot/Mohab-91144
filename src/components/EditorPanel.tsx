import React, { useRef } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Camera,
  ChevronDown,
  FileCheck2,
  Plus,
  RotateCcw,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type {
  CVData,
  CVFontId,
  CVPaletteId,
  CVTemplateId,
  CoverLetterData,
  DocLang,
  DynamicListKey,
  PersonalInfo,
} from '../types/cv';
import { ThemeDesignerCard } from './ThemeDesignerCard';

export type SectionId =
  | 'personal'
  | 'education'
  | 'experience'
  | 'research'
  | 'conferences'
  | 'awards'
  | 'skills'
  | 'cover';

interface EditorPanelProps {
  data: CVData;
  skillsInput: string;
  languagesInput: string;
  openSections: Record<SectionId, boolean>;
  onToggleSection: (id: SectionId) => void;
  onUpdatePersonal: <K extends keyof PersonalInfo>(key: K, value: PersonalInfo[K]) => void;
  onUploadPhoto: (file: File) => void;
  onRemovePhoto: () => void;
  onResetPhotoFraming: () => void;
  photoError: string | null;
  onUpdateCoverLetter: <K extends keyof CoverLetterData>(key: K, value: CoverLetterData[K]) => void;
  onSkillsInputChange: (value: string) => void;
  onLanguagesInputChange: (value: string) => void;
  onAddItem: (listKey: DynamicListKey) => void;
  onRemoveItem: (listKey: DynamicListKey, index: number) => void;
  onMoveItem: (listKey: DynamicListKey, index: number, direction: 'up' | 'down') => void;
  onUpdateItem: (listKey: DynamicListKey, index: number, field: string, value: string) => void;
  onScrollToPreview: () => void;
  docLang: DocLang;
  templateId: CVTemplateId;
  paletteId: CVPaletteId;
  bodyFontId: CVFontId;
  headingFontId: CVFontId;
  onSelectTemplate: (id: CVTemplateId) => void;
  onSelectPalette: (id: CVPaletteId) => void;
  onSelectBodyFont: (id: CVFontId) => void;
  onSelectHeadingFont: (id: CVFontId) => void;
  onResetTheme: () => void;
}

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-slate-900 transition-colors';

const ITEM_INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-slate-900 transition-colors';

interface AccordionCardProps {
  id: SectionId;
  step: number;
  title: string;
  countText?: string;
  isOpen: boolean;
  onToggle: (id: SectionId) => void;
  children: React.ReactNode;
}

const AccordionCard: React.FC<AccordionCardProps> = ({
  id,
  step,
  title,
  countText,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={`panel-${id}`}
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-right hover:bg-slate-50/90 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-slate-900"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono-num text-xs font-semibold text-slate-400 shrink-0 w-5 text-center">
            0{step}
          </span>
          <span className="font-bold text-slate-900 text-sm truncate">{title}</span>
          {countText && (
            <span className="text-xs text-slate-500 font-medium font-mono-num shrink-0">
              · {countText}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id={`panel-${id}`} className="p-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

interface ItemHeaderProps {
  label: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const ItemHeader: React.FC<ItemHeaderProps> = ({
  label,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => (
  <div className="flex items-center justify-between gap-2 pb-1">
    <span className="text-xs font-bold text-slate-600 font-mono-num">
      {label} #{index + 1}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={onMoveUp}
        aria-label={`نقل ${label} رقم ${index + 1} للأعلى`}
        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={onMoveDown}
        aria-label={`نقل ${label} رقم ${index + 1} للأسفل`}
        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`حذف ${label} رقم ${index + 1}`}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
        <span>حذف</span>
      </button>
    </div>
  </div>
);

export const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  skillsInput,
  languagesInput,
  openSections,
  onToggleSection,
  onUpdatePersonal,
  onUploadPhoto,
  onRemovePhoto,
  onResetPhotoFraming,
  photoError,
  onUpdateCoverLetter,
  onSkillsInputChange,
  onLanguagesInputChange,
  onAddItem,
  onRemoveItem,
  onMoveItem,
  onUpdateItem,
  onScrollToPreview,
  docLang,
  templateId,
  paletteId,
  bodyFontId,
  headingFontId,
  onSelectTemplate,
  onSelectPalette,
  onSelectBodyFont,
  onSelectHeadingFont,
  onResetTheme,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const researchTotal = data.publications.length + data.research.length;
  const awardsTotal = data.awards.length + data.certifications.length;

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
      event.target.value = '';
    }
  };

  return (
    <section aria-label="نموذج تحرير بيانات السيرة الذاتية" className="no-print lg:col-span-5 flex flex-col gap-3">
      {/* Dedicated CV Theme, Color Palette & Fonts Designer */}
      <ThemeDesignerCard
        docLang={docLang}
        templateId={templateId}
        paletteId={paletteId}
        bodyFontId={bodyFontId}
        headingFontId={headingFontId}
        onSelectTemplate={onSelectTemplate}
        onSelectPalette={onSelectPalette}
        onSelectBodyFont={onSelectBodyFont}
        onSelectHeadingFont={onSelectHeadingFont}
        onResetTheme={onResetTheme}
      />

      {/* 1. Personal & Contact */}
      <AccordionCard
        id="personal"
        step={1}
        title="البيانات الشخصية والتواصل"
        isOpen={openSections.personal}
        onToggle={onToggleSection}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Personal Photo Uploader */}
          <div className="sm:col-span-2 pb-3 mb-1 border-b border-slate-100">
            <span className="block text-xs font-bold text-slate-700 mb-2">
              الصورة الشخصية (اختياري)
            </span>
            <div className="flex flex-wrap items-center gap-3.5">
              <div
                className={`w-16 h-16 shrink-0 bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center ${
                  data.personal.photoShape === 'rounded' ? 'rounded-xl' : 'rounded-full'
                }`}
              >
                {data.personal.photo ? (
                  <img
                    src={data.personal.photo}
                    alt={data.personal.fullName || 'الصورة الشخصية'}
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${data.personal.photoPosX}% ${data.personal.photoPosY}%`,
                      transform:
                        data.personal.photoZoom > 1
                          ? `scale(${data.personal.photoZoom})`
                          : undefined,
                      transformOrigin: `${data.personal.photoPosX}% ${data.personal.photoPosY}%`,
                    }}
                  />
                ) : (
                  <User className="w-7 h-7 text-slate-400" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-[200px] space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{data.personal.photo ? 'تغيير الصورة' : 'رفع صورة شخصية'}</span>
                  </button>

                  {data.personal.photo && (
                    <>
                      <div
                        role="group"
                        aria-label="شكل إطار الصورة"
                        className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
                      >
                        <button
                          type="button"
                          aria-pressed={data.personal.photoShape === 'circle'}
                          onClick={() => onUpdatePersonal('photoShape', 'circle')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            data.personal.photoShape === 'circle'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          دائرية
                        </button>
                        <button
                          type="button"
                          aria-pressed={data.personal.photoShape === 'rounded'}
                          onClick={() => onUpdatePersonal('photoShape', 'rounded')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            data.personal.photoShape === 'rounded'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          مربعة
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={onRemovePhoto}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>حذف الصورة</span>
                      </button>
                    </>
                  )}
                </div>

                <input
                  ref={photoInputRef}
                  id="input-photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoFileChange}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="sr-only"
                />

                {photoError ? (
                  <p role="alert" className="text-xs font-semibold text-rose-600">
                    {photoError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    JPG أو PNG أو WebP · حتى 10 ميجابايت · جودة طباعة عالية دون تعديل بياناتك.
                  </p>
                )}
              </div>
            </div>

            {data.personal.photo && (
              <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-700">
                    ضبط موضع وتكبير الصورة داخل الإطار
                  </span>
                  <button
                    type="button"
                    onClick={onResetPhotoFraming}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>إعادة ضبط</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <label htmlFor="input-photo-zoom" className="font-semibold">
                        التكبير
                      </label>
                      <span className="font-mono-num font-semibold text-slate-800">
                        {Math.round(data.personal.photoZoom * 100)}%
                      </span>
                    </div>
                    <input
                      id="input-photo-zoom"
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={data.personal.photoZoom}
                      onChange={(e) => onUpdatePersonal('photoZoom', Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <label htmlFor="input-photo-posy" className="font-semibold">
                        أعلى / أسفل
                      </label>
                      <span className="font-mono-num font-semibold text-slate-800">
                        {Math.round(data.personal.photoPosY)}%
                      </span>
                    </div>
                    <input
                      id="input-photo-posy"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={data.personal.photoPosY}
                      onChange={(e) => onUpdatePersonal('photoPosY', Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                      <label htmlFor="input-photo-posx" className="font-semibold">
                        يمين / يسار
                      </label>
                      <span className="font-mono-num font-semibold text-slate-800">
                        {Math.round(data.personal.photoPosX)}%
                      </span>
                    </div>
                    <input
                      id="input-photo-posx"
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={data.personal.photoPosX}
                      onChange={(e) => onUpdatePersonal('photoPosX', Number(e.target.value))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="input-fullName" className="block text-xs font-bold text-slate-700 mb-1">
              الاسم الكامل
            </label>
            <input
              id="input-fullName"
              type="text"
              value={data.personal.fullName}
              onChange={(e) => onUpdatePersonal('fullName', e.target.value)}
              placeholder="مثال: Dr. Sarah Ahmed / سارة أحمد"
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-title" className="block text-xs font-bold text-slate-700 mb-1">
              المسمى الوظيفي / الأكاديمي
            </label>
            <input
              id="input-title"
              type="text"
              value={data.personal.title}
              onChange={(e) => onUpdatePersonal('title', e.target.value)}
              placeholder="مثال: Food Technology Researcher & Quality Specialist"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-phone" className="block text-xs font-bold text-slate-700 mb-1">
              رقم الهاتف
            </label>
            <input
              id="input-phone"
              type="text"
              dir="ltr"
              value={data.personal.phone}
              onChange={(e) => onUpdatePersonal('phone', e.target.value)}
              placeholder="+20 123 456 7890"
              className={`${INPUT_CLASS} text-right`}
            />
          </div>
          <div>
            <label htmlFor="input-email" className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              id="input-email"
              type="email"
              dir="ltr"
              value={data.personal.email}
              onChange={(e) => onUpdatePersonal('email', e.target.value)}
              placeholder="name@university.edu.eg"
              className={`${INPUT_CLASS} text-right`}
            />
          </div>
          <div>
            <label htmlFor="input-location" className="block text-xs font-bold text-slate-700 mb-1">
              الموقع (المدينة، الدولة)
            </label>
            <input
              id="input-location"
              type="text"
              value={data.personal.location}
              onChange={(e) => onUpdatePersonal('location', e.target.value)}
              placeholder="Cairo, Egypt"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-website" className="block text-xs font-bold text-slate-700 mb-1">
              LinkedIn / ORCID / Google Scholar
            </label>
            <input
              id="input-website"
              type="text"
              dir="ltr"
              value={data.personal.website}
              onChange={(e) => onUpdatePersonal('website', e.target.value)}
              placeholder="orcid.org/0000-0002-..."
              className={`${INPUT_CLASS} text-right`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-profile" className="block text-xs font-bold text-slate-700 mb-1">
              النبذة الشخصية والأكاديمية (Profile)
            </label>
            <textarea
              id="input-profile"
              rows={3}
              value={data.personal.profile}
              onChange={(e) => onUpdatePersonal('profile', e.target.value)}
              placeholder="ملخص مختصر وقوي يوضح خبراتك وأهدافك البحثية أو المهنية..."
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </AccordionCard>

      {/* 2. Academic Education */}
      <AccordionCard
        id="education"
        step={2}
        title="التعليم الأكاديمي (Education)"
        countText={`${data.education.length}`}
        isOpen={openSections.education}
        onToggle={onToggleSection}
      >
        <div className="space-y-3">
          {data.education.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <ItemHeader
                label="مؤهل"
                index={i}
                total={data.education.length}
                onMoveUp={() => onMoveItem('education', i, 'up')}
                onMoveDown={() => onMoveItem('education', i, 'down')}
                onRemove={() => onRemoveItem('education', i)}
              />
              <input
                type="text"
                aria-label={`الدرجة العلمية للمؤهل ${i + 1}`}
                value={item.degree}
                onChange={(e) => onUpdateItem('education', i, 'degree', e.target.value)}
                placeholder="الدرجة العلمية (مثال: Ph.D. in Food Science)"
                className={ITEM_INPUT_CLASS}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  aria-label={`الجامعة للمؤهل ${i + 1}`}
                  value={item.institution}
                  onChange={(e) => onUpdateItem('education', i, 'institution', e.target.value)}
                  placeholder="الجامعة / المؤسسة"
                  className={ITEM_INPUT_CLASS}
                />
                <input
                  type="text"
                  aria-label={`سنة التخرج للمؤهل ${i + 1}`}
                  value={item.year}
                  onChange={(e) => onUpdateItem('education', i, 'year', e.target.value)}
                  placeholder="سنة التخرج (مثال: 2022)"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
              <input
                type="text"
                aria-label={`الموقع للمؤهل ${i + 1}`}
                value={item.location}
                onChange={(e) => onUpdateItem('education', i, 'location', e.target.value)}
                placeholder="الموقع (مثال: Cairo, Egypt)"
                className={ITEM_INPUT_CLASS}
              />
              <input
                type="text"
                aria-label={`تفاصيل إضافية للمؤهل ${i + 1}`}
                value={item.details}
                onChange={(e) => onUpdateItem('education', i, 'details', e.target.value)}
                placeholder="تفاصيل إضافية (عنوان الرسالة / التقدير)"
                className={ITEM_INPUT_CLASS}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAddItem('education')}
            className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>إضافة مؤهل أكاديمي</span>
          </button>
        </div>
      </AccordionCard>

      {/* 3. Experience */}
      <AccordionCard
        id="experience"
        step={3}
        title="الخبرات العملية والإنجازات (Experience)"
        countText={`${data.experience.length}`}
        isOpen={openSections.experience}
        onToggle={onToggleSection}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
            اكتب كل إنجاز في سطر منفصل، واستخدم أرقاماً ونسباً مئوية (مثال: خفض زمن التحليل بنسبة 32%) لتعزيز قوة المستند.
          </p>
          {data.experience.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <ItemHeader
                label="خبرة"
                index={i}
                total={data.experience.length}
                onMoveUp={() => onMoveItem('experience', i, 'up')}
                onMoveDown={() => onMoveItem('experience', i, 'down')}
                onRemove={() => onRemoveItem('experience', i)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  aria-label={`المسمى الوظيفي للخبرة ${i + 1}`}
                  value={item.role}
                  onChange={(e) => onUpdateItem('experience', i, 'role', e.target.value)}
                  placeholder="المسمى الوظيفي"
                  className={ITEM_INPUT_CLASS}
                />
                <input
                  type="text"
                  aria-label={`جهة العمل للخبرة ${i + 1}`}
                  value={item.company}
                  onChange={(e) => onUpdateItem('experience', i, 'company', e.target.value)}
                  placeholder="جهة العمل / الجامعة"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  aria-label={`الفترة للخبرة ${i + 1}`}
                  value={item.period}
                  onChange={(e) => onUpdateItem('experience', i, 'period', e.target.value)}
                  placeholder="الفترة (2022 – Present)"
                  className={ITEM_INPUT_CLASS}
                />
                <input
                  type="text"
                  aria-label={`الموقع للخبرة ${i + 1}`}
                  value={item.location}
                  onChange={(e) => onUpdateItem('experience', i, 'location', e.target.value)}
                  placeholder="الموقع"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
              <textarea
                rows={3}
                aria-label={`الإنجازات للخبرة ${i + 1}`}
                value={item.achievements}
                onChange={(e) => onUpdateItem('experience', i, 'achievements', e.target.value)}
                placeholder="أبرز الإنجازات بالأرقام (كل إنجاز في سطر منفصل)"
                className={ITEM_INPUT_CLASS}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAddItem('experience')}
            className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>إضافة خبرة عملية</span>
          </button>
        </div>
      </AccordionCard>

      {/* 4. Publications & Research Projects */}
      <AccordionCard
        id="research"
        step={4}
        title="المنشورات والأبحاث العلمية (CV)"
        countText={`${researchTotal}`}
        isOpen={openSections.research}
        onToggle={onToggleSection}
      >
        <div className="space-y-5">
          {/* Publications */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-700">
              المنشورات العلمية (Extensive Publications)
            </h4>
            {data.publications.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <ItemHeader
                  label="منشور"
                  index={i}
                  total={data.publications.length}
                  onMoveUp={() => onMoveItem('publications', i, 'up')}
                  onMoveDown={() => onMoveItem('publications', i, 'down')}
                  onRemove={() => onRemoveItem('publications', i)}
                />
                <input
                  type="text"
                  aria-label={`عنوان البحث المنشور ${i + 1}`}
                  value={item.title}
                  onChange={(e) => onUpdateItem('publications', i, 'title', e.target.value)}
                  placeholder="عنوان البحث المنشور"
                  className={ITEM_INPUT_CLASS}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    aria-label={`المجلة العلمية للمنشور ${i + 1}`}
                    value={item.journal}
                    onChange={(e) => onUpdateItem('publications', i, 'journal', e.target.value)}
                    placeholder="المجلة العلمية / الناشر"
                    className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                  />
                  <input
                    type="text"
                    aria-label={`سنة النشر للمنشور ${i + 1}`}
                    value={item.year}
                    onChange={(e) => onUpdateItem('publications', i, 'year', e.target.value)}
                    placeholder="السنة"
                    className={ITEM_INPUT_CLASS}
                  />
                </div>
                <input
                  type="text"
                  aria-label={`المؤلفون المشاركون للمنشور ${i + 1}`}
                  value={item.coauthors}
                  onChange={(e) => onUpdateItem('publications', i, 'coauthors', e.target.value)}
                  placeholder="المؤلفون المشاركون"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddItem('publications')}
              className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة بحث منشور</span>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Research Projects */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-700">
              المشاريع البحثية (Research Projects)
            </h4>
            {data.research.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <ItemHeader
                  label="مشروع بحثي"
                  index={i}
                  total={data.research.length}
                  onMoveUp={() => onMoveItem('research', i, 'up')}
                  onMoveDown={() => onMoveItem('research', i, 'down')}
                  onRemove={() => onRemoveItem('research', i)}
                />
                <input
                  type="text"
                  aria-label={`اسم المشروع البحثي ${i + 1}`}
                  value={item.title}
                  onChange={(e) => onUpdateItem('research', i, 'title', e.target.value)}
                  placeholder="اسم المشروع البحثي"
                  className={ITEM_INPUT_CLASS}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    aria-label={`المؤسسة للمشروع ${i + 1}`}
                    value={item.institution}
                    onChange={(e) => onUpdateItem('research', i, 'institution', e.target.value)}
                    placeholder="المؤسسة / الجهة الممولة"
                    className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                  />
                  <input
                    type="text"
                    aria-label={`الفترة للمشروع ${i + 1}`}
                    value={item.year}
                    onChange={(e) => onUpdateItem('research', i, 'year', e.target.value)}
                    placeholder="الفترة"
                    className={ITEM_INPUT_CLASS}
                  />
                </div>
                <input
                  type="text"
                  aria-label={`دورك في المشروع ${i + 1}`}
                  value={item.role}
                  onChange={(e) => onUpdateItem('research', i, 'role', e.target.value)}
                  placeholder="دورك (مثال: Principal Investigator)"
                  className={ITEM_INPUT_CLASS}
                />
                <textarea
                  rows={2}
                  aria-label={`وصف المشروع ${i + 1}`}
                  value={item.description}
                  onChange={(e) => onUpdateItem('research', i, 'description', e.target.value)}
                  placeholder="وصف مختصر للمشروع ونتائجه"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddItem('research')}
              className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة مشروع بحثي</span>
            </button>
          </div>
        </div>
      </AccordionCard>

      {/* 5. Conferences, Grants & Teaching */}
      <AccordionCard
        id="conferences"
        step={5}
        title="المؤتمرات، المنح والخبرة التدريسية (CV)"
        countText={`${data.conferences.length}`}
        isOpen={openSections.conferences}
        onToggle={onToggleSection}
      >
        <div className="space-y-3">
          {data.conferences.map((item, i) => (
            <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <ItemHeader
                label="بند"
                index={i}
                total={data.conferences.length}
                onMoveUp={() => onMoveItem('conferences', i, 'up')}
                onMoveDown={() => onMoveItem('conferences', i, 'down')}
                onRemove={() => onRemoveItem('conferences', i)}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  aria-label={`نوع البند ${i + 1}`}
                  value={item.type}
                  onChange={(e) => onUpdateItem('conferences', i, 'type', e.target.value)}
                  placeholder="النوع (Conference/Grant)"
                  className={ITEM_INPUT_CLASS}
                />
                <input
                  type="text"
                  aria-label={`عنوان البند ${i + 1}`}
                  value={item.title}
                  onChange={(e) => onUpdateItem('conferences', i, 'title', e.target.value)}
                  placeholder="العنوان"
                  className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  aria-label={`الجهة المنظمة للبند ${i + 1}`}
                  value={item.organization}
                  onChange={(e) => onUpdateItem('conferences', i, 'organization', e.target.value)}
                  placeholder="الجهة المنظمة / المانحة"
                  className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                />
                <input
                  type="text"
                  aria-label={`السنة للبند ${i + 1}`}
                  value={item.year}
                  onChange={(e) => onUpdateItem('conferences', i, 'year', e.target.value)}
                  placeholder="السنة"
                  className={ITEM_INPUT_CLASS}
                />
              </div>
              <input
                type="text"
                aria-label={`تفاصيل البند ${i + 1}`}
                value={item.details}
                onChange={(e) => onUpdateItem('conferences', i, 'details', e.target.value)}
                placeholder="تفاصيل مختصرة"
                className={ITEM_INPUT_CLASS}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAddItem('conferences')}
            className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>إضافة مؤتمر / منحة / خبرة تدريسية</span>
          </button>
        </div>
      </AccordionCard>

      {/* 6. Awards & Certifications */}
      <AccordionCard
        id="awards"
        step={6}
        title="الجوائز والشهادات والتدريبات"
        countText={`${awardsTotal}`}
        isOpen={openSections.awards}
        onToggle={onToggleSection}
      >
        <div className="space-y-5">
          {/* Awards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-700">
              الجوائز والتكريمات (Awards & Honors)
            </h4>
            {data.awards.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <ItemHeader
                  label="جائزة"
                  index={i}
                  total={data.awards.length}
                  onMoveUp={() => onMoveItem('awards', i, 'up')}
                  onMoveDown={() => onMoveItem('awards', i, 'down')}
                  onRemove={() => onRemoveItem('awards', i)}
                />
                <input
                  type="text"
                  aria-label={`اسم الجائزة ${i + 1}`}
                  value={item.title}
                  onChange={(e) => onUpdateItem('awards', i, 'title', e.target.value)}
                  placeholder="اسم الجائزة"
                  className={ITEM_INPUT_CLASS}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    aria-label={`الجهة المانحة للجائزة ${i + 1}`}
                    value={item.issuer}
                    onChange={(e) => onUpdateItem('awards', i, 'issuer', e.target.value)}
                    placeholder="الجهة المانحة"
                    className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                  />
                  <input
                    type="text"
                    aria-label={`سنة الجائزة ${i + 1}`}
                    value={item.year}
                    onChange={(e) => onUpdateItem('awards', i, 'year', e.target.value)}
                    placeholder="السنة"
                    className={ITEM_INPUT_CLASS}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddItem('awards')}
              className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة جائزة</span>
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Certifications */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-700">
              الشهادات والتدريبات المكثفة (Certifications & Training)
            </h4>
            {data.certifications.map((item, i) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <ItemHeader
                  label="شهادة"
                  index={i}
                  total={data.certifications.length}
                  onMoveUp={() => onMoveItem('certifications', i, 'up')}
                  onMoveDown={() => onMoveItem('certifications', i, 'down')}
                  onRemove={() => onRemoveItem('certifications', i)}
                />
                <input
                  type="text"
                  aria-label={`اسم الشهادة ${i + 1}`}
                  value={item.title}
                  onChange={(e) => onUpdateItem('certifications', i, 'title', e.target.value)}
                  placeholder="اسم الشهادة أو التدريب"
                  className={ITEM_INPUT_CLASS}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    aria-label={`الجهة المصدرة للشهادة ${i + 1}`}
                    value={item.issuer}
                    onChange={(e) => onUpdateItem('certifications', i, 'issuer', e.target.value)}
                    placeholder="الجهة المصدرة"
                    className={`col-span-2 ${ITEM_INPUT_CLASS}`}
                  />
                  <input
                    type="text"
                    aria-label={`سنة الشهادة ${i + 1}`}
                    value={item.year}
                    onChange={(e) => onUpdateItem('certifications', i, 'year', e.target.value)}
                    placeholder="السنة"
                    className={ITEM_INPUT_CLASS}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onAddItem('certifications')}
              className="w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:border-slate-900 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>إضافة شهادة / تدريب</span>
            </button>
          </div>
        </div>
      </AccordionCard>

      {/* 7. Skills & Languages */}
      <AccordionCard
        id="skills"
        step={7}
        title="المهارات واللغات (Skills & Languages)"
        countText={`${data.skills.length + data.languages.length}`}
        isOpen={openSections.skills}
        onToggle={onToggleSection}
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="input-skills" className="block text-xs font-bold text-slate-700 mb-1">
              المهارات التقنية والبحثية (افصل بينها بفاصلة , أو ،)
            </label>
            <textarea
              id="input-skills"
              rows={2}
              value={skillsInput}
              onChange={(e) => onSkillsInputChange(e.target.value)}
              placeholder="HACCP, ISO 22000, Statistical Analysis (SPSS), Python, LIMS"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-languages" className="block text-xs font-bold text-slate-700 mb-1">
              اللغات (افصل بينها بفاصلة , أو ،)
            </label>
            <input
              id="input-languages"
              type="text"
              value={languagesInput}
              onChange={(e) => onLanguagesInputChange(e.target.value)}
              placeholder="Arabic (Native), English (Fluent), German (Intermediate)"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </AccordionCard>

      {/* 8. Cover Letter */}
      <AccordionCard
        id="cover"
        step={8}
        title="بيانات خطاب التقديم (Cover Letter)"
        isOpen={openSections.cover}
        onToggle={onToggleSection}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="input-cl-date" className="block text-xs font-bold text-slate-700 mb-1">
              تاريخ الخطاب
            </label>
            <input
              id="input-cl-date"
              type="text"
              value={data.coverLetter.date}
              onChange={(e) => onUpdateCoverLetter('date', e.target.value)}
              placeholder="22 November 2026"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-cl-manager" className="block text-xs font-bold text-slate-700 mb-1">
              اسم مسؤول التوظيف
            </label>
            <input
              id="input-cl-manager"
              type="text"
              value={data.coverLetter.hiringManager}
              onChange={(e) => onUpdateCoverLetter('hiringManager', e.target.value)}
              placeholder="Hiring Manager"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-cl-company" className="block text-xs font-bold text-slate-700 mb-1">
              اسم الشركة / المؤسسة
            </label>
            <input
              id="input-cl-company"
              type="text"
              value={data.coverLetter.company}
              onChange={(e) => onUpdateCoverLetter('company', e.target.value)}
              placeholder="Innovate Food Solutions"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="input-cl-role" className="block text-xs font-bold text-slate-700 mb-1">
              الوظيفة المستهدفة
            </label>
            <input
              id="input-cl-role"
              type="text"
              value={data.coverLetter.targetRole}
              onChange={(e) => onUpdateCoverLetter('targetRole', e.target.value)}
              placeholder="Senior Food Technologist"
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-cl-intro" className="block text-xs font-bold text-slate-700 mb-1">
              الفقرة الأولى (الحماس والدافع للتقديم)
            </label>
            <textarea
              id="input-cl-intro"
              rows={2}
              value={data.coverLetter.intro}
              onChange={(e) => onUpdateCoverLetter('intro', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-cl-body" className="block text-xs font-bold text-slate-700 mb-1">
              الفقرة الثانية (أبرز الخبرات والإنجازات بالأرقام)
            </label>
            <textarea
              id="input-cl-body"
              rows={3}
              value={data.coverLetter.body}
              onChange={(e) => onUpdateCoverLetter('body', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="input-cl-closing" className="block text-xs font-bold text-slate-700 mb-1">
              الفقرة الثالثة (القيمة المضافة والخاتمة)
            </label>
            <textarea
              id="input-cl-closing"
              rows={2}
              value={data.coverLetter.closing}
              onChange={(e) => onUpdateCoverLetter('closing', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </AccordionCard>

      {/* Scroll to Preview CTA (especially helpful on mobile/tablet) */}
      <button
        type="button"
        onClick={onScrollToPreview}
        className="w-full py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <FileCheck2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>إنشاء وعرض المستند الكامل</span>
      </button>
    </section>
  );
};
