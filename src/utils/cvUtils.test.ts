import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCommaList,
  parseBullets,
  hasDocumentContent,
  moveItem,
  getResumeSlice,
  createBlankEntry,
  isUntouchedSample,
  parseImportedCvData,
  buildCoverLetterFallbackIntro,
  formatCoverLetterSalutation,
  validatePhotoFile,
  computeProportionalSize,
  A4_HEIGHT_PX,
  computeA4FitScale,
  estimateA4PageCount,
  buildPrintFileName,
} from './cvUtils';
import { cloneSampleData, getEmptyData } from '../data/sampleData';
import {
  CV_FONTS,
  CV_PALETTES,
  CV_TEMPLATES,
  DEFAULT_FONT_ID,
  DEFAULT_HEADING_FONT_ID,
  DEFAULT_PALETTE_ID,
  DEFAULT_TEMPLATE_ID,
  getDocumentThemeCssVars,
  getFontById,
  getPaletteById,
  getPaletteCssVars,
  getTemplateById,
  isValidFontId,
  isValidPaletteId,
  isValidTemplateId,
  resolveFontStack,
} from '../data/themes';

test('parseCommaList handles English and Arabic commas and trims entries', () => {
  assert.deepEqual(parseCommaList('HACCP, ISO 22000، Python , , LIMS'), [
    'HACCP',
    'ISO 22000',
    'Python',
    'LIMS',
  ]);
  assert.deepEqual(parseCommaList(''), []);
});

test('parseBullets splits lines, strips leading bullet markers, and ignores blanks', () => {
  const input = '• Reduced spoilage by 28%\n\n- Trained 120 staff\nLed ISO audit';
  assert.deepEqual(parseBullets(input), [
    'Reduced spoilage by 28%',
    'Trained 120 staff',
    'Led ISO audit',
  ]);
});

test('hasDocumentContent accurately distinguishes empty vs populated data', () => {
  const empty = getEmptyData();
  assert.equal(hasDocumentContent(empty), false);

  const withName = getEmptyData();
  withName.personal.fullName = 'Dr. Sarah';
  assert.equal(hasDocumentContent(withName), true);

  const withEduOnly = getEmptyData();
  withEduOnly.education.push(createBlankEntry('education', '1') as never);
  assert.equal(hasDocumentContent(withEduOnly), true);
});

test('moveItem reorders items safely without mutating the original array', () => {
  const items = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(items, 1, 'up'), ['b', 'a', 'c']);
  assert.deepEqual(moveItem(items, 1, 'down'), ['a', 'c', 'b']);
  assert.deepEqual(moveItem(items, 0, 'up'), ['a', 'b', 'c']);
  assert.deepEqual(moveItem(items, 2, 'down'), ['a', 'b', 'c']);
  assert.deepEqual(items, ['a', 'b', 'c']);
});

test('getResumeSlice enforces concise 1-page resume caps', () => {
  const sample = cloneSampleData('en');
  sample.experience.push({
    id: 'exp-4',
    company: 'Extra Co',
    role: 'Intern',
    location: 'Cairo',
    period: '2014',
    achievements: 'Assisted lab',
  });
  sample.skills = Array.from({ length: 14 }, (_, i) => `Skill ${i + 1}`);

  const sliced = getResumeSlice(sample);
  assert.equal(sliced.topExperience.length, 3);
  assert.equal(sliced.topEducation.length, 2);
  assert.equal(sliced.topSkills.length, 10);
  assert.equal(sliced.topCertifications.length, 3);
});

test('isUntouchedSample detects unmodified sample data per language', () => {
  const enSample = cloneSampleData('en');
  assert.equal(isUntouchedSample(enSample, 'en'), true);
  assert.equal(isUntouchedSample(enSample, 'ar'), false);

  enSample.personal.fullName = 'Custom Name';
  assert.equal(isUntouchedSample(enSample, 'en'), false);
});

test('parseImportedCvData validates and safely hydrates partial JSON', () => {
  const valid = parseImportedCvData(
    JSON.stringify({
      personal: { fullName: 'Nadia Karim', email: 'nadia@example.com' },
      skills: ['SPSS', '', 42],
    })
  );
  assert.ok(valid);
  assert.equal(valid.personal.fullName, 'Nadia Karim');
  assert.equal(valid.personal.email, 'nadia@example.com');
  assert.deepEqual(valid.skills, ['SPSS']);
  assert.deepEqual(valid.education, []);

  assert.equal(parseImportedCvData('not-valid-json'), null);
  assert.equal(parseImportedCvData('null'), null);
});

