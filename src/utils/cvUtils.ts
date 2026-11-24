import { getEmptyData, SAMPLE_DATA } from '../data/sampleData';
import type { CVData, DocLang, DocType, DynamicListKey, PhotoShape } from '../types/cv';

export const STORAGE_KEY = 'cv_studio_workspace_v1';
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Standard ISO 216 A4 portrait dimensions (210mm x 297mm at 96 CSS DPI)
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/**
 * Splits a comma-separated string (supporting both English `,` and Arabic `،`)
 * into clean trimmed non-empty tokens.
 */
export function parseCommaList(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Splits multi-line achievements text into clean non-empty bullet strings.
 */
export function parseBullets(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[•\-–*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Returns true if the user has entered any substantive content in their CV.
 */
export function hasDocumentContent(data: CVData): boolean {
  const p = data.personal;
  const cl = data.coverLetter;
  return Boolean(
    p.fullName.trim() ||
      p.email.trim() ||
      p.title.trim() ||
      p.profile.trim() ||
      p.photo.trim() ||
      data.education.length > 0 ||
      data.experience.length > 0 ||
      data.publications.length > 0 ||
      data.research.length > 0 ||
      data.conferences.length > 0 ||
      data.awards.length > 0 ||
      data.certifications.length > 0 ||
      data.skills.length > 0 ||
      cl.intro.trim() ||
      cl.body.trim()
  );
}

/**
 * Immutably reorders an array item up or down by one position.
 */
export function moveItem<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= list.length || targetIndex < 0 || targetIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

/**
 * Produces the concise 1-page Resume projection from full CV data.
 */
export function getResumeSlice(data: CVData) {
  return {
    topExperience: data.experience.slice(0, 3),
    topEducation: data.education.slice(0, 2),
    topSkills: data.skills.slice(0, 10),
    topCertifications: data.certifications.slice(0, 3),
    languages: data.languages,
  };
}

/**
 * Creates a blank template entry for any dynamic CV list.
 */
export function createBlankEntry(listKey: DynamicListKey, idSuffix?: string) {
  const id = `${listKey}-${idSuffix ?? `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`}`;
  switch (listKey) {
    case 'education':
      return { id, degree: '', institution: '', location: '', year: '', details: '' };
    case 'experience':
      return { id, company: '', role: '', location: '', period: '', achievements: '' };
    case 'publications':
      return { id, title: '', journal: '', year: '', coauthors: '' };
    case 'research':
      return { id, title: '', institution: '', role: '', year: '', description: '' };
    case 'conferences':
      return { id, title: '', type: 'Conference', organization: '', year: '', details: '' };
    case 'awards':
      return { id, title: '', issuer: '', year: '' };
    case 'certifications':
      return { id, title: '', issuer: '', year: '' };
  }
}

/**
 * Checks whether the current data matches the untouched built-in sample for a given language.
 */
export function isUntouchedSample(data: CVData, lang: DocLang): boolean {
  return JSON.stringify(data) === JSON.stringify(SAMPLE_DATA[lang]);
}

/**
 * Validates and merges imported JSON into a complete, safe CVData structure.
 */
export function parseImportedCvData(rawJson: string): CVData | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<CVData> | null;
    if (!parsed || typeof parsed !== 'object') return null;

    const empty = getEmptyData();
    const personal: Record<string, unknown> =
      parsed.personal && typeof parsed.personal === 'object'
        ? (parsed.personal as unknown as Record<string, unknown>)
        : {};
    const coverLetter: Record<string, unknown> =
      parsed.coverLetter && typeof parsed.coverLetter === 'object'
        ? (parsed.coverLetter as unknown as Record<string, unknown>)
        : {};

    return {
      personal: {
        fullName: typeof personal.fullName === 'string' ? personal.fullName : '',
        title: typeof personal.title === 'string' ? personal.title : '',
        phone: typeof personal.phone === 'string' ? personal.phone : '',
        email: typeof personal.email === 'string' ? personal.email : '',
        location: typeof personal.location === 'string' ? personal.location : '',
        website: typeof personal.website === 'string' ? personal.website : '',
        profile: typeof personal.profile === 'string' ? personal.profile : '',
        photo:
          typeof personal.photo === 'string' && personal.photo.startsWith('data:image/')
            ? personal.photo
            : '',
        photoShape: (personal.photoShape === 'rounded' ? 'rounded' : 'circle') as PhotoShape,
        photoZoom: clampNumber(personal.photoZoom, 1, 2, 1),
        photoPosX: clampNumber(personal.photoPosX, 0, 100, 50),
        photoPosY: clampNumber(personal.photoPosY, 0, 100, 20),
      },
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        : empty.skills,
      languages: Array.isArray(parsed.languages)
        ? parsed.languages.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        : empty.languages,
      education: Array.isArray(parsed.education) ? parsed.education : empty.education,
      experience: Array.isArray(parsed.experience) ? parsed.experience : empty.experience,
      publications: Array.isArray(parsed.publications) ? parsed.publications : empty.publications,
      research: Array.isArray(parsed.research) ? parsed.research : empty.research,
      conferences: Array.isArray(parsed.conferences) ? parsed.conferences : empty.conferences,
      awards: Array.isArray(parsed.awards) ? parsed.awards : empty.awards,
      certifications: Array.isArray(parsed.certifications)
        ? parsed.certifications
        : empty.certifications,
      coverLetter: {
        date: typeof coverLetter.date === 'string' ? coverLetter.date : '',
        hiringManager: typeof coverLetter.hiringManager === 'string' ? coverLetter.hiringManager : '',
        company: typeof coverLetter.company === 'string' ? coverLetter.company : '',
        targetRole: typeof coverLetter.targetRole === 'string' ? coverLetter.targetRole : '',
        intro: typeof coverLetter.intro === 'string' ? coverLetter.intro : '',
        body: typeof coverLetter.body === 'string' ? coverLetter.body : '',
        closing: typeof coverLetter.closing === 'string' ? coverLetter.closing : '',
      },
    };
  } catch {
    return null;
  }
}

/**
 * Generates a fallback introductory paragraph for the Cover Letter when left blank.
 */
export function buildCoverLetterFallbackIntro(data: CVData, lang: DocLang): string {
  const role = data.coverLetter.targetRole.trim() || data.personal.title.trim();
  const company = data.coverLetter.company.trim();
  const profile = data.personal.profile.trim();

  if (lang === 'en') {
    const lead = `I am writing to express my strong interest in the ${role || 'open'} position at ${company || 'your organization'}.`;
    return profile ? `${lead} ${profile}` : lead;
  }
  const lead = `أتقدم إليكم بهذا الخطاب للتعبير عن اهتمامي الكبير بالتقدم لوظيفة ${role || 'المعلن عنها'} لدى ${company || 'مؤسستكم الموقرة'}.`;
  return profile ? `${lead} ${profile}` : lead;
}

/**
 * Formats the Cover Letter salutation with language-appropriate punctuation
 * and avoids duplicating Arabic honorifics if already included by the user.
 */
export function formatCoverLetterSalutation(
  hiringManager: string,
  dearLabel: string,
  fallback: string,
  lang: DocLang
): string {
  const recipient = hiringManager.trim() || fallback;
  if (lang === 'ar') {
    const startsWithHonorific = /^(السيد|السيدة|الأستاذ|الأستاذة|د\.|أ\.د\.)/.test(recipient);
    const body = startsWithHonorific ? recipient : `${dearLabel} ${recipient}`;
    return `${body}،`;
  }
  return `${dearLabel} ${recipient},`;
}

/**
 * Validates photo MIME type and file size before reading or compressing.
 */
export function validatePhotoFile(file: {
  type: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      error: 'صيغة الصورة غير مدعومة؛ يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.',
    };
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      ok: false,
      error: 'حجم الصورة يتجاوز الحد الأقصى (10 ميجابايت)؛ يرجى اختيار صورة أصغر.',
    };
  }
  return { ok: true };
}

