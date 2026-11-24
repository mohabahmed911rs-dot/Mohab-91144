import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FilePlus2, Printer } from 'lucide-react';
import { DOC_SPECS, LABELS } from '../data/sampleData';
import {
  getDocumentThemeCssVars,
  getFontById,
  getPaletteById,
  getTemplateById,
} from '../data/themes';
import type {
  A4FitMode,
  CVData,
  CVFontId,
  CVPaletteId,
  CVTemplateId,
  DocLang,
  DocType,
} from '../types/cv';
import {
  A4_HEIGHT_MM,
  A4_HEIGHT_PX,
  A4_WIDTH_MM,
  computeA4FitScale,
  estimateA4PageCount,
  hasDocumentContent,
} from '../utils/cvUtils';
import { ensureFontLoaded } from '../utils/fontLoader';
import {
  AcademicClassicSheet,
  CoverLetterSheet,
  ExecutiveTemplateSheet,
  ModernBandSheet,
  SidebarTemplateSheet,
  buildSheetModel,
} from './CVTemplateSheets';

interface DocumentPreviewProps {
  data: CVData;
  docType: DocType;
  docLang: DocLang;
  a4FitMode: A4FitMode;
  templateId: CVTemplateId;
  paletteId: CVPaletteId;
  bodyFontId: CVFontId;
  headingFontId: CVFontId;
  onChangeA4FitMode: (mode: A4FitMode) => void;
  onPrint: () => void;
  onLoadSample: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  data,
  docType,
  docLang,
  a4FitMode,
  templateId,
  paletteId,
  bodyFontId,
  headingFontId,
  onChangeA4FitMode,
  onPrint,
  onLoadSample,
}) => {
  const spec = DOC_SPECS[docType];
  const labels = LABELS[docLang];
  const activePalette = getPaletteById(paletteId);
  const activeTemplate = getTemplateById(templateId);
  const activeBodyFont = getFontById(bodyFontId);
  const activeHeadingFont = getFontById(headingFontId);
  const hasContent = hasDocumentContent(data);
  const usesSplitBackground =
    hasContent &&
    (docType === 'cv' || docType === 'resume') &&
    (templateId === 'sidebar' || templateId === 'modern_band');

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const [naturalHeightPx, setNaturalHeightPx] = useState(A4_HEIGHT_PX);
  const [targetPageHeightPx, setTargetPageHeightPx] = useState(A4_HEIGHT_PX);
  const [isDesktopSheet, setIsDesktopSheet] = useState(true);

  const measureA4Layout = useCallback(
    (forcePrintWidth = false) => {
      const sheetEl = sheetRef.current;
      const contentEl = contentRef.current;
      if (!sheetEl || !contentEl || !hasContent) {
        setFitScale(1);
        setNaturalHeightPx(A4_HEIGHT_PX);
        setTargetPageHeightPx(A4_HEIGHT_PX);
        return;
      }

      const sheetWidth = forcePrintWidth ? 794 : sheetEl.clientWidth;
      const desktop = forcePrintWidth || sheetWidth >= 600;
      setIsDesktopSheet(desktop);

      if (!desktop || sheetWidth <= 0) {
        setFitScale(1);
        setNaturalHeightPx(Math.ceil(contentEl.scrollHeight));
        setTargetPageHeightPx(A4_HEIGHT_PX);
        return;
      }

      const pageHeight = Math.floor(sheetWidth * (A4_HEIGHT_MM / A4_WIDTH_MM));
      setTargetPageHeightPx(pageHeight);

      const prevWidth = contentEl.style.width;
      const prevTransform = contentEl.style.transform;

      contentEl.style.width = '100%';
      contentEl.style.transform = 'none';

      const naturalH = Math.ceil(contentEl.scrollHeight);
      setNaturalHeightPx(naturalH);

      if (a4FitMode !== 'single' || naturalH <= pageHeight + 2) {
        contentEl.style.width = prevWidth;
        contentEl.style.transform = prevTransform;
        setFitScale(1);
        return;
      }

      let low = computeA4FitScale(naturalH, pageHeight);
      let high = 1;

      for (let i = 0; i < 4; i++) {
        const mid = Math.floor(((low + high) / 2) * 1000) / 1000;
        if (mid <= low) break;
        contentEl.style.width = `${(100 / mid).toFixed(4)}%`;
        const midH = Math.ceil(contentEl.scrollHeight);
        if (midH * mid <= pageHeight) {
          low = mid;
        } else {
          high = mid;
        }
      }

      contentEl.style.width = prevWidth;
      contentEl.style.transform = prevTransform;
      setFitScale(low);
    },
    [a4FitMode, hasContent]
  );

  useLayoutEffect(() => {
    measureA4Layout(false);
  }, [measureA4Layout, data, docType, docLang, templateId, paletteId, bodyFontId, headingFontId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([ensureFontLoaded(bodyFontId), ensureFontLoaded(headingFontId)]).then(() => {
      if (!cancelled) {
        measureA4Layout(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bodyFontId, headingFontId, measureA4Layout]);

  useEffect(() => {
    const handleResize = () => measureA4Layout(false);
    const handleBeforePrint = () => measureA4Layout(true);
    const handleAfterPrint = () => measureA4Layout(false);

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measureA4Layout(false);
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [measureA4Layout]);

  const effectiveSingleFit = hasContent && a4FitMode === 'single' && isDesktopSheet;
  const estimatedPages = effectiveSingleFit
    ? 1
    : estimateA4PageCount(naturalHeightPx, targetPageHeightPx);
  const pageCountLabel =
    estimatedPages === 1
      ? 'ورقة A4 واحدة'
      : estimatedPages === 2
        ? 'ورقتان A4'
        : `${estimatedPages} ورقات A4`;

  const scaledContentStyle: React.CSSProperties | undefined =
    effectiveSingleFit && fitScale < 1
      ? {
          width: `${(100 / fitScale).toFixed(4)}%`,
          transform: `scale(${fitScale})`,
          transformOrigin: docLang === 'ar' ? 'top right' : 'top left',
        }
      : undefined;

  const pageBreakGuides =
    hasContent && a4FitMode === 'auto' && isDesktopSheet && estimatedPages > 1
      ? Array.from({ length: estimatedPages - 1 }, (_, idx) => idx + 1)
      : [];

  const themeVars = getDocumentThemeCssVars(
    activePalette,
    templateId,
    bodyFontId,
    headingFontId,
    docLang
  ) as React.CSSProperties;
  const sheetModel = buildSheetModel(data, docType, labels);
  const customFontLabel =
    bodyFontId !== 'auto' || headingFontId !== 'auto'
      ? headingFontId !== 'auto' && headingFontId !== bodyFontId
        ? `${activeHeadingFont.arabicLabel} / ${activeBodyFont.arabicLabel}`
        : activeBodyFont.name
      : null;

  const renderDocumentBody = () => {
    if (docType === 'cover_letter') {
      return (
        <CoverLetterSheet
          data={data}
          docLang={docLang}
          labels={labels}
          templateId={templateId}
        />
      );
    }

    switch (templateId) {
      case 'executive':
        return <ExecutiveTemplateSheet model={sheetModel} labels={labels} />;
      case 'academic':
        return <AcademicClassicSheet model={sheetModel} labels={labels} />;
      case 'modern_band':
        return <ModernBandSheet model={sheetModel} labels={labels} />;
      case 'sidebar':
      default:
        return <SidebarTemplateSheet model={sheetModel} labels={labels} />;
    }
  };

  return (
    <section
      id="print-wrapper"
      aria-label="معاينة المستند"
      className="lg:col-span-7 flex flex-col gap-4"
    >
      {/* Specification & A4 Page Size Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 leading-snug">{spec.title}</h2>
            <div className="flex items-center gap-1.5 flex-wrap text-xs mt-0.5">
              <span
                dir="ltr"
                data-testid="a4-spec-label"
                className="font-mono-num font-semibold text-sky-700 whitespace-nowrap"
              >
                A4 ({A4_WIDTH_MM}×{A4_HEIGHT_MM} mm)
              </span>
              {hasContent && (
                <>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span
                    data-testid="a4-page-count"
                    className="font-semibold text-slate-600 whitespace-nowrap"
                  >
                    {pageCountLabel}
                  </span>
                </>
              )}
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="font-semibold text-slate-500 whitespace-nowrap">
                {activeTemplate.name}
              </span>
              {customFontLabel && (
                <>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span
                    data-testid="active-font-badge"
                    className="font-semibold text-slate-600 whitespace-nowrap"
                  >
                    {customFontLabel}
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{spec.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <div
              role="group"
              aria-label="تخطيط حجم ورقة A4"
              className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
            >
              <button
                type="button"
                data-testid="a4-mode-single"
                aria-pressed={a4FitMode === 'single'}
                onClick={() => onChangeA4FitMode('single')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  a4FitMode === 'single'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ورقة A4 واحدة
              </button>
              <button
                type="button"
                data-testid="a4-mode-auto"
                aria-pressed={a4FitMode === 'auto'}
                onClick={() => onChangeA4FitMode('auto')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  a4FitMode === 'auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                متعدد A4
              </button>
            </div>

            <button
              type="button"
              onClick={onPrint}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>حفظ PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live A4 Paper Sheet (Exact 210mm × 297mm) */}
      <div
        ref={sheetRef}
        id="document-preview"
        data-testid="document-preview"
        data-doc-type={docType}
        data-doc-lang={docLang}
        data-a4-mode={a4FitMode}
        data-a4-scale={fitScale.toFixed(3)}
        data-cv-template={templateId}
        data-cv-palette={paletteId}
        data-cv-font={bodyFontId}
        data-cv-heading-font={headingFontId}
        style={themeVars}
        className={`a4-paper rounded-xl border border-slate-200 ${
          docLang === 'en' ? 'doc-en' : 'doc-ar'
        } ${
          usesSplitBackground ? (docLang === 'en' ? 'a4-split-ltr' : 'a4-split-rtl') : ''
        } ${effectiveSingleFit ? 'a4-fit-single' : ''} ${!hasContent ? '!min-h-[540px]' : ''}`}
      >
        {!hasContent ? (
          <div
            dir="rtl"
            className="min-h-[540px] flex flex-col items-center justify-center px-10 py-20 text-center font-arabic"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
              <FilePlus2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1.5">المستند فارغ حالياً</h3>
            <p className="text-sm text-slate-600 max-w-md mb-5 leading-relaxed">
              {labels.emptyHint}
            </p>
            <button
              type="button"
              onClick={onLoadSample}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {labels.emptyAction}
            </button>
          </div>
        ) : (
          <div ref={contentRef} className="cv-sheet-content" style={scaledContentStyle}>
            {renderDocumentBody()}
          </div>
        )}

        {/* Subtle On-Screen A4 Page Break Guides for Multi-Page Mode (Hidden on Print) */}
        {pageBreakGuides.map((pageNum) => (
          <div
            key={pageNum}
            aria-hidden="true"
            style={{ top: `${pageNum * targetPageHeightPx}px` }}
            className="no-print pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-sky-500/60 flex justify-center"
          >
            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 text-[10px] font-bold rounded-b-md font-arabic shadow-xs">
              نهاية ورقة A4 رقم {pageNum}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