test('buildCoverLetterFallbackIntro formats English and Arabic fallbacks', () => {
  const data = getEmptyData();
  data.coverLetter.targetRole = 'Quality Lead';
  data.coverLetter.company = 'Delta Foods';

  assert.match(buildCoverLetterFallbackIntro(data, 'en'), /Quality Lead.*Delta Foods/);
  assert.match(buildCoverLetterFallbackIntro(data, 'ar'), /Quality Lead.*Delta Foods/);
});

test('formatCoverLetterSalutation uses proper punctuation and prevents duplicate Arabic honorifics', () => {
  assert.equal(
    formatCoverLetterSalutation('Hiring Manager', 'Dear', 'Hiring Manager', 'en'),
    'Dear Hiring Manager,'
  );
  assert.equal(
    formatCoverLetterSalutation('مدير التوظيف المحترم', 'السيد/ة', 'مسؤول التوظيف المحترم', 'ar'),
    'السيد/ة مدير التوظيف المحترم،'
  );
  assert.equal(
    formatCoverLetterSalutation('السيد مدير التوظيف', 'السيد/ة', 'مسؤول التوظيف المحترم', 'ar'),
    'السيد مدير التوظيف،'
  );
});

test('validatePhotoFile accepts valid images and rejects unsupported types or oversized files', () => {
  assert.deepEqual(validatePhotoFile({ type: 'image/jpeg', size: 200_000 }), { ok: true });
  assert.deepEqual(validatePhotoFile({ type: 'image/png', size: 1_000_000 }), { ok: true });
  assert.deepEqual(validatePhotoFile({ type: 'image/webp', size: 500_000 }), { ok: true });

  const badType = validatePhotoFile({ type: 'application/pdf', size: 50_000 });
  assert.equal(badType.ok, false);

  const tooBig = validatePhotoFile({ type: 'image/png', size: 11 * 1024 * 1024 });
  assert.equal(tooBig.ok, false);
});

test('computeProportionalSize preserves aspect ratio and never upscales small images', () => {
  assert.deepEqual(computeProportionalSize(800, 1000, 1200), { width: 800, height: 1000 });
  assert.deepEqual(computeProportionalSize(2400, 3600, 1200), { width: 800, height: 1200 });
  assert.deepEqual(computeProportionalSize(3000, 1500, 1200), { width: 1200, height: 600 });
});

test('parseImportedCvData preserves valid data:image photo URLs, clamps framing, and rejects unsafe URLs', () => {
  const validPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
  const hydrated = parseImportedCvData(
    JSON.stringify({
      personal: {
        fullName: 'Test User',
        photo: validPhoto,
        photoShape: 'rounded',
        photoZoom: 1.5,
        photoPosX: 40,
        photoPosY: 15,
      },
    })
  );
  assert.ok(hydrated);
  assert.equal(hydrated.personal.photo, validPhoto);
  assert.equal(hydrated.personal.photoShape, 'rounded');
  assert.equal(hydrated.personal.photoZoom, 1.5);
  assert.equal(hydrated.personal.photoPosX, 40);
  assert.equal(hydrated.personal.photoPosY, 15);

  const unsafe = parseImportedCvData(
    JSON.stringify({
      personal: {
        fullName: 'Test User',
        photo: 'javascript:alert(1)',
        photoShape: 'invalid',
        photoZoom: 99,
        photoPosY: -50,
      },
    })
  );
  assert.ok(unsafe);
  assert.equal(unsafe.personal.photo, '');
  assert.equal(unsafe.personal.photoShape, 'circle');
  assert.equal(unsafe.personal.photoZoom, 2);
  assert.equal(unsafe.personal.photoPosX, 50);
  assert.equal(unsafe.personal.photoPosY, 0);
});

test('computeA4FitScale returns 1 within A4 height and clamps tall content cleanly', () => {
  assert.equal(computeA4FitScale(900, A4_HEIGHT_PX), 1);
  assert.equal(computeA4FitScale(A4_HEIGHT_PX + 2, A4_HEIGHT_PX), 1);

  const scale = computeA4FitScale(1500, A4_HEIGHT_PX);
  assert.ok(scale > 0.7 && scale < 0.76);
  assert.ok(1500 * scale <= A4_HEIGHT_PX);

  // Never shrinks below readable floor
  assert.equal(computeA4FitScale(4000, A4_HEIGHT_PX, 0.62), 0.62);
});

