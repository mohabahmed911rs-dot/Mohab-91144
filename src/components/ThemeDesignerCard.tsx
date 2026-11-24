import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, LayoutTemplate, Palette, RotateCcw, Search, Type } from 'lucide-react';
import {
  CV_FONTS,
  CV_PALETTES,
  CV_TEMPLATES,
  DEFAULT_FONT_ID,
  DEFAULT_HEADING_FONT_ID,
  DEFAULT_PALETTE_ID,
  DEFAULT_TEMPLATE_ID,
  getFontById,
  getPaletteById,
  getTemplateById,
  resolveFontStack,
} from '../data/themes';
import type { CVFontCategory, CVFontId, CVPaletteId, CVTemplateId, DocLang } from '../types/cv';
import { ensureAllCatalogFontsLoaded } from '../utils/fontLoader';

type DesignerTab = 'templates' | 'palettes' | 'fonts';
type FontFilter = 'all' | CVFontCategory;
type FontTarget = 'body' | 'heading';

interface ThemeDesignerCardProps {
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

const TemplateMiniPreview: React.FC<{
  id: CVTemplateId;
  primary: string;
  accent: string;
  tint: string;
}> = ({ id, primary, accent, tint }) => {
  if (id === 'sidebar') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-12 rounded-md border border-slate-200 overflow-hidden bg-white flex"
      >
        <div className="w-1/3 h-full p-1 flex flex-col gap-1" style={{ backgroundColor: primary }}>
          <div className="w-3 h-3 rounded-full mx-auto bg-white/25" />
          <div className="h-1 w-4/5 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-0.5 w-full rounded-full bg-white/30" />
          <div className="h-0.5 w-3/4 rounded-full bg-white/25" />
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-1">
          <div className="h-1.5 w-3/4 rounded-full bg-slate-800" />
          <div className="h-0.5 w-1/2 rounded-full bg-slate-300" />
          <div className="h-0.5 w-full rounded-full bg-slate-200 mt-1" />
          <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
        </div>
      </div>
    );
  }

  if (id === 'executive') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-12 rounded-md border border-slate-200 overflow-hidden bg-white flex flex-col"
      >
        <div
          className="h-4 w-full px-1.5 flex items-center justify-between"
          style={{ backgroundColor: primary }}
        >
          <div className="space-y-0.5 w-3/5">
            <div className="h-1 w-4/5 rounded-full bg-white/90" />
            <div className="h-0.5 w-1/2 rounded-full" style={{ backgroundColor: accent }} />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/30 shrink-0" />
        </div>
        <div className="flex-1 flex">
          <div className="w-2/3 p-1.5 space-y-1">
            <div className="h-0.5 w-3/4 rounded-full bg-slate-700" />
            <div className="h-0.5 w-full rounded-full bg-slate-200" />
            <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
          </div>
          <div
            className="w-1/3 p-1 space-y-1 border-s border-slate-200/70"
            style={{ backgroundColor: tint }}
          >
            <div className="h-0.5 w-3/4 rounded-full" style={{ backgroundColor: accent }} />
            <div className="h-0.5 w-full rounded-full bg-slate-300" />
            <div className="h-0.5 w-2/3 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  if (id === 'academic') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-12 rounded-md border border-slate-200 overflow-hidden bg-white flex flex-col"
      >
        <div className="h-1 w-full" style={{ backgroundColor: primary }} />
        <div className="p-1.5 flex flex-col items-center gap-1">
          <div className="h-1.5 w-1/2 rounded-full bg-slate-800" />
          <div className="h-0.5 w-2/3 rounded-full" style={{ backgroundColor: accent }} />
          <div className="w-full h-px bg-slate-200 my-0.5" />
          <div className="w-full space-y-1">
            <div className="h-0.5 w-full rounded-full bg-slate-200" />
            <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="w-full h-12 rounded-md border border-slate-200 overflow-hidden bg-white flex flex-col"
    >
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="flex-1 flex">
        <div
          className="w-1/3 h-full p-1 flex flex-col gap-1 border-e border-slate-200/70"
          style={{ backgroundColor: tint }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full mx-auto border"
            style={{ borderColor: primary }}
          />
          <div className="h-0.5 w-4/5 rounded-full" style={{ backgroundColor: primary }} />
          <div className="h-0.5 w-full rounded-full bg-slate-300" />
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-1">
          <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: primary }} />
          <div className="h-0.5 w-full rounded-full bg-slate-200 mt-0.5" />
          <div className="h-0.5 w-5/6 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

const FONT_FILTERS: ReadonlyArray<{ id: FontFilter; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'sans', label: 'إنجليزي حديث' },
  { id: 'serif', label: 'أكاديمي Serif' },
  { id: 'arabic', label: 'عربي' },
];