/**
 * Computes proportional output dimensions capped at maxEdge without ever upscaling or cropping.
 */
export function computeProportionalSize(
  width: number,
  height: number,
  maxEdge = 1200
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: maxEdge, height: maxEdge };
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Preserves full framing and high print clarity (up to 1200px longest side at 0.95 quality
 * with high-quality resampling) so faces are never destructively cropped and A4 print looks razor-sharp.
 */
export function resizeImageToDataUrl(file: File, maxEdge = 1200, quality = 0.95): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذّر قراءة ملف الصورة'));
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) {
        reject(new Error('ملف الصورة فارغ'));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('تعذّر معالجة الصورة المختارة'));
      img.onload = () => {
        const { width, height } = computeProportionalSize(img.width, img.height, maxEdge);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Keep PNG lossless if uploaded as PNG and compact, otherwise encode crisp high-quality JPEG
        if (file.type === 'image/png' && file.size <= 350 * 1024 && img.width <= maxEdge && img.height <= maxEdge) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Computes a clean downward scale factor to fit tall CV content onto a single A4 sheet
 * without ever upscaling or shrinking below a readable floor.
 */
export function computeA4FitScale(
  contentHeightPx: number,
  targetHeightPx = A4_HEIGHT_PX,
  minScale = 0.62
): number {
  if (!Number.isFinite(contentHeightPx) || !Number.isFinite(targetHeightPx) || contentHeightPx <= 0 || targetHeightPx <= 0) {
    return 1;
  }
  if (contentHeightPx <= targetHeightPx + 2) {
    return 1;
  }
  const raw = targetHeightPx / contentHeightPx;
  const clamped = Math.max(minScale, Math.min(1, raw));
  return Math.floor(clamped * 1000) / 1000;
}

/**
 * Estimates how many standard A4 portrait sheets the document spans.
 */
export function estimateA4PageCount(
  contentHeightPx: number,
  pageHeightPx = A4_HEIGHT_PX
): number {
  if (!Number.isFinite(contentHeightPx) || !Number.isFinite(pageHeightPx) || contentHeightPx <= 0 || pageHeightPx <= 0) {
    return 1;
  }
  // Allow a small 6px rounding tolerance so a 1-page sheet never reads as 2 pages
  if (contentHeightPx <= pageHeightPx + 6) {
    return 1;
  }
  return Math.max(1, Math.ceil((contentHeightPx - 6) / pageHeightPx));
}

/**
 * Builds a clean, descriptive A4 PDF filename from the user's full name and document type.
 */
export function buildPrintFileName(fullName: string, docType: DocType): string {
  const cleanedName = fullName
    .trim()
    .replace(/[^\p{L}\p{N}\s-]+/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix =
    docType === 'resume' ? 'Resume-A4' : docType === 'cover_letter' ? 'Cover-Letter-A4' : 'CV-A4';

  return cleanedName ? `${cleanedName}-${suffix}` : `CV-Studio-${suffix}`;
}