test('estimateA4PageCount counts A4 sheets with small rounding tolerance', () => {
  assert.equal(estimateA4PageCount(800, A4_HEIGHT_PX), 1);
  assert.equal(estimateA4PageCount(A4_HEIGHT_PX + 4, A4_HEIGHT_PX), 1);
  assert.equal(estimateA4PageCount(1500, A4_HEIGHT_PX), 2);
  assert.equal(estimateA4PageCount(2500, A4_HEIGHT_PX), 3);
});

test('buildPrintFileName formats clean A4 filenames for English, Arabic, and empty names', () => {
  assert.equal(buildPrintFileName('Dr. Sarah Al-Mansour', 'cv'), 'Dr-Sarah-Al-Mansour-CV-A4');
  assert.equal(buildPrintFileName('أحمد المنصور', 'resume'), 'أحمد-المنصور-Resume-A4');
  assert.equal(buildPrintFileName('   ', 'cover_letter'), 'CV-Studio-Cover-Letter-A4');
});

test('CV themes preserve original classic slate colors and sidebar template as defaults', () => {
  assert.equal(DEFAULT_TEMPLATE_ID, 'sidebar');
  assert.equal(DEFAULT_PALETTE_ID, 'classic_slate');
  assert.equal(CV_TEMPLATES.length, 4);
  assert.equal(CV_PALETTES.length, 6);

  const defaultPalette = getPaletteById(DEFAULT_PALETTE_ID);
  assert.equal(defaultPalette.primary, '#1e293b');
  assert.equal(defaultPalette.accent, '#0369a1');
  assert.equal(defaultPalette.accentOnDark, '#38bdf8');

  // Invalid persisted IDs safely fall back to defaults
  assert.equal(isValidTemplateId('unknown_layout'), false);
  assert.equal(isValidPaletteId('neon_pink'), false);
  assert.equal(getTemplateById('unknown_layout').id, 'sidebar');
  assert.equal(getPaletteById('neon_pink').id, 'classic_slate');
});

test('getPaletteCssVars switches sidebar background cleanly between dark sidebar and soft modern_band', () => {
  const emerald = getPaletteById('emerald_forest');
  const sidebarVars = getPaletteCssVars(emerald, 'sidebar');
  assert.equal(sidebarVars['--cv-primary'], '#064e3b');
  assert.equal(sidebarVars['--cv-sidebar-bg'], '#064e3b');

  const modernVars = getPaletteCssVars(emerald, 'modern_band');
  assert.equal(modernVars['--cv-primary'], '#064e3b');
  assert.equal(modernVars['--cv-sidebar-bg'], emerald.surfaceTint);
});

test('CV fonts catalog preserves default EN/AR typography and resolves bilingual font stacks', () => {
  assert.equal(DEFAULT_FONT_ID, 'auto');
  assert.equal(DEFAULT_HEADING_FONT_ID, 'auto');
  assert.ok(CV_FONTS.length >= 25);

  assert.equal(isValidFontId('merriweather'), true);
  assert.equal(isValidFontId('amiri'), true);
  assert.equal(isValidFontId('nonexistent_font'), false);
  assert.equal(getFontById('nonexistent_font').id, 'auto');

  // Auto preserves original Plus Jakarta Sans (EN) and Cairo (AR)
  assert.match(resolveFontStack('auto', 'en'), /^'Plus Jakarta Sans'/);
  assert.match(resolveFontStack('auto', 'ar'), /^'Cairo'/);

  // Selected custom fonts include bilingual fallback
  assert.match(resolveFontStack('merriweather', 'en'), /^'Merriweather'.*'Amiri'.*serif$/);
  assert.match(resolveFontStack('amiri', 'ar'), /^'Amiri'.*'Plus Jakarta Sans'.*serif$/);
  assert.match(resolveFontStack('inter', 'en'), /^'Inter'.*'Cairo'.*sans-serif$/);
});

test('getDocumentThemeCssVars combines palette and unified or dual body/heading fonts', () => {
  const palette = getPaletteById('classic_slate');

  // Unified custom font applies to both body and headings
  const unified = getDocumentThemeCssVars(palette, 'sidebar', 'roboto', 'auto', 'en');
  assert.match(unified['--cv-font-body'], /^'Roboto'/);
  assert.match(unified['--cv-font-heading'], /^'Roboto'/);
  assert.equal(unified['--cv-primary'], '#1e293b');

  // Dual pairing applies distinct heading and body fonts
  const paired = getDocumentThemeCssVars(palette, 'executive', 'inter', 'playfair', 'en');
  assert.match(paired['--cv-font-body'], /^'Inter'/);
  assert.match(paired['--cv-font-heading'], /^'Playfair Display'/);
});