export const ThemeDesignerCard: React.FC<ThemeDesignerCardProps> = ({
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
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DesignerTab>('templates');
  const [fontFilter, setFontFilter] = useState<FontFilter>('all');
  const [fontTarget, setFontTarget] = useState<FontTarget>('body');
  const [fontSearch, setFontSearch] = useState('');

  const activeTemplate = getTemplateById(templateId);
  const activePalette = getPaletteById(paletteId);
  const activeBodyFont = getFontById(bodyFontId);
  const activeHeadingFont = getFontById(headingFontId);

  const isCustom =
    templateId !== DEFAULT_TEMPLATE_ID ||
    paletteId !== DEFAULT_PALETTE_ID ||
    bodyFontId !== DEFAULT_FONT_ID ||
    headingFontId !== DEFAULT_HEADING_FONT_ID;

  // Load all catalog fonts on demand as soon as the user opens the Fonts tab
  useEffect(() => {
    if (isOpen && activeTab === 'fonts') {
      void ensureAllCatalogFontsLoaded();
    }
  }, [isOpen, activeTab]);

  const activeFontSummary = useMemo(() => {
    if (bodyFontId === 'auto' && headingFontId === 'auto') {
      return 'الخط الافتراضي';
    }
    if (headingFontId !== 'auto' && headingFontId !== bodyFontId) {
      return `${activeHeadingFont.arabicLabel} + ${activeBodyFont.arabicLabel}`;
    }
    return activeBodyFont.name;
  }, [bodyFontId, headingFontId, activeBodyFont, activeHeadingFont]);

  const filteredFonts = useMemo(() => {
    const query = fontSearch.trim().toLowerCase();
    return CV_FONTS.filter((font) => {
      if (font.id === 'auto') {
        return query === '' || font.name.toLowerCase().includes(query) || 'افتراضي'.includes(query);
      }
      if (fontFilter !== 'all' && font.category !== fontFilter) {
        return false;
      }
      if (!query) return true;
      return (
        font.name.toLowerCase().includes(query) ||
        font.arabicLabel.toLowerCase().includes(query) ||
        font.subtitle.toLowerCase().includes(query) ||
        font.familyName.toLowerCase().includes(query)
      );
    });
  }, [fontFilter, fontSearch]);

  const selectedFontForTarget = fontTarget === 'body' ? bodyFontId : headingFontId;
  const handleSelectFontForTarget = (id: CVFontId) => {
    if (fontTarget === 'body') {
      onSelectBodyFont(id);
    } else {
      onSelectHeadingFont(id);
    }
  };

  return (
    <div
      data-testid="theme-designer-card"
      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="panel-theme-designer"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-right hover:bg-slate-50/90 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-slate-900"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">تصميم المستند والخطوط</span>
              <span className="text-slate-300 text-xs" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-semibold text-slate-600 truncate">
                {activeTemplate.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            aria-hidden="true"
            className="inline-flex items-center -space-x-1 rtl:space-x-reverse"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: activePalette.primary }}
            />
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
              style={{ backgroundColor: activePalette.accent }}
            />
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && (
        <div id="panel-theme-designer" className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3.5">
          {/* Compact 3-Tab Switcher: Templates | Colors | Fonts */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              role="tablist"
              aria-label="خيارات تخصيص شكل وألوان وخطوط السيرة الذاتية"
              className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'templates'}
                data-testid="designer-tab-templates"
                onClick={() => setActiveTab('templates')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>القوالب</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'palettes'}
                data-testid="designer-tab-palettes"
                onClick={() => setActiveTab('palettes')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'palettes'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>الألوان</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'fonts'}
                data-testid="designer-tab-fonts"
                onClick={() => setActiveTab('fonts')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'fonts'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>الخطوط ({CV_FONTS.length - 1})</span>
              </button>
            </div>

            {isCustom && (
              <button
                type="button"
                data-testid="reset-theme-btn"
                onClick={onResetTheme}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>استعادة الأصلي</span>
              </button>
            )}
          </div>

          {/* Tab 1: CV Templates */}
          {activeTab === 'templates' && (
            <div role="tabpanel" aria-label="اختيار قالب وتصميم السيرة الذاتية">
              <div
                role="radiogroup"
                aria-label="اختيار شكل وتصميم السيرة الذاتية"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {CV_TEMPLATES.map((tpl) => {
                  const selected = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`template-option-${tpl.id}`}
                      onClick={() => onSelectTemplate(tpl.id)}
                      className={`p-2 rounded-lg border text-right transition-all cursor-pointer flex flex-col gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                        selected
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <TemplateMiniPreview
                        id={tpl.id}
                        primary={activePalette.primary}
                        accent={activePalette.accentOnDark}
                        tint={activePalette.surfaceTint}
                      />
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-slate-900 leading-tight truncate">
                          {tpl.name}
                        </span>
                        {selected && (
                          <Check className="w-3 h-3 text-slate-900 shrink-0" aria-hidden="true" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">{activeTemplate.subtitle}</p>
            </div>
          )}

          {/* Tab 2: Color Palettes */}
          {activeTab === 'palettes' && (
            <div role="tabpanel" aria-label="اختيار باليت ألوان السيرة الذاتية">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700">
                  باليت ألوان المستند (ألوان الموقع الرئيسية ثابتة)
                </span>
                <span className="text-[11px] font-medium text-slate-500">{activePalette.name}</span>
              </div>

              <div
                role="radiogroup"
                aria-label="اختيار باليت ألوان السيرة الذاتية"
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {CV_PALETTES.map((pal) => {
                  const selected = paletteId === pal.id;
                  return (
                    <button
                      key={pal.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`palette-option-${pal.id}`}
                      onClick={() => onSelectPalette(pal.id)}
                      className={`px-2.5 py-2 rounded-lg border flex items-center justify-between gap-2 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                        selected
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          aria-hidden="true"
                          className="inline-flex items-center -space-x-1 rtl:space-x-reverse shrink-0"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: pal.primary }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-white shadow-xs"
                            style={{ backgroundColor: pal.accent }}
                          />
                        </span>
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {pal.name}
                        </span>
                      </div>
                      {selected && (
                        <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Document Fonts Library */}
          {activeTab === 'fonts' && (
            <div role="tabpanel" aria-label="اختيار خطوط السيرة الذاتية" className="space-y-2.5">
              {/* Target Toggle (Whole Document vs Headings Only) & Active Font Readout */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div
                  role="group"
                  aria-label="تطبيق الخط على كامل الملف أو العناوين فقط"
                  className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
                >
                  <button
                    type="button"
                    data-testid="font-target-body"
                    aria-pressed={fontTarget === 'body'}
                    onClick={() => setFontTarget('body')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      fontTarget === 'body'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    كامل الملف
                  </button>
                  <button
                    type="button"
                    data-testid="font-target-heading"
                    aria-pressed={fontTarget === 'heading'}
                    onClick={() => setFontTarget('heading')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      fontTarget === 'heading'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    العناوين فقط
                  </button>
                </div>

                <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[180px]">
                  {activeFontSummary}
                </span>
              </div>

              {/* Search + Category Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    data-testid="font-search-input"
                    aria-label="ابحث باسم الخط"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="ابحث عن خط (مثل: Inter, Merriweather, Amiri)..."
                    className="w-full rounded-lg border border-slate-200 bg-white pr-8 pl-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-slate-900"
                  />
                </div>
              </div>

              <div
                role="group"
                aria-label="تصفية الخطوط حسب الفئة"
                className="flex items-center gap-1.5 flex-wrap"
              >
                {FONT_FILTERS.map((flt) => {
                  const active = fontFilter === flt.id;
                  return (
                    <button
                      key={flt.id}
                      type="button"
                      data-testid={`font-filter-${flt.id}`}
                      aria-pressed={active}
                      onClick={() => setFontFilter(flt.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {flt.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Font Catalog Grid with Real Typeface Specimens */}
              <div
                role="radiogroup"
                aria-label={
                  fontTarget === 'body' ? 'اختيار خط كامل المستند' : 'اختيار خط عناوين المستند'
                }
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[235px] overflow-y-auto custom-scroll pe-1"
              >
                {filteredFonts.map((font) => {
                  const selected = selectedFontForTarget === font.id;
                  const previewFamily = resolveFontStack(font.id, docLang);
                  const displayTitle =
                    font.id === 'auto' && fontTarget === 'heading'
                      ? 'نفس خط النص (موحد)'
                      : font.name;

                  return (
                    <button
                      key={font.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`font-option-${font.id}`}
                      onClick={() => handleSelectFontForTarget(font.id)}
                      className={`p-2.5 rounded-lg border text-right transition-all cursor-pointer flex flex-col gap-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${
                        selected
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-900 truncate">
                          {displayTitle}
                        </span>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-slate-900 shrink-0" aria-hidden="true" />
                        )}
                      </div>

                      <div
                        dir={font.category === 'arabic' ? 'rtl' : 'ltr'}
                        style={{ fontFamily: previewFamily }}
                        className={`text-sm font-bold text-slate-800 leading-snug truncate ${
                          font.category === 'arabic' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {font.specimen}
                      </div>

                      <span className="text-[10px] text-slate-500 truncate">{font.subtitle}</span>
                    </button>
                  );
                })}

                {filteredFonts.length === 0 && (
                  <p className="sm:col-span-2 text-center text-xs text-slate-500 py-6">
                    لا توجد خطوط مطابقة لبحثك. جرّب اسماً آخر مثل Inter أو Cairo أو Amiri.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
